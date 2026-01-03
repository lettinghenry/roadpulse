package com.roadpulse.android

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

/**
 * Application class for RoadPulse.
 * Initializes Hilt dependency injection.
 */
@HiltAndroidApp
class RoadPulseApplication : Application()