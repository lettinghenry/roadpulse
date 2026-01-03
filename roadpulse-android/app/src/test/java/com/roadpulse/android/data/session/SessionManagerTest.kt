package com.roadpulse.android.data.session

import io.kotest.core.spec.style.FunSpec
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import io.kotest.matchers.nulls.shouldBeNull
import io.kotest.matchers.nulls.shouldNotBeNull
import kotlinx.coroutines.delay
import kotlinx.coroutines.test.StandardTestDispatcher
import kotlinx.coroutines.test.runTest

class SessionManagerTest : FunSpec({
    
    val testDispatcher = StandardTestDispatcher()
    
    test("should create new session when starting") {
        val sessionManager = SessionManager(testDispatcher)
        
        val sessionId = sessionManager.startSession()
        
        sessionId.shouldNotBeNull()
        sessionManager.hasActiveSession() shouldBe true
        sessionManager.getCurrentSessionId() shouldBe sessionId
    }
    
    test("should return same session ID when session is still active") {
        val sessionManager = SessionManager(testDispatcher)
        
        val sessionId1 = sessionManager.startSession()
        val sessionId2 = sessionManager.startSession()
        
        sessionId1 shouldBe sessionId2
    }
    
    test("should update activity time when updateActivity is called") {
        val sessionManager = SessionManager(testDispatcher)
        
        val sessionId = sessionManager.startSession()
        val initialSession = sessionManager.getCurrentSession()
        initialSession.shouldNotBeNull()
        
        delay(100) // Small delay to ensure time difference
        sessionManager.updateActivity()
        
        val updatedSession = sessionManager.getCurrentSession()
        updatedSession.shouldNotBeNull()
        updatedSession!!.id shouldBe sessionId
        updatedSession.lastActivityTime shouldNotBe initialSession!!.lastActivityTime
    }
    
    test("should end session manually") {
        val sessionManager = SessionManager(testDispatcher)
        
        sessionManager.startSession()
        sessionManager.hasActiveSession() shouldBe true
        
        sessionManager.endSession()
        sessionManager.hasActiveSession() shouldBe false
        sessionManager.getCurrentSessionId().shouldBeNull()
    }
    
    test("should return session duration") {
        val sessionManager = SessionManager(testDispatcher)
        
        sessionManager.startSession()
        delay(100)
        
        val duration = sessionManager.getCurrentSessionDuration()
        duration.shouldNotBeNull()
        duration!! shouldNotBe 0L
    }
    
    test("should return time since last activity") {
        val sessionManager = SessionManager(testDispatcher)
        
        sessionManager.startSession()
        delay(100)
        
        val timeSinceActivity = sessionManager.getTimeSinceLastActivity()
        timeSinceActivity.shouldNotBeNull()
        timeSinceActivity!! shouldNotBe 0L
    }
    
    test("should return null for session info when no active session") {
        val sessionManager = SessionManager(testDispatcher)
        
        sessionManager.getCurrentSessionId().shouldBeNull()
        sessionManager.getCurrentSession().shouldBeNull()
        sessionManager.getCurrentSessionDuration().shouldBeNull()
        sessionManager.getTimeSinceLastActivity().shouldBeNull()
        sessionManager.hasActiveSession() shouldBe false
    }
})