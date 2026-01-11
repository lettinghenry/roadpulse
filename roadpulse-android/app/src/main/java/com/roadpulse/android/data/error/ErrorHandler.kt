package com.roadpulse.android.data.error

import android.util.Log
import kotlinx.coroutines.delay
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.math.min
import kotlin.math.pow

/**
 * Centralized error handling and recovery strategies for sensor data collection
 */
@Singleton
class ErrorHandler @Inject constructor() {
    
    companion object {
        private const val TAG = "ErrorHandler"
        private const val MAX_RETRY_ATTEMPTS = 3
        private const val BASE_RETRY_DELAY_MS = 1000L
        private const val MAX_RETRY_DELAY_MS = 30000L
    }
    
    /**
     * Handles sensor-related errors with appropriate recovery strategies
     */
    suspend fun handleSensorError(error: SensorDataException): ErrorRecoveryResult {
        Log.w(TAG, "Handling sensor error: ${error.message}", error)
        
        return when (error) {
            is SensorUnavailableException -> handleSensorUnavailable(error)
            is SensorPermissionDeniedException -> handlePermissionDenied(error)
            is SensorCalibrationException -> handleCalibrationError(error)
            is StorageException -> handleStorageError(error)
            is SystemResourceException -> handleSystemResourceError(error)
            is LocationException -> handleLocationError(error)
            else -> ErrorRecoveryResult.UNRECOVERABLE
        }
    }
    
    /**
     * Executes an operation with retry logic and exponential backoff
     */
    suspend fun <T> executeWithRetry(
        operation: suspend () -> T,
        maxAttempts: Int = MAX_RETRY_ATTEMPTS,
        onError: (Exception, Int) -> Unit = { _, _ -> }
    ): Result<T> {
        var lastException: Exception? = null
        
        repeat(maxAttempts) { attempt ->
            try {
                return Result.success(operation())
            } catch (e: Exception) {
                lastException = e
                onError(e, attempt + 1)
                
                if (attempt < maxAttempts - 1) {
                    val delay = calculateRetryDelay(attempt)
                    Log.d(TAG, "Retrying operation in ${delay}ms (attempt ${attempt + 1}/$maxAttempts)")
                    delay(delay)
                }
            }
        }
        
        return Result.failure(lastException ?: Exception("Unknown error"))
    }
    
    /**
     * Handles graceful degradation when sensors are unavailable
     */
    private suspend fun handleSensorUnavailable(error: SensorUnavailableException): ErrorRecoveryResult {
        return when {
            error.message?.contains("accelerometer", ignoreCase = true) == true -> {
                Log.i(TAG, "Accelerometer unavailable, attempting gyroscope-only mode")
                ErrorRecoveryResult.DEGRADED_MODE
            }
            error.message?.contains("gyroscope", ignoreCase = true) == true -> {
                Log.i(TAG, "Gyroscope unavailable, using accelerometer-only mode")
                ErrorRecoveryResult.DEGRADED_MODE
            }
            error.message?.contains("gps", ignoreCase = true) == true -> {
                Log.i(TAG, "GPS unavailable, continuing sensor monitoring without location")
                ErrorRecoveryResult.DEGRADED_MODE
            }
            else -> {
                Log.e(TAG, "Critical sensor unavailable: ${error.message}")
                ErrorRecoveryResult.PAUSE_MONITORING
            }
        }
    }
    
    /**
     * Handles permission denied errors
     */
    private suspend fun handlePermissionDenied(error: SensorPermissionDeniedException): ErrorRecoveryResult {
        Log.w(TAG, "Permission denied: ${error.message}")
        return ErrorRecoveryResult.REQUEST_PERMISSION
    }
    
    /**
     * Handles sensor calibration errors
     */
    private suspend fun handleCalibrationError(error: SensorCalibrationException): ErrorRecoveryResult {
        Log.w(TAG, "Calibration error: ${error.message}")
        return ErrorRecoveryResult.RETRY_CALIBRATION
    }
    
    /**
     * Handles storage-related errors
     */
    private suspend fun handleStorageError(error: StorageException): ErrorRecoveryResult {
        return when (error) {
            is DatabaseCorruptionException -> {
                Log.e(TAG, "Database corruption detected, attempting repair")
                ErrorRecoveryResult.REPAIR_DATABASE
            }
            is StorageFullException -> {
                Log.w(TAG, "Storage full, triggering cleanup")
                ErrorRecoveryResult.CLEANUP_STORAGE
            }
            is StoragePermissionDeniedException -> {
                Log.w(TAG, "Storage permission denied")
                ErrorRecoveryResult.REQUEST_PERMISSION
            }
            else -> {
                Log.e(TAG, "Storage error: ${error.message}")
                ErrorRecoveryResult.RETRY_OPERATION
            }
        }
    }
    
    /**
     * Handles system resource constraint errors
     */
    private suspend fun handleSystemResourceError(error: SystemResourceException): ErrorRecoveryResult {
        return when (error) {
            is LowMemoryException -> {
                Log.w(TAG, "Low memory detected, reducing buffer sizes")
                ErrorRecoveryResult.REDUCE_MEMORY_USAGE
            }
            is CpuThrottlingException -> {
                Log.w(TAG, "CPU throttling detected, reducing sampling rate")
                ErrorRecoveryResult.REDUCE_CPU_USAGE
            }
            is BatteryCriticalException -> {
                Log.w(TAG, "Battery critical, pausing monitoring")
                ErrorRecoveryResult.PAUSE_MONITORING
            }
            else -> {
                Log.e(TAG, "System resource error: ${error.message}")
                ErrorRecoveryResult.REDUCE_RESOURCE_USAGE
            }
        }
    }
    
    /**
     * Handles location-related errors
     */
    private suspend fun handleLocationError(error: LocationException): ErrorRecoveryResult {
        return when (error) {
            is LocationPermissionDeniedException -> {
                Log.w(TAG, "Location permission denied")
                ErrorRecoveryResult.REQUEST_PERMISSION
            }
            is LocationUnavailableException -> {
                Log.w(TAG, "Location unavailable, continuing without GPS")
                ErrorRecoveryResult.DEGRADED_MODE
            }
            is GpsAccuracyException -> {
                Log.w(TAG, "GPS accuracy too poor: ${error.message}")
                ErrorRecoveryResult.WAIT_FOR_BETTER_SIGNAL
            }
            else -> {
                Log.e(TAG, "Location error: ${error.message}")
                ErrorRecoveryResult.RETRY_OPERATION
            }
        }
    }
    
    /**
     * Calculates retry delay with exponential backoff
     */
    private fun calculateRetryDelay(attempt: Int): Long {
        val delay = BASE_RETRY_DELAY_MS * (2.0.pow(attempt)).toLong()
        return min(delay, MAX_RETRY_DELAY_MS)
    }
    
    /**
     * Logs error for debugging and monitoring
     */
    fun logError(error: Throwable, context: String = "") {
        val contextInfo = if (context.isNotEmpty()) " [$context]" else ""
        Log.e(TAG, "Error$contextInfo: ${error.message}", error)
    }
    
    /**
     * Checks if an error is recoverable
     */
    fun isRecoverable(error: Throwable): Boolean {
        return when (error) {
            is SensorPermissionDeniedException,
            is LocationPermissionDeniedException,
            is StoragePermissionDeniedException -> false // Requires user action
            is DatabaseCorruptionException -> false // Requires database rebuild
            is BatteryCriticalException -> false // Requires charging
            else -> true
        }
    }
}

/**
 * Represents the result of error recovery attempts
 */
enum class ErrorRecoveryResult {
    RECOVERED,              // Error was successfully handled
    DEGRADED_MODE,          // Continue with reduced functionality
    RETRY_OPERATION,        // Retry the failed operation
    RETRY_CALIBRATION,      // Retry sensor calibration
    PAUSE_MONITORING,       // Temporarily pause monitoring
    REQUEST_PERMISSION,     // Request user permission
    REPAIR_DATABASE,        // Attempt database repair
    CLEANUP_STORAGE,        // Clean up storage space
    REDUCE_MEMORY_USAGE,    // Reduce memory consumption
    REDUCE_CPU_USAGE,       // Reduce CPU usage
    REDUCE_RESOURCE_USAGE,  // General resource reduction
    WAIT_FOR_BETTER_SIGNAL, // Wait for better GPS signal
    UNRECOVERABLE          // Error cannot be recovered
}