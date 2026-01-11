package com.roadpulse.android.data.error

/**
 * Base exception class for sensor data collection errors
 */
sealed class SensorDataException(
    message: String,
    cause: Throwable? = null
) : Exception(message, cause)

/**
 * Sensor-related exceptions
 */
class SensorUnavailableException(
    sensorType: String,
    cause: Throwable? = null
) : SensorDataException("Sensor $sensorType is unavailable", cause)

class SensorPermissionDeniedException(
    permission: String,
    cause: Throwable? = null
) : SensorDataException("Permission $permission denied", cause)

class SensorCalibrationException(
    message: String,
    cause: Throwable? = null
) : SensorDataException("Sensor calibration failed: $message", cause)

/**
 * Storage-related exceptions
 */
open class StorageException(
    message: String,
    cause: Throwable? = null
) : SensorDataException("Storage error: $message", cause)

class DatabaseCorruptionException(
    cause: Throwable? = null
) : StorageException("Database corruption detected", cause)

class StorageFullException(
    cause: Throwable? = null
) : StorageException("Storage is full", cause)

class StoragePermissionDeniedException(
    cause: Throwable? = null
) : StorageException("Storage permission denied", cause)

/**
 * System resource exceptions
 */
open class SystemResourceException(
    message: String,
    cause: Throwable? = null
) : SensorDataException("System resource constraint: $message", cause)

class LowMemoryException(
    cause: Throwable? = null
) : SystemResourceException("Low memory condition", cause)

class CpuThrottlingException(
    cause: Throwable? = null
) : SystemResourceException("CPU throttling detected", cause)

class BatteryCriticalException(
    batteryLevel: Int,
    cause: Throwable? = null
) : SystemResourceException("Battery critical: $batteryLevel%", cause)

/**
 * Location-related exceptions
 */
open class LocationException(
    message: String,
    cause: Throwable? = null
) : SensorDataException("Location error: $message", cause)

class LocationPermissionDeniedException(
    cause: Throwable? = null
) : LocationException("Location permission denied", cause)

class LocationUnavailableException(
    cause: Throwable? = null
) : LocationException("Location services unavailable", cause)

class GpsAccuracyException(
    accuracy: Float,
    cause: Throwable? = null
) : LocationException("GPS accuracy too poor: ${accuracy}m", cause)