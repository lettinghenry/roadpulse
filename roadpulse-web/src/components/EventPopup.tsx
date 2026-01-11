import React, { useEffect, useRef, useCallback } from 'react';
import { RoadAnomalyEvent, LatLng, SEVERITY_COLORS } from '../types';
import { KeyboardNavigationManager } from '../utils/keyboardNavigation';
import './EventPopup.css';

// Formatting utility functions for comprehensive event information display
const formatTimestamp = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  }).format(date);
};

const formatConfidence = (confidence: number): string => {
  return `${(confidence * 100).toFixed(1)}%`;
};

const formatCoordinates = (lat: number, lng: number): string => {
  return `${lat.toFixed(6)}°, ${lng.toFixed(6)}°`;
};

const formatAccuracy = (accuracyM: number): string => {
  return `±${accuracyM.toFixed(1)}m`;
};

const formatSpeed = (speedKmh: number): string => {
  const mph = speedKmh * 0.621371;
  return `${speedKmh.toFixed(1)} km/h (${mph.toFixed(1)} mph)`;
};

const formatAcceleration = (accelMs2: number): string => {
  const gForce = accelMs2 / 9.81;
  return `${accelMs2.toFixed(2)} m/s² (${gForce.toFixed(2)}g)`;
};

const formatDuration = (durationMs: number): string => {
  if (durationMs < 1000) {
    return `${durationMs}ms`;
  } else {
    return `${(durationMs / 1000).toFixed(2)}s`;
  }
};

const formatHeading = (headingDeg: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(headingDeg / 22.5) % 16;
  return `${headingDeg.toFixed(1)}° (${directions[index]})`;
};

interface EventPopupProps {
  event: RoadAnomalyEvent | null;
  position?: LatLng;
  onClose: () => void;
  isVisible: boolean;
}

export const EventPopup: React.FC<EventPopupProps> = ({
  event,
  position,
  onClose,
  isVisible
}) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = React.useState(false);
  const [orientation, setOrientation] = React.useState<'portrait' | 'landscape'>('portrait');
  const [focusTrapCleanup, setFocusTrapCleanup] = React.useState<(() => void) | null>(null);

  // Detect mobile device and orientation
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      const newOrientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
      
      setIsMobile(mobile);
      setOrientation(newOrientation);
    };

    checkMobile();
    
    const handleResize = () => {
      checkMobile();
    };

    const handleOrientationChange = () => {
      // Delay to allow for orientation change to complete
      setTimeout(checkMobile, 300);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Handle click outside to close popup
  const handleClickOutside = useCallback((e: MouseEvent) => {
    if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
      onClose();
    }
  }, [onClose]);

  // Handle escape key to close popup
  const handleEscapeKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  // Set up event listeners for dismissal behavior and focus management
  useEffect(() => {
    if (isVisible && popupRef.current) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      
      // Set up focus trap for keyboard navigation
      const manager = new KeyboardNavigationManager(popupRef.current);
      const cleanup = manager.setFocusTrap(popupRef.current);
      setFocusTrapCleanup(() => cleanup);
      
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscapeKey);
        if (focusTrapCleanup) {
          focusTrapCleanup();
        }
      };
    } else {
      // Clean up focus trap when popup is hidden
      if (focusTrapCleanup) {
        focusTrapCleanup();
        setFocusTrapCleanup(null);
      }
    }
  }, [isVisible, handleClickOutside, handleEscapeKey, focusTrapCleanup]);

  // Position popup within viewport with mobile optimization
  const getPopupStyle = useCallback((): React.CSSProperties => {
    if (!position || !popupRef.current) {
      return { display: 'none' };
    }

    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    // Mobile-specific sizing and positioning
    if (isMobile) {
      const mobileStyle: React.CSSProperties = {
        position: 'fixed',
        zIndex: 1000
      };

      if (orientation === 'portrait') {
        // Portrait mode: use most of screen width, position at bottom
        return {
          ...mobileStyle,
          left: '5vw',
          right: '5vw',
          bottom: '10vh',
          width: '90vw',
          maxHeight: '70vh'
        };
      } else {
        // Landscape mode: smaller width, centered
        return {
          ...mobileStyle,
          left: '10vw',
          right: '10vw',
          top: '5vh',
          width: '80vw',
          maxHeight: '85vh'
        };
      }
    }

    // Desktop positioning logic
    let left = viewport.width / 2 - 200; // 200px is half of popup width
    let top = viewport.height / 2 - 150; // 150px is approximate half of popup height

    // Ensure popup stays within viewport bounds
    const popupWidth = 400;
    const popupHeight = 300;

    if (left + popupWidth > viewport.width - 20) {
      left = viewport.width - popupWidth - 20;
    }
    if (left < 20) {
      left = 20;
    }
    if (top + popupHeight > viewport.height - 20) {
      top = viewport.height - popupHeight - 20;
    }
    if (top < 20) {
      top = 20;
    }

    return {
      position: 'fixed',
      left: `${left}px`,
      top: `${top}px`,
      zIndex: 1000
    };
  }, [position, isMobile, orientation]);

  if (!isVisible || !event) {
    return null;
  }

  const severityColor = SEVERITY_COLORS[event.severity];

  return (
    <div 
      ref={overlayRef}
      className="event-popup-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="popup-title"
      aria-describedby="popup-content"
    >
      <div
        ref={popupRef}
        className={`event-popup ${isMobile ? 'mobile' : 'desktop'} ${orientation}`}
        style={getPopupStyle()}
      >
        <div className="popup-header">
          <h2 id="popup-title" className="popup-title">
            Road Anomaly Event Details
          </h2>
          <button
            className="popup-close-button"
            onClick={onClose}
            aria-label="Close event details popup"
            type="button"
          >
            ×
          </button>
        </div>

        <div className="popup-content" id="popup-content">
          <div className="severity-indicator">
            <div 
              className={`severity-badge severity-${event.severity}`}
              style={{ backgroundColor: severityColor }}
              role="status"
              aria-label={`Severity level ${event.severity} out of 5`}
            >
              Severity {event.severity}/5
            </div>
          </div>

          <div className="event-details" role="group" aria-label="Event details">
            <div className="detail-group">
              <h3>Detection Information</h3>
              <div className="detail-item">
                <span className="detail-label">Detected:</span>
                <span className="detail-value" aria-label={`Detected on ${formatTimestamp(event.createdAt)}`}>
                  {formatTimestamp(event.createdAt)}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Confidence:</span>
                <span className="detail-value" aria-label={`Detection confidence ${formatConfidence(event.confidence)}`}>
                  {formatConfidence(event.confidence)}
                </span>
              </div>
            </div>

            <div className="detail-group">
              <h3>Location Data</h3>
              <div className="detail-item">
                <span className="detail-label">Coordinates:</span>
                <span className="detail-value" aria-label={`GPS coordinates ${formatCoordinates(event.latitude, event.longitude)}`}>
                  {formatCoordinates(event.latitude, event.longitude)}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">GPS Accuracy:</span>
                <span className="detail-value" aria-label={`GPS accuracy ${formatAccuracy(event.gpsAccuracyM)}`}>
                  {formatAccuracy(event.gpsAccuracyM)}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Speed:</span>
                <span className="detail-value" aria-label={`Vehicle speed ${formatSpeed(event.speedKmh)}`}>
                  {formatSpeed(event.speedKmh)}
                </span>
              </div>
              {event.headingDeg !== undefined && (
                <div className="detail-item">
                  <span className="detail-label">Heading:</span>
                  <span className="detail-value" aria-label={`Vehicle heading ${formatHeading(event.headingDeg)}`}>
                    {formatHeading(event.headingDeg)}
                  </span>
                </div>
              )}
            </div>

            <div className="detail-group">
              <h3>Sensor Data</h3>
              <div className="detail-item">
                <span className="detail-label">Peak Acceleration:</span>
                <span className="detail-value" aria-label={`Peak acceleration ${formatAcceleration(event.peakAccelMs2)}`}>
                  {formatAcceleration(event.peakAccelMs2)}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Impulse Duration:</span>
                <span className="detail-value" aria-label={`Impulse duration ${formatDuration(event.impulseDurationMs)}`}>
                  {formatDuration(event.impulseDurationMs)}
                </span>
              </div>
            </div>

            <div className="detail-group">
              <h3>Device Information</h3>
              <div className="detail-item">
                <span className="detail-label">Device Model:</span>
                <span className="detail-value">{event.deviceModel}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Android Version:</span>
                <span className="detail-value">{event.androidVersion}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Session ID:</span>
                <span className="detail-value" aria-label={`Session identifier ${event.sessionId}`}>
                  {event.sessionId}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventPopup;