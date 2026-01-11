package com.roadpulse.android.data.monitor

import android.app.ActivityManager
import android.content.Context
import android.os.BatteryManager
import android.os.Build
import android.os.Debug
import android.os.PowerManager
import com.roadpulse.android.data.error.BatteryCriticalException
import com.roadpulse.android.data.error.CpuThrottlingException
import com.roadpulse.android.data.error.LowMemoryException
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Monitors system resources and detects constraint conditions
 */
@Singleton
class SystemResourceMonitor @Inject constructor(
    @ApplicationContext private val context: Context
) {
    
    companion object {
        private const val LOW_MEMORY_THRESHOLD_MB = 50
        private const val CRITICAL_BATTERY_THRESHOLD = 10
        private const val CPU_THROTTLING_THRESHOLD = 80 // Temperature threshold in Celsius
    }
    
    private val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
    private val batteryManager = context.getSystemService(Context.BATTERY_SERVICE) as BatteryManager
    private val powerManager = context.getSystemService(Context.POWER_SERVICE) as PowerManager
    
    private val _resourceState = MutableStateFlow(SystemResourceState())
    val resourceState: StateFlow<SystemResourceState> = _resourceState.asStateFlow()
    
    /**
     * Checks current system resource status and throws appropriate exceptions
     */
    suspend fun checkResourceConstraints() {
        val memoryInfo = getMemoryInfo()
        val batteryInfo = getBatteryInfo()
        val thermalInfo = getThermalInfo()
        
        val newState = SystemResourceState(
            availableMemoryMB = memoryInfo.availableMemoryMB,
            isLowMemory = memoryInfo.isLowMemory,
            batteryLevel = batteryInfo.level,
            isCharging = batteryInfo.isCharging,
            isBatteryCritical = batteryInfo.isCritical,
            thermalState = thermalInfo.state,
            isCpuThrottling = thermalInfo.isThrottling
        )
        
        _resourceState.value = newState
        
        // Throw exceptions for critical conditions
        when {
            newState.isBatteryCritical -> {
                throw BatteryCriticalException(newState.batteryLevel)
            }
            newState.isLowMemory -> {
                throw LowMemoryException()
            }
            newState.isCpuThrottling -> {
                throw CpuThrottlingException()
            }
        }
    }
    
    /**
     * Gets current memory information
     */
    fun getMemoryInfo(): MemoryInfo {
        val memInfo = ActivityManager.MemoryInfo()
        activityManager.getMemoryInfo(memInfo)
        
        val availableMemoryMB = memInfo.availMem / (1024 * 1024)
        val isLowMemory = memInfo.lowMemory || availableMemoryMB < LOW_MEMORY_THRESHOLD_MB
        
        return MemoryInfo(
            availableMemoryMB = availableMemoryMB.toInt(),
            totalMemoryMB = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.JELLY_BEAN) {
                (memInfo.totalMem / (1024 * 1024)).toInt()
            } else {
                -1 // Unknown on older versions
            },
            isLowMemory = isLowMemory,
            threshold = memInfo.threshold / (1024 * 1024)
        )
    }
    
    /**
     * Gets current battery information
     */
    fun getBatteryInfo(): BatteryInfo {
        val level = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            batteryManager.getIntProperty(BatteryManager.BATTERY_PROPERTY_CAPACITY)
        } else {
            50 // Default for older versions
        }
        
        val isCharging = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            batteryManager.isCharging
        } else {
            false // Default for older versions
        }
        
        return BatteryInfo(
            level = level,
            isCharging = isCharging,
            isCritical = level <= CRITICAL_BATTERY_THRESHOLD && !isCharging
        )
    }
    
    /**
     * Gets current thermal/CPU information
     */
    fun getThermalInfo(): ThermalInfo {
        val thermalState = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            powerManager.currentThermalStatus
        } else {
            PowerManager.THERMAL_STATUS_NONE
        }
        
        val isThrottling = thermalState >= PowerManager.THERMAL_STATUS_MODERATE
        
        return ThermalInfo(
            state = thermalState,
            isThrottling = isThrottling
        )
    }
    
    /**
     * Checks if the device is in power save mode
     */
    fun isPowerSaveMode(): Boolean {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            powerManager.isPowerSaveMode
        } else {
            false
        }
    }
    
    /**
     * Gets heap memory usage information
     */
    fun getHeapMemoryInfo(): HeapMemoryInfo {
        val runtime = Runtime.getRuntime()
        val maxMemory = runtime.maxMemory() / (1024 * 1024)
        val totalMemory = runtime.totalMemory() / (1024 * 1024)
        val freeMemory = runtime.freeMemory() / (1024 * 1024)
        val usedMemory = totalMemory - freeMemory
        
        return HeapMemoryInfo(
            maxMemoryMB = maxMemory.toInt(),
            totalMemoryMB = totalMemory.toInt(),
            usedMemoryMB = usedMemory.toInt(),
            freeMemoryMB = freeMemory.toInt(),
            usagePercentage = ((usedMemory.toFloat() / maxMemory.toFloat()) * 100).toInt()
        )
    }
    
    /**
     * Suggests resource optimization strategies based on current state
     */
    fun getOptimizationSuggestions(): List<OptimizationSuggestion> {
        val suggestions = mutableListOf<OptimizationSuggestion>()
        val state = _resourceState.value
        
        if (state.isLowMemory) {
            suggestions.add(OptimizationSuggestion.REDUCE_BUFFER_SIZES)
            suggestions.add(OptimizationSuggestion.INCREASE_GC_FREQUENCY)
        }
        
        if (state.isCpuThrottling) {
            suggestions.add(OptimizationSuggestion.REDUCE_SAMPLING_RATE)
            suggestions.add(OptimizationSuggestion.REDUCE_PROCESSING_FREQUENCY)
        }
        
        if (state.batteryLevel < 20 && !state.isCharging) {
            suggestions.add(OptimizationSuggestion.ENABLE_POWER_SAVE_MODE)
            suggestions.add(OptimizationSuggestion.REDUCE_GPS_FREQUENCY)
        }
        
        if (isPowerSaveMode()) {
            suggestions.add(OptimizationSuggestion.MINIMAL_BACKGROUND_PROCESSING)
        }
        
        return suggestions
    }
}

/**
 * Represents the current system resource state
 */
data class SystemResourceState(
    val availableMemoryMB: Int = 0,
    val isLowMemory: Boolean = false,
    val batteryLevel: Int = 100,
    val isCharging: Boolean = false,
    val isBatteryCritical: Boolean = false,
    val thermalState: Int = PowerManager.THERMAL_STATUS_NONE,
    val isCpuThrottling: Boolean = false
)

/**
 * Memory information
 */
data class MemoryInfo(
    val availableMemoryMB: Int,
    val totalMemoryMB: Int,
    val isLowMemory: Boolean,
    val threshold: Long
)

/**
 * Battery information
 */
data class BatteryInfo(
    val level: Int,
    val isCharging: Boolean,
    val isCritical: Boolean
)

/**
 * Thermal/CPU information
 */
data class ThermalInfo(
    val state: Int,
    val isThrottling: Boolean
)

/**
 * Heap memory information
 */
data class HeapMemoryInfo(
    val maxMemoryMB: Int,
    val totalMemoryMB: Int,
    val usedMemoryMB: Int,
    val freeMemoryMB: Int,
    val usagePercentage: Int
)

/**
 * Optimization suggestions based on resource constraints
 */
enum class OptimizationSuggestion {
    REDUCE_BUFFER_SIZES,
    INCREASE_GC_FREQUENCY,
    REDUCE_SAMPLING_RATE,
    REDUCE_PROCESSING_FREQUENCY,
    ENABLE_POWER_SAVE_MODE,
    REDUCE_GPS_FREQUENCY,
    MINIMAL_BACKGROUND_PROCESSING
}