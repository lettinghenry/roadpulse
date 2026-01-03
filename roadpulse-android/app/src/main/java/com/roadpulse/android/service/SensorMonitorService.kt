package com.roadpulse.android.service

import android.app.Service
import android.content.Intent
import android.os.IBinder
import dagger.hilt.android.AndroidEntryPoint

/**
 * Foreground service for continuous sensor monitoring.
 * This is a placeholder implementation - full functionality will be added in later tasks.
 */
@AndroidEntryPoint
class SensorMonitorService : Service() {
    
    override fun onBind(intent: Intent?): IBinder? {
        return null
    }
    
    override fun onCreate() {
        super.onCreate()
        // Service initialization will be implemented in later tasks
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // Service start logic will be implemented in later tasks
        return START_STICKY
    }
    
    override fun onDestroy() {
        super.onDestroy()
        // Cleanup logic will be implemented in later tasks
    }
}