import React, { useRef, useCallback, useState, useEffect } from 'react';
import MapContainer, { MapContainerRef } from './MapContainer';
import LocationControls from './LocationControls';
import AnomalyMarkers from './AnomalyMarkers';
import HeatMapRenderer from './HeatMapRenderer';
import HeatMapControls from './HeatMapControls';
import LoadingIndicator from './LoadingIndicator';
import PerformanceMonitor from './PerformanceMonitor';
import FilterControls from './FilterControls';
import MapLayerControls from './MapLayerControls';
import { ViewportState, LatLng, RoadAnomalyEvent, ClusterData, FilterCriteria, VisualizationMode, MapStyle } from '../types';
import { performanceMonitor, LoadingState } from '../utils/performanceMonitor';
import { usePerformanceOptimization, OptimizationState } from '../utils/performanceOptimizer';
import { useResponsive } from '../utils/responsive';
import { useKeyboardNavigation } from '../utils/keyboardNavigation';
import { useScreenReader } from '../utils/screenReader';
import './Map.css';

interface MapProps {
  onViewportChange?: (viewport: ViewportState) => void;
  initialCenter?: LatLng;
  initialZoom?: number;
  className?: string;
  anomalyEvents?: RoadAnomalyEvent[];
  onMarkerClick?: (event: RoadAnomalyEvent) => void;
  onClusterClick?: (cluster: ClusterData) => void;
  enableClustering?: boolean;
  showPerformanceMonitor?: boolean;
  showLoadingIndicators?: boolean;
  enableFiltering?: boolean;
  initialFilters?: Partial<FilterCriteria>;
  onFiltersChange?: (filters: FilterCriteria) => void;
  enableHeatMap?: boolean;
  initialVisualizationMode?: VisualizationMode;
  autoSwitchVisualizationMode?: boolean;
  onVisualizationModeChange?: (mode: VisualizationMode) => void;
  enableLayerControls?: boolean;
  initialMapStyle?: MapStyle;
  onMapStyleChange?: (style: MapStyle) => void;
}

export const Map: React.FC<MapProps> = ({
  onViewportChange,
  initialCenter,
  initialZoom,
  className = '',
  anomalyEvents = [],
  onMarkerClick,
  onClusterClick,
  enableClustering = true,
  showPerformanceMonitor = false,
  showLoadingIndicators = true,
  enableFiltering = true,
  initialFilters,
  onFiltersChange,
  enableHeatMap = true,
  initialVisualizationMode = 'markers',
  autoSwitchVisualizationMode = true,
  onVisualizationModeChange,
  enableLayerControls = true,
  initialMapStyle = 'street',
  onMapStyleChange
}) => {
  const mapRef = useRef<MapContainerRef | null>(null);
  const mapWrapperRef = useRef<HTMLDivElement>(null);
  const [currentViewport, setCurrentViewport] = useState<ViewportState | null>(null);
  const [loadingOperations, setLoadingOperations] = useState<LoadingState[]>([]);
  const [performanceOptimizations, setPerformanceOptimizations] = useState({
    shouldReduceMarkers: false,
    shouldDisableAnimations: false,
    shouldReduceClusterRadius: false
  });
  
  // Enhanced performance optimization integration
  const { optimizationState, adjustments } = usePerformanceOptimization();
  
  const [currentFilters, setCurrentFilters] = useState<FilterCriteria | null>(null);
  const [filteredEvents, setFilteredEvents] = useState<RoadAnomalyEvent[]>(anomalyEvents);
  const [isFilteringInProgress, setIsFilteringInProgress] = useState(false);
  
  // Heat map state
  const [visualizationMode, setVisualizationMode] = useState<VisualizationMode>(initialVisualizationMode);
  const [heatMapVisible, setHeatMapVisible] = useState(false);
  const [heatMapIntensity, setHeatMapIntensity] = useState(1.0);
  const [heatMapRadius, setHeatMapRadius] = useState(25);
  const [isHeatMapProcessing, setIsHeatMapProcessing] = useState(false);
  
  // Map layer state
  const [currentMapStyle, setCurrentMapStyle] = useState<MapStyle>(initialMapStyle);
  const [isLayerTransitioning, setIsLayerTransitioning] = useState(false);
  
  // Get responsive configuration
  const { deviceType, isTouchEnabled, config } = useResponsive();

  // Set up screen reader support
  const { announce, announceStatus, queueAnnouncement, manager: screenReaderManager } = useScreenReader();

  // Set up keyboard navigation
  useKeyboardNavigation(mapWrapperRef, {
    onArrowKey: (direction) => {
      // Handle map panning with arrow keys
      if (mapRef.current) {
        const map = mapRef.current.getMap();
        if (map && currentViewport) {
          const panDistance = 0.01; // Degrees to pan
          const { center } = currentViewport;
          let newLat = center.lat;
          let newLng = center.lng;

          switch (direction) {
            case 'up':
              newLat += panDistance;
              break;
            case 'down':
              newLat -= panDistance;
              break;
            case 'left':
              newLng -= panDistance;
              break;
            case 'right':
              newLng += panDistance;
              break;
          }

          mapRef.current.centerOnLocation(newLat, newLng);
        }
      }
    },
    onEnterKey: () => {
      // Enter key handled by individual focusable elements
    },
    onEscapeKey: () => {
      // Clear any active selections or close popups
      // This will be handled by individual components
    },
    onSpaceKey: () => {
      // Space key same as Enter for most elements
    },
    onPageUpKey: () => {
      // Zoom in
      if (mapRef.current && currentViewport) {
        const newZoom = Math.min(currentViewport.zoom + 1, 18);
        const map = mapRef.current.getMap();
        if (map) {
          map.setZoom(newZoom);
        }
      }
    },
    onPageDownKey: () => {
      // Zoom out
      if (mapRef.current && currentViewport) {
        const newZoom = Math.max(currentViewport.zoom - 1, 1);
        const map = mapRef.current.getMap();
        if (map) {
          map.setZoom(newZoom);
        }
      }
    }
  });

  // Subscribe to loading state changes
  useEffect(() => {
    if (!showLoadingIndicators) return;

    const unsubscribe = performanceMonitor.onLoadingChange((operations) => {
      setLoadingOperations(operations);
    });

    return unsubscribe;
  }, [showLoadingIndicators]);

  // Subscribe to performance changes for automatic optimization
  useEffect(() => {
    const unsubscribe = performanceMonitor.onPerformanceChange((metrics) => {
      // Update performance optimizations based on current FPS
      const optimizations = performanceMonitor.optimizeForPerformance();
      setPerformanceOptimizations(optimizations);
      
      // Log performance recommendations in development
      if (import.meta.env.DEV && metrics.fps < 30) {
        const recommendations = performanceMonitor.getPerformanceRecommendations();
        console.warn('Performance recommendations:', recommendations);
      }
    });

    return unsubscribe;
  }, []);

  // Enhanced performance optimization integration
  useEffect(() => {
    // Apply performance optimizations based on the optimizer state
    const applyOptimizations = (state: OptimizationState) => {
      setPerformanceOptimizations({
        shouldReduceMarkers: state.markerReduction < 1.0,
        shouldDisableAnimations: !state.animationsEnabled,
        shouldReduceClusterRadius: state.clusterRadius > 60
      });
      
      // Log optimization changes in development
      if (import.meta.env.DEV) {
        console.log('Applied performance optimizations:', {
          markerReduction: `${(state.markerReduction * 100).toFixed(0)}%`,
          animations: state.animationsEnabled ? 'enabled' : 'disabled',
          clusterRadius: `${state.clusterRadius}px`,
          virtualization: state.dataVirtualizationEnabled ? 'enabled' : 'disabled',
          throttling: `${state.updateThrottling}ms`
        });
      }
    };

    // Apply initial state
    applyOptimizations(optimizationState);
  }, [optimizationState]);

  // Measure initial load performance
  useEffect(() => {
    performanceMonitor.measureInitialLoad().then((loadTime) => {
      console.log(`Map initial load time: ${loadTime.toFixed(2)}ms`);
    });
  }, []);

  // Initialize filtered events when anomaly events change
  useEffect(() => {
    if (currentFilters) {
      applyFiltersToEvents(anomalyEvents, currentFilters);
    } else {
      setFilteredEvents(anomalyEvents);
    }
    
    // Announce event count changes to screen readers
    if (anomalyEvents.length > 0) {
      const description = screenReaderManager.describeAnomalyEvents(anomalyEvents);
      queueAnnouncement(description, 'polite');
    }
  }, [anomalyEvents, currentFilters, screenReaderManager, queueAnnouncement]);

  // Automatic visualization mode switching based on zoom level
  useEffect(() => {
    if (!autoSwitchVisualizationMode || !currentViewport || !enableHeatMap) {
      return;
    }

    const { zoom } = currentViewport;
    let newMode: VisualizationMode;
    
    // Switch to heat map below zoom level 12, markers at 12+
    if (zoom < 12) {
      newMode = 'heatmap';
    } else {
      newMode = 'markers';
    }

    if (newMode !== visualizationMode) {
      setVisualizationMode(newMode);
      setHeatMapVisible(newMode === 'heatmap');
      onVisualizationModeChange?.(newMode);
      
      // Announce visualization mode change to screen readers
      const modeDescription = newMode === 'heatmap' 
        ? 'Switched to heat map view showing density patterns'
        : 'Switched to marker view showing individual anomalies';
      announce(modeDescription, 'polite');
      
      if (import.meta.env.DEV) {
        console.log(`Auto-switched to ${newMode} mode at zoom level ${zoom}`);
      }
    }
  }, [currentViewport, autoSwitchVisualizationMode, enableHeatMap, visualizationMode, onVisualizationModeChange, announce]);

  // Update heat map when viewport changes (for heat map recalculation)
  useEffect(() => {
    if (visualizationMode === 'heatmap' && heatMapVisible && currentViewport) {
      // Heat map will automatically update when viewport changes
      // This is handled by the HeatMapRenderer component
      if (import.meta.env.DEV) {
        console.log('Heat map viewport updated, recalculating density');
      }
    }
  }, [currentViewport, visualizationMode, heatMapVisible]);

  // Filter application function with performance monitoring
  const applyFiltersToEvents = useCallback(async (
    events: RoadAnomalyEvent[], 
    filters: FilterCriteria
  ) => {
    setIsFilteringInProgress(true);
    announceStatus('Applying filters to road anomaly data');
    
    // Use performance monitoring for filter operations
    const startTime = performance.now();
    
    try {
      // Apply multiple filter AND logic
      const filtered = events.filter(event => {
        // Severity filter
        if (!filters.severityLevels.includes(event.severity)) {
          return false;
        }
        
        // Date range filter
        const eventDate = new Date(event.createdAt);
        if (eventDate < filters.dateRange.start || eventDate > filters.dateRange.end) {
          return false;
        }
        
        // Confidence threshold filter
        if (event.confidence < filters.confidenceThreshold) {
          return false;
        }
        
        // Bounds filter (if provided)
        if (filters.bounds) {
          if (
            event.latitude < filters.bounds.south ||
            event.latitude > filters.bounds.north ||
            event.longitude < filters.bounds.west ||
            event.longitude > filters.bounds.east
          ) {
            return false;
          }
        }
        
        return true;
      });
      
      const filterTime = performance.now() - startTime;
      
      // Ensure minimum response time is met (should be under 500ms)
      if (filterTime > 500) {
        console.warn(`Filter application took ${filterTime.toFixed(2)}ms, exceeding 500ms target`);
      }
      
      setFilteredEvents(filtered);
      
      // Announce filter results to screen readers
      const resultDescription = `Filters applied. ${filtered.length} of ${events.length} anomalies match current criteria.`;
      announce(resultDescription, 'polite');
      
      // Log performance in development
      if (import.meta.env.DEV) {
        console.log(`Applied filters to ${events.length} events, result: ${filtered.length} events in ${filterTime.toFixed(2)}ms`);
      }
      
    } catch (error) {
      console.error('Error applying filters:', error);
      announce('Error applying filters. Showing all data.', 'assertive');
      // Fallback to unfiltered events
      setFilteredEvents(events);
    } finally {
      setIsFilteringInProgress(false);
      announceStatus('');
    }
  }, [announce, announceStatus]);

  // Handle filter changes with debouncing for performance
  const handleFiltersChange = useCallback((filters: FilterCriteria) => {
    setCurrentFilters(filters);
    
    // Notify parent component
    onFiltersChange?.(filters);
    
    // Apply filters to current events
    applyFiltersToEvents(anomalyEvents, filters);
  }, [anomalyEvents, applyFiltersToEvents, onFiltersChange]);

  const handleViewportChange = useCallback((viewport: ViewportState) => {
    setCurrentViewport(viewport);
    onViewportChange?.(viewport);
    
    // Announce viewport changes to screen readers
    const description = screenReaderManager.describeMapViewport(viewport);
    queueAnnouncement(description, 'polite');
  }, [onViewportChange, screenReaderManager, queueAnnouncement]);

  const handleLocationCenter = useCallback((lat: number, lng: number) => {
    if (mapRef.current) {
      // Center on location with a reasonable zoom level for viewing local area
      const zoomLevel = currentViewport?.zoom && currentViewport.zoom > 12 ? currentViewport.zoom : 15;
      mapRef.current.centerOnLocation(lat, lng, zoomLevel);
    }
  }, [currentViewport]);

  // Handle cluster click - zoom to cluster bounds or appropriate zoom level
  const handleClusterClick = useCallback((cluster: ClusterData) => {
    if (mapRef.current) {
      // Calculate appropriate zoom level for cluster expansion
      // If cluster bounds are very small, zoom to a specific level instead of fitting bounds
      const boundsWidth = cluster.bounds.east - cluster.bounds.west;
      const boundsHeight = cluster.bounds.north - cluster.bounds.south;
      const boundsArea = boundsWidth * boundsHeight;
      
      if (boundsArea < 0.001) { // Very small area
        // Zoom to a level that will show individual markers (zoom 15)
        mapRef.current.centerOnLocation(cluster.latitude, cluster.longitude, 15);
      } else {
        // Fit bounds to show all events in the cluster
        mapRef.current.fitBounds(cluster.bounds);
      }
    }
    // Also call the external handler if provided
    onClusterClick?.(cluster);
  }, [onClusterClick]);

  // Heat map control handlers
  const handleHeatMapToggle = useCallback((visible: boolean) => {
    setHeatMapVisible(visible);
    const newMode: VisualizationMode = visible ? 'heatmap' : 'markers';
    setVisualizationMode(newMode);
    onVisualizationModeChange?.(newMode);
  }, [onVisualizationModeChange]);

  const handleHeatMapIntensityChange = useCallback((intensity: number) => {
    setHeatMapIntensity(intensity);
  }, []);

  const handleHeatMapRadiusChange = useCallback((radius: number) => {
    setHeatMapRadius(radius);
  }, []);

  const handleHeatMapProcessingStart = useCallback(() => {
    setIsHeatMapProcessing(true);
  }, []);

  const handleHeatMapProcessingEnd = useCallback(() => {
    setIsHeatMapProcessing(false);
  }, []);

  // Map layer control handlers
  const handleMapStyleChange = useCallback((style: MapStyle) => {
    setCurrentMapStyle(style);
    onMapStyleChange?.(style);
    
    if (import.meta.env.DEV) {
      console.log(`Map style changed to: ${style}`);
    }
  }, [onMapStyleChange]);

  const handleLayerTransitionStart = useCallback(() => {
    setIsLayerTransitioning(true);
  }, []);

  const handleLayerTransitionEnd = useCallback(() => {
    setIsLayerTransitioning(false);
  }, []);

  // Apply performance optimizations to anomaly events
  const optimizedAnomalyEvents = React.useMemo(() => {
    const eventsToOptimize = filteredEvents;
    
    if (!performanceOptimizations.shouldReduceMarkers) {
      return eventsToOptimize;
    }
    
    // Reduce markers by showing only high severity events when performance is poor
    return eventsToOptimize.filter(event => event.severity >= 3);
  }, [filteredEvents, performanceOptimizations.shouldReduceMarkers]);

  return (
    <div 
      ref={mapWrapperRef}
      className={`map-wrapper ${className} device-${deviceType} ${isTouchEnabled ? 'touch-enabled' : 'no-touch'}`} 
      style={{ position: 'relative', height: '100%', width: '100%' }}
      data-device-type={deviceType}
      data-touch-enabled={isTouchEnabled}
      role="application"
      aria-label="Interactive map showing road anomalies"
      tabIndex={0}
    >
      {/* Skip link for keyboard navigation */}
      <a href="#map-content" className="skip-link">
        Skip to map content
      </a>
      
      {/* Screen reader instructions */}
      <div className="sr-only" id="map-instructions">
        <h2>Map Navigation Instructions</h2>
        <p>
          This is an interactive map showing road surface anomalies. 
          Use Tab to navigate between controls and markers. 
          Use arrow keys to pan the map. 
          Use Page Up and Page Down to zoom in and out. 
          Press Enter or Space on markers to view detailed information.
        </p>
      </div>
      
      {/* Map summary for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {currentViewport && (
          <span>
            {screenReaderManager.describeMapViewport(currentViewport)}
            {filteredEvents.length > 0 && `. ${screenReaderManager.describeAnomalyEvents(filteredEvents)}`}
          </span>
        )}
      </div>
      
      {/* Loading status for screen readers */}
      <div className="sr-only" aria-live="polite" aria-atomic="false">
        {isFilteringInProgress && 'Applying filters to data'}
        {isHeatMapProcessing && 'Processing heat map visualization'}
        {isLayerTransitioning && 'Switching map layer'}
      </div>
      {/* Loading indicators */}
      {showLoadingIndicators && (
        <LoadingIndicator operations={[
          ...loadingOperations,
          ...(isFilteringInProgress ? [{
            isLoading: true,
            operation: 'filtering',
            startTime: Date.now(),
            showIndicator: true
          }] : []),
          ...(isHeatMapProcessing ? [{
            isLoading: true,
            operation: 'heat-map-processing',
            startTime: Date.now(),
            showIndicator: true
          }] : []),
          ...(isLayerTransitioning ? [{
            isLoading: true,
            operation: 'layer-transition',
            startTime: Date.now(),
            showIndicator: true
          }] : [])
        ]} />
      )}
      
      {/* Map layer controls */}
      {enableLayerControls && (
        <div className={`layer-controls-container controls-${config.controlsPosition}`} style={{
          position: 'absolute',
          top: config.controlsPosition === 'bottom' ? 'auto' : enableFiltering && enableHeatMap ? '240px' : enableFiltering ? '130px' : enableHeatMap ? '180px' : '70px',
          bottom: config.controlsPosition === 'bottom' ? '200px' : 'auto',
          left: config.controlsPosition === 'bottom' ? '10px' : '10px',
          right: config.controlsPosition === 'bottom' ? '10px' : 'auto',
          zIndex: 1000,
          maxWidth: config.controlsPosition === 'bottom' ? '100%' : '300px'
        }}>
          <MapLayerControls
            currentLayer={currentMapStyle}
            onLayerChange={handleMapStyleChange}
            className="map-layer-controls"
            disabled={isLayerTransitioning}
            touchOptimized={config.touchOptimized}
          />
        </div>
      )}
      
      {/* Heat map controls */}
      {enableHeatMap && (
        <div className={`heat-map-controls-container controls-${config.controlsPosition}`} style={{
          position: 'absolute',
          top: config.controlsPosition === 'bottom' ? 'auto' : enableFiltering ? '120px' : '70px',
          bottom: config.controlsPosition === 'bottom' ? '140px' : 'auto',
          left: config.controlsPosition === 'bottom' ? '10px' : '10px',
          right: config.controlsPosition === 'bottom' ? '10px' : 'auto',
          zIndex: 1000,
          maxWidth: config.controlsPosition === 'bottom' ? '100%' : '300px'
        }}>
          <HeatMapControls
            visible={heatMapVisible}
            onToggle={handleHeatMapToggle}
            intensity={heatMapIntensity}
            onIntensityChange={handleHeatMapIntensityChange}
            radius={heatMapRadius}
            onRadiusChange={handleHeatMapRadiusChange}
            className="map-heat-map-controls"
            disabled={!autoSwitchVisualizationMode && currentViewport?.zoom !== undefined && currentViewport.zoom >= 12}
          />
        </div>
      )}
      
      {/* Filter controls */}
      {enableFiltering && (
        <div className={`filter-controls-container controls-${config.controlsPosition}`} style={{
          position: 'absolute',
          top: config.controlsPosition === 'bottom' ? 'auto' : '10px',
          bottom: config.controlsPosition === 'bottom' ? '80px' : 'auto',
          left: config.controlsPosition === 'bottom' ? '10px' : '10px',
          right: config.controlsPosition === 'bottom' ? '10px' : 'auto',
          zIndex: 1000,
          maxWidth: config.controlsPosition === 'bottom' ? '100%' : '300px'
        }}>
          <FilterControls
            onFiltersChange={handleFiltersChange}
            initialFilters={initialFilters}
            className="map-filter-controls"
            disabled={isFilteringInProgress}
          />
        </div>
      )}
      
      <MapContainer
        ref={mapRef}
        onViewportChange={handleViewportChange}
        center={initialCenter}
        zoom={initialZoom}
        className="main-map"
        mapStyle={currentMapStyle}
        onLayerTransitionStart={handleLayerTransitionStart}
        onLayerTransitionEnd={handleLayerTransitionEnd}
        aria-describedby="map-instructions"
      >
        {/* Heat map layer */}
        {enableHeatMap && (
          <HeatMapRenderer
            events={optimizedAnomalyEvents}
            visible={heatMapVisible}
            intensity={heatMapIntensity}
            radius={heatMapRadius}
            onProcessingStart={handleHeatMapProcessingStart}
            onProcessingEnd={handleHeatMapProcessingEnd}
            aria-label={heatMapVisible ? 'Heat map showing anomaly density' : undefined}
          />
        )}
        
        {/* Anomaly markers - only show when not in heat map mode */}
        {visualizationMode === 'markers' && (
          <AnomalyMarkers 
            events={optimizedAnomalyEvents}
            viewport={currentViewport || undefined}
            onMarkerClick={onMarkerClick}
            onClusterClick={handleClusterClick}
            enableClustering={enableClustering}
            disableAnimations={performanceOptimizations.shouldDisableAnimations}
            reduceClusterRadius={performanceOptimizations.shouldReduceClusterRadius || config.clusterRadius < 50}
            aria-label={`${optimizedAnomalyEvents.length} road anomaly markers visible`}
          />
        )}
      </MapContainer>
      
      <div className={`map-controls controls-${config.controlsPosition}`} style={{ 
        position: config.controlsPosition === 'bottom' ? 'fixed' : 'absolute',
        ...(config.controlsPosition === 'bottom' ? {
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          top: 'auto',
          right: 'auto',
          flexDirection: 'row',
          justifyContent: 'center'
        } : {
          top: enableFiltering && enableHeatMap && enableLayerControls ? '300px' : 
               enableFiltering && enableHeatMap ? '240px' :
               enableFiltering && enableLayerControls ? '190px' :
               enableHeatMap && enableLayerControls ? '240px' :
               enableFiltering ? '130px' : 
               enableHeatMap ? '180px' : 
               enableLayerControls ? '130px' : '70px',
          right: '10px',
          flexDirection: 'column'
        }),
        zIndex: config.controlsPosition === 'bottom' ? 1001 : 1000,
        display: 'flex',
        gap: '10px'
      }}>
        <LocationControls
          onLocationCenter={handleLocationCenter}
          className="location-control"
          touchOptimized={config.touchOptimized}
        />
      </div>
      
      {/* Performance monitor */}
      {showPerformanceMonitor && (
        <PerformanceMonitor showDetails={showPerformanceMonitor} />
      )}
    </div>
  );
};

export default Map;