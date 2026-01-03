package com.roadpulse.android.data.model;

/**
 * Represents a detected road anomaly event before classification.
 * This is an intermediate data structure used in the detection pipeline.
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u00008\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\t\n\u0000\n\u0002\u0010\u0007\n\u0000\n\u0002\u0010\b\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0012\n\u0002\u0010\u000b\n\u0002\b\u0006\n\u0002\u0010\u000e\n\u0000\b\u0086\b\u0018\u00002\u00020\u0001B/\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u0012\u0006\u0010\u0006\u001a\u00020\u0007\u0012\b\u0010\b\u001a\u0004\u0018\u00010\t\u0012\u0006\u0010\n\u001a\u00020\u000b\u00a2\u0006\u0002\u0010\fJ\t\u0010\u0017\u001a\u00020\u0003H\u00c6\u0003J\t\u0010\u0018\u001a\u00020\u0005H\u00c6\u0003J\t\u0010\u0019\u001a\u00020\u0007H\u00c6\u0003J\u000b\u0010\u001a\u001a\u0004\u0018\u00010\tH\u00c6\u0003J\t\u0010\u001b\u001a\u00020\u000bH\u00c6\u0003J=\u0010\u001c\u001a\u00020\u00002\b\b\u0002\u0010\u0002\u001a\u00020\u00032\b\b\u0002\u0010\u0004\u001a\u00020\u00052\b\b\u0002\u0010\u0006\u001a\u00020\u00072\n\b\u0002\u0010\b\u001a\u0004\u0018\u00010\t2\b\b\u0002\u0010\n\u001a\u00020\u000bH\u00c6\u0001J\u0013\u0010\u001d\u001a\u00020\u001e2\b\u0010\u001f\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u0010 \u001a\u00020\u0007H\u00d6\u0001J\u0006\u0010!\u001a\u00020\u001eJ\u000e\u0010\"\u001a\u00020\u00002\u0006\u0010\u001f\u001a\u00020\u0000J\u000e\u0010#\u001a\u00020\u001e2\u0006\u0010\u001f\u001a\u00020\u0000J\t\u0010$\u001a\u00020%H\u00d6\u0001R\u0011\u0010\u0006\u001a\u00020\u0007\u00a2\u0006\b\n\u0000\u001a\u0004\b\r\u0010\u000eR\u0013\u0010\b\u001a\u0004\u0018\u00010\t\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000f\u0010\u0010R\u0011\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0011\u0010\u0012R\u0011\u0010\n\u001a\u00020\u000b\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0013\u0010\u0014R\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0015\u0010\u0016\u00a8\u0006&"}, d2 = {"Lcom/roadpulse/android/data/model/DetectedEvent;", "", "timestamp", "", "peakAcceleration", "", "duration", "", "location", "Lcom/roadpulse/android/data/model/LocationData;", "sensorQuality", "Lcom/roadpulse/android/data/model/SensorQuality;", "(JFILcom/roadpulse/android/data/model/LocationData;Lcom/roadpulse/android/data/model/SensorQuality;)V", "getDuration", "()I", "getLocation", "()Lcom/roadpulse/android/data/model/LocationData;", "getPeakAcceleration", "()F", "getSensorQuality", "()Lcom/roadpulse/android/data/model/SensorQuality;", "getTimestamp", "()J", "component1", "component2", "component3", "component4", "component5", "copy", "equals", "", "other", "hashCode", "isValid", "mergeWith", "shouldMergeWith", "toString", "", "app_release"})
public final class DetectedEvent {
    private final long timestamp = 0L;
    private final float peakAcceleration = 0.0F;
    private final int duration = 0;
    @org.jetbrains.annotations.Nullable
    private final com.roadpulse.android.data.model.LocationData location = null;
    @org.jetbrains.annotations.NotNull
    private final com.roadpulse.android.data.model.SensorQuality sensorQuality = null;
    
    public DetectedEvent(long timestamp, float peakAcceleration, int duration, @org.jetbrains.annotations.Nullable
    com.roadpulse.android.data.model.LocationData location, @org.jetbrains.annotations.NotNull
    com.roadpulse.android.data.model.SensorQuality sensorQuality) {
        super();
    }
    
    public final long getTimestamp() {
        return 0L;
    }
    
    public final float getPeakAcceleration() {
        return 0.0F;
    }
    
    public final int getDuration() {
        return 0;
    }
    
    @org.jetbrains.annotations.Nullable
    public final com.roadpulse.android.data.model.LocationData getLocation() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull
    public final com.roadpulse.android.data.model.SensorQuality getSensorQuality() {
        return null;
    }
    
    /**
     * Determines if this event should be merged with another consecutive event
     */
    public final boolean shouldMergeWith(@org.jetbrains.annotations.NotNull
    com.roadpulse.android.data.model.DetectedEvent other) {
        return false;
    }
    
    /**
     * Merges this event with another consecutive event
     */
    @org.jetbrains.annotations.NotNull
    public final com.roadpulse.android.data.model.DetectedEvent mergeWith(@org.jetbrains.annotations.NotNull
    com.roadpulse.android.data.model.DetectedEvent other) {
        return null;
    }
    
    /**
     * Validates if this event meets the criteria for storage
     */
    public final boolean isValid() {
        return false;
    }
    
    public final long component1() {
        return 0L;
    }
    
    public final float component2() {
        return 0.0F;
    }
    
    public final int component3() {
        return 0;
    }
    
    @org.jetbrains.annotations.Nullable
    public final com.roadpulse.android.data.model.LocationData component4() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull
    public final com.roadpulse.android.data.model.SensorQuality component5() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull
    public final com.roadpulse.android.data.model.DetectedEvent copy(long timestamp, float peakAcceleration, int duration, @org.jetbrains.annotations.Nullable
    com.roadpulse.android.data.model.LocationData location, @org.jetbrains.annotations.NotNull
    com.roadpulse.android.data.model.SensorQuality sensorQuality) {
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