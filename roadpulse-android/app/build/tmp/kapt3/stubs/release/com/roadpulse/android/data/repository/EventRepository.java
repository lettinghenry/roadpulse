package com.roadpulse.android.data.repository;

/**
 * Repository for managing road anomaly events.
 * Provides a clean API for data access and handles business logic.
 */
@javax.inject.Singleton
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000H\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u0002\n\u0000\n\u0002\u0010\b\n\u0002\b\u0004\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000e\n\u0002\b\u0005\n\u0002\u0010\t\n\u0002\b\n\n\u0002\u0018\u0002\n\u0002\b\u0005\b\u0007\u0018\u0000 \'2\u00020\u0001:\u0001\'B\u0019\b\u0007\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\b\b\u0001\u0010\u0004\u001a\u00020\u0005\u00a2\u0006\u0002\u0010\u0006J\u0018\u0010\u0007\u001a\u00020\b2\b\b\u0002\u0010\t\u001a\u00020\nH\u0086@\u00a2\u0006\u0002\u0010\u000bJ\u000e\u0010\f\u001a\u00020\bH\u0086@\u00a2\u0006\u0002\u0010\rJ\u001c\u0010\u000e\u001a\b\u0012\u0004\u0012\u00020\u00100\u000f2\u0006\u0010\u0011\u001a\u00020\u0012H\u0086@\u00a2\u0006\u0002\u0010\u0013J\u001c\u0010\u0014\u001a\b\u0012\u0004\u0012\u00020\u00100\u000f2\u0006\u0010\u0015\u001a\u00020\nH\u0086@\u00a2\u0006\u0002\u0010\u000bJ$\u0010\u0016\u001a\b\u0012\u0004\u0012\u00020\u00100\u000f2\u0006\u0010\u0017\u001a\u00020\u00182\u0006\u0010\u0019\u001a\u00020\u0018H\u0086@\u00a2\u0006\u0002\u0010\u001aJ\u000e\u0010\u001b\u001a\u00020\nH\u0086@\u00a2\u0006\u0002\u0010\rJ\u0014\u0010\u001c\u001a\b\u0012\u0004\u0012\u00020\u00100\u000fH\u0086@\u00a2\u0006\u0002\u0010\rJ\u0016\u0010\u001d\u001a\u00020\b2\u0006\u0010\u001e\u001a\u00020\u0012H\u0086@\u00a2\u0006\u0002\u0010\u0013J\u001c\u0010\u001f\u001a\u00020\b2\f\u0010 \u001a\b\u0012\u0004\u0012\u00020\u00120\u000fH\u0086@\u00a2\u0006\u0002\u0010!J\f\u0010\"\u001a\b\u0012\u0004\u0012\u00020\n0#J\u0016\u0010$\u001a\u00020\u00182\u0006\u0010%\u001a\u00020\u0010H\u0086@\u00a2\u0006\u0002\u0010&R\u000e\u0010\u0004\u001a\u00020\u0005X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u00a8\u0006("}, d2 = {"Lcom/roadpulse/android/data/repository/EventRepository;", "", "roadAnomalyDao", "Lcom/roadpulse/android/data/database/RoadAnomalyDao;", "ioDispatcher", "Lkotlinx/coroutines/CoroutineDispatcher;", "(Lcom/roadpulse/android/data/database/RoadAnomalyDao;Lkotlinx/coroutines/CoroutineDispatcher;)V", "cleanupOldEvents", "", "retentionDays", "", "(ILkotlin/coroutines/Continuation;)Ljava/lang/Object;", "deleteAllEvents", "(Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "getEventsBySession", "", "Lcom/roadpulse/android/data/model/RoadAnomalyEvent;", "sessionId", "", "(Ljava/lang/String;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "getEventsBySeverity", "minSeverity", "getEventsByTimeRange", "startTime", "", "endTime", "(JJLkotlin/coroutines/Continuation;)Ljava/lang/Object;", "getUnsyncedEventCount", "getUnsyncedEvents", "markEventSynced", "eventId", "markEventsSynced", "eventIds", "(Ljava/util/List;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "observeUnsyncedEventCount", "Lkotlinx/coroutines/flow/Flow;", "saveEvent", "event", "(Lcom/roadpulse/android/data/model/RoadAnomalyEvent;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "Companion", "app_release"})
public final class EventRepository {
    @org.jetbrains.annotations.NotNull
    private final com.roadpulse.android.data.database.RoadAnomalyDao roadAnomalyDao = null;
    @org.jetbrains.annotations.NotNull
    private final kotlinx.coroutines.CoroutineDispatcher ioDispatcher = null;
    private static final int MAX_EVENTS = 10000;
    private static final int RETENTION_DAYS = 30;
    @org.jetbrains.annotations.NotNull
    public static final com.roadpulse.android.data.repository.EventRepository.Companion Companion = null;
    
    @javax.inject.Inject
    public EventRepository(@org.jetbrains.annotations.NotNull
    com.roadpulse.android.data.database.RoadAnomalyDao roadAnomalyDao, @com.roadpulse.android.di.IoDispatcher
    @org.jetbrains.annotations.NotNull
    kotlinx.coroutines.CoroutineDispatcher ioDispatcher) {
        super();
    }
    
    /**
     * Save a new road anomaly event to the database
     */
    @org.jetbrains.annotations.Nullable
    public final java.lang.Object saveEvent(@org.jetbrains.annotations.NotNull
    com.roadpulse.android.data.model.RoadAnomalyEvent event, @org.jetbrains.annotations.NotNull
    kotlin.coroutines.Continuation<? super java.lang.Long> $completion) {
        return null;
    }
    
    /**
     * Get all unsynced events for synchronization
     */
    @org.jetbrains.annotations.Nullable
    public final java.lang.Object getUnsyncedEvents(@org.jetbrains.annotations.NotNull
    kotlin.coroutines.Continuation<? super java.util.List<com.roadpulse.android.data.model.RoadAnomalyEvent>> $completion) {
        return null;
    }
    
    /**
     * Get events by session ID
     */
    @org.jetbrains.annotations.Nullable
    public final java.lang.Object getEventsBySession(@org.jetbrains.annotations.NotNull
    java.lang.String sessionId, @org.jetbrains.annotations.NotNull
    kotlin.coroutines.Continuation<? super java.util.List<com.roadpulse.android.data.model.RoadAnomalyEvent>> $completion) {
        return null;
    }
    
    /**
     * Mark an event as synced
     */
    @org.jetbrains.annotations.Nullable
    public final java.lang.Object markEventSynced(@org.jetbrains.annotations.NotNull
    java.lang.String eventId, @org.jetbrains.annotations.NotNull
    kotlin.coroutines.Continuation<? super kotlin.Unit> $completion) {
        return null;
    }
    
    /**
     * Mark multiple events as synced
     */
    @org.jetbrains.annotations.Nullable
    public final java.lang.Object markEventsSynced(@org.jetbrains.annotations.NotNull
    java.util.List<java.lang.String> eventIds, @org.jetbrains.annotations.NotNull
    kotlin.coroutines.Continuation<? super kotlin.Unit> $completion) {
        return null;
    }
    
    /**
     * Get count of unsynced events
     */
    @org.jetbrains.annotations.Nullable
    public final java.lang.Object getUnsyncedEventCount(@org.jetbrains.annotations.NotNull
    kotlin.coroutines.Continuation<? super java.lang.Integer> $completion) {
        return null;
    }
    
    /**
     * Observe unsynced events count for UI updates
     */
    @org.jetbrains.annotations.NotNull
    public final kotlinx.coroutines.flow.Flow<java.lang.Integer> observeUnsyncedEventCount() {
        return null;
    }
    
    /**
     * Clean up old synced events to maintain storage limits
     */
    @org.jetbrains.annotations.Nullable
    public final java.lang.Object cleanupOldEvents(int retentionDays, @org.jetbrains.annotations.NotNull
    kotlin.coroutines.Continuation<? super kotlin.Unit> $completion) {
        return null;
    }
    
    /**
     * Get events within a time range
     */
    @org.jetbrains.annotations.Nullable
    public final java.lang.Object getEventsByTimeRange(long startTime, long endTime, @org.jetbrains.annotations.NotNull
    kotlin.coroutines.Continuation<? super java.util.List<com.roadpulse.android.data.model.RoadAnomalyEvent>> $completion) {
        return null;
    }
    
    /**
     * Get events with minimum severity level
     */
    @org.jetbrains.annotations.Nullable
    public final java.lang.Object getEventsBySeverity(int minSeverity, @org.jetbrains.annotations.NotNull
    kotlin.coroutines.Continuation<? super java.util.List<com.roadpulse.android.data.model.RoadAnomalyEvent>> $completion) {
        return null;
    }
    
    /**
     * Delete all events (for testing/reset purposes)
     */
    @org.jetbrains.annotations.Nullable
    public final java.lang.Object deleteAllEvents(@org.jetbrains.annotations.NotNull
    kotlin.coroutines.Continuation<? super kotlin.Unit> $completion) {
        return null;
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u0014\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\b\n\u0002\b\u0002\b\u0086\u0003\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002R\u000e\u0010\u0003\u001a\u00020\u0004X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0005\u001a\u00020\u0004X\u0082T\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u0006"}, d2 = {"Lcom/roadpulse/android/data/repository/EventRepository$Companion;", "", "()V", "MAX_EVENTS", "", "RETENTION_DAYS", "app_release"})
    public static final class Companion {
        
        private Companion() {
            super();
        }
    }
}