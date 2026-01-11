import React, { useState, useCallback } from 'react';

interface LocationControlsProps {
  onLocationCenter: (lat: number, lng: number) => void;
  className?: string;
  touchOptimized?: boolean;
}

interface LocationState {
  isLoading: boolean;
  error: string | null;
  hasPermission: boolean | null;
  isSupported: boolean;
}

export const LocationControls: React.FC<LocationControlsProps> = ({
  onLocationCenter,
  className = '',
  touchOptimized = false
}) => {
  const [locationState, setLocationState] = useState<LocationState>({
    isLoading: false,
    error: null,
    hasPermission: null,
    isSupported: 'geolocation' in navigator
  });

  const handleLocationRequest = useCallback(async () => {
    if (!locationState.isSupported) {
      setLocationState(prev => ({
        ...prev,
        error: 'Geolocation is not supported by this browser'
      }));
      return;
    }

    setLocationState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));

    try {
      const position = await getCurrentPosition();
      const { latitude, longitude } = position.coords;
      
      setLocationState(prev => ({
        ...prev,
        isLoading: false,
        hasPermission: true,
        error: null
      }));

      onLocationCenter(latitude, longitude);
    } catch (error) {
      let errorMessage = 'Failed to get location';
      
      if (error instanceof GeolocationPositionError) {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied by user';
            setLocationState(prev => ({ ...prev, hasPermission: false }));
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
          default:
            errorMessage = 'Unknown location error';
        }
      }

      setLocationState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  }, [locationState.isSupported, onLocationCenter]);

  const clearError = useCallback(() => {
    setLocationState(prev => ({ ...prev, error: null }));
  }, []);

  if (!locationState.isSupported) {
    return null; // Don't render if geolocation is not supported
  }

  return (
    <div className={`location-controls ${className} ${touchOptimized ? 'touch-optimized' : ''}`}>
      <button
        onClick={handleLocationRequest}
        disabled={locationState.isLoading}
        className={`location-button ${touchOptimized ? 'touch-button' : ''}`}
        title="Center map on your location"
        aria-label="Center map on your current location"
        style={{
          minHeight: touchOptimized ? '48px' : '40px',
          minWidth: touchOptimized ? '48px' : 'auto',
          fontSize: touchOptimized ? '16px' : '14px'
        }}
      >
        {locationState.isLoading ? (
          <span className="loading-spinner" aria-hidden="true">⟳</span>
        ) : (
          <span aria-hidden="true">📍</span>
        )}
        {locationState.isLoading ? 'Getting location...' : 'My Location'}
      </button>

      {locationState.error && (
        <div className="location-error" role="alert">
          <span>{locationState.error}</span>
          <button
            onClick={clearError}
            className="error-dismiss"
            aria-label="Dismiss error message"
          >
            ×
          </button>
        </div>
      )}

      {locationState.hasPermission === false && (
        <div className="location-permission-help" role="status">
          <p>To use location services:</p>
          <ol>
            <li>Click the location icon in your browser's address bar</li>
            <li>Select "Allow" for location access</li>
            <li>Try the location button again</li>
          </ol>
        </div>
      )}
    </div>
  );
};

// Promisified geolocation API
function getCurrentPosition(options?: PositionOptions): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    const defaultOptions: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 10000, // 10 seconds
      maximumAge: 300000 // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      resolve,
      reject,
      { ...defaultOptions, ...options }
    );
  });
}

export default LocationControls;