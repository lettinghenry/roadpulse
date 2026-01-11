package com.roadpulse.android.data.provider

import com.roadpulse.android.data.model.DetectedEvent
import com.roadpulse.android.data.model.LocationData
import com.roadpulse.android.data.model.RoadAnomalyEvent
import com.roadpulse.android.data.model.SensorQuality
import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import io.kotest.property.Arb
import io.kotest.property.arbitrary.*
import io.kotest.property.checkAll
import java.util.UUID

/**
 * Property-based tests for GPS data capture functionality.
 * Tests complete GPS metadata recording for detected events.
 */
class LocationProviderTest : StringSpec({

    /**
     * Property 10: Complete GPS Data Capture
     * Validates: Requirements 3.1, 3.2, 3.3, 3.4
     * Feature: sensor-data-collection, Property 10: Complete GPS Data Capture
     */
    "Property 10: For any detected road anomaly event, all GPS metadata should be recorded when GPS signal is available" {
        checkAll(
            iterations = 5,
            Arb.detectedEventWithGPS(), // Custom generator for events with GPS data
            Arb.string(1, 50), // sessionId
            Arb.int(1, 5), // severity
            Arb.float(0.0f, 1.0f) // confidence
        ) { detectedEvent, sessionId, severity, confidence ->
            
            // Verify the detected event has GPS location data
            detectedEvent.location shouldNotBe null
            val location = detectedEvent.location!!
            
            // Create a RoadAnomalyEvent from the DetectedEvent (simulating the event creation process)
            val roadAnomalyEvent = RoadAnomalyEvent.create(
                latitude = location.latitude,
                longitude = location.longitude,
                gpsAccuracyM = location.accuracy,
                speedKmh = location.speedKmh(),
                headingDeg = location.bearing,
                peakAccelMs2 = detectedEvent.peakAcceleration,
                impulseDurationMs = detectedEvent.duration,
                severity = severity,
                confidence = confidence,
                sessionId = sessionId
            )
            
            // Verify all GPS metadata is captured (Requirements 3.1, 3.2, 3.3, 3.4)
            
            // Requirement 3.1: Record current latitude and longitude coordinates
            roadAnomalyEvent.latitude shouldBe location.latitude
            roadAnomalyEvent.longitude shouldBe location.longitude
            
            // Requirement 3.2: Record GPS accuracy in meters
            roadAnomalyEvent.gpsAccuracyM shouldBe location.accuracy
            
            // Requirement 3.3: Record current vehicle speed in km/h
            roadAnomalyEvent.speedKmh shouldBe location.speedKmh()
            
            // Requirement 3.4: Record current heading in degrees
            roadAnomalyEvent.headingDeg shouldBe location.bearing
        }
    }
    
    "GPS data validation for LocationData" {
        checkAll(
            iterations = 5,
            Arb.validLocationData()
        ) { locationData ->
            
            // Verify GPS accuracy validation (Requirement 3.2)
            val hasGoodAccuracy = locationData.hasGoodAccuracy()
            if (locationData.accuracy <= 20.0f) {
                hasGoodAccuracy shouldBe true
            } else {
                hasGoodAccuracy shouldBe false
            }
            
            // Verify speed conversion (Requirement 3.3)
            val expectedSpeedKmh = locationData.speed * 3.6f
            locationData.speedKmh() shouldBe expectedSpeedKmh
            
            // Verify movement detection (related to speed requirement)
            val isMovingFast = locationData.isMovingFast()
            if (locationData.speedKmh() >= 5.0f) {
                isMovingFast shouldBe true
            } else {
                isMovingFast shouldBe false
            }
        }
    }
})

/**
 * Custom Arb generator for DetectedEvent with GPS location data
 */
fun Arb.Companion.detectedEventWithGPS(): Arb<DetectedEvent> {
    return Arb.bind(
        Arb.long(1000L, System.currentTimeMillis()), // timestamp
        Arb.float(2.5f, 20.0f), // peakAcceleration (above threshold)
        Arb.int(50, 500), // duration (valid range)
        Arb.validLocationData(), // location with GPS data
        Arb.sensorQuality() // sensor quality
    ) { timestamp, peakAcceleration, duration, location, sensorQuality ->
        DetectedEvent(
            timestamp = timestamp,
            peakAcceleration = peakAcceleration,
            duration = duration,
            location = location,
            sensorQuality = sensorQuality
        )
    }
}

/**
 * Custom Arb generator for valid LocationData with GPS information
 */
fun Arb.Companion.validLocationData(): Arb<LocationData> {
    return Arb.bind(
        Arb.double(-90.0, 90.0), // latitude (valid range)
        Arb.double(-180.0, 180.0), // longitude (valid range)
        Arb.float(0.1f, 50.0f), // accuracy in meters (reasonable GPS accuracy range)
        Arb.float(0.0f, 55.0f), // speed in m/s (0-200 km/h)
        Arb.float(0.0f, 360.0f), // bearing in degrees
        Arb.long(1000L, System.currentTimeMillis()) // timestamp
    ) { latitude, longitude, accuracy, speed, bearing, timestamp ->
        LocationData(
            latitude = latitude,
            longitude = longitude,
            accuracy = accuracy,
            speed = speed,
            bearing = bearing,
            timestamp = timestamp
        )
    }
}

/**
 * Custom Arb generator for SensorQuality
 */
fun Arb.Companion.sensorQuality(): Arb<SensorQuality> {
    return Arb.bind(
        Arb.int(0, 3), // accelerometerAccuracy (Android sensor accuracy scale)
        Arb.int(0, 3), // gyroscopeAccuracy (Android sensor accuracy scale)
        Arb.float(0.1f, 50.0f), // gpsAccuracy in meters
        Arb.float(0.0f, 1.0f) // deviceStability (0.0-1.0 scale)
    ) { accelerometerAccuracy, gyroscopeAccuracy, gpsAccuracy, deviceStability ->
        SensorQuality(
            accelerometerAccuracy = accelerometerAccuracy,
            gyroscopeAccuracy = gyroscopeAccuracy,
            gpsAccuracy = gpsAccuracy,
            deviceStability = deviceStability
        )
    }
}