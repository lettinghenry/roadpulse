package com.roadpulse.android.data.provider;

/**
 * Manages GPS location services with accuracy monitoring and permission handling.
 * Implements Requirements 3.1, 3.2, 3.3, 3.4, 3.5 for GPS data capture and availability.
 */
@javax.inject.Singleton
@kotlin.Metadata(mv = {1, 9, 0}, k = 1, xi = 48, d1 = {"\u0000^\n\u0002\u0018\u0002\n\u0002\u0010\u0000\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u000b\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0002\b\u0003\n\u0002\u0018\u0002\n\u0000\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0018\u0002\n\u0000\n\u0002\u0010\u0007\n\u0002\b\u0006\n\u0002\u0018\u0002\n\u0002\b\u0005\n\u0002\u0010\u0002\n\u0002\b\u0003\b\u0007\u0018\u00002\u00020\u0001B\u0011\b\u0007\u0012\b\b\u0001\u0010\u0002\u001a\u00020\u0003\u00a2\u0006\u0002\u0010\u0004J\u0010\u0010\u0016\u001a\u00020\u00072\u0006\u0010\u0017\u001a\u00020\u0018H\u0002J\r\u0010\u0019\u001a\u0004\u0018\u00010\u001a\u00a2\u0006\u0002\u0010\u001bJ\b\u0010\f\u001a\u0004\u0018\u00010\u0007J\u0006\u0010\u001c\u001a\u00020\u001aJ\u0010\u0010\u001d\u001a\u0004\u0018\u00010\u0007H\u0086@\u00a2\u0006\u0002\u0010\u001eJ\u0006\u0010\u001f\u001a\u00020\u001aJ\f\u0010 \u001a\b\u0012\u0004\u0012\u00020\u00070!J\u0006\u0010\"\u001a\u00020\tJ\b\u0010#\u001a\u00020\tH\u0002J\u0006\u0010\u0010\u001a\u00020\tJ\b\u0010$\u001a\u00020\tH\u0002J\u0006\u0010%\u001a\u00020\tJ\u0006\u0010&\u001a\u00020\'J\u0006\u0010(\u001a\u00020\'J\u0010\u0010)\u001a\u00020\'2\u0006\u0010\u0017\u001a\u00020\u0018H\u0002R\u0016\u0010\u0005\u001a\n\u0012\u0006\u0012\u0004\u0018\u00010\u00070\u0006X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0014\u0010\b\u001a\b\u0012\u0004\u0012\u00020\t0\u0006X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0002\u001a\u00020\u0003X\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0019\u0010\n\u001a\n\u0012\u0006\u0012\u0004\u0018\u00010\u00070\u000b\u00a2\u0006\b\n\u0000\u001a\u0004\b\f\u0010\rR\u000e\u0010\u000e\u001a\u00020\u000fX\u0082\u0004\u00a2\u0006\u0002\n\u0000R\u0017\u0010\u0010\u001a\b\u0012\u0004\u0012\u00020\t0\u000b\u00a2\u0006\b\n\u0000\u001a\u0004\b\u0010\u0010\rR\u000e\u0010\u0011\u001a\u00020\tX\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u0010\u0010\u0012\u001a\u0004\u0018\u00010\u0013X\u0082\u000e\u00a2\u0006\u0002\n\u0000R\u000e\u0010\u0014\u001a\u00020\u0015X\u0082\u0004\u00a2\u0006\u0002\n\u0000\u00a8\u0006*"}, d2 = {"Lcom/roadpulse/android/data/provider/LocationProvider;", "", "context", "Landroid/content/Context;", "(Landroid/content/Context;)V", "_currentLocation", "Lkotlinx/coroutines/flow/MutableStateFlow;", "Lcom/roadpulse/android/data/model/LocationData;", "_isLocationAvailable", "", "currentLocation", "Lkotlinx/coroutines/flow/StateFlow;", "getCurrentLocation", "()Lkotlinx/coroutines/flow/StateFlow;", "fusedLocationClient", "Lcom/google/android/gms/location/FusedLocationProviderClient;", "isLocationAvailable", "isUpdatesStarted", "locationCallback", "Lcom/google/android/gms/location/LocationCallback;", "locationRequest", "Lcom/google/android/gms/location/LocationRequest;", "convertToLocationData", "location", "Landroid/location/Location;", "getCurrentHeading", "", "()Ljava/lang/Float;", "getCurrentSpeedKmh", "getLastKnownLocation", "(Lkotlin/coroutines/Continuation;)Ljava/lang/Object;", "getLocationAccuracy", "getLocationUpdates", "Lkotlinx/coroutines/flow/Flow;", "hasGoodAccuracy", "hasLocationPermission", "isLocationEnabled", "isMovingFast", "startLocationUpdates", "", "stopLocationUpdates", "updateLocationData", "app_debug"})
public final class LocationProvider {
    @org.jetbrains.annotations.NotNull
    private final android.content.Context context = null;
    @org.jetbrains.annotations.NotNull
    private final com.google.android.gms.location.FusedLocationProviderClient fusedLocationClient = null;
    @org.jetbrains.annotations.NotNull
    private final kotlinx.coroutines.flow.MutableStateFlow<com.roadpulse.android.data.model.LocationData> _currentLocation = null;
    @org.jetbrains.annotations.NotNull
    private final kotlinx.coroutines.flow.StateFlow<com.roadpulse.android.data.model.LocationData> currentLocation = null;
    @org.jetbrains.annotations.NotNull
    private final kotlinx.coroutines.flow.MutableStateFlow<java.lang.Boolean> _isLocationAvailable = null;
    @org.jetbrains.annotations.NotNull
    private final kotlinx.coroutines.flow.StateFlow<java.lang.Boolean> isLocationAvailable = null;
    @org.jetbrains.annotations.Nullable
    private com.google.android.gms.location.LocationCallback locationCallback;
    private boolean isUpdatesStarted = false;
    @org.jetbrains.annotations.NotNull
    private final com.google.android.gms.location.LocationRequest locationRequest = null;
    
    @javax.inject.Inject
    public LocationProvider(@dagger.hilt.android.qualifiers.ApplicationContext
    @org.jetbrains.annotations.NotNull
    android.content.Context context) {
        super();
    }
    
    @org.jetbrains.annotations.NotNull
    public final kotlinx.coroutines.flow.StateFlow<com.roadpulse.android.data.model.LocationData> getCurrentLocation() {
        return null;
    }
    
    @org.jetbrains.annotations.NotNull
    public final kotlinx.coroutines.flow.StateFlow<java.lang.Boolean> isLocationAvailable() {
        return null;
    }
    
    /**
     * Gets the current location if available
     * Requirements 3.1: Record current latitude and longitude coordinates
     */
    @org.jetbrains.annotations.Nullable
    public final com.roadpulse.android.data.model.LocationData getCurrentLocation() {
        return null;
    }
    
    /**
     * Checks if location services are available and permissions are granted
     * Requirements 3.5: Handle GPS signal unavailability
     */
    public final boolean isLocationAvailable() {
        return false;
    }
    
    /**
     * Gets the current GPS accuracy in meters
     * Requirements 3.2: Record GPS accuracy in meters
     */
    public final float getLocationAccuracy() {
        return 0.0F;
    }
    
    /**
     * Starts location updates with maximum 5-second intervals
     * Requirements 3.1, 3.2, 3.3, 3.4: GPS data capture
     */
    public final void startLocationUpdates() {
    }
    
    /**
     * Stops location updates to conserve battery
     */
    public final void stopLocationUpdates() {
    }
    
    /**
     * Gets a flow of location updates
     * Requirements 3.1, 3.2, 3.3, 3.4: Continuous GPS tracking
     */
    @org.jetbrains.annotations.NotNull
    public final kotlinx.coroutines.flow.Flow<com.roadpulse.android.data.model.LocationData> getLocationUpdates() {
        return null;
    }
    
    /**
     * Gets the last known location immediately
     */
    @org.jetbrains.annotations.Nullable
    public final java.lang.Object getLastKnownLocation(@org.jetbrains.annotations.NotNull
    kotlin.coroutines.Continuation<? super com.roadpulse.android.data.model.LocationData> $completion) {
        return null;
    }
    
    /**
     * Checks if the current GPS accuracy is sufficient for event recording
     * Requirements 3.2: GPS accuracy monitoring
     */
    public final boolean hasGoodAccuracy() {
        return false;
    }
    
    /**
     * Checks if the vehicle is moving at sufficient speed for event detection
     * Requirements 3.3: Record current vehicle speed
     */
    public final boolean isMovingFast() {
        return false;
    }
    
    /**
     * Gets current vehicle speed in km/h
     * Requirements 3.3: Record current vehicle speed in km/h
     */
    public final float getCurrentSpeedKmh() {
        return 0.0F;
    }
    
    /**
     * Gets current heading in degrees
     * Requirements 3.4: Record current heading in degrees
     */
    @org.jetbrains.annotations.Nullable
    public final java.lang.Float getCurrentHeading() {
        return null;
    }
    
    private final boolean hasLocationPermission() {
        return false;
    }
    
    private final boolean isLocationEnabled() {
        return false;
    }
    
    private final void updateLocationData(android.location.Location location) {
    }
    
    private final com.roadpulse.android.data.model.LocationData convertToLocationData(android.location.Location location) {
        return null;
    }
}