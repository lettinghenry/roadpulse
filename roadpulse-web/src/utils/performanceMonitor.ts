// Performance monitoring and optimization utilities

import React from 'react';
import { errorHandler, PerformanceError } from './errorHandler';

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  loadTime: number;
  memoryUsage?: number;
  operationTimes: Map<string, number>;
  memoryLeaks?: MemoryLeakInfo[];
  optimizationsApplied: string[];
  // Enhanced metrics for task 16.3
  cpuUsage?: number;
  networkLatency?: number;
  renderTime?: number;
  domNodeCount?: number;
  eventListenerCount?: number;
  cacheHitRatio?: number;
  gcPressure?: number;
  batteryLevel?: number;
  connectionType?: string;
}

export interface LoadingState {
  isLoading: boolean;
  operation: string;
  startTime: number;
  showIndicator: boolean;
}

export interface MemoryLeakInfo {
  component: string;
  leakType: 'event_listener' | 'timer' | 'reference' | 'cache';
  severity: 'low' | 'medium' | 'high';
  description: string;
  timestamp: number;
}

export interface PerformanceOptimization {
  name: string;
  applied: boolean;
  reason: string;
  impact: 'low' | 'medium' | 'high';
  timestamp: number;
}

/**
 * Enhanced performance monitor with automatic optimizations and memory leak detection
 * Implements requirements 5.1, 5.3, 5.4 for performance optimization
 */
export class PerformanceMonitor {
  private frameCount = 0;
  private lastFrameTime = 0;
  private fps = 0;
  private frameTime = 0;
  private loadingOperations = new Map<string, LoadingState>();
  private operationTimes = new Map<string, number>();
  private loadingCallbacks = new Set<(operations: LoadingState[]) => void>();
  private performanceCallbacks = new Set<(metrics: PerformanceMetrics) => void>();
  private animationFrameId: number | null = null;
  private isMonitoring = false;
  
  // Memory leak detection
  private memoryLeaks: MemoryLeakInfo[] = [];
  private memoryBaseline: number = 0;
  private memoryCheckInterval: number | null = null;
  private lastMemoryCheck = 0;
  private domNodeBaseline: number = 0;
  
  // Performance optimizations
  private appliedOptimizations = new Map<string, PerformanceOptimization>();
  private optimizationCallbacks = new Set<(optimization: PerformanceOptimization) => void>();
  
  // Automatic cleanup tracking
  private activeTimers = new Set<number>();
  private activeIntervals = new Set<number>();
  private activeEventListeners = new Map<EventTarget, Map<string, EventListener>>();

  // Performance thresholds
  private readonly MIN_FPS = 30;
  private readonly CRITICAL_FPS = 20;
  private readonly LOADING_INDICATOR_THRESHOLD = 500; // ms
  private readonly TARGET_INITIAL_LOAD_TIME = 3000; // ms
  private readonly MEMORY_LEAK_THRESHOLD = 50 * 1024 * 1024; // 50MB
  private readonly MEMORY_CHECK_INTERVAL = 30000; // 30 seconds

  constructor() {
    this.startMonitoring();
    this.setupMemoryLeakDetection();
    this.setupAutomaticOptimizations();
  }

  /**
   * Start performance monitoring with enhanced capabilities
   */
  startMonitoring(): void {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    this.lastFrameTime = performance.now();
    this.memoryBaseline = this.getMemoryUsage() || 0;
    this.measureFrameRate();
  }

  /**
   * Stop performance monitoring and cleanup
   */
  stopMonitoring(): void {
    this.isMonitoring = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
      this.memoryCheckInterval = null;
    }
    this.cleanup();
  }

  /**
   * Start tracking a loading operation
   * Shows loading indicator if operation takes longer than threshold
   */
  startOperation(operationId: string, operationName: string): void {
    const startTime = performance.now();
    const loadingState: LoadingState = {
      isLoading: true,
      operation: operationName,
      startTime,
      showIndicator: false
    };

    this.loadingOperations.set(operationId, loadingState);

    // Set timeout to show loading indicator if operation takes too long
    setTimeout(() => {
      const state = this.loadingOperations.get(operationId);
      if (state && state.isLoading) {
        state.showIndicator = true;
        this.notifyLoadingCallbacks();
      }
    }, this.LOADING_INDICATOR_THRESHOLD);

    this.notifyLoadingCallbacks();
  }

  /**
   * End tracking a loading operation
   */
  endOperation(operationId: string): void {
    const state = this.loadingOperations.get(operationId);
    if (!state) return;

    const endTime = performance.now();
    const duration = endTime - state.startTime;
    
    // Record operation time
    this.operationTimes.set(state.operation, duration);
    
    // Remove from active operations
    this.loadingOperations.delete(operationId);
    
    this.notifyLoadingCallbacks();
    this.notifyPerformanceCallbacks();

    // Log slow operations
    if (duration > this.LOADING_INDICATOR_THRESHOLD) {
      console.warn(`Slow operation detected: ${state.operation} took ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * Get current loading operations that should show indicators
   */
  getActiveLoadingOperations(): LoadingState[] {
    return Array.from(this.loadingOperations.values()).filter(state => state.showIndicator);
  }

  /**
   * Get all current loading operations
   */
  getAllLoadingOperations(): LoadingState[] {
    return Array.from(this.loadingOperations.values());
  }

  /**
   * Get current performance metrics with enhanced information
   */
  getMetrics(): PerformanceMetrics {
    return {
      fps: this.fps,
      frameTime: this.frameTime,
      loadTime: this.getAverageOperationTime('initial_load') || 0,
      memoryUsage: this.getMemoryUsage(),
      operationTimes: new Map(this.operationTimes),
      memoryLeaks: [...this.memoryLeaks],
      optimizationsApplied: Array.from(this.appliedOptimizations.keys()),
      // Enhanced metrics for task 16.3
      cpuUsage: this.getCPUUsage(),
      networkLatency: this.getNetworkLatency(),
      renderTime: this.getRenderTime(),
      domNodeCount: this.getDOMNodeCount(),
      eventListenerCount: this.getTotalEventListeners(),
      cacheHitRatio: this.getCacheHitRatio(),
      gcPressure: this.getGCPressure(),
      batteryLevel: this.getBatteryLevel(),
      connectionType: this.getConnectionType()
    };
  }

  /**
   * Check if performance is below acceptable thresholds
   */
  isPerformanceDegraded(): boolean {
    return this.fps < this.MIN_FPS;
  }

  /**
   * Get average time for a specific operation type
   */
  getAverageOperationTime(operationType: string): number | undefined {
    return this.operationTimes.get(operationType);
  }

  /**
   * Subscribe to loading state changes
   */
  onLoadingChange(callback: (operations: LoadingState[]) => void): () => void {
    this.loadingCallbacks.add(callback);
    return () => this.loadingCallbacks.delete(callback);
  }

  /**
   * Subscribe to performance metrics updates
   */
  onPerformanceChange(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.performanceCallbacks.add(callback);
    return () => this.performanceCallbacks.delete(callback);
  }

  /**
   * Measure initial load performance
   */
  measureInitialLoad(): Promise<number> {
    return new Promise((resolve) => {
      const startTime = performance.now();
      
      // Wait for DOM to be ready and initial render to complete
      const checkReady = () => {
        if (document.readyState === 'complete') {
          // Additional delay to ensure map and components are rendered
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              const loadTime = performance.now() - startTime;
              this.operationTimes.set('initial_load', loadTime);
              
              if (loadTime > this.TARGET_INITIAL_LOAD_TIME) {
                console.warn(`Initial load time exceeded target: ${loadTime.toFixed(2)}ms > ${this.TARGET_INITIAL_LOAD_TIME}ms`);
                // Notify performance callbacks about slow initial load
                this.notifyPerformanceCallbacks();
              } else {
                console.log(`Initial load completed in ${loadTime.toFixed(2)}ms (target: ${this.TARGET_INITIAL_LOAD_TIME}ms)`);
              }
              
              resolve(loadTime);
            });
          });
        } else {
          setTimeout(checkReady, 10);
        }
      };
      
      checkReady();
    });
  }

  /**
   * Clear all recorded metrics
   */
  clearMetrics(): void {
    this.operationTimes.clear();
    this.loadingOperations.clear();
    this.frameCount = 0;
    this.fps = 0;
    this.frameTime = 0;
  }

  /**
   * Optimize performance by reducing quality when FPS drops
   */
  optimizeForPerformance(): {
    shouldReduceMarkers: boolean;
    shouldDisableAnimations: boolean;
    shouldReduceClusterRadius: boolean;
  } {
    const isLowPerformance = this.fps < this.MIN_FPS;
    const isCriticalPerformance = this.fps < 20;
    
    return {
      shouldReduceMarkers: isLowPerformance,
      shouldDisableAnimations: isCriticalPerformance,
      shouldReduceClusterRadius: isLowPerformance
    };
  }

  /**
   * Get performance recommendations based on current metrics
   */
  getPerformanceRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.fps < this.MIN_FPS) {
      recommendations.push('Consider reducing the number of visible markers');
      recommendations.push('Increase clustering radius to group more markers');
    }
    
    if (this.fps < this.CRITICAL_FPS) {
      recommendations.push('Disable animations temporarily');
      recommendations.push('Switch to heat map view for better performance');
    }
    
    const memoryUsage = this.getMemoryUsage();
    if (memoryUsage && memoryUsage > 100 * 1024 * 1024) { // 100MB
      recommendations.push('Clear cache to free up memory');
      recommendations.push('Reduce viewport data loading');
    }
    
    const avgLoadTime = this.getAverageOperationTime('data_loading');
    if (avgLoadTime && avgLoadTime > 1000) {
      recommendations.push('Enable data virtualization');
      recommendations.push('Reduce data loading frequency');
    }
    
    if (this.memoryLeaks.length > 0) {
      recommendations.push(`Fix ${this.memoryLeaks.length} detected memory leaks`);
    }
    
    return recommendations;
  }

  /**
   * Setup memory leak detection
   */
  private setupMemoryLeakDetection(): void {
    this.memoryCheckInterval = window.setInterval(() => {
      this.checkForMemoryLeaks();
    }, this.MEMORY_CHECK_INTERVAL);
  }

  /**
   * Setup automatic performance optimizations with enhanced monitoring
   */
  private setupAutomaticOptimizations(): void {
    // Monitor FPS and apply optimizations automatically
    this.onPerformanceChange((metrics) => {
      // Critical FPS optimizations
      if (metrics.fps < this.CRITICAL_FPS) {
        this.applyOptimization('disable_animations', 'Critical FPS detected', 'high');
        this.applyOptimization('reduce_markers', 'Critical FPS detected', 'high');
        this.applyOptimization('switch_to_heatmap', 'Critical FPS detected', 'high');
        this.applyOptimization('reduce_cluster_precision', 'Critical FPS detected', 'medium');
      } else if (metrics.fps < this.MIN_FPS) {
        this.applyOptimization('reduce_markers', 'Low FPS detected', 'medium');
        this.applyOptimization('increase_clustering', 'Low FPS detected', 'medium');
        this.applyOptimization('throttle_updates', 'Low FPS detected', 'low');
      }

      // Memory-based optimizations with enhanced thresholds
      if (metrics.memoryUsage) {
        const memoryMB = metrics.memoryUsage / (1024 * 1024);
        
        if (memoryMB > 200) { // 200MB - Critical
          this.applyOptimization('emergency_cleanup', 'Critical memory usage detected', 'high');
          this.applyOptimization('clear_all_caches', 'Critical memory usage detected', 'high');
          this.applyOptimization('reduce_viewport_data', 'Critical memory usage detected', 'high');
        } else if (memoryMB > 150) { // 150MB - High
          this.applyOptimization('clear_cache', 'High memory usage detected', 'high');
          this.applyOptimization('enable_virtualization', 'High memory usage detected', 'medium');
          this.applyOptimization('compress_data', 'High memory usage detected', 'medium');
        } else if (memoryMB > 100) { // 100MB - Medium
          this.applyOptimization('optimize_clustering', 'Elevated memory usage detected', 'low');
          this.applyOptimization('cleanup_old_data', 'Elevated memory usage detected', 'low');
        }
      }

      // Enhanced CPU-based optimizations
      if (metrics.cpuUsage && metrics.cpuUsage > 90) {
        this.applyOptimization('reduce_cpu_intensive_operations', 'High CPU usage detected', 'high');
        this.applyOptimization('defer_non_critical_tasks', 'High CPU usage detected', 'medium');
      } else if (metrics.cpuUsage && metrics.cpuUsage > 70) {
        this.applyOptimization('throttle_animations', 'Elevated CPU usage detected', 'low');
      }

      // Network-based optimizations
      if (metrics.networkLatency && metrics.networkLatency > 2000) { // 2 seconds
        this.applyOptimization('enable_aggressive_caching', 'High network latency detected', 'medium');
        this.applyOptimization('reduce_network_requests', 'High network latency detected', 'low');
      }

      // Battery-based optimizations (for mobile devices)
      if (metrics.batteryLevel && metrics.batteryLevel < 20) {
        this.applyOptimization('enable_power_saving_mode', 'Low battery detected', 'medium');
        this.applyOptimization('reduce_background_tasks', 'Low battery detected', 'low');
      }

      // Connection-based optimizations
      if (metrics.connectionType === 'slow-2g' || metrics.connectionType === '2g') {
        this.applyOptimization('enable_low_bandwidth_mode', 'Slow connection detected', 'high');
        this.applyOptimization('compress_all_data', 'Slow connection detected', 'medium');
      }

      // GC pressure optimizations
      if (metrics.gcPressure && metrics.gcPressure > 75) {
        this.applyOptimization('reduce_object_allocation', 'High GC pressure detected', 'medium');
        this.applyOptimization('cleanup_unused_references', 'High GC pressure detected', 'low');
      }

      // Frame time optimizations
      if (metrics.frameTime > 50) { // 50ms = 20 FPS
        this.applyOptimization('reduce_render_frequency', 'High frame time detected', 'medium');
        this.applyOptimization('simplify_markers', 'High frame time detected', 'low');
      }

      // Load time optimizations
      const avgLoadTime = this.getAverageOperationTime('data_loading');
      if (avgLoadTime && avgLoadTime > 2000) { // 2 seconds
        this.applyOptimization('enable_progressive_loading', 'Slow data loading detected', 'medium');
        this.applyOptimization('reduce_initial_dataset', 'Slow data loading detected', 'low');
      }

      // DOM node count optimizations
      if (metrics.domNodeCount && metrics.domNodeCount > 5000) {
        this.applyOptimization('optimize_dom_structure', 'High DOM node count detected', 'medium');
        this.applyOptimization('enable_virtual_scrolling', 'High DOM node count detected', 'low');
      }

      // Event listener optimizations
      if (metrics.eventListenerCount && metrics.eventListenerCount > 200) {
        this.applyOptimization('optimize_event_listeners', 'High event listener count detected', 'low');
      }

      // Automatic recovery when performance improves
      if (metrics.fps >= this.MIN_FPS + 5 && metrics.frameTime < 25) { // Good performance
        this.considerOptimizationReversal();
      }
    });

    // Set up periodic optimization review with enhanced frequency
    this.trackInterval(window.setInterval(() => {
      this.reviewAndAdjustOptimizations();
    }, 5000)); // Review every 5 seconds (more frequent)

    // Set up adaptive optimization based on device capabilities
    this.trackInterval(window.setInterval(() => {
      this.adaptOptimizationsToDevice();
    }, 30000)); // Adapt every 30 seconds
  }

  /**
   * Check for memory leaks with enhanced detection
   */
  private checkForMemoryLeaks(): void {
    const currentMemory = this.getMemoryUsage();
    if (!currentMemory) return;

    const memoryIncrease = currentMemory - this.memoryBaseline;
    
    // Check for significant memory increase with graduated thresholds
    if (memoryIncrease > this.MEMORY_LEAK_THRESHOLD) {
      const severity = this.determineMemoryLeakSeverity(memoryIncrease);
      
      const leak: MemoryLeakInfo = {
        component: 'Memory Monitor',
        leakType: 'reference',
        severity,
        description: `Memory increased by ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB from baseline`,
        timestamp: Date.now()
      };
      
      this.memoryLeaks.push(leak);
      
      // Report to error handler with enhanced context
      errorHandler.handleError(
        new PerformanceError(
          'Memory leak detected',
          'memory',
          currentMemory,
          this.memoryBaseline + this.MEMORY_LEAK_THRESHOLD
        ),
        {
          component: 'PerformanceMonitor',
          operation: 'memory_leak_detection',
          additionalData: { 
            memoryIncrease, 
            currentMemory, 
            baseline: this.memoryBaseline,
            severity,
            activeTimers: this.activeTimers.size,
            activeIntervals: this.activeIntervals.size,
            activeListeners: this.getTotalEventListeners()
          }
        }
      );
      
      console.warn('Memory leak detected:', leak);
      
      // Trigger automatic cleanup for high severity leaks
      if (severity === 'high') {
        this.triggerEmergencyCleanup();
      }
    }

    // Enhanced leak detection checks
    this.checkTimerLeaks();
    this.checkEventListenerLeaks();
    this.checkDOMNodeLeaks();
    this.checkCacheLeaks();
    this.checkClosureLeaks();
    this.checkWebWorkerLeaks();
    this.checkImageLeaks();
    this.checkPromiseLeaks();
    
    // Update baseline periodically with adaptive adjustment
    const timeSinceLastCheck = Date.now() - this.lastMemoryCheck;
    if (timeSinceLastCheck > 300000) { // 5 minutes
      // Only update baseline if memory is stable (not increasing rapidly)
      if (memoryIncrease < this.MEMORY_LEAK_THRESHOLD / 2) {
        this.memoryBaseline = currentMemory;
      }
      this.lastMemoryCheck = Date.now();
    }
  }

  /**
   * Check for timer leaks
   */
  private checkTimerLeaks(): void {
    if (this.activeTimers.size > 50) {
      const leak: MemoryLeakInfo = {
        component: 'Timers',
        leakType: 'timer',
        severity: this.activeTimers.size > 100 ? 'high' : 'medium',
        description: `${this.activeTimers.size} active timers detected`,
        timestamp: Date.now()
      };
      
      this.memoryLeaks.push(leak);
      console.warn('Timer leak detected:', leak);
    }
  }

  /**
   * Check for event listener leaks
   */
  private checkEventListenerLeaks(): void {
    let totalListeners = 0;
    for (const listeners of this.activeEventListeners.values()) {
      totalListeners += listeners.size;
    }
    
    if (totalListeners > 100) {
      const leak: MemoryLeakInfo = {
        component: 'EventListeners',
        leakType: 'event_listener',
        severity: totalListeners > 200 ? 'high' : 'medium',
        description: `${totalListeners} active event listeners detected`,
        timestamp: Date.now()
      };
      
      this.memoryLeaks.push(leak);
      console.warn('Event listener leak detected:', leak);
    }
  }

  /**
   * Apply a performance optimization
   */
  private applyOptimization(name: string, reason: string, impact: 'low' | 'medium' | 'high'): void {
    if (this.appliedOptimizations.has(name)) return;
    
    const optimization: PerformanceOptimization = {
      name,
      applied: true,
      reason,
      impact,
      timestamp: Date.now()
    };
    
    this.appliedOptimizations.set(name, optimization);
    
    // Notify callbacks
    this.optimizationCallbacks.forEach(callback => {
      try {
        callback(optimization);
      } catch (error) {
        console.error('Error in optimization callback:', error);
      }
    });
    
    console.log(`Applied performance optimization: ${name} (${reason})`);
  }

  /**
   * Subscribe to optimization events
   */
  onOptimization(callback: (optimization: PerformanceOptimization) => void): () => void {
    this.optimizationCallbacks.add(callback);
    return () => this.optimizationCallbacks.delete(callback);
  }

  /**
   * Get memory leak information
   */
  getMemoryLeaks(): MemoryLeakInfo[] {
    return [...this.memoryLeaks];
  }

  /**
   * Clear memory leak history
   */
  clearMemoryLeaks(): void {
    this.memoryLeaks = [];
  }

  /**
   * Get applied optimizations
   */
  getAppliedOptimizations(): PerformanceOptimization[] {
    return Array.from(this.appliedOptimizations.values());
  }

  /**
   * Reset optimizations
   */
  resetOptimizations(): void {
    this.appliedOptimizations.clear();
  }

  /**
   * Determine memory leak severity based on increase amount
   */
  private determineMemoryLeakSeverity(memoryIncrease: number): 'low' | 'medium' | 'high' {
    if (memoryIncrease > this.MEMORY_LEAK_THRESHOLD * 3) {
      return 'high';
    } else if (memoryIncrease > this.MEMORY_LEAK_THRESHOLD * 1.5) {
      return 'medium';
    }
    return 'low';
  }

  /**
   * Get total number of tracked event listeners
   */
  private getTotalEventListeners(): number {
    let total = 0;
    for (const listeners of this.activeEventListeners.values()) {
      total += listeners.size;
    }
    return total;
  }

  /**
   * Check for DOM node leaks
   */
  private checkDOMNodeLeaks(): void {
    const nodeCount = document.querySelectorAll('*').length;
    
    // Store baseline on first check
    if (!this.domNodeBaseline) {
      this.domNodeBaseline = nodeCount;
      return;
    }
    
    const nodeIncrease = nodeCount - this.domNodeBaseline;
    
    if (nodeIncrease > 1000) { // Significant DOM growth
      const leak: MemoryLeakInfo = {
        component: 'DOM',
        leakType: 'reference',
        severity: nodeIncrease > 2000 ? 'high' : 'medium',
        description: `DOM nodes increased by ${nodeIncrease} (current: ${nodeCount})`,
        timestamp: Date.now()
      };
      
      this.memoryLeaks.push(leak);
      console.warn('DOM node leak detected:', leak);
    }
  }

  /**
   * Check for cache-related memory leaks
   */
  private checkCacheLeaks(): void {
    // This would integrate with actual cache implementations
    // For now, we'll check for excessive operation time storage
    if (this.operationTimes.size > 1000) {
      const leak: MemoryLeakInfo = {
        component: 'Cache',
        leakType: 'cache',
        severity: this.operationTimes.size > 5000 ? 'high' : 'medium',
        description: `Operation times cache has ${this.operationTimes.size} entries`,
        timestamp: Date.now()
      };
      
      this.memoryLeaks.push(leak);
      console.warn('Cache leak detected:', leak);
      
      // Auto-cleanup old entries
      if (this.operationTimes.size > 2000) {
        this.cleanupOldOperationTimes();
      }
    }
  }

  /**
   * Check for closure-related memory leaks
   */
  private checkClosureLeaks(): void {
    // Check for excessive callback registrations
    const totalCallbacks = this.loadingCallbacks.size + 
                          this.performanceCallbacks.size + 
                          this.optimizationCallbacks.size;
    
    if (totalCallbacks > 50) {
      const leak: MemoryLeakInfo = {
        component: 'Callbacks',
        leakType: 'reference',
        severity: totalCallbacks > 100 ? 'high' : 'medium',
        description: `${totalCallbacks} callback references detected`,
        timestamp: Date.now()
      };
      
      this.memoryLeaks.push(leak);
      console.warn('Closure leak detected:', leak);
    }
  }

  /**
   * Check for Web Worker memory leaks
   */
  private checkWebWorkerLeaks(): void {
    // This would check for orphaned web workers
    // For now, we'll simulate checking for worker-related operations
    const workerOperations = Array.from(this.operationTimes.keys())
      .filter(key => key.includes('worker') || key.includes('thread'));
    
    if (workerOperations.length > 20) {
      const leak: MemoryLeakInfo = {
        component: 'WebWorkers',
        leakType: 'reference',
        severity: workerOperations.length > 50 ? 'high' : 'medium',
        description: `${workerOperations.length} worker operations tracked`,
        timestamp: Date.now()
      };
      
      this.memoryLeaks.push(leak);
      console.warn('Web Worker leak detected:', leak);
    }
  }

  /**
   * Check for image/media memory leaks
   */
  private checkImageLeaks(): void {
    // Check for excessive image elements in DOM
    const images = document.querySelectorAll('img, video, canvas');
    
    if (images.length > 100) {
      const leak: MemoryLeakInfo = {
        component: 'Media',
        leakType: 'reference',
        severity: images.length > 200 ? 'high' : 'medium',
        description: `${images.length} media elements in DOM`,
        timestamp: Date.now()
      };
      
      this.memoryLeaks.push(leak);
      console.warn('Image/Media leak detected:', leak);
    }
  }

  /**
   * Check for Promise-related memory leaks
   */
  private checkPromiseLeaks(): void {
    // Check for excessive pending operations that might indicate unresolved promises
    const pendingOperations = this.loadingOperations.size;
    
    if (pendingOperations > 20) {
      const leak: MemoryLeakInfo = {
        component: 'Promises',
        leakType: 'reference',
        severity: pendingOperations > 50 ? 'high' : 'medium',
        description: `${pendingOperations} pending operations (possible unresolved promises)`,
        timestamp: Date.now()
      };
      
      this.memoryLeaks.push(leak);
      console.warn('Promise leak detected:', leak);
    }
  }

  /**
   * Trigger emergency cleanup for critical memory situations
   */
  private triggerEmergencyCleanup(): void {
    console.warn('Triggering emergency cleanup due to critical memory usage');
    
    // Clear operation times cache
    this.operationTimes.clear();
    
    // Clear old memory leaks (keep only recent ones)
    const recentThreshold = Date.now() - 300000; // 5 minutes
    this.memoryLeaks = this.memoryLeaks.filter(leak => leak.timestamp > recentThreshold);
    
    // Clear excessive loading operations
    if (this.loadingOperations.size > 10) {
      const operations = Array.from(this.loadingOperations.entries());
      this.loadingOperations.clear();
      // Keep only the 5 most recent operations
      operations.slice(-5).forEach(([key, value]) => {
        this.loadingOperations.set(key, value);
      });
    }
    
    // Clear excessive callbacks if any
    if (this.loadingCallbacks.size > 20) {
      console.warn('Clearing excessive loading callbacks');
      this.loadingCallbacks.clear();
    }
    
    if (this.performanceCallbacks.size > 20) {
      console.warn('Clearing excessive performance callbacks');
      this.performanceCallbacks.clear();
    }
    
    if (this.optimizationCallbacks.size > 20) {
      console.warn('Clearing excessive optimization callbacks');
      this.optimizationCallbacks.clear();
    }
    
    // Clear DOM-related caches
    this.clearDOMCaches();
    
    // Clear browser caches if possible
    this.clearBrowserCaches();
    
    // Force garbage collection if available
    if ('gc' in window && typeof (window as any).gc === 'function') {
      try {
        (window as any).gc();
        console.log('Forced garbage collection completed');
      } catch (error) {
        console.warn('Failed to force garbage collection:', error);
      }
    }
    
    // Apply emergency optimization
    this.applyOptimization('emergency_mode', 'Critical memory situation', 'high');
    
    // Schedule follow-up cleanup
    this.trackTimer(window.setTimeout(() => {
      this.performFollowUpCleanup();
    }, 10000)); // Follow up in 10 seconds
  }

  /**
   * Clear DOM-related caches and references
   */
  private clearDOMCaches(): void {
    // Remove unused images and media elements
    const unusedImages = document.querySelectorAll('img[data-unused="true"], video[data-unused="true"]');
    unusedImages.forEach(element => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });
    
    // Clear any cached DOM queries
    // This would integrate with actual DOM caching implementations
    console.log('DOM caches cleared');
  }

  /**
   * Clear browser caches if possible
   */
  private clearBrowserCaches(): void {
    // Clear session storage of non-critical data
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && (key.includes('cache') || key.includes('temp'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key));
      console.log(`Cleared ${keysToRemove.length} session storage items`);
    } catch (error) {
      console.warn('Failed to clear session storage:', error);
    }
    
    // Clear any application-specific caches
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          if (cacheName.includes('temp') || cacheName.includes('old')) {
            caches.delete(cacheName);
          }
        });
      }).catch(error => {
        console.warn('Failed to clear application caches:', error);
      });
    }
  }

  /**
   * Perform follow-up cleanup after emergency cleanup
   */
  private performFollowUpCleanup(): void {
    const currentMemory = this.getMemoryUsage();
    const memoryAfterCleanup = currentMemory ? currentMemory / (1024 * 1024) : 0;
    
    console.log(`Follow-up cleanup check: Memory usage is now ${memoryAfterCleanup.toFixed(1)}MB`);
    
    // If memory is still high, apply more aggressive measures
    if (memoryAfterCleanup > 150) {
      console.warn('Memory still high after emergency cleanup, applying aggressive measures');
      
      // Clear all non-essential optimizations
      const nonEssentialOptimizations = Array.from(this.appliedOptimizations.keys())
        .filter(name => !name.includes('emergency') && !name.includes('critical'));
      
      nonEssentialOptimizations.forEach(name => {
        this.appliedOptimizations.delete(name);
      });
      
      // Request page reload as last resort
      if (memoryAfterCleanup > 200) {
        console.error('Critical memory situation persists, recommending page reload');
        this.applyOptimization('recommend_page_reload', 'Critical memory situation persists', 'high');
      }
    } else {
      console.log('Emergency cleanup successful, memory usage normalized');
    }
  }

  /**
   * Clean up old operation times to prevent memory bloat
   */
  private cleanupOldOperationTimes(): void {
    // Keep only the most recent 500 operation times
    const entries = Array.from(this.operationTimes.entries());
    this.operationTimes.clear();
    
    // Keep the most recent entries (assuming they're added chronologically)
    entries.slice(-500).forEach(([key, value]) => {
      this.operationTimes.set(key, value);
    });
    
    console.log(`Cleaned up operation times cache, kept ${this.operationTimes.size} recent entries`);
  }

  /**
   * Consider reversing optimizations when performance improves
   */
  private considerOptimizationReversal(): void {
    const currentTime = Date.now();
    const optimizationsToReverse: string[] = [];
    
    // Check if we can reverse some optimizations
    for (const [name, optimization] of this.appliedOptimizations) {
      const timeSinceApplied = currentTime - optimization.timestamp;
      
      // Only consider reversing optimizations that have been active for at least 30 seconds
      if (timeSinceApplied > 30000) {
        // Reverse low-impact optimizations first when performance is good
        if (optimization.impact === 'low') {
          optimizationsToReverse.push(name);
        }
      }
    }
    
    // Reverse selected optimizations
    optimizationsToReverse.forEach(name => {
      this.appliedOptimizations.delete(name);
      console.log(`Reversed optimization: ${name} (performance improved)`);
    });
  }

  /**
   * Review and adjust optimizations periodically
   */
  private reviewAndAdjustOptimizations(): void {
    const metrics = this.getMetrics();
    const currentTime = Date.now();
    
    // Check if we have too many optimizations active
    if (this.appliedOptimizations.size > 10) {
      console.warn(`Many optimizations active (${this.appliedOptimizations.size}), reviewing effectiveness`);
    }
    
    // Remove expired optimizations (older than 5 minutes with good performance)
    if (metrics.fps >= this.MIN_FPS) {
      const expiredOptimizations: string[] = [];
      
      for (const [name, optimization] of this.appliedOptimizations) {
        const age = currentTime - optimization.timestamp;
        if (age > 300000) { // 5 minutes
          expiredOptimizations.push(name);
        }
      }
      
      expiredOptimizations.forEach(name => {
        this.appliedOptimizations.delete(name);
        console.log(`Expired optimization removed: ${name}`);
      });
    }
    
    // Log current optimization status
    if (this.appliedOptimizations.size > 0) {
      console.log(`Active optimizations: ${Array.from(this.appliedOptimizations.keys()).join(', ')}`);
    }
  }

  /**
   * Adapt optimizations based on device capabilities and current conditions
   */
  private adaptOptimizationsToDevice(): void {
    const metrics = this.getMetrics();
    
    // Detect device type based on available metrics
    const isLowEndDevice = this.detectLowEndDevice(metrics);
    const isMobileDevice = this.detectMobileDevice();
    const isSlowConnection = this.detectSlowConnection(metrics);
    
    if (isLowEndDevice) {
      this.applyOptimization('enable_low_end_device_mode', 'Low-end device detected', 'medium');
      this.applyOptimization('reduce_visual_effects', 'Low-end device detected', 'low');
    }
    
    if (isMobileDevice) {
      this.applyOptimization('enable_mobile_optimizations', 'Mobile device detected', 'low');
      this.applyOptimization('optimize_touch_interactions', 'Mobile device detected', 'low');
    }
    
    if (isSlowConnection) {
      this.applyOptimization('enable_offline_mode_preparation', 'Slow connection detected', 'medium');
      this.applyOptimization('preload_critical_resources', 'Slow connection detected', 'low');
    }
    
    console.log(`Device adaptation: LowEnd=${isLowEndDevice}, Mobile=${isMobileDevice}, SlowConnection=${isSlowConnection}`);
  }

  /**
   * Detect if device is low-end based on performance metrics
   */
  private detectLowEndDevice(metrics: PerformanceMetrics): boolean {
    const indicators = [
      metrics.memoryUsage && metrics.memoryUsage < 100 * 1024 * 1024, // Less than 100MB available
      metrics.cpuUsage && metrics.cpuUsage > 80, // High CPU usage consistently
      metrics.fps < 25, // Consistently low FPS
      metrics.frameTime > 40 // High frame times
    ];
    
    return indicators.filter(Boolean).length >= 2; // At least 2 indicators
  }

  /**
   * Detect if device is mobile
   */
  private detectMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           ('ontouchstart' in window) ||
           (navigator.maxTouchPoints > 0);
  }

  /**
   * Detect if connection is slow
   */
  private detectSlowConnection(metrics: PerformanceMetrics): boolean {
    return (metrics.connectionType === 'slow-2g' || 
            metrics.connectionType === '2g' ||
            (metrics.networkLatency && metrics.networkLatency > 1000));
  }

  /**
   * Cleanup resources and prevent memory leaks
   */
  cleanup(): void {
    // Clear all active timers
    this.activeTimers.forEach(timerId => clearTimeout(timerId));
    this.activeTimers.clear();
    
    this.activeIntervals.forEach(intervalId => clearInterval(intervalId));
    this.activeIntervals.clear();
    
    // Remove all tracked event listeners
    this.activeEventListeners.forEach((listeners, target) => {
      listeners.forEach((listener, event) => {
        target.removeEventListener(event, listener);
      });
    });
    this.activeEventListeners.clear();
    
    // Clear callbacks
    this.loadingCallbacks.clear();
    this.performanceCallbacks.clear();
    this.optimizationCallbacks.clear();
  }

  /**
   * Track a timer to prevent leaks
   */
  trackTimer(timerId: number): void {
    this.activeTimers.add(timerId);
  }

  /**
   * Untrack a timer
   */
  untrackTimer(timerId: number): void {
    this.activeTimers.delete(timerId);
  }

  /**
   * Track an interval to prevent leaks
   */
  trackInterval(intervalId: number): void {
    this.activeIntervals.add(intervalId);
  }

  /**
   * Untrack an interval
   */
  untrackInterval(intervalId: number): void {
    this.activeIntervals.delete(intervalId);
  }

  /**
   * Track an event listener to prevent leaks
   */
  trackEventListener(target: EventTarget, event: string, listener: EventListener): void {
    if (!this.activeEventListeners.has(target)) {
      this.activeEventListeners.set(target, new Map());
    }
    this.activeEventListeners.get(target)!.set(event, listener);
  }

  /**
   * Untrack an event listener
   */
  untrackEventListener(target: EventTarget, event: string): void {
    const listeners = this.activeEventListeners.get(target);
    if (listeners) {
      listeners.delete(event);
      if (listeners.size === 0) {
        this.activeEventListeners.delete(target);
      }
    }
  }

  // Private methods

  /**
   * Measure frame rate using requestAnimationFrame with enhanced monitoring
   */
  private measureFrameRate(): void {
    if (!this.isMonitoring) return;

    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastFrameTime;
    
    this.frameTime = deltaTime;
    this.frameCount++;
    
    // Calculate FPS every second
    if (this.frameCount >= 60) {
      this.fps = Math.round(1000 / (deltaTime / this.frameCount));
      this.frameCount = 0;
      
      // Notify callbacks if performance is degraded
      if (this.fps < this.MIN_FPS) {
        console.warn(`Low FPS detected: ${this.fps} FPS (target: ${this.MIN_FPS}+ FPS)`);
        this.notifyPerformanceCallbacks();
        
        // Report critical performance issues
        if (this.fps < this.CRITICAL_FPS) {
          errorHandler.handleError(
            new PerformanceError(
              'Critical FPS detected',
              'fps',
              this.fps,
              this.CRITICAL_FPS
            ),
            {
              component: 'PerformanceMonitor',
              operation: 'fps_monitoring'
            }
          );
        }
      }
    }
    
    this.lastFrameTime = currentTime;
    this.animationFrameId = requestAnimationFrame(() => this.measureFrameRate());
  }

  /**
   * Get memory usage if available
   */
  private getMemoryUsage(): number | undefined {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return memory.usedJSHeapSize;
    }
    return undefined;
  }

  /**
   * Get CPU usage estimation based on frame timing
   */
  private getCPUUsage(): number | undefined {
    if (this.frameTime > 0) {
      // Estimate CPU usage based on frame time vs ideal frame time (16.67ms for 60fps)
      const idealFrameTime = 16.67;
      const cpuUsage = Math.min(100, (this.frameTime / idealFrameTime) * 100);
      return Math.round(cpuUsage);
    }
    return undefined;
  }

  /**
   * Get network latency from recent network operations
   */
  private getNetworkLatency(): number | undefined {
    const networkOperations = Array.from(this.operationTimes.entries())
      .filter(([key]) => key.includes('network') || key.includes('api') || key.includes('fetch'));
    
    if (networkOperations.length > 0) {
      const avgLatency = networkOperations.reduce((sum, [, time]) => sum + time, 0) / networkOperations.length;
      return Math.round(avgLatency);
    }
    return undefined;
  }

  /**
   * Get render time from recent render operations
   */
  private getRenderTime(): number | undefined {
    const renderOperations = Array.from(this.operationTimes.entries())
      .filter(([key]) => key.includes('render') || key.includes('paint') || key.includes('draw'));
    
    if (renderOperations.length > 0) {
      const avgRenderTime = renderOperations.reduce((sum, [, time]) => sum + time, 0) / renderOperations.length;
      return Math.round(avgRenderTime);
    }
    return this.frameTime; // Fallback to frame time
  }

  /**
   * Get current DOM node count
   */
  private getDOMNodeCount(): number {
    return document.querySelectorAll('*').length;
  }

  /**
   * Get cache hit ratio from operation times
   */
  private getCacheHitRatio(): number | undefined {
    const cacheHits = Array.from(this.operationTimes.entries())
      .filter(([key]) => key.includes('cache_hit')).length;
    const cacheMisses = Array.from(this.operationTimes.entries())
      .filter(([key]) => key.includes('cache_miss')).length;
    
    const totalCacheOperations = cacheHits + cacheMisses;
    if (totalCacheOperations > 0) {
      return Math.round((cacheHits / totalCacheOperations) * 100);
    }
    return undefined;
  }

  /**
   * Get garbage collection pressure estimation
   */
  private getGCPressure(): number | undefined {
    const memoryUsage = this.getMemoryUsage();
    if (memoryUsage && this.memoryBaseline > 0) {
      const memoryGrowth = memoryUsage - this.memoryBaseline;
      const memoryGrowthMB = memoryGrowth / (1024 * 1024);
      
      // Estimate GC pressure based on memory growth rate
      if (memoryGrowthMB > 50) return 100; // High pressure
      if (memoryGrowthMB > 25) return 75;  // Medium-high pressure
      if (memoryGrowthMB > 10) return 50;  // Medium pressure
      if (memoryGrowthMB > 5) return 25;   // Low-medium pressure
      return 10; // Low pressure
    }
    return undefined;
  }

  /**
   * Get battery level if available
   */
  private getBatteryLevel(): number | undefined {
    if ('getBattery' in navigator) {
      // Note: Battery API is deprecated but still available in some browsers
      try {
        (navigator as any).getBattery().then((battery: any) => {
          return Math.round(battery.level * 100);
        });
      } catch (error) {
        // Battery API not available
      }
    }
    return undefined;
  }

  /**
   * Get connection type if available
   */
  private getConnectionType(): string | undefined {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      return connection.effectiveType || connection.type || 'unknown';
    }
    return undefined;
  }

  /**
   * Notify loading state callbacks
   */
  private notifyLoadingCallbacks(): void {
    const operations = this.getActiveLoadingOperations();
    this.loadingCallbacks.forEach(callback => {
      try {
        callback(operations);
      } catch (error) {
        console.error('Error in loading callback:', error);
      }
    });
  }

  /**
   * Notify performance metrics callbacks
   */
  private notifyPerformanceCallbacks(): void {
    const metrics = this.getMetrics();
    this.performanceCallbacks.forEach(callback => {
      try {
        callback(metrics);
      } catch (error) {
        console.error('Error in performance callback:', error);
      }
    });
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions for safe resource management and performance monitoring

/**
 * Safe setTimeout that tracks timers to prevent leaks
 */
export function safeSetTimeout(callback: () => void, delay: number): number {
  const timerId = window.setTimeout(() => {
    performanceMonitor.untrackTimer(timerId);
    callback();
  }, delay);
  
  performanceMonitor.trackTimer(timerId);
  return timerId;
}

/**
 * Safe setInterval that tracks intervals to prevent leaks
 */
export function safeSetInterval(callback: () => void, delay: number): number {
  const intervalId = window.setInterval(callback, delay);
  performanceMonitor.trackInterval(intervalId);
  return intervalId;
}

/**
 * Safe clearTimeout that untracks timers
 */
export function safeClearTimeout(timerId: number): void {
  clearTimeout(timerId);
  performanceMonitor.untrackTimer(timerId);
}

/**
 * Safe clearInterval that untracks intervals
 */
export function safeClearInterval(intervalId: number): void {
  clearInterval(intervalId);
  performanceMonitor.untrackInterval(intervalId);
}

/**
 * Safe addEventListener that tracks listeners to prevent leaks
 */
export function safeAddEventListener<K extends keyof WindowEventMap>(
  target: EventTarget,
  type: K,
  listener: (this: Window, ev: WindowEventMap[K]) => any,
  options?: boolean | AddEventListenerOptions
): void;
export function safeAddEventListener(
  target: EventTarget,
  type: string,
  listener: EventListener,
  options?: boolean | AddEventListenerOptions
): void {
  target.addEventListener(type, listener, options);
  performanceMonitor.trackEventListener(target, type, listener);
}

/**
 * Safe removeEventListener that untracks listeners
 */
export function safeRemoveEventListener<K extends keyof WindowEventMap>(
  target: EventTarget,
  type: K,
  listener: (this: Window, ev: WindowEventMap[K]) => any,
  options?: boolean | EventListenerOptions
): void;
export function safeRemoveEventListener(
  target: EventTarget,
  type: string,
  listener: EventListener,
  options?: boolean | EventListenerOptions
): void {
  target.removeEventListener(type, listener, options);
  performanceMonitor.untrackEventListener(target, type);
}

/**
 * React hook for performance monitoring
 */
export function usePerformanceMonitoring() {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics | null>(null);
  const [optimizations, setOptimizations] = React.useState<PerformanceOptimization[]>([]);

  React.useEffect(() => {
    const unsubscribeMetrics = performanceMonitor.onPerformanceChange(setMetrics);
    const unsubscribeOptimizations = performanceMonitor.onOptimization((opt) => {
      setOptimizations(prev => [...prev, opt]);
    });

    return () => {
      unsubscribeMetrics();
      unsubscribeOptimizations();
    };
  }, []);

  return {
    metrics,
    optimizations,
    clearOptimizations: () => {
      performanceMonitor.resetOptimizations();
      setOptimizations([]);
    },
    getRecommendations: () => performanceMonitor.getPerformanceRecommendations(),
    getMemoryLeaks: () => performanceMonitor.getMemoryLeaks()
  };
}

/**
 * Decorator for measuring function execution time
 */
export function measurePerformance(operationName: string) {
  return function <T extends (...args: any[]) => any>(
    _target: any,
    _propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) {
    const originalMethod = descriptor.value;
    if (!originalMethod) return;

    descriptor.value = function (this: any, ...args: any[]) {
      const operationId = `${operationName}_${Date.now()}`;
      performanceMonitor.startOperation(operationId, operationName);
      
      try {
        const result = originalMethod.apply(this, args);
        
        // Handle async functions
        if (result instanceof Promise) {
          return result.finally(() => {
            performanceMonitor.endOperation(operationId);
          });
        }
        
        performanceMonitor.endOperation(operationId);
        return result;
      } catch (error) {
        performanceMonitor.endOperation(operationId);
        throw error;
      }
    } as T;
  };
}

/**
 * Measure execution time of an async operation
 */
export async function measureAsync<T>(
  operationName: string,
  operation: () => Promise<T>
): Promise<T> {
  const operationId = `${operationName}_${Date.now()}`;
  performanceMonitor.startOperation(operationId, operationName);
  
  try {
    const result = await operation();
    performanceMonitor.endOperation(operationId);
    return result;
  } catch (error) {
    performanceMonitor.endOperation(operationId);
    throw error;
  }
}

/**
 * Measure execution time of a synchronous operation
 */
export function measureSync<T>(
  operationName: string,
  operation: () => T
): T {
  const operationId = `${operationName}_${Date.now()}`;
  performanceMonitor.startOperation(operationId, operationName);
  
  try {
    const result = operation();
    performanceMonitor.endOperation(operationId);
    return result;
  } catch (error) {
    performanceMonitor.endOperation(operationId);
    throw error;
  }
}