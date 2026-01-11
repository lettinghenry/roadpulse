// Enhanced performance analytics for detailed performance insights and reporting
// Implements advanced performance monitoring and optimization for task 16.3

import { PerformanceMetrics, performanceMonitor } from './performanceMonitor';
import { performanceOptimizer, OptimizationState } from './performanceOptimizer';

export interface PerformanceReport {
  timestamp: number;
  duration: number;
  metrics: PerformanceMetrics;
  optimizationState: OptimizationState;
  insights: PerformanceInsight[];
  recommendations: string[];
  score: number; // 0-100 performance score
}

export interface PerformanceInsight {
  category: 'performance' | 'memory' | 'network' | 'user_experience' | 'optimization';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  impact: string;
  suggestion?: string;
  metrics?: Record<string, number>;
}

export interface PerformanceTrend {
  metric: keyof PerformanceMetrics;
  trend: 'improving' | 'stable' | 'degrading';
  changePercent: number;
  timeframe: number; // milliseconds
}

export interface PerformanceAlert {
  id: string;
  timestamp: number;
  type: 'fps_drop' | 'memory_spike' | 'network_slow' | 'optimization_applied' | 'leak_detected';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metrics: Partial<PerformanceMetrics>;
  acknowledged: boolean;
}

/**
 * Enhanced performance analytics system for comprehensive performance monitoring
 * and optimization insights
 */
export class PerformanceAnalytics {
  private reports: PerformanceReport[] = [];
  private alerts: PerformanceAlert[] = [];
  private trends: Map<keyof PerformanceMetrics, PerformanceTrend> = new Map();
  private reportInterval: number | null = null;
  private alertCallbacks = new Set<(alert: PerformanceAlert) => void>();
  private reportCallbacks = new Set<(report: PerformanceReport) => void>();
  
  private readonly MAX_REPORTS = 100;
  private readonly MAX_ALERTS = 50;
  private readonly REPORT_INTERVAL = 30000; // 30 seconds
  private readonly TREND_ANALYSIS_WINDOW = 300000; // 5 minutes

  constructor() {
    this.initialize();
  }

  /**
   * Initialize performance analytics
   */
  private initialize(): void {
    // Start periodic reporting
    this.startPeriodicReporting();
    
    // Subscribe to performance changes for real-time alerts
    performanceMonitor.onPerformanceChange((metrics) => {
      this.analyzeMetricsForAlerts(metrics);
    });
    
    // Subscribe to optimization changes
    performanceOptimizer.onOptimization((optimization) => {
      this.createOptimizationAlert(optimization);
    });
    
    console.log('Performance analytics initialized');
  }

  /**
   * Start periodic performance reporting
   */
  private startPeriodicReporting(): void {
    if (this.reportInterval) return;
    
    this.reportInterval = window.setInterval(() => {
      this.generatePerformanceReport();
    }, this.REPORT_INTERVAL);
    
    performanceMonitor.trackInterval(this.reportInterval);
  }

  /**
   * Generate comprehensive performance report
   */
  generatePerformanceReport(): PerformanceReport {
    const startTime = performance.now();
    const metrics = performanceMonitor.getMetrics();
    const optimizationState = performanceOptimizer.getOptimizationState();
    
    const insights = this.generateInsights(metrics, optimizationState);
    const recommendations = this.generateRecommendations(metrics, optimizationState);
    const score = this.calculatePerformanceScore(metrics, optimizationState);
    
    const report: PerformanceReport = {
      timestamp: Date.now(),
      duration: performance.now() - startTime,
      metrics,
      optimizationState,
      insights,
      recommendations,
      score
    };
    
    // Store report
    this.reports.push(report);
    if (this.reports.length > this.MAX_REPORTS) {
      this.reports = this.reports.slice(-this.MAX_REPORTS);
    }
    
    // Update trends
    this.updateTrends(metrics);
    
    // Notify callbacks
    this.reportCallbacks.forEach(callback => {
      try {
        callback(report);
      } catch (error) {
        console.error('Error in report callback:', error);
      }
    });
    
    return report;
  }

  /**
   * Generate performance insights from metrics
   */
  private generateInsights(metrics: PerformanceMetrics, optimizationState: OptimizationState): PerformanceInsight[] {
    const insights: PerformanceInsight[] = [];
    
    // FPS insights
    if (metrics.fps < 30) {
      insights.push({
        category: 'performance',
        severity: metrics.fps < 20 ? 'critical' : 'warning',
        title: 'Low Frame Rate',
        description: `Current FPS is ${metrics.fps}, below the target of 30 FPS`,
        impact: 'Poor user experience with choppy animations and interactions',
        suggestion: 'Consider reducing visual complexity or enabling performance optimizations',
        metrics: { fps: metrics.fps, target: 30 }
      });
    }
    
    // Memory insights
    if (metrics.memoryUsage) {
      const memoryMB = metrics.memoryUsage / (1024 * 1024);
      if (memoryMB > 150) {
        insights.push({
          category: 'memory',
          severity: memoryMB > 200 ? 'critical' : 'warning',
          title: 'High Memory Usage',
          description: `Memory usage is ${memoryMB.toFixed(1)}MB`,
          impact: 'Risk of browser slowdown and potential crashes',
          suggestion: 'Enable data virtualization and clear unnecessary caches',
          metrics: { memoryMB, threshold: 150 }
        });
      }
    }
    
    // CPU insights
    if (metrics.cpuUsage && metrics.cpuUsage > 80) {
      insights.push({
        category: 'performance',
        severity: metrics.cpuUsage > 90 ? 'critical' : 'warning',
        title: 'High CPU Usage',
        description: `CPU usage is estimated at ${metrics.cpuUsage}%`,
        impact: 'Device may become unresponsive and battery drain increases',
        suggestion: 'Reduce computational complexity and enable CPU optimizations'
      });
    }
    
    // Network insights
    if (metrics.networkLatency && metrics.networkLatency > 1000) {
      insights.push({
        category: 'network',
        severity: metrics.networkLatency > 2000 ? 'critical' : 'warning',
        title: 'Slow Network Performance',
        description: `Network latency is ${metrics.networkLatency}ms`,
        impact: 'Slow data loading and poor user experience',
        suggestion: 'Enable aggressive caching and reduce network requests'
      });
    }
    
    // Optimization insights
    if (optimizationState.markerReduction < 1.0) {
      insights.push({
        category: 'optimization',
        severity: 'info',
        title: 'Performance Optimizations Active',
        description: `Showing ${(optimizationState.markerReduction * 100).toFixed(0)}% of markers`,
        impact: 'Improved performance but reduced data visibility',
        suggestion: 'Monitor performance and gradually restore full visibility when possible'
      });
    }
    
    // Memory leak insights
    if (metrics.memoryLeaks && metrics.memoryLeaks.length > 0) {
      const criticalLeaks = metrics.memoryLeaks.filter(leak => leak.severity === 'high').length;
      insights.push({
        category: 'memory',
        severity: criticalLeaks > 0 ? 'critical' : 'warning',
        title: 'Memory Leaks Detected',
        description: `${metrics.memoryLeaks.length} memory leaks detected (${criticalLeaks} critical)`,
        impact: 'Progressive memory consumption leading to performance degradation',
        suggestion: 'Review and fix memory leak sources, enable automatic cleanup'
      });
    }
    
    // User experience insights
    if (metrics.loadTime > 3000) {
      insights.push({
        category: 'user_experience',
        severity: metrics.loadTime > 5000 ? 'critical' : 'warning',
        title: 'Slow Initial Load',
        description: `Initial load time is ${(metrics.loadTime / 1000).toFixed(1)} seconds`,
        impact: 'Users may abandon the application before it loads',
        suggestion: 'Optimize initial bundle size and enable progressive loading'
      });
    }
    
    return insights;
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(metrics: PerformanceMetrics, optimizationState: OptimizationState): string[] {
    const recommendations: string[] = [];
    
    // FPS-based recommendations
    if (metrics.fps < 30) {
      recommendations.push('Enable marker clustering to reduce rendering load');
      recommendations.push('Switch to heat map visualization for better performance');
      if (!optimizationState.dataVirtualizationEnabled) {
        recommendations.push('Enable data virtualization to limit rendered elements');
      }
    }
    
    // Memory-based recommendations
    if (metrics.memoryUsage) {
      const memoryMB = metrics.memoryUsage / (1024 * 1024);
      if (memoryMB > 100) {
        recommendations.push('Clear browser caches and temporary data');
        recommendations.push('Reduce viewport data loading frequency');
        if (optimizationState.cacheSize > 50) {
          recommendations.push('Reduce cache size to free up memory');
        }
      }
    }
    
    // Network-based recommendations
    if (metrics.networkLatency && metrics.networkLatency > 500) {
      recommendations.push('Enable offline mode for better resilience');
      recommendations.push('Implement request batching to reduce network calls');
    }
    
    // Device-specific recommendations
    if (metrics.batteryLevel && metrics.batteryLevel < 30) {
      recommendations.push('Enable power saving mode to extend battery life');
      recommendations.push('Reduce background processing and animations');
    }
    
    // Connection-specific recommendations
    if (metrics.connectionType === 'slow-2g' || metrics.connectionType === '2g') {
      recommendations.push('Enable low-bandwidth mode for slow connections');
      recommendations.push('Compress all data transfers');
    }
    
    return recommendations;
  }

  /**
   * Calculate overall performance score (0-100)
   */
  private calculatePerformanceScore(metrics: PerformanceMetrics, optimizationState: OptimizationState): number {
    let score = 100;
    
    // FPS score (30% weight)
    const fpsScore = Math.min(100, (metrics.fps / 60) * 100);
    score = score * 0.7 + fpsScore * 0.3;
    
    // Memory score (25% weight)
    if (metrics.memoryUsage) {
      const memoryMB = metrics.memoryUsage / (1024 * 1024);
      const memoryScore = Math.max(0, 100 - (memoryMB / 200) * 100); // 200MB = 0 score
      score = score * 0.75 + memoryScore * 0.25;
    }
    
    // Load time score (20% weight)
    const loadTimeScore = Math.max(0, 100 - ((metrics.loadTime - 1000) / 4000) * 100); // 5s = 0 score
    score = score * 0.8 + loadTimeScore * 0.2;
    
    // Network score (15% weight)
    if (metrics.networkLatency) {
      const networkScore = Math.max(0, 100 - (metrics.networkLatency / 2000) * 100); // 2s = 0 score
      score = score * 0.85 + networkScore * 0.15;
    }
    
    // Memory leaks penalty (10% weight)
    if (metrics.memoryLeaks && metrics.memoryLeaks.length > 0) {
      const leakPenalty = Math.min(50, metrics.memoryLeaks.length * 5);
      score = score * 0.9 + Math.max(0, 100 - leakPenalty) * 0.1;
    }
    
    return Math.round(Math.max(0, Math.min(100, score)));
  }

  /**
   * Update performance trends
   */
  private updateTrends(metrics: PerformanceMetrics): void {
    const currentTime = Date.now();
    const recentReports = this.reports.filter(
      report => currentTime - report.timestamp < this.TREND_ANALYSIS_WINDOW
    );
    
    if (recentReports.length < 2) return;
    
    // Analyze FPS trend
    this.analyzeTrend('fps', recentReports, currentTime);
    
    // Analyze memory trend
    if (metrics.memoryUsage) {
      this.analyzeTrend('memoryUsage', recentReports, currentTime);
    }
    
    // Analyze load time trend
    this.analyzeTrend('loadTime', recentReports, currentTime);
  }

  /**
   * Analyze trend for a specific metric
   */
  private analyzeTrend(metric: keyof PerformanceMetrics, reports: PerformanceReport[], currentTime: number): void {
    const values = reports.map(report => report.metrics[metric] as number).filter(v => v !== undefined);
    if (values.length < 2) return;
    
    const oldValue = values[0];
    const newValue = values[values.length - 1];
    const changePercent = ((newValue - oldValue) / oldValue) * 100;
    
    let trend: 'improving' | 'stable' | 'degrading';
    if (Math.abs(changePercent) < 5) {
      trend = 'stable';
    } else if (metric === 'fps' ? changePercent > 0 : changePercent < 0) {
      trend = 'improving';
    } else {
      trend = 'degrading';
    }
    
    this.trends.set(metric, {
      metric,
      trend,
      changePercent: Math.abs(changePercent),
      timeframe: this.TREND_ANALYSIS_WINDOW
    });
  }

  /**
   * Analyze metrics for real-time alerts
   */
  private analyzeMetricsForAlerts(metrics: PerformanceMetrics): void {
    // FPS drop alert
    if (metrics.fps < 20) {
      this.createAlert({
        type: 'fps_drop',
        severity: 'critical',
        message: `Critical FPS drop detected: ${metrics.fps} FPS`,
        metrics: { fps: metrics.fps }
      });
    } else if (metrics.fps < 30) {
      this.createAlert({
        type: 'fps_drop',
        severity: 'medium',
        message: `Low FPS detected: ${metrics.fps} FPS`,
        metrics: { fps: metrics.fps }
      });
    }
    
    // Memory spike alert
    if (metrics.memoryUsage) {
      const memoryMB = metrics.memoryUsage / (1024 * 1024);
      if (memoryMB > 200) {
        this.createAlert({
          type: 'memory_spike',
          severity: 'critical',
          message: `Critical memory usage: ${memoryMB.toFixed(1)}MB`,
          metrics: { memoryUsage: metrics.memoryUsage }
        });
      }
    }
    
    // Network slow alert
    if (metrics.networkLatency && metrics.networkLatency > 2000) {
      this.createAlert({
        type: 'network_slow',
        severity: 'high',
        message: `Slow network detected: ${metrics.networkLatency}ms latency`,
        metrics: { networkLatency: metrics.networkLatency }
      });
    }
    
    // Memory leak alert
    if (metrics.memoryLeaks && metrics.memoryLeaks.length > 0) {
      const criticalLeaks = metrics.memoryLeaks.filter(leak => leak.severity === 'high').length;
      if (criticalLeaks > 0) {
        this.createAlert({
          type: 'leak_detected',
          severity: 'critical',
          message: `${criticalLeaks} critical memory leaks detected`,
          metrics: { memoryLeaks: metrics.memoryLeaks.length }
        });
      }
    }
  }

  /**
   * Create optimization alert
   */
  private createOptimizationAlert(optimization: any): void {
    this.createAlert({
      type: 'optimization_applied',
      severity: optimization.impact === 'high' ? 'high' : 'medium',
      message: `Performance optimization applied: ${optimization.name}`,
      metrics: {}
    });
  }

  /**
   * Create performance alert
   */
  private createAlert(alertData: Omit<PerformanceAlert, 'id' | 'timestamp' | 'acknowledged'>): void {
    const alert: PerformanceAlert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      acknowledged: false,
      ...alertData
    };
    
    this.alerts.push(alert);
    if (this.alerts.length > this.MAX_ALERTS) {
      this.alerts = this.alerts.slice(-this.MAX_ALERTS);
    }
    
    // Notify callbacks
    this.alertCallbacks.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in alert callback:', error);
      }
    });
    
    console.warn('Performance alert:', alert.message);
  }

  // Public API methods

  /**
   * Get recent performance reports
   */
  getReports(limit?: number): PerformanceReport[] {
    return limit ? this.reports.slice(-limit) : [...this.reports];
  }

  /**
   * Get active alerts
   */
  getAlerts(unacknowledgedOnly = false): PerformanceAlert[] {
    return this.alerts.filter(alert => !unacknowledgedOnly || !alert.acknowledged);
  }

  /**
   * Get performance trends
   */
  getTrends(): PerformanceTrend[] {
    return Array.from(this.trends.values());
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  /**
   * Subscribe to alerts
   */
  onAlert(callback: (alert: PerformanceAlert) => void): () => void {
    this.alertCallbacks.add(callback);
    return () => this.alertCallbacks.delete(callback);
  }

  /**
   * Subscribe to reports
   */
  onReport(callback: (report: PerformanceReport) => void): () => void {
    this.reportCallbacks.add(callback);
    return () => this.reportCallbacks.delete(callback);
  }

  /**
   * Get current performance summary
   */
  getCurrentSummary(): {
    score: number;
    status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    activeAlerts: number;
    criticalIssues: number;
    recommendations: string[];
  } {
    const latestReport = this.reports[this.reports.length - 1];
    if (!latestReport) {
      return {
        score: 0,
        status: 'critical',
        activeAlerts: 0,
        criticalIssues: 0,
        recommendations: ['Generate initial performance report']
      };
    }
    
    const activeAlerts = this.getAlerts(true).length;
    const criticalIssues = latestReport.insights.filter(i => i.severity === 'critical').length;
    
    let status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    if (latestReport.score >= 90) status = 'excellent';
    else if (latestReport.score >= 75) status = 'good';
    else if (latestReport.score >= 60) status = 'fair';
    else if (latestReport.score >= 40) status = 'poor';
    else status = 'critical';
    
    return {
      score: latestReport.score,
      status,
      activeAlerts,
      criticalIssues,
      recommendations: latestReport.recommendations.slice(0, 5) // Top 5 recommendations
    };
  }

  /**
   * Stop analytics and cleanup
   */
  stop(): void {
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
      performanceMonitor.untrackInterval(this.reportInterval);
      this.reportInterval = null;
    }
    
    this.alertCallbacks.clear();
    this.reportCallbacks.clear();
    console.log('Performance analytics stopped');
  }
}

// Export singleton instance
export const performanceAnalytics = new PerformanceAnalytics();

// React hook for performance analytics
export function usePerformanceAnalytics() {
  const [reports, setReports] = React.useState<PerformanceReport[]>([]);
  const [alerts, setAlerts] = React.useState<PerformanceAlert[]>([]);
  const [trends, setTrends] = React.useState<PerformanceTrend[]>([]);

  React.useEffect(() => {
    const unsubscribeReports = performanceAnalytics.onReport((report) => {
      setReports(prev => [...prev.slice(-19), report]); // Keep last 20
      setTrends(performanceAnalytics.getTrends());
    });

    const unsubscribeAlerts = performanceAnalytics.onAlert((alert) => {
      setAlerts(prev => [...prev.slice(-9), alert]); // Keep last 10
    });

    // Get initial data
    setReports(performanceAnalytics.getReports(20));
    setAlerts(performanceAnalytics.getAlerts());
    setTrends(performanceAnalytics.getTrends());

    return () => {
      unsubscribeReports();
      unsubscribeAlerts();
    };
  }, []);

  return {
    reports,
    alerts,
    trends,
    summary: performanceAnalytics.getCurrentSummary(),
    acknowledgeAlert: (alertId: string) => performanceAnalytics.acknowledgeAlert(alertId),
    generateReport: () => performanceAnalytics.generatePerformanceReport()
  };
}