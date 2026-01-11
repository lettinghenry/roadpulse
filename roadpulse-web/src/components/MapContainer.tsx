import { useCallback, useRef, useState, forwardRef, useImperativeHandle, useEffect } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import { Map as LeafletMap } from 'leaflet';
import { ViewportState, LatLng, MapStyle } from '../types';
import { dataManager } from '../utils/dataManager';
import { useResponsive } from '../utils/responsive';
import TouchEnabledMap from './TouchEnabledMap';
import 'leaflet/dist/leaflet.css';

// Default map configuration
const DEFAULT_CENTER: LatLng = { lat: 40.7128, lng: -74.0060 }; // New York City
const DEFAULT_ZOOM = 10;
const MIN_ZOOM = 1;
const MAX_ZOOM = 18;

// Tile layer configurations
const TILE_LAYERS = {
  street: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: MAX_ZOOM,
    className: 'street-layer'
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics',
    maxZoom: MAX_ZOOM,
    className: 'satellite-layer'
  }
} as const;

interface MapContainerProps {
  onViewportChange?: (viewport: ViewportState) => void;
  center?: LatLng;
  zoom?: number;
  className?: string;
  children?: React.ReactNode;
  mapStyle?: MapStyle;
  onLayerTransitionStart?: () => void;
  onLayerTransitionEnd?: () => void;
}

export interface MapContainerRef {
  centerOnLocation: (lat: number, lng: number, zoom?: number) => void;
  fitBounds: (bounds: { north: number; south: number; east: number; west: number }) => void;
  getMap: () => LeafletMap | null;
  setMapStyle: (style: MapStyle) => void;
}

// Component to manage tile layers and switching
function TileLayerManager({ 
  mapStyle, 
  onTransitionStart, 
  onTransitionEnd 
}: { 
  mapStyle: MapStyle;
  onTransitionStart?: () => void;
  onTransitionEnd?: () => void;
}) {
  const [currentStyle, setCurrentStyle] = useState<MapStyle>(mapStyle);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (mapStyle !== currentStyle && !isTransitioning) {
      setIsTransitioning(true);
      onTransitionStart?.();
      
      // Start transition timer
      const transitionStart = performance.now();
      
      // Update the layer
      setCurrentStyle(mapStyle);
      
      // Complete transition after a short delay to ensure smooth visual transition
      const transitionTimeout = setTimeout(() => {
        const transitionTime = performance.now() - transitionStart;
        
        if (transitionTime > 2000) {
          console.warn(`Layer transition took ${transitionTime.toFixed(2)}ms, exceeding 2 second target`);
        }
        
        setIsTransitioning(false);
        onTransitionEnd?.();
      }, 300); // Minimum transition time for visual feedback
      
      return () => clearTimeout(transitionTimeout);
    }
  }, [mapStyle, currentStyle, isTransitioning, onTransitionStart, onTransitionEnd]);

  const layerConfig = TILE_LAYERS[currentStyle];

  return (
    <TileLayer
      key={currentStyle} // Force re-render when style changes
      url={layerConfig.url}
      attribution={layerConfig.attribution}
      maxZoom={layerConfig.maxZoom}
      className={`${layerConfig.className} ${isTransitioning ? 'transitioning' : ''}`}
    />
  );
}

// Component to handle map events and initialization
function MapEventHandler({ 
  onViewportChange, 
  onMapReady 
}: { 
  onViewportChange?: (viewport: ViewportState) => void;
  onMapReady?: (map: LeafletMap) => void;
}) {
  const map = useMapEvents({
    moveend: () => {
      if (onViewportChange) {
        const viewport = createViewportState(map);
        onViewportChange(viewport);
        
        // Update data manager with new viewport for virtualization
        dataManager.updateViewport(viewport);
      }
    },
    zoomend: () => {
      if (onViewportChange) {
        const viewport = createViewportState(map);
        onViewportChange(viewport);
        
        // Update data manager with new viewport for virtualization
        dataManager.updateViewport(viewport);
      }
    }
  });

  // Handle map initialization
  useEffect(() => {
    if (onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  return null;
}

// Helper function to create viewport state
function createViewportState(map: LeafletMap): ViewportState {
  const center = map.getCenter();
  const bounds = map.getBounds();
  const zoom = map.getZoom();
  const pixelBounds = map.getPixelBounds();

  return {
    center: { lat: center.lat, lng: center.lng },
    zoom,
    bounds: {
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest()
    },
    pixelBounds: {
      min: { x: pixelBounds.min?.x || 0, y: pixelBounds.min?.y || 0 },
      max: { x: pixelBounds.max?.x || 0, y: pixelBounds.max?.y || 0 }
    }
  };
}

export const MapContainer = forwardRef<MapContainerRef, MapContainerProps>(({
  onViewportChange,
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  className = '',
  children,
  mapStyle = 'street',
  onLayerTransitionStart,
  onLayerTransitionEnd
}, ref) => {
  const mapRef = useRef<LeafletMap | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [currentMapStyle, setCurrentMapStyle] = useState<MapStyle>(mapStyle);
  
  // Get responsive configuration
  const { isTouchEnabled } = useResponsive();

  // Update map style when prop changes
  useEffect(() => {
    if (mapStyle !== currentMapStyle) {
      setCurrentMapStyle(mapStyle);
    }
  }, [mapStyle, currentMapStyle]);

  // Performance optimization: debounce viewport changes
  const debouncedViewportChange = useCallback(
    debounce((viewport: ViewportState) => {
      onViewportChange?.(viewport);
    }, 200),
    [onViewportChange]
  );

  // Handle map ready event
  const handleMapReady = useCallback((map: LeafletMap) => {
    mapRef.current = map;
    setIsMapReady(true);

    // Initial viewport state
    if (onViewportChange) {
      const viewport = createViewportState(map);
      onViewportChange(viewport);
      
      // Initialize data manager with initial viewport
      dataManager.updateViewport(viewport);
    }
  }, [onViewportChange]);

  // Public methods for external control
  const centerOnLocation = useCallback((lat: number, lng: number, zoomLevel?: number) => {
    if (mapRef.current) {
      mapRef.current.setView([lat, lng], zoomLevel || mapRef.current.getZoom());
    }
  }, []);

  const fitBounds = useCallback((bounds: { north: number; south: number; east: number; west: number }) => {
    if (mapRef.current) {
      mapRef.current.fitBounds([
        [bounds.south, bounds.west],
        [bounds.north, bounds.east]
      ]);
    }
  }, []);

  const getMap = useCallback(() => mapRef.current, []);

  // Set map style programmatically
  const setMapStyle = useCallback((style: MapStyle) => {
    setCurrentMapStyle(style);
  }, []);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    centerOnLocation,
    fitBounds,
    getMap,
    setMapStyle
  }), [centerOnLocation, fitBounds, getMap, setMapStyle]);

  // Render touch-enabled map for touch devices, regular map for desktop
  if (isTouchEnabled) {
    return (
      <div className={`map-container touch-enabled ${className}`} style={{ height: '100%', width: '100%' }}>
        <TouchEnabledMap
          onMapReady={handleMapReady}
          className="touch-map"
        >
          <TileLayerManager
            mapStyle={currentMapStyle}
            onTransitionStart={onLayerTransitionStart}
            onTransitionEnd={onLayerTransitionEnd}
          />
          
          {isMapReady && (
            <MapEventHandler 
              onViewportChange={debouncedViewportChange} 
              onMapReady={handleMapReady}
            />
          )}
          
          {children}
        </TouchEnabledMap>
      </div>
    );
  }

  // Regular desktop map
  return (
    <div className={`map-container ${className}`} style={{ height: '100%', width: '100%' }}>
      <LeafletMapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        style={{ height: '100%', width: '100%' }}
        whenReady={() => setIsMapReady(true)}
        zoomControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        dragging={true}
        touchZoom={true}
        boxZoom={true}
        keyboard={true}
        keyboardPanDelta={80}
      >
        <TileLayerManager
          mapStyle={currentMapStyle}
          onTransitionStart={onLayerTransitionStart}
          onTransitionEnd={onLayerTransitionEnd}
        />
        
        {isMapReady && (
          <MapEventHandler 
            onViewportChange={debouncedViewportChange} 
            onMapReady={handleMapReady}
          />
        )}
        
        {children}
      </LeafletMapContainer>
    </div>
  );
});

MapContainer.displayName = 'MapContainer';

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export default MapContainer;