package com.roadpulse.android.data.repository

import com.roadpulse.android.data.database.RoadAnomalyDao
import com.roadpulse.android.data.model.RoadAnomalyEvent
import com.roadpulse.android.data.session.SessionManager
import com.roadpulse.android.di.IoDispatcher
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.withContext
import java.time.Instant
import java.time.temporal.ChronoUnit
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Repository for managing road anomaly events.
 * Provides a clean API for data access and handles business logic.
 */
@Singleton
class EventRepository @Inject constructor(
    private val roadAnomalyDao: RoadAnomalyDao,
    private val sessionManager: SessionManager,
    @IoDispatcher private val ioDispatcher: CoroutineDispatcher
) {
    
    companion object {
        private const val MAX_EVENTS = 10000
        private const val RETENTION_DAYS = 30
    }
    
    /**
     * Save a new road anomaly event to the database
     */
    suspend fun saveEvent(event: RoadAnomalyEvent): Long = withContext(ioDispatcher) {
        // Check if we need to cleanup old events first
        val currentCount = roadAnomalyDao.getEventCount()
        if (currentCount >= MAX_EVENTS) {
            cleanupOldEvents()
        }
        
        roadAnomalyDao.insertEvent(event)
    }
    
    /**
     * Get all unsynced events for synchronization
     */
    suspend fun getUnsyncedEvents(): List<RoadAnomalyEvent> = withContext(ioDispatcher) {
        roadAnomalyDao.getUnsyncedEvents()
    }
    
    /**
     * Get events by session ID
     */
    suspend fun getEventsBySession(sessionId: String): List<RoadAnomalyEvent> = withContext(ioDispatcher) {
        roadAnomalyDao.getEventsBySession(sessionId)
    }
    
    /**
     * Mark an event as synced
     */
    suspend fun markEventSynced(eventId: String) = withContext(ioDispatcher) {
        roadAnomalyDao.markEventSynced(eventId)
    }
    
    /**
     * Mark multiple events as synced
     */
    suspend fun markEventsSynced(eventIds: List<String>) = withContext(ioDispatcher) {
        roadAnomalyDao.markEventsSynced(eventIds)
    }
    
    /**
     * Get count of unsynced events
     */
    suspend fun getUnsyncedEventCount(): Int = withContext(ioDispatcher) {
        roadAnomalyDao.getUnsyncedEventCount()
    }
    
    /**
     * Observe unsynced events count for UI updates
     */
    fun observeUnsyncedEventCount(): Flow<Int> {
        return roadAnomalyDao.observeUnsyncedEventCount()
    }
    
    /**
     * Clean up old synced events to maintain storage limits
     */
    suspend fun cleanupOldEvents(retentionDays: Int = RETENTION_DAYS) = withContext(ioDispatcher) {
        val cutoffTime = Instant.now().minus(retentionDays.toLong(), ChronoUnit.DAYS).toEpochMilli()
        roadAnomalyDao.deleteEventsOlderThan(cutoffTime)
        
        // If still over limit, delete oldest synced events
        val currentCount = roadAnomalyDao.getEventCount()
        if (currentCount >= MAX_EVENTS) {
            val eventsToDelete = currentCount - (MAX_EVENTS * 0.8).toInt() // Keep 80% of max
            roadAnomalyDao.deleteOldestSyncedEvents(eventsToDelete)
        }
    }
    
    /**
     * Get events within a time range
     */
    suspend fun getEventsByTimeRange(startTime: Long, endTime: Long): List<RoadAnomalyEvent> = withContext(ioDispatcher) {
        roadAnomalyDao.getEventsByTimeRange(startTime, endTime)
    }
    
    /**
     * Get events with minimum severity level
     */
    suspend fun getEventsBySeverity(minSeverity: Int): List<RoadAnomalyEvent> = withContext(ioDispatcher) {
        roadAnomalyDao.getEventsBySeverity(minSeverity)
    }
    
    /**
     * Delete all events (for testing/reset purposes)
     */
    suspend fun deleteAllEvents() = withContext(ioDispatcher) {
        roadAnomalyDao.deleteAllEvents()
    }
    
    /**
     * Start a new data collection session
     * @return The session ID for the new or resumed session
     */
    suspend fun startSession(): String = withContext(ioDispatcher) {
        sessionManager.startSession()
    }
    
    /**
     * End the current data collection session
     */
    suspend fun endSession() = withContext(ioDispatcher) {
        sessionManager.endSession()
    }
    
    /**
     * Get the current active session ID
     * @return Session ID if active, null otherwise
     */
    suspend fun getCurrentSessionId(): String? = withContext(ioDispatcher) {
        sessionManager.getCurrentSessionId()
    }
    
    /**
     * Check if there is an active session
     */
    suspend fun hasActiveSession(): Boolean = withContext(ioDispatcher) {
        sessionManager.hasActiveSession()
    }
    
    /**
     * Update activity for the current session to prevent timeout
     */
    suspend fun updateSessionActivity() = withContext(ioDispatcher) {
        sessionManager.updateActivity()
    }
    
    /**
     * Save an event only if there is an active session
     * This enforces the requirement that events should only be stored during active sessions
     */
    suspend fun saveEventIfSessionActive(event: RoadAnomalyEvent): Long? = withContext(ioDispatcher) {
        val sessionId = sessionManager.getCurrentSessionId()
        if (sessionId != null) {
            // Update session activity since we're processing an event
            sessionManager.updateActivity()
            
            // Ensure the event has the correct session ID
            val eventWithSession = event.copy(sessionId = sessionId)
            saveEvent(eventWithSession)
        } else {
            // No active session - don't save the event
            null
        }
    }
}