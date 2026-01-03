package com.roadpulse.android.data.database;

/**
 * Data Access Object for road anomaly events.
 * Provides database operations for event storage and retrieval.
 */
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000:\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0010\u0002\n\u0002\b\u0003\n\u0002\u0010\t\n\u0002\b\u0003\n\u0002\u0010\b\n\u0002\b\u0003\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0014\n\u0002\u0018\u0002\n\u0000\bg\u0018\u00002\u00020\u0001J\u000e\u0010\u0002\u001a\u00020\u0003H\u00a7@\u00a2\u0006\u0002\u0010\u0004J\u0016\u0010\u0005\u001a\u00020\u00032\u0006\u0010\u0006\u001a\u00020\u0007H\u00a7@\u00a2\u0006\u0002\u0010\bJ\u0016\u0010\t\u001a\u00020\u00032\u0006\u0010\n\u001a\u00020\u000bH\u00a7@\u00a2\u0006\u0002\u0010\fJ\u000e\u0010\r\u001a\u00020\u000bH\u00a7@\u00a2\u0006\u0002\u0010\u0004J\u001c\u0010\u000e\u001a\b\u0012\u0004\u0012\u00020\u00100\u000f2\u0006\u0010\u0011\u001a\u00020\u0012H\u00a7@\u00a2\u0006\u0002\u0010\u0013J\u001c\u0010\u0014\u001a\b\u0012\u0004\u0012\u00020\u00100\u000f2\u0006\u0010\u0015\u001a\u00020\u000bH\u00a7@\u00a2\u0006\u0002\u0010\fJ$\u0010\u0016\u001a\b\u0012\u0004\u0012\u00020\u00100\u000f2\u0006\u0010\u0017\u001a\u00020\u00072\u0006\u0010\u0018\u001a\u00020\u0007H\u00a7@\u00a2\u0006\u0002\u0010\u0019J\u000e\u0010\u001a\u001a\u00020\u000bH\u00a7@\u00a2\u0006\u0002\u0010\u0004J\u0014\u0010\u001b\u001a\b\u0012\u0004\u0012\u00020\u00100\u000fH\u00a7@\u00a2\u0006\u0002\u0010\u0004J\u0016\u0010\u001c\u001a\u00020\u00072\u0006\u0010\u001d\u001a\u00020\u0010H\u00a7@\u00a2\u0006\u0002\u0010\u001eJ\u001c\u0010\u001f\u001a\u00020\u00032\f\u0010 \u001a\b\u0012\u0004\u0012\u00020\u00100\u000fH\u00a7@\u00a2\u0006\u0002\u0010!J\u0016\u0010\"\u001a\u00020\u00032\u0006\u0010#\u001a\u00020\u0012H\u00a7@\u00a2\u0006\u0002\u0010\u0013J\u001c\u0010$\u001a\u00020\u00032\f\u0010%\u001a\b\u0012\u0004\u0012\u00020\u00120\u000fH\u00a7@\u00a2\u0006\u0002\u0010!J\u000e\u0010&\u001a\b\u0012\u0004\u0012\u00020\u000b0\'H\'\u00a8\u0006("}, d2 = {"Lcom/roadpulse/android/data/database/RoadAnomalyDao;", "", "deleteAllEvents", "", "(Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "deleteEventsOlderThan", "timestamp", "", "(JLkotlin/coroutines/Continuation;)Ljava/lang/Object;", "deleteOldestSyncedEvents", "limit", "", "(ILkotlin/coroutines/Continuation;)Ljava/lang/Object;", "getEventCount", "getEventsBySession", "", "Lcom/roadpulse/android/data/model/RoadAnomalyEvent;", "sessionId", "", "(Ljava/lang/String;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "getEventsBySeverity", "minSeverity", "getEventsByTimeRange", "startTime", "endTime", "(JJLkotlin/coroutines/Continuation;)Ljava/lang/Object;", "getUnsyncedEventCount", "getUnsyncedEvents", "insertEvent", "event", "(Lcom/roadpulse/android/data/model/RoadAnomalyEvent;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "insertEvents", "events", "(Ljava/util/List;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "markEventSynced", "eventId", "markEventsSynced", "eventIds", "observeUnsyncedEventCount", "Lkotlinx/coroutines/flow/Flow;", "app_release"})
@androidx.room.Dao
public abstract interface RoadAnomalyDao {
    
    /**
     * Insert a new road anomaly event
     */
    @androidx.room.Insert(onConflict = 1)
    @org.jetbrains.annotations.Nullable
    public abstract java.lang.Object insertEvent(@org.jetbrains.annotations.NotNull
    com.roadpulse.android.data.model.RoadAnomalyEvent event, @org.jetbrains.annotations.NotNull
    kotlin.coroutines.Continuation<? super java.lang.Long> $completion);
    
    /**
     * Insert multiple events in a single transaction
     */
    @androidx.room.Insert(onConflict = 1)
    @org.jetbrains.annotations.Nullable
    public abstract java.lang.Object insertEvents(@org.jetbrains.annotations.NotNull
    java.util.List<com.roadpulse.android.data.model.RoadAnomalyEvent> events, @org.jetbrains.annotations.NotNull
    kotlin.coroutines.Continuation<? super kotlin.Unit> $completion);
    
    /**
     * Get all unsynced events for synchronization
     */
    @androidx.room.Query(value = "SELECT * FROM road_anomaly_events WHERE synced = 0 ORDER BY created_at ASC")
    @org.jetbrains.annotations.Nullable
    public abstract java.lang.Object getUnsyncedEvents(@org.jetbrains.annotations.NotNull
    kotlin.coroutines.Continuation<? super java.util.List<com.roadpulse.android.data.model.RoadAnomalyEvent>> $completion);
    
    /**
     * Get events by session ID
     */
    @androidx.room.Query(value = "SELECT * FROM road_anomaly_events WHERE session_id = :sessionId ORDER BY created_at ASC")
    @org.jetbrains.annotations.Nullable
    public abstract java.lang.Object getEventsBySession(@org.jetbrains.annotations.NotNull
    java.lang.String sessionId, @org.jetbrains.annotations.NotNull
    kotlin.coroutines.Continuation<? super java.util.List<com.roadpulse.android.data.model.RoadAnomalyEvent>> $completion);
    
    /**
     * Mark an event as synced
     */
    @androidx.room.Query(value = "UPDATE road_anomaly_events SET synced = 1 WHERE id = :eventId")
    @org.jetbrains.annotations.Nullable
    public abstract java.lang.Object markEventSynced(@org.jetbrains.annotations.NotNull
    java.lang.String eventId, @org.jetbrains.annotations.NotNull
    kotlin.coroutines.Continuation<? super kotlin.Unit> $completion);
    
    /**
     * Mark multiple events as synced
     */
    @androidx.room.Query(value = "UPDATE road_anomaly_events SET synced = 1 WHERE id IN (:eventIds)")
    @org.jetbrains.annotations.Nullable
    public abstract java.lang.Object markEventsSynced(@org.jetbrains.annotations.NotNull
    java.util.List<java.lang.String> eventIds, @org.jetbrains.annotations.NotNull
    kotlin.coroutines.Continuation<? super kotlin.Unit> $completion);
    
    /**
     * Get total count of events
     */
    @androidx.room.Query(value = "SELECT COUNT(*) FROM road_anomaly_events")
    @org.jetbrains.annotations.Nullable
    public abstract java.lang.Object getEventCount(@org.jetbrains.annotations.NotNull
    kotlin.coroutines.Continuation<? super java.lang.Integer> $completion);
    
    /**
     * Get count of unsynced events
     */
    @androidx.room.Query(value = "SELECT COUNT(*) FROM road_anomaly_events WHERE synced = 0")
    @org.jetbrains.annotations.Nullable
    public abstract java.lang.Object getUnsyncedEventCount(@org.jetbrains.annotations.NotNull
    kotlin.coroutines.Continuation<? super java.lang.Integer> $completion);
    
    /**
     * Delete oldest synced events to free up space
     * @param limit Number of events to delete
     */
    @androidx.room.Query(value = "DELETE FROM road_anomaly_events WHERE id IN (SELECT id FROM road_anomaly_events WHERE synced = 1 ORDER BY created_at ASC LIMIT :limit)")
    @org.jetbrains.annotations.Nullable
    public abstract java.lang.Object deleteOldestSyncedEvents(int limit, @org.jetbrains.annotations.NotNull
    kotlin.coroutines.Continuation<? super kotlin.Unit> $completion);
    
    /**
     * Delete events older than specified timestamp
     */
    @androidx.room.Query(value = "DELETE FROM road_anomaly_events WHERE created_at < :timestamp AND synced = 1")
    @org.jetbrains.annotations.Nullable
    public abstract java.lang.Object deleteEventsOlderThan(long timestamp, @org.jetbrains.annotations.NotNull
    kotlin.coroutines.Continuation<? super kotlin.Unit> $completion);
    
    /**
     * Get events within a time range
     */
    @androidx.room.Query(value = "SELECT * FROM road_anomaly_events WHERE created_at BETWEEN :startTime AND :endTime ORDER BY created_at ASC")
    @org.jetbrains.annotations.Nullable
    public abstract java.lang.Object getEventsByTimeRange(long startTime, long endTime, @org.jetbrains.annotations.NotNull
    kotlin.coroutines.Continuation<? super java.util.List<com.roadpulse.android.data.model.RoadAnomalyEvent>> $completion);
    
    /**
     * Get events with minimum severity level
     */
    @androidx.room.Query(value = "SELECT * FROM road_anomaly_events WHERE severity >= :minSeverity ORDER BY created_at DESC")
    @org.jetbrains.annotations.Nullable
    public abstract java.lang.Object getEventsBySeverity(int minSeverity, @org.jetbrains.annotations.NotNull
    kotlin.coroutines.Continuation<? super java.util.List<com.roadpulse.android.data.model.RoadAnomalyEvent>> $completion);
    
    /**
     * Observe unsynced events count for UI updates
     */
    @androidx.room.Query(value = "SELECT COUNT(*) FROM road_anomaly_events WHERE synced = 0")
    @org.jetbrains.annotations.NotNull
    public abstract kotlinx.coroutines.flow.Flow<java.lang.Integer> observeUnsyncedEventCount();
    
    /**
     * Delete all events (for testing/reset purposes)
     */
    @androidx.room.Query(value = "DELETE FROM road_anomaly_events")
    @org.jetbrains.annotations.Nullable
    public abstract java.lang.Object deleteAllEvents(@org.jetbrains.annotations.NotNull
    kotlin.coroutines.Continuation<? super kotlin.Unit> $completion);
}