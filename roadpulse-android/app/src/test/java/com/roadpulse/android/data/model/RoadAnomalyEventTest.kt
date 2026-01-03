package com.roadpulse.android.data.model

import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import io.kotest.property.Arb
import io.kotest.property.arbitrary.*
import io.kotest.property.checkAll
import org.junit.Test
import org.junit.Assert.*
import java.util.UUID

/**
 * Unit tests for RoadAnomalyEvent data model.
 */
class RoadAnomalyEventTest : StringSpec({
    
    "create event with factory method includes required fields" {
        val event = RoadAnomalyEvent.create(
            latitude = 37.7749,
            longitude = -122.4194,
            gpsAccuracyM = 5.0f,
            speedKmh = 50.0f,
            headingDeg = 90.0f,
            peakAccelMs2 = 3.5f,
            impulseDurationMs = 150,
            severity = 2,
            confidence = 0.8f,
            sessionId = UUID.randomUUID().toString()
        )
        
        event.id shouldNotBe null
        event.createdAt shouldNotBe 0
        event.latitude shouldBe 37.7749
        event.longitude shouldBe -122.4194
        event.gpsAccuracyM shouldBe 5.0f
        event.speedKmh shouldBe 50.0f
        event.headingDeg shouldBe 90.0f
        event.peakAccelMs2 shouldBe 3.5f
        event.impulseDurationMs shouldBe 150
        event.severity shouldBe 2
        event.confidence shouldBe 0.8f
        event.deviceModel shouldNotBe null
        event.androidVersion shouldNotBe null
        event.synced shouldBe false
    }
    
    "event id is unique for each instance" {
        val event1 = RoadAnomalyEvent.create(
            latitude = 37.7749,
            longitude = -122.4194,
            gpsAccuracyM = 5.0f,
            speedKmh = 50.0f,
            headingDeg = 90.0f,
            peakAccelMs2 = 3.5f,
            impulseDurationMs = 150,
            severity = 2,
            confidence = 0.8f,
            sessionId = UUID.randomUUID().toString()
        )
        
        val event2 = RoadAnomalyEvent.create(
            latitude = 37.7749,
            longitude = -122.4194,
            gpsAccuracyM = 5.0f,
            speedKmh = 50.0f,
            headingDeg = 90.0f,
            peakAccelMs2 = 3.5f,
            impulseDurationMs = 150,
            severity = 2,
            confidence = 0.8f,
            sessionId = UUID.randomUUID().toString()
        )
        
        event1.id shouldNotBe event2.id
    }

    /**
     * Property 14: Event Storage with UUID Generation
     * Validates: Requirements 5.1
     * Feature: sensor-data-collection, Property 14: Event Storage with UUID Generation
     */
    "Property 14: For any event parameters, created RoadAnomalyEvent should have unique auto-generated UUID" {
        checkAll(
            iterations = 100,
            Arb.double(-90.0, 90.0), // latitude
            Arb.double(-180.0, 180.0), // longitude
            Arb.float(0.1f, 100.0f), // gpsAccuracyM
            Arb.float(0.0f, 200.0f), // speedKmh
            Arb.float(0.0f, 360.0f).orNull(), // headingDeg
            Arb.float(2.5f, 20.0f), // peakAccelMs2
            Arb.int(50, 1000), // impulseDurationMs
            Arb.int(1, 5), // severity
            Arb.float(0.0f, 1.0f), // confidence
            Arb.uuid().map { it.toString() } // sessionId
        ) { latitude, longitude, gpsAccuracyM, speedKmh, headingDeg, peakAccelMs2, impulseDurationMs, severity, confidence, sessionId ->
            
            // Create multiple events with the same parameters
            val event1 = RoadAnomalyEvent.create(
                latitude = latitude,
                longitude = longitude,
                gpsAccuracyM = gpsAccuracyM,
                speedKmh = speedKmh,
                headingDeg = headingDeg,
                peakAccelMs2 = peakAccelMs2,
                impulseDurationMs = impulseDurationMs,
                severity = severity,
                confidence = confidence,
                sessionId = sessionId
            )
            
            val event2 = RoadAnomalyEvent.create(
                latitude = latitude,
                longitude = longitude,
                gpsAccuracyM = gpsAccuracyM,
                speedKmh = speedKmh,
                headingDeg = headingDeg,
                peakAccelMs2 = peakAccelMs2,
                impulseDurationMs = impulseDurationMs,
                severity = severity,
                confidence = confidence,
                sessionId = sessionId
            )
            
            // Verify each event has a valid UUID
            event1.id shouldNotBe null
            event2.id shouldNotBe null
            
            // Verify UUIDs are valid format
            UUID.fromString(event1.id) // Should not throw exception
            UUID.fromString(event2.id) // Should not throw exception
            
            // Verify UUIDs are unique even with identical parameters
            event1.id shouldNotBe event2.id
        }
    }
})