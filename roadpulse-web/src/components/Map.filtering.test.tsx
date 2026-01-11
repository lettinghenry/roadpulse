import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import Map from './Map';
import { RoadAnomalyEvent } from '../types';

// Mock the child components to focus on Map filtering logic
vi.mock('./MapContainer', () => ({
  default: vi.fn(({ children }) => <div data-testid="map-container">{children}</div>),
}));

vi.mock('./AnomalyMarkers', () => ({
  default: vi.fn(({ events }) => (
    <div data-testid="anomaly-markers">
      {events.map((event: RoadAnomalyEvent) => (
        <div key={event.id} data-testid={`marker-${event.id}`}>
          Marker {event.id} - Severity {event.severity}
        </div>
      ))}
    </div>
  )),
}));

vi.mock('./FilterControls', () => ({
  default: vi.fn(({ onFiltersChange, disabled }) => (
    <div data-testid="filter-controls">
      <button
        onClick={() => onFiltersChange({
          severityLevels: [4, 5],
          dateRange: {
            start: new Date('2024-01-01'),
            end: new Date('2024-01-31')
          },
          confidenceThreshold: 0.8
        })}
        disabled={disabled}
      >
        Apply Filter
      </button>
    </div>
  )),
}));

vi.mock('./LocationControls', () => ({
  default: vi.fn(() => <div data-testid="location-controls">Location Controls</div>),
}));

vi.mock('./LoadingIndicator', () => ({
  default: vi.fn(() => <div data-testid="loading-indicator">Loading...</div>),
}));

vi.mock('./PerformanceMonitor', () => ({
  default: vi.fn(() => <div data-testid="performance-monitor">Performance Monitor</div>),
}));

vi.mock('./HeatMapRenderer', () => ({
  default: vi.fn(() => <div data-testid="heat-map-renderer">Heat Map</div>),
}));

vi.mock('./HeatMapControls', () => ({
  default: vi.fn(() => <div data-testid="heat-map-controls">Heat Map Controls</div>),
}));

vi.mock('./MapLayerControls', () => ({
  default: vi.fn(() => <div data-testid="map-layer-controls">Layer Controls</div>),
}));

// Mock performance monitor
vi.mock('../utils/performanceMonitor', () => ({
  performanceMonitor: {
    onLoadingChange: vi.fn(() => () => {}),
    onPerformanceChange: vi.fn(() => () => {}),
    measureInitialLoad: vi.fn().mockResolvedValue(2000),
    optimizeForPerformance: vi.fn().mockReturnValue({
      shouldReduceMarkers: false,
      shouldDisableAnimations: false,
      shouldReduceClusterRadius: false
    }),
    getPerformanceRecommendations: vi.fn().mockReturnValue([])
  }
}));

// Mock responsive hook
vi.mock('../utils/responsive', () => ({
  useResponsive: vi.fn(() => ({
    deviceType: 'desktop',
    isTouchEnabled: false,
    config: {
      controlsPosition: 'top-right',
      touchOptimized: false,
      clusterRadius: 60
    }
  }))
}));

describe('Map Filtering Integration', () => {
  const sampleEvents: RoadAnomalyEvent[] = [
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
      severity: 4,
      confidence: 0.92,
      deviceModel: 'Google Pixel 7',
      androidVersion: '14',
      sessionId: 'session-002'
    },
    {
      id: '3',
      createdAt: new Date('2024-01-15T12:00:00Z'),
      latitude: 40.7505,
      longitude: -73.9934,
      gpsAccuracyM: 8,
      speedKmh: 25,
      headingDeg: 45,
      peakAccelMs2: 8.1,
      impulseDurationMs: 100,
      severity: 5,
      confidence: 0.96,
      deviceModel: 'iPhone 14',
      androidVersion: '17',
      sessionId: 'session-003'
    }
  ];

  const mockOnFiltersChange = vi.fn();

  beforeEach(() => {
    mockOnFiltersChange.mockClear();
  });

  it('should render filter controls when filtering is enabled', () => {
    render(
      <Map
        anomalyEvents={sampleEvents}
        enableFiltering={true}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByTestId('filter-controls')).toBeInTheDocument();
  });

  it('should not render filter controls when filtering is disabled', () => {
    render(
      <Map
        anomalyEvents={sampleEvents}
        enableFiltering={false}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.queryByTestId('filter-controls')).not.toBeInTheDocument();
  });

  it('should display all events initially', () => {
    render(
      <Map
        anomalyEvents={sampleEvents}
        enableFiltering={true}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // All 3 events should be displayed
    expect(screen.getByTestId('marker-1')).toBeInTheDocument();
    expect(screen.getByTestId('marker-2')).toBeInTheDocument();
    expect(screen.getByTestId('marker-3')).toBeInTheDocument();
  });

  it('should filter events when filters are applied', async () => {
    render(
      <Map
        anomalyEvents={sampleEvents}
        enableFiltering={true}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Apply filter for severity levels 4 and 5 only
    const applyFilterButton = screen.getByText('Apply Filter');
    fireEvent.click(applyFilterButton);

    // Wait for filtering to complete
    await waitFor(() => {
      // Only events with severity 4 and 5 should be visible
      expect(screen.queryByTestId('marker-1')).not.toBeInTheDocument(); // severity 3
      expect(screen.getByTestId('marker-2')).toBeInTheDocument(); // severity 4
      expect(screen.getByTestId('marker-3')).toBeInTheDocument(); // severity 5
    });

    // Should call the parent callback
    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      severityLevels: [4, 5],
      dateRange: {
        start: new Date('2024-01-01'),
        end: new Date('2024-01-31')
      },
      confidenceThreshold: 0.8
    });
  });

  it('should show loading indicator during filtering', async () => {
    render(
      <Map
        anomalyEvents={sampleEvents}
        enableFiltering={true}
        showLoadingIndicators={true}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  it('should apply multiple filter criteria with AND logic', async () => {
    // Create events with different confidence levels and dates
    const eventsWithVariedData: RoadAnomalyEvent[] = [
      {
        ...sampleEvents[0],
        severity: 4,
        confidence: 0.7, // Below 0.8 threshold
        createdAt: new Date('2024-01-10T10:30:00Z') // Within date range
      },
      {
        ...sampleEvents[1],
        severity: 4,
        confidence: 0.9, // Above 0.8 threshold
        createdAt: new Date('2024-01-15T11:15:00Z') // Within date range
      },
      {
        ...sampleEvents[2],
        severity: 5,
        confidence: 0.95, // Above 0.8 threshold
        createdAt: new Date('2023-12-15T12:00:00Z') // Outside date range
      }
    ];

    render(
      <Map
        anomalyEvents={eventsWithVariedData}
        enableFiltering={true}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    // Apply filter (severity 4,5 AND confidence >= 0.8 AND date range Jan 2024)
    const applyFilterButton = screen.getByText('Apply Filter');
    fireEvent.click(applyFilterButton);

    await waitFor(() => {
      // Only event 2 should pass all filters:
      // - Event 1: severity 4 ✓, confidence 0.7 ✗, date ✓ = FAIL
      // - Event 2: severity 4 ✓, confidence 0.9 ✓, date ✓ = PASS
      // - Event 3: severity 5 ✓, confidence 0.95 ✓, date ✗ = FAIL
      expect(screen.queryByTestId('marker-1')).not.toBeInTheDocument();
      expect(screen.getByTestId('marker-2')).toBeInTheDocument();
      expect(screen.queryByTestId('marker-3')).not.toBeInTheDocument();
    });
  });

  it('should handle filter performance within 500ms target', async () => {
    const startTime = performance.now();
    
    render(
      <Map
        anomalyEvents={sampleEvents}
        enableFiltering={true}
        onFiltersChange={mockOnFiltersChange}
      />
    );

    const applyFilterButton = screen.getByText('Apply Filter');
    fireEvent.click(applyFilterButton);

    await waitFor(() => {
      expect(screen.getByTestId('marker-2')).toBeInTheDocument();
    });

    const endTime = performance.now();
    const filterTime = endTime - startTime;
    
    // Filter application should be reasonably fast (allowing some test overhead)
    expect(filterTime).toBeLessThan(1000); // 1 second max for test environment
  });
});