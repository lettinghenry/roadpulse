// Enhanced performance optimization utilities for automatic performance adjustments
// Implements requirements for performance optimization and memory leak handling

import React from 'react';
import { performanceMonitor, PerformanceMetrics, PerformanceOptimization } from './performanceMonitor';
import { errorHandler, PerformanceError } from './errorHandler';

export interface PerformanceOptimizationConfig {
  // FPS thresholds
  targetFPS: number;
  criticalFPS: number;
  
  // Memory thresholds (in MB)
  memoryWarningThreshold: number;
  memoryCriticalThreshold: number;
  
  // Optimization settings
  enableAutoOptimization: boolean;
  enableMemoryCleanup: boolean;
  enablePerformanceLogging: boolean;
  
  // Adjustment intervals
  optimizationCheckInterval: number;
  memoryCheckInterval: number;
}

export interface OptimizationState {
  markerReduction: number; // 0-1, percentage of markers to show
  clusterRadius: number; // Clustering radius adjustment
  animationsEnabled: boolean;
  heatMapEnabled: boolean;
  dataVirtualizationEnabled: boolean;
  cacheSize: number; // Maximum cache size
  updateThrottling: number; // Milliseconds between updates
}

export interface PerformanceAdjustment {
  type: 'marker_reduction' | 'clustering' | 'animation' | 'virtualization' | 'memory_cleanup' | 'cache_optimization';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  impact: string;
  timestamp: number;
  applied: boolean;
}

/**
 * Enhanced performance optimizer that automatically adjusts system performance
 * based on real-time metrics and user device capabilities
 */
export class PerformanceOptimizer {
  private config: PerformanceOptimizationConfig;
  private currentState: OptimizationState;
  private appliedAdjustments: Map<string, PerformanceAdjustment> = new Map();
  private optimizationInterval: number | null = null;
  private memoryCleanupInterval: number | null = null;
  private isOptimizing = false;
  
  // Performance history for trend analysis
  private performanceHistory: PerformanceMetrics[] = [];
  private readonly HISTORY_SIZE = 60; // Keep 60 samples (1 minute at 1 sample/second)
  
  // Callbacks for optimization events
  private optimizationCallbacks = new Set<(adjustment: PerformanceAdjustment) => void>();
  private stateChangeCallbacks = new Set<(state: OptimizationState) => void>();

  constructor(config: Partial<PerformanceOptimizationConfig> = {}) {
    this.config = {
      targetFPS: 30,
      criticalFPS: 20,
      memoryWarningThreshold: 150, // 150MB
      memoryCriticalThreshold: 250, // 250MB
      enableAutoOptimization: true,
      enableMemoryCleanup: true,
      enablePerformanceLogging: true,
      optimizationCheckInterval: 2000, // 2 seconds
      memoryCheckInterval: 10000, // 10 seconds
      ...config
    };

    this.currentState = {
      markerReduction: 1.0, // Show all markers initially
      clusterRadius: 60, // Default cluster radius
      animationsEnabled: true,
      heatMapEnabled: true,
      dataVirtualizationEnabled: false,
      cacheSize: 100, // Default cache size (MB)
      updateThrottling: 0 // No throttling initially
    };

    this.initialize();
  }

  /**
   * Initialize the performance optimizer
   */
  private initialize(): void {
    if (this.config.enableAutoOptimization) {
      this.startOptimizationMonitoring();
    }

    if (this.config.enableMemoryCleanup) {
      this.startMemoryCleanupMonitoring();
    }

    // Subscribe to performance metrics
    performanceMonitor.onPerformanceChange((metrics) => {
      this.updatePerformanceHistory(metrics);
      this.analyzePerformanceTrends();
    });

    console.log('Performance optimizer initialized with config:', this.config);
  }

  /**
   * Start automatic optimization monitoring
   */
  private startOptimizationMonitoring(): void {
    if (this.optimizationInterval) return;

    this.optimizationInterval = window.setInterval(() => {
      this.performOptimizationCheck();
    }, this.config.optimizationCheckInterval);

    performanceMonitor.trackInterval(this.optimizationInterval);
  }

  /**
   * Start memory cleanup monitoring
   */
  private startMemoryCleanupMonitoring(): void {
    if (this.memoryCleanupInterval) return;

    this.memoryCleanupInterval = window.setInterval(() => {
      this.performMemoryCleanup();
    }, this.config.memoryCheckInterval);

    performanceMonitor.trackInterval(this.memoryCleanupInterval);
  }
  /**
   * Perform comprehensive optimization check
   */
  private performOptimizationCheck(): void {
    if (this.isOptimizing) return;

    this.isOptimizing = true;
    
    try {
      const metrics = performanceMonitor.getMetrics();
      const memoryUsageMB = metrics.memoryUsage ? metrics.memoryUsage / (1024 * 1024) : 0;

      // Check FPS performance
      if (metrics.fps < this.config.criticalFPS) {
        this.applyCriticalPerformanceOptimizations(metrics);
      } else if (metrics.fps < this.config.targetFPS) {
        this.applyPerformanceOptimizations(metrics);
      } else if (metrics.fps > this.config.targetFPS + 10) {
        this.considerOptimizationReversal(metrics);
      }

      // Check memory usage
      if (memoryUsageMB > this.config.memoryCriticalThreshold) {
        this.applyCriticalMemoryOptimizations(memoryUsageMB);
      } else if (memoryUsageMB > this.config.memoryWarningThreshold) {
        this.applyMemoryOptimizations(memoryUsageMB);
      }

      // Check for memory leaks
      const memoryLeaks = performanceMonitor.getMemoryLeaks();
      if (memoryLeaks.length > 0) {
        this.handleMemoryLeaks(memoryLeaks);
      }

      // Log optimization status
      if (this.config.enablePerformanceLogging) {
        this.logOptimizationStatus(metrics, memoryUsageMB);
      }

    } catch (error) {
      console.error('Error during optimization check:', error);
      errorHandler.handleError(
        new PerformanceError('Optimization check failed', 'optimization', 0, 0),
        { component: 'PerformanceOptimizer', operation: 'optimization_check', error }
      );
    } finally {
      this.isOptimizing = false;
    }
  }

  /**
   * Apply critical performance optimizations for very low FPS
   */
  private applyCriticalPerformanceOptimizations(metrics: PerformanceMetrics): void {
    console.warn(`Critical FPS detected: ${metrics.fps} FPS`);

    // Drastically reduce markers
    if (this.currentState.markerReduction > 0.2) {
      this.applyAdjustment({
        type: 'marker_reduction',
        severity: 'critical',
        description: `Reduced markers to 20% due to critical FPS (${metrics.fps})`,
        impact: 'High performance improvement, reduced data visibility',
        timestamp: Date.now(),
        applied: false
      });
      this.currentState.markerReduction = 0.2;
    }

    // Disable animations
    if (this.currentState.animationsEnabled) {
      this.applyAdjustment({
        type: 'animation',
        severity: 'critical',
        description: 'Disabled all animations due to critical FPS',
        impact: 'Significant performance improvement, reduced visual feedback',
        timestamp: Date.now(),
        applied: false
      });
      this.currentState.animationsEnabled = false;
    }

    // Increase clustering aggressively
    if (this.currentState.clusterRadius < 120) {
      this.applyAdjustment({
        type: 'clustering',
        severity: 'critical',
        description: 'Increased clustering radius to 120px for critical FPS',
        impact: 'Major performance improvement, less detailed view',
        timestamp: Date.now(),
        applied: false
      });
      this.currentState.clusterRadius = 120;
    }

    // Enable data virtualization
    if (!this.currentState.dataVirtualizationEnabled) {
      this.applyAdjustment({
        type: 'virtualization',
        severity: 'critical',
        description: 'Enabled data virtualization for critical FPS',
        impact: 'Significant performance improvement, viewport-limited data',
        timestamp: Date.now(),
        applied: false
      });
      this.currentState.dataVirtualizationEnabled = true;
    }

    // Add update throttling
    if (this.currentState.updateThrottling < 500) {
      this.currentState.updateThrottling = 500; // 500ms throttling
    }

    this.notifyStateChange();
  }

  /**
   * Apply standard performance optimizations for low FPS
   */
  private applyPerformanceOptimizations(metrics: PerformanceMetrics): void {
    console.log(`Low FPS detected: ${metrics.fps} FPS, applying optimizations`);

    // Reduce markers moderately
    if (this.currentState.markerReduction > 0.6) {
      this.applyAdjustment({
        type: 'marker_reduction',
        severity: 'medium',
        description: `Reduced markers to 60% due to low FPS (${metrics.fps})`,
        impact: 'Moderate performance improvement, some data hidden',
        timestamp: Date.now(),
        applied: false
      });
      this.currentState.markerReduction = 0.6;
    }

    // Increase clustering moderately
    if (this.currentState.clusterRadius < 80) {
      this.applyAdjustment({
        type: 'clustering',
        severity: 'medium',
        description: 'Increased clustering radius to 80px for better performance',
        impact: 'Moderate performance improvement, less detailed clustering',
        timestamp: Date.now(),
        applied: false
      });
      this.currentState.clusterRadius = 80;
    }

    // Add light update throttling
    if (this.currentState.updateThrottling < 200) {
      this.currentState.updateThrottling = 200; // 200ms throttling
    }

    this.notifyStateChange();
  }

  /**
   * Apply critical memory optimizations
   */
  private applyCriticalMemoryOptimizations(memoryUsageMB: number): void {
    console.warn(`Critical memory usage detected: ${memoryUsageMB.toFixed(1)}MB`);

    // Drastically reduce cache size
    if (this.currentState.cacheSize > 20) {
      this.applyAdjustment({
        type: 'cache_optimization',
        severity: 'critical',
        description: `Reduced cache size to 20MB due to critical memory usage (${memoryUsageMB.toFixed(1)}MB)`,
        impact: 'Major memory reduction, increased loading times',
        timestamp: Date.now(),
        applied: false
      });
      this.currentState.cacheSize = 20;
    }

    // Force data virtualization
    if (!this.currentState.dataVirtualizationEnabled) {
      this.applyAdjustment({
        type: 'virtualization',
        severity: 'critical',
        description: 'Enabled data virtualization due to critical memory usage',
        impact: 'Significant memory reduction, viewport-limited data',
        timestamp: Date.now(),
        applied: false
      });
      this.currentState.dataVirtualizationEnabled = true;
    }

    // Trigger emergency memory cleanup
    this.performEmergencyMemoryCleanup();

    this.notifyStateChange();
  }

  /**
   * Apply standard memory optimizations
   */
  private applyMemoryOptimizations(memoryUsageMB: number): void {
    console.log(`High memory usage detected: ${memoryUsageMB.toFixed(1)}MB, applying optimizations`);

    // Reduce cache size moderately
    if (this.currentState.cacheSize > 50) {
      this.applyAdjustment({
        type: 'cache_optimization',
        severity: 'medium',
        description: `Reduced cache size to 50MB due to high memory usage (${memoryUsageMB.toFixed(1)}MB)`,
        impact: 'Moderate memory reduction, some performance impact',
        timestamp: Date.now(),
        applied: false
      });
      this.currentState.cacheSize = 50;
    }

    // Enable data virtualization if not already enabled
    if (!this.currentState.dataVirtualizationEnabled && memoryUsageMB > this.config.memoryWarningThreshold * 1.2) {
      this.applyAdjustment({
        type: 'virtualization',
        severity: 'medium',
        description: 'Enabled data virtualization due to high memory usage',
        impact: 'Memory reduction, viewport-limited data loading',
        timestamp: Date.now(),
        applied: false
      });
      this.currentState.dataVirtualizationEnabled = true;
    }

    this.notifyStateChange();
  }

  /**
   * Handle detected memory leaks
   */
  private handleMemoryLeaks(memoryLeaks: any[]): void {
    const criticalLeaks = memoryLeaks.filter(leak => leak.severity === 'high');
    
    if (criticalLeaks.length > 0) {
      console.error(`Critical memory leaks detected: ${criticalLeaks.length}`);
      
      this.applyAdjustment({
        type: 'memory_cleanup',
        severity: 'critical',
        description: `Triggered cleanup for ${criticalLeaks.length} critical memory leaks`,
        impact: 'Memory leak mitigation, potential temporary performance impact',
        timestamp: Date.now(),
        applied: false
      });

      // Trigger immediate cleanup
      this.performEmergencyMemoryCleanup();
    } else if (memoryLeaks.length > 5) {
      console.warn(`Multiple memory leaks detected: ${memoryLeaks.length}`);
      
      this.applyAdjustment({
        type: 'memory_cleanup',
        severity: 'medium',
        description: `Scheduled cleanup for ${memoryLeaks.length} memory leaks`,
        impact: 'Preventive memory cleanup',
        timestamp: Date.now(),
        applied: false
      });

      // Schedule cleanup
      setTimeout(() => this.performMemoryCleanup(), 1000);
    }
  }
  /**
   * Consider reversing optimizations when performance improves
   */
  private considerOptimizationReversal(metrics: PerformanceMetrics): void {
    const currentTime = Date.now();
    let reversalsMade = false;

    // Only reverse if performance has been good for a while
    const recentHistory = this.performanceHistory.slice(-10); // Last 10 samples
    const avgRecentFPS = recentHistory.reduce((sum, m) => sum + m.fps, 0) / recentHistory.length;
    
    if (avgRecentFPS < this.config.targetFPS + 5) {
      return; // Performance not consistently good enough
    }

    // Reverse marker reduction
    if (this.currentState.markerReduction < 1.0) {
      const newReduction = Math.min(1.0, this.currentState.markerReduction + 0.2);
      if (newReduction > this.currentState.markerReduction) {
        this.currentState.markerReduction = newReduction;
        console.log(`Increased marker visibility to ${(newReduction * 100).toFixed(0)}% due to improved performance`);
        reversalsMade = true;
      }
    }

    // Reverse clustering
    if (this.currentState.clusterRadius > 60) {
      const newRadius = Math.max(60, this.currentState.clusterRadius - 20);
      if (newRadius < this.currentState.clusterRadius) {
        this.currentState.clusterRadius = newRadius;
        console.log(`Reduced clustering radius to ${newRadius}px due to improved performance`);
        reversalsMade = true;
      }
    }

    // Re-enable animations
    if (!this.currentState.animationsEnabled && avgRecentFPS > this.config.targetFPS + 10) {
      this.currentState.animationsEnabled = true;
      console.log('Re-enabled animations due to improved performance');
      reversalsMade = true;
    }

    // Reduce update throttling
    if (this.currentState.updateThrottling > 0) {
      const newThrottling = Math.max(0, this.currentState.updateThrottling - 100);
      if (newThrottling < this.currentState.updateThrottling) {
        this.currentState.updateThrottling = newThrottling;
        console.log(`Reduced update throttling to ${newThrottling}ms due to improved performance`);
        reversalsMade = true;
      }
    }

    if (reversalsMade) {
      this.notifyStateChange();
    }
  }

  /**
   * Perform regular memory cleanup
   */
  private performMemoryCleanup(): void {
    try {
      // Clear old performance history
      if (this.performanceHistory.length > this.HISTORY_SIZE) {
        this.performanceHistory = this.performanceHistory.slice(-this.HISTORY_SIZE);
      }

      // Clear old adjustments (keep only last 50)
      if (this.appliedAdjustments.size > 50) {
        const entries = Array.from(this.appliedAdjustments.entries());
        const recent = entries.slice(-50);
        this.appliedAdjustments.clear();
        recent.forEach(([key, value]) => this.appliedAdjustments.set(key, value));
      }

      // Trigger garbage collection if available
      if ('gc' in window && typeof (window as any).gc === 'function') {
        try {
          (window as any).gc();
          console.log('Manual garbage collection triggered');
        } catch (error) {
          // Ignore errors - GC might not be available
        }
      }

      console.log('Regular memory cleanup completed');
    } catch (error) {
      console.error('Error during memory cleanup:', error);
    }
  }

  /**
   * Perform emergency memory cleanup
   */
  private performEmergencyMemoryCleanup(): void {
    console.warn('Performing emergency memory cleanup');
    
    try {
      // Clear all performance history except recent
      this.performanceHistory = this.performanceHistory.slice(-10);
      
      // Clear most adjustments except critical ones
      const criticalAdjustments = Array.from(this.appliedAdjustments.entries())
        .filter(([_, adj]) => adj.severity === 'critical')
        .slice(-10);
      
      this.appliedAdjustments.clear();
      criticalAdjustments.forEach(([key, value]) => this.appliedAdjustments.set(key, value));

      // Force aggressive cache reduction
      this.currentState.cacheSize = Math.min(this.currentState.cacheSize, 10);

      // Notify performance monitor to clear its caches
      performanceMonitor.clearMetrics();

      console.log('Emergency memory cleanup completed');
    } catch (error) {
      console.error('Error during emergency memory cleanup:', error);
    }
  }

  /**
   * Update performance history for trend analysis
   */
  private updatePerformanceHistory(metrics: PerformanceMetrics): void {
    this.performanceHistory.push({
      ...metrics,
      // Add timestamp for trend analysis
      timestamp: Date.now()
    } as any);

    // Keep only recent history
    if (this.performanceHistory.length > this.HISTORY_SIZE) {
      this.performanceHistory = this.performanceHistory.slice(-this.HISTORY_SIZE);
    }
  }

  /**
   * Analyze performance trends to predict issues
   */
  private analyzePerformanceTrends(): void {
    if (this.performanceHistory.length < 10) return;

    const recent = this.performanceHistory.slice(-10);
    const older = this.performanceHistory.slice(-20, -10);

    if (older.length === 0) return;

    const recentAvgFPS = recent.reduce((sum, m) => sum + m.fps, 0) / recent.length;
    const olderAvgFPS = older.reduce((sum, m) => sum + m.fps, 0) / older.length;

    const fpsTrend = recentAvgFPS - olderAvgFPS;

    // Predict performance degradation
    if (fpsTrend < -5 && recentAvgFPS > this.config.targetFPS) {
      console.warn(`Performance degradation trend detected: FPS dropping by ${Math.abs(fpsTrend).toFixed(1)} on average`);
      
      // Preemptively apply light optimizations
      if (this.currentState.updateThrottling === 0) {
        this.currentState.updateThrottling = 100;
        console.log('Applied preemptive update throttling due to performance trend');
        this.notifyStateChange();
      }
    }

    // Detect memory growth trends
    const recentMemory = recent.map(m => m.memoryUsage || 0).filter(m => m > 0);
    const olderMemory = older.map(m => m.memoryUsage || 0).filter(m => m > 0);

    if (recentMemory.length > 0 && olderMemory.length > 0) {
      const recentAvgMemory = recentMemory.reduce((sum, m) => sum + m, 0) / recentMemory.length;
      const olderAvgMemory = olderMemory.reduce((sum, m) => sum + m, 0) / olderMemory.length;
      const memoryTrend = recentAvgMemory - olderAvgMemory;

      if (memoryTrend > 10 * 1024 * 1024) { // 10MB increase
        console.warn(`Memory growth trend detected: ${(memoryTrend / 1024 / 1024).toFixed(1)}MB increase`);
        
        // Schedule preemptive cleanup
        setTimeout(() => this.performMemoryCleanup(), 5000);
      }
    }
  }

  /**
   * Apply an optimization adjustment
   */
  private applyAdjustment(adjustment: PerformanceAdjustment): void {
    const key = `${adjustment.type}_${adjustment.timestamp}`;
    adjustment.applied = true;
    this.appliedAdjustments.set(key, adjustment);

    // Notify callbacks
    this.optimizationCallbacks.forEach(callback => {
      try {
        callback(adjustment);
      } catch (error) {
        console.error('Error in optimization callback:', error);
      }
    });

    console.log(`Applied optimization: ${adjustment.description}`);
  }

  /**
   * Notify state change callbacks
   */
  private notifyStateChange(): void {
    this.stateChangeCallbacks.forEach(callback => {
      try {
        callback({ ...this.currentState });
      } catch (error) {
        console.error('Error in state change callback:', error);
      }
    });
  }

  /**
   * Log optimization status
   */
  private logOptimizationStatus(metrics: PerformanceMetrics, memoryUsageMB: number): void {
    const activeOptimizations = Array.from(this.appliedAdjustments.values())
      .filter(adj => adj.applied)
      .length;

    if (activeOptimizations > 0 || metrics.fps < this.config.targetFPS || memoryUsageMB > this.config.memoryWarningThreshold) {
      console.log(`Performance Status: FPS=${metrics.fps}, Memory=${memoryUsageMB.toFixed(1)}MB, Optimizations=${activeOptimizations}`);
      console.log(`Current State:`, {
        markerReduction: `${(this.currentState.markerReduction * 100).toFixed(0)}%`,
        clusterRadius: `${this.currentState.clusterRadius}px`,
        animations: this.currentState.animationsEnabled ? 'enabled' : 'disabled',
        virtualization: this.currentState.dataVirtualizationEnabled ? 'enabled' : 'disabled',
        throttling: `${this.currentState.updateThrottling}ms`
      });
    }
  }
  // Public API methods

  /**
   * Get current optimization state
   */
  getOptimizationState(): OptimizationState {
    return { ...this.currentState };
  }

  /**
   * Get applied adjustments
   */
  getAppliedAdjustments(): PerformanceAdjustment[] {
    return Array.from(this.appliedAdjustments.values());
  }

  /**
   * Subscribe to optimization events
   */
  onOptimization(callback: (adjustment: PerformanceAdjustment) => void): () => void {
    this.optimizationCallbacks.add(callback);
    return () => this.optimizationCallbacks.delete(callback);
  }

  /**
   * Subscribe to state changes
   */
  onStateChange(callback: (state: OptimizationState) => void): () => void {
    this.stateChangeCallbacks.add(callback);
    return () => this.stateChangeCallbacks.delete(callback);
  }

  /**
   * Manually trigger optimization check
   */
  triggerOptimizationCheck(): void {
    this.performOptimizationCheck();
  }

  /**
   * Reset all optimizations
   */
  resetOptimizations(): void {
    this.currentState = {
      markerReduction: 1.0,
      clusterRadius: 60,
      animationsEnabled: true,
      heatMapEnabled: true,
      dataVirtualizationEnabled: false,
      cacheSize: 100,
      updateThrottling: 0
    };

    this.appliedAdjustments.clear();
    this.notifyStateChange();
    console.log('All performance optimizations reset');
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<PerformanceOptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Performance optimizer configuration updated:', newConfig);
  }

  /**
   * Stop the optimizer and cleanup
   */
  stop(): void {
    if (this.optimizationInterval) {
      clearInterval(this.optimizationInterval);
      performanceMonitor.untrackInterval(this.optimizationInterval);
      this.optimizationInterval = null;
    }

    if (this.memoryCleanupInterval) {
      clearInterval(this.memoryCleanupInterval);
      performanceMonitor.untrackInterval(this.memoryCleanupInterval);
      this.memoryCleanupInterval = null;
    }

    this.optimizationCallbacks.clear();
    this.stateChangeCallbacks.clear();
    console.log('Performance optimizer stopped');
  }
}

// Export singleton instance
export const performanceOptimizer = new PerformanceOptimizer();

// React hook for using performance optimization
export function usePerformanceOptimization() {
  const [optimizationState, setOptimizationState] = React.useState<OptimizationState>(
    performanceOptimizer.getOptimizationState()
  );
  const [adjustments, setAdjustments] = React.useState<PerformanceAdjustment[]>([]);

  React.useEffect(() => {
    const unsubscribeState = performanceOptimizer.onStateChange(setOptimizationState);
    const unsubscribeOptimizations = performanceOptimizer.onOptimization((adjustment) => {
      setAdjustments(prev => [...prev.slice(-19), adjustment]); // Keep last 20
    });

    // Get initial state
    setOptimizationState(performanceOptimizer.getOptimizationState());
    setAdjustments(performanceOptimizer.getAppliedAdjustments().slice(-20));

    return () => {
      unsubscribeState();
      unsubscribeOptimizations();
    };
  }, []);

  return {
    optimizationState,
    adjustments,
    triggerOptimizationCheck: () => performanceOptimizer.triggerOptimizationCheck(),
    resetOptimizations: () => performanceOptimizer.resetOptimizations(),
    updateConfig: (config: Partial<PerformanceOptimizationConfig>) => 
      performanceOptimizer.updateConfig(config)
  };
}