import { describe, it, expect } from 'vitest';
import {
  isValidRoadAnomalyEvent,
  isValidLatLngBounds,
  isValidFilterCriteria,
  validateAndCleanEvents,
  expandBounds,
  boundsContainPoint,
  boundsIntersect,
  calculateDistance,
  debounce,
  throttle
} from './index';
import { RoadAnomalyEvent, LatLngBounds, FilterCriteria } from '../types';

describe('Utility Functions', () => {
  describe('Type Guards', () => {
    describe('isValidRoadAnomalyEvent', () => {
      const validEvent: RoadAnomalyEvent = {
        id: 'test-1',
        createdAt: new Date(),
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

      it('should return true for valid event', () => {
        expect(isValidRoadAnomalyEvent(validEvent)).toBe(true);
      });

      it('should return false for invalid event', () => {
        expect(isValidRoadAnomalyEvent(null)).toBe(false);
        expect(isValidRoadAnomalyEvent({})).toBe(false);
        expect(isValidRoadAnomalyEvent({ ...validEvent, severity: 6 })).toBe(false);
        expect(isValidRoadAnomalyEvent({ ...validEvent, confidence: 1.5 })).toBe(false);
      });

      it('should handle optional headingDeg', () => {
        const eventWithoutHeading = { ...validEvent };
        delete eventWithoutHeading.headingDeg;
        expect(isValidRoadAnomalyEvent(eventWithoutHeading)).toBe(true);
      });
    });

    describe('isValidLatLngBounds', () => {
      const validBounds: LatLngBounds = {
        north: 40.8,
        south: 40.7,
        east: -73.9,
        west: -74.1
      };

      it('should return true for valid bounds', () => {
        expect(isValidLatLngBounds(validBounds)).toBe(true);
      });

      it('should return false for invalid bounds', () => {
        expect(isValidLatLngBounds(null)).toBe(false);
        expect(isValidLatLngBounds({})).toBe(false);
        expect(isValidLatLngBounds({ ...validBounds, north: 40.6 })).toBe(false); // north < south
        expect(isValidLatLngBounds({ ...validBounds, east: -74.2 })).toBe(false); // east < west
      });
    });

    describe('isValidFilterCriteria', () => {
      const validFilters: FilterCriteria = {
        severityLevels: [1, 2, 3],
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-02')
        },
        confidenceThreshold: 0.5
      };

      it('should return true for valid filters', () => {
        expect(isValidFilterCriteria(validFilters)).toBe(true);
      });

      it('should return false for invalid filters', () => {
        expect(isValidFilterCriteria(null)).toBe(false);
        expect(isValidFilterCriteria({ ...validFilters, severityLevels: [6] })).toBe(false);
        expect(isValidFilterCriteria({ ...validFilters, confidenceThreshold: 1.5 })).toBe(false);
      });
    });
  });

  describe('Data Validation', () => {
    it('should validate and clean events array', () => {
      const validEvent: RoadAnomalyEvent = {
        id: 'test-1',
        createdAt: new Date(),
        latitude: 40.75,
        longitude: -74.0,
        gpsAccuracyM: 5.0,
        speedKmh: 30.0,
        peakAccelMs2: 2.5,
        impulseDurationMs: 100,
        severity: 3,
        confidence: 0.8,
        deviceModel: 'Test Device',
        androidVersion: '12',
        sessionId: 'session-123'
      };

      const invalidEvent = { id: 'invalid' };
      const eventWithInvalidCoords = { ...validEvent, latitude: 100 }; // Invalid latitude

      const result = validateAndCleanEvents([validEvent, invalidEvent, eventWithInvalidCoords]);

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject(validEvent);
      expect(result[1].latitude).toBe(90); // Clamped to valid range
    });
  });

  describe('Bounds Utilities', () => {
    const bounds: LatLngBounds = {
      north: 40.8,
      south: 40.7,
      east: -73.9,
      west: -74.1
    };

    it('should expand bounds by factor', () => {
      const expanded = expandBounds(bounds, 0.1);
      
      expect(expanded.north).toBeGreaterThan(bounds.north);
      expect(expanded.south).toBeLessThan(bounds.south);
      expect(expanded.east).toBeGreaterThan(bounds.east);
      expect(expanded.west).toBeLessThan(bounds.west);
    });

    it('should check if bounds contain point', () => {
      expect(boundsContainPoint(bounds, 40.75, -74.0)).toBe(true);
      expect(boundsContainPoint(bounds, 40.9, -74.0)).toBe(false);
      expect(boundsContainPoint(bounds, 40.75, -73.8)).toBe(false);
    });

    it('should check if bounds intersect', () => {
      const overlappingBounds: LatLngBounds = {
        north: 40.85,
        south: 40.75,
        east: -73.95,
        west: -74.05
      };
      
      const nonOverlappingBounds: LatLngBounds = {
        north: 41.0,
        south: 40.9,
        east: -73.0,
        west: -73.5
      };

      expect(boundsIntersect(bounds, overlappingBounds)).toBe(true);
      expect(boundsIntersect(bounds, nonOverlappingBounds)).toBe(false);
    });
  });

  describe('Distance Calculation', () => {
    it('should calculate distance between two points', () => {
      // Distance between NYC and Philadelphia (approximately 130km)
      const distance = calculateDistance(40.7128, -74.0060, 39.9526, -75.1652);
      
      expect(distance).toBeGreaterThan(120);
      expect(distance).toBeLessThan(140);
    });

    it('should return 0 for same point', () => {
      const distance = calculateDistance(40.7128, -74.0060, 40.7128, -74.0060);
      expect(distance).toBe(0);
    });
  });

  describe('Performance Utilities', () => {
    it('should debounce function calls', async () => {
      let callCount = 0;
      const debouncedFn = debounce(() => {
        callCount++;
      }, 50);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(callCount).toBe(0);

      await new Promise(resolve => setTimeout(resolve, 60));
      expect(callCount).toBe(1);
    });

    it('should throttle function calls', async () => {
      let callCount = 0;
      const throttledFn = throttle(() => {
        callCount++;
      }, 50);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(callCount).toBe(1);

      await new Promise(resolve => setTimeout(resolve, 60));
      throttledFn();
      expect(callCount).toBe(2);
    });
  });
});