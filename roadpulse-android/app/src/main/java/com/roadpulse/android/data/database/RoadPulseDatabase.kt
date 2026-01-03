package com.roadpulse.android.data.database

import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import android.content.Context
import com.roadpulse.android.data.model.RoadAnomalyEvent

/**
 * Room database for RoadPulse application.
 * Stores road anomaly events and related data locally.
 */
@Database(
    entities = [RoadAnomalyEvent::class],
    version = 1,
    exportSchema = false
)
@TypeConverters(DatabaseConverters::class)
abstract class RoadPulseDatabase : RoomDatabase() {
    
    abstract fun roadAnomalyDao(): RoadAnomalyDao
    
    companion object {
        private const val DATABASE_NAME = "roadpulse_database"
        
        @Volatile
        private var INSTANCE: RoadPulseDatabase? = null
        
        fun getDatabase(context: Context): RoadPulseDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    RoadPulseDatabase::class.java,
                    DATABASE_NAME
                )
                .fallbackToDestructiveMigration() // For development - remove in production
                .build()
                INSTANCE = instance
                instance
            }
        }
    }
}