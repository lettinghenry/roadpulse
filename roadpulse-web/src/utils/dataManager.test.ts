import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { DataManager, ApiError, NetworkError } from './dataManager';
import { RoadAnomalyEvent, FilterCriteria, LatLngBounds } from '../types';

// Mock fetch globally
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('DataManager', () => {
  let dataManager: DataManager;
  
  const mockBounds: LatLngBounds = {
    north: 40.8,
    south: 40.7,
    east: -73.9,
    west: -74.1
  };
  
  const mockEvent: RoadAnomalyEvent = {
    id: 'test-1',
    createdAt: new Date('2024-01-01T10:00:00Z'),
    latitude: 40.75,
    longitude: -74.0,
    gpsAccuracyM: 5.0,
    speedKmh: 30.0,
    headingDeg: 90,
    peakAccelMs2: 2.5,
    impulseDurationMs: 100,
    severity: 3,
    confidence: 0.8,
    deviceModel: 'Test Device',
    androidVersion: '12',
    sessionId: 'session-123'
  };
  
  const mockFilters: FilterCriteria = {
    severityLevels: [1, 2, 3, 4, 5],
    dateRange: {
      start: new Date('2024-01-01'),
      end: new Date('2024-01-02')
    },
    confidenceThreshold: 0.0
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    dataManager = new DataManager();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetchEvents', () => {
    it('should fetch events from API successfully', async () => {
      const mockResponse = {
        events: [mockEvent],
        total: 1,
        hasMore: false
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse)
      });

      const result = await dataManager.fetchEvents(mockBounds, mockFilters);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        ...mockEvent,
        createdAt: expect.any(Date)
      });
      expect(mockFetch).toHaveBeenCalledOnce();
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      await expect(dataManager.fetchEvents(mockBounds, mockFilters))
        .rejects.toThrow(ApiError);
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      await expect(dataManager.fetchEvents(mockBounds, mockFilters))
        .rejects.toThrow(NetworkError);
    });
  });

  describe('caching', () => {
    it('should cache events after successful fetch', async () => {
      const mockResponse = {
        events: [mockEvent],
        total: 1,
        hasMore: false
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse)
      });

      await dataManager.fetchEvents(mockBounds, mockFilters);
      
      // Second call should use cache (no additional fetch)
      const cachedResult = await dataManager.fetchEvents(mockBounds, mockFilters);
      
      expect(cachedResult).toHaveLength(1);
      expect(mockFetch).toHaveBeenCalledOnce(); // Only called once
    });

    it('should return cached events when available', () => {
      dataManager.cacheEvents([mockEvent], mockBounds, mockFilters);
      
      const result = dataManager.getCachedEvents(mockBounds, mockFilters);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject(mockEvent);
    });

    it('should clear cache when requested', () => {
      dataManager.cacheEvents([mockEvent], mockBounds, mockFilters);
      
      expect(dataManager.getCachedEvents(mockBounds, mockFilters)).toHaveLength(1);
      
      dataManager.clearCache();
      
      expect(dataManager.getCachedEvents(mockBounds, mockFilters)).toHaveLength(0);
    });
  });

  describe('subscriptions', () => {
    it('should notify subscribers when data updates', async () => {
      const callback = vi.fn();
      const unsubscribe = dataManager.subscribeToUpdates(callback);
      
      const mockResponse = {
        events: [mockEvent],
        total: 1,
        hasMore: false
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse)
      });

      await dataManager.fetchEvents(mockBounds, mockFilters);
      
      expect(callback).toHaveBeenCalledWith([expect.objectContaining(mockEvent)]);
      
      unsubscribe();
    });

    it('should allow unsubscribing from updates', async () => {
      const callback = vi.fn();
      const unsubscribe = dataManager.subscribeToUpdates(callback);
      
      unsubscribe();
      
      const mockResponse = {
        events: [mockEvent],
        total: 1,
        hasMore: false
      };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: vi.fn().mockResolvedValue(mockResponse)
      });

      await dataManager.fetchEvents(mockBounds, mockFilters);
      
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('cache statistics', () => {
    it('should provide cache statistics', () => {
      const stats = dataManager.getCacheStats();
      
      expect(stats).toHaveProperty('entryCount');
      expect(stats).toHaveProperty('totalSize');
      expect(stats).toHaveProperty('maxSize');
      expect(typeof stats.entryCount).toBe('number');
      expect(typeof stats.totalSize).toBe('number');
      expect(typeof stats.maxSize).toBe('number');
    });
  });
});