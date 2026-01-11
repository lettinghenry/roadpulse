import { RoadAnomalyEvent, FilterCriteria, LatLngBounds } from '../types';

// Type guards for data validation
export function isValidRoadAnomalyEvent(obj: any): obj is RoadAnomalyEvent {
  if (!obj || typeof obj !== 'object') return false;
  
  return (
    typeof obj.id === 'string' &&
    obj.createdAt instanceof Date &&
    typeof obj.latitude === 'number' &&
    typeof obj.longitude === 'number' &&
    typeof obj.gpsAccuracyM === 'number' &&
    typeof obj.speedKmh === 'number' &&
    (obj.headingDeg === undefined || typeof obj.headingDeg === 'number') &&
    typeof obj.peakAccelMs2 === 'number' &&
    typeof obj.impulseDurationMs === 'number' &&
    [1, 2, 3, 4, 5].includes(obj.severity) &&
    typeof obj.confidence === 'number' &&
    obj.confidence >= 0 &&
    obj.confidence <= 1 &&
    typeof obj.deviceModel === 'string' &&
    typeof obj.androidVersion === 'string' &&
    typeof obj.sessionId === 'string'
  );
}

export function isValidLatLngBounds(obj: any): obj is LatLngBounds {
  if (!obj || typeof obj !== 'object') return false;
  
  return (
    typeof obj.north === 'number' &&
    typeof obj.south === 'number' &&
    typeof obj.east === 'number' &&
    typeof obj.west === 'number' &&
    obj.north > obj.south &&
    obj.east > obj.west &&
    obj.north >= -90 && obj.north <= 90 &&
    obj.south >= -90 && obj.south <= 90 &&
    obj.east >= -180 && obj.east <= 180 &&
    obj.west >= -180 && obj.west <= 180
  );
}

export function isValidFilterCriteria(obj: any): obj is FilterCriteria {
  if (!obj || typeof obj !== 'object') return false;
  
  return (
    Array.isArray(obj.severityLevels) &&
    obj.severityLevels.every((level: any) => [1, 2, 3, 4, 5].includes(level)) &&
    obj.dateRange &&
    obj.dateRange.start instanceof Date &&
    obj.dateRange.end instanceof Date &&
    obj.dateRange.start <= obj.dateRange.end &&
    typeof obj.confidenceThreshold === 'number' &&
    obj.confidenceThreshold >= 0 &&
    obj.confidenceThreshold <= 1 &&
    (obj.bounds === undefined || isValidLatLngBounds(obj.bounds))
  );
}

// Data validation functions
export function validateAndCleanEvents(events: any[]): RoadAnomalyEvent[] {
  return events
    .filter(isValidRoadAnomalyEvent)
    .map(event => ({
      ...event,
      // Ensure coordinates are within valid ranges
      latitude: Math.max(-90, Math.min(90, event.latitude)),
      longitude: Math.max(-180, Math.min(180, event.longitude)),
      // Ensure confidence is within valid range
      confidence: Math.max(0, Math.min(1, event.confidence))
    }));
}

// Utility functions for bounds calculations
export function expandBounds(bounds: LatLngBounds, factor: number = 0.1): LatLngBounds {
  const latDiff = (bounds.north - bounds.south) * factor;
  const lngDiff = (bounds.east - bounds.west) * factor;
  
  return {
    north: Math.min(90, bounds.north + latDiff),
    south: Math.max(-90, bounds.south - latDiff),
    east: Math.min(180, bounds.east + lngDiff),
    west: Math.max(-180, bounds.west - lngDiff)
  };
}

export function boundsContainPoint(bounds: LatLngBounds, lat: number, lng: number): boolean {
  return (
    lat >= bounds.south &&
    lat <= bounds.north &&
    lng >= bounds.west &&
    lng <= bounds.east
  );
}

export function boundsIntersect(bounds1: LatLngBounds, bounds2: LatLngBounds): boolean {
  return !(
    bounds1.north < bounds2.south ||
    bounds1.south > bounds2.north ||
    bounds1.east < bounds2.west ||
    bounds1.west > bounds2.east
  );
}

// Distance calculation utilities
export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

// Performance monitoring utilities
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Export the DataManager and DataVirtualization
export { DataManager, dataManager, ApiError, NetworkError } from './dataManager';
export { DataVirtualization, dataVirtualization, LoadPriority } from './dataVirtualization';
export { 
  PerformanceMonitor, 
  performanceMonitor, 
  measureAsync, 
  measureSync, 
  measurePerformance,
  type PerformanceMetrics,
  type LoadingState
} from './performanceMonitor';
export {
  PerformanceOptimizer,
  performanceOptimizer,
  usePerformanceOptimization,
  type PerformanceOptimizationConfig,
  type OptimizationState,
  type PerformanceAdjustment
} from './performanceOptimizer';
export {
  PerformanceMetricsCollector,
  performanceMetricsCollector,
  usePerformanceMetricsCollection,
  type SystemMetrics,
  type PerformanceAlert,
  type PerformanceReport,
  type PerformanceTrend,
  type MetricsCollectionConfig
} from './performanceMetricsCollector';
export {
  performanceAnalytics,
  usePerformanceAnalytics,
  type PerformanceInsight,
  type PerformanceAlert as AnalyticsAlert
} from './performanceAnalytics';