package com.roadpulse.android.di

import android.content.Context
import androidx.room.Room
import com.roadpulse.android.data.database.RoadAnomalyDao
import com.roadpulse.android.data.database.RoadPulseDatabase
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

/**
 * Hilt module for database dependencies.
 */
@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {
    
    @Provides
    @Singleton
    fun provideRoadPulseDatabase(
        @ApplicationContext context: Context
    ): RoadPulseDatabase {
        return Room.databaseBuilder(
            context.applicationContext,
            RoadPulseDatabase::class.java,
            "roadpulse_database"
        )
        .fallbackToDestructiveMigration() // For development - remove in production
        .build()
    }
    
    @Provides
    fun provideRoadAnomalyDao(database: RoadPulseDatabase): RoadAnomalyDao {
        return database.roadAnomalyDao()
    }
}