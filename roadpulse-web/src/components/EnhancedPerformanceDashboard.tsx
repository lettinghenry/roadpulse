import React, { useState, useEffect } from 'react';
import { PerformanceMonitor } from './PerformanceMonitor';
import { PerformanceDashboard } from './PerformanceDashboard';
import { 
  usePerformanceAnalytics,
  PerformanceReport,
  PerformanceAlert,
  PerformanceInsight,
  PerformanceTrend
} from '../utils/performanceAnalytics';
import './EnhancedPerformanceDashboard.css';

interface EnhancedPerformanceDashboardProps {
  className?: string;
  showDetailedMetrics?: boolean;
  showTrends?: boolean;
  showAlerts?: boolean;
  showInsights?: boolean;
  autoHide?: boolean;
}

/**
 * Enhanced performance dashboard with comprehensive analytics, alerts, and insights
 * Implements task 16.3 requirements for performance monitoring and optimization
 */
export const EnhancedPerformanceDashboard: React.FC<EnhancedPerformanceDashboardProps> = ({
  className = '',
  showDetailedMetrics = true,
  showTrends = true,
  showAlerts = true,
  showInsights = true,
  autoHide = false
}) => {
  const { reports, alerts, trends, summary, acknowledgeAlert, generateReport } = usePerformanceAnalytics();
  
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'alerts' | 'trends' | 'insights'>('overview');
  const [isExpanded, setIsExpanded] = useState(!autoHide);
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);

  // Auto-expand on critical issues
  useEffect(() => {
    if (autoHide && (summary.criticalIssues > 0 || summary.activeAlerts > 0)) {
      setIsExpanded(true);
    }
  }, [autoHide, summary.criticalIssues, summary.activeAlerts]);

  const latestReport = reports[reports.length - 1];
  const unacknowledgedAlerts = alerts.filter(alert => !alert.acknowledged);
  const criticalAlerts = alerts.filter(alert => alert.severity === 'critical' && !alert.acknowledged);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return '#22c55e';
      case 'good': return '#84cc16';
      case 'fair': return '#eab308';
      case 'poor': return '#f97316';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '🔴';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      case 'info': return 'ℹ️';
      default: return '⚪';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '📈';
      case 'stable': return '➡️';
      case 'degrading': return '📉';
      default: return '❓';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const handleAlertAcknowledge = (alertId: string) => {
    acknowledgeAlert(alertId);
  };

  const handleGenerateReport = () => {
    generateReport();
  };

  if (!isExpanded) {
    return (
      <div className={`enhanced-performance-dashboard collapsed ${className}`}>
        <div className="dashboard-header collapsed-header">
          <div className="performance-score-mini">
            <span 
              className="score-circle"
              style={{ backgroundColor: getStatusColor(summary.status) }}
            >
              {summary.score}
            </span>
          </div>
          {(criticalAlerts.length > 0 || summary.criticalIssues > 0) && (
            <div className="critical-indicator">
              🚨 {criticalAlerts.length + summary.criticalIssues}
            </div>
          )}
          <button
            className="expand-btn"
            onClick={() => setIsExpanded(true)}
            title="Expand performance dashboard"
          >
            📊
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`enhanced-performance-dashboard expanded ${className}`}>
      <div className="dashboard-header">
        <div className="header-left">
          <h3>Performance Analytics</h3>
          <div className="performance-score">
            <span 
              className="score-value"
              style={{ color: getStatusColor(summary.status) }}
            >
              {summary.score}
            </span>
            <span className="score-label">/{summary.status}</span>
          </div>
        </div>
        <div className="header-right">
          {unacknowledgedAlerts.length > 0 && (
            <div className="alert-indicator">
              🔔 {unacknowledgedAlerts.length}
            </div>
          )}
          <button
            className="generate-report-btn"
            onClick={handleGenerateReport}
            title="Generate new performance report"
          >
            🔄
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
        {showDetailedMetrics && (
          <button
            className={`tab-btn ${activeTab === 'metrics' ? 'active' : ''}`}
            onClick={() => setActiveTab('metrics')}
          >
            Metrics
          </button>
        )}
        {showAlerts && (
          <button
            className={`tab-btn ${activeTab === 'alerts' ? 'active' : ''} ${unacknowledgedAlerts.length > 0 ? 'has-alerts' : ''}`}
            onClick={() => setActiveTab('alerts')}
          >
            Alerts ({unacknowledgedAlerts.length})
          </button>
        )}
        {showTrends && (
          <button
            className={`tab-btn ${activeTab === 'trends' ? 'active' : ''}`}
            onClick={() => setActiveTab('trends')}
          >
            Trends
          </button>
        )}
        {showInsights && (
          <button
            className={`tab-btn ${activeTab === 'insights' ? 'active' : ''}`}
            onClick={() => setActiveTab('insights')}
          >
            Insights
          </button>
        )}
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="overview-tab">
            <div className="overview-grid">
              <div className="overview-card performance-summary">
                <h4>Performance Summary</h4>
                <div className="summary-metrics">
                  <div className="metric-item">
                    <span className="metric-label">Score:</span>
                    <span 
                      className="metric-value"
                      style={{ color: getStatusColor(summary.status) }}
                    >
                      {summary.score}/100
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Status:</span>
                    <span className="metric-value">{summary.status}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Active Alerts:</span>
                    <span className="metric-value">{summary.activeAlerts}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Critical Issues:</span>
                    <span className="metric-value">{summary.criticalIssues}</span>
                  </div>
                </div>
              </div>

              <div className="overview-card quick-metrics">
                <h4>Quick Metrics</h4>
                {latestReport && (
                  <div className="quick-metrics-grid">
                    <div className="quick-metric">
                      <span className="metric-name">FPS</span>
                      <span className="metric-value">{latestReport.metrics.fps}</span>
                    </div>
                    <div className="quick-metric">
                      <span className="metric-name">Memory</span>
                      <span className="metric-value">
                        {latestReport.metrics.memoryUsage 
                          ? `${(latestReport.metrics.memoryUsage / 1024 / 1024).toFixed(0)}MB`
                          : 'N/A'
                        }
                      </span>
                    </div>
                    <div className="quick-metric">
                      <span className="metric-name">Load Time</span>
                      <span className="metric-value">
                        {(latestReport.metrics.loadTime / 1000).toFixed(1)}s
                      </span>
                    </div>
                    <div className="quick-metric">
                      <span className="metric-name">CPU</span>
                      <span className="metric-value">
                        {latestReport.metrics.cpuUsage ? `${latestReport.metrics.cpuUsage}%` : 'N/A'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="overview-card recommendations">
                <h4>Top Recommendations</h4>
                <div className="recommendations-list">
                  {summary.recommendations.slice(0, 3).map((recommendation, index) => (
                    <div key={index} className="recommendation-item">
                      💡 {recommendation}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Embedded standard performance dashboard */}
            <div className="embedded-dashboard">
              <PerformanceDashboard 
                showDetails={false}
                enableOptimizations={true}
                showMemoryLeaks={true}
                showAdjustments={false}
              />
            </div>
          </div>
        )}

        {activeTab === 'metrics' && showDetailedMetrics && (
          <div className="metrics-tab">
            <PerformanceMonitor 
              showDetails={true}
              showOptimizations={true}
              showMemoryLeaks={true}
            />
            
            {latestReport && (
              <div className="detailed-metrics">
                <h4>Detailed Metrics</h4>
                <div className="metrics-grid">
                  <div className="metric-card">
                    <span className="metric-title">Network Latency</span>
                    <span className="metric-value">
                      {latestReport.metrics.networkLatency ? `${latestReport.metrics.networkLatency}ms` : 'N/A'}
                    </span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-title">Render Time</span>
                    <span className="metric-value">
                      {latestReport.metrics.renderTime ? `${latestReport.metrics.renderTime}ms` : 'N/A'}
                    </span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-title">DOM Nodes</span>
                    <span className="metric-value">
                      {latestReport.metrics.domNodeCount || 'N/A'}
                    </span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-title">Event Listeners</span>
                    <span className="metric-value">
                      {latestReport.metrics.eventListenerCount || 'N/A'}
                    </span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-title">Cache Hit Ratio</span>
                    <span className="metric-value">
                      {latestReport.metrics.cacheHitRatio ? `${latestReport.metrics.cacheHitRatio}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-title">GC Pressure</span>
                    <span className="metric-value">
                      {latestReport.metrics.gcPressure ? `${latestReport.metrics.gcPressure}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-title">Battery Level</span>
                    <span className="metric-value">
                      {latestReport.metrics.batteryLevel ? `${latestReport.metrics.batteryLevel}%` : 'N/A'}
                    </span>
                  </div>
                  <div className="metric-card">
                    <span className="metric-title">Connection</span>
                    <span className="metric-value">
                      {latestReport.metrics.connectionType || 'N/A'}
                    </span>
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
              {alerts
                .filter(alert => !showCriticalOnly || alert.severity === 'critical')
                .slice(-10)
                .reverse()
                .map((alert) => (
                  <div 
                    key={alert.id} 
                    className={`alert-item ${alert.severity} ${alert.acknowledged ? 'acknowledged' : 'unacknowledged'}`}
                  >
                    <div className="alert-header">
                      <span className="alert-icon">
                        {getSeverityIcon(alert.severity)}
                      </span>
                      <span className="alert-message">{alert.message}</span>
                      <span className="alert-time">
                        {formatTimestamp(alert.timestamp)}
                      </span>
                    </div>
                    {!alert.acknowledged && (
                      <button
                        className="acknowledge-btn"
                        onClick={() => handleAlertAcknowledge(alert.id)}
                        title="Acknowledge alert"
                      >
                        ✓
                      </button>
                    )}
                  </div>
                ))}
              
              {alerts.length === 0 && (
                <div className="no-alerts">
                  ✅ No performance alerts
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'trends' && showTrends && (
          <div className="trends-tab">
            <h4>Performance Trends</h4>
            <div className="trends-list">
              {trends.map((trend, index) => (
                <div key={index} className={`trend-item ${trend.trend}`}>
                  <span className="trend-icon">
                    {getTrendIcon(trend.trend)}
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
              
              {trends.length === 0 && (
                <div className="no-trends">
                  📊 Collecting trend data...
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'insights' && showInsights && (
          <div className="insights-tab">
            <h4>Performance Insights</h4>
            {latestReport && (
              <div className="insights-list">
                {latestReport.insights.map((insight, index) => (
                  <div key={index} className={`insight-item ${insight.category} ${insight.severity}`}>
                    <div className="insight-header">
                      <span className="insight-icon">
                        {getSeverityIcon(insight.severity)}
                      </span>
                      <span className="insight-title">{insight.title}</span>
                      <span className="insight-category">{insight.category}</span>
                    </div>
                    <div className="insight-description">
                      {insight.description}
                    </div>
                    <div className="insight-impact">
                      <strong>Impact:</strong> {insight.impact}
                    </div>
                    {insight.suggestion && (
                      <div className="insight-suggestion">
                        <strong>Suggestion:</strong> {insight.suggestion}
                      </div>
                    )}
                  </div>
                ))}
                
                {latestReport.insights.length === 0 && (
                  <div className="no-insights">
                    ✨ No performance issues detected
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedPerformanceDashboard;