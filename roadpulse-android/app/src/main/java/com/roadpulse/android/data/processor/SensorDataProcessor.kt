package com.roadpulse.android.data.processor

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
class SensorDataProcessor @Inject constructor() {
    
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
    
    // Noise filtering - moving average buffers
    private val accelBuffer = CircularBuffer<AccelerometerData>(5)
    private val gyroBuffer = CircularBuffer<GyroscopeData>(5)
    
    // Motion detection parameters
    private val motionThreshold = 1.5f // m/s² for motion detection
    private val stationaryThreshold = 0.5f // m/s² for stationary detection
    private val orientationChangeThreshold = 2.0f // rad/s for device handling detection
    
    /**
     * Processes raw sensor data with filtering and calibration
     */
    fun processSensorData(data: SensorData): ProcessedSensorData {
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
     * Attempts automatic sensor calibration
     * Requirements 8.4: Automatic sensor recalibration
     */
    fun calibrateSensors(): Boolean {
        if (calibrationSamples.size < maxCalibrationSamples) {
            return false // Not enough samples for calibration
        }
        
        // Calculate accelerometer offsets (assuming device is stationary)
        val accelSamples = calibrationSamples.map { it.accelerometer }
        accelOffsetX = accelSamples.map { it.x }.average().toFloat()
        accelOffsetY = accelSamples.map { it.y }.average().toFloat()
        accelOffsetZ = accelSamples.map { it.z }.average().toFloat() - 9.81f // Gravity compensation
        
        // Calculate gyroscope offsets (assuming device is stationary)
        val gyroSamples = calibrationSamples.map { it.gyroscope }
        gyroOffsetX = gyroSamples.map { it.x }.average().toFloat()
        gyroOffsetY = gyroSamples.map { it.y }.average().toFloat()
        gyroOffsetZ = gyroSamples.map { it.z }.average().toFloat()
        
        isCalibrated = true
        calibrationSamples.clear()
        
        return true
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
     */
    fun isDeviceHandling(gyroData: GyroscopeData): Boolean {
        return gyroData.magnitude() > orientationChangeThreshold
    }
    
    /**
     * Adds sensor data for calibration
     */
    fun addCalibrationSample(data: SensorData) {
        if (calibrationSamples.size < maxCalibrationSamples) {
            calibrationSamples.add(data)
        }
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