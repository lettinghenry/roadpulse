import React, { useState, useEffect } from 'react';
import { PerformanceMonitor } from './PerformanceMonitor';
import { 
  usePerformanceOptimization, 
  PerformanceAdjustment, 
  OptimizationState 
} from '../utils/performanceOptimizer';
import { usePerformanceMonitoring } from '../utils/performanceMonitor';
import './PerformanceDashboard.css';

interface PerformanceDashboardProps {
  showDetails?: boolean;
  className?: string;
  enableOptimizations?: boolean;
  showMemoryLeaks?: boolean;
  showAdjustments?: boolean;
}

/**
 * Comprehensive performance dashboard that displays performance metrics,
 * automatic optimizations, and memory leak information
 */
export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  showDetails = true,
  className = '',
  enableOptimizations = true,
  showMemoryLeaks = true,
  showAdjustments = true
}) => {
  const { metrics, getRecommendations, getMemoryLeaks } = usePerformanceMonitoring();
  const { 
    optimizationState, 
    adjustments, 
    triggerOptimizationCheck, 
    resetOptimizations 
  } = usePerformanceOptimization();

  const [showOptimizationPanel, setShowOptimizationPanel] = useState(false);
  const [showAdjustmentPanel, setShowAdjustmentPanel] = useState(false);
  const [showRecommendationsPanel, setShowRecommendationsPanel] = useState(false);

  // Get performance recommendations
  const recommendations = getRecommendations();
  const memoryLeaks = getMemoryLeaks();

  // Calculate optimization impact
  const optimizationImpact = React.useMemo(() => {
    const state = optimizationState;
    let impactScore = 0;
    let impactDescription = [];

    if (state.markerReduction < 1.0) {
      const reduction = (1 - state.markerReduction) * 100;
      impactScore += reduction * 0.3;
      impactDescription.push(`${reduction.toFixed(0)}% fewer markers`);
    }

    if (state.clusterRadius > 60) {
      const increase = ((state.clusterRadius - 60) / 60) * 100;
      impactScore += increase * 0.2;
      impactDescription.push(`${increase.toFixed(0)}% larger clusters`);
    }

    if (!state.animationsEnabled) {
      impactScore += 20;
      impactDescription.push('animations disabled');
    }

    if (state.dataVirtualizationEnabled) {
      impactScore += 15;
      impactDescription.push('data virtualization active');
    }

    if (state.updateThrottling > 0) {
      impactScore += (state.updateThrottling / 100) * 5;
      impactDescription.push(`${state.updateThrottling}ms update throttling`);
    }

    return {
      score: Math.round(impactScore),
      description: impactDescription.join(', ') || 'no optimizations active'
    };
  }, [optimizationState]);

  const handleManualOptimization = () => {
    triggerOptimizationCheck();
  };

  const handleResetOptimizations = () => {
    resetOptimizations();
  };

  const getOptimizationStatusColor = (state: OptimizationState) => {
    if (!state.animationsEnabled || state.markerReduction < 0.5) {
      return 'critical';
    } else if (state.markerReduction < 0.8 || state.clusterRadius > 80) {
      return 'warning';
    } else if (state.dataVirtualizationEnabled || state.updateThrottling > 0) {
      return 'active';
    }
    return 'normal';
  };

  const getAdjustmentIcon = (adjustment: PerformanceAdjustment) => {
    switch (adjustment.type) {
      case 'marker_reduction': return '📍';
      case 'clustering': return '🔗';
      case 'animation': return '🎬';
      case 'virtualization': return '💾';
      case 'memory_cleanup': return '🧹';
      case 'cache_optimization': return '⚡';
      default: return '⚙️';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  if (!metrics) {
    return null;
  }

  const optimizationStatusColor = getOptimizationStatusColor(optimizationState);
  const hasActiveOptimizations = optimizationImpact.score > 0;
  const recentAdjustments = adjustments.slice(-10);

  return (
    <div className={`performance-dashboard ${className}`}>
      {/* Main Performance Monitor */}
      <PerformanceMonitor 
        showDetails={showDetails}
        showOptimizations={enableOptimizations}
        showMemoryLeaks={showMemoryLeaks}
        className="dashboard-monitor"
      />

      {/* Optimization Status Panel */}
      {enableOptimizations && (
        <div className={`optimization-status ${optimizationStatusColor}`}>
          <div className="optimization-header">
            <span className="optimization-title">
              Performance Optimizations
            </span>
            <div className="optimization-controls">
              <span className="optimization-impact">
                Impact: {optimizationImpact.score}%
              </span>
              <button
                className="optimization-toggle-btn"
                onClick={() => setShowOptimizationPanel(!showOptimizationPanel)}
                title="View optimization details"
              >
                ⚙️ {hasActiveOptimizations ? 'Active' : 'Normal'}
              </button>
            </div>
          </div>

          {showOptimizationPanel && (
            <div className="optimization-panel">
              <div className="optimization-state">
                <h4>Current Optimization State</h4>
                <div className="state-grid">
                  <div className="state-item">
                    <span className="state-label">Marker Visibility:</span>
                    <span className="state-value">
                      {(optimizationState.markerReduction * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="state-item">
                    <span className="state-label">Cluster Radius:</span>
                    <span className="state-value">
                      {optimizationState.clusterRadius}px
                    </span>
                  </div>
                  <div className="state-item">
                    <span className="state-label">Animations:</span>
                    <span className={`state-value ${optimizationState.animationsEnabled ? 'enabled' : 'disabled'}`}>
                      {optimizationState.animationsEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="state-item">
                    <span className="state-label">Data Virtualization:</span>
                    <span className={`state-value ${optimizationState.dataVirtualizationEnabled ? 'enabled' : 'disabled'}`}>
                      {optimizationState.dataVirtualizationEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  <div className="state-item">
                    <span className="state-label">Update Throttling:</span>
                    <span className="state-value">
                      {optimizationState.updateThrottling}ms
                    </span>
                  </div>
                  <div className="state-item">
                    <span className="state-label">Cache Size:</span>
                    <span className="state-value">
                      {optimizationState.cacheSize}MB
                    </span>
                  </div>
                </div>

                <div className="optimization-actions">
                  <button 
                    className="action-btn manual-optimization"
                    onClick={handleManualOptimization}
                    title="Trigger manual optimization check"
                  >
                    🔍 Check Performance
                  </button>
                  <button 
                    className="action-btn reset-optimizations"
                    onClick={handleResetOptimizations}
                    title="Reset all optimizations to default"
                    disabled={!hasActiveOptimizations}
                  >
                    🔄 Reset All
                  </button>
                </div>
              </div>

              <div className="optimization-impact-summary">
                <h4>Current Impact</h4>
                <p className="impact-description">
                  {optimizationImpact.description}
                </p>
                <div className="impact-score">
                  Performance Impact: <strong>{optimizationImpact.score}%</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent Adjustments Panel */}
      {showAdjustments && recentAdjustments.length > 0 && (
        <div className="adjustments-status">
          <div className="adjustments-header">
            <span className="adjustments-title">Recent Adjustments</span>
            <button
              className="adjustments-toggle-btn"
              onClick={() => setShowAdjustmentPanel(!showAdjustmentPanel)}
              title="View recent performance adjustments"
            >
              📊 {recentAdjustments.length}
            </button>
          </div>

          {showAdjustmentPanel && (
            <div className="adjustments-panel">
              <div className="adjustments-list">
                {recentAdjustments.map((adjustment, index) => (
                  <div key={index} className={`adjustment-item ${adjustment.severity}-severity`}>
                    <span className="adjustment-icon">
                      {getAdjustmentIcon(adjustment)}
                    </span>
                    <div className="adjustment-details">
                      <div className="adjustment-description">
                        {adjustment.description}
                      </div>
                      <div className="adjustment-impact">
                        {adjustment.impact}
                      </div>
                    </div>
                    <div className="adjustment-meta">
                      <span className="adjustment-severity">
                        {getSeverityIcon(adjustment.severity)}
                      </span>
                      <span className="adjustment-time">
                        {formatTimestamp(adjustment.timestamp)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Performance Recommendations Panel */}
      {recommendations.length > 0 && (
        <div className="recommendations-status">
          <div className="recommendations-header">
            <span className="recommendations-title">Recommendations</span>
            <button
              className="recommendations-toggle-btn"
              onClick={() => setShowRecommendationsPanel(!showRecommendationsPanel)}
              title="View performance recommendations"
            >
              💡 {recommendations.length}
            </button>
          </div>

          {showRecommendationsPanel && (
            <div className="recommendations-panel">
              <div className="recommendations-list">
                {recommendations.map((recommendation, index) => (
                  <div key={index} className="recommendation-item">
                    <span className="recommendation-icon">💡</span>
                    <span className="recommendation-text">{recommendation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PerformanceDashboard;