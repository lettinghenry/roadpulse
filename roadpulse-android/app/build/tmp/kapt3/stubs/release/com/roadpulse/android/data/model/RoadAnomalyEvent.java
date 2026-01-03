package com.roadpulse.android.data.model;

/**
 * Represents a detected road anomaly event with complete metadata.
 * This entity is stored in the local Room database and contains all
 * information needed for analysis and synchronization.
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u00006\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\u000e\n\u0000\n\u0002\u0010\t\n\u0000\n\u0002\u0010\u0006\n\u0002\b\u0002\n\u0002\u0010\u0007\n\u0002\b\u0004\n\u0002\u0010\b\n\u0002\b\u0006\n\u0002\u0010\u000b\n\u0002\b/\b\u0087\b\u0018\u0000 D2\u00020\u0001:\u0001DB\u0083\u0001\u0012\b\b\u0002\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u0012\u0006\u0010\u0006\u001a\u00020\u0007\u0012\u0006\u0010\b\u001a\u00020\u0007\u0012\u0006\u0010\t\u001a\u00020\n\u0012\u0006\u0010\u000b\u001a\u00020\n\u0012\b\u0010\f\u001a\u0004\u0018\u00010\n\u0012\u0006\u0010\r\u001a\u00020\n\u0012\u0006\u0010\u000e\u001a\u00020\u000f\u0012\u0006\u0010\u0010\u001a\u00020\u000f\u0012\u0006\u0010\u0011\u001a\u00020\n\u0012\u0006\u0010\u0012\u001a\u00020\u0003\u0012\u0006\u0010\u0013\u001a\u00020\u0003\u0012\u0006\u0010\u0014\u001a\u00020\u0003\u0012\b\b\u0002\u0010\u0015\u001a\u00020\u0016\u00a2\u0006\u0002\u0010\u0017J\t\u0010/\u001a\u00020\u0003H\u00c6\u0003J\t\u00100\u001a\u00020\u000fH\u00c6\u0003J\t\u00101\u001a\u00020\nH\u00c6\u0003J\t\u00102\u001a\u00020\u0003H\u00c6\u0003J\t\u00103\u001a\u00020\u0003H\u00c6\u0003J\t\u00104\u001a\u00020\u0003H\u00c6\u0003J\t\u00105\u001a\u00020\u0016H\u00c6\u0003J\t\u00106\u001a\u00020\u0005H\u00c6\u0003J\t\u00107\u001a\u00020\u0007H\u00c6\u0003J\t\u00108\u001a\u00020\u0007H\u00c6\u0003J\t\u00109\u001a\u00020\nH\u00c6\u0003J\t\u0010:\u001a\u00020\nH\u00c6\u0003J\u0010\u0010;\u001a\u0004\u0018\u00010\nH\u00c6\u0003\u00a2\u0006\u0002\u0010!J\t\u0010<\u001a\u00020\nH\u00c6\u0003J\t\u0010=\u001a\u00020\u000fH\u00c6\u0003J\u00a6\u0001\u0010>\u001a\u00020\u00002\b\b\u0002\u0010\u0002\u001a\u00020\u00032\b\b\u0002\u0010\u0004\u001a\u00020\u00052\b\b\u0002\u0010\u0006\u001a\u00020\u00072\b\b\u0002\u0010\b\u001a\u00020\u00072\b\b\u0002\u0010\t\u001a\u00020\n2\b\b\u0002\u0010\u000b\u001a\u00020\n2\n\b\u0002\u0010\f\u001a\u0004\u0018\u00010\n2\b\b\u0002\u0010\r\u001a\u00020\n2\b\b\u0002\u0010\u000e\u001a\u00020\u000f2\b\b\u0002\u0010\u0010\u001a\u00020\u000f2\b\b\u0002\u0010\u0011\u001a\u00020\n2\b\b\u0002\u0010\u0012\u001a\u00020\u00032\b\b\u0002\u0010\u0013\u001a\u00020\u00032\b\b\u0002\u0010\u0014\u001a\u00020\u00032\b\b\u0002\u0010\u0015\u001a\u00020\u0016H\u00c6\u0001\u00a2\u0006\u0002\u0010?J\u0013\u0010@\u001a\u00020\u00162\b\u0010A\u001a\u0004\u0018\u00010\u0001H\u00d6\u0003J\t\u0010B\u001a\u00020\u000fH\u00d6\u0001J\t\u0010C\u001a\u00020\u0003H\u00d6\u0001R\u0016\u0010\u0013\u001a\u00020\u00038\u0006X\u0087\u0004\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0018\u0010\u0019R\u0016\u0010\u0011\u001a\u00020\n8\u0006X\u0087\u0004\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001a\u0010\u001bR\u0016\u0010\u0004\u001a\u00020\u00058\u0006X\u0087\u0004\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001c\u0010\u001dR\u0016\u0010\u0012\u001a\u00020\u00038\u0006X\u0087\u0004\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001e\u0010\u0019R\u0016\u0010\t\u001a\u00020\n8\u0006X\u0087\u0004\u00a2\u0006\b\n\u0000\u001a\u0004\b\u001f\u0010\u001bR\u001a\u0010\f\u001a\u0004\u0018\u00010\n8\u0006X\u0087\u0004\u00a2\u0006\n\n\u0002\u0010\"\u001a\u0004\b \u0010!R\u0016\u0010\u0002\u001a\u00020\u00038\u0006X\u0087\u0004\u00a2\u0006\b\n\u0000\u001a\u0004\b#\u0010\u0019R\u0016\u0010\u000e\u001a\u00020\u000f8\u0006X\u0087\u0004\u00a2\u0006\b\n\u0000\u001a\u0004\b$\u0010%R\u0016\u0010\u0006\u001a\u00020\u00078\u0006X\u0087\u0004\u00a2\u0006\b\n\u0000\u001a\u0004\b&\u0010\'R\u0016\u0010\b\u001a\u00020\u00078\u0006X\u0087\u0004\u00a2\u0006\b\n\u0000\u001a\u0004\b(\u0010\'R\u0016\u0010\r\u001a\u00020\n8\u0006X\u0087\u0004\u00a2\u0006\b\n\u0000\u001a\u0004\b)\u0010\u001bR\u0016\u0010\u0014\u001a\u00020\u00038\u0006X\u0087\u0004\u00a2\u0006\b\n\u0000\u001a\u0004\b*\u0010\u0019R\u0016\u0010\u0010\u001a\u00020\u000f8\u0006X\u0087\u0004\u00a2\u0006\b\n\u0000\u001a\u0004\b+\u0010%R\u0016\u0010\u000b\u001a\u00020\n8\u0006X\u0087\u0004\u00a2\u0006\b\n\u0000\u001a\u0004\b,\u0010\u001bR\u0016\u0010\u0015\u001a\u00020\u00168\u0006X\u0087\u0004\u00a2\u0006\b\n\u0000\u001a\u0004\b-\u0010.\u00a8\u0006E"}, d2 = {"Lcom/roadpulse/android/data/model/RoadAnomalyEvent;", "", "id", "", "createdAt", "", "latitude", "", "longitude", "gpsAccuracyM", "", "speedKmh", "headingDeg", "peakAccelMs2", "impulseDurationMs", "", "severity", "confidence", "deviceModel", "androidVersion", "sessionId", "synced", "", "(Ljava/lang/String;JDDFFLjava/lang/Float;FIIFLjava/lang/String;Ljava/lang/String;Ljava/lang/String;Z)V", "getAndroidVersion", "()Ljava/lang/String;", "getConfidence", "()F", "getCreatedAt", "()J", "getDeviceModel", "getGpsAccuracyM", "getHeadingDeg", "()Ljava/lang/Float;", "Ljava/lang/Float;", "getId", "getImpulseDurationMs", "()I", "getLatitude", "()D", "getLongitude", "getPeakAccelMs2", "getSessionId", "getSeverity", "getSpeedKmh", "getSynced", "()Z", "component1", "component10", "component11", "component12", "component13", "component14", "component15", "component2", "component3", "component4", "component5", "component6", "component7", "component8", "component9", "copy", "(Ljava/lang/String;JDDFFLjava/lang/Float;FIIFLjava/lang/String;Ljava/lang/String;Ljava/lang/String;Z)Lcom/roadpulse/android/data/model/RoadAnomalyEvent;", "equals", "other", "hashCode", "toString", "Companion", "app_release"})
@androidx.room.Entity(tableName = "road_anomaly_events")
public final class RoadAnomalyEvent {
    @androidx.room.PrimaryKey
    @org.jetbrains.annotations.NotNull
    private final java.lang.String id = null;
    @androidx.room.ColumnInfo(name = "created_at")
    private final long createdAt = 0L;
    @androidx.room.ColumnInfo(name = "latitude")
    private final double latitude = 0.0;
    @androidx.room.ColumnInfo(name = "longitude")
    private final double longitude = 0.0;
    @androidx.room.ColumnInfo(name = "gps_accuracy_m")
    private final float gpsAccuracyM = 0.0F;
    @androidx.room.ColumnInfo(name = "speed_kmh")
    private final float speedKmh = 0.0F;
    @androidx.room.ColumnInfo(name = "heading_deg")
    @org.jetbrains.annotations.Nullable
    private final java.lang.Float headingDeg = null;
    @androidx.room.ColumnInfo(name = "peak_accel_ms2")
    private final float peakAccelMs2 = 0.0F;
    @androidx.room.ColumnInfo(name = "impulse_duration_ms")
    private final int impulseDurationMs = 0;
    @androidx.room.ColumnInfo(name = "severity")
    private final int severity = 0;
    @androidx.room.ColumnInfo(name = "confidence")
    private final float confidence = 0.0F;
    @androidx.room.ColumnInfo(name = "device_model")
    @org.jetbrains.annotations.NotNull
    private final java.lang.String deviceModel = null;
    @androidx.room.ColumnInfo(name = "android_version")
    @org.jetbrains.annotations.NotNull
    private final java.lang.String androidVersion = null;
    @androidx.room.ColumnInfo(name = "session_id")
    @org.jetbrains.annotations.NotNull
    private final java.lang.String sessionId = null;
    @androidx.room.ColumnInfo(name = "synced")
    private final boolean synced = false;
    @org.jetbrains.annotations.NotNull
    public static final com.roadpulse.android.data.model.RoadAnomalyEvent.Companion Companion = null;
    
    public RoadAnomalyEvent(@org.jetbrains.annotations.NotNull
    java.lang.String id, long createdAt, double latitude, double longitude, float gpsAccuracyM, float speedKmh, @org.jetbrains.annotations.Nullable
    java.lang.Float headingDeg, float peakAccelMs2, int impulseDurationMs, int severity, float confidence, @org.jetbrains.annotations.NotNull
    java.lang.String deviceModel, @org.jetbrains.annotations.NotNull
    java.lang.String androidVersion, @org.jetbrains.annotations.NotNull
    java.lang.String sessionId, boolean synced) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull
    public final java.lang.String getId() {
        return null;
    }
    
    public final long getCreatedAt() {
        return 0L;
    }
    
    public final double getLatitude() {
        return 0.0;
    }
    
    public final double getLongitude() {
        return 0.0;
    }
    
    public final float getGpsAccuracyM() {
        return 0.0F;
    }
    
    public final float getSpeedKmh() {
        return 0.0F;
    }
    
    @org.jetbrains.annotations.Nullable
    public final java.lang.Float getHeadingDeg() {
        return null;
    }
    
    public final float getPeakAccelMs2() {
        return 0.0F;
    }
    
    public final int getImpulseDurationMs() {
        return 0;
    }
    
    public final int getSeverity() {
        return 0;
    }
    
    public final float getConfidence() {
        return 0.0F;
    }
    
    @org.jetbrains.annotations.NotNull
    public final java.lang.String getDeviceModel() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull
    public final java.lang.String getAndroidVersion() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull
    public final java.lang.String getSessionId() {
        return null;
    }
    
    public final boolean getSynced() {
        return false;
    }
    
    @org.jetbrains.annotations.NotNull
    public final java.lang.String component1() {
        return null;
    }
    
    public final int component10() {
        return 0;
    }
    
    public final float component11() {
        return 0.0F;
    }
    
    @org.jetbrains.annotations.NotNull
    public final java.lang.String component12() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull
    public final java.lang.String component13() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull
    public final java.lang.String component14() {
        return null;
    }
    
    public final boolean component15() {
        return false;
    }
    
    public final long component2() {
        return 0L;
    }
    
    public final double component3() {
        return 0.0;
    }
    
    public final double component4() {
        return 0.0;
    }
    
    public final float component5() {
        return 0.0F;
    }
    
    public final float component6() {
        return 0.0F;
    }
    
    @org.jetbrains.annotations.Nullable
    public final java.lang.Float component7() {
        return null;
    }
    
    public final float component8() {
        return 0.0F;
    }
    
    public final int component9() {
        return 0;
    }
    
    @org.jetbrains.annotations.NotNull
    public final com.roadpulse.android.data.model.RoadAnomalyEvent copy(@org.jetbrains.annotations.NotNull
    java.lang.String id, long createdAt, double latitude, double longitude, float gpsAccuracyM, float speedKmh, @org.jetbrains.annotations.Nullable
    java.lang.Float headingDeg, float peakAccelMs2, int impulseDurationMs, int severity, float confidence, @org.jetbrains.annotations.NotNull
    java.lang.String deviceModel, @org.jetbrains.annotations.NotNull
    java.lang.String androidVersion, @org.jetbrains.annotations.NotNull
    java.lang.String sessionId, boolean synced) {
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
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u00002\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0006\n\u0002\b\u0002\n\u0002\u0010\u0007\n\u0002\b\u0004\n\u0002\u0010\b\n\u0002\b\u0003\n\u0002\u0010\u000e\n\u0002\b\u0002\b\u0086\u0003\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002J]\u0010\u0003\u001a\u00020\u00042\u0006\u0010\u0005\u001a\u00020\u00062\u0006\u0010\u0007\u001a\u00020\u00062\u0006\u0010\b\u001a\u00020\t2\u0006\u0010\n\u001a\u00020\t2\b\u0010\u000b\u001a\u0004\u0018\u00010\t2\u0006\u0010\f\u001a\u00020\t2\u0006\u0010\r\u001a\u00020\u000e2\u0006\u0010\u000f\u001a\u00020\u000e2\u0006\u0010\u0010\u001a\u00020\t2\u0006\u0010\u0011\u001a\u00020\u0012\u00a2\u0006\u0002\u0010\u0013\u00a8\u0006\u0014"}, d2 = {"Lcom/roadpulse/android/data/model/RoadAnomalyEvent$Companion;", "", "()V", "create", "Lcom/roadpulse/android/data/model/RoadAnomalyEvent;", "latitude", "", "longitude", "gpsAccuracyM", "", "speedKmh", "headingDeg", "peakAccelMs2", "impulseDurationMs", "", "severity", "confidence", "sessionId", "", "(DDFFLjava/lang/Float;FIIFLjava/lang/String;)Lcom/roadpulse/android/data/model/RoadAnomalyEvent;", "app_release"})
    public static final class Companion {
        
        private Companion() {
            super();
        }
        
        /**
         * Creates a new RoadAnomalyEvent with current timestamp and device info
         */
        @org.jetbrains.annotations.NotNull
        public final com.roadpulse.android.data.model.RoadAnomalyEvent create(double latitude, double longitude, float gpsAccuracyM, float speedKmh, @org.jetbrains.annotations.Nullable
        java.lang.Float headingDeg, float peakAccelMs2, int impulseDurationMs, int severity, float confidence, @org.jetbrains.annotations.NotNull
        java.lang.String sessionId) {
            return null;
        }
    }
}