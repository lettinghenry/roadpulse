import React, { useCallback, useEffect, useRef } from 'react';
import { Map } from './Map';
import { ErrorBoundary } from './ErrorBoundary';
import { ResponsiveLayout } from './ResponsiveLayout';
import { SystemStatusIndicator } from './SystemStatusIndicator';
import { useAppContext, useMapState, useDataState, useSystemState } from '../context/AppContext';
import { ViewportState, RoadAnomalyEvent, FilterCriteria, VisualizationMode, MapStyle } from '../types';
import { performanceMonitor } from '../utils/performanceMonitor';
import { useKeyboardNavigation } from '../utils/keyboardNavigation';
import { useScreenReader } from '../utils/screenReader';
import { useResponsive } from '../utils/responsive';
import './IntegratedMapApplication.css';

interface IntegratedMapApplicationProps {
  className?: string;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  enableOfflineMode?: boolean;
  enablePerformanceOptimizations?: boolean;
  enableAccessibilityFeatures?: boolean;
}

/**
 * IntegratedMapApplication is the main component that wires together all
 * map visualization features with proper state management, error handling,
 * accessibility, and performance optimization.
 */
export const IntegratedMapApplication: React.FC<IntegratedMapApplicationProps> = ({
  className = '',
  initialCenter = { lat: 40.7128, lng: -74.0060 }, // Default to NYC
  initialZoom = 12,
  enableOfflineMode = true,
  enablePerformanceOptimizations = true,
  enableAccessibilityFeatures = true
}) => {
  const appRef = useRef<HTMLDivElement>(null);
  
  // Context hooks
  const {
    setViewport,
    setMapStyle,
    setVisualizationMode,
    setActiveFilters,
    setSelectedEvent,
    togglePerformanceMonitor,
    refreshData,
    resetApplication
  } = useAppContext();

  // State hooks
  const { viewport, mapStyle, visualizationMode, selectedEvent } = useMapState();
  const { filteredEvents, isLoading, error, activeFilters } = useDataState();
  const { 
    isOnline, 
    performanceOptimized, 
    accessibilityEnabled, 
    showPerformanceMonitor,
    showLoadingIndicators 
  } = useSystemState();

  // Responsive design hook
  const { deviceType, isTouchEnabled, config } = useResponsive();

  // Screen reader support
  const { announce, announceStatus, manager: screenReaderManager } = useScreenReader();

  // Keyboard navigation
  useKeyboardNavigation(appRef, {
    onArrowKey: (direction) => {
      // Arrow key navigation is handled by the Map component
    },
    onEnterKey: () => {
      // Enter key handled by focused elements
    },
    onEscapeKey: () => {
      // Clear selections and close popups
      setSelectedEvent(null);
      announce('Selection cleared', 'polite');
    },
    onSpaceKey: () => {
      // Space key same as Enter for most elements
    },
    onPageUpKey: () => {
      // Zoom in - handled by Map component
    },
    onPageDownKey: () => {
      // Zoom out - handled by Map component
    },
    // Application-specific shortcuts
    onKeyDown: (event) => {
      // Ctrl/Cmd + R: Refresh data
      if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
        event.preventDefault();
        refreshData();
        announce('Refreshing map data', 'polite');
      }
      
      // Ctrl/Cmd + M: Toggle performance monitor
      if ((event.ctrlKey || event.metaKey) && event.key === 'm') {
        event.preventDefault();
        togglePerformanceMonitor();
        announce(
          showPerformanceMonitor ? 'Performance monitor hidden' : 'Performance monitor shown',
          'polite'
        );
      }
      
      // Ctrl/Cmd + Shift + R: Reset application
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'R') {
        event.preventDefault();
        resetApplication();
        announce('Application reset', 'assertive');
      }
    }
  });

  // Performance monitoring integration
  useEffect(() => {
    if (enablePerformanceOptimizations) {
      // Start performance monitoring for the application
      performanceMonitor.startMonitoring();
      
      return () => {
        performanceMonitor.stopMonitoring();
      };
    }
  }, [enablePerformanceOptimizations]);

  // Accessibility announcements
  useEffect(() => {
    if (enableAccessibilityFeatures && accessibilityEnabled) {
      // Announce application state changes
      if (isLoading) {
        announceStatus('Loading map data');
      } else if (error) {
        announce(`Error: ${error}`, 'assertive');
      } else if (filteredEvents.length > 0) {
        const description = screenReaderManager.describeAnomalyEvents(filteredEvents);
        announce(description, 'polite');
      }
    }
  }, [
    isLoading, 
    error, 
    filteredEvents, 
    enableAccessibilityFeatures, 
    accessibilityEnabled,
    announce,
    announceStatus,
    screenReaderManager
  ]);

  // Event handlers
  const handleViewportChange = useCallback((newViewport: ViewportState) => {
    setViewport(newViewport);
    
    // Announce viewport changes for screen readers
    if (enableAccessibilityFeatures && accessibilityEnabled) {
      const description = screenReaderManager.describeMapViewport(newViewport);
      announce(description, 'polite');
    }
  }, [setViewport, enableAccessibilityFeatures, accessibilityEnabled, screenReaderManager, announce]);

  const handleMarkerClick = useCallback((event: RoadAnomalyEvent) => {
    setSelectedEvent(event);
    
    // Announce marker selection for screen readers
    if (enableAccessibilityFeatures && accessibilityEnabled) {
      const description = `Selected anomaly: severity ${event.severity}, confidence ${Math.round(event.confidence * 100)}%`;
      announce(description, 'polite');
    }
  }, [setSelectedEvent, enableAccessibilityFeatures, accessibilityEnabled, announce]);

  const handleFiltersChange = useCallback((filters: FilterCriteria) => {
    setActiveFilters(filters);
    
    // Announce filter changes for screen readers
    if (enableAccessibilityFeatures && accessibilityEnabled) {
      const severityText = filters.severityLevels.length === 5 
        ? 'all severity levels' 
        : `severity levels ${filters.severityLevels.join(', ')}`;
      const confidenceText = `confidence above ${Math.round(filters.confidenceThreshold * 100)}%`;
      announce(`Filters applied: ${severityText}, ${confidenceText}`, 'polite');
    }
  }, [setActiveFilters, enableAccessibilityFeatures, accessibilityEnabled, announce]);

  const handleVisualizationModeChange = useCallback((mode: VisualizationMode) => {
    setVisualizationMode(mode);
    
    // Announce mode changes for screen readers
    if (enableAccessibilityFeatures && accessibilityEnabled) {
      const modeDescription = mode === 'heatmap' 
        ? 'Switched to heat map view showing density patterns'
        : 'Switched to marker view showing individual anomalies';
      announce(modeDescription, 'polite');
    }
  }, [setVisualizationMode, enableAccessibilityFeatures, accessibilityEnabled, announce]);

  const handleMapStyleChange = useCallback((style: MapStyle) => {
    setMapStyle(style);
    
    // Announce style changes for screen readers
    if (enableAccessibilityFeatures && accessibilityEnabled) {
      const styleDescription = style === 'satellite' 
        ? 'Switched to satellite imagery view'
        : 'Switched to street map view';
      announce(styleDescription, 'polite');
    }
  }, [setMapStyle, enableAccessibilityFeatures, accessibilityEnabled, announce]);

  // Error recovery handler
  const handleErrorRecovery = useCallback(() => {
    refreshData();
    announce('Attempting to recover from error', 'polite');
  }, [refreshData, announce]);

  return (
    <div 
      ref={appRef}
      className={`integrated-map-application ${className} device-${deviceType} ${isTouchEnabled ? 'touch-enabled' : 'no-touch'} ${accessibilityEnabled ? 'accessibility-enabled' : ''} ${performanceOptimized ? 'performance-optimized' : ''}`}
      data-device-type={deviceType}
      data-online={isOnline}
      data-accessibility={accessibilityEnabled}
      data-performance-optimized={performanceOptimized}
      role="application"
      aria-label="RoadPulse Map Visualization Application"
      tabIndex={0}
    >
      {/* Skip navigation for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      {/* Application header with status */}
      <header className="app-header" role="banner">
        <div className="header-content">
          <h1 className="app-title">
            RoadPulse Map Visualization
          </h1>
          
          {/* System status indicator */}
          <SystemStatusIndicator
            isOnline={isOnline}
            isLoading={isLoading}
            error={error}
            performanceOptimized={performanceOptimized}
            accessibilityEnabled={accessibilityEnabled}
            onErrorRecovery={handleErrorRecovery}
            className="system-status"
          />
        </div>
        
        {/* Keyboard shortcuts help */}
        {enableAccessibilityFeatures && (
          <div className="keyboard-shortcuts sr-only" id="keyboard-help">
            <h2>Keyboard Shortcuts</h2>
            <ul>
              <li>Arrow keys: Pan the map</li>
              <li>Page Up/Down: Zoom in/out</li>
              <li>Tab: Navigate between controls</li>
              <li>Enter/Space: Activate focused element</li>
              <li>Escape: Clear selection</li>
              <li>Ctrl+R: Refresh data</li>
              <li>Ctrl+M: Toggle performance monitor</li>
              <li>Ctrl+Shift+R: Reset application</li>
            </ul>
          </div>
        )}
      </header>

      {/* Main application content */}
      <main id="main-content" className="app-main" role="main">
        <ErrorBoundary
          fallback={({ error, resetError }) => (
            <div className="error-fallback" role="alert">
              <h2>Something went wrong</h2>
              <p>The map visualization encountered an error: {error.message}</p>
              <button onClick={resetError} className="retry-button">
                Try Again
              </button>
              <button onClick={resetApplication} className="reset-button">
                Reset Application
              </button>
            </div>
          )}
        >
          <ResponsiveLayout
            deviceType={deviceType}
            touchOptimized={isTouchEnabled}
            accessibilityEnabled={accessibilityEnabled}
          >
            <Map
              onViewportChange={handleViewportChange}
              onMarkerClick={handleMarkerClick}
              onFiltersChange={handleFiltersChange}
              onVisualizationModeChange={handleVisualizationModeChange}
              onMapStyleChange={handleMapStyleChange}
              
              // Data props
              anomalyEvents={filteredEvents}
              
              // Configuration props
              initialCenter={initialCenter}
              initialZoom={initialZoom}
              initialMapStyle={mapStyle}
              initialVisualizationMode={visualizationMode}
              initialFilters={activeFilters || undefined}
              
              // Feature flags
              enableClustering={true}
              enableFiltering={true}
              enableHeatMap={true}
              enableLayerControls={true}
              autoSwitchVisualizationMode={true}
              
              // UI configuration
              showPerformanceMonitor={showPerformanceMonitor}
              showLoadingIndicators={showLoadingIndicators}
              
              // Responsive configuration
              className={`main-map device-${deviceType}`}
              
              // Accessibility
              aria-describedby={enableAccessibilityFeatures ? "keyboard-help" : undefined}
            />
          </ResponsiveLayout>
        </ErrorBoundary>
      </main>

      {/* Status announcements for screen readers */}
      {enableAccessibilityFeatures && (
        <>
          <div 
            className="sr-only" 
            aria-live="polite" 
            aria-atomic="false"
            id="status-announcements"
          />
          <div 
            className="sr-only" 
            aria-live="assertive" 
            aria-atomic="true"
            id="urgent-announcements"
          />
        </>
      )}

      {/* Offline indicator */}
      {enableOfflineMode && !isOnline && (
        <div className="offline-indicator" role="status" aria-live="polite">
          <span className="offline-icon" aria-hidden="true">📡</span>
          <span>Offline - Using cached data</span>
        </div>
      )}

      {/* Performance optimization indicator */}
      {enablePerformanceOptimizations && performanceOptimized && (
        <div className="performance-indicator" role="status" aria-live="polite">
          <span className="performance-icon" aria-hidden="true">⚡</span>
          <span>Performance mode active</span>
        </div>
      )}
    </div>
  );
};

export default IntegratedMapApplication;