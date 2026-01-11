import React, { useRef, useCallback, useEffect, useState } from 'react';
import { MapContainer as LeafletMapContainer } from 'react-leaflet';
import { Map as LeafletMap } from 'leaflet';
import { 
  useTouchGestures, 
  useOrientationChange, 
  TouchGestureHandlers, 
  GestureState,
  TouchPoint,
  optimizeTouchTargets,
  triggerHapticFeedback
} from '../utils/touchGestures';
import { useResponsive } from '../utils/responsive';
import { LatLng } from '../types';
import './TouchEnabledMap.css';

interface TouchEnabledMapProps {
  children: React.ReactNode;
  onMapReady?: (map: LeafletMap) => void;
  className?: string;
  enableHapticFeedback?: boolean;
  center?: LatLng;
  zoom?: number;
  minZoom?: number;
  maxZoom?: number;
}

const DEFAULT_CENTER: LatLng = { lat: 40.7128, lng: -74.0060 };
const DEFAULT_ZOOM = 10;
const MIN_ZOOM = 1;
const MAX_ZOOM = 18;

export const TouchEnabledMap: React.FC<TouchEnabledMapProps> = ({
  children,
  onMapReady,
  className = '',
  enableHapticFeedback = true,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  minZoom = MIN_ZOOM,
  maxZoom = MAX_ZOOM
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<LeafletMap | null>(null);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  
  const { isTouchEnabled, deviceType } = useResponsive();

  // Handle map initialization
  const handleMapReady = useCallback((map: LeafletMap) => {
    leafletMapRef.current = map;
    onMapReady?.(map);

    // Optimize touch targets after map is ready
    if (isTouchEnabled && mapContainerRef.current) {
      setTimeout(() => {
        optimizeTouchTargets(mapContainerRef.current!);
      }, 100);
    }
  }, [onMapReady, isTouchEnabled]);

  // Touch gesture handlers
  const touchHandlers: TouchGestureHandlers = {
    onPinchStart: useCallback((_state: GestureState) => {
      if (!leafletMapRef.current) return;
      
      // Disable map's default zoom behavior during pinch
      leafletMapRef.current.scrollWheelZoom.disable();
      leafletMapRef.current.doubleClickZoom.disable();
      
      if (enableHapticFeedback) {
        triggerHapticFeedback('light');
      }
    }, [enableHapticFeedback]),

    onPinchMove: useCallback((state: GestureState) => {
      if (!leafletMapRef.current || !state.startCenter) return;

      const map = leafletMapRef.current;
      const containerPoint = map.containerPointToLatLng([
        state.startCenter.x,
        state.startCenter.y
      ]);

      // Calculate new zoom level based on scale
      const currentZoom = map.getZoom();
      const newZoom = Math.max(
        map.getMinZoom(),
        Math.min(map.getMaxZoom(), currentZoom + Math.log2(state.scale))
      );

      // Apply zoom with center point
      map.setZoomAround(containerPoint, newZoom, { animate: false });
    }, []),

    onPinchEnd: useCallback((_state: GestureState) => {
      if (!leafletMapRef.current) return;

      // Re-enable map's default zoom behavior
      leafletMapRef.current.scrollWheelZoom.enable();
      leafletMapRef.current.doubleClickZoom.enable();
      
      if (enableHapticFeedback) {
        triggerHapticFeedback('light');
      }
    }, [enableHapticFeedback]),

    onPanStart: useCallback((_state: GestureState) => {
      if (!leafletMapRef.current) return;
      
      // Disable map's default drag behavior during custom pan
      leafletMapRef.current.dragging.disable();
    }, []),

    onPanMove: useCallback((state: GestureState) => {
      if (!leafletMapRef.current || !state.startCenter || !state.currentCenter) return;

      const map = leafletMapRef.current;
      const startLatLng = map.containerPointToLatLng([
        state.startCenter.x,
        state.startCenter.y
      ]);
      const currentLatLng = map.containerPointToLatLng([
        state.currentCenter.x,
        state.currentCenter.y
      ]);

      // Calculate the difference and pan the map
      const deltaLat = startLatLng.lat - currentLatLng.lat;
      const deltaLng = startLatLng.lng - currentLatLng.lng;
      
      const center = map.getCenter();
      map.setView([center.lat + deltaLat, center.lng + deltaLng], map.getZoom(), {
        animate: false
      });
    }, []),

    onPanEnd: useCallback((state: GestureState) => {
      if (!leafletMapRef.current) return;

      // Re-enable map's default drag behavior
      leafletMapRef.current.dragging.enable();
      
      // Apply momentum scrolling if velocity is high enough
      if (Math.abs(state.velocity.x) > 0.5 || Math.abs(state.velocity.y) > 0.5) {
        const map = leafletMapRef.current;
        const center = map.getCenter();
        const momentumFactor = 0.3;
        
        const newLat = center.lat - (state.velocity.y * momentumFactor);
        const newLng = center.lng - (state.velocity.x * momentumFactor);
        
        map.setView([newLat, newLng], map.getZoom(), {
          animate: true,
          duration: 0.5
        });
      }
    }, []),

    onDoubleTap: useCallback((point: TouchPoint) => {
      if (!leafletMapRef.current) return;

      const map = leafletMapRef.current;
      const latLng = map.containerPointToLatLng([point.x, point.y]);
      const currentZoom = map.getZoom();
      const newZoom = Math.min(map.getMaxZoom(), currentZoom + 1);
      
      map.setZoomAround(latLng, newZoom, { animate: true });
      
      if (enableHapticFeedback) {
        triggerHapticFeedback('medium');
      }
    }, [enableHapticFeedback]),

    onLongPress: useCallback((point: TouchPoint) => {
      if (!leafletMapRef.current) return;
      
      // Could be used for context menus or other long press actions
      if (enableHapticFeedback) {
        triggerHapticFeedback('heavy');
      }
      
      // For now, just log the long press
      console.log('Long press detected at:', point);
    }, [enableHapticFeedback])
  };

  // Set up touch gestures
  useTouchGestures(mapContainerRef, touchHandlers, {
    enablePinchZoom: isTouchEnabled,
    enablePan: isTouchEnabled,
    enableDoubleTap: isTouchEnabled,
    enableLongPress: isTouchEnabled,
    preventDefaultTouchEvents: isTouchEnabled
  });

  // Handle orientation changes
  useOrientationChange({
    onOrientationChange: useCallback((newOrientation) => {
      setOrientation(newOrientation);
      
      // Trigger map resize after orientation change
      if (leafletMapRef.current) {
        setTimeout(() => {
          leafletMapRef.current?.invalidateSize();
        }, 300); // Wait for CSS transitions to complete
      }
    }, []),
    responseTime: 300
  });

  // Apply device-specific optimizations
  useEffect(() => {
    if (!mapContainerRef.current || !isTouchEnabled) return;

    const container = mapContainerRef.current;
    
    // Add touch-specific CSS classes
    container.classList.add('touch-enabled');
    container.classList.add(`device-${deviceType}`);
    container.classList.add(`orientation-${orientation}`);
    
    // Prevent context menu on long press for better UX
    const preventContextMenu = (e: Event) => {
      e.preventDefault();
      return false;
    };
    
    container.addEventListener('contextmenu', preventContextMenu);
    
    // Prevent text selection during touch interactions
    container.style.webkitUserSelect = 'none';
    container.style.userSelect = 'none';
    (container.style as any).webkitTouchCallout = 'none';
    
    // Enable hardware acceleration
    container.style.transform = 'translateZ(0)';
    container.style.webkitTransform = 'translateZ(0)';
    
    return () => {
      container.removeEventListener('contextmenu', preventContextMenu);
      container.classList.remove('touch-enabled', `device-${deviceType}`, `orientation-${orientation}`);
    };
  }, [isTouchEnabled, deviceType, orientation]);

  return (
    <div
      ref={mapContainerRef}
      className={`touch-enabled-map ${className}`}
      style={{
        height: '100%',
        width: '100%',
        position: 'relative',
        touchAction: isTouchEnabled ? 'none' : 'auto', // Prevent browser zoom/pan
        overflow: 'hidden'
      }}
    >
      <LeafletMapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        minZoom={minZoom}
        maxZoom={maxZoom}
        style={{ height: '100%', width: '100%' }}
        whenReady={() => {
          // Get the map instance from the container
          const mapContainer = mapContainerRef.current?.querySelector('.leaflet-container') as any;
          if (mapContainer && mapContainer._leaflet_map) {
            handleMapReady(mapContainer._leaflet_map);
          }
        }}
        zoomControl={false} // Hide zoom controls on touch devices
        scrollWheelZoom={false} // Disable scroll wheel zoom on touch
        doubleClickZoom={false} // Handle double tap manually
        dragging={false} // Handle dragging manually on touch
        touchZoom={false} // We handle touch zoom manually
        boxZoom={false} // Disable box zoom on touch
        keyboard={false} // Disable keyboard on touch devices
      >
        {children}
      </LeafletMapContainer>
    </div>
  );
};

export default TouchEnabledMap;