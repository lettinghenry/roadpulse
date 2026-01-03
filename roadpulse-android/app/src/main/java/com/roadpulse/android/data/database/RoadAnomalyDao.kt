package com.roadpulse.android.data.database

import androidx.room.*
import com.roadpulse.android.data.model.RoadAnomalyEvent
import kotlinx.coroutines.flow.Flow

/**
 * Data Access Object for road anomaly events.
 * Provides database operations for event storage and retrieval.
 */
@Dao
interface RoadAnomalyDao {
    
    /**
     * Insert a new road anomaly event
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEvent(event: RoadAnomalyEvent): Long
    
    /**
     * Insert multiple events in a single transaction
     */
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEvents(events: List<RoadAnomalyEvent>)
    
    /**
     * Get all unsynced events for synchronization
     */
    @Query("SELECT * FROM road_anomaly_events WHERE synced = 0 ORDER BY created_at ASC")
    suspend fun getUnsyncedEvents(): List<RoadAnomalyEvent>
    
    /**
     * Get events by session ID
     */
    @Query("SELECT * FROM road_anomaly_events WHERE session_id = :sessionId ORDER BY created_at ASC")
    suspend fun getEventsBySession(sessionId: String): List<RoadAnomalyEvent>
    
    /**
     * Mark an event as synced
     */
    @Query("UPDATE road_anomaly_events SET synced = 1 WHERE id = :eventId")
    suspend fun markEventSynced(eventId: String)
    
    /**
     * Mark multiple events as synced
     */
    @Query("UPDATE road_anomaly_events SET synced = 1 WHERE id IN (:eventIds)")
    suspend fun markEventsSynced(eventIds: List<String>)
    
    /**
     * Get total count of events
     */
    @Query("SELECT COUNT(*) FROM road_anomaly_events")
    suspend fun getEventCount(): Int
    
    /**
     * Get count of unsynced events
     */
    @Query("SELECT COUNT(*) FROM road_anomaly_events WHERE synced = 0")
    suspend fun getUnsyncedEventCount(): Int
    
    /**
     * Delete oldest synced events to free up space
     * @param limit Number of events to delete
     */
    @Query("DELETE FROM road_anomaly_events WHERE id IN (SELECT id FROM road_anomaly_events WHERE synced = 1 ORDER BY created_at ASC LIMIT :limit)")
    suspend fun deleteOldestSyncedEvents(limit: Int)
    
    /**
     * Delete events older than specified timestamp
     */
    @Query("DELETE FROM road_anomaly_events WHERE created_at < :timestamp AND synced = 1")
    suspend fun deleteEventsOlderThan(timestamp: Long)
    
    /**
     * Get events within a time range
     */
    @Query("SELECT * FROM road_anomaly_events WHERE created_at BETWEEN :startTime AND :endTime ORDER BY created_at ASC")
    suspend fun getEventsByTimeRange(startTime: Long, endTime: Long): List<RoadAnomalyEvent>
    
    /**
     * Get events with minimum severity level
     */
    @Query("SELECT * FROM road_anomaly_events WHERE severity >= :minSeverity ORDER BY created_at DESC")
    suspend fun getEventsBySeverity(minSeverity: Int): List<RoadAnomalyEvent>
    
    /**
     * Observe unsynced events count for UI updates
     */
    @Query("SELECT COUNT(*) FROM road_anomaly_events WHERE synced = 0")
    fun observeUnsyncedEventCount(): Flow<Int>
    
    /**
     * Delete all events (for testing/reset purposes)
     */
    @Query("DELETE FROM road_anomaly_events")
    suspend fun deleteAllEvents()
}