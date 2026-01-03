package com.roadpulse.android.data.model;

/**
 * Container for all sensor data collected at a specific timestamp.
 * Used for processing and event detection.
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u00008\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\t\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u000f\n\u0002\u0010\u000b\n\u0002\b\u0002\n\u0002\u0010\b\n\u0000\n\u0002\u0010\u000e\n\u0000\b\u0086\b\u0018\u00002\u00020\u0001B\'\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u0012\u0006\u0010\u0006\u001a\u00020\u0007\u0012\b\u0010\b\u001a\u0004\u0018\u00010\t\u00a2\u0006\u0002\u0010\nJ\t\u0010\u0013\u001a\u00020\u0003H\u00c6\u0003J\t\u0010\u0014\u001a\u00020\u0005H\u00c6\u0003J\t\u0010\u0015\u001a\u00020\u0007H\u00c6\u0003J\u000b\u0010\u0016\u001a\u0004\u0018\u00010\tH\u00c6\u0003J3\u0010\u0017\u001a\u00020\u00002\b\b\u0002\u0010\u0002\u001a\u00020\u00032\b\b\u0002\u0010\u0004\u001a\u00020\u00052\b\b\u0002\u0010\u0006\u001a\u00020\u00072\n\b\u0002\u0010\b\u001a\u0004\u0018\u00010\tH\u00c6\u0001J\u0013\u0010\u0018\u001a\u00020\u00192\b\u0010\u001a\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u0010\u001b\u001a\u00020\u001cH\u00d6\u0001J\t\u0010\u001d\u001a\u00020\u001eH\u00d6\u0001R\u0011\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000b\u0010\fR\u0011\u0010\u0006\u001a\u00020\u0007\u00a2\u0006\b\n\u0000\u001a\u0004\b\r\u0010\u000eR\u0013\u0010\b\u001a\u0004\u0018\u00010\t\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000f\u0010\u0010R\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0011\u0010\u0012\u00a8\u0006\u001f"}, d2 = {"Lcom/roadpulse/android/data/model/SensorData;", "", "timestamp", "", "accelerometer", "Lcom/roadpulse/android/data/model/AccelerometerData;", "gyroscope", "Lcom/roadpulse/android/data/model/GyroscopeData;", "location", "Lcom/roadpulse/android/data/model/LocationData;", "(JLcom/roadpulse/android/data/model/AccelerometerData;Lcom/roadpulse/android/data/model/GyroscopeData;Lcom/roadpulse/android/data/model/LocationData;)V", "getAccelerometer", "()Lcom/roadpulse/android/data/model/AccelerometerData;", "getGyroscope", "()Lcom/roadpulse/android/data/model/GyroscopeData;", "getLocation", "()Lcom/roadpulse/android/data/model/LocationData;", "getTimestamp", "()J", "component1", "component2", "component3", "component4", "copy", "equals", "", "other", "hashCode", "", "toString", "", "app_release"})
public final class SensorData {
    private final long timestamp = 0L;
    @org.jetbrains.annotations.NotNull
    private final com.roadpulse.android.data.model.AccelerometerData accelerometer = null;
    @org.jetbrains.annotations.NotNull
    private final com.roadpulse.android.data.model.GyroscopeData gyroscope = null;
    @org.jetbrains.annotations.Nullable
    private final com.roadpulse.android.data.model.LocationData location = null;
    
    public SensorData(long timestamp, @org.jetbrains.annotations.NotNull
    com.roadpulse.android.data.model.AccelerometerData accelerometer, @org.jetbrains.annotations.NotNull
    com.roadpulse.android.data.model.GyroscopeData gyroscope, @org.jetbrains.annotations.Nullable
    com.roadpulse.android.data.model.LocationData location) {
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
    public final com.roadpulse.android.data.model.SensorData copy(long timestamp, @org.jetbrains.annotations.NotNull
    com.roadpulse.android.data.model.AccelerometerData accelerometer, @org.jetbrains.annotations.NotNull
    com.roadpulse.android.data.model.GyroscopeData gyroscope, @org.jetbrains.annotations.Nullable
    com.roadpulse.android.data.model.LocationData location) {
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