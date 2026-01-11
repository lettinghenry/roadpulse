// Enhanced performance metrics collector for comprehensive system monitoring
// Implements task 16.3 requirements for advanced performance monitoring and optimization

import React from 'react';
import { performanceMonitor, PerformanceMetrics } from './performanceMonitor';
import { performanceOptimizer, OptimizationState } from './performanceOptimizer';
import { performanceAnalytics } from './performanceAnalytics';

export interface SystemMetrics {
  // Core performance metrics
  fps: number;
  frameTime: number;
  memoryUsage: number;
  cpuUsage: number;
  
  // Network metrics
  networkLatency: number;
  connectionType: string;
  bandwidth: number;
  
  // Browser metrics
  domNodeCount: number;
  eventListenerCount: number;
  cacheHitRatio: number;
  
  // Device metrics
  batteryLevel: number;
  deviceMemory: number;
  hardwareConcurrency: number;
  
  // Application metrics
  loadTime: number;
  renderTime: number;
  gcPressure: number;
  
  // User experience metrics
  interactionLatency: number;
  visualStability: number;
  contentfulPaint: number;
}

export interface PerformanceThresholds {
  fps: { good: number; fair: number; poor: number };
  memory: { good: number; fair: number; poor: number };
  loadTime: { good: number; fair: number; poor: number };
  networkLatency: { good: number; fair: number; poor: number };
}

export interface MetricsCollectionConfig {
  collectionInterval: number;
  enableDetailedMetrics: boolean;
  enableNetworkMetrics: boolean;
  enableDeviceMetrics: boolean;
  enableUserExperienceMetrics: boolean;
  thresholds: PerformanceThresholds;
}

/**
 * Enhanced performance metrics collector that gathers comprehensive system performance data
 * and provides intelligent analysis and recommendations
 */
export class PerformanceMetricsCollector {
  private config: MetricsCollectionConfig;
  private collectionInterval: number | null = null;
  private metricsHistory: SystemMetrics[] = [];
  private readonly MAX_HISTORY_SIZE = 300; // 5 minutes at 1 sample/second
  
  // Performance observers
  private performanceObserver: PerformanceObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  
  // Metrics callbacks
  private metricsCallbacks = new Set<(metrics: SystemMetrics) => void>();
  private alertCallbacks = new Set<(alert: PerformanceAlert) => void>();
  
  // Baseline metrics for comparison
  private baselineMetrics: Partial<SystemMetrics> | null = null;
  private calibrationComplete = false;

  constructor(config: Partial<MetricsCollectionConfig> = {}) {
    this.config = {
      collectionInterval: 1000, // 1 second
      enableDetailedMetrics: true,
      enableNetworkMetrics: true,
      enableDeviceMetrics: true,
      enableUserExperienceMetrics: true,
      thresholds: {
        fps: { good: 55, fair: 30, poor: 20 },
        memory: { good: 100, fair: 200, poor: 300 }, // MB
        loadTime: { good: 2000, fair: 5000, poor: 10000 }, // ms
        networkLatency: { good: 100, fair: 500, poor: 1000 } // ms
      },
      ...config
    };

    this.initialize();
  }

  /**
   * Initialize the metrics collector
   */
  private initialize(): void {
    this.setupPerformanceObserver();
    this.setupIntersectionObserver();
    this.startMetricsCollection();
    this.calibrateBaseline();
    
    console.log('Performance metrics collector initialized');
  }

  /**
   * Setup Performance Observer for detailed browser metrics
   */
  private setupPerformanceObserver(): void {
    if (!('PerformanceObserver' in window)) {
      console.warn('PerformanceObserver not supported');
      return;
    }

    try {
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        this.processPerformanceEntries(entries);
      });

      // Observe different types of performance entries
      const entryTypes = ['measure', 'navigation', 'resource', 'paint', 'largest-contentful-paint'];
      
      entryTypes.forEach(type => {
        try {
          this.performanceObserver!.observe({ entryTypes: [type] });
        } catch (error) {
          console.warn(`Failed to observe ${type} entries:`, error);
        }
      });
    } catch (error) {
      console.warn('Failed to setup PerformanceObserver:', error);
    }
  }

  /**
   * Setup Intersection Observer for visual stability metrics
   */
  private setupIntersectionObserver(): void {
    if (!this.config.enableUserExperienceMetrics || !('IntersectionObserver' in window)) {
      return;
    }

    try {
      this.intersectionObserver = new IntersectionObserver((entries) => {
        this.processVisibilityChanges(entries);
      }, {
        threshold: [0, 0.25, 0.5, 0.75, 1.0]
      });

      // Observe key elements for visual stability
      const keyElements = document.querySelectorAll('[data-performance-critical]');
      keyElements.forEach(element => {
        this.intersectionObserver!.observe(element);
      });
    } catch (error) {
      console.warn('Failed to setup IntersectionObserver:', error);
    }
  }

  /**
   * Start periodic metrics collection
   */
  private startMetricsCollection(): void {
    if (this.collectionInterval) return;

    this.collectionInterval = window.setInterval(() => {
      this.collectMetrics();
    }, this.config.collectionInterval);

    performanceMonitor.trackInterval(this.collectionInterval);
  }

  /**
   * Collect comprehensive system metrics
   */
  private collectMetrics(): void {
    try {
      const coreMetrics = performanceMonitor.getMetrics();
      const systemMetrics = this.gatherSystemMetrics(coreMetrics);
      
      // Store in history
      this.metricsHistory.push(systemMetrics);
      if (this.metricsHistory.length > this.MAX_HISTORY_SIZE) {
        this.metricsHistory = this.metricsHistory.slice(-this.MAX_HISTORY_SIZE);
      }
      
      // Analyze metrics and generate alerts
      this.analyzeMetrics(systemMetrics);
      
      // Notify callbacks
      this.notifyMetricsCallbacks(systemMetrics);
      
    } catch (error) {
      console.error('Error collecting metrics:', error);
    }
  }

  /**
   * Gather comprehensive system metrics
   */
  private gatherSystemMetrics(coreMetrics: PerformanceMetrics): SystemMetrics {
    const systemMetrics: SystemMetrics = {
      // Core metrics from performance monitor
      fps: coreMetrics.fps,
      frameTime: coreMetrics.frameTime,
      memoryUsage: coreMetrics.memoryUsage ? coreMetrics.memoryUsage / (1024 * 1024) : 0,
      cpuUsage: coreMetrics.cpuUsage || this.estimateCPUUsage(),
      
      // Network metrics
      networkLatency: coreMetrics.networkLatency || this.measureNetworkLatency(),
      connectionType: coreMetrics.connectionType || this.getConnectionType(),
      bandwidth: this.estimateBandwidth(),
      
      // Browser metrics
      domNodeCount: coreMetrics.domNodeCount || document.querySelectorAll('*').length,
      eventListenerCount: coreMetrics.eventListenerCount || this.countEventListeners(),
      cacheHitRatio: coreMetrics.cacheHitRatio || 0,
      
      // Device metrics
      batteryLevel: coreMetrics.batteryLevel || this.getBatteryLevel(),
      deviceMemory: this.getDeviceMemory(),
      hardwareConcurrency: navigator.hardwareConcurrency || 1,
      
      // Application metrics
      loadTime: coreMetrics.loadTime,
      renderTime: coreMetrics.renderTime || this.measureRenderTime(),
      gcPressure: coreMetrics.gcPressure || this.estimateGCPressure(),
      
      // User experience metrics
      interactionLatency: this.measureInteractionLatency(),
      visualStability: this.calculateVisualStability(),
      contentfulPaint: this.getContentfulPaintTime()
    };

    return systemMetrics;
  }

  /**
   * Estimate CPU usage based on frame timing and other indicators
   */
  private estimateCPUUsage(): number {
    const frameTime = performanceMonitor.getMetrics().frameTime;
    if (frameTime <= 0) return 0;
    
    // Estimate based on frame time vs ideal frame time
    const idealFrameTime = 16.67; // 60fps
    const cpuUsage = Math.min(100, (frameTime / idealFrameTime) * 100);
    
    // Adjust based on other factors
    const memoryUsage = performanceMonitor.getMetrics().memoryUsage;
    if (memoryUsage && memoryUsage > 200 * 1024 * 1024) { // 200MB
      return Math.min(100, cpuUsage * 1.2); // Increase estimate for high memory usage
    }
    
    return Math.round(cpuUsage);
  }

  /**
   * Measure network latency using various techniques
   */
  private measureNetworkLatency(): number {
    // Try to get from Navigation Timing API
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navEntries.length > 0) {
        const entry = navEntries[0];
        return entry.responseStart - entry.requestStart;
      }
    }
    
    // Fallback: estimate from resource timing
    const resourceEntries = performance.getEntriesByType('resource');
    if (resourceEntries.length > 0) {
      const recentEntries = resourceEntries.slice(-5); // Last 5 resources
      const avgLatency = recentEntries.reduce((sum, entry) => {
        return sum + (entry.responseStart - entry.requestStart);
      }, 0) / recentEntries.length;
      
      return Math.round(avgLatency);
    }
    
    return 0;
  }

  /**
   * Get connection type from Network Information API
   */
  private getConnectionType(): string {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return connection.effectiveType || connection.type || 'unknown';
    }
    return 'unknown';
  }

  /**
   * Estimate bandwidth based on recent resource loading
   */
  private estimateBandwidth(): number {
    const resourceEntries = performance.getEntriesByType('resource').slice(-10);
    if (resourceEntries.length === 0) return 0;
    
    let totalBytes = 0;
    let totalTime = 0;
    
    resourceEntries.forEach(entry => {
      if (entry.transferSize && entry.transferSize > 0) {
        totalBytes += entry.transferSize;
        totalTime += entry.responseEnd - entry.responseStart;
      }
    });
    
    if (totalTime > 0) {
      // Return bandwidth in Mbps
      return Math.round((totalBytes * 8) / (totalTime / 1000) / 1024 / 1024);
    }
    
    return 0;
  }

  /**
   * Count active event listeners (approximation)
   */
  private countEventListeners(): number {
    // This is an approximation since we can't directly count all event listeners
    const elementsWithListeners = document.querySelectorAll('[onclick], [onload], [onchange]');
    return elementsWithListeners.length + 50; // Estimate for programmatically added listeners
  }

  /**
   * Get battery level if available
   */
  private getBatteryLevel(): number {
    // Battery API is deprecated but may still be available
    if ('getBattery' in navigator) {
      try {
        (navigator as any).getBattery().then((battery: any) => {
          return Math.round(battery.level * 100);
        });
      } catch (error) {
        // Ignore errors
      }
    }
    return 0;
  }

  /**
   * Get device memory if available
   */
  private getDeviceMemory(): number {
    if ('deviceMemory' in navigator) {
      return (navigator as any).deviceMemory || 0;
    }
    return 0;
  }

  /**
   * Measure render time using performance timing
   */
  private measureRenderTime(): number {
    const paintEntries = performance.getEntriesByType('paint');
    if (paintEntries.length > 0) {
      const firstPaint = paintEntries.find(entry => entry.name === 'first-paint');
      if (firstPaint) {
        return Math.round(firstPaint.startTime);
      }
    }
    return 0;
  }

  /**
   * Estimate garbage collection pressure
   */
  private estimateGCPressure(): number {
    const memoryUsage = performanceMonitor.getMetrics().memoryUsage;
    if (!memoryUsage || !this.baselineMetrics?.memoryUsage) return 0;
    
    const memoryGrowth = memoryUsage - (this.baselineMetrics.memoryUsage * 1024 * 1024);
    const memoryGrowthMB = memoryGrowth / (1024 * 1024);
    
    // Estimate GC pressure based on memory growth
    if (memoryGrowthMB > 100) return 100;
    if (memoryGrowthMB > 50) return 75;
    if (memoryGrowthMB > 25) return 50;
    if (memoryGrowthMB > 10) return 25;
    return 10;
  }

  /**
   * Measure interaction latency
   */
  private measureInteractionLatency(): number {
    // Use First Input Delay if available
    const fidEntries = performance.getEntriesByType('first-input');
    if (fidEntries.length > 0) {
      return Math.round(fidEntries[0].processingStart - fidEntries[0].startTime);
    }
    
    // Fallback: estimate from frame time
    return Math.max(0, performanceMonitor.getMetrics().frameTime - 16.67);
  }

  /**
   * Calculate visual stability score
   */
  private calculateVisualStability(): number {
    // Use Cumulative Layout Shift if available
    const clsEntries = performance.getEntriesByType('layout-shift');
    if (clsEntries.length > 0) {
      const totalShift = clsEntries.reduce((sum, entry) => {
        return sum + (entry as any).value;
      }, 0);
      
      // Convert to stability score (0-100, higher is better)
      return Math.max(0, 100 - (totalShift * 100));
    }
    
    return 100; // Assume stable if no data
  }

  /**
   * Get Largest Contentful Paint time
   */
  private getContentfulPaintTime(): number {
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
    if (lcpEntries.length > 0) {
      return Math.round(lcpEntries[lcpEntries.length - 1].startTime);
    }
    
    // Fallback to First Contentful Paint
    const fcpEntries = performance.getEntriesByType('paint');
    const fcp = fcpEntries.find(entry => entry.name === 'first-contentful-paint');
    if (fcp) {
      return Math.round(fcp.startTime);
    }
    
    return 0;
  }

  /**
   * Process performance entries from PerformanceObserver
   */
  private processPerformanceEntries(entries: PerformanceEntry[]): void {
    entries.forEach(entry => {
      if (entry.entryType === 'measure') {
        // Custom performance measures
        performanceMonitor.startOperation(`measure_${entry.name}`, entry.name);
        setTimeout(() => {
          performanceMonitor.endOperation(`measure_${entry.name}`);
        }, entry.duration);
      }
    });
  }

  /**
   * Process visibility changes for visual stability
   */
  private processVisibilityChanges(entries: IntersectionObserverEntry[]): void {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Element became visible - track for stability metrics
        const element = entry.target;
        element.setAttribute('data-visibility-time', Date.now().toString());
      }
    });
  }

  /**
   * Analyze metrics and generate alerts
   */
  private analyzeMetrics(metrics: SystemMetrics): void {
    const alerts: PerformanceAlert[] = [];
    
    // FPS analysis
    if (metrics.fps < this.config.thresholds.fps.poor) {
      alerts.push({
        type: 'fps_critical',
        severity: 'critical',
        message: `Critical FPS: ${metrics.fps} (threshold: ${this.config.thresholds.fps.poor})`,
        metrics: { fps: metrics.fps },
        recommendation: 'Enable aggressive performance optimizations'
      });
    } else if (metrics.fps < this.config.thresholds.fps.fair) {
      alerts.push({
        type: 'fps_warning',
        severity: 'warning',
        message: `Low FPS: ${metrics.fps} (threshold: ${this.config.thresholds.fps.fair})`,
        metrics: { fps: metrics.fps },
        recommendation: 'Consider enabling performance optimizations'
      });
    }
    
    // Memory analysis
    if (metrics.memoryUsage > this.config.thresholds.memory.poor) {
      alerts.push({
        type: 'memory_critical',
        severity: 'critical',
        message: `Critical memory usage: ${metrics.memoryUsage.toFixed(1)}MB`,
        metrics: { memoryUsage: metrics.memoryUsage },
        recommendation: 'Trigger emergency memory cleanup'
      });
    } else if (metrics.memoryUsage > this.config.thresholds.memory.fair) {
      alerts.push({
        type: 'memory_warning',
        severity: 'warning',
        message: `High memory usage: ${metrics.memoryUsage.toFixed(1)}MB`,
        metrics: { memoryUsage: metrics.memoryUsage },
        recommendation: 'Enable memory optimizations'
      });
    }
    
    // Network analysis
    if (metrics.networkLatency > this.config.thresholds.networkLatency.poor) {
      alerts.push({
        type: 'network_slow',
        severity: 'warning',
        message: `Slow network: ${metrics.networkLatency}ms latency`,
        metrics: { networkLatency: metrics.networkLatency },
        recommendation: 'Enable offline mode and aggressive caching'
      });
    }
    
    // CPU analysis
    if (metrics.cpuUsage > 90) {
      alerts.push({
        type: 'cpu_high',
        severity: 'critical',
        message: `High CPU usage: ${metrics.cpuUsage}%`,
        metrics: { cpuUsage: metrics.cpuUsage },
        recommendation: 'Reduce computational complexity'
      });
    }
    
    // Battery analysis (mobile devices)
    if (metrics.batteryLevel > 0 && metrics.batteryLevel < 20) {
      alerts.push({
        type: 'battery_low',
        severity: 'warning',
        message: `Low battery: ${metrics.batteryLevel}%`,
        metrics: { batteryLevel: metrics.batteryLevel },
        recommendation: 'Enable power saving mode'
      });
    }
    
    // Notify alert callbacks
    alerts.forEach(alert => {
      this.notifyAlertCallbacks(alert);
    });
  }

  /**
   * Calibrate baseline metrics for comparison
   */
  private calibrateBaseline(): void {
    // Wait for initial stabilization
    setTimeout(() => {
      const metrics = this.gatherSystemMetrics(performanceMonitor.getMetrics());
      this.baselineMetrics = {
        fps: metrics.fps,
        memoryUsage: metrics.memoryUsage,
        cpuUsage: metrics.cpuUsage,
        networkLatency: metrics.networkLatency,
        loadTime: metrics.loadTime
      };
      
      this.calibrationComplete = true;
      console.log('Performance baseline calibrated:', this.baselineMetrics);
    }, 5000); // 5 seconds
  }

  // Public API methods

  /**
   * Get current system metrics
   */
  getCurrentMetrics(): SystemMetrics | null {
    return this.metricsHistory.length > 0 ? 
      this.metricsHistory[this.metricsHistory.length - 1] : null;
  }

  /**
   * Get metrics history
   */
  getMetricsHistory(limit?: number): SystemMetrics[] {
    return limit ? this.metricsHistory.slice(-limit) : [...this.metricsHistory];
  }

  /**
   * Get baseline metrics
   */
  getBaselineMetrics(): Partial<SystemMetrics> | null {
    return this.baselineMetrics;
  }

  /**
   * Check if calibration is complete
   */
  isCalibrationComplete(): boolean {
    return this.calibrationComplete;
  }

  /**
   * Subscribe to metrics updates
   */
  onMetrics(callback: (metrics: SystemMetrics) => void): () => void {
    this.metricsCallbacks.add(callback);
    return () => this.metricsCallbacks.delete(callback);
  }

  /**
   * Subscribe to performance alerts
   */
  onAlert(callback: (alert: PerformanceAlert) => void): () => void {
    this.alertCallbacks.add(callback);
    return () => this.alertCallbacks.delete(callback);
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<MetricsCollectionConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Metrics collector configuration updated');
  }

  /**
   * Generate performance report
   */
  generateReport(): PerformanceReport {
    const currentMetrics = this.getCurrentMetrics();
    if (!currentMetrics) {
      throw new Error('No metrics available for report generation');
    }
    
    const recentHistory = this.getMetricsHistory(60); // Last minute
    const trends = this.analyzeTrends(recentHistory);
    const recommendations = this.generateRecommendations(currentMetrics, trends);
    
    return {
      timestamp: Date.now(),
      metrics: currentMetrics,
      baseline: this.baselineMetrics,
      trends,
      recommendations,
      score: this.calculatePerformanceScore(currentMetrics)
    };
  }

  /**
   * Analyze performance trends
   */
  private analyzeTrends(history: SystemMetrics[]): PerformanceTrend[] {
    if (history.length < 10) return [];
    
    const trends: PerformanceTrend[] = [];
    const metrics = ['fps', 'memoryUsage', 'cpuUsage', 'networkLatency'] as const;
    
    metrics.forEach(metric => {
      const values = history.map(h => h[metric]).filter(v => v > 0);
      if (values.length < 5) return;
      
      const oldAvg = values.slice(0, Math.floor(values.length / 2))
        .reduce((sum, val) => sum + val, 0) / Math.floor(values.length / 2);
      const newAvg = values.slice(Math.floor(values.length / 2))
        .reduce((sum, val) => sum + val, 0) / Math.ceil(values.length / 2);
      
      const changePercent = ((newAvg - oldAvg) / oldAvg) * 100;
      
      let trend: 'improving' | 'stable' | 'degrading';
      if (Math.abs(changePercent) < 5) {
        trend = 'stable';
      } else if (metric === 'fps' ? changePercent > 0 : changePercent < 0) {
        trend = 'improving';
      } else {
        trend = 'degrading';
      }
      
      trends.push({
        metric,
        trend,
        changePercent: Math.abs(changePercent),
        timeframe: history.length * this.config.collectionInterval
      });
    });
    
    return trends;
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(metrics: SystemMetrics, trends: PerformanceTrend[]): string[] {
    const recommendations: string[] = [];
    
    // FPS recommendations
    if (metrics.fps < this.config.thresholds.fps.fair) {
      recommendations.push('Enable marker clustering and data virtualization');
      recommendations.push('Switch to heat map visualization for better performance');
    }
    
    // Memory recommendations
    if (metrics.memoryUsage > this.config.thresholds.memory.fair) {
      recommendations.push('Clear browser caches and reduce data loading');
      recommendations.push('Enable aggressive memory cleanup');
    }
    
    // CPU recommendations
    if (metrics.cpuUsage > 70) {
      recommendations.push('Reduce computational complexity and disable animations');
      recommendations.push('Enable CPU-based performance optimizations');
    }
    
    // Network recommendations
    if (metrics.networkLatency > this.config.thresholds.networkLatency.fair) {
      recommendations.push('Enable offline mode and request batching');
      recommendations.push('Implement aggressive caching strategies');
    }
    
    // Trend-based recommendations
    trends.forEach(trend => {
      if (trend.trend === 'degrading' && trend.changePercent > 10) {
        recommendations.push(`Address degrading ${trend.metric} trend (${trend.changePercent.toFixed(1)}% decline)`);
      }
    });
    
    return recommendations;
  }

  /**
   * Calculate overall performance score
   */
  private calculatePerformanceScore(metrics: SystemMetrics): number {
    let score = 100;
    
    // FPS score (30% weight)
    const fpsScore = Math.min(100, (metrics.fps / 60) * 100);
    score = score * 0.7 + fpsScore * 0.3;
    
    // Memory score (25% weight)
    const memoryScore = Math.max(0, 100 - (metrics.memoryUsage / 300) * 100);
    score = score * 0.75 + memoryScore * 0.25;
    
    // CPU score (20% weight)
    const cpuScore = Math.max(0, 100 - metrics.cpuUsage);
    score = score * 0.8 + cpuScore * 0.2;
    
    // Network score (15% weight)
    const networkScore = Math.max(0, 100 - (metrics.networkLatency / 1000) * 100);
    score = score * 0.85 + networkScore * 0.15;
    
    // User experience score (10% weight)
    const uxScore = (metrics.visualStability + Math.max(0, 100 - metrics.interactionLatency)) / 2;
    score = score * 0.9 + uxScore * 0.1;
    
    return Math.round(Math.max(0, Math.min(100, score)));
  }

  /**
   * Notify metrics callbacks
   */
  private notifyMetricsCallbacks(metrics: SystemMetrics): void {
    this.metricsCallbacks.forEach(callback => {
      try {
        callback(metrics);
      } catch (error) {
        console.error('Error in metrics callback:', error);
      }
    });
  }

  /**
   * Notify alert callbacks
   */
  private notifyAlertCallbacks(alert: PerformanceAlert): void {
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in alert callback:', error);
      }
    });
  }

  /**
   * Stop metrics collection and cleanup
   */
  stop(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      performanceMonitor.untrackInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
    
    if (this.performanceObserver) {
      this.performanceObserver.disconnect();
      this.performanceObserver = null;
    }
    
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
      this.intersectionObserver = null;
    }
    
    this.metricsCallbacks.clear();
    this.alertCallbacks.clear();
    
    console.log('Performance metrics collector stopped');
  }
}

// Additional interfaces for the enhanced collector
export interface PerformanceAlert {
  type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  metrics: Partial<SystemMetrics>;
  recommendation: string;
}

export interface PerformanceReport {
  timestamp: number;
  metrics: SystemMetrics;
  baseline: Partial<SystemMetrics> | null;
  trends: PerformanceTrend[];
  recommendations: string[];
  score: number;
}

export interface PerformanceTrend {
  metric: keyof SystemMetrics;
  trend: 'improving' | 'stable' | 'degrading';
  changePercent: number;
  timeframe: number;
}

// Export singleton instance
export const performanceMetricsCollector = new PerformanceMetricsCollector();

// React hook for enhanced metrics collection
export function usePerformanceMetricsCollection() {
  const [metrics, setMetrics] = React.useState<SystemMetrics | null>(null);
  const [alerts, setAlerts] = React.useState<PerformanceAlert[]>([]);
  const [isCalibrated, setIsCalibrated] = React.useState(false);

  React.useEffect(() => {
    const unsubscribeMetrics = performanceMetricsCollector.onMetrics(setMetrics);
    const unsubscribeAlerts = performanceMetricsCollector.onAlert((alert) => {
      setAlerts(prev => [...prev.slice(-9), alert]); // Keep last 10 alerts
    });

    // Check calibration status
    const checkCalibration = () => {
      setIsCalibrated(performanceMetricsCollector.isCalibrationComplete());
    };
    
    const calibrationInterval = setInterval(checkCalibration, 1000);
    checkCalibration();

    return () => {
      unsubscribeMetrics();
      unsubscribeAlerts();
      clearInterval(calibrationInterval);
    };
  }, []);

  return {
    metrics,
    alerts,
    isCalibrated,
    baseline: performanceMetricsCollector.getBaselineMetrics(),
    history: performanceMetricsCollector.getMetricsHistory(60),
    generateReport: () => performanceMetricsCollector.generateReport()
  };
}