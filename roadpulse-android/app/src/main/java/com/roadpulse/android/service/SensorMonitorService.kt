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
import com.roadpulse.android.data.classifier.EventClassifier
import com.roadpulse.android.data.repository.EventRepository
import com.roadpulse.android.data.model.AccelerometerData
import com.roadpulse.android.data.model.GyroscopeData
import com.roadpulse.android.data.model.SensorData
import com.roadpulse.android.data.model.RoadAnomalyEvent
import com.roadpulse.android.data.processor.MotionState
import com.roadpulse.android.data.processor.SensorDataProcessor
import com.roadpulse.android.data.provider.LocationProvider
import com.roadpulse.android.data.session.SessionManager
import com.roadpulse.android.data.error.ErrorHandler
import com.roadpulse.android.data.error.ErrorRecoveryResult
import com.roadpulse.android.data.error.SensorDataException
import com.roadpulse.android.data.error.SensorUnavailableException
import com.roadpulse.android.data.error.SensorPermissionDeniedException
import com.roadpulse.android.data.error.SensorCalibrationException
import com.roadpulse.android.data.monitor.SystemResourceMonitor
import com.roadpulse.android.data.config.SensorMonitorConfig
import com.roadpulse.android.service.ServiceState
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
        
        // Sampling rates in microseconds - now using config
        private const val DEFAULT_NORMAL_SAMPLING_RATE = 20_000 // 50Hz (1/50 * 1,000,000)
        private const val DEFAULT_REDUCED_SAMPLING_RATE = 100_000 // 10Hz (1/10 * 1,000,000)
        
        // Battery thresholds - now using config
        private const val DEFAULT_BATTERY_PAUSE_THRESHOLD = 15
        private const val DEFAULT_BATTERY_RESUME_THRESHOLD = 20
        
        // Motion detection timing - now using config
        private const val DEFAULT_STATIONARY_TIMEOUT_MS = 10 * 60 * 1000L // 10 minutes
        private const val DEFAULT_SAMPLING_RATE_TRANSITION_DELAY_MS = 2000L // 2 seconds
    }
    
    @Inject
    lateinit var sensorDataProcessor: SensorDataProcessor
    
    @Inject
    lateinit var eventDetector: EventDetector
    
    @Inject
    lateinit var eventClassifier: EventClassifier
    
    @Inject
    lateinit var eventRepository: EventRepository
    
    @Inject
    lateinit var locationProvider: LocationProvider
    
    @Inject
    lateinit var sessionManager: SessionManager
    
    @Inject
    lateinit var errorHandler: ErrorHandler
    
    @Inject
    lateinit var systemResourceMonitor: SystemResourceMonitor
    
    @Inject
    lateinit var config: SensorMonitorConfig
    
    @Inject
    lateinit var controller: SensorMonitorController
    
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
    private var currentSamplingRate = DEFAULT_NORMAL_SAMPLING_RATE
    private var isDegradedMode = false
    private var lastErrorTime = 0L
    private var consecutiveErrors = 0
    
    // Coroutine management
    private val serviceScope = CoroutineScope(ioDispatcher)
    private var monitoringJob: Job? = null
    private var batteryMonitoringJob: Job? = null
    private var adaptiveSamplingJob: Job? = null
    private var resourceMonitoringJob: Job? = null
    private var errorRecoveryJob: Job? = null
    
    // Wake lock for background operation
    private var wakeLock: PowerManager.WakeLock? = null
    
    // Latest sensor data
    private var latestAccelerometerData: AccelerometerData? = null
    private var latestGyroscopeData: GyroscopeData? = null
    private var lastSensorDataTimestamp = 0L
    
    // Event processing statistics
    private var eventsDetected = 0
    private var eventsClassified = 0
    private var eventsStored = 0
    private var lastStatsUpdateTime = 0L
    
    override fun onCreate() {
        super.onCreate()
        
        try {
            // Initialize system services
            sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
            notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
            batteryManager = getSystemService(Context.BATTERY_SERVICE) as BatteryManager
            
            // Initialize sensors with error handling
            initializeSensors()
            
            // Create notification channel
            createNotificationChannel()
            
            // Acquire wake lock for background operation
            wakeLock = powerManager.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "RoadPulse::SensorMonitoring"
            )
        } catch (e: Exception) {
            errorHandler.logError(e, "Service onCreate")
            // Continue with degraded functionality
        }
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
     * Initialize sensors with error handling
     */
    private fun initializeSensors() {
        try {
            accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
            if (accelerometer == null) {
                errorHandler.logError(
                    SensorUnavailableException("accelerometer"),
                    "Sensor initialization"
                )
            }
        } catch (e: Exception) {
            errorHandler.logError(e, "Accelerometer initialization")
        }
        
        try {
            gyroscope = sensorManager.getDefaultSensor(Sensor.TYPE_GYROSCOPE)
            if (gyroscope == null) {
                errorHandler.logError(
                    SensorUnavailableException("gyroscope"),
                    "Sensor initialization"
                )
            }
        } catch (e: Exception) {
            errorHandler.logError(e, "Gyroscope initialization")
        }
    }
    
    /**
     * Start sensor monitoring with comprehensive error handling
     */
    private fun startMonitoring() {
        serviceScope.launch {
            try {
                stateMutex.withLock {
                    if (isMonitoring) return@withLock
                    
                    // Check system resources before starting
                    systemResourceMonitor.checkResourceConstraints()
                    
                    // Start foreground service with notification
                    startForeground(NOTIFICATION_ID, createNotification("Starting sensor monitoring..."))
                    
                    // Acquire wake lock
                    wakeLock?.acquire()
                    
                    // Start session
                    val sessionId = sessionManager.startSession()
                    
                    // Reset event processing statistics for new session
                    resetEventProcessingStats()
                    
                    // Register sensor listeners with error handling
                    registerSensorListenersWithErrorHandling()
                    
                    // Start location provider with error handling
                    startLocationProviderWithErrorHandling()
                    
                    // Start monitoring jobs
                    startMonitoringJobs()
                    
                    isMonitoring = true
                    isPaused = false
                    consecutiveErrors = 0
                    
                    // Notify controller of state change
                    controller.updateServiceState(ServiceState.RUNNING)
                    
                    // Update notification with session info
                    val mode = if (isDegradedMode) " (Degraded Mode)" else ""
                    updateNotification("Monitoring road conditions$mode - Session: ${sessionId.take(8)}")
                }
            } catch (e: SensorDataException) {
                handleStartupError(e)
            } catch (e: Exception) {
                errorHandler.logError(e, "Start monitoring")
                handleStartupError(SensorUnavailableException("Unexpected error during startup", e))
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
                
                // Notify controller of state change
                controller.updateServiceState(ServiceState.STOPPED)
                
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
                
                // Notify controller of state change
                controller.updateServiceState(ServiceState.PAUSED)
                
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
                val sessionId = sessionManager.startSession()
                
                isPaused = false
                
                // Notify controller of state change
                controller.updateServiceState(ServiceState.RUNNING)
                
                // Update notification with session info
                updateNotification("Monitoring resumed - Session: ${sessionId.take(8)}")
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
     * Start background monitoring jobs with error handling
     */
    private fun startMonitoringJobs() {
        // Battery monitoring job
        batteryMonitoringJob = serviceScope.launch {
            while (isMonitoring) {
                try {
                    monitorBatteryLevel()
                    delay(30_000) // Check every 30 seconds
                } catch (e: Exception) {
                    errorHandler.logError(e, "Battery monitoring")
                    delay(60_000) // Longer delay on error
                }
            }
        }
        
        // Adaptive sampling job
        adaptiveSamplingJob = serviceScope.launch {
            try {
                sensorDataProcessor.motionState.collect { motionState ->
                    handleMotionStateChange(motionState)
                }
            } catch (e: Exception) {
                errorHandler.logError(e, "Adaptive sampling")
            }
        }
        
        // Resource monitoring job
        resourceMonitoringJob = serviceScope.launch {
            while (isMonitoring) {
                try {
                    systemResourceMonitor.checkResourceConstraints()
                    delay(60_000) // Check every minute
                } catch (e: SensorDataException) {
                    handleResourceConstraintError(e)
                    delay(120_000) // Longer delay after resource error
                } catch (e: Exception) {
                    errorHandler.logError(e, "Resource monitoring")
                    delay(120_000)
                }
            }
        }
    }
    
    /**
     * Handle startup errors with recovery strategies
     */
    private suspend fun handleStartupError(error: SensorDataException) {
        val recoveryResult = errorHandler.handleSensorError(error)
        
        when (recoveryResult) {
            ErrorRecoveryResult.DEGRADED_MODE -> {
                isDegradedMode = true
                // Continue with limited functionality
                startMonitoringInDegradedMode()
            }
            ErrorRecoveryResult.PAUSE_MONITORING -> {
                pauseMonitoring()
                scheduleErrorRecovery()
            }
            ErrorRecoveryResult.REQUEST_PERMISSION -> {
                updateNotification("Permission required - please check app settings")
                stopMonitoring()
            }
            ErrorRecoveryResult.UNRECOVERABLE -> {
                updateNotification("Critical error - monitoring stopped")
                stopMonitoring()
            }
            else -> {
                // Retry after delay
                scheduleErrorRecovery()
            }
        }
    }
    
    /**
     * Start monitoring in degraded mode with available sensors
     */
    private suspend fun startMonitoringInDegradedMode() {
        stateMutex.withLock {
            // Start foreground service
            startForeground(NOTIFICATION_ID, createNotification("Starting in degraded mode..."))
            
            // Acquire wake lock
            wakeLock?.acquire()
            
            // Start session
            val sessionId = sessionManager.startSession()
            
            // Reset event processing statistics for new session
            resetEventProcessingStats()
            
            // Register only available sensors
            registerAvailableSensors()
            
            // Try to start location provider (may fail gracefully)
            try {
                locationProvider.startLocationUpdates()
            } catch (e: Exception) {
                errorHandler.logError(e, "Location provider in degraded mode")
            }
            
            // Start monitoring jobs
            startMonitoringJobs()
            
            isMonitoring = true
            isPaused = false
            
            updateNotification("Monitoring in degraded mode - Session: ${sessionId.take(8)}")
        }
    }
    
    /**
     * Register sensor listeners with comprehensive error handling
     */
    private fun registerSensorListenersWithErrorHandling() {
        try {
            registerSensorListeners()
        } catch (e: SecurityException) {
            throw SensorPermissionDeniedException("Sensor access", e)
        } catch (e: Exception) {
            throw SensorUnavailableException("sensor registration", e)
        }
    }
    
    /**
     * Start location provider with error handling
     */
    private fun startLocationProviderWithErrorHandling() {
        try {
            locationProvider.startLocationUpdates()
        } catch (e: SecurityException) {
            throw SensorPermissionDeniedException("Location access", e)
        } catch (e: Exception) {
            errorHandler.logError(e, "Location provider startup")
            // Continue without location - events will be discarded
        }
    }
    
    /**
     * Register only available sensors for degraded mode
     */
    private fun registerAvailableSensors() {
        accelerometer?.let { sensor ->
            try {
                sensorManager.registerListener(this, sensor, currentSamplingRate)
            } catch (e: Exception) {
                errorHandler.logError(e, "Accelerometer registration")
            }
        }
        
        gyroscope?.let { sensor ->
            try {
                sensorManager.registerListener(this, sensor, currentSamplingRate)
            } catch (e: Exception) {
                errorHandler.logError(e, "Gyroscope registration")
            }
        }
    }
    
    /**
     * Schedule error recovery attempt
     */
    private fun scheduleErrorRecovery() {
        errorRecoveryJob?.cancel()
        errorRecoveryJob = serviceScope.launch {
            val currentTime = System.currentTimeMillis()
            
            // Implement exponential backoff for recovery attempts
            val timeSinceLastError = currentTime - lastErrorTime
            if (timeSinceLastError < 60000) { // Less than 1 minute
                consecutiveErrors++
            } else {
                consecutiveErrors = 1
            }
            
            lastErrorTime = currentTime
            val delayMs = minOf(1000L * (1 shl consecutiveErrors), 300000L) // Max 5 minutes
            
            delay(delayMs)
            
            // Attempt recovery
            if (!isMonitoring) {
                startMonitoring()
            }
        }
    }
    
    /**
     * Stop all background monitoring jobs with error handling
     */
    private fun stopMonitoringJobs() {
        try {
            monitoringJob?.cancel()
            batteryMonitoringJob?.cancel()
            adaptiveSamplingJob?.cancel()
            resourceMonitoringJob?.cancel()
            errorRecoveryJob?.cancel()
            
            monitoringJob = null
            batteryMonitoringJob = null
            adaptiveSamplingJob = null
            resourceMonitoringJob = null
            errorRecoveryJob = null
        } catch (e: Exception) {
            errorHandler.logError(e, "Stop monitoring jobs")
        }
    }
    
    /**
     * Handle resource constraint errors
     */
    private suspend fun handleResourceConstraintError(error: SensorDataException) {
        val recoveryResult = errorHandler.handleSensorError(error)
        
        when (recoveryResult) {
            ErrorRecoveryResult.REDUCE_MEMORY_USAGE -> {
                // Reduce buffer sizes and processing frequency
                adjustForLowMemory()
            }
            ErrorRecoveryResult.REDUCE_CPU_USAGE -> {
                // Reduce sampling rate temporarily
                adjustSamplingRate(config.reducedSamplingRate)
            }
            ErrorRecoveryResult.PAUSE_MONITORING -> {
                pauseMonitoring()
                scheduleErrorRecovery()
            }
            else -> {
                errorHandler.logError(error, "Resource constraint")
            }
        }
    }
    
    /**
     * Adjust system for low memory conditions
     */
    private fun adjustForLowMemory() {
        // Force garbage collection
        System.gc()
        
        // Clear any cached data
        eventDetector.clearState()
        
        // Update notification
        updateNotification("Monitoring (Low Memory Mode)")
    }
    
    /**
     * Handle sensor data changes with comprehensive error handling
     */
    override fun onSensorChanged(event: SensorEvent?) {
        if (event == null) return
        
        try {
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
                
                // Process data in background with error handling
                serviceScope.launch(defaultDispatcher) {
                    processSensorDataWithErrorHandling(sensorData)
                }
            }
        } catch (e: Exception) {
            errorHandler.logError(e, "Sensor data processing")
            // Continue monitoring despite individual sensor errors
        }
    }
    
    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
        try {
            // Handle sensor accuracy changes
            when (sensor?.type) {
                Sensor.TYPE_ACCELEROMETER -> {
                    if (accuracy == SensorManager.SENSOR_STATUS_UNRELIABLE) {
                        errorHandler.logError(
                            SensorUnavailableException("accelerometer accuracy unreliable"),
                            "Sensor accuracy"
                        )
                    }
                }
                Sensor.TYPE_GYROSCOPE -> {
                    if (accuracy == SensorManager.SENSOR_STATUS_UNRELIABLE) {
                        errorHandler.logError(
                            SensorUnavailableException("gyroscope accuracy unreliable"),
                            "Sensor accuracy"
                        )
                    }
                }
            }
        } catch (e: Exception) {
            errorHandler.logError(e, "Sensor accuracy change")
        }
    }
    
    /**
     * Process sensor data through the processing pipeline with error handling
     */
    private suspend fun processSensorDataWithErrorHandling(sensorData: SensorData) {
        try {
            processSensorData(sensorData)
        } catch (e: Exception) {
            errorHandler.logError(e, "Sensor data processing pipeline")
            // Continue monitoring despite processing errors
        }
    }
    
    /**
     * Process sensor data through the processing pipeline
     */
    private suspend fun processSensorData(sensorData: SensorData) {
        try {
            // Update session activity
            sessionManager.updateActivity()
            
            // Process sensor data (includes automatic calibration monitoring)
            val processedData = sensorDataProcessor.processSensorData(sensorData)
            
            // Check if recalibration is needed and attempt it
            attemptAutomaticRecalibrationIfNeeded()
            
            // Skip processing if device is being handled (Requirements 8.2)
            if (sensorDataProcessor.isDeviceHandling(processedData.gyroscope)) {
                return
            }
            
            // Skip processing if device is not in vehicle orientation (Requirements 8.3)
            if (!sensorDataProcessor.isDeviceInVehicle()) {
                return
            }
            
            // Detect events using original sensor data (EventDetector expects SensorData)
            try {
                eventDetector.detectEvent(sensorData)?.let { detectedEvent ->
                    eventsDetected++
                    
                    // Validate the detected event
                    if (eventDetector.validateEvent(detectedEvent)) {
                        try {
                            // Get current session ID
                            val sessionId = sessionManager.getCurrentSessionId()
                            if (sessionId != null) {
                                // Classify the event
                                val classifiedEvent = eventClassifier.classifyEvent(detectedEvent, sessionId)
                                eventsClassified++
                                
                                // Validate the classified event
                                if (eventClassifier.validateClassifiedEvent(classifiedEvent)) {
                                    try {
                                        // Store the event in the database
                                        val eventId = eventRepository.saveEventIfSessionActive(classifiedEvent)
                                        if (eventId != null) {
                                            eventsStored++
                                            // Successfully stored event
                                            updateEventProcessingStats(classifiedEvent)
                                            // Reset consecutive errors on successful processing
                                            consecutiveErrors = 0
                                        }
                                    } catch (e: Exception) {
                                        handleEventProcessingError(e, "Event Storage")
                                    }
                                }
                            }
                            // If no session is active, the event is discarded (Requirements 6.5)
                        } catch (e: Exception) {
                            handleEventProcessingError(e, "Event Classification")
                        }
                    }
                }
            } catch (e: Exception) {
                handleEventProcessingError(e, "Event Detection")
            }
            
        } catch (e: Exception) {
            errorHandler.logError(e, "Sensor data processing")
            handleEventProcessingError(e, "Sensor Processing")
        }
    }
    
    /**
     * Attempts automatic sensor recalibration if needed
     * Requirements 8.4: Automatic sensor recalibration
     */
    private suspend fun attemptAutomaticRecalibrationIfNeeded() {
        val calibrationStatus = sensorDataProcessor.getCalibrationStatus()
        
        // Attempt calibration if we have enough samples and conditions are right
        if (calibrationStatus.calibrationSampleCount >= 100 || 
            calibrationStatus.calibrationIssueDetected) {
            
            val success = sensorDataProcessor.calibrateSensors()
            
            if (success) {
                updateNotification("Sensors recalibrated successfully")
                // Reset notification after a delay
                serviceScope.launch {
                    delay(5000)
                    val mode = if (isDegradedMode) " (Degraded Mode)" else ""
                    updateNotification("Monitoring road conditions$mode")
                }
            } else if (calibrationStatus.calibrationAttempts >= 3) {
                // Multiple calibration failures - may need user intervention
                updateNotification("Sensor calibration issues detected")
                errorHandler.logError(
                    com.roadpulse.android.data.error.SensorCalibrationException("Multiple calibration failures"),
                    "Automatic recalibration"
                )
            }
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
                isPaused && (isCharging || batteryLevel >= config.batteryResumeThreshold) -> {
                    resumeMonitoring()
                }
                
                // Pause if not charging and battery below pause threshold
                !isPaused && !isCharging && batteryLevel <= config.batteryPauseThreshold -> {
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
            isCharging -> config.normalSamplingRate // Always full rate when charging
            motionState == MotionState.STATIONARY -> config.reducedSamplingRate // Reduced rate when stationary
            else -> config.normalSamplingRate // Normal rate when moving
        }
        
        if (newSamplingRate != currentSamplingRate) {
            // Wait for transition delay
            delay(config.samplingRateTransitionDelayMs)
            
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
    
    /**
     * Update event processing statistics and notification
     */
    private fun updateEventProcessingStats(event: RoadAnomalyEvent) {
        eventsDetected++
        eventsClassified++
        eventsStored++
        
        val currentTime = System.currentTimeMillis()
        
        // Update notification with stats every 30 seconds or every 10 events
        if (currentTime - lastStatsUpdateTime > 30_000 || eventsStored % 10 == 0) {
            lastStatsUpdateTime = currentTime
            val mode = if (isDegradedMode) " (Degraded)" else ""
            val statsText = "Monitoring$mode - ${eventsStored} events detected"
            updateNotification(statsText)
        }
    }
    
    /**
     * Reset event processing statistics
     */
    private fun resetEventProcessingStats() {
        eventsDetected = 0
        eventsClassified = 0
        eventsStored = 0
        lastStatsUpdateTime = 0L
    }
    
    /**
     * Handle errors in the event processing pipeline with proper error propagation
     */
    private suspend fun handleEventProcessingError(error: Exception, stage: String) {
        errorHandler.logError(error, "Event processing - $stage")
        
        // Increment error count for monitoring
        consecutiveErrors++
        
        // If we have too many consecutive errors, consider degraded mode
        if (consecutiveErrors > 10) {
            val recoveryResult = errorHandler.handleSensorError(
                SensorUnavailableException("Too many processing errors", error)
            )
            
            when (recoveryResult) {
                com.roadpulse.android.data.error.ErrorRecoveryResult.DEGRADED_MODE -> {
                    isDegradedMode = true
                    updateNotification("Processing errors - degraded mode")
                }
                com.roadpulse.android.data.error.ErrorRecoveryResult.PAUSE_MONITORING -> {
                    pauseMonitoring()
                    scheduleErrorRecovery()
                }
                else -> {
                    // Continue with current mode
                }
            }
        }
    }
    
    /**
     * Get current service status for monitoring and debugging
     */
    fun getServiceStatus(): ServiceStatus {
        return ServiceStatus(
            isMonitoring = isMonitoring,
            isPaused = isPaused,
            isDegradedMode = isDegradedMode,
            currentSamplingRate = currentSamplingRate,
            eventsDetected = eventsDetected,
            eventsClassified = eventsClassified,
            eventsStored = eventsStored,
            consecutiveErrors = consecutiveErrors,
            hasAccelerometer = accelerometer != null,
            hasGyroscope = gyroscope != null,
            isLocationAvailable = locationProvider.isLocationAvailable()
        )
    }
    
    /**
     * Data class representing the current service status
     */
    data class ServiceStatus(
        val isMonitoring: Boolean,
        val isPaused: Boolean,
        val isDegradedMode: Boolean,
        val currentSamplingRate: Int,
        val eventsDetected: Int,
        val eventsClassified: Int,
        val eventsStored: Int,
        val consecutiveErrors: Int,
        val hasAccelerometer: Boolean,
        val hasGyroscope: Boolean,
        val isLocationAvailable: Boolean
    )
}