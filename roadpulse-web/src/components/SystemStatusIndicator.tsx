/**
 * System status indicator showing error states, performance metrics, and offline status
 * Provides comprehensive system health monitoring for users
 */

import React, { useState, useEffect } from 'react';
import { errorHandler, ErrorReport, ErrorSeverity } from '../utils/errorHandler';
import { offlineManager, OfflineStatus } from '../utils/offlineManager';
import { usePerformanceMonitoring } from '../utils/performanceMonitor';
import './SystemStatusIndicator.css';

interface SystemStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const SystemStatusIndicator: React.FC<SystemStatusIndicatorProps> = ({
  className = '',
  showDetails = false,
  position = 'top-right'
}) => {
  const [errors, setErrors] = useState<ErrorReport[]>([]);
  const [offlineStatus, setOfflineStatus] = useState<OfflineStatus | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const { metrics, optimizations, getRecommendations, getMemoryLeaks } = usePerformanceMonitoring();

  // Subscribe to error reports
  useEffect(() => {
    const unsubscribe = errorHandler.onError((report) => {
      setErrors(prev => [...prev.slice(-9), report]); // Keep last 10 errors
    });
    return unsubscribe;
  }, []);

  // Subscribe to offline status changes
  useEffect(() => {
    const unsubscribe = offlineManager.onStatusChange(setOfflineStatus);
    // Get initial status
    setOfflineStatus(offlineManager.getOfflineStatus());
    return unsubscribe;
  }, []);

  // Determine overall system status
  const getSystemStatus = (): 'healthy' | 'warning' | 'error' | 'offline' => {
    if (!offlineStatus?.isOnline) return 'offline';
    
    const recentErrors = errors.filter(e => Date.now() - e.context.timestamp < 300000); // 5 minutes
    const criticalErrors = recentErrors.filter(e => e.severity === ErrorSeverity.CRITICAL);
    const highErrors = recentErrors.filter(e => e.severity === ErrorSeverity.HIGH);
    
    if (criticalErrors.length > 0) return 'error';
    if (highErrors.length > 0 || (metrics && metrics.fps < 20)) return 'warning';
    
    return 'healthy';
  };

  const systemStatus = getSystemStatus();
  const recentErrors = errors.filter(e => Date.now() - e.context.timestamp < 300000);
  const memoryLeaks = getMemoryLeaks();
  const recommendations = getRecommendations();

  const getStatusIcon = () => {
    switch (systemStatus) {
      case 'healthy':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22,4 12,14.01 9,11.01"/>
          </svg>
        );
      case 'warning':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        );
      case 'error':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        );
      case 'offline':
        return (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M1 1l22 22"/>
            <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
            <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
            <path d="M10.71 5.05A16 16 0 0 1 22.58 9"/>
            <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
            <line x1="12" y1="20" x2="12.01" y2="20"/>
          </svg>
        );
    }
  };

  const getStatusText = () => {
    switch (systemStatus) {
      case 'healthy':
        return 'System Healthy';
      case 'warning':
        return 'Performance Issues';
      case 'error':
        return 'System Errors';
      case 'offline':
        return 'Offline Mode';
    }
  };

  const handleClearErrors = () => {
    setErrors([]);
    errorHandler.clearErrors();
  };

  const handleRetryOffline = () => {
    // Trigger a connectivity check by attempting to fetch something
    fetch('/api/health', { method: 'HEAD' })
      .then(() => {
        console.log('Connection restored');
      })
      .catch(() => {
        console.log('Still offline');
      });
  };

  return (
    <div className={`system-status-indicator ${className} position-${position} status-${systemStatus}`}>
      <button
        className="system-status-indicator__toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label={`System status: ${getStatusText()}. Click to ${isExpanded ? 'collapse' : 'expand'} details.`}
        title={getStatusText()}
      >
        <span className="system-status-indicator__icon">
          {getStatusIcon()}
        </span>
        {showDetails && (
          <span className="system-status-indicator__text">
            {getStatusText()}
          </span>
        )}
      </button>

      {isExpanded && (
        <div className="system-status-indicator__panel">
          <div className="system-status-indicator__header">
            <h3>System Status</h3>
            <button
              className="system-status-indicator__close"
              onClick={() => setIsExpanded(false)}
              aria-label="Close status panel"
            >
              ×
            </button>
          </div>

          <div className="system-status-indicator__content">
            {/* Connection Status */}
            <div className="status-section">
              <h4>Connection</h4>
              <div className={`status-item ${offlineStatus?.isOnline ? 'online' : 'offline'}`}>
                <span className="status-dot"></span>
                {offlineStatus?.isOnline ? 'Online' : 'Offline'}
                {!offlineStatus?.isOnline && (
                  <button 
                    className="retry-button"
                    onClick={handleRetryOffline}
                  >
                    Retry
                  </button>
                )}
              </div>
              {offlineStatus?.hasOfflineData && (
                <div className="offline-info">
                  <small>
                    Offline data available ({Math.round((offlineStatus.storageUsed / 1024 / 1024) * 100) / 100}MB)
                  </small>
                </div>
              )}
            </div>

            {/* Performance Status */}
            {metrics && (
              <div className="status-section">
                <h4>Performance</h4>
                <div className="performance-metrics">
                  <div className={`metric ${metrics.fps < 30 ? 'warning' : metrics.fps < 20 ? 'error' : 'good'}`}>
                    <span className="metric-label">FPS:</span>
                    <span className="metric-value">{metrics.fps}</span>
                  </div>
                  {metrics.memoryUsage && (
                    <div className={`metric ${metrics.memoryUsage > 150 * 1024 * 1024 ? 'warning' : 'good'}`}>
                      <span className="metric-label">Memory:</span>
                      <span className="metric-value">
                        {Math.round((metrics.memoryUsage / 1024 / 1024) * 100) / 100}MB
                      </span>
                    </div>
                  )}
                </div>
                {optimizations.length > 0 && (
                  <div className="optimizations">
                    <small>{optimizations.length} optimization(s) applied</small>
                  </div>
                )}
              </div>
            )}

            {/* Recent Errors */}
            {recentErrors.length > 0 && (
              <div className="status-section">
                <h4>
                  Recent Issues ({recentErrors.length})
                  <button 
                    className="clear-button"
                    onClick={handleClearErrors}
                  >
                    Clear
                  </button>
                </h4>
                <div className="error-list">
                  {recentErrors.slice(-3).map((error, index) => (
                    <div key={error.id} className={`error-item severity-${error.severity}`}>
                      <span className="error-type">{error.error.name}</span>
                      <span className="error-message">{error.error.message}</span>
                      <span className="error-time">
                        {new Date(error.context.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Memory Leaks */}
            {memoryLeaks.length > 0 && (
              <div className="status-section">
                <h4>Memory Leaks ({memoryLeaks.length})</h4>
                <div className="leak-list">
                  {memoryLeaks.slice(-2).map((leak, index) => (
                    <div key={index} className={`leak-item severity-${leak.severity}`}>
                      <span className="leak-component">{leak.component}</span>
                      <span className="leak-description">{leak.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="status-section">
                <h4>Recommendations</h4>
                <ul className="recommendations-list">
                  {recommendations.slice(0, 3).map((rec, index) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Healthy Status */}
            {systemStatus === 'healthy' && recentErrors.length === 0 && (
              <div className="status-section">
                <div className="healthy-status">
                  <span className="healthy-icon">✓</span>
                  <span>All systems operating normally</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SystemStatusIndicator;