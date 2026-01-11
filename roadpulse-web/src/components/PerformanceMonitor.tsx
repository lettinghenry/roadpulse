import React, { useState, useEffect } from 'react';
import { PerformanceMetrics, performanceMonitor, PerformanceOptimization, MemoryLeakInfo } from '../utils/performanceMonitor';
import './PerformanceMonitor.css';

interface PerformanceMonitorProps {
  showDetails?: boolean;
  className?: string;
  showOptimizations?: boolean;
  showMemoryLeaks?: boolean;
}

/**
 * Enhanced performance monitor component that displays FPS, performance metrics,
 * active optimizations, and memory leak information
 * Monitors 30+ FPS requirement (5.3) and shows performance warnings
 */
export const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({
  showDetails = false,
  className = '',
  showOptimizations = false,
  showMemoryLeaks = false
}) => {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [optimizations, setOptimizations] = useState<PerformanceOptimization[]>([]);
  const [memoryLeaks, setMemoryLeaks] = useState<MemoryLeakInfo[]>([]);
  const [showOptimizationPanel, setShowOptimizationPanel] = useState(false);
  const [showMemoryLeakPanel, setShowMemoryLeakPanel] = useState(false);

  useEffect(() => {
    // Subscribe to performance updates
    const unsubscribePerformance = performanceMonitor.onPerformanceChange((newMetrics) => {
      setMetrics(newMetrics);
      
      // Show monitor if performance is degraded
      if (newMetrics.fps < 30) {
        setIsVisible(true);
      }
      
      // Update memory leaks
      if (showMemoryLeaks) {
        setMemoryLeaks(performanceMonitor.getMemoryLeaks());
      }
    });

    // Subscribe to optimization updates
    const unsubscribeOptimizations = performanceMonitor.onOptimization((optimization) => {
      setOptimizations(prev => {
        const updated = [...prev, optimization];
        // Keep only the last 20 optimizations to prevent memory bloat
        return updated.slice(-20);
      });
    });

    // Get initial metrics
    setMetrics(performanceMonitor.getMetrics());
    if (showOptimizations) {
      setOptimizations(performanceMonitor.getAppliedOptimizations());
    }
    if (showMemoryLeaks) {
      setMemoryLeaks(performanceMonitor.getMemoryLeaks());
    }

    return () => {
      unsubscribePerformance();
      unsubscribeOptimizations();
    };
  }, [showOptimizations, showMemoryLeaks]);

  // Auto-hide after good performance is restored
  useEffect(() => {
    if (metrics && metrics.fps >= 30 && isVisible) {
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 3000); // Hide after 3 seconds of good performance
      
      return () => clearTimeout(timer);
    }
  }, [metrics, isVisible]);

  if (!metrics || (!showDetails && !isVisible)) {
    return null;
  }

  const isPerformancePoor = metrics.fps < 30;
  const memoryMB = metrics.memoryUsage ? (metrics.memoryUsage / 1024 / 1024).toFixed(1) : 'N/A';
  const hasActiveOptimizations = metrics.optimizationsApplied.length > 0;
  const hasMemoryLeaks = memoryLeaks.length > 0;
  const criticalMemoryLeaks = memoryLeaks.filter(leak => leak.severity === 'high').length;

  const handleClearOptimizations = () => {
    performanceMonitor.resetOptimizations();
    setOptimizations([]);
  };

  const handleClearMemoryLeaks = () => {
    performanceMonitor.clearMemoryLeaks();
    setMemoryLeaks([]);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getOptimizationIcon = (impact: string) => {
    switch (impact) {
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const getMemoryLeakIcon = (severity: string) => {
    switch (severity) {
      case 'high': return '🚨';
      case 'medium': return '⚠️';
      case 'low': return '💡';
      default: return '❓';
    }
  };

  return (
    <div 
      className={`performance-monitor ${isPerformancePoor ? 'performance-warning' : ''} ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="performance-header">
        <span className="performance-title">Performance</span>
        <div className="performance-header-controls">
          {hasActiveOptimizations && (
            <button
              className="performance-toggle-btn optimization-indicator"
              onClick={() => setShowOptimizationPanel(!showOptimizationPanel)}
              aria-label={`${metrics.optimizationsApplied.length} active optimizations`}
              title="View active performance optimizations"
            >
              ⚡ {metrics.optimizationsApplied.length}
            </button>
          )}
          {hasMemoryLeaks && (
            <button
              className={`performance-toggle-btn memory-leak-indicator ${criticalMemoryLeaks > 0 ? 'critical' : ''}`}
              onClick={() => setShowMemoryLeakPanel(!showMemoryLeakPanel)}
              aria-label={`${memoryLeaks.length} memory leaks detected`}
              title="View detected memory leaks"
            >
              🧠 {memoryLeaks.length}
            </button>
          )}
          {!showDetails && (
            <button
              className="performance-close"
              onClick={() => setIsVisible(false)}
              aria-label="Close performance monitor"
            >
              ×
            </button>
          )}
        </div>
      </div>
      
      <div className="performance-metrics">
        <div className={`metric fps-metric ${isPerformancePoor ? 'metric-warning' : ''}`}>
          <span className="metric-label">FPS:</span>
          <span className="metric-value">{metrics.fps}</span>
          {isPerformancePoor && (
            <span className="metric-warning-icon" aria-label="Performance warning">⚠️</span>
          )}
        </div>
        
        {showDetails && (
          <>
            <div className="metric">
              <span className="metric-label">Frame Time:</span>
              <span className="metric-value">{metrics.frameTime.toFixed(1)}ms</span>
            </div>
            
            <div className="metric">
              <span className="metric-label">Memory:</span>
              <span className="metric-value">{memoryMB}MB</span>
            </div>
            
            {metrics.loadTime > 0 && (
              <div className={`metric ${metrics.loadTime > 3000 ? 'metric-warning' : ''}`}>
                <span className="metric-label">Load Time:</span>
                <span className="metric-value">{(metrics.loadTime / 1000).toFixed(1)}s</span>
                {metrics.loadTime > 3000 && (
                  <span className="metric-warning-icon" aria-label="Slow load warning">⚠️</span>
                )}
              </div>
            )}
          </>
        )}
      </div>
      
      {isPerformancePoor && (
        <div className="performance-warning-text">
          Performance below 30 FPS target
        </div>
      )}

      {/* Active Optimizations Panel */}
      {showOptimizationPanel && hasActiveOptimizations && (
        <div className="performance-panel optimization-panel">
          <div className="panel-header">
            <h4>Active Optimizations</h4>
            <button 
              className="panel-clear-btn"
              onClick={handleClearOptimizations}
              title="Clear all optimizations"
            >
              Clear All
            </button>
          </div>
          <div className="optimization-list">
            {metrics.optimizationsApplied.map((optName, index) => {
              const opt = optimizations.find(o => o.name === optName);
              return (
                <div key={index} className={`optimization-item ${opt?.impact || 'low'}-impact`}>
                  <span className="optimization-icon">
                    {getOptimizationIcon(opt?.impact || 'low')}
                  </span>
                  <div className="optimization-details">
                    <span className="optimization-name">{optName.replace(/_/g, ' ')}</span>
                    {opt && (
                      <span className="optimization-reason">{opt.reason}</span>
                    )}
                  </div>
                  {opt && (
                    <span className="optimization-time">
                      {formatTimestamp(opt.timestamp)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Memory Leaks Panel */}
      {showMemoryLeakPanel && hasMemoryLeaks && (
        <div className="performance-panel memory-leak-panel">
          <div className="panel-header">
            <h4>Memory Leaks ({memoryLeaks.length})</h4>
            <button 
              className="panel-clear-btn"
              onClick={handleClearMemoryLeaks}
              title="Clear memory leak history"
            >
              Clear
            </button>
          </div>
          <div className="memory-leak-list">
            {memoryLeaks.slice(-10).map((leak, index) => (
              <div key={index} className={`memory-leak-item ${leak.severity}-severity`}>
                <span className="memory-leak-icon">
                  {getMemoryLeakIcon(leak.severity)}
                </span>
                <div className="memory-leak-details">
                  <span className="memory-leak-component">{leak.component}</span>
                  <span className="memory-leak-description">{leak.description}</span>
                  <span className="memory-leak-type">{leak.leakType.replace(/_/g, ' ')}</span>
                </div>
                <span className="memory-leak-time">
                  {formatTimestamp(leak.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;