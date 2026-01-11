package com.roadpulse.android.service

import android.content.Context
import android.content.Intent
import com.roadpulse.android.data.config.ConfigSnapshot
import com.roadpulse.android.data.config.SensorMonitorConfig
import com.roadpulse.android.data.repository.EventRepository
import com.roadpulse.android.di.IoDispatcher
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.CoroutineDispatcher
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Controller for managing the sensor monitoring service.
 * Provides user controls for starting, stopping, pausing, and configuring the service.
 */
@Singleton
class SensorMonitorController @Inject constructor(
    @ApplicationContext private val context: Context,
    private val config: SensorMonitorConfig,
    private val eventRepository: EventRepository,
    @IoDispatcher private val ioDispatcher: CoroutineDispatcher
) {
    
    private val controllerScope = CoroutineScope(ioDispatcher)
    
    // Service state tracking
    private val _serviceState = MutableStateFlow(ServiceState.STOPPED)
    val serviceState: StateFlow<ServiceState> = _serviceState.asStateFlow()
    
    private val _serviceStats = MutableStateFlow(ServiceStats())
    val serviceStats: StateFlow<ServiceStats> = _serviceStats.asStateFlow()
    
    /**
     * Start the sensor monitoring service
     */
    fun startMonitoring(): Boolean {
        return try {
            val intent = Intent(context, SensorMonitorService::class.java).apply {
                action = SensorMonitorService.ACTION_START_MONITORING
            }
            context.startForegroundService(intent)
            _serviceState.value = ServiceState.STARTING
            true
        } catch (e: Exception) {
            false
        }
    }
    
    /**
     * Stop the sensor monitoring service
     */
    fun stopMonitoring(): Boolean {
        return try {
            val intent = Intent(context, SensorMonitorService::class.java).apply {
                action = SensorMonitorService.ACTION_STOP_MONITORING
            }
            context.startService(intent)
            _serviceState.value = ServiceState.STOPPING
            true
        } catch (e: Exception) {
            false
        }
    }
    
    /**
     * Pause the sensor monitoring service
     */
    fun pauseMonitoring(): Boolean {
        return try {
            val intent = Intent(context, SensorMonitorService::class.java).apply {
                action = SensorMonitorService.ACTION_PAUSE_MONITORING
            }
            context.startService(intent)
            _serviceState.value = ServiceState.PAUSED
            true
        } catch (e: Exception) {
            false
        }
    }
    
    /**
     * Resume the sensor monitoring service
     */
    fun resumeMonitoring(): Boolean {
        return try {
            val intent = Intent(context, SensorMonitorService::class.java).apply {
                action = SensorMonitorService.ACTION_RESUME_MONITORING
            }
            context.startService(intent)
            _serviceState.value = ServiceState.RUNNING
            true
        } catch (e: Exception) {
            false
        }
    }
    
    /**
     * Get current service configuration
     */
    fun getCurrentConfig(): ConfigSnapshot {
        return config.getCurrentConfig()
    }
    
    /**
     * Update service configuration
     */
    suspend fun updateConfig(newConfig: ConfigSnapshot): Boolean = withContext(ioDispatcher) {
        val success = config.applyConfig(newConfig)
        if (success) {
            // If service is running, restart it to apply new configuration
            if (_serviceState.value == ServiceState.RUNNING) {
                stopMonitoring()
                // Note: In a real implementation, you might want to add a delay
                // or use a callback to ensure the service has stopped before restarting
                startMonitoring()
            }
        }
        success
    }
    
    /**
     * Reset configuration to defaults
     */
    suspend fun resetConfigToDefaults(): Boolean = withContext(ioDispatcher) {
        config.resetToDefaults()
        // If service is running, restart it to apply default configuration
        if (_serviceState.value == ServiceState.RUNNING) {
            stopMonitoring()
            startMonitoring()
        }
        true
    }
    
    /**
     * Get service statistics
     */
    suspend fun getServiceStats(): ServiceStats = withContext(ioDispatcher) {
        val unsyncedCount = eventRepository.getUnsyncedEventCount()
        val currentSessionId = eventRepository.getCurrentSessionId()
        val hasActiveSession = eventRepository.hasActiveSession()
        
        ServiceStats(
            unsyncedEventCount = unsyncedCount,
            currentSessionId = currentSessionId,
            hasActiveSession = hasActiveSession,
            serviceState = _serviceState.value
        )
    }
    
    /**
     * Observe unsynced event count
     */
    fun observeUnsyncedEventCount(): Flow<Int> {
        return eventRepository.observeUnsyncedEventCount()
    }
    
    /**
     * Update service state (called by the service)
     */
    fun updateServiceState(state: ServiceState) {
        _serviceState.value = state
    }
    
    /**
     * Update service statistics (called by the service)
     */
    fun updateServiceStats(stats: ServiceStats) {
        _serviceStats.value = stats
    }
    
    /**
     * Clean up old events
     */
    suspend fun cleanupOldEvents(): Boolean = withContext(ioDispatcher) {
        return@withContext try {
            eventRepository.cleanupOldEvents(config.retentionDays)
            true
        } catch (e: Exception) {
            false
        }
    }
    
    /**
     * Delete all events (for testing/reset purposes)
     */
    suspend fun deleteAllEvents(): Boolean = withContext(ioDispatcher) {
        return@withContext try {
            eventRepository.deleteAllEvents()
            true
        } catch (e: Exception) {
            false
        }
    }
    
    /**
     * Get events by session
     */
    suspend fun getEventsBySession(sessionId: String) = withContext(ioDispatcher) {
        eventRepository.getEventsBySession(sessionId)
    }
    
    /**
     * Get events by severity level
     */
    suspend fun getEventsBySeverity(minSeverity: Int) = withContext(ioDispatcher) {
        eventRepository.getEventsBySeverity(minSeverity)
    }
    
    /**
     * Get events within time range
     */
    suspend fun getEventsByTimeRange(startTime: Long, endTime: Long) = withContext(ioDispatcher) {
        eventRepository.getEventsByTimeRange(startTime, endTime)
    }
    
    /**
     * Check if the service is currently running
     */
    fun isServiceRunning(): Boolean {
        return _serviceState.value in listOf(ServiceState.RUNNING, ServiceState.STARTING)
    }
    
    /**
     * Check if the service is paused
     */
    fun isServicePaused(): Boolean {
        return _serviceState.value == ServiceState.PAUSED
    }
    
    /**
     * Check if the service is stopped
     */
    fun isServiceStopped(): Boolean {
        return _serviceState.value in listOf(ServiceState.STOPPED, ServiceState.STOPPING)
    }
}

/**
 * Represents the current state of the sensor monitoring service
 */
enum class ServiceState {
    STOPPED,    // Service is not running
    STARTING,   // Service is starting up
    RUNNING,    // Service is actively monitoring
    PAUSED,     // Service is paused (sensors stopped but service alive)
    STOPPING    // Service is shutting down
}

/**
 * Statistics about the sensor monitoring service
 */
data class ServiceStats(
    val unsyncedEventCount: Int = 0,
    val currentSessionId: String? = null,
    val hasActiveSession: Boolean = false,
    val serviceState: ServiceState = ServiceState.STOPPED,
    val eventsDetected: Int = 0,
    val eventsClassified: Int = 0,
    val eventsStored: Int = 0,
    val consecutiveErrors: Int = 0,
    val isDegradedMode: Boolean = false,
    val currentSamplingRateHz: Int = 50,
    val batteryLevel: Int = 100,
    val isCharging: Boolean = false,
    val hasAccelerometer: Boolean = true,
    val hasGyroscope: Boolean = true,
    val isLocationAvailable: Boolean = true
)