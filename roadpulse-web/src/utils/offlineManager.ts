/**
 * Offline mode manager for handling network connectivity issues
 * Provides cached data display and offline functionality
 */

import { RoadAnomalyEvent, FilterCriteria, LatLngBounds } from '../types';
import { errorHandler, NetworkError } from './errorHandler';

// Offline storage configuration
const OFFLINE_STORAGE_KEY = 'roadpulse-offline-data';
const OFFLINE_METADATA_KEY = 'roadpulse-offline-metadata';
const MAX_OFFLINE_STORAGE = 100 * 1024 * 1024; // 100MB
const OFFLINE_DATA_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

// Offline data structure
interface OfflineDataEntry {
  id: string;
  bounds: LatLngBounds;
  events: RoadAnomalyEvent[];
  filters: FilterCriteria;
  timestamp: number;
  size: number;
}

interface OfflineMetadata {
  totalSize: number;
  entryCount: number;
  lastUpdated: number;
  version: string;
}

// Offline status
export interface OfflineStatus {
  isOnline: boolean;
  hasOfflineData: boolean;
  offlineDataAge: number;
  storageUsed: number;
  maxStorage: number;
  canUseOfflineData: boolean;
}

// Offline manager class
export class OfflineManager {
  private isOnline = navigator.onLine;
  private offlineCallbacks = new Set<(status: OfflineStatus) => void>();
  private metadata: OfflineMetadata;

  constructor() {
    this.metadata = this.loadMetadata();
    this.setupNetworkMonitoring();
    this.cleanExpiredData();
  }

  /**
   * Check if the application is currently online
   */
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Get comprehensive offline status
   */
  getOfflineStatus(): OfflineStatus {
    const hasOfflineData = this.metadata.entryCount > 0;
    const offlineDataAge = hasOfflineData ? Date.now() - this.metadata.lastUpdated : 0;
    
    return {
      isOnline: this.isOnline,
      hasOfflineData,
      offlineDataAge,
      storageUsed: this.metadata.totalSize,
      maxStorage: MAX_OFFLINE_STORAGE,
      canUseOfflineData: hasOfflineData && offlineDataAge < OFFLINE_DATA_TTL
    };
  }

  /**
   * Store data for offline use
   */
  async storeOfflineData(
    bounds: LatLngBounds,
    events: RoadAnomalyEvent[],
    filters: FilterCriteria
  ): Promise<boolean> {
    try {
      const entryId = this.generateEntryId(bounds, filters);
      const dataSize = this.estimateDataSize(events);
      
      // Check if we have enough space
      if (this.metadata.totalSize + dataSize > MAX_OFFLINE_STORAGE) {
        await this.makeSpace(dataSize);
      }
      
      const entry: OfflineDataEntry = {
        id: entryId,
        bounds,
        events,
        filters,
        timestamp: Date.now(),
        size: dataSize
      };
      
      // Store the entry
      const existingData = this.loadOfflineData();
      existingData.set(entryId, entry);
      
      await this.saveOfflineData(existingData);
      
      // Update metadata
      this.metadata.totalSize += dataSize;
      this.metadata.entryCount = existingData.size;
      this.metadata.lastUpdated = Date.now();
      this.saveMetadata();
      
      console.log(`Stored offline data for bounds: ${JSON.stringify(bounds)}, events: ${events.length}`);
      this.notifyStatusChange();
      
      return true;
    } catch (error) {
      console.error('Failed to store offline data:', error);
      await errorHandler.handleError(
        error as Error,
        { operation: 'offline_storage', component: 'OfflineManager' }
      );
      return false;
    }
  }

  /**
   * Retrieve offline data for given bounds and filters
   */
  async getOfflineData(
    bounds: LatLngBounds,
    filters: FilterCriteria
  ): Promise<RoadAnomalyEvent[]> {
    try {
      if (!this.getOfflineStatus().canUseOfflineData) {
        throw new Error('No valid offline data available');
      }
      
      const offlineData = this.loadOfflineData();
      
      // Try exact match first
      const exactEntryId = this.generateEntryId(bounds, filters);
      const exactEntry = offlineData.get(exactEntryId);
      
      if (exactEntry && !this.isExpired(exactEntry)) {
        console.log('Found exact offline data match');
        return exactEntry.events;
      }
      
      // Try to find overlapping data
      const overlappingEvents = this.findOverlappingData(bounds, filters, offlineData);
      
      if (overlappingEvents.length > 0) {
        console.log(`Found ${overlappingEvents.length} events from overlapping offline data`);
        return overlappingEvents;
      }
      
      throw new NetworkError('No suitable offline data found');
    } catch (error) {
      await errorHandler.handleError(
        error as Error,
        { operation: 'offline_retrieval', component: 'OfflineManager' }
      );
      return [];
    }
  }

  /**
   * Check if offline data exists for given bounds
   */
  hasOfflineDataForBounds(bounds: LatLngBounds): boolean {
    const offlineData = this.loadOfflineData();
    
    for (const entry of offlineData.values()) {
      if (this.isExpired(entry)) continue;
      
      if (this.boundsOverlap(bounds, entry.bounds)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Clear all offline data
   */
  async clearOfflineData(): Promise<void> {
    try {
      localStorage.removeItem(OFFLINE_STORAGE_KEY);
      this.metadata = {
        totalSize: 0,
        entryCount: 0,
        lastUpdated: 0,
        version: '1.0'
      };
      this.saveMetadata();
      
      console.log('Cleared all offline data');
      this.notifyStatusChange();
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  }

  /**
   * Get offline data statistics
   */
  getOfflineStats() {
    const offlineData = this.loadOfflineData();
    const validEntries = Array.from(offlineData.values()).filter(entry => !this.isExpired(entry));
    
    return {
      totalEntries: offlineData.size,
      validEntries: validEntries.length,
      expiredEntries: offlineData.size - validEntries.length,
      totalSize: this.metadata.totalSize,
      averageEntrySize: validEntries.length > 0 ? this.metadata.totalSize / validEntries.length : 0,
      oldestEntry: validEntries.length > 0 ? Math.min(...validEntries.map(e => e.timestamp)) : 0,
      newestEntry: validEntries.length > 0 ? Math.max(...validEntries.map(e => e.timestamp)) : 0
    };
  }

  /**
   * Subscribe to offline status changes
   */
  onStatusChange(callback: (status: OfflineStatus) => void): () => void {
    this.offlineCallbacks.add(callback);
    return () => this.offlineCallbacks.delete(callback);
  }

  /**
   * Preload data for offline use (for anticipated areas)
   */
  async preloadForOffline(
    areas: Array<{ bounds: LatLngBounds; filters: FilterCriteria }>,
    onProgress?: (completed: number, total: number) => void
  ): Promise<void> {
    console.log(`Preloading ${areas.length} areas for offline use`);
    
    for (let i = 0; i < areas.length; i++) {
      const { bounds, filters } = areas[i];
      
      try {
        // This would typically fetch from the API
        // For now, we'll simulate with empty data
        await this.storeOfflineData(bounds, [], filters);
        
        onProgress?.(i + 1, areas.length);
      } catch (error) {
        console.warn(`Failed to preload area ${i + 1}:`, error);
      }
    }
    
    console.log('Offline preloading completed');
  }

  // Private methods

  private setupNetworkMonitoring(): void {
    const updateOnlineStatus = () => {
      const wasOnline = this.isOnline;
      this.isOnline = navigator.onLine;
      
      if (wasOnline !== this.isOnline) {
        console.log(`Network status changed: ${this.isOnline ? 'online' : 'offline'}`);
        this.notifyStatusChange();
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
  }

  private loadMetadata(): OfflineMetadata {
    try {
      const stored = localStorage.getItem(OFFLINE_METADATA_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load offline metadata:', error);
    }
    
    return {
      totalSize: 0,
      entryCount: 0,
      lastUpdated: 0,
      version: '1.0'
    };
  }

  private saveMetadata(): void {
    try {
      localStorage.setItem(OFFLINE_METADATA_KEY, JSON.stringify(this.metadata));
    } catch (error) {
      console.error('Failed to save offline metadata:', error);
    }
  }

  private loadOfflineData(): Map<string, OfflineDataEntry> {
    try {
      const stored = localStorage.getItem(OFFLINE_STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        return new Map(data.entries.map(([key, entry]: [string, any]) => [
          key,
          {
            ...entry,
            events: entry.events.map((event: any) => ({
              ...event,
              createdAt: new Date(event.createdAt)
            }))
          }
        ]));
      }
    } catch (error) {
      console.warn('Failed to load offline data:', error);
    }
    
    return new Map();
  }

  private async saveOfflineData(data: Map<string, OfflineDataEntry>): Promise<void> {
    try {
      const serializable = {
        entries: Array.from(data.entries()),
        timestamp: Date.now()
      };
      
      localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(serializable));
    } catch (error) {
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        // Storage quota exceeded, try to make space
        await this.makeSpace(0);
        throw new Error('Storage quota exceeded, please clear some offline data');
      }
      throw error;
    }
  }

  private async makeSpace(requiredSpace: number): Promise<void> {
    const offlineData = this.loadOfflineData();
    const entries = Array.from(offlineData.entries());
    
    // Sort by timestamp (oldest first)
    entries.sort(([, a], [, b]) => a.timestamp - b.timestamp);
    
    let freedSpace = 0;
    const toRemove: string[] = [];
    
    for (const [id, entry] of entries) {
      if (this.metadata.totalSize - freedSpace + requiredSpace <= MAX_OFFLINE_STORAGE) {
        break;
      }
      
      toRemove.push(id);
      freedSpace += entry.size;
    }
    
    // Remove oldest entries
    for (const id of toRemove) {
      offlineData.delete(id);
    }
    
    if (toRemove.length > 0) {
      await this.saveOfflineData(offlineData);
      this.metadata.totalSize -= freedSpace;
      this.metadata.entryCount = offlineData.size;
      this.saveMetadata();
      
      console.log(`Freed ${freedSpace} bytes by removing ${toRemove.length} old offline entries`);
    }
  }

  private cleanExpiredData(): void {
    const offlineData = this.loadOfflineData();
    const entries = Array.from(offlineData.entries());
    let removedSize = 0;
    let removedCount = 0;
    
    for (const [id, entry] of entries) {
      if (this.isExpired(entry)) {
        offlineData.delete(id);
        removedSize += entry.size;
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      this.saveOfflineData(offlineData);
      this.metadata.totalSize -= removedSize;
      this.metadata.entryCount = offlineData.size;
      this.saveMetadata();
      
      console.log(`Cleaned ${removedCount} expired offline entries, freed ${removedSize} bytes`);
    }
  }

  private findOverlappingData(
    bounds: LatLngBounds,
    filters: FilterCriteria,
    offlineData: Map<string, OfflineDataEntry>
  ): RoadAnomalyEvent[] {
    const overlappingEvents: RoadAnomalyEvent[] = [];
    
    for (const entry of offlineData.values()) {
      if (this.isExpired(entry)) continue;
      if (!this.filtersCompatible(filters, entry.filters)) continue;
      
      if (this.boundsOverlap(bounds, entry.bounds)) {
        // Filter events to the requested bounds
        const filteredEvents = entry.events.filter(event =>
          event.latitude >= bounds.south &&
          event.latitude <= bounds.north &&
          event.longitude >= bounds.west &&
          event.longitude <= bounds.east
        );
        
        overlappingEvents.push(...filteredEvents);
      }
    }
    
    // Remove duplicates based on event ID
    const uniqueEvents = overlappingEvents.filter((event, index, array) =>
      array.findIndex(e => e.id === event.id) === index
    );
    
    return uniqueEvents;
  }

  private generateEntryId(bounds: LatLngBounds, filters: FilterCriteria): string {
    const boundsKey = `${bounds.north.toFixed(4)},${bounds.south.toFixed(4)},${bounds.east.toFixed(4)},${bounds.west.toFixed(4)}`;
    const filtersKey = `${filters.severityLevels.join(',')}-${filters.confidenceThreshold}`;
    return `${boundsKey}|${filtersKey}`;
  }

  private estimateDataSize(events: RoadAnomalyEvent[]): number {
    // Rough estimation: ~300 bytes per event (including JSON overhead)
    return events.length * 300;
  }

  private isExpired(entry: OfflineDataEntry): boolean {
    return Date.now() - entry.timestamp > OFFLINE_DATA_TTL;
  }

  private boundsOverlap(bounds1: LatLngBounds, bounds2: LatLngBounds): boolean {
    return !(
      bounds1.east < bounds2.west ||
      bounds1.west > bounds2.east ||
      bounds1.north < bounds2.south ||
      bounds1.south > bounds2.north
    );
  }

  private filtersCompatible(requested: FilterCriteria, stored: FilterCriteria): boolean {
    // Check if stored filters are compatible with requested filters
    // Stored data is compatible if it includes all requested severity levels
    const requestedSeverities = new Set(requested.severityLevels);
    const storedSeverities = new Set(stored.severityLevels);
    
    for (const severity of requestedSeverities) {
      if (!storedSeverities.has(severity)) {
        return false;
      }
    }
    
    // Check confidence threshold (stored should have lower or equal threshold)
    if (stored.confidenceThreshold > requested.confidenceThreshold) {
      return false;
    }
    
    return true;
  }

  private notifyStatusChange(): void {
    const status = this.getOfflineStatus();
    this.offlineCallbacks.forEach(callback => {
      try {
        callback(status);
      } catch (error) {
        console.error('Error in offline status callback:', error);
      }
    });
  }
}

// Export singleton instance
export const offlineManager = new OfflineManager();