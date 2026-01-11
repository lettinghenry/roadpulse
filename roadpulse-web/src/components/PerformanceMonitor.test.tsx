import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import PerformanceMonitor from './PerformanceMonitor';
import { performanceMonitor } from '../utils/performanceMonitor';

// Mock the performance monitor
vi.mock('../utils/performanceMonitor', () => ({
  performanceMonitor: {
    onPerformanceChange: vi.fn(),
    onOptimization: vi.fn(),
    getMetrics: vi.fn(),
    getMemoryLeaks: vi.fn(),
    getAppliedOptimizations: vi.fn(),
    resetOptimizations: vi.fn(),
    clearMemoryLeaks: vi.fn()
  }
}));

const mockPerformanceMonitor = performanceMonitor as any;

describe('PerformanceMonitor', () => {
  const mockMetrics = {
    fps: 60,
    frameTime: 16.67,
    loadTime: 2000,
    memoryUsage: 10 * 1024 * 1024, // 10MB
    operationTimes: new Map()
  };

  beforeEach(() => {
    mockPerformanceMonitor.getMetrics.mockReturnValue(mockMetrics);
    mockPerformanceMonitor.getMemoryLeaks.mockReturnValue([]);
    mockPerformanceMonitor.getAppliedOptimizations.mockReturnValue([]);
    mockPerformanceMonitor.onPerformanceChange.mockImplementation((callback: any) => {
      // Immediately call callback with mock metrics
      callback(mockMetrics);
      return () => {}; // Return unsubscribe function
    });
    mockPerformanceMonitor.onOptimization.mockImplementation((callback: any) => {
      return () => {}; // Return unsubscribe function
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when showDetails is false and performance is good', () => {
    const { container } = render(<PerformanceMonitor showDetails={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render when showDetails is true', () => {
    render(<PerformanceMonitor showDetails={true} />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Performance')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument(); // FPS value
  });

  it('should show performance warning when FPS is low', () => {
    const lowFpsMetrics = { ...mockMetrics, fps: 20 };
    mockPerformanceMonitor.getMetrics.mockReturnValue(lowFpsMetrics);
    mockPerformanceMonitor.onPerformanceChange.mockImplementation((callback: any) => {
      callback(lowFpsMetrics);
      return () => {};
    });

    render(<PerformanceMonitor showDetails={false} />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText(/Performance below 30 FPS target/)).toBeInTheDocument();
    expect(screen.getByLabelText('Performance warning')).toBeInTheDocument();
  });

  it('should display detailed metrics when showDetails is true', () => {
    render(<PerformanceMonitor showDetails={true} />);
    
    expect(screen.getByText('FPS:')).toBeInTheDocument();
    expect(screen.getByText('Frame Time:')).toBeInTheDocument();
    expect(screen.getByText('Memory:')).toBeInTheDocument();
    expect(screen.getByText('Load Time:')).toBeInTheDocument();
    
    expect(screen.getByText('60')).toBeInTheDocument(); // FPS
    expect(screen.getByText('16.7ms')).toBeInTheDocument(); // Frame time
    expect(screen.getByText('10.0MB')).toBeInTheDocument(); // Memory
    expect(screen.getByText('2.0s')).toBeInTheDocument(); // Load time
  });

  it('should show warning for slow load time', () => {
    const slowLoadMetrics = { ...mockMetrics, loadTime: 4000 };
    mockPerformanceMonitor.getMetrics.mockReturnValue(slowLoadMetrics);
    mockPerformanceMonitor.onPerformanceChange.mockImplementation((callback: any) => {
      callback(slowLoadMetrics);
      return () => {};
    });

    render(<PerformanceMonitor showDetails={true} />);
    
    const loadTimeMetric = screen.getByText('4.0s').closest('.metric');
    expect(loadTimeMetric).toHaveClass('metric-warning');
    expect(screen.getByLabelText('Slow load warning')).toBeInTheDocument();
  });

  it('should handle close button click', async () => {
    const lowFpsMetrics = { ...mockMetrics, fps: 20 };
    mockPerformanceMonitor.onPerformanceChange.mockImplementation((callback: any) => {
      callback(lowFpsMetrics);
      return () => {};
    });

    render(<PerformanceMonitor showDetails={false} />);
    
    const closeButton = screen.getByLabelText('Close performance monitor');
    expect(closeButton).toBeInTheDocument();
    
    fireEvent.click(closeButton);
    
    // Component should be hidden after clicking close
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });

  it('should auto-hide after good performance is restored', async () => {
    // Start with low FPS
    const lowFpsMetrics = { ...mockMetrics, fps: 20 };
    let currentCallback: any;
    
    mockPerformanceMonitor.onPerformanceChange.mockImplementation((callback: any) => {
      currentCallback = callback;
      callback(lowFpsMetrics);
      return () => {};
    });

    render(<PerformanceMonitor showDetails={false} />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    
    // Simulate performance improvement
    const goodFpsMetrics = { ...mockMetrics, fps: 60 };
    mockPerformanceMonitor.getMetrics.mockReturnValue(goodFpsMetrics);
    currentCallback(goodFpsMetrics);

    // Should auto-hide after 3 seconds (mocked with shorter timeout for testing)
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    }, { timeout: 4000 });
  });

  it('should apply custom className', () => {
    render(<PerformanceMonitor showDetails={true} className="custom-class" />);
    
    const monitor = screen.getByRole('status');
    expect(monitor).toHaveClass('performance-monitor', 'custom-class');
  });

  it('should handle missing memory usage', () => {
    const metricsWithoutMemory = { ...mockMetrics, memoryUsage: undefined };
    mockPerformanceMonitor.getMetrics.mockReturnValue(metricsWithoutMemory);
    mockPerformanceMonitor.onPerformanceChange.mockImplementation((callback: any) => {
      callback(metricsWithoutMemory);
      return () => {};
    });

    render(<PerformanceMonitor showDetails={true} />);
    
    expect(screen.getByText(/N\/A/)).toBeInTheDocument(); // Memory should show N/A
  });

  it('should have proper accessibility attributes', () => {
    render(<PerformanceMonitor showDetails={true} />);
    
    const monitor = screen.getByRole('status');
    expect(monitor).toHaveAttribute('aria-live', 'polite');
  });
});