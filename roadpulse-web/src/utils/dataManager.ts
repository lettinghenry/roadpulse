import { RoadAnomalyEvent, FilterCriteria, LatLngBounds, ViewportState } from '../types';
import { dataVirtualization, LoadPriority } from './dataVirtualization';
import { measureAsync } from './performanceMonitor';
import { errorHandler, ApiError, NetworkError, resilientFetch } from './errorHandler';
import { offlineManager } from './offlineManager';

// API configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB in bytes

// Cache entry interface
interface CacheEntry {
  data: RoadAnomalyEvent[];
  timestamp: number;
  bounds: LatLngBounds;
  filters: FilterCriteria;
  size: number; // Approximate size in bytes
}

// API response interface
interface ApiResponse {
  events: RoadAnomalyEvent[];
  total: number;
  hasMore: boolean;
}

/**
 * DataManager handles API integration, caching, and data management
 * for road anomaly events with viewport-based loading and offline support.
 * Now integrated with DataVirtualization for large dataset handling.
 */
export class DataManager {
  private cache = new Map<string, CacheEntry>();
  private currentCacheSize = 0;
  private updateCallbacks = new Set<(events: RoadAnomalyEvent[]) => void>();
  private abortController: AbortController | null = null;
  private isVirtualizationEnabled = true;

  constructor() {
    this.loadCacheFromStorage();
    this.setupVirtualization();
  }

  /**
   * Enable or disable data virtualization
   */
  setVirtualizationEnabled(enabled: boolean): void {
    this.isVirtualizationEnabled = enabled;
    if (!enabled) {
      dataVirtualization.clear();
    }
  }

  /**
   * Update viewport for virtualized data loading
   */
  updateViewport(viewport: ViewportState): void {
    if (this.isVirtualizationEnabled) {
      dataVirtualization.updateViewport(viewport);
    }
  }

  /**
   * Get virtualized events for current viewport
   */
  getVirtualizedEvents(): RoadAnomalyEvent[] {
    if (this.isVirtualizationEnabled) {
      return dataVirtualization.getVisibleEvents();
    }
    return [];
  }

  /**
   * Get virtualization statistics
   */
  getVirtualizationStats() {
    return dataVirtualization.getStats();
  }

  /**
   * Fetch road anomaly events for a given viewport and filters
   * Now supports virtualized loading for large datasets with comprehensive error handling and offline fallback
   */
  async fetchEvents(
    bounds: LatLngBounds,
    filters: FilterCriteria = this.getDefaultFilters(),
    priority: LoadPriority = LoadPriority.HIGH
  ): Promise<RoadAnomalyEvent[]> {
    // Use performance monitoring for data loading operations
    return measureAsync('data_loading', async () => {
      // Check cache first
      const cachedData = this.getCachedEvents(bounds, filters);
      if (cachedData.length > 0) {
        // Add to virtualization system if enabled
        if (this.isVirtualizationEnabled) {
          dataVirtualization.addEvents(cachedData, bounds, priority);
        }
        return cachedData;
      }

      try {
        // Cancel any ongoing request
        if (this.abortController) {
          this.abortController.abort();
        }
        this.abortController = new AbortController();

        // Use resilient fetch with error handling
        const response = await this.makeApiRequestWithRetry(bounds, filters, this.abortController.signal);
        const events = this.processApiResponse(response);
        
        // Cache the results
        this.cacheEvents(events, bounds, filters);
        
        // Store for offline use
        await offlineManager.storeOfflineData(bounds, events, filters);
        
        // Add to virtualization system if enabled
        if (this.isVirtualizationEnabled) {
          dataVirtualization.addEvents(events, bounds, priority);
        }
        
        // Notify subscribers
        this.notifyUpdateCallbacks(events);
        
        return events;
      } catch (error) {
        // Handle errors with comprehensive fallback strategies
        return this.handleFetchError(error as Error, bounds, filters, priority);
      }
    });
  }

  /**
   * Cache events with LRU eviction policy
   */
  cacheEvents(
    events: RoadAnomalyEvent[],
    bounds: LatLngBounds,
    filters: FilterCriteria
  ): void {
    const cacheKey = this.generateCacheKey(bounds, filters);
    const dataSize = this.estimateDataSize(events);
    
    // Evict old entries if cache is full
    this.evictIfNecessary(dataSize);
    
    const cacheEntry: CacheEntry = {
      data: events,
      timestamp: Date.now(),
      bounds,
      filters,
      size: dataSize
    };
    
    this.cache.set(cacheKey, cacheEntry);
    this.currentCacheSize += dataSize;
    
    // Persist to localStorage
    this.saveCacheToStorage();
  }

  /**
   * Get cached events for exact bounds and filters
   */
  getCachedEvents(bounds: LatLngBounds, filters: FilterCriteria): RoadAnomalyEvent[] {
    const cacheKey = this.generateCacheKey(bounds, filters);
    const entry = this.cache.get(cacheKey);
    
    if (!entry || this.isCacheExpired(entry)) {
      return [];
    }
    
    return entry.data;
  }

  /**
   * Get cached events with some tolerance for bounds differences
   */
  private getCachedEventsWithTolerance(
    bounds: LatLngBounds,
    filters: FilterCriteria
  ): RoadAnomalyEvent[] {
    const tolerance = 0.01; // ~1km tolerance
    
    for (const [, entry] of this.cache) {
      if (this.isCacheExpired(entry)) continue;
      if (!this.filtersMatch(entry.filters, filters)) continue;
      
      // Check if cached bounds contain the requested bounds with tolerance
      if (
        entry.bounds.north >= bounds.north - tolerance &&
        entry.bounds.south <= bounds.south + tolerance &&
        entry.bounds.east >= bounds.east - tolerance &&
        entry.bounds.west <= bounds.west + tolerance
      ) {
        // Filter events to the requested bounds
        return entry.data.filter(event =>
          event.latitude >= bounds.south &&
          event.latitude <= bounds.north &&
          event.longitude >= bounds.west &&
          event.longitude <= bounds.east
        );
      }
    }
    
    return [];
  }

  /**
   * Subscribe to data updates
   */
  subscribeToUpdates(callback: (events: RoadAnomalyEvent[]) => void): () => void {
    this.updateCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.updateCallbacks.delete(callback);
    };
  }

  /**
   * Clear all cached data and virtualization
   */
  clearCache(): void {
    this.cache.clear();
    this.currentCacheSize = 0;
    localStorage.removeItem('roadpulse-cache');
    
    if (this.isVirtualizationEnabled) {
      dataVirtualization.clear();
    }
  }

  /**
   * Get cache statistics including virtualization stats
   */
  getCacheStats() {
    const baseStats = {
      entryCount: this.cache.size,
      totalSize: this.currentCacheSize,
      maxSize: MAX_CACHE_SIZE
    };

    if (this.isVirtualizationEnabled) {
      return {
        ...baseStats,
        virtualization: dataVirtualization.getStats()
      };
    }

    return baseStats;
  }

  // Private methods

  /**
   * Handle fetch errors with comprehensive fallback strategies
   */
  private async handleFetchError(
    error: Error,
    bounds: LatLngBounds,
    filters: FilterCriteria,
    priority: LoadPriority
  ): Promise<RoadAnomalyEvent[]> {
    console.warn('Data fetch failed, attempting fallback strategies:', error);

    // Strategy 1: Check for offline data
    if (!offlineManager.getOnlineStatus()) {
      try {
        const offlineData = await offlineManager.getOfflineData(bounds, filters);
        if (offlineData.length > 0) {
          console.log(`Using offline data: ${offlineData.length} events`);
          if (this.isVirtualizationEnabled) {
            dataVirtualization.addEvents(offlineData, bounds, priority);
          }
          this.notifyUpdateCallbacks(offlineData);
          return offlineData;
        }
      } catch (offlineError) {
        console.warn('Offline data retrieval failed:', offlineError);
      }
    }

    // Strategy 2: Try cached data with tolerance
    const fallbackData = this.getCachedEventsWithTolerance(bounds, filters);
    if (fallbackData.length > 0) {
      console.log(`Using cached fallback data: ${fallbackData.length} events`);
      if (this.isVirtualizationEnabled) {
        dataVirtualization.addEvents(fallbackData, bounds, priority);
      }
      this.notifyUpdateCallbacks(fallbackData);
      return fallbackData;
    }

    // Strategy 3: Handle specific error types
    if (error.name === 'AbortError') {
      throw new NetworkError('Request was cancelled');
    }

    // Strategy 4: Use error handler for retry logic
    const result = await errorHandler.handleError(
      error,
      {
        component: 'DataManager',
        operation: 'data_loading',
        additionalData: { bounds, filters }
      },
      () => this.makeApiRequestWithRetry(bounds, filters, this.abortController?.signal)
    );

    // If error handler returns a result, process it
    if (result && result.events) {
      const events = this.processApiResponse(result);
      this.cacheEvents(events, bounds, filters);
      if (this.isVirtualizationEnabled) {
        dataVirtualization.addEvents(events, bounds, priority);
      }
      this.notifyUpdateCallbacks(events);
      return events;
    }

    // Final fallback: return empty array with error notification
    console.error('All fallback strategies failed, returning empty dataset');
    return [];
  }

  /**
   * Make API request with resilient fetch and retry logic
   */
  private async makeApiRequestWithRetry(
    bounds: LatLngBounds,
    filters: FilterCriteria,
    signal?: AbortSignal
  ): Promise<ApiResponse> {
    const params = new URLSearchParams({
      north: bounds.north.toString(),
      south: bounds.south.toString(),
      east: bounds.east.toString(),
      west: bounds.west.toString(),
      severityLevels: filters.severityLevels.join(','),
      startDate: filters.dateRange.start.toISOString(),
      endDate: filters.dateRange.end.toISOString(),
      confidenceThreshold: filters.confidenceThreshold.toString()
    });

    const response = await resilientFetch(
      `${API_BASE_URL}/events?${params}`,
      {
        signal,
        headers: {
          'Content-Type': 'application/json',
        },
      },
      {
        component: 'DataManager',
        operation: 'api_request'
      }
    );

    return response.json();
  }

  /**
   * Setup data virtualization integration
   */
  private setupVirtualization(): void {
    // Register data loading callback with virtualization system
    dataVirtualization.onLoadData(async (bounds: LatLngBounds, priority: LoadPriority) => {
      try {
        return await this.fetchEvents(bounds, this.getDefaultFilters(), priority);
      } catch (error) {
        console.error('Virtualization data loading failed:', error);
        return [];
      }
    });

    // Register update callback to notify subscribers
    dataVirtualization.onDataUpdate((events: RoadAnomalyEvent[]) => {
      this.notifyUpdateCallbacks(events);
    });
  }

  private async makeApiRequest(
    bounds: LatLngBounds,
    filters: FilterCriteria,
    signal: AbortSignal
  ): Promise<ApiResponse> {
    // This method is kept for backward compatibility but now uses the retry version
    return this.makeApiRequestWithRetry(bounds, filters, signal);
  }

  private processApiResponse(response: ApiResponse): RoadAnomalyEvent[] {
    return response.events.map(event => ({
      ...event,
      createdAt: new Date(event.createdAt)
    }));
  }

  private generateCacheKey(bounds: LatLngBounds, filters: FilterCriteria): string {
    const boundsKey = `${bounds.north},${bounds.south},${bounds.east},${bounds.west}`;
    const filtersKey = `${filters.severityLevels.join(',')}-${filters.dateRange.start.getTime()}-${filters.dateRange.end.getTime()}-${filters.confidenceThreshold}`;
    return `${boundsKey}|${filtersKey}`;
  }

  private isCacheExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > CACHE_DURATION;
  }

  private filtersMatch(cached: FilterCriteria, requested: FilterCriteria): boolean {
    return (
      JSON.stringify(cached.severityLevels.sort()) === JSON.stringify(requested.severityLevels.sort()) &&
      cached.dateRange.start.getTime() === requested.dateRange.start.getTime() &&
      cached.dateRange.end.getTime() === requested.dateRange.end.getTime() &&
      cached.confidenceThreshold === requested.confidenceThreshold
    );
  }

  private estimateDataSize(events: RoadAnomalyEvent[]): number {
    // Rough estimation: ~200 bytes per event
    return events.length * 200;
  }

  private evictIfNecessary(newDataSize: number): void {
    while (this.currentCacheSize + newDataSize > MAX_CACHE_SIZE && this.cache.size > 0) {
      // Find oldest entry
      let oldestKey = '';
      let oldestTime = Date.now();
      
      for (const [key, entry] of this.cache) {
        if (entry.timestamp < oldestTime) {
          oldestTime = entry.timestamp;
          oldestKey = key;
        }
      }
      
      if (oldestKey) {
        const entry = this.cache.get(oldestKey);
        if (entry) {
          this.currentCacheSize -= entry.size;
          this.cache.delete(oldestKey);
        }
      }
    }
  }

  private notifyUpdateCallbacks(events: RoadAnomalyEvent[]): void {
    this.updateCallbacks.forEach(callback => {
      try {
        callback(events);
      } catch (error) {
        console.error('Error in update callback:', error);
      }
    });
  }

  private handleApiError(error: unknown): Error {
    if (error instanceof ApiError || error instanceof NetworkError) {
      return error;
    }
    
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return new NetworkError('Network connection failed');
    }
    
    return new ApiError('Unknown API error occurred');
  }

  private getDefaultFilters(): FilterCriteria {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return {
      severityLevels: [1, 2, 3, 4, 5],
      dateRange: {
        start: oneWeekAgo,
        end: now
      },
      confidenceThreshold: 0.0
    };
  }

  private loadCacheFromStorage(): void {
    try {
      const cached = localStorage.getItem('roadpulse-cache');
      if (cached) {
        const data = JSON.parse(cached);
        this.cache = new Map(data.entries.map(([key, entry]: [string, any]) => [
          key,
          {
            ...entry,
            timestamp: entry.timestamp,
            data: entry.data.map((event: any) => ({
              ...event,
              createdAt: new Date(event.createdAt)
            }))
          }
        ]));
        this.currentCacheSize = data.totalSize || 0;
        
        // Clean expired entries
        this.cleanExpiredEntries();
      }
    } catch (error) {
      console.warn('Failed to load cache from storage:', error);
      this.clearCache();
    }
  }

  private saveCacheToStorage(): void {
    try {
      const data = {
        entries: Array.from(this.cache.entries()),
        totalSize: this.currentCacheSize,
        timestamp: Date.now()
      };
      localStorage.setItem('roadpulse-cache', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save cache to storage:', error);
      // If storage is full, clear some cache
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.evictIfNecessary(0);
      }
    }
  }

  private cleanExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (now - entry.timestamp > CACHE_DURATION) {
        this.currentCacheSize -= entry.size;
        this.cache.delete(key);
      }
    }
  }
}

// Export singleton instance
export const dataManager = new DataManager();