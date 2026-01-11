import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PerformanceMonitor, measureAsync, measureSync, performanceMonitor } from './performanceMonitor';

// Mock performance.now for consistent testing
const mockPerformanceNow = vi.fn();
Object.defineProperty(globalThis, 'performance', {
  value: {
    now: mockPerformanceNow,
    memory: {
      usedJSHeapSize: 1024 * 1024 * 10 // 10MB
    }
  },
  writable: true
});

// Mock requestAnimationFrame
const mockRequestAnimationFrame = vi.fn();
globalThis.requestAnimationFrame = mockRequestAnimationFrame;

// Mock cancelAnimationFrame
const mockCancelAnimationFrame = vi.fn();
globalThis.cancelAnimationFrame = mockCancelAnimationFrame;

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor;
  let currentTime = 0;

  beforeEach(() => {
    currentTime = 0;
    mockPerformanceNow.mockImplementation(() => currentTime);
    mockRequestAnimationFrame.mockImplementation((callback) => {
      setTimeout(callback, 16); // ~60fps
      return 1;
    });
    
    monitor = new PerformanceMonitor();
    // Clear singleton metrics for clean tests
    performanceMonitor.clearMetrics();
  });

  afterEach(() => {
    monitor.stopMonitoring();
    vi.clearAllMocks();
  });

  describe('Operation Tracking', () => {
    it('should track loading operations', () => {
      monitor.startOperation('test-op', 'Test Operation');
      
      const operations = monitor.getAllLoadingOperations();
      expect(operations).toHaveLength(1);
      expect(operations[0].operation).toBe('Test Operation');
      expect(operations[0].isLoading).toBe(true);
    });

    it('should end operations and record timing', () => {
      monitor.startOperation('test-op', 'Test Operation');
      
      // Advance time by 600ms
      currentTime = 600;
      monitor.endOperation('test-op');
      
      const operations = monitor.getAllLoadingOperations();
      expect(operations).toHaveLength(0);
      
      const avgTime = monitor.getAverageOperationTime('Test Operation');
      expect(avgTime).toBe(600);
    });

    it('should show loading indicator for operations > 500ms', async () => {
      monitor.startOperation('slow-op', 'Slow Operation');
      
      // Initially no indicator should be shown
      let operations = monitor.getActiveLoadingOperations();
      expect(operations).toHaveLength(0);
      
      // After 500ms, indicator should be shown
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          operations = monitor.getActiveLoadingOperations();
          expect(operations).toHaveLength(1);
          expect(operations[0].showIndicator).toBe(true);
          resolve();
        }, 600);
      });
    });

    it('should notify loading callbacks', () => {
      const callback = vi.fn();
      monitor.onLoadingChange(callback);
      
      monitor.startOperation('test-op', 'Test Operation');
      expect(callback).toHaveBeenCalled();
    });
  });

  describe('Performance Metrics', () => {
    it('should provide performance metrics', () => {
      const metrics = monitor.getMetrics();
      
      expect(metrics).toHaveProperty('fps');
      expect(metrics).toHaveProperty('frameTime');
      expect(metrics).toHaveProperty('loadTime');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('operationTimes');
    });

    it('should detect performance degradation', () => {
      // Mock low FPS
      monitor['fps'] = 20;
      
      expect(monitor.isPerformanceDegraded()).toBe(true);
    });

    it('should measure initial load time', async () => {
      // Mock document ready state
      Object.defineProperty(document, 'readyState', {
        value: 'complete',
        writable: true
      });
      
      currentTime = 0;
      const loadTimePromise = monitor.measureInitialLoad();
      
      // Advance time
      currentTime = 2500;
      
      const loadTime = await loadTimePromise;
      expect(loadTime).toBeGreaterThan(0);
    });
  });

  describe('Utility Functions', () => {
    it('should measure async operations', async () => {
      const asyncOperation = async () => {
        currentTime += 300;
        return 'result';
      };
      
      const result = await measureAsync('async-test', asyncOperation);
      
      expect(result).toBe('result');
      // The utility functions use the singleton, so we need to check the singleton
      const avgTime = performanceMonitor.getAverageOperationTime('async-test');
      expect(avgTime).toBe(300);
    });

    it('should measure sync operations', () => {
      const syncOperation = () => {
        currentTime += 150;
        return 'sync-result';
      };
      
      const result = measureSync('sync-test', syncOperation);
      
      expect(result).toBe('sync-result');
      // The utility functions use the singleton, so we need to check the singleton
      const avgTime = performanceMonitor.getAverageOperationTime('sync-test');
      expect(avgTime).toBe(150);
    });

    it('should handle operation errors', async () => {
      const failingOperation = async () => {
        throw new Error('Test error');
      };
      
      await expect(measureAsync('failing-test', failingOperation)).rejects.toThrow('Test error');
      
      // Operation should still be recorded in the singleton
      const avgTime = performanceMonitor.getAverageOperationTime('failing-test');
      expect(avgTime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Monitoring Control', () => {
    it('should start and stop monitoring', () => {
      expect(monitor['isMonitoring']).toBe(true);
      
      monitor.stopMonitoring();
      expect(monitor['isMonitoring']).toBe(false);
      
      monitor.startMonitoring();
      expect(monitor['isMonitoring']).toBe(true);
    });

    it('should clear metrics', () => {
      monitor.startOperation('test-op', 'Test Operation');
      currentTime = 100;
      monitor.endOperation('test-op');
      
      expect(monitor.getAverageOperationTime('Test Operation')).toBe(100);
      
      monitor.clearMetrics();
      expect(monitor.getAverageOperationTime('Test Operation')).toBeUndefined();
    });
  });

  describe('Callback Management', () => {
    it('should manage loading callbacks', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      const unsubscribe1 = monitor.onLoadingChange(callback1);
      const unsubscribe2 = monitor.onLoadingChange(callback2);
      
      monitor.startOperation('test-op', 'Test Operation');
      
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
      
      // Unsubscribe first callback
      unsubscribe1();
      vi.clearAllMocks();
      
      monitor.startOperation('test-op-2', 'Test Operation 2');
      
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
      
      unsubscribe2();
    });

    it('should manage performance callbacks', () => {
      const callback = vi.fn();
      const unsubscribe = monitor.onPerformanceChange(callback);
      
      // Trigger performance callback by ending an operation
      monitor.startOperation('test-op', 'Test Operation');
      currentTime = 100;
      monitor.endOperation('test-op');
      
      expect(callback).toHaveBeenCalled();
      
      unsubscribe();
    });
  });
});