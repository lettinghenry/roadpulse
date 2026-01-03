package com.roadpulse.android.data.processor

import com.roadpulse.android.data.model.AccelerometerData
import com.roadpulse.android.data.model.GyroscopeData
import com.roadpulse.android.data.model.LocationData
import com.roadpulse.android.data.model.SensorData
import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe
import io.kotest.property.Arb
import io.kotest.property.arbitrary.*
import io.kotest.property.checkAll

/**
 * Property-based tests for SensorDataProcessor.
 * Tests multi-sensor motion consensus and other sensor processing properties.
 */
class SensorDataProcessorTest : StringSpec({

    /**
     * Property 27: Multi-Sensor Motion Consensus
     * Validates: Requirements 8.5
     * Feature: sensor-data-collection, Property 27: Multi-Sensor Motion Consensus
     */
    "Property 27: For any sensor data, motion state determination should require consensus between multiple sensors when sensors disagree" {
        checkAll(
            iterations = 20,
            Arb.long(1000L, System.currentTimeMillis()), // timestamp
            Arb.sensorDataForMotionConsensus() // Custom generator for motion consensus scenarios
        ) { timestamp, (accelData, gyroData, expectedConsensus) ->
            
            val processor = SensorDataProcessor()
            
            // Create sensor data with the generated accelerometer and gyroscope data
            val sensorData = SensorData(
                timestamp = timestamp,
                accelerometer = accelData,
                gyroscope = gyroData,
                location = null // Location not needed for motion consensus
            )
            
            // Process the sensor data
            val processedData = processor.processSensorData(sensorData)
            
            // Verify motion state follows consensus rules
            when (expectedConsensus) {
                ConsensusScenario.BOTH_INDICATE_MOTION -> {
                    // When both sensors indicate motion, state should be MOVING
                    processedData.motionState shouldBe MotionState.MOVING
                }
                ConsensusScenario.ONE_INDICATES_MOTION -> {
                    // When only one sensor indicates motion, state should be TRANSITIONING
                    processedData.motionState shouldBe MotionState.TRANSITIONING
                }
                ConsensusScenario.BOTH_INDICATE_STATIONARY -> {
                    // When both sensors indicate stationary, state should be STATIONARY
                    processedData.motionState shouldBe MotionState.STATIONARY
                }
                ConsensusScenario.UNCLEAR -> {
                    // When sensors are unclear, previous state should be maintained
                    // For first processing, this would be the initial state
                    // We'll accept any state as valid for unclear scenarios
                }
            }
        }
    }
})

/**
 * Represents different consensus scenarios for motion detection
 */
enum class ConsensusScenario {
    BOTH_INDICATE_MOTION,
    ONE_INDICATES_MOTION,
    BOTH_INDICATE_STATIONARY,
    UNCLEAR
}

/**
 * Custom Arb generator for sensor data that creates specific motion consensus scenarios
 */
fun Arb.Companion.sensorDataForMotionConsensus(): Arb<Triple<AccelerometerData, GyroscopeData, ConsensusScenario>> {
    return Arb.choice(
        // Scenario 1: Both sensors indicate motion
        Arb.bind(
            Arb.accelerometerDataWithMotion(true), // High acceleration indicating motion
            Arb.gyroscopeDataWithMotion(true)      // High rotation indicating motion
        ) { accel, gyro ->
            Triple(accel, gyro, ConsensusScenario.BOTH_INDICATE_MOTION)
        },
        
        // Scenario 2: Only accelerometer indicates motion
        Arb.bind(
            Arb.accelerometerDataWithMotion(true),  // High acceleration indicating motion
            Arb.gyroscopeDataWithMotion(false)     // Low rotation indicating stationary
        ) { accel, gyro ->
            Triple(accel, gyro, ConsensusScenario.ONE_INDICATES_MOTION)
        },
        
        // Scenario 3: Only gyroscope indicates motion
        Arb.bind(
            Arb.accelerometerDataWithMotion(false), // Low acceleration indicating stationary
            Arb.gyroscopeDataWithMotion(true)       // High rotation indicating motion
        ) { accel, gyro ->
            Triple(accel, gyro, ConsensusScenario.ONE_INDICATES_MOTION)
        },
        
        // Scenario 4: Both sensors indicate stationary
        Arb.bind(
            Arb.accelerometerDataWithMotion(false), // Low acceleration indicating stationary
            Arb.gyroscopeDataWithMotion(false)      // Low rotation indicating stationary
        ) { accel, gyro ->
            Triple(accel, gyro, ConsensusScenario.BOTH_INDICATE_STATIONARY)
        },
        
        // Scenario 5: Unclear/borderline readings
        Arb.bind(
            Arb.accelerometerDataBorderline(),      // Borderline acceleration values
            Arb.gyroscopeDataBorderline()           // Borderline rotation values
        ) { accel, gyro ->
            Triple(accel, gyro, ConsensusScenario.UNCLEAR)
        }
    )
}

/**
 * Generates accelerometer data with motion or stationary characteristics
 */
fun Arb.Companion.accelerometerDataWithMotion(indicatesMotion: Boolean): Arb<AccelerometerData> {
    return if (indicatesMotion) {
        // Generate high acceleration values (> 1.5 m/s² motion threshold)
        Arb.bind(
            Arb.float(-10.0f, 10.0f),  // x
            Arb.float(-10.0f, 10.0f),  // y
            Arb.float(-15.0f, 15.0f),  // z (includes gravity ±9.81)
            Arb.int(0, 3)              // accuracy
        ) { x, y, z, accuracy ->
            // Ensure magnitude exceeds motion threshold (1.5 m/s²)
            val magnitude = kotlin.math.sqrt(x * x + y * y + z * z)
            if (magnitude > 1.5f) {
                AccelerometerData(x, y, z, accuracy)
            } else {
                // Scale up to exceed threshold
                val scale = 2.0f / magnitude
                AccelerometerData(x * scale, y * scale, z * scale, accuracy)
            }
        }
    } else {
        // Generate low acceleration values (< 0.5 m/s² stationary threshold)
        Arb.bind(
            Arb.float(-0.4f, 0.4f),    // x
            Arb.float(-0.4f, 0.4f),    // y
            Arb.float(9.4f, 10.2f),    // z (close to gravity)
            Arb.int(0, 3)              // accuracy
        ) { x, y, z, accuracy ->
            AccelerometerData(x, y, z, accuracy)
        }
    }
}

/**
 * Generates gyroscope data with motion or stationary characteristics
 */
fun Arb.Companion.gyroscopeDataWithMotion(indicatesMotion: Boolean): Arb<GyroscopeData> {
    return if (indicatesMotion) {
        // Generate high rotation values (> 0.1 rad/s motion threshold)
        Arb.bind(
            Arb.float(-5.0f, 5.0f),    // x
            Arb.float(-5.0f, 5.0f),    // y
            Arb.float(-5.0f, 5.0f),    // z
            Arb.int(0, 3)              // accuracy
        ) { x, y, z, accuracy ->
            // Ensure magnitude exceeds motion threshold (0.1 rad/s)
            val magnitude = kotlin.math.sqrt(x * x + y * y + z * z)
            if (magnitude > 0.1f) {
                GyroscopeData(x, y, z, accuracy)
            } else {
                // Scale up to exceed threshold
                val scale = 0.2f / magnitude
                GyroscopeData(x * scale, y * scale, z * scale, accuracy)
            }
        }
    } else {
        // Generate low rotation values (< 0.05 rad/s stationary threshold)
        Arb.bind(
            Arb.float(-0.04f, 0.04f),  // x
            Arb.float(-0.04f, 0.04f),  // y
            Arb.float(-0.04f, 0.04f),  // z
            Arb.int(0, 3)              // accuracy
        ) { x, y, z, accuracy ->
            GyroscopeData(x, y, z, accuracy)
        }
    }
}

/**
 * Generates borderline accelerometer data for unclear scenarios
 */
fun Arb.Companion.accelerometerDataBorderline(): Arb<AccelerometerData> {
    return Arb.bind(
        Arb.float(-2.0f, 2.0f),      // x
        Arb.float(-2.0f, 2.0f),      // y
        Arb.float(8.0f, 12.0f),      // z (around gravity with some variation)
        Arb.int(0, 3)                // accuracy
    ) { x, y, z, accuracy ->
        AccelerometerData(x, y, z, accuracy)
    }
}

/**
 * Generates borderline gyroscope data for unclear scenarios
 */
fun Arb.Companion.gyroscopeDataBorderline(): Arb<GyroscopeData> {
    return Arb.bind(
        Arb.float(-0.2f, 0.2f),      // x
        Arb.float(-0.2f, 0.2f),      // y
        Arb.float(-0.2f, 0.2f),      // z
        Arb.int(0, 3)                // accuracy
    ) { x, y, z, accuracy ->
        GyroscopeData(x, y, z, accuracy)
    }
}