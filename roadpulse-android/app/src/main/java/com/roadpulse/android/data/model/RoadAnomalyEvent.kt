package com.roadpulse.android.data.model

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey
import java.time.Instant
import java.util.UUID

/**
 * Represents a detected road anomaly event with complete metadata.
 * This entity is stored in the local Room database and contains all
 * information needed for analysis and synchronization.
 */
@Entity(tableName = "road_anomaly_events")
data class RoadAnomalyEvent(
    @PrimaryKey
    val id: String = UUID.randomUUID().toString(),
    
    @ColumnInfo(name = "created_at")
    val createdAt: Long, // Unix timestamp in milliseconds
    
    @ColumnInfo(name = "latitude")
    val latitude: Double,
    
    @ColumnInfo(name = "longitude")
    val longitude: Double,
    
    @ColumnInfo(name = "gps_accuracy_m")
    val gpsAccuracyM: Float,
    
    @ColumnInfo(name = "speed_kmh")
    val speedKmh: Float,
    
    @ColumnInfo(name = "heading_deg")
    val headingDeg: Float?,
    
    @ColumnInfo(name = "peak_accel_ms2")
    val peakAccelMs2: Float,
    
    @ColumnInfo(name = "impulse_duration_ms")
    val impulseDurationMs: Int,
    
    @ColumnInfo(name = "severity")
    val severity: Int, // 1-5 scale
    
    @ColumnInfo(name = "confidence")
    val confidence: Float, // 0.0-1.0 scale
    
    @ColumnInfo(name = "device_model")
    val deviceModel: String,
    
    @ColumnInfo(name = "android_version")
    val androidVersion: String,
    
    @ColumnInfo(name = "session_id")
    val sessionId: String,
    
    @ColumnInfo(name = "synced")
    val synced: Boolean = false
) {
    companion object {
        /**
         * Creates a new RoadAnomalyEvent with current timestamp and device info
         */
        fun create(
            latitude: Double,
            longitude: Double,
            gpsAccuracyM: Float,
            speedKmh: Float,
            headingDeg: Float?,
            peakAccelMs2: Float,
            impulseDurationMs: Int,
            severity: Int,
            confidence: Float,
            sessionId: String
        ): RoadAnomalyEvent {
            return RoadAnomalyEvent(
                createdAt = Instant.now().toEpochMilli(),
                latitude = latitude,
                longitude = longitude,
                gpsAccuracyM = gpsAccuracyM,
                speedKmh = speedKmh,
                headingDeg = headingDeg,
                peakAccelMs2 = peakAccelMs2,
                impulseDurationMs = impulseDurationMs,
                severity = severity,
                confidence = confidence,
                deviceModel = android.os.Build.MODEL,
                androidVersion = android.os.Build.VERSION.RELEASE,
                sessionId = sessionId
            )
        }
    }
}