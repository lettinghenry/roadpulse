import React, { useState, useEffect } from 'react';
import { PerformanceMonitor } from './PerformanceMonitor';
import { PerformanceDashboard } from './PerformanceDashboard';
import { EnhancedPerformanceDashboard } from './EnhancedPerformanceDashboard';
import { 
  usePerformanceMetricsCollection,
  SystemMetrics,
  PerformanceAlert,
  PerformanceReport
} from '../utils/performanceMetricsCollector';
import './AdvancedPerformanceDashboard.css';

interface AdvancedPerformanceDashboardProps {
  className?: string;
  showRealTimeMetrics?: boolean;
  showTrendAnalysis?: boolean;
  showSystemMetrics?: boolean;
  showAlerts?: boolean;
  showRecommendations?: boolean;
  autoOptimize?: boolean;
  compactMode?: boolean;
}

/**
 * Advanced performance dashboard that provides comprehensive performance monitoring,
 * real-time metrics, trend analysis, and automatic optimization recommendations.
 * Implements task 16.3 requirements for complete performance monitoring and optimization.
 */
export const AdvancedPerformanceDashboard: React.FC<AdvancedPerformanceDashboardProps> = ({
  className = '',
  showRealTimeMetrics = true,
  showTrendAnalysis = true,
  showSystemMetrics = true,
  showAlerts = true,
  showRecommendations = true,
  autoOptimize = true,
  compactMode = false
}) => {
  const { 
    metrics, 
    alerts, 
    isCalibrated, 
    baseline, 
    history, 
    generateReport 
  } = usePerformanceMetricsCollection();

  const [activeTab, setActiveTab] = useState<'overview' | 'realtime' | 'trends' | 'system' | 'alerts' | 'reports'>('overview');
  const [isExpanded, setIsExpanded] = useState(!compactMode);
  const [latestReport, setLatestReport] = useState<PerformanceReport | null>(null);
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);

  // Auto-expand on critical issues
  useEffect(() => {
    if (compactMode && alerts.some(alert => alert.severity === 'critical')) {
      setIsExpanded(true);
    }
  }, [compactMode, alerts]);

  // Generate periodic reports
  useEffect(() => {
    if (!isCalibrated) return;

    const reportInterval = setInterval(() => {
      try {
        const report = generateReport();
        setLatestReport(report);
      } catch (error) {
        console.error('Failed to generate performance report:', error);
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(reportInterval);
  }, [isCalibrated, generateReport]);

  const getPerformanceStatus = (metrics: SystemMetrics | null): {
    status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    color: string;
    score: number;
  } => {
    if (!metrics) {
      return { status: 'critical', color: '#ef4444', score: 0 };
    }

    // Calculate composite score
    let score = 100;
    
    // FPS component (40% weight)
    const fpsScore = Math.min(100, (metrics.fps / 60) * 100);
    score = score * 0.6 + fpsScore * 0.4;
    
    // Memory component (30% weight)
    const memoryScore = Math.max(0, 100 - (metrics.memoryUsage / 300) * 100);
    score = score * 0.7 + memoryScore * 0.3;
    
    // CPU component (20% weight)
    const cpuScore = Math.max(0, 100 - metrics.cpuUsage);
    score = score * 0.8 + cpuScore * 0.2;
    
    // Network component (10% weight)
    const networkScore = Math.max(0, 100 - (metrics.networkLatency / 1000) * 100);
    score = score * 0.9 + networkScore * 0.1;

    score = Math.round(Math.max(0, Math.min(100, score)));

    let status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    let color: string;

    if (score >= 90) {
      status = 'excellent';
      color = '#22c55e';
    } else if (score >= 75) {
      status = 'good';
      color = '#84cc16';
    } else if (score >= 60) {
      status = 'fair';
      color = '#eab308';
    } else if (score >= 40) {
      status = 'poor';
      color = '#f97316';
    } else {
      status = 'critical';
      color = '#ef4444';
    }

    return { status, color, score };
  };

  const formatMetricValue = (value: number, unit: string, decimals = 0): string => {
    if (value === 0) return 'N/A';
    return `${value.toFixed(decimals)}${unit}`;
  };

  const getAlertIcon = (severity: string): string => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📊';
    }
  };

  const getTrendIcon = (value: number, baseline: number): string => {
    if (baseline === 0) return '➡️';
    const change = ((value - baseline) / baseline) * 100;
    if (Math.abs(change) < 5) return '➡️';
    return change > 0 ? '📈' : '📉';
  };

  const handleGenerateReport = () => {
    try {
      const report = generateReport();
      setLatestReport(report);
      console.log('Performance report generated:', report);
    } catch (error) {
      console.error('Failed to generate report:', error);
    }
  };

  const performanceStatus = getPerformanceStatus(metrics);
  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical');
  const filteredAlerts = showCriticalOnly ? criticalAlerts : alerts;

  if (!isExpanded) {
    return (
      <div className={`advanced-performance-dashboard collapsed ${className}`}>
        <div className="dashboard-header collapsed-header">
          <div className="performance-score-indicator">
            <div 
              className="score-circle"
              style={{ backgroundColor: performanceStatus.color }}
              title={`Performance: ${performanceStatus.status} (${performanceStatus.score}/100)`}
            >
              {performanceStatus.score}
            </div>
          </div>
          
          {criticalAlerts.length > 0 && (
            <div className="critical-alerts-indicator">
              🚨 {criticalAlerts.length}
            </div>
          )}
          
          {!isCalibrated && (
            <div className="calibration-indicator">
              ⏳ Calibrating...
            </div>
          )}
          
          <button
            className="expand-btn"
            onClick={() => setIsExpanded(true)}
            title="Expand advanced performance dashboard"
          >
            📊
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`advanced-performance-dashboard expanded ${className}`}>
      <div className="dashboard-header">
        <div className="header-left">
          <h3>Advanced Performance Monitor</h3>
          <div className="performance-summary">
            <div 
              className="performance-score"
              style={{ color: performanceStatus.color }}
            >
              {performanceStatus.score}/100
            </div>
            <div className="performance-status">
              {performanceStatus.status}
            </div>
          </div>
        </div>
        
        <div className="header-right">
          {!isCalibrated && (
            <div className="calibration-status">
              ⏳ Calibrating baseline...
            </div>
          )}
          
          {criticalAlerts.length > 0 && (
            <div className="critical-alerts-badge">
              🚨 {criticalAlerts.length} Critical
            </div>
          )}
          
          <button
            className="generate-report-btn"
            onClick={handleGenerateReport}
            title="Generate performance report"
            disabled={!isCalibrated}
          >
            📋
          </button>
          
          <button
            className="collapse-btn"
            onClick={() => setIsExpanded(false)}
            title="Collapse dashboard"
          >
            ➖
          </button>
        </div>
      </div>

      <div className="dashboard-tabs">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        
        {showRealTimeMetrics && (
          <button
            className={`tab-btn ${activeTab === 'realtime' ? 'active' : ''}`}
            onClick={() => setActiveTab('realtime')}
          >
            Real-time
          </button>
        )}
        
        {showTrendAnalysis && (
          <button
            className={`tab-btn ${activeTab === 'trends' ? 'active' : ''}`}
            onClick={() => setActiveTab('trends')}
          >
            Trends
          </button>
        )}
        
        {showSystemMetrics && (
          <button
            className={`tab-btn ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => setActiveTab('system')}
          >
            System
          </button>
        )}
        
        {showAlerts && (
          <button
            className={`tab-btn ${activeTab === 'alerts' ? 'active' : ''} ${criticalAlerts.length > 0 ? 'has-alerts' : ''}`}
            onClick={() => setActiveTab('alerts')}
          >
            Alerts ({filteredAlerts.length})
          </button>
        )}
        
        <button
          className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          Reports
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="overview-grid">
              {/* Quick Metrics */}
              <div className="overview-card quick-metrics">
                <h4>Performance Metrics</h4>
                {metrics && (
                  <div className="metrics-grid">
                    <div className="metric-item">
                      <span className="metric-label">FPS:</span>
                      <span className={`metric-value ${metrics.fps < 30 ? 'warning' : ''}`}>
                        {metrics.fps}
                        {baseline && getTrendIcon(metrics.fps, baseline.fps || 0)}
                      </span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Memory:</span>
                      <span className={`metric-value ${metrics.memoryUsage > 200 ? 'warning' : ''}`}>
                        {formatMetricValue(metrics.memoryUsage, 'MB', 1)}
                        {baseline && getTrendIcon(metrics.memoryUsage, baseline.memoryUsage || 0)}
                      </span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">CPU:</span>
                      <span className={`metric-value ${metrics.cpuUsage > 80 ? 'warning' : ''}`}>
                        {formatMetricValue(metrics.cpuUsage, '%')}
                        {baseline && getTrendIcon(metrics.cpuUsage, baseline.cpuUsage || 0)}
                      </span>
                    </div>
                    <div className="metric-item">
                      <span className="metric-label">Network:</span>
                      <span className={`metric-value ${metrics.networkLatency > 500 ? 'warning' : ''}`}>
                        {formatMetricValue(metrics.networkLatency, 'ms')}
                        {baseline && getTrendIcon(metrics.networkLatency, baseline.networkLatency || 0)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Recent Alerts */}
              <div className="overview-card recent-alerts">
                <h4>Recent Alerts</h4>
                <div className="alerts-list">
                  {alerts.slice(-3).map((alert, index) => (
                    <div key={index} className={`alert-item ${alert.severity}`}>
                      <span className="alert-icon">{getAlertIcon(alert.severity)}</span>
                      <span className="alert-message">{alert.message}</span>
                    </div>
                  ))}
                  {alerts.length === 0 && (
                    <div className="no-alerts">✅ No alerts</div>
                  )}
                </div>
              </div>

              {/* Recommendations */}
              {showRecommendations && latestReport && (
                <div className="overview-card recommendations">
                  <h4>Recommendations</h4>
                  <div className="recommendations-list">
                    {latestReport.recommendations.slice(0, 3).map((recommendation, index) => (
                      <div key={index} className="recommendation-item">
                        💡 {recommendation}
                      </div>
                    ))}
                    {latestReport.recommendations.length === 0 && (
                      <div className="no-recommendations">✨ Performance is optimal</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Embedded Standard Dashboard */}
            <div className="embedded-dashboard">
              <EnhancedPerformanceDashboard 
                showDetailedMetrics={false}
                showTrends={false}
                showAlerts={false}
                showInsights={false}
                autoHide={false}
              />
            </div>
          </div>
        )}

        {activeTab === 'realtime' && showRealTimeMetrics && (
          <div className="realtime-tab">
            <PerformanceMonitor 
              showDetails={true}
              showOptimizations={true}
              showMemoryLeaks={true}
            />
            
            {metrics && (
              <div className="realtime-metrics">
                <h4>Real-time System Metrics</h4>
                <div className="realtime-grid">
                  <div className="realtime-card">
                    <h5>Performance</h5>
                    <div className="metric-row">
                      <span>FPS:</span>
                      <span className={metrics.fps < 30 ? 'warning' : ''}>{metrics.fps}</span>
                    </div>
                    <div className="metric-row">
                      <span>Frame Time:</span>
                      <span>{formatMetricValue(metrics.frameTime, 'ms', 1)}</span>
                    </div>
                    <div className="metric-row">
                      <span>Render Time:</span>
                      <span>{formatMetricValue(metrics.renderTime, 'ms')}</span>
                    </div>
                  </div>
                  
                  <div className="realtime-card">
                    <h5>Memory & CPU</h5>
                    <div className="metric-row">
                      <span>Memory Usage:</span>
                      <span className={metrics.memoryUsage > 200 ? 'warning' : ''}>
                        {formatMetricValue(metrics.memoryUsage, 'MB', 1)}
                      </span>
                    </div>
                    <div className="metric-row">
                      <span>CPU Usage:</span>
                      <span className={metrics.cpuUsage > 80 ? 'warning' : ''}>
                        {formatMetricValue(metrics.cpuUsage, '%')}
                      </span>
                    </div>
                    <div className="metric-row">
                      <span>GC Pressure:</span>
                      <span>{formatMetricValue(metrics.gcPressure, '%')}</span>
                    </div>
                  </div>
                  
                  <div className="realtime-card">
                    <h5>Network & Device</h5>
                    <div className="metric-row">
                      <span>Latency:</span>
                      <span className={metrics.networkLatency > 500 ? 'warning' : ''}>
                        {formatMetricValue(metrics.networkLatency, 'ms')}
                      </span>
                    </div>
                    <div className="metric-row">
                      <span>Connection:</span>
                      <span>{metrics.connectionType}</span>
                    </div>
                    <div className="metric-row">
                      <span>Bandwidth:</span>
                      <span>{formatMetricValue(metrics.bandwidth, 'Mbps', 1)}</span>
                    </div>
                  </div>
                  
                  <div className="realtime-card">
                    <h5>User Experience</h5>
                    <div className="metric-row">
                      <span>Interaction Latency:</span>
                      <span>{formatMetricValue(metrics.interactionLatency, 'ms')}</span>
                    </div>
                    <div className="metric-row">
                      <span>Visual Stability:</span>
                      <span>{formatMetricValue(metrics.visualStability, '%')}</span>
                    </div>
                    <div className="metric-row">
                      <span>Contentful Paint:</span>
                      <span>{formatMetricValue(metrics.contentfulPaint, 'ms')}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'trends' && showTrendAnalysis && (
          <div className="trends-tab">
            <h4>Performance Trends</h4>
            {latestReport && latestReport.trends.length > 0 ? (
              <div className="trends-list">
                {latestReport.trends.map((trend, index) => (
                  <div key={index} className={`trend-item ${trend.trend}`}>
                    <span className="trend-icon">
                      {trend.trend === 'improving' ? '📈' : 
                       trend.trend === 'degrading' ? '📉' : '➡️'}
                    </span>
                    <div className="trend-details">
                      <span className="trend-metric">{trend.metric}</span>
                      <span className="trend-description">
                        {trend.trend} by {trend.changePercent.toFixed(1)}%
                      </span>
                    </div>
                    <span className="trend-timeframe">
                      {(trend.timeframe / 60000).toFixed(0)}min
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-trends">
                📊 Collecting trend data... (requires calibration)
              </div>
            )}
          </div>
        )}

        {activeTab === 'system' && showSystemMetrics && (
          <div className="system-tab">
            <h4>System Information</h4>
            {metrics && (
              <div className="system-info-grid">
                <div className="system-card">
                  <h5>Browser</h5>
                  <div className="info-row">
                    <span>DOM Nodes:</span>
                    <span>{metrics.domNodeCount.toLocaleString()}</span>
                  </div>
                  <div className="info-row">
                    <span>Event Listeners:</span>
                    <span>{metrics.eventListenerCount}</span>
                  </div>
                  <div className="info-row">
                    <span>Cache Hit Ratio:</span>
                    <span>{formatMetricValue(metrics.cacheHitRatio, '%')}</span>
                  </div>
                </div>
                
                <div className="system-card">
                  <h5>Device</h5>
                  <div className="info-row">
                    <span>Device Memory:</span>
                    <span>{formatMetricValue(metrics.deviceMemory, 'GB')}</span>
                  </div>
                  <div className="info-row">
                    <span>CPU Cores:</span>
                    <span>{metrics.hardwareConcurrency}</span>
                  </div>
                  <div className="info-row">
                    <span>Battery Level:</span>
                    <span>{formatMetricValue(metrics.batteryLevel, '%')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'alerts' && showAlerts && (
          <div className="alerts-tab">
            <div className="alerts-header">
              <h4>Performance Alerts</h4>
              <label className="filter-toggle">
                <input
                  type="checkbox"
                  checked={showCriticalOnly}
                  onChange={(e) => setShowCriticalOnly(e.target.checked)}
                />
                Critical only
              </label>
            </div>
            
            <div className="alerts-list">
              {filteredAlerts.map((alert, index) => (
                <div key={index} className={`alert-item ${alert.severity}`}>
                  <div className="alert-header">
                    <span className="alert-icon">{getAlertIcon(alert.severity)}</span>
                    <span className="alert-message">{alert.message}</span>
                  </div>
                  <div className="alert-recommendation">
                    💡 {alert.recommendation}
                  </div>
                </div>
              ))}
              
              {filteredAlerts.length === 0 && (
                <div className="no-alerts">
                  ✅ No {showCriticalOnly ? 'critical ' : ''}alerts
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="reports-tab">
            <div className="reports-header">
              <h4>Performance Reports</h4>
              <button
                className="generate-report-btn"
                onClick={handleGenerateReport}
                disabled={!isCalibrated}
              >
                Generate Report
              </button>
            </div>
            
            {latestReport ? (
              <div className="report-content">
                <div className="report-summary">
                  <h5>Latest Report</h5>
                  <div className="report-meta">
                    <span>Generated: {new Date(latestReport.timestamp).toLocaleString()}</span>
                    <span>Score: {latestReport.score}/100</span>
                  </div>
                </div>
                
                <div className="report-sections">
                  <div className="report-section">
                    <h6>Key Metrics</h6>
                    <div className="report-metrics">
                      <div>FPS: {latestReport.metrics.fps}</div>
                      <div>Memory: {formatMetricValue(latestReport.metrics.memoryUsage, 'MB', 1)}</div>
                      <div>CPU: {formatMetricValue(latestReport.metrics.cpuUsage, '%')}</div>
                      <div>Network: {formatMetricValue(latestReport.metrics.networkLatency, 'ms')}</div>
                    </div>
                  </div>
                  
                  <div className="report-section">
                    <h6>Recommendations</h6>
                    <div className="report-recommendations">
                      {latestReport.recommendations.map((rec, index) => (
                        <div key={index} className="recommendation">💡 {rec}</div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-report">
                📋 {isCalibrated ? 'Click "Generate Report" to create a performance report' : 'Waiting for calibration to complete...'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedPerformanceDashboard;