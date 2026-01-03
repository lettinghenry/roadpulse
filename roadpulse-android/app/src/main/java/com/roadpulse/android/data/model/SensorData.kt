package com.roadpulse.android.data.model

/**
 * Container for all sensor data collected at a specific timestamp.
 * Used for processing and event detection.
 */
data class SensorData(
    val timestamp: Long,
    val accelerometer: AccelerometerData,
    val gyroscope: GyroscopeData,
    val location: LocationData?
)

/**
 * Accelerometer sensor data with accuracy information.
 */
data class AccelerometerData(
    val x: Float,
    val y: Float,
    val z: Float,
    val accuracy: Int
) {
    /**
     * Calculates the magnitude of the acceleration vector
     */
    fun magnitude(): Float = kotlin.math.sqrt(x * x + y * y + z * z)
    
    /**
     * Calculates the vertical acceleration component (assuming device is in vehicle orientation)
     */
    fun verticalAcceleration(): Float = kotlin.math.abs(z)
}

/**
 * Gyroscope sensor data with accuracy information.
 */
data class GyroscopeData(
    val x: Float, // Rotation around x-axis (pitch)
    val y: Float, // Rotation around y-axis (roll)
    val z: Float, // Rotation around z-axis (yaw)
    val accuracy: Int
) {
    /**
     * Calculates the magnitude of the angular velocity vector
     */
    fun magnitude(): Float = kotlin.math.sqrt(x * x + y * y + z * z)
    
    /**
     * Determines if the device is experiencing rapid orientation changes
     * indicating possible device handling
     */
    fun isRapidOrientationChange(): Boolean {
        val threshold = 2.0f // rad/s
        return magnitude() > threshold
    }
}

/**
 * GPS location data with movement information.
 */
data class LocationData(
    val latitude: Double,
    val longitude: Double,
    val accuracy: Float, // Accuracy in meters
    val speed: Float, // Speed in m/s
    val bearing: Float, // Bearing in degrees
    val timestamp: Long
) {
    /**
     * Converts speed from m/s to km/h
     */
    fun speedKmh(): Float = speed * 3.6f
    
    /**
     * Determines if GPS accuracy is sufficient for event recording
     */
    fun hasGoodAccuracy(): Boolean = accuracy <= 20.0f
    
    /**
     * Determines if vehicle is moving at sufficient speed for event detection
     */
    fun isMovingFast(): Boolean = speedKmh() >= 5.0f
}