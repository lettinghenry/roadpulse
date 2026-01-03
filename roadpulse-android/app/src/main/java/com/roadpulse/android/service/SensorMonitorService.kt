package com.roadpulse.android.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.BatteryManager
import android.os.Build
import android.os.IBinder
import android.os.PowerManager
import androidx.core.app.NotificationCompat
import com.roadpulse.android.MainActivity
import com.roadpulse.android.R
import com.roadpulse.android.data.detector.EventDetector
import com.roadpulse.android.data.model.AccelerometerData
import com.roadpulse.android.data.model.GyroscopeData
import com.roadpulse.android.data.model.SensorData
import com.roadpulse.android.data.processor.MotionState
import com.roadpulse.android.data.processor.SensorDataProcessor
import com.roadpulse.android.data.provider.LocationProvider
import com.roadpulse.android.data.session.SessionManager
import com.roadpulse.android.di.DefaultDispatcher
import com.roadpulse.android.di.IoDispatcher
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import javax.inject.Inject

/**
 * Foreground service for continuous sensor monitoring.
 * Implements Requirements 1.4 (autonomous operation) and 1.5 (background persistence).
 */
@AndroidEntryPoint
class SensorMonitorService : Service(), SensorEventListener {
    
    companion object {
        const val ACTION_START_MONITORING = "START_MONITORING"
        const val ACTION_STOP_MONITORING = "STOP_MONITORING"
        const val ACTION_PAUSE_MONITORING = "PAUSE_MONITORING"
        const val ACTION_RESUME_MONITORING = "RESUME_MONITORING"
        
        private const val NOTIFICATION_ID = 1001
        private const val CHANNEL_ID = "sensor_monitoring_channel"
        private const val CHANNEL_NAME = "Sensor Monitoring"
        
        // Sampling rates in microseconds
        private const val NORMAL_SAMPLING_RATE = 20_000 // 50Hz (1/50 * 1,000,000)
        private const val REDUCED_SAMPLING_RATE = 100_000 // 10Hz (1/10 * 1,000,000)
        
        // Battery thresholds
        private const val BATTERY_PAUSE_THRESHOLD = 15
        private const val BATTERY_RESUME_THRESHOLD = 20
        
        // Motion detection timing
        private const val STATIONARY_TIMEOUT_MS = 10 * 60 * 1000L // 10 minutes
        private const val SAMPLING_RATE_TRANSITION_DELAY_MS = 2000L // 2 seconds
    }
    
    @Inject
    lateinit var sensorDataProcessor: SensorDataProcessor
    
    @Inject
    lateinit var eventDetector: EventDetector
    
    @Inject
    lateinit var locationProvider: LocationProvider
    
    @Inject
    lateinit var sessionManager: SessionManager
    
    @Inject
    @IoDispatcher
    lateinit var ioDispatcher: CoroutineDispatcher
    
    @Inject
    @DefaultDispatcher
    lateinit var defaultDispatcher: CoroutineDispatcher
    
    // Android system services
    private lateinit var sensorManager: SensorManager
    private lateinit var notificationManager: NotificationManager
    private lateinit var powerManager: PowerManager
    private lateinit var batteryManager: BatteryManager
    
    // Sensors
    private var accelerometer: Sensor? = null
    private var gyroscope: Sensor? = null
    
    // Service state
    private val stateMutex = Mutex()
    private var isMonitoring = false
    private var isPaused = false
    private var currentSamplingRate = NORMAL_SAMPLING_RATE
    
    // Coroutine management
    private val serviceScope = CoroutineScope(ioDispatcher)
    private var monitoringJob: Job? = null
    private var batteryMonitoringJob: Job? = null
    private var adaptiveSamplingJob: Job? = null
    
    // Wake lock for background operation
    private var wakeLock: PowerManager.WakeLock? = null
    
    // Latest sensor data
    private var latestAccelerometerData: AccelerometerData? = null
    private var latestGyroscopeData: GyroscopeData? = null
    private var lastSensorDataTimestamp = 0L
    
    override fun onCreate() {
        super.onCreate()
        
        // Initialize system services
        sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
        notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
        batteryManager = getSystemService(Context.BATTERY_SERVICE) as BatteryManager
        
        // Initialize sensors
        accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
        gyroscope = sensorManager.getDefaultSensor(Sensor.TYPE_GYROSCOPE)
        
        // Create notification channel
        createNotificationChannel()
        
        // Acquire wake lock for background operation
        wakeLock = powerManager.newWakeLock(
            PowerManager.PARTIAL_WAKE_LOCK,
            "RoadPulse::SensorMonitoring"
        )
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START_MONITORING -> startMonitoring()
            ACTION_STOP_MONITORING -> stopMonitoring()
            ACTION_PAUSE_MONITORING -> pauseMonitoring()
            ACTION_RESUME_MONITORING -> resumeMonitoring()
            else -> startMonitoring() // Default action
        }
        
        return START_STICKY // Restart service if killed by system
    }
    
    override fun onBind(intent: Intent?): IBinder? {
        return null // This is a started service, not bound
    }
    
    override fun onDestroy() {
        super.onDestroy()
        stopMonitoring()
        wakeLock?.release()
    }
    
    /**
     * Start sensor monitoring with foreground service
     */
    private fun startMonitoring() {
        serviceScope.launch {
            stateMutex.withLock {
                if (isMonitoring) return@withLock
                
                // Start foreground service with notification
                startForeground(NOTIFICATION_ID, createNotification("Starting sensor monitoring..."))
                
                // Acquire wake lock
                wakeLock?.acquire()
                
                // Start session
                sessionManager.startSession()
                
                // Register sensor listeners
                registerSensorListeners()
                
                // Start location provider
                locationProvider.startLocationUpdates()
                
                // Start monitoring jobs
                startMonitoringJobs()
                
                isMonitoring = true
                isPaused = false
                
                // Update notification
                updateNotification("Monitoring road conditions")
            }
        }
    }
    
    /**
     * Stop sensor monitoring and end foreground service
     */
    private fun stopMonitoring() {
        serviceScope.launch {
            stateMutex.withLock {
                if (!isMonitoring) return@withLock
                
                // Stop monitoring jobs
                stopMonitoringJobs()
                
                // Unregister sensor listeners
                unregisterSensorListeners()
                
                // Stop location provider
                locationProvider.stopLocationUpdates()
                
                // End session
                sessionManager.endSession()
                
                // Release wake lock
                wakeLock?.release()
                
                isMonitoring = false
                isPaused = false
                
                // Stop foreground service
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
        }
    }
    
    /**
     * Pause sensor monitoring while keeping service alive
     */
    private fun pauseMonitoring() {
        serviceScope.launch {
            stateMutex.withLock {
                if (!isMonitoring || isPaused) return@withLock
                
                // Unregister sensor listeners but keep service running
                unregisterSensorListeners()
                locationProvider.stopLocationUpdates()
                
                isPaused = true
                
                // Update notification
                updateNotification("Monitoring paused")
            }
        }
    }
    
    /**
     * Resume sensor monitoring from paused state
     */
    private fun resumeMonitoring() {
        serviceScope.launch {
            stateMutex.withLock {
                if (!isMonitoring || !isPaused) return@withLock
                
                // Re-register sensor listeners
                registerSensorListeners()
                locationProvider.startLocationUpdates()
                
                // Start new session
                sessionManager.startSession()
                
                isPaused = false
                
                // Update notification
                updateNotification("Monitoring road conditions")
            }
        }
    }
    
    /**
     * Register sensor listeners with current sampling rate
     */
    private fun registerSensorListeners() {
        accelerometer?.let { sensor ->
            sensorManager.registerListener(this, sensor, currentSamplingRate)
        }
        
        gyroscope?.let { sensor ->
            sensorManager.registerListener(this, sensor, currentSamplingRate)
        }
    }
    
    /**
     * Unregister all sensor listeners
     */
    private fun unregisterSensorListeners() {
        sensorManager.unregisterListener(this)
    }
    
    /**
     * Start background monitoring jobs
     */
    private fun startMonitoringJobs() {
        // Battery monitoring job
        batteryMonitoringJob = serviceScope.launch {
            while (isMonitoring) {
                monitorBatteryLevel()
                delay(30_000) // Check every 30 seconds
            }
        }
        
        // Adaptive sampling job
        adaptiveSamplingJob = serviceScope.launch {
            sensorDataProcessor.motionState.collect { motionState ->
                handleMotionStateChange(motionState)
            }
        }
    }
    
    /**
     * Stop all background monitoring jobs
     */
    private fun stopMonitoringJobs() {
        monitoringJob?.cancel()
        batteryMonitoringJob?.cancel()
        adaptiveSamplingJob?.cancel()
        
        monitoringJob = null
        batteryMonitoringJob = null
        adaptiveSamplingJob = null
    }
    
    /**
     * Handle sensor data changes
     */
    override fun onSensorChanged(event: SensorEvent?) {
        event ?: return
        
        val timestamp = System.currentTimeMillis()
        
        when (event.sensor.type) {
            Sensor.TYPE_ACCELEROMETER -> {
                latestAccelerometerData = AccelerometerData(
                    x = event.values[0],
                    y = event.values[1],
                    z = event.values[2],
                    accuracy = event.accuracy
                )
            }
            
            Sensor.TYPE_GYROSCOPE -> {
                latestGyroscopeData = GyroscopeData(
                    x = event.values[0],
                    y = event.values[1],
                    z = event.values[2],
                    accuracy = event.accuracy
                )
            }
        }
        
        // Process sensor data when we have both accelerometer and gyroscope data
        val accelData = latestAccelerometerData
        val gyroData = latestGyroscopeData
        
        if (accelData != null && gyroData != null && 
            timestamp - lastSensorDataTimestamp > 10) { // Throttle to ~100Hz max
            
            lastSensorDataTimestamp = timestamp
            
            // Create sensor data object
            val sensorData = SensorData(
                timestamp = timestamp,
                accelerometer = accelData,
                gyroscope = gyroData,
                location = locationProvider.getCurrentLocation()
            )
            
            // Process data in background
            serviceScope.launch(defaultDispatcher) {
                processSensorData(sensorData)
            }
        }
    }
    
    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
        // Handle sensor accuracy changes if needed
        // For now, we'll just log the change
    }
    
    /**
     * Process sensor data through the processing pipeline
     */
    private suspend fun processSensorData(sensorData: SensorData) {
        try {
            // Update session activity
            sessionManager.updateActivity()
            
            // Process sensor data
            val processedData = sensorDataProcessor.processSensorData(sensorData)
            
            // Skip processing if device is being handled (Requirements 8.2)
            if (sensorDataProcessor.isDeviceHandling(processedData.gyroscope)) {
                return
            }
            
            // Skip processing if device is not in vehicle orientation (Requirements 8.3)
            if (!sensorDataProcessor.isDeviceInVehicle()) {
                return
            }
            
            // Detect events using original sensor data (EventDetector expects SensorData)
            eventDetector.detectEvent(sensorData)?.let { detectedEvent ->
                // Event detection and storage will be handled by EventDetector
                // which is already implemented in previous tasks
            }
            
        } catch (e: Exception) {
            // Log error but continue monitoring
            // In a production app, you'd want proper logging here
        }
    }
    
    /**
     * Monitor battery level and pause/resume monitoring accordingly
     * Requirements 7.4, 7.5: Battery level data collection control
     */
    private suspend fun monitorBatteryLevel() {
        val batteryLevel = getBatteryLevel()
        val isCharging = isDeviceCharging()
        
        stateMutex.withLock {
            when {
                // Resume if charging or battery above resume threshold
                isPaused && (isCharging || batteryLevel >= BATTERY_RESUME_THRESHOLD) -> {
                    resumeMonitoring()
                }
                
                // Pause if not charging and battery below pause threshold
                !isPaused && !isCharging && batteryLevel <= BATTERY_PAUSE_THRESHOLD -> {
                    pauseMonitoring()
                }
            }
        }
    }
    
    /**
     * Handle motion state changes for adaptive sampling
     * Requirements 7.1, 7.2, 7.3: Adaptive sampling rate management
     */
    private suspend fun handleMotionStateChange(motionState: MotionState) {
        val isCharging = isDeviceCharging()
        
        val newSamplingRate = when {
            isCharging -> NORMAL_SAMPLING_RATE // Always full rate when charging
            motionState == MotionState.STATIONARY -> REDUCED_SAMPLING_RATE // 10Hz when stationary
            else -> NORMAL_SAMPLING_RATE // 50Hz when moving
        }
        
        if (newSamplingRate != currentSamplingRate) {
            // Wait for transition delay (2 seconds)
            delay(SAMPLING_RATE_TRANSITION_DELAY_MS)
            
            // Update sampling rate
            adjustSamplingRate(newSamplingRate)
        }
    }
    
    /**
     * Adjust sensor sampling rate
     */
    private suspend fun adjustSamplingRate(newRate: Int) {
        stateMutex.withLock {
            if (!isMonitoring || isPaused) return@withLock
            
            currentSamplingRate = newRate
            
            // Re-register sensors with new rate
            unregisterSensorListeners()
            registerSensorListeners()
            
            // Update notification with current rate
            val rateHz = 1_000_000 / newRate
            updateNotification("Monitoring at ${rateHz}Hz")
        }
    }
    
    /**
     * Get current battery level as percentage
     */
    private fun getBatteryLevel(): Int {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
        } else {
            // Fallback for older Android versions
            50 // Assume 50% if we can't determine
        }
    }
    
    /**
     * Check if device is currently charging
     */
    private fun isDeviceCharging(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            batteryManager.isCharging
        } else {
            // Fallback for older Android versions
            false
        }
    }
    
    /**
     * Create notification channel for foreground service
     */
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Notifications for road condition monitoring"
                setShowBadge(false)
            }
            
            notificationManager.createNotificationChannel(channel)
        }
    }
    
    /**
     * Create notification for foreground service
     */
    private fun createNotification(contentText: String): Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("RoadPulse Monitoring")
            .setContentText(contentText)
            .setSmallIcon(R.drawable.ic_notification) // You'll need to add this icon
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .setForegroundServiceBehavior(NotificationCompat.FOREGROUND_SERVICE_IMMEDIATE)
            .build()
    }
    
    /**
     * Update the foreground notification
     */
    private fun updateNotification(contentText: String) {
        val notification = createNotification(contentText)
        notificationManager.notify(NOTIFICATION_ID, notification)
    }
}