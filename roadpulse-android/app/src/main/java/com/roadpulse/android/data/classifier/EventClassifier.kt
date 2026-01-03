package com.roadpulse.android.data.classifier

import com.roadpulse.android.data.model.DetectedEvent
import com.roadpulse.android.data.model.RoadAnomalyEvent
import javax.inject.Inject
import javax.inject.Singleton

/**
 * EventClassifier assigns severity levels and confidence scores to detected road anomaly events.
 * It implements the classification algorithm based on peak acceleration ranges and calculates
 * confidence scores using GPS accuracy and sensor quality metrics.
 */
@Singleton
class EventClassifier @Inject constructor() {
    
    companion object {
        // Severity level thresholds based on peak acceleration (m/s²)
        private const val SEVERITY_1_MAX = 4.0f   // Minor bump
        private const val SEVERITY_2_MAX = 6.0f   // Moderate bump  
        private const val SEVERITY_3_MAX = 8.0f   // Significant pothole
        private const val SEVERITY_4_MAX = 12.0f  // Major pothole
        // Severity 5 is anything above 12.0 m/s² (Severe road damage)
        
        // Confidence calculation weights
        private const val GPS_WEIGHT = 0.4f
        private const val SENSOR_WEIGHT = 0.3f
        private const val STABILITY_WEIGHT = 0.3f
    }
    
    /**
     * Classifies a detected event by assigning severity level and confidence score.
     * 
     * @param event The detected event to classify
     * @param sessionId The current session ID to associate with the classified event
     * @return RoadAnomalyEvent with complete classification and metadata
     */
    fun classifyEvent(event: DetectedEvent, sessionId: String): RoadAnomalyEvent {
        val severity = calculateSeverity(event.peakAcceleration)
        val confidence = calculateConfidence(event)
        
        val location = event.location ?: throw IllegalArgumentException("Event must have location data")
        
        return RoadAnomalyEvent.create(
            latitude = location.latitude,
            longitude = location.longitude,
            gpsAccuracyM = location.accuracy,
            speedKmh = location.speedKmh(),
            headingDeg = location.bearing,
            peakAccelMs2 = event.peakAcceleration,
            impulseDurationMs = event.duration,
            severity = severity,
            confidence = confidence,
            sessionId = sessionId
        )
    }
    
    /**
     * Calculates severity level based on peak acceleration value.
     * Uses predefined acceleration ranges to assign severity levels 1-5.
     * 
     * @param peakAcceleration Peak acceleration value in m/s²
     * @return Severity level from 1 (minor) to 5 (severe)
     */
    fun calculateSeverity(peakAcceleration: Float): Int {
        return when {
            peakAcceleration < SEVERITY_1_MAX -> 1  // 2.5-4.0 m/s² - Minor bump
            peakAcceleration < SEVERITY_2_MAX -> 2  // 4.0-6.0 m/s² - Moderate bump
            peakAcceleration < SEVERITY_3_MAX -> 3  // 6.0-8.0 m/s² - Significant pothole
            peakAcceleration < SEVERITY_4_MAX -> 4  // 8.0-12.0 m/s² - Major pothole
            else -> 5                               // >12.0 m/s² - Severe road damage
        }
    }
    
    /**
     * Calculates confidence score based on signal quality and GPS accuracy.
     * Combines GPS accuracy, sensor accuracy, and device stability into a single score.
     * 
     * @param event The detected event with sensor quality information
     * @return Confidence score from 0.0 (low confidence) to 1.0 (high confidence)
     */
    fun calculateConfidence(event: DetectedEvent): Float {
        val location = event.location ?: return 0.0f
        
        // Calculate GPS accuracy score
        val gpsScore = calculateGpsAccuracyScore(location.accuracy)
        
        // Calculate sensor quality score
        val sensorScore = calculateSensorQualityScore(event.sensorQuality)
        
        // Device stability score is already provided in sensor quality
        val stabilityScore = event.sensorQuality.deviceStability
        
        // Weighted combination of all factors
        val confidence = (gpsScore * GPS_WEIGHT + 
                         sensorScore * SENSOR_WEIGHT + 
                         stabilityScore * STABILITY_WEIGHT)
        
        return confidence.coerceIn(0.0f, 1.0f)
    }
    
    /**
     * Converts GPS accuracy (in meters) to a normalized score (0.0-1.0).
     * Better accuracy (lower values) results in higher scores.
     */
    private fun calculateGpsAccuracyScore(accuracyMeters: Float): Float {
        return when {
            accuracyMeters <= 5f -> 1.0f    // Excellent accuracy
            accuracyMeters <= 10f -> 0.8f   // Good accuracy
            accuracyMeters <= 15f -> 0.7f   // Fair accuracy
            accuracyMeters <= 20f -> 0.6f   // Acceptable accuracy
            else -> 0.3f                    // Poor accuracy
        }
    }
    
    /**
     * Calculates sensor quality score based on accelerometer and gyroscope accuracy.
     * Android sensor accuracy values range from 0 (unreliable) to 3 (high accuracy).
     */
    private fun calculateSensorQualityScore(sensorQuality: com.roadpulse.android.data.model.SensorQuality): Float {
        // Convert Android accuracy values (0-3) to normalized scores
        val accelerometerScore = sensorQuality.accelerometerAccuracy / 3.0f
        val gyroscopeScore = sensorQuality.gyroscopeAccuracy / 3.0f
        
        // Average the two sensor scores
        return (accelerometerScore + gyroscopeScore) / 2.0f
    }
    
    /**
     * Validates that a classified event meets all quality criteria.
     * 
     * @param event The classified road anomaly event
     * @return true if the event meets quality standards
     */
    fun validateClassifiedEvent(event: RoadAnomalyEvent): Boolean {
        return event.severity in 1..5 &&
               event.confidence in 0.0f..1.0f &&
               event.peakAccelMs2 >= 2.5f &&
               event.gpsAccuracyM <= 20.0f &&
               event.speedKmh >= 5.0f &&
               event.impulseDurationMs in 50..500
    }
    
    /**
     * Provides a human-readable description of the severity level.
     * 
     * @param severity Severity level (1-5)
     * @return Human-readable severity description
     */
    fun getSeverityDescription(severity: Int): String {
        return when (severity) {
            1 -> "Minor bump"
            2 -> "Moderate bump"
            3 -> "Significant pothole"
            4 -> "Major pothole"
            5 -> "Severe road damage"
            else -> "Unknown severity"
        }
    }
    
    /**
     * Provides a human-readable description of the confidence level.
     * 
     * @param confidence Confidence score (0.0-1.0)
     * @return Human-readable confidence description
     */
    fun getConfidenceDescription(confidence: Float): String {
        return when {
            confidence >= 0.8f -> "High confidence"
            confidence >= 0.6f -> "Medium confidence"
            confidence >= 0.4f -> "Low confidence"
            else -> "Very low confidence"
        }
    }
}