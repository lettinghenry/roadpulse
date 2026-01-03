package com.roadpulse.android.data.model

/**
 * Represents a detected road anomaly event before classification.
 * This is an intermediate data structure used in the detection pipeline.
 */
data class DetectedEvent(
    val timestamp: Long,
    val peakAcceleration: Float,
    val duration: Int, // Duration in milliseconds
    val location: LocationData?,
    val sensorQuality: SensorQuality
) {
    /**
     * Determines if this event should be merged with another consecutive event
     */
    fun shouldMergeWith(other: DetectedEvent): Boolean {
        val timeDifference = kotlin.math.abs(timestamp - other.timestamp)
        return timeDifference <= 500 // 500ms threshold for merging
    }
    
    /**
     * Merges this event with another consecutive event
     */
    fun mergeWith(other: DetectedEvent): DetectedEvent {
        return DetectedEvent(
            timestamp = minOf(timestamp, other.timestamp),
            peakAcceleration = maxOf(peakAcceleration, other.peakAcceleration),
            duration = duration + other.duration,
            location = location ?: other.location, // Use first available location
            sensorQuality = sensorQuality.combineWith(other.sensorQuality)
        )
    }
    
    /**
     * Validates if this event meets the criteria for storage
     */
    fun isValid(): Boolean {
        return peakAcceleration >= 2.5f && // Minimum threshold
               duration >= 50 && // Minimum duration
               duration <= 500 && // Maximum duration
               location != null && // Must have location
               location.hasGoodAccuracy() && // GPS accuracy check
               location.isMovingFast() // Speed check
    }
}

/**
 * Represents the quality metrics of sensor data at the time of event detection.
 */
data class SensorQuality(
    val accelerometerAccuracy: Int,
    val gyroscopeAccuracy: Int,
    val gpsAccuracy: Float,
    val deviceStability: Float // 0.0-1.0, higher is more stable
) {
    /**
     * Combines this sensor quality with another for merged events
     */
    fun combineWith(other: SensorQuality): SensorQuality {
        return SensorQuality(
            accelerometerAccuracy = maxOf(accelerometerAccuracy, other.accelerometerAccuracy),
            gyroscopeAccuracy = maxOf(gyroscopeAccuracy, other.gyroscopeAccuracy),
            gpsAccuracy = minOf(gpsAccuracy, other.gpsAccuracy), // Better accuracy is lower value
            deviceStability = (deviceStability + other.deviceStability) / 2.0f
        )
    }
    
    /**
     * Calculates overall sensor quality score (0.0-1.0)
     */
    fun overallQuality(): Float {
        val accelerometerScore = accelerometerAccuracy / 3.0f // Android accuracy scale 0-3
        val gyroscopeScore = gyroscopeAccuracy / 3.0f
        val gpsScore = when {
            gpsAccuracy <= 5f -> 1.0f
            gpsAccuracy <= 10f -> 0.8f
            gpsAccuracy <= 20f -> 0.6f
            else -> 0.3f
        }
        
        return ((accelerometerScore + gyroscopeScore) / 2.0f * 0.3f + 
                gpsScore * 0.4f + 
                deviceStability * 0.3f).coerceIn(0.0f, 1.0f)
    }
}