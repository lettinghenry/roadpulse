import React, { useState, useEffect } from 'react';
import { AdvancedPerformanceDashboard } from '../components/AdvancedPerformanceDashboard';
import { 
  usePerformanceMetricsCollection,
  performanceMetricsCollector 
} from '../utils/performanceMetricsCollector';
import { 
  usePerformanceOptimization,
  performanceOptimizer 
} from '../utils/performanceOptimizer';
import { 
  usePerformanceAnalytics,
  performanceAnalytics 
} from '../utils/performanceAnalytics';

/**
 * Example component demonstrating comprehensive performance monitoring
 * and optimization features implemented for task 16.3
 */
export const PerformanceMonitoringExample: React.FC = () => {
  const [showDashboard, setShowDashboard] = useState(true);
  const [dashboardMode, setDashboardMode] = useState<'compact' | 'full'>('compact');
  
  // Use performance monitoring hooks
  const { 
    metrics, 
    alerts, 
    isCalibrated, 
    baseline, 
    generateReport 
  } = usePerformanceMetricsCollection();
  
  const { 
    optimizationState, 
    adjustments, 
    triggerOptimizationCheck, 
    resetOptimizations 
  } = usePerformanceOptimization();
  
  const { 
    reports, 
    alerts: analyticsAlerts, 
    summary 
  } = usePerformanceAnalytics();

  // Simulate some performance-intensive operations for demonstration
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate data processing
      const data = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        value: Math.random() * 100,
        timestamp: Date.now()
      }));
      
      // Simulate processing delay
      const start = performance.now();
      data.forEach(item => {
        // Simulate some computation
        Math.sqrt(item.value * Math.PI);
      });
      const duration = performance.now() - start;
      
      // This would normally be tracked by the performance monitor
      console.log(`Processed ${data.length} items in ${duration.toFixed(2)}ms`);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const handleGenerateReport = async () => {
    try {
      const report = generateReport();
      console.log('Performance Report Generated:', report);
      alert(`Performance Report Generated!\nScore: ${report.score}/100\nRecommendations: ${report.recommendations.length}`);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report. Please wait for calibration to complete.');
    }
  };

  const handleOptimizationCheck = () => {
    triggerOptimizationCheck();
    alert('Manual optimization check triggered!');
  };

  const handleResetOptimizations = () => {
    resetOptimizations();
    alert('All optimizations have been reset to default values.');
  };

  const getPerformanceStatusColor = (score: number): string => {
    if (score >= 90) return '#22c55e';
    if (score >= 75) return '#84cc16';
    if (score >= 60) return '#eab308';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Performance Monitoring Example</h1>
      <p>
        This example demonstrates the comprehensive performance monitoring and optimization 
        features implemented for task 16.3. The system automatically collects metrics, 
        applies optimizations, and provides detailed analytics.
      </p>

      {/* Control Panel */}
      <div style={{ 
        background: '#f5f5f5', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <h3>Performance Control Panel</h3>
        
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <button 
            onClick={() => setShowDashboard(!showDashboard)}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#3b82f6', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {showDashboard ? 'Hide' : 'Show'} Dashboard
          </button>
          
          <button 
            onClick={() => setDashboardMode(dashboardMode === 'compact' ? 'full' : 'compact')}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#6b7280', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            {dashboardMode === 'compact' ? 'Full' : 'Compact'} Mode
          </button>
          
          <button 
            onClick={handleGenerateReport}
            disabled={!isCalibrated}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: isCalibrated ? '#10b981' : '#d1d5db', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: isCalibrated ? 'pointer' : 'not-allowed'
            }}
          >
            Generate Report
          </button>
          
          <button 
            onClick={handleOptimizationCheck}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#f59e0b', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Check Optimizations
          </button>
          
          <button 
            onClick={handleResetOptimizations}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#ef4444', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reset Optimizations
          </button>
        </div>

        {/* Status Information */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
          <div style={{ background: 'white', padding: '10px', borderRadius: '4px' }}>
            <strong>Calibration Status:</strong>
            <div style={{ color: isCalibrated ? '#22c55e' : '#f59e0b' }}>
              {isCalibrated ? '✅ Complete' : '⏳ In Progress'}
            </div>
          </div>
          
          <div style={{ background: 'white', padding: '10px', borderRadius: '4px' }}>
            <strong>Performance Score:</strong>
            <div style={{ color: getPerformanceStatusColor(summary.score) }}>
              {summary.score}/100 ({summary.status})
            </div>
          </div>
          
          <div style={{ background: 'white', padding: '10px', borderRadius: '4px' }}>
            <strong>Active Alerts:</strong>
            <div style={{ color: alerts.length > 0 ? '#ef4444' : '#22c55e' }}>
              {alerts.length} alerts
            </div>
          </div>
          
          <div style={{ background: 'white', padding: '10px', borderRadius: '4px' }}>
            <strong>Optimizations:</strong>
            <div style={{ color: adjustments.length > 0 ? '#f59e0b' : '#22c55e' }}>
              {adjustments.length} applied
            </div>
          </div>
        </div>
      </div>

      {/* Current Metrics Display */}
      {metrics && (
        <div style={{ 
          background: '#f9fafb', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px' 
        }}>
          <h3>Current Performance Metrics</h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: '10px' 
          }}>
            <div>
              <strong>FPS:</strong> 
              <span style={{ color: metrics.fps < 30 ? '#ef4444' : '#22c55e' }}>
                {metrics.fps}
              </span>
            </div>
            <div>
              <strong>Memory:</strong> 
              <span style={{ color: metrics.memoryUsage > 200 ? '#ef4444' : '#22c55e' }}>
                {metrics.memoryUsage.toFixed(1)}MB
              </span>
            </div>
            <div>
              <strong>CPU:</strong> 
              <span style={{ color: metrics.cpuUsage > 80 ? '#ef4444' : '#22c55e' }}>
                {metrics.cpuUsage}%
              </span>
            </div>
            <div>
              <strong>Network:</strong> 
              <span style={{ color: metrics.networkLatency > 500 ? '#ef4444' : '#22c55e' }}>
                {metrics.networkLatency}ms
              </span>
            </div>
            <div>
              <strong>Connection:</strong> {metrics.connectionType}
            </div>
            <div>
              <strong>DOM Nodes:</strong> {metrics.domNodeCount.toLocaleString()}
            </div>
          </div>
        </div>
      )}

      {/* Recent Alerts */}
      {alerts.length > 0 && (
        <div style={{ 
          background: '#fee2e2', 
          padding: '15px', 
          borderRadius: '8px', 
          marginBottom: '20px' 
        }}>
          <h3>Recent Performance Alerts</h3>
          {alerts.slice(-3).map((alert, index) => (
            <div key={index} style={{ 
              background: 'white', 
              padding: '8px', 
              borderRadius: '4px', 
              marginBottom: '5px',
              borderLeft: `4px solid ${alert.severity === 'critical' ? '#ef4444' : '#f59e0b'}`
            }}>
              <div style={{ fontWeight: 'bold' }}>{alert.message}</div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                💡 {alert.recommendation}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Optimization State */}
      <div style={{ 
        background: '#f0f9ff', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '20px' 
      }}>
        <h3>Current Optimization State</h3>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '10px' 
        }}>
          <div>
            <strong>Marker Visibility:</strong> {(optimizationState.markerReduction * 100).toFixed(0)}%
          </div>
          <div>
            <strong>Cluster Radius:</strong> {optimizationState.clusterRadius}px
          </div>
          <div>
            <strong>Animations:</strong> 
            <span style={{ color: optimizationState.animationsEnabled ? '#22c55e' : '#ef4444' }}>
              {optimizationState.animationsEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div>
            <strong>Data Virtualization:</strong> 
            <span style={{ color: optimizationState.dataVirtualizationEnabled ? '#22c55e' : '#6b7280' }}>
              {optimizationState.dataVirtualizationEnabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <div>
            <strong>Cache Size:</strong> {optimizationState.cacheSize}MB
          </div>
          <div>
            <strong>Update Throttling:</strong> {optimizationState.updateThrottling}ms
          </div>
        </div>
      </div>

      {/* Advanced Performance Dashboard */}
      {showDashboard && (
        <AdvancedPerformanceDashboard
          showRealTimeMetrics={true}
          showTrendAnalysis={true}
          showSystemMetrics={true}
          showAlerts={true}
          showRecommendations={true}
          autoOptimize={true}
          compactMode={dashboardMode === 'compact'}
        />
      )}

      {/* Instructions */}
      <div style={{ 
        background: '#f3f4f6', 
        padding: '15px', 
        borderRadius: '8px', 
        marginTop: '20px' 
      }}>
        <h3>How to Use This Example</h3>
        <ol>
          <li><strong>Wait for Calibration:</strong> The system needs ~5 seconds to establish baseline metrics</li>
          <li><strong>Monitor Performance:</strong> Watch the real-time metrics and alerts</li>
          <li><strong>Generate Reports:</strong> Click "Generate Report" to get detailed performance analysis</li>
          <li><strong>Test Optimizations:</strong> Click "Check Optimizations" to trigger manual optimization</li>
          <li><strong>Explore Dashboard:</strong> Use the advanced dashboard to see detailed metrics and trends</li>
          <li><strong>Simulate Load:</strong> The example automatically generates some processing load for demonstration</li>
        </ol>
        
        <h4>Key Features Demonstrated:</h4>
        <ul>
          <li>✅ Real-time performance metrics collection</li>
          <li>✅ Automatic performance optimization</li>
          <li>✅ Memory leak detection and cleanup</li>
          <li>✅ Performance trend analysis</li>
          <li>✅ Comprehensive reporting</li>
          <li>✅ Interactive performance dashboard</li>
          <li>✅ Alert system for performance issues</li>
          <li>✅ Device and network adaptation</li>
        </ul>
      </div>
    </div>
  );
};

export default PerformanceMonitoringExample;