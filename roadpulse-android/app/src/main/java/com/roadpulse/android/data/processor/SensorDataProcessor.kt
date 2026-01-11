package com.roadpulse.android.data.processor

import com.roadpulse.android.data.error.ErrorHandler
import com.roadpulse.android.data.error.SensorCalibrationException
import com.roadpulse.android.data.model.AccelerometerData
import com.roadpulse.android.data.model.GyroscopeData
import com.roadpulse.android.data.model.SensorData
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton
import kotlin.math.*

/**
 * Processes raw sensor data with filtering, calibration, and motion state detection.
 * Implements Requirements 8.4 (sensor calibration) and 8.5 (multi-sensor consensus).
 */
@Singleton
class SensorDataProcessor @Inject constructor(
    private val errorHandler: ErrorHandler
) {
    
    // Calibration offsets for accelerometer
    private var accelOffsetX = 0.0f
    private var accelOffsetY = 0.0f
    private var accelOffsetZ = 0.0f
    
    // Calibration offsets for gyroscope
    private var gyroOffsetX = 0.0f
    private var gyroOffsetY = 0.0f
    private var gyroOffsetZ = 0.0f
    
    // Motion state tracking
    private val _motionState = MutableStateFlow(MotionState.STATIONARY)
    val motionState: StateFlow<MotionState> = _motionState.asStateFlow()
    
    // Device orientation tracking
    private val _deviceOrientation = MutableStateFlow(DeviceOrientation.UNKNOWN)
    val deviceOrientation: StateFlow<DeviceOrientation> = _deviceOrientation.asStateFlow()
    
    // Calibration state
    private var isCalibrated = false
    private val calibrationSamples = mutableListOf<SensorData>()
    private val maxCalibrationSamples = 100
    private var lastCalibrationTime = 0L
    private var calibrationAttempts = 0
    private val maxCalibrationAttempts = 3
    private val calibrationIntervalMs = 300000L // 5 minutes between attempts
    
    // Calibration issue detection
    private var calibrationIssueDetected = false
    private var lastCalibrationCheck = 0L
    private val calibrationCheckIntervalMs = 60000L // Check every minute
    private val calibrationDriftThreshold = 2.0f // m/s² for accelerometer drift
    private val gyroDriftThreshold = 0.5f // rad/s for gyroscope drift
    
    // Noise filtering - moving average buffers
    private val accelBuffer = CircularBuffer<AccelerometerData>(5)
    private val gyroBuffer = CircularBuffer<GyroscopeData>(5)
    
    // Motion detection parameters
    private val motionThreshold = 1.5f // m/s² for motion detection
    private val stationaryThreshold = 0.5f // m/s² for stationary detection
    private val orientationChangeThreshold = 2.0f // rad/s for device handling detection
    
    // Device handling suppression (Requirements 8.2)
    private val deviceHandlingSuppresionDurationMs = 3000L // 3 seconds
    private var lastDeviceHandlingTime = 0L
    
    /**
     * Processes raw sensor data with filtering and calibration
     * Includes automatic calibration issue detection
     */
    fun processSensorData(data: SensorData): ProcessedSensorData {
        // Check for calibration issues periodically
        checkCalibrationIssues(data)
        
        // Apply calibration if available
        val calibratedAccel = applyCalibratedAccelerometer(data.accelerometer)
        val calibratedGyro = applyCalibratedGyroscope(data.gyroscope)
        
        // Apply noise filtering
        val filteredAccel = applyNoiseFiltering(calibratedAccel)
        val filteredGyro = applyNoiseFiltering(calibratedGyro)
        
        // Update motion state
        updateMotionState(filteredAccel, filteredGyro)
        
        // Update device orientation
        updateDeviceOrientation(filteredAccel, filteredGyro)
        
        // Add sample for calibration if needed
        if (!isCalibrated || calibrationIssueDetected) {
            addCalibrationSample(data)
        }
        
        return ProcessedSensorData(
            timestamp = data.timestamp,
            accelerometer = filteredAccel,
            gyroscope = filteredGyro,
            location = data.location,
            motionState = _motionState.value,
            deviceOrientation = _deviceOrientation.value,
            isCalibrated = isCalibrated
        )
    }
    
    /**
     * Attempts automatic sensor calibration with enhanced error handling
     * Requirements 8.4: Automatic sensor recalibration
     */
    fun calibrateSensors(): Boolean {
        val currentTime = System.currentTimeMillis()
        
        // Check if we should attempt calibration
        if (!shouldAttemptCalibration(currentTime)) {
            return false
        }
        
        if (calibrationSamples.size < maxCalibrationSamples) {
            errorHandler.logError(
                SensorCalibrationException("Insufficient samples: ${calibrationSamples.size}/$maxCalibrationSamples"),
                "Calibration attempt"
            )
            return false
        }
        
        try {
            // Validate calibration samples quality
            if (!validateCalibrationSamples()) {
                errorHandler.logError(
                    SensorCalibrationException("Calibration samples quality insufficient"),
                    "Calibration validation"
                )
                calibrationSamples.clear()
                return false
            }
            
            // Calculate accelerometer offsets (assuming device is stationary)
            val accelSamples = calibrationSamples.map { it.accelerometer }
            val newAccelOffsetX = accelSamples.map { it.x }.average().toFloat()
            val newAccelOffsetY = accelSamples.map { it.y }.average().toFloat()
            val newAccelOffsetZ = accelSamples.map { it.z }.average().toFloat() - 9.81f // Gravity compensation
            
            // Calculate gyroscope offsets (assuming device is stationary)
            val gyroSamples = calibrationSamples.map { it.gyroscope }
            val newGyroOffsetX = gyroSamples.map { it.x }.average().toFloat()
            val newGyroOffsetY = gyroSamples.map { it.y }.average().toFloat()
            val newGyroOffsetZ = gyroSamples.map { it.z }.average().toFloat()
            
            // Validate new calibration values
            if (!validateCalibrationValues(newAccelOffsetX, newAccelOffsetY, newAccelOffsetZ,
                                         newGyroOffsetX, newGyroOffsetY, newGyroOffsetZ)) {
                errorHandler.logError(
                    SensorCalibrationException("Calibration values out of expected range"),
                    "Calibration validation"
                )
                calibrationSamples.clear()
                return false
            }
            
            // Apply new calibration values
            accelOffsetX = newAccelOffsetX
            accelOffsetY = newAccelOffsetY
            accelOffsetZ = newAccelOffsetZ
            gyroOffsetX = newGyroOffsetX
            gyroOffsetY = newGyroOffsetY
            gyroOffsetZ = newGyroOffsetZ
            
            isCalibrated = true
            calibrationIssueDetected = false
            lastCalibrationTime = currentTime
            calibrationAttempts = 0
            calibrationSamples.clear()
            
            return true
            
        } catch (e: Exception) {
            calibrationAttempts++
            errorHandler.logError(
                SensorCalibrationException("Calibration failed: ${e.message}", e),
                "Calibration attempt $calibrationAttempts"
            )
            calibrationSamples.clear()
            return false
        }
    }
    
    /**
     * Determines if the device is in a vehicle orientation
     */
    fun isDeviceInVehicle(): Boolean {
        return when (_deviceOrientation.value) {
            DeviceOrientation.VEHICLE_HORIZONTAL,
            DeviceOrientation.VEHICLE_DASHBOARD -> true
            else -> false
        }
    }
    
    /**
     * Detects current motion state based on sensor data
     * Requirements 8.5: Multi-sensor motion consensus
     */
    fun detectMotionState(): MotionState {
        return _motionState.value
    }
    
    /**
     * Checks if device is experiencing rapid orientation changes (device handling)
     * Requirements 8.2: Device handling spike suppression for 3 seconds
     */
    fun isDeviceHandling(gyroData: GyroscopeData): Boolean {
        val currentTime = System.currentTimeMillis()
        val isCurrentlyHandling = gyroData.magnitude() > orientationChangeThreshold
        
        if (isCurrentlyHandling) {
            lastDeviceHandlingTime = currentTime
            return true
        }
        
        // Check if we're still in the suppression period after device handling
        val timeSinceLastHandling = currentTime - lastDeviceHandlingTime
        return timeSinceLastHandling < deviceHandlingSuppresionDurationMs
    }
    
    /**
     * Adds sensor data for calibration with quality checks
     */
    fun addCalibrationSample(data: SensorData) {
        // Only add samples when device is stationary for better calibration
        if (_motionState.value == MotionState.STATIONARY && calibrationSamples.size < maxCalibrationSamples) {
            // Check if sample quality is good enough for calibration
            if (isGoodCalibrationSample(data)) {
                calibrationSamples.add(data)
            }
        }
    }
    
    /**
     * Checks for calibration issues and triggers recalibration if needed
     * Requirements 8.4: Sensor calibration issue detection
     */
    private fun checkCalibrationIssues(data: SensorData) {
        val currentTime = System.currentTimeMillis()
        
        // Only check periodically to avoid performance impact
        if (currentTime - lastCalibrationCheck < calibrationCheckIntervalMs) {
            return
        }
        
        lastCalibrationCheck = currentTime
        
        if (!isCalibrated) {
            return // Can't check issues if not calibrated yet
        }
        
        // Check for accelerometer drift
        val accelDrift = detectAccelerometerDrift(data.accelerometer)
        val gyroDrift = detectGyroscopeDrift(data.gyroscope)
        
        if (accelDrift > calibrationDriftThreshold || gyroDrift > gyroDriftThreshold) {
            calibrationIssueDetected = true
            errorHandler.logError(
                SensorCalibrationException("Calibration drift detected - accel: $accelDrift, gyro: $gyroDrift"),
                "Calibration monitoring"
            )
            
            // Attempt automatic recalibration
            attemptAutomaticRecalibration()
        }
    }
    
    /**
     * Attempts automatic recalibration when issues are detected
     */
    private fun attemptAutomaticRecalibration() {
        val currentTime = System.currentTimeMillis()
        
        // Don't attempt too frequently
        if (currentTime - lastCalibrationTime < calibrationIntervalMs) {
            return
        }
        
        // Don't exceed maximum attempts
        if (calibrationAttempts >= maxCalibrationAttempts) {
            errorHandler.logError(
                SensorCalibrationException("Maximum calibration attempts exceeded"),
                "Automatic recalibration"
            )
            return
        }
        
        // Clear existing samples and start fresh
        calibrationSamples.clear()
        
        // The calibration will happen automatically as new samples are added
        // when processSensorData is called
    }
    
    /**
     * Checks if we should attempt calibration based on timing and conditions
     */
    private fun shouldAttemptCalibration(currentTime: Long): Boolean {
        // Don't attempt too frequently
        if (currentTime - lastCalibrationTime < calibrationIntervalMs) {
            return false
        }
        
        // Don't exceed maximum attempts
        if (calibrationAttempts >= maxCalibrationAttempts) {
            return false
        }
        
        // Only calibrate when device is stationary
        if (_motionState.value != MotionState.STATIONARY) {
            return false
        }
        
        return true
    }
    
    /**
     * Validates the quality of calibration samples
     */
    private fun validateCalibrationSamples(): Boolean {
        if (calibrationSamples.isEmpty()) {
            return false
        }
        
        // Check that all samples are from stationary periods
        val hasMovingSamples = calibrationSamples.any { sample ->
            val accelMagnitude = sample.accelerometer.magnitude()
            val gyroMagnitude = sample.gyroscope.magnitude()
            accelMagnitude > motionThreshold || gyroMagnitude > 0.1f
        }
        
        if (hasMovingSamples) {
            return false
        }
        
        // Check sample variance - should be low for good calibration
        val accelVariance = calculateAccelerometerVariance()
        val gyroVariance = calculateGyroscopeVariance()
        
        return accelVariance < 1.0f && gyroVariance < 0.1f
    }
    
    /**
     * Validates new calibration values are within expected ranges
     */
    private fun validateCalibrationValues(
        accelX: Float, accelY: Float, accelZ: Float,
        gyroX: Float, gyroY: Float, gyroZ: Float
    ): Boolean {
        // Accelerometer offsets should be reasonable (within ±5 m/s²)
        if (abs(accelX) > 5.0f || abs(accelY) > 5.0f || abs(accelZ) > 5.0f) {
            return false
        }
        
        // Gyroscope offsets should be small (within ±1 rad/s)
        if (abs(gyroX) > 1.0f || abs(gyroY) > 1.0f || abs(gyroZ) > 1.0f) {
            return false
        }
        
        return true
    }
    
    /**
     * Checks if a sample is good quality for calibration
     */
    private fun isGoodCalibrationSample(data: SensorData): Boolean {
        // Check sensor accuracy
        if (data.accelerometer.accuracy < 2 || data.gyroscope.accuracy < 2) {
            return false
        }
        
        // Check that device is truly stationary
        val accelMagnitude = data.accelerometer.magnitude()
        val gyroMagnitude = data.gyroscope.magnitude()
        
        return accelMagnitude < stationaryThreshold && gyroMagnitude < 0.05f
    }
    
    /**
     * Detects accelerometer drift from expected values
     */
    private fun detectAccelerometerDrift(accel: AccelerometerData): Float {
        // Expected gravity vector when device is stationary and horizontal
        val expectedGravity = 9.81f
        val actualGravity = sqrt(accel.x * accel.x + accel.y * accel.y + accel.z * accel.z)
        
        return abs(actualGravity - expectedGravity)
    }
    
    /**
     * Detects gyroscope drift from expected zero values
     */
    private fun detectGyroscopeDrift(gyro: GyroscopeData): Float {
        // When stationary, gyroscope should read close to zero
        return gyro.magnitude()
    }
    
    /**
     * Calculates variance in accelerometer readings for calibration validation
     */
    private fun calculateAccelerometerVariance(): Float {
        if (calibrationSamples.size < 2) return Float.MAX_VALUE
        
        val accelSamples = calibrationSamples.map { it.accelerometer }
        val meanX = accelSamples.map { it.x }.average().toFloat()
        val meanY = accelSamples.map { it.y }.average().toFloat()
        val meanZ = accelSamples.map { it.z }.average().toFloat()
        
        val variance = accelSamples.map { accel ->
            val dx = accel.x - meanX
            val dy = accel.y - meanY
            val dz = accel.z - meanZ
            dx * dx + dy * dy + dz * dz
        }.average().toFloat()
        
        return variance
    }
    
    /**
     * Calculates variance in gyroscope readings for calibration validation
     */
    private fun calculateGyroscopeVariance(): Float {
        if (calibrationSamples.size < 2) return Float.MAX_VALUE
        
        val gyroSamples = calibrationSamples.map { it.gyroscope }
        val meanX = gyroSamples.map { it.x }.average().toFloat()
        val meanY = gyroSamples.map { it.y }.average().toFloat()
        val meanZ = gyroSamples.map { it.z }.average().toFloat()
        
        val variance = gyroSamples.map { gyro ->
            val dx = gyro.x - meanX
            val dy = gyro.y - meanY
            val dz = gyro.z - meanZ
            dx * dx + dy * dy + dz * dz
        }.average().toFloat()
        
        return variance
    }
    
    /**
     * Gets calibration status information
     */
    fun getCalibrationStatus(): CalibrationStatus {
        return CalibrationStatus(
            isCalibrated = isCalibrated,
            calibrationIssueDetected = calibrationIssueDetected,
            calibrationSampleCount = calibrationSamples.size,
            calibrationAttempts = calibrationAttempts,
            lastCalibrationTime = lastCalibrationTime,
            accelOffsets = Triple(accelOffsetX, accelOffsetY, accelOffsetZ),
            gyroOffsets = Triple(gyroOffsetX, gyroOffsetY, gyroOffsetZ)
        )
    }
    
    /**
     * Forces a recalibration attempt (for testing or manual trigger)
     */
    fun forceRecalibration() {
        calibrationIssueDetected = true
        calibrationAttempts = 0
        calibrationSamples.clear()
        lastCalibrationTime = 0L
    }
    
    private fun applyCalibratedAccelerometer(accel: AccelerometerData): AccelerometerData {
        return if (isCalibrated) {
            AccelerometerData(
                x = accel.x - accelOffsetX,
                y = accel.y - accelOffsetY,
                z = accel.z - accelOffsetZ,
                accuracy = accel.accuracy
            )
        } else {
            accel
        }
    }
    
    private fun applyCalibratedGyroscope(gyro: GyroscopeData): GyroscopeData {
        return if (isCalibrated) {
            GyroscopeData(
                x = gyro.x - gyroOffsetX,
                y = gyro.y - gyroOffsetY,
                z = gyro.z - gyroOffsetZ,
                accuracy = gyro.accuracy
            )
        } else {
            gyro
        }
    }
    
    private fun applyNoiseFiltering(accel: AccelerometerData): AccelerometerData {
        accelBuffer.add(accel)
        
        if (accelBuffer.size() < 3) {
            return accel // Not enough samples for filtering
        }
        
        val samples = accelBuffer.getAll()
        return AccelerometerData(
            x = samples.map { it.x }.average().toFloat(),
            y = samples.map { it.y }.average().toFloat(),
            z = samples.map { it.z }.average().toFloat(),
            accuracy = samples.map { it.accuracy }.maxOrNull() ?: accel.accuracy
        )
    }
    
    private fun applyNoiseFiltering(gyro: GyroscopeData): GyroscopeData {
        gyroBuffer.add(gyro)
        
        if (gyroBuffer.size() < 3) {
            return gyro // Not enough samples for filtering
        }
        
        val samples = gyroBuffer.getAll()
        return GyroscopeData(
            x = samples.map { it.x }.average().toFloat(),
            y = samples.map { it.y }.average().toFloat(),
            z = samples.map { it.z }.average().toFloat(),
            accuracy = samples.map { it.accuracy }.maxOrNull() ?: gyro.accuracy
        )
    }
    
    private fun updateMotionState(accel: AccelerometerData, gyro: GyroscopeData) {
        val accelMagnitude = accel.magnitude()
        val gyroMagnitude = gyro.magnitude()
        
        // Multi-sensor consensus for motion detection (Requirements 8.5)
        val accelIndicatesMotion = accelMagnitude > motionThreshold
        val gyroIndicatesMotion = gyroMagnitude > 0.1f // Small threshold for rotation
        
        val newState = when {
            accelIndicatesMotion && gyroIndicatesMotion -> MotionState.MOVING
            accelIndicatesMotion || gyroIndicatesMotion -> MotionState.TRANSITIONING
            accelMagnitude < stationaryThreshold && gyroMagnitude < 0.05f -> MotionState.STATIONARY
            else -> _motionState.value // Keep current state if unclear
        }
        
        _motionState.value = newState
    }
    
    private fun updateDeviceOrientation(accel: AccelerometerData, gyro: GyroscopeData) {
        // Determine device orientation based on accelerometer readings
        val gravityX = abs(accel.x)
        val gravityY = abs(accel.y)
        val gravityZ = abs(accel.z)
        
        val newOrientation = when {
            gravityZ > 8.0f && gravityX < 3.0f && gravityY < 3.0f -> DeviceOrientation.VEHICLE_HORIZONTAL
            gravityY > 8.0f && gravityX < 3.0f && gravityZ < 3.0f -> DeviceOrientation.VEHICLE_DASHBOARD
            gravityX > 8.0f -> DeviceOrientation.PORTRAIT_OR_LANDSCAPE
            isDeviceHandling(gyro) -> DeviceOrientation.HANDLING
            else -> DeviceOrientation.UNKNOWN
        }
        
        _deviceOrientation.value = newOrientation
    }
}

/**
 * Represents processed sensor data with additional computed information
 */
data class ProcessedSensorData(
    val timestamp: Long,
    val accelerometer: AccelerometerData,
    val gyroscope: GyroscopeData,
    val location: com.roadpulse.android.data.model.LocationData?,
    val motionState: MotionState,
    val deviceOrientation: DeviceOrientation,
    val isCalibrated: Boolean
)

/**
 * Motion states detected from sensor data
 */
enum class MotionState {
    STATIONARY,     // Device is not moving
    TRANSITIONING,  // Device is starting/stopping movement
    MOVING          // Device is in motion
}

/**
 * Device orientation states
 */
enum class DeviceOrientation {
    UNKNOWN,                // Cannot determine orientation
    VEHICLE_HORIZONTAL,     // Device lying flat (typical car mount)
    VEHICLE_DASHBOARD,      // Device on dashboard (vertical)
    PORTRAIT_OR_LANDSCAPE,  // Device held in hand
    HANDLING               // Device being actively handled/moved
}

/**
 * Simple circular buffer implementation for noise filtering
 */
private class CircularBuffer<T>(private val capacity: Int) {
    private val buffer = mutableListOf<T>()
    
    fun add(item: T) {
        if (buffer.size >= capacity) {
            buffer.removeAt(0)
        }
        buffer.add(item)
    }
    
    fun size(): Int = buffer.size
    
    fun getAll(): List<T> = buffer.toList()
}

/**
 * Represents the current calibration status
 */
data class CalibrationStatus(
    val isCalibrated: Boolean,
    val calibrationIssueDetected: Boolean,
    val calibrationSampleCount: Int,
    val calibrationAttempts: Int,
    val lastCalibrationTime: Long,
    val accelOffsets: Triple<Float, Float, Float>,
    val gyroOffsets: Triple<Float, Float, Float>
)