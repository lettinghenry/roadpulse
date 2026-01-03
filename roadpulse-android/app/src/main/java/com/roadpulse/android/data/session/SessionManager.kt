package com.roadpulse.android.data.session

import com.roadpulse.android.di.IoDispatcher
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import java.time.Instant
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Manages driving sessions for road anomaly detection.
 * Handles session creation, timeout detection, and lifecycle management.
 */
@Singleton
class SessionManager @Inject constructor(
    @IoDispatcher private val ioDispatcher: CoroutineDispatcher
) {
    companion object {
        private const val SESSION_TIMEOUT_MS = 5 * 60 * 1000L // 5 minutes
    }
    
    private val mutex = Mutex()
    private var currentSession: Session? = null
    private var timeoutJob: Job? = null
    private val scope = CoroutineScope(ioDispatcher)
    
    /**
     * Represents an active driving session
     */
    data class Session(
        val id: String,
        val startTime: Long,
        var lastActivityTime: Long
    )
    
    /**
     * Start a new session or resume the current one if still active
     * @return The current session ID
     */
    suspend fun startSession(): String = mutex.withLock {
        val now = Instant.now().toEpochMilli()
        
        // Check if current session is still valid (within timeout)
        currentSession?.let { session ->
            if (now - session.lastActivityTime < SESSION_TIMEOUT_MS) {
                // Session is still active, update activity time
                session.lastActivityTime = now
                resetTimeoutTimer()
                return session.id
            }
        }
        
        // Create new session
        val newSession = Session(
            id = UUID.randomUUID().toString(),
            startTime = now,
            lastActivityTime = now
        )
        
        currentSession = newSession
        resetTimeoutTimer()
        
        return newSession.id
    }
    
    /**
     * Update the last activity time for the current session
     * This prevents session timeout while data collection is active
     */
    suspend fun updateActivity() = mutex.withLock {
        currentSession?.let { session ->
            session.lastActivityTime = Instant.now().toEpochMilli()
            resetTimeoutTimer()
        }
    }
    
    /**
     * Get the current active session ID, or null if no session is active
     */
    suspend fun getCurrentSessionId(): String? = mutex.withLock {
        val now = Instant.now().toEpochMilli()
        
        currentSession?.let { session ->
            if (now - session.lastActivityTime < SESSION_TIMEOUT_MS) {
                return session.id
            } else {
                // Session has timed out
                endCurrentSession()
                return null
            }
        }
        
        return null
    }
    
    /**
     * Check if there is an active session
     */
    suspend fun hasActiveSession(): Boolean = mutex.withLock {
        val now = Instant.now().toEpochMilli()
        
        currentSession?.let { session ->
            if (now - session.lastActivityTime < SESSION_TIMEOUT_MS) {
                return true
            } else {
                // Session has timed out
                endCurrentSession()
                return false
            }
        }
        
        return false
    }
    
    /**
     * Manually end the current session
     */
    suspend fun endSession() = mutex.withLock {
        endCurrentSession()
    }
    
    /**
     * Get session information for the current active session
     */
    suspend fun getCurrentSession(): Session? = mutex.withLock {
        val now = Instant.now().toEpochMilli()
        
        currentSession?.let { session ->
            if (now - session.lastActivityTime < SESSION_TIMEOUT_MS) {
                return session
            } else {
                // Session has timed out
                endCurrentSession()
                return null
            }
        }
        
        return null
    }
    
    /**
     * Get the duration of the current session in milliseconds
     */
    suspend fun getCurrentSessionDuration(): Long? = mutex.withLock {
        getCurrentSession()?.let { session ->
            return Instant.now().toEpochMilli() - session.startTime
        }
        return null
    }
    
    /**
     * Get the time since last activity in the current session
     */
    suspend fun getTimeSinceLastActivity(): Long? = mutex.withLock {
        getCurrentSession()?.let { session ->
            return Instant.now().toEpochMilli() - session.lastActivityTime
        }
        return null
    }
    
    /**
     * Internal method to end the current session
     */
    private fun endCurrentSession() {
        currentSession = null
        timeoutJob?.cancel()
        timeoutJob = null
    }
    
    /**
     * Reset the timeout timer for the current session
     */
    private fun resetTimeoutTimer() {
        timeoutJob?.cancel()
        timeoutJob = scope.launch {
            delay(SESSION_TIMEOUT_MS)
            mutex.withLock {
                // Double-check that session should timeout
                currentSession?.let { session ->
                    val now = Instant.now().toEpochMilli()
                    if (now - session.lastActivityTime >= SESSION_TIMEOUT_MS) {
                        endCurrentSession()
                    }
                }
            }
        }
    }
}