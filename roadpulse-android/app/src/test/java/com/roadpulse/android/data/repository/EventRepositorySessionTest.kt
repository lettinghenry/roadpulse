package com.roadpulse.android.data.repository

import com.roadpulse.android.data.database.RoadAnomalyDao
import com.roadpulse.android.data.model.RoadAnomalyEvent
import com.roadpulse.android.data.session.SessionManager
import io.kotest.core.spec.style.FunSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import io.kotest.matchers.nulls.shouldBeNull
import io.kotest.matchers.nulls.shouldNotBeNull
import io.mockk.coEvery
import io.mockk.coVerify
import io.mockk.mockk
import kotlinx.coroutines.test.StandardTestDispatcher
import java.time.Instant

class EventRepositorySessionTest : FunSpec({
    
    val testDispatcher = StandardTestDispatcher()
    val mockDao = mockk<RoadAnomalyDao>(relaxed = true)
    val sessionManager = SessionManager(testDispatcher)
    
    val repository = EventRepository(mockDao, sessionManager, testDispatcher)
    
    val sampleEvent = RoadAnomalyEvent(
        createdAt = Instant.now().toEpochMilli(),
        latitude = 37.7749,
        longitude = -122.4194,
        gpsAccuracyM = 5.0f,
        speedKmh = 50.0f,
        headingDeg = 90.0f,
        peakAccelMs2 = 3.5f,
        impulseDurationMs = 150,
        severity = 2,
        confidence = 0.8f,
        deviceModel = "Test Device",
        androidVersion = "13",
        sessionId = "test-session"
    )
    
    beforeEach {
        coEvery { mockDao.insertEvent(any()) } returns 1L
        coEvery { mockDao.getEventCount() } returns 0
    }
    
    test("should start new session and return session ID") {
        val sessionId = repository.startSession()
        
        sessionId.shouldNotBeNull()
        repository.hasActiveSession() shouldBe true
        repository.getCurrentSessionId() shouldBe sessionId
    }
    
    test("should end session") {
        repository.startSession()
        repository.hasActiveSession() shouldBe true
        
        repository.endSession()
        repository.hasActiveSession() shouldBe false
        repository.getCurrentSessionId().shouldBeNull()
    }
    
    test("should save event when session is active") {
        val sessionId = repository.startSession()
        
        val result = repository.saveEventIfSessionActive(sampleEvent)
        
        result.shouldNotBeNull()
        result shouldBe 1L
        coVerify { mockDao.insertEvent(match { it.sessionId == sessionId }) }
    }
    
    test("should not save event when no session is active") {
        repository.hasActiveSession() shouldBe false
        
        val result = repository.saveEventIfSessionActive(sampleEvent)
        
        result.shouldBeNull()
        coVerify(exactly = 0) { mockDao.insertEvent(any()) }
    }
    
    test("should update session activity when saving event") {
        val sessionId = repository.startSession()
        val initialSession = sessionManager.getCurrentSession()
        initialSession.shouldNotBeNull()
        
        // Small delay to ensure time difference
        kotlinx.coroutines.delay(10)
        
        repository.saveEventIfSessionActive(sampleEvent)
        
        val updatedSession = sessionManager.getCurrentSession()
        updatedSession.shouldNotBeNull()
        updatedSession!!.lastActivityTime shouldNotBe initialSession!!.lastActivityTime
    }
    
    test("should update session activity manually") {
        val sessionId = repository.startSession()
        val initialSession = sessionManager.getCurrentSession()
        initialSession.shouldNotBeNull()
        
        kotlinx.coroutines.delay(10)
        repository.updateSessionActivity()
        
        val updatedSession = sessionManager.getCurrentSession()
        updatedSession.shouldNotBeNull()
        updatedSession!!.lastActivityTime shouldNotBe initialSession!!.lastActivityTime
    }
})