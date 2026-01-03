package com.roadpulse.android.data.processor;

/**
 * Represents processed sensor data with additional computed information
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000B\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\t\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000b\n\u0002\b\u0019\n\u0002\u0010\b\n\u0000\n\u0002\u0010\u000e\n\u0000\b\u0086\b\u0018\u00002\u00020\u0001B?\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u0012\u0006\u0010\u0006\u001a\u00020\u0007\u0012\b\u0010\b\u001a\u0004\u0018\u00010\t\u0012\u0006\u0010\n\u001a\u00020\u000b\u0012\u0006\u0010\f\u001a\u00020\r\u0012\u0006\u0010\u000e\u001a\u00020\u000f\u00a2\u0006\u0002\u0010\u0010J\t\u0010\u001e\u001a\u00020\u0003H\u00c6\u0003J\t\u0010\u001f\u001a\u00020\u0005H\u00c6\u0003J\t\u0010 \u001a\u00020\u0007H\u00c6\u0003J\u000b\u0010!\u001a\u0004\u0018\u00010\tH\u00c6\u0003J\t\u0010\"\u001a\u00020\u000bH\u00c6\u0003J\t\u0010#\u001a\u00020\rH\u00c6\u0003J\t\u0010$\u001a\u00020\u000fH\u00c6\u0003JQ\u0010%\u001a\u00020\u00002\b\b\u0002\u0010\u0002\u001a\u00020\u00032\b\b\u0002\u0010\u0004\u001a\u00020\u00052\b\b\u0002\u0010\u0006\u001a\u00020\u00072\n\b\u0002\u0010\b\u001a\u0004\u0018\u00010\t2\b\b\u0002\u0010\n\u001a\u00020\u000b2\b\b\u0002\u0010\f\u001a\u00020\r2\b\b\u0002\u0010\u000e\u001a\u00020\u000fH\u00c6\u0001J\u0013\u0010&\u001a\u00020\u000f2\b\u0010\'\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u0010(\u001a\u00020)H\u00d6\u0001J\t\u0010*\u001a\u00020+H\u00d6\u0001R\u0011\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0011\u0010\u0012R\u0011\u0010\f\u001a\u00020\r\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0013\u0010\u0014R\u0011\u0010\u0006\u001a\u00020\u0007\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0015\u0010\u0016R\u0011\u0010\u000e\u001a\u00020\u000f\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000e\u0010\u0017R\u0013\u0010\b\u001a\u0004\u0018\u00010\t\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0018\u0010\u0019R\u0011\u0010\n\u001a\u00020\u000b\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001a\u0010\u001bR\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001c\u0010\u001d\u00a8\u0006,"}, d2 = {"Lcom/roadpulse/android/data/processor/ProcessedSensorData;", "", "timestamp", "", "accelerometer", "Lcom/roadpulse/android/data/model/AccelerometerData;", "gyroscope", "Lcom/roadpulse/android/data/model/GyroscopeData;", "location", "Lcom/roadpulse/android/data/model/LocationData;", "motionState", "Lcom/roadpulse/android/data/processor/MotionState;", "deviceOrientation", "Lcom/roadpulse/android/data/processor/DeviceOrientation;", "isCalibrated", "", "(JLcom/roadpulse/android/data/model/AccelerometerData;Lcom/roadpulse/android/data/model/GyroscopeData;Lcom/roadpulse/android/data/model/LocationData;Lcom/roadpulse/android/data/processor/MotionState;Lcom/roadpulse/android/data/processor/DeviceOrientation;Z)V", "getAccelerometer", "()Lcom/roadpulse/android/data/model/AccelerometerData;", "getDeviceOrientation", "()Lcom/roadpulse/android/data/processor/DeviceOrientation;", "getGyroscope", "()Lcom/roadpulse/android/data/model/GyroscopeData;", "()Z", "getLocation", "()Lcom/roadpulse/android/data/model/LocationData;", "getMotionState", "()Lcom/roadpulse/android/data/processor/MotionState;", "getTimestamp", "()J", "component1", "component2", "component3", "component4", "component5", "component6", "component7", "copy", "equals", "other", "hashCode", "", "toString", "", "app_release"})
public final class ProcessedSensorData {
    private final long timestamp = 0L;
    @org.jetbrains.annotations.NotNull
    private final com.roadpulse.android.data.model.AccelerometerData accelerometer = null;
    @org.jetbrains.annotations.NotNull
    private final com.roadpulse.android.data.model.GyroscopeData gyroscope = null;
    @org.jetbrains.annotations.Nullable
    private final com.roadpulse.android.data.model.LocationData location = null;
    @org.jetbrains.annotations.NotNull
    private final com.roadpulse.android.data.processor.MotionState motionState = null;
    @org.jetbrains.annotations.NotNull
    private final com.roadpulse.android.data.processor.DeviceOrientation deviceOrientation = null;
    private final boolean isCalibrated = false;
    
    public ProcessedSensorData(long timestamp, @org.jetbrains.annotations.NotNull
    com.roadpulse.android.data.model.AccelerometerData accelerometer, @org.jetbrains.annotations.NotNull
    com.roadpulse.android.data.model.GyroscopeData gyroscope, @org.jetbrains.annotations.Nullable
    com.roadpulse.android.data.model.LocationData location, @org.jetbrains.annotations.NotNull
    com.roadpulse.android.data.processor.MotionState motionState, @org.jetbrains.annotations.NotNull
    com.roadpulse.android.data.processor.DeviceOrientation deviceOrientation, boolean isCalibrated) {
        super();
    }
    
    public final long getTimestamp() {
        return 0L;
    }
    
    @org.jetbrains.annotations.NotNull
    public final com.roadpulse.android.data.model.AccelerometerData getAccelerometer() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull
    public final com.roadpulse.android.data.model.GyroscopeData getGyroscope() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable
    public final com.roadpulse.android.data.model.LocationData getLocation() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull
    public final com.roadpulse.android.data.processor.MotionState getMotionState() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull
    public final com.roadpulse.android.data.processor.DeviceOrientation getDeviceOrientation() {
        return null;
    }
    
    public final boolean isCalibrated() {
        return false;
    }
    
    public final long component1() {
        return 0L;
    }
    
    @org.jetbrains.annotations.NotNull
    public final com.roadpulse.android.data.model.AccelerometerData component2() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull
    public final com.roadpulse.android.data.model.GyroscopeData component3() {
        return null;
    }
    
    @org.jetbrains.annotations.Nullable
    public final com.roadpulse.android.data.model.LocationData component4() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull
    public final com.roadpulse.android.data.processor.MotionState component5() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull
    public final com.roadpulse.android.data.processor.DeviceOrientation component6() {
        return null;
    }
    
    public final boolean component7() {
        return false;
    }
    
    @org.jetbrains.annotations.NotNull
    public final com.roadpulse.android.data.processor.ProcessedSensorData copy(long timestamp, @org.jetbrains.annotations.NotNull
    com.roadpulse.android.data.model.AccelerometerData accelerometer, @org.jetbrains.annotations.NotNull
    com.roadpulse.android.data.model.GyroscopeData gyroscope, @org.jetbrains.annotations.Nullable
    com.roadpulse.android.data.model.LocationData location, @org.jetbrains.annotations.NotNull
    com.roadpulse.android.data.processor.MotionState motionState, @org.jetbrains.annotations.NotNull
    com.roadpulse.android.data.processor.DeviceOrientation deviceOrientation, boolean isCalibrated) {
        return null;
    }
    
    @java.lang.Override
    public boolean equals(@org.jetbrains.annotations.Nullable
    java.lang.Object other) {
        return false;
    }
    
    @java.lang.Override
    public int hashCode() {
        return 0;
    }
    
    @java.lang.Override
    @org.jetbrains.annotations.NotNull
    public java.lang.String toString() {
        return null;
    }
}