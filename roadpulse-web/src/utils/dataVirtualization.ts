import { RoadAnomalyEvent, LatLngBounds, ViewportState } from '../types';

// Configuration constants
const VIEWPORT_BUFFER_RATIO = 0.2; // 20% buffer around viewport
const MAX_VISIBLE_EVENTS = 1000; // Maximum events to render at once
const MEMORY_CLEANUP_THRESHOLD = 5000; // Clean up when total events exceed this
const UNLOAD_DISTANCE_MULTIPLIER = 3; // Unload data this many viewport widths away

// Priority levels for loading
export enum LoadPriority {
  HIGH = 1,    // Current viewport
  MEDIUM = 2,  // Buffer zone
  LOW = 3      // Background loading
}

// Event with loading metadata
interface VirtualizedEvent extends RoadAnomalyEvent {
  loadPriority: LoadPriority;
  lastAccessed: number;
  isVisible: boolean;
}

// Spatial grid for efficient querying
interface SpatialGrid {
  [key: string]: VirtualizedEvent[];
}

// Loading state tracking
interface LoadingState {
  isLoading: boolean;
  loadedBounds: LatLngBounds[];
  pendingBounds: LatLngBounds[];
  lastLoadTime: number;
}

/**
 * DataVirtualization manages large datasets by loading only visible data
 * and implementing progressive loading with spatial indexing
 */
export class DataVirtualization {
  private spatialGrid: SpatialGrid = {};
  private allEvents: Map<string, VirtualizedEvent> = new Map();
  private visibleEvents: Set<string> = new Set();
  private loadingState: LoadingState = {
    isLoading: false,
    loadedBounds: [],
    pendingBounds: [],
    lastLoadTime: 0
  };
  
  private gridSize = 0.01; // ~1km grid cells
  private currentViewport: ViewportState | null = null;
  private loadCallbacks = new Set<(bounds: LatLngBounds, priority: LoadPriority) => Promise<RoadAnomalyEvent[]>>();
  private updateCallbacks = new Set<(events: RoadAnomalyEvent[]) => void>();

  /**
   * Update the current viewport and trigger data loading/unloading
   */
  updateViewport(viewport: ViewportState): void {
    this.currentViewport = viewport;
    
    // Calculate visible and buffer bounds
    const visibleBounds = viewport.bounds;
    const bufferBounds = this.expandBounds(visibleBounds, VIEWPORT_BUFFER_RATIO);
    
    // Update visibility flags
    this.updateEventVisibility(visibleBounds);
    
    // Load data for current viewport with high priority
    this.loadDataForBounds(visibleBounds, LoadPriority.HIGH);
    
    // Load buffer data with medium priority
    this.loadDataForBounds(bufferBounds, LoadPriority.MEDIUM);
    
    // Unload distant data to free memory
    this.unloadDistantData(viewport);
    
    // Notify subscribers with current visible events
    this.notifyUpdateCallbacks();
  }

  /**
   * Add events to the virtualization system
   */
  addEvents(events: RoadAnomalyEvent[], bounds: LatLngBounds, priority: LoadPriority): void {
    const now = Date.now();
    
    events.forEach(event => {
      const virtualizedEvent: VirtualizedEvent = {
        ...event,
        loadPriority: priority,
        lastAccessed: now,
        isVisible: this.isEventInBounds(event, this.currentViewport?.bounds)
      };
      
      // Add to main collection
      this.allEvents.set(event.id, virtualizedEvent);
      
      // Add to spatial grid
      const gridKey = this.getGridKey(event.latitude, event.longitude);
      if (!this.spatialGrid[gridKey]) {
        this.spatialGrid[gridKey] = [];
      }
      this.spatialGrid[gridKey].push(virtualizedEvent);
      
      // Update visible set
      if (virtualizedEvent.isVisible) {
        this.visibleEvents.add(event.id);
      }
    });
    
    // Update loading state
    this.loadingState.loadedBounds.push(bounds);
    this.loadingState.lastLoadTime = now;
    
    // Trigger memory cleanup if needed
    if (this.allEvents.size > MEMORY_CLEANUP_THRESHOLD) {
      this.performMemoryCleanup();
    }
  }

  /**
   * Get currently visible events for rendering
   */
  getVisibleEvents(): RoadAnomalyEvent[] {
    const visibleEventsList: RoadAnomalyEvent[] = [];
    let count = 0;
    
    // Sort by priority and severity for better user experience
    const sortedEvents = Array.from(this.visibleEvents)
      .map(id => this.allEvents.get(id)!)
      .filter(event => event)
      .sort((a, b) => {
        // First by priority (high priority first)
        if (a.loadPriority !== b.loadPriority) {
          return a.loadPriority - b.loadPriority;
        }
        // Then by severity (high severity first)
        return b.severity - a.severity;
      });
    
    // Limit to MAX_VISIBLE_EVENTS for performance
    for (const event of sortedEvents) {
      if (count >= MAX_VISIBLE_EVENTS) break;
      
      visibleEventsList.push(event);
      event.lastAccessed = Date.now();
      count++;
    }
    
    return visibleEventsList;
  }

  /**
   * Register a callback for loading data
   */
  onLoadData(callback: (bounds: LatLngBounds, priority: LoadPriority) => Promise<RoadAnomalyEvent[]>): () => void {
    this.loadCallbacks.add(callback);
    return () => this.loadCallbacks.delete(callback);
  }

  /**
   * Register a callback for data updates
   */
  onDataUpdate(callback: (events: RoadAnomalyEvent[]) => void): () => void {
    this.updateCallbacks.add(callback);
    return () => this.updateCallbacks.delete(callback);
  }

  /**
   * Get virtualization statistics
   */
  getStats() {
    return {
      totalEvents: this.allEvents.size,
      visibleEvents: this.visibleEvents.size,
      gridCells: Object.keys(this.spatialGrid).length,
      loadedBounds: this.loadingState.loadedBounds.length,
      isLoading: this.loadingState.isLoading,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Clear all data and reset state
   */
  clear(): void {
    this.spatialGrid = {};
    this.allEvents.clear();
    this.visibleEvents.clear();
    this.loadingState = {
      isLoading: false,
      loadedBounds: [],
      pendingBounds: [],
      lastLoadTime: 0
    };
  }

  // Private methods

  private expandBounds(bounds: LatLngBounds, ratio: number): LatLngBounds {
    const latDiff = (bounds.north - bounds.south) * ratio;
    const lngDiff = (bounds.east - bounds.west) * ratio;
    
    return {
      north: bounds.north + latDiff,
      south: bounds.south - latDiff,
      east: bounds.east + lngDiff,
      west: bounds.west - lngDiff
    };
  }

  private updateEventVisibility(visibleBounds: LatLngBounds): void {
    this.visibleEvents.clear();
    
    // Get grid cells that intersect with visible bounds
    const gridKeys = this.getIntersectingGridKeys(visibleBounds);
    
    gridKeys.forEach(gridKey => {
      const events = this.spatialGrid[gridKey] || [];
      events.forEach(event => {
        const isVisible = this.isEventInBounds(event, visibleBounds);
        event.isVisible = isVisible;
        
        if (isVisible) {
          this.visibleEvents.add(event.id);
        }
      });
    });
  }

  private async loadDataForBounds(bounds: LatLngBounds, priority: LoadPriority): Promise<void> {
    // Check if bounds are already loaded or loading
    if (this.isBoundsLoaded(bounds) || this.isBoundsPending(bounds)) {
      return;
    }
    
    // Add to pending
    this.loadingState.pendingBounds.push(bounds);
    this.loadingState.isLoading = true;
    
    try {
      // Call all registered load callbacks
      const loadPromises = Array.from(this.loadCallbacks).map(callback =>
        callback(bounds, priority)
      );
      
      const results = await Promise.allSettled(loadPromises);
      
      // Process successful results
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value.length > 0) {
          this.addEvents(result.value, bounds, priority);
        }
      });
      
    } catch (error) {
      console.error('Error loading data for bounds:', error);
    } finally {
      // Remove from pending
      this.loadingState.pendingBounds = this.loadingState.pendingBounds.filter(
        b => !this.boundsEqual(b, bounds)
      );
      this.loadingState.isLoading = this.loadingState.pendingBounds.length > 0;
    }
  }

  private unloadDistantData(viewport: ViewportState): void {
    const viewportSize = Math.max(
      viewport.bounds.north - viewport.bounds.south,
      viewport.bounds.east - viewport.bounds.west
    );
    const unloadDistance = viewportSize * UNLOAD_DISTANCE_MULTIPLIER;
    
    const eventsToRemove: string[] = [];
    
    this.allEvents.forEach((event, id) => {
      const distance = this.calculateDistance(
        viewport.center,
        { lat: event.latitude, lng: event.longitude }
      );
      
      // Unload events that are far away and haven't been accessed recently
      const timeSinceAccess = Date.now() - event.lastAccessed;
      if (distance > unloadDistance && timeSinceAccess > 5 * 60 * 1000) { // 5 minutes
        eventsToRemove.push(id);
      }
    });
    
    // Remove events from all collections
    eventsToRemove.forEach(id => {
      const event = this.allEvents.get(id);
      if (event) {
        // Remove from spatial grid
        const gridKey = this.getGridKey(event.latitude, event.longitude);
        const gridEvents = this.spatialGrid[gridKey];
        if (gridEvents) {
          const index = gridEvents.findIndex(e => e.id === id);
          if (index >= 0) {
            gridEvents.splice(index, 1);
          }
          if (gridEvents.length === 0) {
            delete this.spatialGrid[gridKey];
          }
        }
        
        // Remove from main collections
        this.allEvents.delete(id);
        this.visibleEvents.delete(id);
      }
    });
  }

  private performMemoryCleanup(): void {
    const now = Date.now();
    const cleanupThreshold = 10 * 60 * 1000; // 10 minutes
    
    const eventsToRemove: string[] = [];
    
    // Remove old, low-priority events
    this.allEvents.forEach((event, id) => {
      const timeSinceAccess = now - event.lastAccessed;
      if (
        event.loadPriority === LoadPriority.LOW &&
        timeSinceAccess > cleanupThreshold &&
        !event.isVisible
      ) {
        eventsToRemove.push(id);
      }
    });
    
    // Remove events
    eventsToRemove.forEach(id => {
      const event = this.allEvents.get(id);
      if (event) {
        const gridKey = this.getGridKey(event.latitude, event.longitude);
        const gridEvents = this.spatialGrid[gridKey];
        if (gridEvents) {
          const index = gridEvents.findIndex(e => e.id === id);
          if (index >= 0) {
            gridEvents.splice(index, 1);
          }
        }
        this.allEvents.delete(id);
        this.visibleEvents.delete(id);
      }
    });
  }

  private getGridKey(lat: number, lng: number): string {
    const gridLat = Math.floor(lat / this.gridSize);
    const gridLng = Math.floor(lng / this.gridSize);
    return `${gridLat},${gridLng}`;
  }

  private getIntersectingGridKeys(bounds: LatLngBounds): string[] {
    const keys: string[] = [];
    
    const minGridLat = Math.floor(bounds.south / this.gridSize);
    const maxGridLat = Math.floor(bounds.north / this.gridSize);
    const minGridLng = Math.floor(bounds.west / this.gridSize);
    const maxGridLng = Math.floor(bounds.east / this.gridSize);
    
    for (let lat = minGridLat; lat <= maxGridLat; lat++) {
      for (let lng = minGridLng; lng <= maxGridLng; lng++) {
        keys.push(`${lat},${lng}`);
      }
    }
    
    return keys;
  }

  private isEventInBounds(event: { latitude: number; longitude: number }, bounds?: LatLngBounds): boolean {
    if (!bounds) return false;
    
    return (
      event.latitude >= bounds.south &&
      event.latitude <= bounds.north &&
      event.longitude >= bounds.west &&
      event.longitude <= bounds.east
    );
  }

  private isBoundsLoaded(bounds: LatLngBounds): boolean {
    return this.loadingState.loadedBounds.some(loaded =>
      this.boundsContain(loaded, bounds)
    );
  }

  private isBoundsPending(bounds: LatLngBounds): boolean {
    return this.loadingState.pendingBounds.some(pending =>
      this.boundsEqual(pending, bounds)
    );
  }

  private boundsContain(container: LatLngBounds, contained: LatLngBounds): boolean {
    return (
      container.north >= contained.north &&
      container.south <= contained.south &&
      container.east >= contained.east &&
      container.west <= contained.west
    );
  }

  private boundsEqual(a: LatLngBounds, b: LatLngBounds): boolean {
    const tolerance = 0.0001;
    return (
      Math.abs(a.north - b.north) < tolerance &&
      Math.abs(a.south - b.south) < tolerance &&
      Math.abs(a.east - b.east) < tolerance &&
      Math.abs(a.west - b.west) < tolerance
    );
  }

  private calculateDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(point2.lat - point1.lat);
    const dLng = this.toRadians(point2.lng - point1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(point1.lat)) * Math.cos(this.toRadians(point2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private notifyUpdateCallbacks(): void {
    const visibleEvents = this.getVisibleEvents();
    this.updateCallbacks.forEach(callback => {
      try {
        callback(visibleEvents);
      } catch (error) {
        console.error('Error in data update callback:', error);
      }
    });
  }

  private estimateMemoryUsage(): number {
    // Rough estimation: ~300 bytes per event including metadata
    return this.allEvents.size * 300;
  }
}

// Export singleton instance
export const dataVirtualization = new DataVirtualization();