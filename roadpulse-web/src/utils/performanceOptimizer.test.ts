import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PerformanceOptimizer, PerformanceOptimizationConfig } from './performanceOptimizer';

// Mock performance.now for consistent testing
const mockPerformanceNow = vi.fn();
Object.defineProperty(globalThis, 'performance', {
  value: {
    now: mockPerformanceNow,
    memory: {
      usedJSHeapSize: 1024 * 1024 * 50 // 50MB
    }
  },
  writable: true
});

// Mock window.setInterval and clearInterval
const mockSetInterval = vi.fn();
const mockClearInterval = vi.fn();
globalThis.setInterval = mockSetInterval;
globalThis.clearInterval = mockClearInterval;

describe('PerformanceOptimizer', () => {
  let optimizer: PerformanceOptimizer;
  let currentTime = 0;

  beforeEach(() => {
    currentTime = 0;
    mockPerformanceNow.mockImplementation(() => currentTime);
    mockSetInterval.mockImplementation((callback, delay) => {
      // Return a mock interval ID
      return 123;
    });
    mockClearInterval.mockImplementation(() => {});
    
    // Create optimizer with test configuration
    const config: Partial<PerformanceOptimizationConfig> = {
      targetFPS: 30,
      criticalFPS: 20,
      memoryWarningThreshold: 100, // 100MB
      memoryCriticalThreshold: 200, // 200MB
      enableAutoOptimization: false, // Disable for manual testing
      enableMemoryCleanup: false,
      enablePerformanceLogging: false,
      optimizationCheckInterval: 1000,
      memoryCheckInterval: 5000
    };
    
    optimizer = new PerformanceOptimizer(config);
  });

  afterEach(() => {
    optimizer.stop();
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default state', () => {
      const state = optimizer.getOptimizationState();
      
      expect(state.markerReduction).toBe(1.0);
      expect(state.clusterRadius).toBe(60);
      expect(state.animationsEnabled).toBe(true);
      expect(state.heatMapEnabled).toBe(true);
      expect(state.dataVirtualizationEnabled).toBe(false);
      expect(state.cacheSize).toBe(100);
      expect(state.updateThrottling).toBe(0);
    });

    it('should accept custom configuration', () => {
      const customConfig: Partial<PerformanceOptimizationConfig> = {
        targetFPS: 60,
        criticalFPS: 30,
        memoryWarningThreshold: 200
      };
      
      const customOptimizer = new PerformanceOptimizer(customConfig);
      customOptimizer.updateConfig({ targetFPS: 45 });
      
      customOptimizer.stop();
    });
  });

  describe('Optimization State Management', () => {
    it('should get current optimization state', () => {
      const state = optimizer.getOptimizationState();
      
      expect(state).toHaveProperty('markerReduction');
      expect(state).toHaveProperty('clusterRadius');
      expect(state).toHaveProperty('animationsEnabled');
      expect(state).toHaveProperty('heatMapEnabled');
      expect(state).toHaveProperty('dataVirtualizationEnabled');
      expect(state).toHaveProperty('cacheSize');
      expect(state).toHaveProperty('updateThrottling');
    });

    it('should reset optimizations to default state', () => {
      // Manually modify state to simulate optimizations
      optimizer['currentState'].markerReduction = 0.5;
      optimizer['currentState'].animationsEnabled = false;
      optimizer['currentState'].clusterRadius = 120;
      
      optimizer.resetOptimizations();
      
      const state = optimizer.getOptimizationState();
      expect(state.markerReduction).toBe(1.0);
      expect(state.animationsEnabled).toBe(true);
      expect(state.clusterRadius).toBe(60);
    });

    it('should track applied adjustments', () => {
      // Simulate applying an adjustment
      optimizer['applyAdjustment']({
        type: 'marker_reduction',
        severity: 'medium',
        description: 'Test adjustment',
        impact: 'Test impact',
        timestamp: Date.now(),
        applied: false
      });
      
      const adjustments = optimizer.getAppliedAdjustments();
      expect(adjustments).toHaveLength(1);
      expect(adjustments[0].type).toBe('marker_reduction');
      expect(adjustments[0].severity).toBe('medium');
      expect(adjustments[0].applied).toBe(true);
    });
  });

  describe('Performance Optimization Logic', () => {
    it('should apply critical optimizations for very low FPS', () => {
      // Mock critical FPS scenario
      const mockMetrics = {
        fps: 15, // Below critical threshold
        frameTime: 66.7,
        loadTime: 0,
        memoryUsage: 50 * 1024 * 1024, // 50MB
        operationTimes: new Map(),
        optimizationsApplied: []
      };
      
      optimizer['applyCriticalPerformanceOptimizations'](mockMetrics);
      
      const state = optimizer.getOptimizationState();
      expect(state.markerReduction).toBe(0.2); // Reduced to 20%
      expect(state.animationsEnabled).toBe(false);
      expect(state.clusterRadius).toBe(120);
      expect(state.dataVirtualizationEnabled).toBe(true);
      expect(state.updateThrottling).toBe(500);
    });

    it('should apply standard optimizations for low FPS', () => {
      // Mock low FPS scenario
      const mockMetrics = {
        fps: 25, // Below target but above critical
        frameTime: 40,
        loadTime: 0,
        memoryUsage: 50 * 1024 * 1024, // 50MB
        operationTimes: new Map(),
        optimizationsApplied: []
      };
      
      optimizer['applyPerformanceOptimizations'](mockMetrics);
      
      const state = optimizer.getOptimizationState();
      expect(state.markerReduction).toBe(0.6); // Reduced to 60%
      expect(state.clusterRadius).toBe(80);
      expect(state.updateThrottling).toBe(200);
    });

    it('should apply memory optimizations for high memory usage', () => {
      const memoryUsageMB = 150; // Above warning threshold
      
      optimizer['applyMemoryOptimizations'](memoryUsageMB);
      
      const state = optimizer.getOptimizationState();
      expect(state.cacheSize).toBe(50); // Reduced cache size
    });

    it('should apply critical memory optimizations', () => {
      const memoryUsageMB = 250; // Above critical threshold
      
      optimizer['applyCriticalMemoryOptimizations'](memoryUsageMB);
      
      const state = optimizer.getOptimizationState();
      expect(state.cacheSize).toBe(20); // Drastically reduced cache size
      expect(state.dataVirtualizationEnabled).toBe(true);
    });
  });

  describe('Optimization Reversal', () => {
    it('should reverse optimizations when performance improves', () => {
      // First apply some optimizations
      optimizer['currentState'].markerReduction = 0.6;
      optimizer['currentState'].clusterRadius = 100;
      optimizer['currentState'].animationsEnabled = false;
      optimizer['currentState'].updateThrottling = 300;
      
      // Mock good performance history
      const goodMetrics = {
        fps: 45, // Well above target
        frameTime: 22,
        loadTime: 0,
        memoryUsage: 50 * 1024 * 1024,
        operationTimes: new Map(),
        optimizationsApplied: []
      };
      
      // Simulate performance history with good FPS
      for (let i = 0; i < 15; i++) {
        optimizer['performanceHistory'].push(goodMetrics);
      }
      
      optimizer['considerOptimizationReversal'](goodMetrics);
      
      const state = optimizer.getOptimizationState();
      expect(state.markerReduction).toBeGreaterThan(0.6); // Should increase
      expect(state.clusterRadius).toBeLessThan(100); // Should decrease
      expect(state.updateThrottling).toBeLessThan(300); // Should decrease
    });

    it('should not reverse optimizations if performance is not consistently good', () => {
      // Apply some optimizations
      optimizer['currentState'].markerReduction = 0.6;
      
      // Mock inconsistent performance
      const inconsistentMetrics = {
        fps: 32, // Just above target but not consistently good
        frameTime: 31,
        loadTime: 0,
        memoryUsage: 50 * 1024 * 1024,
        operationTimes: new Map(),
        optimizationsApplied: []
      };
      
      // Add only a few samples
      for (let i = 0; i < 5; i++) {
        optimizer['performanceHistory'].push(inconsistentMetrics);
      }
      
      optimizer['considerOptimizationReversal'](inconsistentMetrics);
      
      const state = optimizer.getOptimizationState();
      expect(state.markerReduction).toBe(0.6); // Should not change
    });
  });

  describe('Memory Management', () => {
    it('should perform regular memory cleanup', () => {
      // Fill up performance history beyond limit
      for (let i = 0; i < 100; i++) {
        optimizer['performanceHistory'].push({
          fps: 30,
          frameTime: 33,
          loadTime: 0,
          memoryUsage: 50 * 1024 * 1024,
          operationTimes: new Map(),
          optimizationsApplied: []
        });
      }
      
      // Fill up adjustments beyond limit
      for (let i = 0; i < 60; i++) {
        optimizer['appliedAdjustments'].set(`test_${i}`, {
          type: 'marker_reduction',
          severity: 'low',
          description: `Test ${i}`,
          impact: 'Test impact',
          timestamp: Date.now(),
          applied: true
        });
      }
      
      optimizer['performMemoryCleanup']();
      
      expect(optimizer['performanceHistory'].length).toBeLessThanOrEqual(60);
      expect(optimizer['appliedAdjustments'].size).toBeLessThanOrEqual(50);
    });

    it('should perform emergency memory cleanup', () => {
      // Add some data
      for (let i = 0; i < 50; i++) {
        optimizer['performanceHistory'].push({
          fps: 30,
          frameTime: 33,
          loadTime: 0,
          memoryUsage: 50 * 1024 * 1024,
          operationTimes: new Map(),
          optimizationsApplied: []
        });
      }
      
      optimizer['performEmergencyMemoryCleanup']();
      
      expect(optimizer['performanceHistory'].length).toBeLessThanOrEqual(10);
      expect(optimizer['currentState'].cacheSize).toBeLessThanOrEqual(10);
    });
  });

  describe('Callback Management', () => {
    it('should manage optimization callbacks', () => {
      const callback = vi.fn();
      const unsubscribe = optimizer.onOptimization(callback);
      
      // Trigger an optimization
      optimizer['applyAdjustment']({
        type: 'animation',
        severity: 'high',
        description: 'Test callback',
        impact: 'Test impact',
        timestamp: Date.now(),
        applied: false
      });
      
      expect(callback).toHaveBeenCalledTimes(1);
      
      // Unsubscribe and test
      unsubscribe();
      
      optimizer['applyAdjustment']({
        type: 'clustering',
        severity: 'medium',
        description: 'Test callback 2',
        impact: 'Test impact 2',
        timestamp: Date.now(),
        applied: false
      });
      
      expect(callback).toHaveBeenCalledTimes(1); // Should not be called again
    });

    it('should manage state change callbacks', () => {
      const callback = vi.fn();
      const unsubscribe = optimizer.onStateChange(callback);
      
      // Trigger a state change
      optimizer.resetOptimizations();
      
      expect(callback).toHaveBeenCalledWith(optimizer.getOptimizationState());
      
      unsubscribe();
    });
  });

  describe('Manual Operations', () => {
    it('should trigger manual optimization check', () => {
      const spy = vi.spyOn(optimizer as any, 'performOptimizationCheck');
      
      optimizer.triggerOptimizationCheck();
      
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should update configuration', () => {
      const newConfig = {
        targetFPS: 60,
        enablePerformanceLogging: true
      };
      
      optimizer.updateConfig(newConfig);
      
      expect(optimizer['config'].targetFPS).toBe(60);
      expect(optimizer['config'].enablePerformanceLogging).toBe(true);
    });
  });

  describe('Performance Trend Analysis', () => {
    it('should detect performance degradation trends', () => {
      // Add older good performance
      for (let i = 0; i < 10; i++) {
        optimizer['performanceHistory'].push({
          fps: 45,
          frameTime: 22,
          loadTime: 0,
          memoryUsage: 50 * 1024 * 1024,
          operationTimes: new Map(),
          optimizationsApplied: []
        });
      }
      
      // Add recent poor performance
      for (let i = 0; i < 10; i++) {
        optimizer['performanceHistory'].push({
          fps: 35, // Declining but still above target
          frameTime: 28,
          loadTime: 0,
          memoryUsage: 50 * 1024 * 1024,
          operationTimes: new Map(),
          optimizationsApplied: []
        });
      }
      
      optimizer['analyzePerformanceTrends']();
      
      // Should apply preemptive throttling
      const state = optimizer.getOptimizationState();
      expect(state.updateThrottling).toBeGreaterThan(0);
    });

    it('should detect memory growth trends', () => {
      // Add older lower memory usage
      for (let i = 0; i < 10; i++) {
        optimizer['performanceHistory'].push({
          fps: 30,
          frameTime: 33,
          loadTime: 0,
          memoryUsage: 50 * 1024 * 1024, // 50MB
          operationTimes: new Map(),
          optimizationsApplied: []
        });
      }
      
      // Add recent higher memory usage
      for (let i = 0; i < 10; i++) {
        optimizer['performanceHistory'].push({
          fps: 30,
          frameTime: 33,
          loadTime: 0,
          memoryUsage: 70 * 1024 * 1024, // 70MB (20MB increase)
          operationTimes: new Map(),
          optimizationsApplied: []
        });
      }
      
      const cleanupSpy = vi.spyOn(optimizer as any, 'performMemoryCleanup');
      
      optimizer['analyzePerformanceTrends']();
      
      // Should schedule cleanup for memory growth
      expect(setTimeout).toHaveBeenCalled();
    });
  });
});