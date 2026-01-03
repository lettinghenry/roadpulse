package com.roadpulse.android.service;

/**
 * Foreground service for continuous sensor monitoring.
 * Implements Requirements 1.4 (autonomous operation) and 1.5 (background persistence).
 */
@dagger.hilt.android.AndroidEntryPoint
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u00cc\u0001\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\b\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0006\n\u0002\u0018\u0002\n\u0002\b\n\n\u0002\u0010\u000b\n\u0002\b\u0002\n\u0002\u0010\t\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0006\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0005\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0005\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0002\b\b\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0004\n\u0002\u0018\u0002\n\u0002\b\u0006\n\u0002\u0018\u0002\n\u0002\b\u000b\b\u0007\u0018\u0000 t2\u00020\u00012\u00020\u0002:\u0001tB\u0005\u00a2\u0006\u0002\u0010\u0003J\u0016\u0010G\u001a\u00020H2\u0006\u0010I\u001a\u00020\fH\u0082@\u00a2\u0006\u0002\u0010JJ\u0010\u0010K\u001a\u00020L2\u0006\u0010M\u001a\u00020NH\u0002J\b\u0010O\u001a\u00020HH\u0002J\b\u0010P\u001a\u00020\fH\u0002J\u0016\u0010Q\u001a\u00020H2\u0006\u0010R\u001a\u00020SH\u0082@\u00a2\u0006\u0002\u0010TJ\b\u0010U\u001a\u00020 H\u0002J\u000e\u0010V\u001a\u00020HH\u0082@\u00a2\u0006\u0002\u0010WJ\u001a\u0010X\u001a\u00020H2\b\u0010Y\u001a\u0004\u0018\u00010\u00052\u0006\u0010Z\u001a\u00020\fH\u0016J\u0014\u0010[\u001a\u0004\u0018\u00010\\2\b\u0010]\u001a\u0004\u0018\u00010^H\u0016J\b\u0010_\u001a\u00020HH\u0016J\b\u0010`\u001a\u00020HH\u0016J\u0012\u0010a\u001a\u00020H2\b\u0010b\u001a\u0004\u0018\u00010cH\u0016J\"\u0010d\u001a\u00020\f2\b\u0010]\u001a\u0004\u0018\u00010^2\u0006\u0010e\u001a\u00020\f2\u0006\u0010f\u001a\u00020\fH\u0016J\b\u0010g\u001a\u00020HH\u0002J\u0016\u0010h\u001a\u00020H2\u0006\u0010i\u001a\u00020jH\u0082@\u00a2\u0006\u0002\u0010kJ\b\u0010l\u001a\u00020HH\u0002J\b\u0010m\u001a\u00020HH\u0002J\b\u0010n\u001a\u00020HH\u0002J\b\u0010o\u001a\u00020HH\u0002J\b\u0010p\u001a\u00020HH\u0002J\b\u0010q\u001a\u00020HH\u0002J\b\u0010r\u001a\u00020HH\u0002J\u0010\u0010s\u001a\u00020H2\u0006\u0010M\u001a\u00020NH\u0002R\u0010\u0010\u0004\u001a\u0004\u0018\u00010\u0005X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010\u0006\u001a\u0004\u0018\u00010\u0007X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\b\u001a\u00020\tX\u0082.\u00a2\u0006\u0002\n\u0000R\u0010\u0010\n\u001a\u0004\u0018\u00010\u0007X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u000b\u001a\u00020\fX\u0082\u000e\u00a2\u0006\u0002\n\u0000R$\u0010\r\u001a\u00020\u000e8\u0006@\u0006X\u0087.\u00a2\u0006\u0014\n\u0000\u0012\u0004\b\u000f\u0010\u0003\u001a\u0004\b\u0010\u0010\u0011\"\u0004\b\u0012\u0010\u0013R\u001e\u0010\u0014\u001a\u00020\u00158\u0006@\u0006X\u0087.\u00a2\u0006\u000e\n\u0000\u001a\u0004\b\u0016\u0010\u0017\"\u0004\b\u0018\u0010\u0019R\u0010\u0010\u001a\u001a\u0004\u0018\u00010\u0005X\u0082\u000e\u00a2\u0006\u0002\n\u0000R$\u0010\u001b\u001a\u00020\u000e8\u0006@\u0006X\u0087.\u00a2\u0006\u0014\n\u0000\u0012\u0004\b\u001c\u0010\u0003\u001a\u0004\b\u001d\u0010\u0011\"\u0004\b\u001e\u0010\u0013R\u000e\u0010\u001f\u001a\u00020 X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010!\u001a\u00020 X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\"\u001a\u00020#X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010$\u001a\u0004\u0018\u00010%X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010&\u001a\u0004\u0018\u00010\'X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u001e\u0010(\u001a\u00020)8\u0006@\u0006X\u0087.\u00a2\u0006\u000e\n\u0000\u001a\u0004\b*\u0010+\"\u0004\b,\u0010-R\u0010\u0010.\u001a\u0004\u0018\u00010\u0007X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010/\u001a\u000200X\u0082.\u00a2\u0006\u0002\n\u0000R\u000e\u00101\u001a\u000202X\u0082.\u00a2\u0006\u0002\n\u0000R\u001e\u00103\u001a\u0002048\u0006@\u0006X\u0087.\u00a2\u0006\u000e\n\u0000\u001a\u0004\b5\u00106\"\u0004\b7\u00108R\u000e\u00109\u001a\u00020:X\u0082.\u00a2\u0006\u0002\n\u0000R\u000e\u0010;\u001a\u00020<X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u001e\u0010=\u001a\u00020>8\u0006@\u0006X\u0087.\u00a2\u0006\u000e\n\u0000\u001a\u0004\b?\u0010@\"\u0004\bA\u0010BR\u000e\u0010C\u001a\u00020DX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0014\u0010E\u001a\b\u0018\u00010FR\u000202X\u0082\u000e\u00a2\u0006\u0002\n\u0000\u00a8\u0006u"}, d2 = {"Lcom/roadpulse/android/service/SensorMonitorService;", "Landroid/app/Service;", "Landroid/hardware/SensorEventListener;", "()V", "accelerometer", "Landroid/hardware/Sensor;", "adaptiveSamplingJob", "Lkotlinx/coroutines/Job;", "batteryManager", "Landroid/os/BatteryManager;", "batteryMonitoringJob", "currentSamplingRate", "", "defaultDispatcher", "Lkotlinx/coroutines/CoroutineDispatcher;", "getDefaultDispatcher$annotations", "getDefaultDispatcher", "()Lkotlinx/coroutines/CoroutineDispatcher;", "setDefaultDispatcher", "(Lkotlinx/coroutines/CoroutineDispatcher;)V", "eventDetector", "Lcom/roadpulse/android/data/detector/EventDetector;", "getEventDetector", "()Lcom/roadpulse/android/data/detector/EventDetector;", "setEventDetector", "(Lcom/roadpulse/android/data/detector/EventDetector;)V", "gyroscope", "ioDispatcher", "getIoDispatcher$annotations", "getIoDispatcher", "setIoDispatcher", "isMonitoring", "", "isPaused", "lastSensorDataTimestamp", "", "latestAccelerometerData", "Lcom/roadpulse/android/data/model/AccelerometerData;", "latestGyroscopeData", "Lcom/roadpulse/android/data/model/GyroscopeData;", "locationProvider", "Lcom/roadpulse/android/data/provider/LocationProvider;", "getLocationProvider", "()Lcom/roadpulse/android/data/provider/LocationProvider;", "setLocationProvider", "(Lcom/roadpulse/android/data/provider/LocationProvider;)V", "monitoringJob", "notificationManager", "Landroid/app/NotificationManager;", "powerManager", "Landroid/os/PowerManager;", "sensorDataProcessor", "Lcom/roadpulse/android/data/processor/SensorDataProcessor;", "getSensorDataProcessor", "()Lcom/roadpulse/android/data/processor/SensorDataProcessor;", "setSensorDataProcessor", "(Lcom/roadpulse/android/data/processor/SensorDataProcessor;)V", "sensorManager", "Landroid/hardware/SensorManager;", "serviceScope", "Lkotlinx/coroutines/CoroutineScope;", "sessionManager", "Lcom/roadpulse/android/data/session/SessionManager;", "getSessionManager", "()Lcom/roadpulse/android/data/session/SessionManager;", "setSessionManager", "(Lcom/roadpulse/android/data/session/SessionManager;)V", "stateMutex", "Lkotlinx/coroutines/sync/Mutex;", "wakeLock", "Landroid/os/PowerManager$WakeLock;", "adjustSamplingRate", "", "newRate", "(ILkotlin/coroutines/Continuation;)Ljava/lang/Object;", "createNotification", "Landroid/app/Notification;", "contentText", "", "createNotificationChannel", "getBatteryLevel", "handleMotionStateChange", "motionState", "Lcom/roadpulse/android/data/processor/MotionState;", "(Lcom/roadpulse/android/data/processor/MotionState;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "isDeviceCharging", "monitorBatteryLevel", "(Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "onAccuracyChanged", "sensor", "accuracy", "onBind", "Landroid/os/IBinder;", "intent", "Landroid/content/Intent;", "onCreate", "onDestroy", "onSensorChanged", "event", "Landroid/hardware/SensorEvent;", "onStartCommand", "flags", "startId", "pauseMonitoring", "processSensorData", "sensorData", "Lcom/roadpulse/android/data/model/SensorData;", "(Lcom/roadpulse/android/data/model/SensorData;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "registerSensorListeners", "resumeMonitoring", "startMonitoring", "startMonitoringJobs", "stopMonitoring", "stopMonitoringJobs", "unregisterSensorListeners", "updateNotification", "Companion", "app_debug"})
public final class SensorMonitorService extends android.app.Service implements android.hardware.SensorEventListener {
    @org.jetbrains.annotations.NotNull
    public static final java.lang.String ACTION_START_MONITORING = "START_MONITORING";
    @org.jetbrains.annotations.NotNull
    public static final java.lang.String ACTION_STOP_MONITORING = "STOP_MONITORING";
    @org.jetbrains.annotations.NotNull
    public static final java.lang.String ACTION_PAUSE_MONITORING = "PAUSE_MONITORING";
    @org.jetbrains.annotations.NotNull
    public static final java.lang.String ACTION_RESUME_MONITORING = "RESUME_MONITORING";
    private static final int NOTIFICATION_ID = 1001;
    @org.jetbrains.annotations.NotNull
    private static final java.lang.String CHANNEL_ID = "sensor_monitoring_channel";
    @org.jetbrains.annotations.NotNull
    private static final java.lang.String CHANNEL_NAME = "Sensor Monitoring";
    private static final int NORMAL_SAMPLING_RATE = 20000;
    private static final int REDUCED_SAMPLING_RATE = 100000;
    private static final int BATTERY_PAUSE_THRESHOLD = 15;
    private static final int BATTERY_RESUME_THRESHOLD = 20;
    private static final long STATIONARY_TIMEOUT_MS = 600000L;
    private static final long SAMPLING_RATE_TRANSITION_DELAY_MS = 2000L;
    @javax.inject.Inject
    public com.roadpulse.android.data.processor.SensorDataProcessor sensorDataProcessor;
    @javax.inject.Inject
    public com.roadpulse.android.data.detector.EventDetector eventDetector;
    @javax.inject.Inject
    public com.roadpulse.android.data.provider.LocationProvider locationProvider;
    @javax.inject.Inject
    public com.roadpulse.android.data.session.SessionManager sessionManager;
    @javax.inject.Inject
    public kotlinx.coroutines.CoroutineDispatcher ioDispatcher;
    @javax.inject.Inject
    public kotlinx.coroutines.CoroutineDispatcher defaultDispatcher;
    private android.hardware.SensorManager sensorManager;
    private android.app.NotificationManager notificationManager;
    private android.os.PowerManager powerManager;
    private android.os.BatteryManager batteryManager;
    @org.jetbrains.annotations.Nullable
    private android.hardware.Sensor accelerometer;
    @org.jetbrains.annotations.Nullable
    private android.hardware.Sensor gyroscope;
    @org.jetbrains.annotations.NotNull
    private final kotlinx.coroutines.sync.Mutex stateMutex = null;
    private boolean isMonitoring = false;
    private boolean isPaused = false;
    private int currentSamplingRate = 20000;
    @org.jetbrains.annotations.NotNull
    private final kotlinx.coroutines.CoroutineScope serviceScope = null;
    @org.jetbrains.annotations.Nullable
    private kotlinx.coroutines.Job monitoringJob;
    @org.jetbrains.annotations.Nullable
    private kotlinx.coroutines.Job batteryMonitoringJob;
    @org.jetbrains.annotations.Nullable
    private kotlinx.coroutines.Job adaptiveSamplingJob;
    @org.jetbrains.annotations.Nullable
    private android.os.PowerManager.WakeLock wakeLock;
    @org.jetbrains.annotations.Nullable
    private com.roadpulse.android.data.model.AccelerometerData latestAccelerometerData;
    @org.jetbrains.annotations.Nullable
    private com.roadpulse.android.data.model.GyroscopeData latestGyroscopeData;
    private long lastSensorDataTimestamp = 0L;
    @org.jetbrains.annotations.NotNull
    public static final com.roadpulse.android.service.SensorMonitorService.Companion Companion = null;
    
    public SensorMonitorService() {
        super();
    }
    
    @org.jetbrains.annotations.NotNull
    public final com.roadpulse.android.data.processor.SensorDataProcessor getSensorDataProcessor() {
        return null;
    }
    
    public final void setSensorDataProcessor(@org.jetbrains.annotations.NotNull
    com.roadpulse.android.data.processor.SensorDataProcessor p0) {
    }
    
    @org.jetbrains.annotations.NotNull
    public final com.roadpulse.android.data.detector.EventDetector getEventDetector() {
        return null;
    }
    
    public final void setEventDetector(@org.jetbrains.annotations.NotNull
    com.roadpulse.android.data.detector.EventDetector p0) {
    }
    
    @org.jetbrains.annotations.NotNull
    public final com.roadpulse.android.data.provider.LocationProvider getLocationProvider() {
        return null;
    }
    
    public final void setLocationProvider(@org.jetbrains.annotations.NotNull
    com.roadpulse.android.data.provider.LocationProvider p0) {
    }
    
    @org.jetbrains.annotations.NotNull
    public final com.roadpulse.android.data.session.SessionManager getSessionManager() {
        return null;
    }
    
    public final void setSessionManager(@org.jetbrains.annotations.NotNull
    com.roadpulse.android.data.session.SessionManager p0) {
    }
    
    @org.jetbrains.annotations.NotNull
    public final kotlinx.coroutines.CoroutineDispatcher getIoDispatcher() {
        return null;
    }
    
    @com.roadpulse.android.di.IoDispatcher
    @java.lang.Deprecated
    public static void getIoDispatcher$annotations() {
    }
    
    public final void setIoDispatcher(@org.jetbrains.annotations.NotNull
    kotlinx.coroutines.CoroutineDispatcher p0) {
    }
    
    @org.jetbrains.annotations.NotNull
    public final kotlinx.coroutines.CoroutineDispatcher getDefaultDispatcher() {
        return null;
    }
    
    @com.roadpulse.android.di.DefaultDispatcher
    @java.lang.Deprecated
    public static void getDefaultDispatcher$annotations() {
    }
    
    public final void setDefaultDispatcher(@org.jetbrains.annotations.NotNull
    kotlinx.coroutines.CoroutineDispatcher p0) {
    }
    
    @java.lang.Override
    public void onCreate() {
    }
    
    @java.lang.Override
    public int onStartCommand(@org.jetbrains.annotations.Nullable
    android.content.Intent intent, int flags, int startId) {
        return 0;
    }
    
    @java.lang.Override
    @org.jetbrains.annotations.Nullable
    public android.os.IBinder onBind(@org.jetbrains.annotations.Nullable
    android.content.Intent intent) {
        return null;
    }
    
    @java.lang.Override
    public void onDestroy() {
    }
    
    /**
     * Start sensor monitoring with foreground service
     */
    private final void startMonitoring() {
    }
    
    /**
     * Stop sensor monitoring and end foreground service
     */
    private final void stopMonitoring() {
    }
    
    /**
     * Pause sensor monitoring while keeping service alive
     */
    private final void pauseMonitoring() {
    }
    
    /**
     * Resume sensor monitoring from paused state
     */
    private final void resumeMonitoring() {
    }
    
    /**
     * Register sensor listeners with current sampling rate
     */
    private final void registerSensorListeners() {
    }
    
    /**
     * Unregister all sensor listeners
     */
    private final void unregisterSensorListeners() {
    }
    
    /**
     * Start background monitoring jobs
     */
    private final void startMonitoringJobs() {
    }
    
    /**
     * Stop all background monitoring jobs
     */
    private final void stopMonitoringJobs() {
    }
    
    /**
     * Handle sensor data changes
     */
    @java.lang.Override
    public void onSensorChanged(@org.jetbrains.annotations.Nullable
    android.hardware.SensorEvent event) {
    }
    
    @java.lang.Override
    public void onAccuracyChanged(@org.jetbrains.annotations.Nullable
    android.hardware.Sensor sensor, int accuracy) {
    }
    
    /**
     * Process sensor data through the processing pipeline
     */
    private final java.lang.Object processSensorData(com.roadpulse.android.data.model.SensorData sensorData, kotlin.coroutines.Continuation<? super kotlin.Unit> $completion) {
        return null;
    }
    
    /**
     * Monitor battery level and pause/resume monitoring accordingly
     * Requirements 7.4, 7.5: Battery level data collection control
     */
    private final java.lang.Object monitorBatteryLevel(kotlin.coroutines.Continuation<? super kotlin.Unit> $completion) {
        return null;
    }
    
    /**
     * Handle motion state changes for adaptive sampling
     * Requirements 7.1, 7.2, 7.3: Adaptive sampling rate management
     */
    private final java.lang.Object handleMotionStateChange(com.roadpulse.android.data.processor.MotionState motionState, kotlin.coroutines.Continuation<? super kotlin.Unit> $completion) {
        return null;
    }
    
    /**
     * Adjust sensor sampling rate
     */
    private final java.lang.Object adjustSamplingRate(int newRate, kotlin.coroutines.Continuation<? super kotlin.Unit> $completion) {
        return null;
    }
    
    /**
     * Get current battery level as percentage
     */
    private final int getBatteryLevel() {
        return 0;
    }
    
    /**
     * Check if device is currently charging
     */
    private final boolean isDeviceCharging() {
        return false;
    }
    
    /**
     * Create notification channel for foreground service
     */
    private final void createNotificationChannel() {
    }
    
    /**
     * Create notification for foreground service
     */
    private final android.app.Notification createNotification(java.lang.String contentText) {
        return null;
    }
    
    /**
     * Update the foreground notification
     */
    private final void updateNotification(java.lang.String contentText) {
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000$\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\u000e\n\u0002\b\u0004\n\u0002\u0010\b\n\u0002\b\u0007\n\u0002\u0010\t\n\u0002\b\u0002\b\u0086\u0003\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002R\u000e\u0010\u0003\u001a\u00020\u0004X\u0086T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0005\u001a\u00020\u0004X\u0086T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0006\u001a\u00020\u0004X\u0086T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0007\u001a\u00020\u0004X\u0086T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\b\u001a\u00020\tX\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\n\u001a\u00020\tX\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u000b\u001a\u00020\u0004X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\f\u001a\u00020\u0004X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\r\u001a\u00020\tX\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u000e\u001a\u00020\tX\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u000f\u001a\u00020\tX\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0010\u001a\u00020\u0011X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0012\u001a\u00020\u0011X\u0082T\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u0013"}, d2 = {"Lcom/roadpulse/android/service/SensorMonitorService$Companion;", "", "()V", "ACTION_PAUSE_MONITORING", "", "ACTION_RESUME_MONITORING", "ACTION_START_MONITORING", "ACTION_STOP_MONITORING", "BATTERY_PAUSE_THRESHOLD", "", "BATTERY_RESUME_THRESHOLD", "CHANNEL_ID", "CHANNEL_NAME", "NORMAL_SAMPLING_RATE", "NOTIFICATION_ID", "REDUCED_SAMPLING_RATE", "SAMPLING_RATE_TRANSITION_DELAY_MS", "", "STATIONARY_TIMEOUT_MS", "app_debug"})
    public static final class Companion {
        
        private Companion() {
            super();
        }
    }
}