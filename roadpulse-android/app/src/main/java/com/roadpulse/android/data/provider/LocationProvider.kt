package com.roadpulse.android.data.provider

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Location
import android.os.Looper
import androidx.core.app.ActivityCompat
import com.google.android.gms.location.*
import com.roadpulse.android.data.model.LocationData
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.callbackFlow
import javax.inject.Inject
import javax.inject.Singleton

/**
 * Manages GPS location services with accuracy monitoring and permission handling.
 * Implements Requirements 3.1, 3.2, 3.3, 3.4, 3.5 for GPS data capture and availability.
 */
@Singleton
class LocationProvider @Inject constructor(
    @ApplicationContext private val context: Context
) {
    
    private val fusedLocationClient: FusedLocationProviderClient = 
        LocationServices.getFusedLocationProviderClient(context)
    
    private val _currentLocation = MutableStateFlow<LocationData?>(null)
    val currentLocation: StateFlow<LocationData?> = _currentLocation.asStateFlow()
    
    private val _isLocationAvailable = MutableStateFlow(false)
    val isLocationAvailable: StateFlow<Boolean> = _isLocationAvailable.asStateFlow()
    
    private var locationCallback: LocationCallback? = null
    private var isUpdatesStarted = false
    
    // Location request configuration
    private val locationRequest = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 5000L) // 5 second intervals
        .setWaitForAccurateLocation(false)
        .setMinUpdateIntervalMillis(1000L) // Minimum 1 second between updates
        .setMaxUpdateDelayMillis(10000L) // Maximum 10 second delay
        .build()
    
    /**
     * Gets the current location if available
     * Requirements 3.1: Record current latitude and longitude coordinates
     */
    fun getCurrentLocation(): LocationData? {
        return _currentLocation.value
    }
    
    /**
     * Checks if location services are available and permissions are granted
     * Requirements 3.5: Handle GPS signal unavailability
     */
    fun isLocationAvailable(): Boolean {
        return hasLocationPermission() && isLocationEnabled()
    }
    
    /**
     * Gets the current GPS accuracy in meters
     * Requirements 3.2: Record GPS accuracy in meters
     */
    fun getLocationAccuracy(): Float {
        return _currentLocation.value?.accuracy ?: Float.MAX_VALUE
    }
    
    /**
     * Starts location updates with maximum 5-second intervals
     * Requirements 3.1, 3.2, 3.3, 3.4: GPS data capture
     */
    fun startLocationUpdates() {
        if (isUpdatesStarted || !hasLocationPermission()) {
            return
        }
        
        locationCallback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult) {
                locationResult.lastLocation?.let { location ->
                    updateLocationData(location)
                }
            }
            
            override fun onLocationAvailability(locationAvailability: LocationAvailability) {
                _isLocationAvailable.value = locationAvailability.isLocationAvailable
            }
        }
        
        try {
            fusedLocationClient.requestLocationUpdates(
                locationRequest,
                locationCallback!!,
                Looper.getMainLooper()
            )
            isUpdatesStarted = true
            _isLocationAvailable.value = true
        } catch (securityException: SecurityException) {
            _isLocationAvailable.value = false
        }
    }
    
    /**
     * Stops location updates to conserve battery
     */
    fun stopLocationUpdates() {
        locationCallback?.let { callback ->
            fusedLocationClient.removeLocationUpdates(callback)
            locationCallback = null
            isUpdatesStarted = false
            _isLocationAvailable.value = false
        }
    }
    
    /**
     * Gets a flow of location updates
     * Requirements 3.1, 3.2, 3.3, 3.4: Continuous GPS tracking
     */
    fun getLocationUpdates(): Flow<LocationData> = callbackFlow {
        if (!hasLocationPermission()) {
            close()
            return@callbackFlow
        }
        
        val callback = object : LocationCallback() {
            override fun onLocationResult(locationResult: LocationResult) {
                locationResult.lastLocation?.let { location ->
                    val locationData = convertToLocationData(location)
                    trySend(locationData)
                    updateLocationData(location)
                }
            }
            
            override fun onLocationAvailability(locationAvailability: LocationAvailability) {
                _isLocationAvailable.value = locationAvailability.isLocationAvailable
            }
        }
        
        try {
            fusedLocationClient.requestLocationUpdates(
                locationRequest,
                callback,
                Looper.getMainLooper()
            )
        } catch (securityException: SecurityException) {
            close()
            return@callbackFlow
        }
        
        awaitClose {
            fusedLocationClient.removeLocationUpdates(callback)
        }
    }
    
    /**
     * Gets the last known location immediately
     */
    suspend fun getLastKnownLocation(): LocationData? {
        if (!hasLocationPermission()) {
            return null
        }
        
        return try {
            val location = fusedLocationClient.lastLocation.result
            location?.let { convertToLocationData(it) }
        } catch (securityException: SecurityException) {
            null
        }
    }
    
    /**
     * Checks if the current GPS accuracy is sufficient for event recording
     * Requirements 3.2: GPS accuracy monitoring
     */
    fun hasGoodAccuracy(): Boolean {
        val accuracy = getLocationAccuracy()
        return accuracy <= 20.0f // 20-meter threshold as per requirements
    }
    
    /**
     * Checks if the vehicle is moving at sufficient speed for event detection
     * Requirements 3.3: Record current vehicle speed
     */
    fun isMovingFast(): Boolean {
        val location = getCurrentLocation()
        return location?.isMovingFast() ?: false
    }
    
    /**
     * Gets current vehicle speed in km/h
     * Requirements 3.3: Record current vehicle speed in km/h
     */
    fun getCurrentSpeedKmh(): Float {
        return getCurrentLocation()?.speedKmh() ?: 0.0f
    }
    
    /**
     * Gets current heading in degrees
     * Requirements 3.4: Record current heading in degrees
     */
    fun getCurrentHeading(): Float? {
        return getCurrentLocation()?.bearing
    }
    
    private fun hasLocationPermission(): Boolean {
        return ActivityCompat.checkSelfPermission(
            context,
            Manifest.permission.ACCESS_FINE_LOCATION
        ) == PackageManager.PERMISSION_GRANTED
    }
    
    private fun isLocationEnabled(): Boolean {
        val locationManager = context.getSystemService(Context.LOCATION_SERVICE) as android.location.LocationManager
        return locationManager.isProviderEnabled(android.location.LocationManager.GPS_PROVIDER) ||
               locationManager.isProviderEnabled(android.location.LocationManager.NETWORK_PROVIDER)
    }
    
    private fun updateLocationData(location: Location) {
        _currentLocation.value = convertToLocationData(location)
    }
    
    private fun convertToLocationData(location: Location): LocationData {
        return LocationData(
            latitude = location.latitude,
            longitude = location.longitude,
            accuracy = location.accuracy,
            speed = if (location.hasSpeed()) location.speed else 0.0f,
            bearing = if (location.hasBearing()) location.bearing else 0.0f,
            timestamp = location.time
        )
    }
}

/**
 * Extension functions for location-related operations
 */

/**
 * Checks if this location has sufficient accuracy for event recording
 */
fun LocationData.hasGoodAccuracy(): Boolean = accuracy <= 20.0f

/**
 * Checks if the vehicle is moving fast enough for event detection
 */
fun LocationData.isMovingFast(): Boolean = speedKmh() >= 5.0f

/**
 * Converts speed from m/s to km/h
 */
fun LocationData.speedKmh(): Float = speed * 3.6f