package com.roadpulse.android.data.config

import javax.inject.Inject
import javax.inject.Singleton

/**
 * Configuration class for sensor monitoring parameters.
 * Provides centralized configuration management with user-customizable settings.
 */
@Singleton
class SensorMonitorConfig @Inject constructor() {
    
    // Acceleration detection thresholds
    var accelerationThreshold: Float = 2.5f // m/s²
        private set
    
    var maxAccelerationThreshold: Float = 20.0f // m/s²
        private set
    
    // Sampling rates (in microseconds)
    var normalSamplingRate: Int = 20_000 // 50Hz
        private set
    
    var reducedSamplingRate: Int = 100_000 // 10Hz
        private set
    
    // Battery management thresholds
    var batteryPauseThreshold: Int = 15 // %
        private set
    
    var batteryResumeThreshold: Int = 20 // %
        private set
    
    // Motion detection timing
    var stationaryTimeoutMs: Long = 10 * 60 * 1000L // 10 minutes
        private set
    
    var samplingRateTransitionDelayMs: Long = 2000L // 2 seconds
        private set
    
    // GPS quality thresholds
    var gpsAccuracyThresholdM: Float = 20.0f // meters
        private set
    
    var minSpeedKmh: Float = 5.0f // km/h
        private set
    
    // Event detection parameters
    var eventMergeThresholdMs: Long = 500L // milliseconds
        private set
    
    var minEventDurationMs: Int = 50 // milliseconds
        private set
    
    var maxEventDurationMs: Int = 500 // milliseconds
        private set
    
    // Session management
    var sessionTimeoutMs: Long = 5 * 60 * 1000L // 5 minutes
        private set
    
    // Storage management
    var maxStoredEvents: Int = 10000
        private set
    
    var retentionDays: Int = 30
        private set
    
    // Device handling detection
    var deviceHandlingSuppressionMs: Long = 3000L // 3 seconds
        private set
    
    /**
     * Update acceleration threshold with validation
     */
    fun updateAccelerationThreshold(threshold: Float): Boolean {
        return if (threshold in 1.0f..10.0f) {
            accelerationThreshold = threshold
            true
        } else false
    }
    
    /**
     * Update normal sampling rate with validation
     */
    fun updateNormalSamplingRate(rateHz: Int): Boolean {
        return if (rateHz in 10..100) {
            normalSamplingRate = 1_000_000 / rateHz
            true
        } else false
    }
    
    /**
     * Update reduced sampling rate with validation
     */
    fun updateReducedSamplingRate(rateHz: Int): Boolean {
        return if (rateHz in 1..50) {
            reducedSamplingRate = 1_000_000 / rateHz
            true
        } else false
    }
    
    /**
     * Update battery pause threshold with validation
     */
    fun updateBatteryPauseThreshold(threshold: Int): Boolean {
        return if (threshold in 5..30 && threshold < batteryResumeThreshold) {
            batteryPauseThreshold = threshold
            true
        } else false
    }
    
    /**
     * Update battery resume threshold with validation
     */
    fun updateBatteryResumeThreshold(threshold: Int): Boolean {
        return if (threshold in 10..50 && threshold > batteryPauseThreshold) {
            batteryResumeThreshold = threshold
            true
        } else false
    }
    
    /**
     * Update GPS accuracy threshold with validation
     */
    fun updateGpsAccuracyThreshold(accuracyM: Float): Boolean {
        return if (accuracyM in 5.0f..100.0f) {
            gpsAccuracyThresholdM = accuracyM
            true
        } else false
    }
    
    /**
     * Update minimum speed threshold with validation
     */
    fun updateMinSpeedThreshold(speedKmh: Float): Boolean {
        return if (speedKmh in 0.0f..20.0f) {
            minSpeedKmh = speedKmh
            true
        } else false
    }
    
    /**
     * Update stationary timeout with validation
     */
    fun updateStationaryTimeout(timeoutMinutes: Int): Boolean {
        return if (timeoutMinutes in 1..60) {
            stationaryTimeoutMs = timeoutMinutes * 60 * 1000L
            true
        } else false
    }
    
    /**
     * Update session timeout with validation
     */
    fun updateSessionTimeout(timeoutMinutes: Int): Boolean {
        return if (timeoutMinutes in 1..30) {
            sessionTimeoutMs = timeoutMinutes * 60 * 1000L
            true
        } else false
    }
    
    /**
     * Update maximum stored events with validation
     */
    fun updateMaxStoredEvents(maxEvents: Int): Boolean {
        return if (maxEvents in 1000..50000) {
            maxStoredEvents = maxEvents
            true
        } else false
    }
    
    /**
     * Update retention days with validation
     */
    fun updateRetentionDays(days: Int): Boolean {
        return if (days in 1..365) {
            retentionDays = days
            true
        } else false
    }
    
    /**
     * Reset all settings to defaults
     */
    fun resetToDefaults() {
        accelerationThreshold = 2.5f
        maxAccelerationThreshold = 20.0f
        normalSamplingRate = 20_000
        reducedSamplingRate = 100_000
        batteryPauseThreshold = 15
        batteryResumeThreshold = 20
        stationaryTimeoutMs = 10 * 60 * 1000L
        samplingRateTransitionDelayMs = 2000L
        gpsAccuracyThresholdM = 20.0f
        minSpeedKmh = 5.0f
        eventMergeThresholdMs = 500L
        minEventDurationMs = 50
        maxEventDurationMs = 500
        sessionTimeoutMs = 5 * 60 * 1000L
        maxStoredEvents = 10000
        retentionDays = 30
        deviceHandlingSuppressionMs = 3000L
    }
    
    /**
     * Get current configuration as a data class for serialization
     */
    fun getCurrentConfig(): ConfigSnapshot {
        return ConfigSnapshot(
            accelerationThreshold = accelerationThreshold,
            normalSamplingRateHz = 1_000_000 / normalSamplingRate,
            reducedSamplingRateHz = 1_000_000 / reducedSamplingRate,
            batteryPauseThreshold = batteryPauseThreshold,
            batteryResumeThreshold = batteryResumeThreshold,
            stationaryTimeoutMinutes = (stationaryTimeoutMs / (60 * 1000)).toInt(),
            gpsAccuracyThresholdM = gpsAccuracyThresholdM,
            minSpeedKmh = minSpeedKmh,
            sessionTimeoutMinutes = (sessionTimeoutMs / (60 * 1000)).toInt(),
            maxStoredEvents = maxStoredEvents,
            retentionDays = retentionDays
        )
    }
    
    /**
     * Apply configuration from snapshot with validation
     */
    fun applyConfig(config: ConfigSnapshot): Boolean {
        return try {
            updateAccelerationThreshold(config.accelerationThreshold) &&
            updateNormalSamplingRate(config.normalSamplingRateHz) &&
            updateReducedSamplingRate(config.reducedSamplingRateHz) &&
            updateBatteryPauseThreshold(config.batteryPauseThreshold) &&
            updateBatteryResumeThreshold(config.batteryResumeThreshold) &&
            updateStationaryTimeout(config.stationaryTimeoutMinutes) &&
            updateGpsAccuracyThreshold(config.gpsAccuracyThresholdM) &&
            updateMinSpeedThreshold(config.minSpeedKmh) &&
            updateSessionTimeout(config.sessionTimeoutMinutes) &&
            updateMaxStoredEvents(config.maxStoredEvents) &&
            updateRetentionDays(config.retentionDays)
        } catch (e: Exception) {
            false
        }
    }
}

/**
 * Immutable snapshot of configuration for serialization
 */
data class ConfigSnapshot(
    val accelerationThreshold: Float,
    val normalSamplingRateHz: Int,
    val reducedSamplingRateHz: Int,
    val batteryPauseThreshold: Int,
    val batteryResumeThreshold: Int,
    val stationaryTimeoutMinutes: Int,
    val gpsAccuracyThresholdM: Float,
    val minSpeedKmh: Float,
    val sessionTimeoutMinutes: Int,
    val maxStoredEvents: Int,
    val retentionDays: Int
)