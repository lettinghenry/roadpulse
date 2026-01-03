package com.roadpulse.android.data.model;

/**
 * GPS location data with movement information.
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u00008\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\u0006\n\u0002\b\u0002\n\u0002\u0010\u0007\n\u0002\b\u0003\n\u0002\u0010\t\n\u0002\b\u0012\n\u0002\u0010\u000b\n\u0002\b\u0003\n\u0002\u0010\b\n\u0002\b\u0003\n\u0002\u0010\u000e\n\u0000\b\u0086\b\u0018\u00002\u00020\u0001B5\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0003\u0012\u0006\u0010\u0005\u001a\u00020\u0006\u0012\u0006\u0010\u0007\u001a\u00020\u0006\u0012\u0006\u0010\b\u001a\u00020\u0006\u0012\u0006\u0010\t\u001a\u00020\n\u00a2\u0006\u0002\u0010\u000bJ\t\u0010\u0015\u001a\u00020\u0003H\u00c6\u0003J\t\u0010\u0016\u001a\u00020\u0003H\u00c6\u0003J\t\u0010\u0017\u001a\u00020\u0006H\u00c6\u0003J\t\u0010\u0018\u001a\u00020\u0006H\u00c6\u0003J\t\u0010\u0019\u001a\u00020\u0006H\u00c6\u0003J\t\u0010\u001a\u001a\u00020\nH\u00c6\u0003JE\u0010\u001b\u001a\u00020\u00002\b\b\u0002\u0010\u0002\u001a\u00020\u00032\b\b\u0002\u0010\u0004\u001a\u00020\u00032\b\b\u0002\u0010\u0005\u001a\u00020\u00062\b\b\u0002\u0010\u0007\u001a\u00020\u00062\b\b\u0002\u0010\b\u001a\u00020\u00062\b\b\u0002\u0010\t\u001a\u00020\nH\u00c6\u0001J\u0013\u0010\u001c\u001a\u00020\u001d2\b\u0010\u001e\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\u0006\u0010\u001f\u001a\u00020\u001dJ\t\u0010 \u001a\u00020!H\u00d6\u0001J\u0006\u0010\"\u001a\u00020\u001dJ\u0006\u0010#\u001a\u00020\u0006J\t\u0010$\u001a\u00020%H\u00d6\u0001R\u0011\u0010\u0005\u001a\u00020\u0006\u00a2\u0006\b\n\u0000\u001a\u0004\b\f\u0010\rR\u0011\u0010\b\u001a\u00020\u0006\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000e\u0010\rR\u0011\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u000f\u0010\u0010R\u0011\u0010\u0004\u001a\u00020\u0003\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0011\u0010\u0010R\u0011\u0010\u0007\u001a\u00020\u0006\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0012\u0010\rR\u0011\u0010\t\u001a\u00020\n\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0013\u0010\u0014\u00a8\u0006&"}, d2 = {"Lcom/roadpulse/android/data/model/LocationData;", "", "latitude", "", "longitude", "accuracy", "", "speed", "bearing", "timestamp", "", "(DDFFFJ)V", "getAccuracy", "()F", "getBearing", "getLatitude", "()D", "getLongitude", "getSpeed", "getTimestamp", "()J", "component1", "component2", "component3", "component4", "component5", "component6", "copy", "equals", "", "other", "hasGoodAccuracy", "hashCode", "", "isMovingFast", "speedKmh", "toString", "", "app_debug"})
public final class LocationData {
    private final double latitude = 0.0;
    private final double longitude = 0.0;
    private final float accuracy = 0.0F;
    private final float speed = 0.0F;
    private final float bearing = 0.0F;
    private final long timestamp = 0L;
    
    public LocationData(double latitude, double longitude, float accuracy, float speed, float bearing, long timestamp) {
        super();
    }
    
    public final double getLatitude() {
        return 0.0;
    }
    
    public final double getLongitude() {
        return 0.0;
    }
    
    public final float getAccuracy() {
        return 0.0F;
    }
    
    public final float getSpeed() {
        return 0.0F;
    }
    
    public final float getBearing() {
        return 0.0F;
    }
    
    public final long getTimestamp() {
        return 0L;
    }
    
    /**
     * Converts speed from m/s to km/h
     */
    public final float speedKmh() {
        return 0.0F;
    }
    
    /**
     * Determines if GPS accuracy is sufficient for event recording
     */
    public final boolean hasGoodAccuracy() {
        return false;
    }
    
    /**
     * Determines if vehicle is moving at sufficient speed for event detection
     */
    public final boolean isMovingFast() {
        return false;
    }
    
    public final double component1() {
        return 0.0;
    }
    
    public final double component2() {
        return 0.0;
    }
    
    public final float component3() {
        return 0.0F;
    }
    
    public final float component4() {
        return 0.0F;
    }
    
    public final float component5() {
        return 0.0F;
    }
    
    public final long component6() {
        return 0L;
    }
    
    @org.jetbrains.annotations.NotNull
    public final com.roadpulse.android.data.model.LocationData copy(double latitude, double longitude, float accuracy, float speed, float bearing, long timestamp) {
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