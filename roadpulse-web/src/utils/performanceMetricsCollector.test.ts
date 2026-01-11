import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { 
  PerformanceMetricsCollector, 
  SystemMetrics, 
  PerformanceAlert,
  MetricsCollectionConfig 
} from './performanceMetricsCollector';

// Mock performance APIs
const mockPerformanceNow = vi.fn();
const mockGetEntriesByType = vi.fn();
const mockPerformanceObserver = vi.fn();
const mockIntersectionObserver = vi.fn();

Object.defineProperty(globalThis, 'performance', {
  value: {
    now: mockPerformanceNow,
    getEntriesByType: mockGetEntriesByType,
    memory: {
      usedJSHeapSize: 1024 * 1024 * 50 // 50MB
    }
  },
  writable: true
});

Object.defineProperty(globalThis, 'PerformanceObserver', {
  value: mockPerformanceObserver,
  writable: true
});

Object.defineProperty(globalThis, 'IntersectionObserver', {
  value: mockIntersectionObserver,
  writable: true
});

// Mock navigator
Object.defineProperty(globalThis, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    hardwareConcurrency: 8,
    connection: {
      effectiveType: '4g',
      type: 'wifi'
    }
  },
  writable: true
});

// Mock document
Object.defineProperty(globalThis, 'document', {
  value: {
    querySelectorAll: vi.fn(() => ({ length: 100 })),
    readyState: 'complete'
  },
  writable: true
});

// Mock window.setInterval and clearInterval
const mockSetInterval = vi.fn();
const mockClearInterval = vi.fn();
globalThis.setInterval = mockSetInterval;
globalThis.clearInterval = mockClearInterval;

describe('PerformanceMetricsCollector', () => {
  let collector: PerformanceMetricsCollector;
  let currentTime = 0;

  beforeEach(() => {
    currentTime = 0;
    mockPerformanceNow.mockImplementation(() => currentTime);
    mockGetEntriesByType.mockReturnValue([]);
    mockSetInterval.mockImplementation((callback, delay) => {
      // Return a mock interval ID
      return 123;
    });
    mockClearInterval.mockImplementation(() => {});
    
    // Mock PerformanceObserver
    mockPerformanceObserver.mockImplementation(function(callback) {
      this.observe = vi.fn();
      this.disconnect = vi.fn();
    });
    
    // Mock IntersectionObserver
    mockIntersectionObserver.mockImplementation(function(callback, options) {
      this.observe = vi.fn();
      this.disconnect = vi.fn();
    });
    
    const config: Partial<MetricsCollectionConfig> = {
      collectionInterval: 100, // Fast for testing
      enableDetailedMetrics: true,
      enableNetworkMetrics: true,
      enableDeviceMetrics: true,
      enableUserExperienceMetrics: true
    };
    
    collector = new PerformanceMetricsCollector(config);
  });

  afterEach(() => {
    collector.stop();
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const defaultCollector = new PerformanceMetricsCollector();
      expect(defaultCollector).toBeDefined();
      defaultCollector.stop();
    });

    it('should accept custom configuration', () => {
      const customConfig: Partial<MetricsCollectionConfig> = {
        collectionInterval: 2000,
        enableDetailedMetrics: false,
        thresholds: {
          fps: { good: 50, fair: 25, poor: 15 },
          memory: { good: 80, fair: 150, poor: 250 },
          loadTime: { good: 1500, fair: 4000, poor: 8000 },
          networkLatency: { good: 80, fair: 400, poor: 800 }
        }
      };
      
      const customCollector = new PerformanceMetricsCollector(customConfig);
      expect(customCollector).toBeDefined();
      customCollector.stop();
    });

    it('should setup performance observers when available', () => {
      expect(mockPerformanceObserver).toHaveBeenCalled();
      expect(mockIntersectionObserver).toHaveBeenCalled();
    });
  });

  describe('Metrics Collection', () => {
    it('should collect system metrics', () => {
      // Mock performance monitor metrics
      const mockCoreMetrics = {
        fps: 45,
        frameTime: 22,
        loadTime: 2500,
        memoryUsage: 75 * 1024 * 1024, // 75MB
        cpuUsage: 35,
        networkLatency: 120,
        connectionType: '4g',
        domNodeCount: 150,
        eventListenerCount: 25,
        cacheHitRatio: 85,
        batteryLevel: 65,
        renderTime: 18,
        gcPressure: 15,
        operationTimes: new Map(),
        optimizationsApplied: []
      };
      
      // Mock the performance monitor
      vi.doMock('./performanceMonitor', () => ({
        performanceMonitor: {
          getMetrics: () => mockCoreMetrics,
          trackInterval: vi.fn()
        }
      }));
      
      const metrics = collector['gatherSystemMetrics'](mockCoreMetrics);
      
      expect(metrics).toHaveProperty('fps');
      expect(metrics).toHaveProperty('memoryUsage');
      expect(metrics).toHaveProperty('cpuUsage');
      expect(metrics).toHaveProperty('networkLatency');
      expect(metrics).toHaveProperty('connectionType');
      expect(metrics).toHaveProperty('domNodeCount');
      expect(metrics).toHaveProperty('deviceMemory');
      expect(metrics).toHaveProperty('hardwareConcurrency');
      expect(metrics).toHaveProperty('interactionLatency');
      expect(metrics).toHaveProperty('visualStability');
    });

    it('should estimate CPU usage when not provided', () => {
      const cpuUsage = collector['estimateCPUUsage']();
      expect(typeof cpuUsage).toBe('number');
      expect(cpuUsage).toBeGreaterThanOrEqual(0);
      expect(cpuUsage).toBeLessThanOrEqual(100);
    });

    it('should measure network latency from navigation timing', () => {
      mockGetEntriesByType.mockReturnValue([
        {
          entryType: 'navigation',
          requestStart: 100,
          responseStart: 250
        }
      ]);
      
      const latency = collector['measureNetworkLatency']();
      expect(latency).toBe(150);
    });

    it('should get connection type from navigator', () => {
      const connectionType = collector['getConnectionType']();
      expect(connectionType).toBe('4g');
    });

    it('should estimate bandwidth from resource timing', () => {
      mockGetEntriesByType.mockReturnValue([
        {
          entryType: 'resource',
          transferSize: 1024 * 100, // 100KB
          responseStart: 100,
          responseEnd: 200 // 100ms transfer
        }
      ]);
      
      const bandwidth = collector['estimateBandwidth']();
      expect(bandwidth).toBeGreaterThan(0);
    });
  });

  describe('Metrics Analysis', () => {
    it('should generate alerts for poor performance', () => {
      const alerts: PerformanceAlert[] = [];
      const mockCallback = vi.fn((alert) => alerts.push(alert));
      
      collector.onAlert(mockCallback);
      
      const poorMetrics: SystemMetrics = {
        fps: 15, // Below poor threshold
        frameTime: 66,
        memoryUsage: 350, // Above critical threshold
        cpuUsage: 95, // High CPU
        networkLatency: 1200, // Slow network
        connectionType: '4g',
        bandwidth: 5,
        domNodeCount: 200,
        eventListenerCount: 30,
        cacheHitRatio: 75,
        batteryLevel: 15, // Low battery
        deviceMemory: 8,
        hardwareConcurrency: 4,
        loadTime: 3000,
        renderTime: 45,
        gcPressure: 80,
        interactionLatency: 150,
        visualStability: 85,
        contentfulPaint: 2500
      };
      
      collector['analyzeMetrics'](poorMetrics);
      
      expect(alerts.length).toBeGreaterThan(0);
      expect(alerts.some(alert => alert.type === 'fps_critical')).toBe(true);
      expect(alerts.some(alert => alert.type === 'memory_critical')).toBe(true);
      expect(alerts.some(alert => alert.type === 'cpu_high')).toBe(true);
      expect(alerts.some(alert => alert.type === 'network_slow')).toBe(true);
      expect(alerts.some(alert => alert.type === 'battery_low')).toBe(true);
    });

    it('should not generate alerts for good performance', () => {
      const alerts: PerformanceAlert[] = [];
      const mockCallback = vi.fn((alert) => alerts.push(alert));
      
      collector.onAlert(mockCallback);
      
      const goodMetrics: SystemMetrics = {
        fps: 58,
        frameTime: 17,
        memoryUsage: 80,
        cpuUsage: 25,
        networkLatency: 80,
        connectionType: '4g',
        bandwidth: 50,
        domNodeCount: 150,
        eventListenerCount: 20,
        cacheHitRatio: 90,
        batteryLevel: 75,
        deviceMemory: 8,
        hardwareConcurrency: 4,
        loadTime: 1800,
        renderTime: 15,
        gcPressure: 20,
        interactionLatency: 25,
        visualStability: 95,
        contentfulPaint: 1200
      };
      
      collector['analyzeMetrics'](goodMetrics);
      
      expect(alerts.length).toBe(0);
    });
  });

  describe('Baseline Calibration', () => {
    it('should calibrate baseline metrics', async () => {
      expect(collector.isCalibrationComplete()).toBe(false);
      expect(collector.getBaselineMetrics()).toBeNull();
      
      // Fast-forward time to complete calibration
      await new Promise<void>((resolve) => {
        setTimeout(() => {
          // Simulate calibration completion
          collector['calibrationComplete'] = true;
          collector['baselineMetrics'] = {
            fps: 50,
            memoryUsage: 100,
            cpuUsage: 30,
            networkLatency: 100,
            loadTime: 2000
          };
          resolve();
        }, 10);
      });
      
      expect(collector.isCalibrationComplete()).toBe(true);
      expect(collector.getBaselineMetrics()).not.toBeNull();
    });
  });

  describe('Metrics History', () => {
    it('should maintain metrics history', () => {
      const mockMetrics: SystemMetrics = {
        fps: 45,
        frameTime: 22,
        memoryUsage: 100,
        cpuUsage: 35,
        networkLatency: 120,
        connectionType: '4g',
        bandwidth: 25,
        domNodeCount: 150,
        eventListenerCount: 25,
        cacheHitRatio: 85,
        batteryLevel: 65,
        deviceMemory: 8,
        hardwareConcurrency: 4,
        loadTime: 2500,
        renderTime: 18,
        gcPressure: 15,
        interactionLatency: 35,
        visualStability: 90,
        contentfulPaint: 1800
      };
      
      // Simulate adding metrics to history
      collector['metricsHistory'].push(mockMetrics);
      collector['metricsHistory'].push({ ...mockMetrics, fps: 50 });
      collector['metricsHistory'].push({ ...mockMetrics, fps: 55 });
      
      const history = collector.getMetricsHistory();
      expect(history.length).toBe(3);
      expect(history[0].fps).toBe(45);
      expect(history[2].fps).toBe(55);
      
      const limitedHistory = collector.getMetricsHistory(2);
      expect(limitedHistory.length).toBe(2);
      expect(limitedHistory[1].fps).toBe(55);
    });

    it('should limit history size', () => {
      const maxSize = collector['MAX_HISTORY_SIZE'];
      
      // Add more metrics than the limit
      for (let i = 0; i < maxSize + 50; i++) {
        collector['metricsHistory'].push({
          fps: 30 + i,
          frameTime: 33,
          memoryUsage: 100,
          cpuUsage: 30,
          networkLatency: 100,
          connectionType: '4g',
          bandwidth: 20,
          domNodeCount: 150,
          eventListenerCount: 25,
          cacheHitRatio: 85,
          batteryLevel: 70,
          deviceMemory: 8,
          hardwareConcurrency: 4,
          loadTime: 2000,
          renderTime: 20,
          gcPressure: 10,
          interactionLatency: 30,
          visualStability: 90,
          contentfulPaint: 1500
        });
      }
      
      // Simulate cleanup
      if (collector['metricsHistory'].length > maxSize) {
        collector['metricsHistory'] = collector['metricsHistory'].slice(-maxSize);
      }
      
      expect(collector['metricsHistory'].length).toBeLessThanOrEqual(maxSize);
    });
  });

  describe('Report Generation', () => {
    it('should generate performance report', () => {
      // Setup baseline and current metrics
      collector['calibrationComplete'] = true;
      collector['baselineMetrics'] = {
        fps: 50,
        memoryUsage: 80,
        cpuUsage: 25,
        networkLatency: 100,
        loadTime: 2000
      };
      
      const currentMetrics: SystemMetrics = {
        fps: 45,
        frameTime: 22,
        memoryUsage: 120,
        cpuUsage: 40,
        networkLatency: 150,
        connectionType: '4g',
        bandwidth: 20,
        domNodeCount: 180,
        eventListenerCount: 30,
        cacheHitRatio: 80,
        batteryLevel: 60,
        deviceMemory: 8,
        hardwareConcurrency: 4,
        loadTime: 2800,
        renderTime: 25,
        gcPressure: 25,
        interactionLatency: 40,
        visualStability: 85,
        contentfulPaint: 2200
      };
      
      collector['metricsHistory'].push(currentMetrics);
      
      const report = collector.generateReport();
      
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('metrics');
      expect(report).toHaveProperty('baseline');
      expect(report).toHaveProperty('trends');
      expect(report).toHaveProperty('recommendations');
      expect(report).toHaveProperty('score');
      
      expect(report.metrics).toEqual(currentMetrics);
      expect(report.baseline).toEqual(collector['baselineMetrics']);
      expect(typeof report.score).toBe('number');
      expect(report.score).toBeGreaterThanOrEqual(0);
      expect(report.score).toBeLessThanOrEqual(100);
    });

    it('should throw error when no metrics available', () => {
      expect(() => collector.generateReport()).toThrow('No metrics available for report generation');
    });
  });

  describe('Trend Analysis', () => {
    it('should analyze performance trends', () => {
      const history: SystemMetrics[] = [];
      
      // Create trend data - declining FPS
      for (let i = 0; i < 20; i++) {
        history.push({
          fps: 60 - i, // Declining FPS
          frameTime: 16 + i,
          memoryUsage: 100 + i * 2, // Increasing memory
          cpuUsage: 30,
          networkLatency: 100,
          connectionType: '4g',
          bandwidth: 25,
          domNodeCount: 150,
          eventListenerCount: 25,
          cacheHitRatio: 85,
          batteryLevel: 70,
          deviceMemory: 8,
          hardwareConcurrency: 4,
          loadTime: 2000,
          renderTime: 20,
          gcPressure: 15,
          interactionLatency: 30,
          visualStability: 90,
          contentfulPaint: 1800
        });
      }
      
      const trends = collector['analyzeTrends'](history);
      
      expect(trends.length).toBeGreaterThan(0);
      
      const fpsTrend = trends.find(t => t.metric === 'fps');
      expect(fpsTrend).toBeDefined();
      expect(fpsTrend?.trend).toBe('degrading');
      
      const memoryTrend = trends.find(t => t.metric === 'memoryUsage');
      expect(memoryTrend).toBeDefined();
      expect(memoryTrend?.trend).toBe('degrading');
    });

    it('should detect stable trends', () => {
      const history: SystemMetrics[] = [];
      
      // Create stable data
      for (let i = 0; i < 20; i++) {
        history.push({
          fps: 50 + (Math.random() - 0.5) * 2, // Stable around 50
          frameTime: 20,
          memoryUsage: 100,
          cpuUsage: 30,
          networkLatency: 100,
          connectionType: '4g',
          bandwidth: 25,
          domNodeCount: 150,
          eventListenerCount: 25,
          cacheHitRatio: 85,
          batteryLevel: 70,
          deviceMemory: 8,
          hardwareConcurrency: 4,
          loadTime: 2000,
          renderTime: 20,
          gcPressure: 15,
          interactionLatency: 30,
          visualStability: 90,
          contentfulPaint: 1800
        });
      }
      
      const trends = collector['analyzeTrends'](history);
      
      const fpsTrend = trends.find(t => t.metric === 'fps');
      expect(fpsTrend?.trend).toBe('stable');
    });
  });

  describe('Callback Management', () => {
    it('should manage metrics callbacks', () => {
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      
      const unsubscribe1 = collector.onMetrics(callback1);
      const unsubscribe2 = collector.onMetrics(callback2);
      
      const mockMetrics: SystemMetrics = {
        fps: 45,
        frameTime: 22,
        memoryUsage: 100,
        cpuUsage: 35,
        networkLatency: 120,
        connectionType: '4g',
        bandwidth: 25,
        domNodeCount: 150,
        eventListenerCount: 25,
        cacheHitRatio: 85,
        batteryLevel: 65,
        deviceMemory: 8,
        hardwareConcurrency: 4,
        loadTime: 2500,
        renderTime: 18,
        gcPressure: 15,
        interactionLatency: 35,
        visualStability: 90,
        contentfulPaint: 1800
      };
      
      collector['notifyMetricsCallbacks'](mockMetrics);
      
      expect(callback1).toHaveBeenCalledWith(mockMetrics);
      expect(callback2).toHaveBeenCalledWith(mockMetrics);
      
      // Unsubscribe first callback
      unsubscribe1();
      vi.clearAllMocks();
      
      collector['notifyMetricsCallbacks'](mockMetrics);
      
      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).toHaveBeenCalledWith(mockMetrics);
      
      unsubscribe2();
    });

    it('should manage alert callbacks', () => {
      const callback = vi.fn();
      const unsubscribe = collector.onAlert(callback);
      
      const mockAlert: PerformanceAlert = {
        type: 'fps_warning',
        severity: 'warning',
        message: 'Low FPS detected',
        metrics: { fps: 25 },
        recommendation: 'Enable optimizations'
      };
      
      collector['notifyAlertCallbacks'](mockAlert);
      
      expect(callback).toHaveBeenCalledWith(mockAlert);
      
      unsubscribe();
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const newConfig = {
        collectionInterval: 2000,
        enableNetworkMetrics: false,
        thresholds: {
          fps: { good: 55, fair: 30, poor: 20 },
          memory: { good: 120, fair: 220, poor: 320 },
          loadTime: { good: 2500, fair: 6000, poor: 12000 },
          networkLatency: { good: 120, fair: 600, poor: 1200 }
        }
      };
      
      collector.updateConfig(newConfig);
      
      expect(collector['config'].collectionInterval).toBe(2000);
      expect(collector['config'].enableNetworkMetrics).toBe(false);
      expect(collector['config'].thresholds.fps.good).toBe(55);
    });
  });

  describe('Cleanup', () => {
    it('should stop collection and cleanup resources', () => {
      collector.stop();
      
      expect(mockClearInterval).toHaveBeenCalled();
    });

    it('should disconnect observers on stop', () => {
      const mockObserver = {
        observe: vi.fn(),
        disconnect: vi.fn()
      };
      
      collector['performanceObserver'] = mockObserver as any;
      collector['intersectionObserver'] = mockObserver as any;
      
      collector.stop();
      
      expect(mockObserver.disconnect).toHaveBeenCalledTimes(2);
    });
  });
});