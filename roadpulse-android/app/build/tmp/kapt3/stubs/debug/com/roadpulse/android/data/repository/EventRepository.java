package com.roadpulse.android.data.repository;

/**
 * Repository for managing road anomaly events.
 * Provides a clean API for data access and handles business logic.
 */
@javax.inject.Singleton
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000V\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u0002\n\u0000\n\u0002\u0010\b\n\u0002\b\u0005\n\u0002\u0010\u000e\n\u0000\n\u0002\u0010 \n\u0002\u0018\u0002\n\u0002\b\u0006\n\u0002\u0010\t\n\u0002\b\u0005\n\u0002\u0010\u000b\n\u0002\b\u0006\n\u0002\u0018\u0002\n\u0002\b\b\b\u0007\u0018\u0000 02\u00020\u0001:\u00010B!\b\u0007\u0012\u0006\u0010\u0002\u001a\u00020\u0003\u0012\u0006\u0010\u0004\u001a\u00020\u0005\u0012\b\b\u0001\u0010\u0006\u001a\u00020\u0007\u00a2\u0006\u0002\u0010\bJ\u0018\u0010\t\u001a\u00020\n2\b\b\u0002\u0010\u000b\u001a\u00020\fH\u0086@\u00a2\u0006\u0002\u0010\rJ\u000e\u0010\u000e\u001a\u00020\nH\u0086@\u00a2\u0006\u0002\u0010\u000fJ\u000e\u0010\u0010\u001a\u00020\nH\u0086@\u00a2\u0006\u0002\u0010\u000fJ\u0010\u0010\u0011\u001a\u0004\u0018\u00010\u0012H\u0086@\u00a2\u0006\u0002\u0010\u000fJ\u001c\u0010\u0013\u001a\b\u0012\u0004\u0012\u00020\u00150\u00142\u0006\u0010\u0016\u001a\u00020\u0012H\u0086@\u00a2\u0006\u0002\u0010\u0017J\u001c\u0010\u0018\u001a\b\u0012\u0004\u0012\u00020\u00150\u00142\u0006\u0010\u0019\u001a\u00020\fH\u0086@\u00a2\u0006\u0002\u0010\rJ$\u0010\u001a\u001a\b\u0012\u0004\u0012\u00020\u00150\u00142\u0006\u0010\u001b\u001a\u00020\u001c2\u0006\u0010\u001d\u001a\u00020\u001cH\u0086@\u00a2\u0006\u0002\u0010\u001eJ\u000e\u0010\u001f\u001a\u00020\fH\u0086@\u00a2\u0006\u0002\u0010\u000fJ\u0014\u0010 \u001a\b\u0012\u0004\u0012\u00020\u00150\u0014H\u0086@\u00a2\u0006\u0002\u0010\u000fJ\u000e\u0010!\u001a\u00020\"H\u0086@\u00a2\u0006\u0002\u0010\u000fJ\u0016\u0010#\u001a\u00020\n2\u0006\u0010$\u001a\u00020\u0012H\u0086@\u00a2\u0006\u0002\u0010\u0017J\u001c\u0010%\u001a\u00020\n2\f\u0010&\u001a\b\u0012\u0004\u0012\u00020\u00120\u0014H\u0086@\u00a2\u0006\u0002\u0010\'J\f\u0010(\u001a\b\u0012\u0004\u0012\u00020\f0)J\u0016\u0010*\u001a\u00020\u001c2\u0006\u0010+\u001a\u00020\u0015H\u0086@\u00a2\u0006\u0002\u0010,J\u0018\u0010-\u001a\u0004\u0018\u00010\u001c2\u0006\u0010+\u001a\u00020\u0015H\u0086@\u00a2\u0006\u0002\u0010,J\u000e\u0010.\u001a\u00020\u0012H\u0086@\u00a2\u0006\u0002\u0010\u000fJ\u0010\u0010/\u001a\u0004\u0018\u00010\nH\u0086@\u00a2\u0006\u0002\u0010\u000fR\u000e\u0010\u0006\u001a\u00020\u0007X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0004\u001a\u00020\u0005X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u00a8\u00061"}, d2 = {"Lcom/roadpulse/android/data/repository/EventRepository;", "", "roadAnomalyDao", "Lcom/roadpulse/android/data/database/RoadAnomalyDao;", "sessionManager", "Lcom/roadpulse/android/data/session/SessionManager;", "ioDispatcher", "Lkotlinx/coroutines/CoroutineDispatcher;", "(Lcom/roadpulse/android/data/database/RoadAnomalyDao;Lcom/roadpulse/android/data/session/SessionManager;Lkotlinx/coroutines/CoroutineDispatcher;)V", "cleanupOldEvents", "", "retentionDays", "", "(ILkotlin/coroutines/Continuation;)Ljava/lang/Object;", "deleteAllEvents", "(Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "endSession", "getCurrentSessionId", "", "getEventsBySession", "", "Lcom/roadpulse/android/data/model/RoadAnomalyEvent;", "sessionId", "(Ljava/lang/String;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "getEventsBySeverity", "minSeverity", "getEventsByTimeRange", "startTime", "", "endTime", "(JJLkotlin/coroutines/Continuation;)Ljava/lang/Object;", "getUnsyncedEventCount", "getUnsyncedEvents", "hasActiveSession", "", "markEventSynced", "eventId", "markEventsSynced", "eventIds", "(Ljava/util/List;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "observeUnsyncedEventCount", "Lkotlinx/coroutines/flow/Flow;", "saveEvent", "event", "(Lcom/roadpulse/android/data/model/RoadAnomalyEvent;Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "saveEventIfSessionActive", "startSession", "updateSessionActivity", "Companion", "app_debug"})
public final class EventRepository {
    @org.jetbrains.annotations.NotNull
    private final com.roadpulse.android.data.database.RoadAnomalyDao roadAnomalyDao = null;
    @org.jetbrains.annotations.NotNull
    private final com.roadpulse.android.data.session.SessionManager sessionManager = null;
    @org.jetbrains.annotations.NotNull
    private final kotlinx.coroutines.CoroutineDispatcher ioDispatcher = null;
    private static final int MAX_EVENTS = 10000;
    private static final int RETENTION_DAYS = 30;
    @org.jetbrains.annotations.NotNull
    public static final com.roadpulse.android.data.repository.EventRepository.Companion Companion = null;
    
    @javax.inject.Inject
    public EventRepository(@org.jetbrains.annotations.NotNull
    com.roadpulse.android.data.database.RoadAnomalyDao roadAnomalyDao, @org.jetbrains.annotations.NotNull
    com.roadpulse.android.data.session.SessionManager sessionManager, @com.roadpulse.android.di.IoDispatcher
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
    
    /**
     * Start a new data collection session
     * @return The session ID for the new or resumed session
     */
    @org.jetbrains.annotations.Nullable
    public final java.lang.Object startSession(@org.jetbrains.annotations.NotNull
    kotlin.coroutines.Continuation<? super java.lang.String> $completion) {
        return null;
    }
    
    /**
     * End the current data collection session
     */
    @org.jetbrains.annotations.Nullable
    public final java.lang.Object endSession(@org.jetbrains.annotations.NotNull
    kotlin.coroutines.Continuation<? super kotlin.Unit> $completion) {
        return null;
    }
    
    /**
     * Get the current active session ID
     * @return Session ID if active, null otherwise
     */
    @org.jetbrains.annotations.Nullable
    public final java.lang.Object getCurrentSessionId(@org.jetbrains.annotations.NotNull
    kotlin.coroutines.Continuation<? super java.lang.String> $completion) {
        return null;
    }
    
    /**
     * Check if there is an active session
     */
    @org.jetbrains.annotations.Nullable
    public final java.lang.Object hasActiveSession(@org.jetbrains.annotations.NotNull
    kotlin.coroutines.Continuation<? super java.lang.Boolean> $completion) {
        return null;
    }
    
    /**
     * Update activity for the current session to prevent timeout
     */
    @org.jetbrains.annotations.Nullable
    public final java.lang.Object updateSessionActivity(@org.jetbrains.annotations.NotNull
    kotlin.coroutines.Continuation<? super kotlin.Unit> $completion) {
        return null;
    }
    
    /**
     * Save an event only if there is an active session
     * This enforces the requirement that events should only be stored during active sessions
     */
    @org.jetbrains.annotations.Nullable
    public final java.lang.Object saveEventIfSessionActive(@org.jetbrains.annotations.NotNull
    com.roadpulse.android.data.model.RoadAnomalyEvent event, @org.jetbrains.annotations.NotNull
    kotlin.coroutines.Continuation<? super java.lang.Long> $completion) {
        return null;
    }
    
    @kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000\u0014\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0002\b\u0002\n\u0002\u0010\b\n\u0002\b\u0002\b\u0086\u0003\u0018\u00002\u00020\u0001B\u0007\b\u0002\u00a2\u0006\u0002\u0010\u0002R\u000e\u0010\u0003\u001a\u00020\u0004X\u0082T\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0005\u001a\u00020\u0004X\u0082T\u00a2\u0006\u0002\n\u0000\u00a8\u0006\u0006"}, d2 = {"Lcom/roadpulse/android/data/repository/EventRepository$Companion;", "", "()V", "MAX_EVENTS", "", "RETENTION_DAYS", "app_debug"})
    public static final class Companion {
        
        private Companion() {
            super();
        }
    }
}