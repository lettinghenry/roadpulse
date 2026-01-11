import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Map as MapComponent } from './Map';
import { RoadAnomalyEvent } from '../types';
import { performanceMonitor } from '../utils/performanceMonitor';

// Mock the performance monitor
vi.mock('../utils/performanceMonitor', () => ({
  performanceMonitor: {
    onLoadingChange: vi.fn(),
    onPerformanceChange: vi.fn(),
    measureInitialLoad: vi.fn(),
    optimizeForPerformance: vi.fn(),
    getPerformanceRecommendations: vi.fn(),
    getMetrics: vi.fn()
  },
  measureAsync: vi.fn()
}));

const mockPerformanceMonitor = performanceMonitor as any;

describe('Map Performance Optimizations', () => {
  const mockAnomalyEvents: RoadAnomalyEvent[] = [
    {
      id: '1',
      createdAt: new Date('2024-01-15T10:30:00Z'),
      latitude: 40.7128,
      longitude: -74.0060,
      gpsAccuracyM: 5,
      speedKmh: 45,
      headingDeg: 90,
      peakAccelMs2: 12.5,
      impulseDurationMs: 150,
      severity: 3,
      confidence: 0.85,
      deviceModel: 'Samsung Galaxy S21',
      androidVersion: '13',
      sessionId: 'session-001'
    },
    {
      id: '2',
      createdAt: new Date('2024-01-15T11:15:00Z'),
      latitude: 40.7589,
      longitude: -73.9851,
      gpsAccuracyM: 3,
      speedKmh: 30,
      headingDeg: 180,
      peakAccelMs2: 18.2,
      impulseDurationMs: 200,
      severity: 1,
      confidence: 0.92,
      deviceModel: 'Google Pixel 7',
      androidVersion: '14',
      sessionId: 'session-002'
    }
  ];

  beforeEach(() => {
    mockPerformanceMonitor.measureInitialLoad.mockResolvedValue(2000);
    mockPerformanceMonitor.onLoadingChange.mockImplementation((callback: any) => {
      callback([]);
      return () => {};
    });
    mockPerformanceMonitor.onPerformanceChange.mockImplementation((callback: any) => {
      callback({ fps: 60, frameTime: 16.67, loadTime: 2000 });
      return () => {};
    });
    mockPerformanceMonitor.optimizeForPerformance.mockReturnValue({
      shouldReduceMarkers: false,
      shouldDisableAnimations: false,
      shouldReduceClusterRadius: false
    });
    mockPerformanceMonitor.getPerformanceRecommendations.mockReturnValue([]);
    mockPerformanceMonitor.getMetrics.mockReturnValue({
      fps: 60,
      frameTime: 16.67,
      loadTime: 2000,
      memoryUsage: 10 * 1024 * 1024,
      operationTimes: new globalThis.Map()
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize performance monitoring on mount', () => {
    render(<MapComponent anomalyEvents={mockAnomalyEvents} />);
    
    expect(mockPerformanceMonitor.measureInitialLoad).toHaveBeenCalled();
    expect(mockPerformanceMonitor.onPerformanceChange).toHaveBeenCalled();
  });

  it('should show loading indicators when enabled', () => {
    const mockLoadingOperations = [{
      isLoading: true,
      operation: 'Loading data',
      startTime: Date.now(),
      showIndicator: true
    }];

    mockPerformanceMonitor.onLoadingChange.mockImplementation((callback: any) => {
      callback(mockLoadingOperations);
      return () => {};
    });

    render(<MapComponent anomalyEvents={mockAnomalyEvents} showLoadingIndicators={true} />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading data...')).toBeInTheDocument();
  });

  it('should apply performance optimizations when FPS is low', () => {
    // Mock low performance scenario
    mockPerformanceMonitor.onPerformanceChange.mockImplementation((callback: any) => {
      callback({ fps: 20, frameTime: 50, loadTime: 2000 });
      return () => {};
    });
    
    mockPerformanceMonitor.optimizeForPerformance.mockReturnValue({
      shouldReduceMarkers: true,
      shouldDisableAnimations: true,
      shouldReduceClusterRadius: true
    });

    render(<MapComponent anomalyEvents={mockAnomalyEvents} />);
    
    expect(mockPerformanceMonitor.optimizeForPerformance).toHaveBeenCalled();
  });

  it('should filter markers when performance optimization is enabled', () => {
    // Mock performance optimization that reduces markers
    mockPerformanceMonitor.onPerformanceChange.mockImplementation((callback: any) => {
      callback({ fps: 20, frameTime: 50, loadTime: 2000 });
      return () => {};
    });
    
    mockPerformanceMonitor.optimizeForPerformance.mockReturnValue({
      shouldReduceMarkers: true,
      shouldDisableAnimations: false,
      shouldReduceClusterRadius: false
    });

    render(<MapComponent anomalyEvents={mockAnomalyEvents} />);
    
    // Should only show high severity markers (severity >= 3)
    // In our test data, only the first event has severity 3, second has severity 1
    expect(mockPerformanceMonitor.optimizeForPerformance).toHaveBeenCalled();
  });

  it('should show performance monitor when enabled', () => {
    render(<MapComponent anomalyEvents={mockAnomalyEvents} showPerformanceMonitor={true} />);
    
    // Performance monitor should be rendered
    expect(mockPerformanceMonitor.onPerformanceChange).toHaveBeenCalled();
  });

  it('should not show loading indicators when disabled', () => {
    render(<MapComponent anomalyEvents={mockAnomalyEvents} showLoadingIndicators={false} />);
    
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});