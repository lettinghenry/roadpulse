package com.roadpulse.android.data.provider;

@kotlin.Metadata(mv = {1, 9, 0}, k = 2, xi = 48, d1 = {"\u0000\u0014\n\u0000\n\u0002\u0010\u000b\n\u0002\u0018\u0002\n\u0002\b\u0002\n\u0002\u0010\u0007\n\u0000\u001a\n\u0010\u0000\u001a\u00020\u0001*\u00020\u0002\u001a\n\u0010\u0003\u001a\u00020\u0001*\u00020\u0002\u001a\n\u0010\u0004\u001a\u00020\u0005*\u00020\u0002\u00a8\u0006\u0006"}, d2 = {"hasGoodAccuracy", "", "Lcom/roadpulse/android/data/model/LocationData;", "isMovingFast", "speedKmh", "", "app_release"})
public final class LocationProviderKt {
    
    /**
     * Checks if this location has sufficient accuracy for event recording
     */
    public static final boolean hasGoodAccuracy(@org.jetbrains.annotations.NotNull
    com.roadpulse.android.data.model.LocationData $this$hasGoodAccuracy) {
        return false;
    }
    
    /**
     * Checks if the vehicle is moving fast enough for event detection
     */
    public static final boolean isMovingFast(@org.jetbrains.annotations.NotNull
    com.roadpulse.android.data.model.LocationData $this$isMovingFast) {
        return false;
    }
    
    /**
     * Converts speed from m/s to km/h
     */
    public static final float speedKmh(@org.jetbrains.annotations.NotNull
    com.roadpulse.android.data.model.LocationData $this$speedKmh) {
        return 0.0F;
    }
}