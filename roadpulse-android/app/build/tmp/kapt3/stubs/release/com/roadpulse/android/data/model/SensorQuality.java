package com.roadpulse.android.data.model;

/**
 * Represents the quality metrics of sensor data at the time of event detection.
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000(\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\b\n\u0002\b\u0002\n\u0002\u0010\u0007\n\u0002\b\u0010\n\u0002\u0010\u000b\n\u0002\b\u0003\n\u0002\u0010\u000e\n\u0000\b\u0086\b\u0018\u00002\u00020\u0001B%\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0003\u0012\u0006\u0010\u0005\u001a\u00020\u0006\u0012\u0006\u0010\u0007\u001a\u00020\u0006\u00a2\u0006\u0002\u0010\bJ\u000e\u0010\u000f\u001a\u00020\u00002\u0006\u0010\u0010\u001a\u00020\u0000J\t\u0010\u0011\u001a\u00020\u0003H\u00c6\u0003J\t\u0010\u0012\u001a\u00020\u0003H\u00c6\u0003J\t\u0010\u0013\u001a\u00020\u0006H\u00c6\u0003J\t\u0010\u0014\u001a\u00020\u0006H\u00c6\u0003J1\u0010\u0015\u001a\u00020\u00002\b\b\u0002\u0010\u0002\u001a\u00020\u00032\b\b\u0002\u0010\u0004\u001a\u00020\u00032\b\b\u0002\u0010\u0005\u001a\u00020\u00062\b\b\u0002\u0010\u0007\u001a\u00020\u0006H\u00c6\u0001J\u0013\u0010\u0016\u001a\u00020\u00172\b\u0010\u0010\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u0010\u0018\u001a\u00020\u0003H\u00d6\u0001J\u0006\u0010\u0019\u001a\u00020\u0006J\t\u0010\u001a\u001a\u00020\u001bH\u00d6\u0001R\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\t\u0010\nR\u0011\u0010\u0007\u001a\u00020\u0006\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000b\u0010\fR\u0011\u0010\u0005\u001a\u00020\u0006\u00a2\u0006\b\n\u0000\u001a\u0004\b\r\u0010\fR\u0011\u0010\u0004\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000e\u0010\n\u00a8\u0006\u001c"}, d2 = {"Lcom/roadpulse/android/data/model/SensorQuality;", "", "accelerometerAccuracy", "", "gyroscopeAccuracy", "gpsAccuracy", "", "deviceStability", "(IIFF)V", "getAccelerometerAccuracy", "()I", "getDeviceStability", "()F", "getGpsAccuracy", "getGyroscopeAccuracy", "combineWith", "other", "component1", "component2", "component3", "component4", "copy", "equals", "", "hashCode", "overallQuality", "toString", "", "app_release"})
public final class SensorQuality {
    private final int accelerometerAccuracy = 0;
    private final int gyroscopeAccuracy = 0;
    private final float gpsAccuracy = 0.0F;
    private final float deviceStability = 0.0F;
    
    public SensorQuality(int accelerometerAccuracy, int gyroscopeAccuracy, float gpsAccuracy, float deviceStability) {
        super();
    }
    
    public final int getAccelerometerAccuracy() {
        return 0;
    }
    
    public final int getGyroscopeAccuracy() {
        return 0;
    }
    
    public final float getGpsAccuracy() {
        return 0.0F;
    }
    
    public final float getDeviceStability() {
        return 0.0F;
    }
    
    /**
     * Combines this sensor quality with another for merged events
     */
    @org.jetbrains.annotations.NotNull
    public final com.roadpulse.android.data.model.SensorQuality combineWith(@org.jetbrains.annotations.NotNull
    com.roadpulse.android.data.model.SensorQuality other) {
        return null;
    }
    
    /**
     * Calculates overall sensor quality score (0.0-1.0)
     */
    public final float overallQuality() {
        return 0.0F;
    }
    
    public final int component1() {
        return 0;
    }
    
    public final int component2() {
        return 0;
    }
    
    public final float component3() {
        return 0.0F;
    }
    
    public final float component4() {
        return 0.0F;
    }
    
    @org.jetbrains.annotations.NotNull
    public final com.roadpulse.android.data.model.SensorQuality copy(int accelerometerAccuracy, int gyroscopeAccuracy, float gpsAccuracy, float deviceStability) {
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