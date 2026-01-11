import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { RoadAnomalyEvent, FilterCriteria, ViewportState, VisualizationMode, MapStyle } from '../types';
import { dataManager } from '../utils/dataManager';
import { performanceMonitor } from '../utils/performanceMonitor';
import { errorHandler } from '../utils/errorHandler';
import { offlineManager } from '../utils/offlineManager';

// Application state interface
export interface AppState {
  // Data state
  anomalyEvents: RoadAnomalyEvent[];
  filteredEvents: RoadAnomalyEvent[];
  isLoading: boolean;
  error: string | null;
  
  // Map state
  viewport: ViewportState | null;
  mapStyle: MapStyle;
  visualizationMode: VisualizationMode;
  
  // Filter state
  activeFilters: FilterCriteria | null;
  
  // UI state
  selectedEvent: RoadAnomalyEvent | null;
  showPerformanceMonitor: boolean;
  showLoadingIndicators: boolean;
  
  // System state
  isOnline: boolean;
  performanceOptimized: boolean;
  accessibilityEnabled: boolean;
}

// Action types
export type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_ANOMALY_EVENTS'; payload: RoadAnomalyEvent[] }
  | { type: 'SET_FILTERED_EVENTS'; payload: RoadAnomalyEvent[] }
  | { type: 'SET_VIEWPORT'; payload: ViewportState }
  | { type: 'SET_MAP_STYLE'; payload: MapStyle }
  | { type: 'SET_VISUALIZATION_MODE'; payload: VisualizationMode }
  | { type: 'SET_ACTIVE_FILTERS'; payload: FilterCriteria | null }
  | { type: 'SET_SELECTED_EVENT'; payload: RoadAnomalyEvent | null }
  | { type: 'SET_PERFORMANCE_MONITOR'; payload: boolean }
  | { type: 'SET_LOADING_INDICATORS'; payload: boolean }
  | { type: 'SET_ONLINE_STATUS'; payload: boolean }
  | { type: 'SET_PERFORMANCE_OPTIMIZED'; payload: boolean }
  | { type: 'SET_ACCESSIBILITY_ENABLED'; payload: boolean }
  | { type: 'RESET_STATE' };

// Initial state
const initialState: AppState = {
  anomalyEvents: [],
  filteredEvents: [],
  isLoading: false,
  error: null,
  viewport: null,
  mapStyle: 'street',
  visualizationMode: 'markers',
  activeFilters: null,
  selectedEvent: null,
  showPerformanceMonitor: import.meta.env.DEV,
  showLoadingIndicators: true,
  isOnline: navigator.onLine,
  performanceOptimized: false,
  accessibilityEnabled: false
};

// Reducer function
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    
    case 'SET_ANOMALY_EVENTS':
      return { 
        ...state, 
        anomalyEvents: action.payload,
        filteredEvents: state.activeFilters 
          ? applyFiltersToEvents(action.payload, state.activeFilters)
          : action.payload
      };
    
    case 'SET_FILTERED_EVENTS':
      return { ...state, filteredEvents: action.payload };
    
    case 'SET_VIEWPORT':
      return { ...state, viewport: action.payload };
    
    case 'SET_MAP_STYLE':
      return { ...state, mapStyle: action.payload };
    
    case 'SET_VISUALIZATION_MODE':
      return { ...state, visualizationMode: action.payload };
    
    case 'SET_ACTIVE_FILTERS':
      return { 
        ...state, 
        activeFilters: action.payload,
        filteredEvents: action.payload 
          ? applyFiltersToEvents(state.anomalyEvents, action.payload)
          : state.anomalyEvents
      };
    
    case 'SET_SELECTED_EVENT':
      return { ...state, selectedEvent: action.payload };
    
    case 'SET_PERFORMANCE_MONITOR':
      return { ...state, showPerformanceMonitor: action.payload };
    
    case 'SET_LOADING_INDICATORS':
      return { ...state, showLoadingIndicators: action.payload };
    
    case 'SET_ONLINE_STATUS':
      return { ...state, isOnline: action.payload };
    
    case 'SET_PERFORMANCE_OPTIMIZED':
      return { ...state, performanceOptimized: action.payload };
    
    case 'SET_ACCESSIBILITY_ENABLED':
      return { ...state, accessibilityEnabled: action.payload };
    
    case 'RESET_STATE':
      return { ...initialState, showPerformanceMonitor: state.showPerformanceMonitor };
    
    default:
      return state;
  }
}

// Helper function to apply filters
function applyFiltersToEvents(events: RoadAnomalyEvent[], filters: FilterCriteria): RoadAnomalyEvent[] {
  return events.filter(event => {
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
}

// Context interface
export interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  
  // Action creators
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setAnomalyEvents: (events: RoadAnomalyEvent[]) => void;
  setViewport: (viewport: ViewportState) => void;
  setMapStyle: (style: MapStyle) => void;
  setVisualizationMode: (mode: VisualizationMode) => void;
  setActiveFilters: (filters: FilterCriteria | null) => void;
  setSelectedEvent: (event: RoadAnomalyEvent | null) => void;
  
  // Data operations
  loadEventsForViewport: (viewport: ViewportState, filters?: FilterCriteria) => Promise<void>;
  refreshData: () => Promise<void>;
  clearCache: () => void;
  
  // System operations
  togglePerformanceMonitor: () => void;
  toggleAccessibility: () => void;
  resetApplication: () => void;
}

// Create context
const AppContext = createContext<AppContextValue | undefined>(undefined);

// Provider component
export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Action creators
  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, []);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const setAnomalyEvents = useCallback((events: RoadAnomalyEvent[]) => {
    dispatch({ type: 'SET_ANOMALY_EVENTS', payload: events });
  }, []);

  const setViewport = useCallback((viewport: ViewportState) => {
    dispatch({ type: 'SET_VIEWPORT', payload: viewport });
    
    // Update data manager viewport for virtualization
    dataManager.updateViewport(viewport);
  }, []);

  const setMapStyle = useCallback((style: MapStyle) => {
    dispatch({ type: 'SET_MAP_STYLE', payload: style });
  }, []);

  const setVisualizationMode = useCallback((mode: VisualizationMode) => {
    dispatch({ type: 'SET_VISUALIZATION_MODE', payload: mode });
  }, []);

  const setActiveFilters = useCallback((filters: FilterCriteria | null) => {
    dispatch({ type: 'SET_ACTIVE_FILTERS', payload: filters });
  }, []);

  const setSelectedEvent = useCallback((event: RoadAnomalyEvent | null) => {
    dispatch({ type: 'SET_SELECTED_EVENT', payload: event });
  }, []);

  // Data operations
  const loadEventsForViewport = useCallback(async (
    viewport: ViewportState, 
    filters?: FilterCriteria
  ) => {
    setLoading(true);
    setError(null);

    try {
      const events = await dataManager.fetchEvents(
        viewport.bounds,
        filters || state.activeFilters || undefined
      );
      
      setAnomalyEvents(events);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
      setError(errorMessage);
      console.error('Failed to load events for viewport:', error);
    } finally {
      setLoading(false);
    }
  }, [state.activeFilters, setLoading, setError, setAnomalyEvents]);

  const refreshData = useCallback(async () => {
    if (!state.viewport) return;
    
    // Clear cache and reload
    dataManager.clearCache();
    await loadEventsForViewport(state.viewport, state.activeFilters || undefined);
  }, [state.viewport, state.activeFilters, loadEventsForViewport]);

  const clearCache = useCallback(() => {
    dataManager.clearCache();
    setAnomalyEvents([]);
  }, [setAnomalyEvents]);

  // System operations
  const togglePerformanceMonitor = useCallback(() => {
    dispatch({ 
      type: 'SET_PERFORMANCE_MONITOR', 
      payload: !state.showPerformanceMonitor 
    });
  }, [state.showPerformanceMonitor]);

  const toggleAccessibility = useCallback(() => {
    dispatch({ 
      type: 'SET_ACCESSIBILITY_ENABLED', 
      payload: !state.accessibilityEnabled 
    });
  }, [state.accessibilityEnabled]);

  const resetApplication = useCallback(() => {
    dataManager.clearCache();
    dispatch({ type: 'RESET_STATE' });
  }, []);

  // Set up system monitoring and event listeners
  useEffect(() => {
    // Online/offline status monitoring
    const handleOnline = () => dispatch({ type: 'SET_ONLINE_STATUS', payload: true });
    const handleOffline = () => dispatch({ type: 'SET_ONLINE_STATUS', payload: false });
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Performance monitoring
    const unsubscribePerformance = performanceMonitor.onPerformanceChange((metrics) => {
      const shouldOptimize = metrics.fps < 30 || metrics.memoryUsage > 100;
      if (shouldOptimize !== state.performanceOptimized) {
        dispatch({ type: 'SET_PERFORMANCE_OPTIMIZED', payload: shouldOptimize });
      }
    });

    // Error handling
    const unsubscribeErrors = errorHandler.onError((report) => {
      if (report.severity === 'high' || report.severity === 'critical') {
        setError(`System error: ${report.error.message}`);
      }
    });

    // Data updates from DataManager
    const unsubscribeDataUpdates = dataManager.subscribeToUpdates((events) => {
      setAnomalyEvents(events);
    });

    // Accessibility detection
    const checkAccessibility = () => {
      const hasScreenReader = window.speechSynthesis !== undefined;
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const hasHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
      
      const accessibilityNeeded = hasScreenReader || prefersReducedMotion || hasHighContrast;
      if (accessibilityNeeded !== state.accessibilityEnabled) {
        dispatch({ type: 'SET_ACCESSIBILITY_ENABLED', payload: accessibilityNeeded });
      }
    };

    checkAccessibility();

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribePerformance();
      unsubscribeErrors();
      unsubscribeDataUpdates();
    };
  }, [state.performanceOptimized, state.accessibilityEnabled, setError, setAnomalyEvents]);

  // Auto-load data when viewport changes
  useEffect(() => {
    if (state.viewport && !state.isLoading) {
      loadEventsForViewport(state.viewport, state.activeFilters || undefined);
    }
  }, [state.viewport, state.activeFilters, loadEventsForViewport, state.isLoading]);

  // Context value
  const contextValue: AppContextValue = {
    state,
    dispatch,
    setLoading,
    setError,
    setAnomalyEvents,
    setViewport,
    setMapStyle,
    setVisualizationMode,
    setActiveFilters,
    setSelectedEvent,
    loadEventsForViewport,
    refreshData,
    clearCache,
    togglePerformanceMonitor,
    toggleAccessibility,
    resetApplication
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Hook to use the context
export const useAppContext = (): AppContextValue => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

// Hook for specific state slices
export const useAppState = () => {
  const { state } = useAppContext();
  return state;
};

export const useMapState = () => {
  const { state } = useAppContext();
  return {
    viewport: state.viewport,
    mapStyle: state.mapStyle,
    visualizationMode: state.visualizationMode,
    selectedEvent: state.selectedEvent
  };
};

export const useDataState = () => {
  const { state } = useAppContext();
  return {
    anomalyEvents: state.anomalyEvents,
    filteredEvents: state.filteredEvents,
    isLoading: state.isLoading,
    error: state.error,
    activeFilters: state.activeFilters
  };
};

export const useSystemState = () => {
  const { state } = useAppContext();
  return {
    isOnline: state.isOnline,
    performanceOptimized: state.performanceOptimized,
    accessibilityEnabled: state.accessibilityEnabled,
    showPerformanceMonitor: state.showPerformanceMonitor,
    showLoadingIndicators: state.showLoadingIndicators
  };
};