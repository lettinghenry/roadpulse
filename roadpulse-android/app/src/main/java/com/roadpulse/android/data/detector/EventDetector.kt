package com.roadpulse.android.data.detector

import com.roadpulse.android.data.model.DetectedEvent
import com.roadpulse.android.data.model.SensorData
import com.roadpulse.android.data.model.SensorQuality
import javax.inject.Inject
import javax.inject.Singleton

/**
 * EventDetector implements threshold-based detection of road anomaly events.
 * It processes sensor data streams to identify potential road surface anomalies
 * based on vertical acceleration thresholds and applies various filters to
 * reduce false positives.
 */
@Singleton
class EventDetector @Inject constructor() {
    
    companion object {
        private const val ACCELERATION_THRESHOLD = 2.5f // m/s²
        private const val MIN_DURATION_MS = 50
        private const val MAX_DURATION_MS = 500
        private const val MERGE_THRESHOLD_MS = 500
        private const val MIN_SPEED_KMH = 5.0f
    }
    
    private val recentEvents = mutableListOf<DetectedEvent>()
    private var lastEventTime = 0L
    
    /**
     * Processes sensor data to detect potential road anomaly events.
     * Applies threshold-based detection and various quality filters.
     * 
     * @param sensorData The current sensor data reading
     * @return DetectedEvent if an anomaly is detected, null otherwise
     */
    fun detectEvent(sensorData: SensorData): DetectedEvent? {
        // Check if we have valid location data
        val location = sensorData.location ?: return null
        
        // Apply speed-based filtering - ignore events at low speeds
        if (!location.isMovingFast()) {
            return null
        }
        
        // Apply GPS accuracy filtering (Requirements 8.1: 20-meter threshold)
        if (!location.hasGoodAccuracy()) {
            return null
        }
        
        // Check for device handling (rapid orientation changes) (Requirements 8.2)
        if (sensorData.gyroscope.isRapidOrientationChange()) {
            return null
        }
        
        // Calculate vertical acceleration
        val verticalAccel = sensorData.accelerometer.verticalAcceleration()
        
        // Check if acceleration exceeds threshold
        if (verticalAccel < ACCELERATION_THRESHOLD) {
            return null
        }
        
        // Create sensor quality assessment
        val sensorQuality = SensorQuality(
            accelerometerAccuracy = sensorData.accelerometer.accuracy,
            gyroscopeAccuracy = sensorData.gyroscope.accuracy,
            gpsAccuracy = location.accuracy,
            deviceStability = calculateDeviceStability(sensorData)
        )
        
        // Create detected event
        val detectedEvent = DetectedEvent(
            timestamp = sensorData.timestamp,
            peakAcceleration = verticalAccel,
            duration = estimateEventDuration(sensorData),
            location = location,
            sensorQuality = sensorQuality
        )
        
        // Validate the event meets basic criteria
        if (!detectedEvent.isValid()) {
            return null
        }
        
        // Check for consecutive event merging
        val mergedEvent = checkForConsecutiveEventMerging(detectedEvent)
        
        // Update tracking
        lastEventTime = sensorData.timestamp
        
        return mergedEvent
    }
    
    /**
     * Validates if a detected event meets all criteria for storage.
     * 
     * @param event The detected event to validate
     * @return true if the event is valid for storage
     */
    fun validateEvent(event: DetectedEvent): Boolean {
        return event.isValid() &&
               event.peakAcceleration >= ACCELERATION_THRESHOLD &&
               event.duration >= MIN_DURATION_MS &&
               event.duration <= MAX_DURATION_MS &&
               event.location?.hasGoodAccuracy() == true &&
               event.location.isMovingFast()
    }
    
    /**
     * Merges consecutive events that occur within the merge threshold.
     * 
     * @param events List of events to potentially merge
     * @return Single merged event or the original event if no merging needed
     */
    fun mergeConsecutiveEvents(events: List<DetectedEvent>): DetectedEvent {
        if (events.isEmpty()) {
            throw IllegalArgumentException("Cannot merge empty list of events")
        }
        
        if (events.size == 1) {
            return events.first()
        }
        
        // Sort events by timestamp
        val sortedEvents = events.sortedBy { it.timestamp }
        
        // Start with the first event
        var mergedEvent = sortedEvents.first()
        
        // Merge subsequent events if they're within the threshold
        for (i in 1 until sortedEvents.size) {
            val currentEvent = sortedEvents[i]
            if (mergedEvent.shouldMergeWith(currentEvent)) {
                mergedEvent = mergedEvent.mergeWith(currentEvent)
            } else {
                // If there's a gap, we can't merge all events
                break
            }
        }
        
        return mergedEvent
    }
    
    /**
     * Checks if the current event should be merged with recent events.
     * Maintains a sliding window of recent events for merging consideration.
     */
    private fun checkForConsecutiveEventMerging(newEvent: DetectedEvent): DetectedEvent {
        // Clean up old events outside merge window
        val cutoffTime = newEvent.timestamp - MERGE_THRESHOLD_MS
        recentEvents.removeAll { it.timestamp < cutoffTime }
        
        // Find events that can be merged with the new event
        val eventsToMerge = recentEvents.filter { it.shouldMergeWith(newEvent) }.toMutableList()
        eventsToMerge.add(newEvent)
        
        // If we have events to merge, merge them
        val finalEvent = if (eventsToMerge.size > 1) {
            mergeConsecutiveEvents(eventsToMerge)
        } else {
            newEvent
        }
        
        // Remove merged events from recent events and add the final event
        recentEvents.removeAll(eventsToMerge.dropLast(1)) // Remove all except the new event
        recentEvents.add(finalEvent)
        
        return finalEvent
    }
    
    /**
     * Estimates the duration of an event based on sensor data characteristics.
     * This is a simplified estimation - in a real implementation, this would
     * track the full duration of the acceleration spike.
     */
    private fun estimateEventDuration(sensorData: SensorData): Int {
        // Simplified duration estimation based on acceleration magnitude
        val accelMagnitude = sensorData.accelerometer.magnitude()
        return when {
            accelMagnitude > 15.0f -> 100 // High impact, short duration
            accelMagnitude > 10.0f -> 150 // Medium impact
            accelMagnitude > 5.0f -> 200  // Lower impact, longer duration
            else -> 250 // Very low impact
        }.coerceIn(MIN_DURATION_MS, MAX_DURATION_MS)
    }
    
    /**
     * Calculates device stability score based on gyroscope data.
     * Higher values indicate more stable device positioning.
     */
    private fun calculateDeviceStability(sensorData: SensorData): Float {
        val gyroMagnitude = sensorData.gyroscope.magnitude()
        return when {
            gyroMagnitude < 0.5f -> 1.0f  // Very stable
            gyroMagnitude < 1.0f -> 0.8f  // Stable
            gyroMagnitude < 2.0f -> 0.6f  // Moderately stable
            gyroMagnitude < 3.0f -> 0.4f  // Unstable
            else -> 0.2f                  // Very unstable
        }
    }
    
    /**
     * Clears the internal state of recent events.
     * Useful for testing or when starting a new session.
     */
    fun clearState() {
        recentEvents.clear()
        lastEventTime = 0L
    }
}