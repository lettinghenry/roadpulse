/**
 * Error boundary components for handling React component errors
 * Provides graceful fallbacks and error reporting
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { errorHandler, ErrorSeverity, MapRenderError } from '../utils/errorHandler';
import './ErrorBoundary.css';

// Error boundary props
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
  component?: string;
}

// Error boundary state
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

// Generic error boundary
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const errorId = `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.setState({
      errorInfo,
      errorId
    });

    // Report error to error handler
    errorHandler.handleError(
      new MapRenderError(
        error.message,
        this.props.component || 'Unknown',
        true
      ),
      {
        component: this.props.component || 'ErrorBoundary',
        operation: 'render',
        additionalData: {
          componentStack: errorInfo.componentStack,
          errorBoundary: true
        }
      }
    );

    // Call external error handler if provided
    this.props.onError?.(error, errorInfo);

    console.error('Error boundary caught an error:', error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetOnPropsChange) {
        this.resetErrorBoundary();
      }
    }
  }

  resetErrorBoundary = () => {
    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  handleRetry = () => {
    this.resetErrorBoundary();
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          errorId={this.state.errorId}
          onRetry={this.handleRetry}
          onReload={this.handleReload}
          component={this.props.component}
        />
      );
    }

    return this.props.children;
  }
}

// Error fallback component props
interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  onRetry: () => void;
  onReload: () => void;
  component?: string;
}

// Generic error fallback component
export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  errorInfo,
  errorId,
  onRetry,
  onReload,
  component
}) => {
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div className="error-fallback" role="alert">
      <div className="error-fallback__content">
        <div className="error-fallback__icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        
        <h2 className="error-fallback__title">
          {component ? `${component} Error` : 'Something went wrong'}
        </h2>
        
        <p className="error-fallback__message">
          {error?.message || 'An unexpected error occurred while rendering this component.'}
        </p>
        
        <div className="error-fallback__actions">
          <button 
            className="error-fallback__button error-fallback__button--primary"
            onClick={onRetry}
          >
            Try Again
          </button>
          
          <button 
            className="error-fallback__button error-fallback__button--secondary"
            onClick={onReload}
          >
            Reload Page
          </button>
          
          <button 
            className="error-fallback__button error-fallback__button--text"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
        </div>
        
        {showDetails && (
          <div className="error-fallback__details">
            <h3>Error Details</h3>
            {errorId && (
              <p><strong>Error ID:</strong> {errorId}</p>
            )}
            {error && (
              <div>
                <p><strong>Error:</strong> {error.name}</p>
                <p><strong>Message:</strong> {error.message}</p>
                {error.stack && (
                  <details>
                    <summary>Stack Trace</summary>
                    <pre className="error-fallback__stack">{error.stack}</pre>
                  </details>
                )}
              </div>
            )}
            {errorInfo && (
              <details>
                <summary>Component Stack</summary>
                <pre className="error-fallback__stack">{errorInfo.componentStack}</pre>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Map-specific error boundary
export const MapErrorBoundary: React.FC<{
  children: ReactNode;
  onError?: (error: Error) => void;
}> = ({ children, onError }) => {
  return (
    <ErrorBoundary
      component="Map"
      onError={(error) => onError?.(error)}
      fallback={<MapErrorFallback />}
    >
      {children}
    </ErrorBoundary>
  );
};

// Map-specific error fallback
const MapErrorFallback: React.FC = () => {
  const [isRetrying, setIsRetrying] = React.useState(false);

  const handleRetry = () => {
    setIsRetrying(true);
    // Simulate retry delay
    setTimeout(() => {
      setIsRetrying(false);
      window.location.reload();
    }, 1000);
  };

  return (
    <div className="map-error-fallback">
      <div className="map-error-fallback__content">
        <div className="map-error-fallback__icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
            <line x1="12" y1="7" x2="12" y2="10"/>
            <line x1="12" y1="13" x2="12.01" y2="13"/>
          </svg>
        </div>
        
        <h2>Map Loading Failed</h2>
        <p>
          The map component failed to load properly. This could be due to:
        </p>
        
        <ul className="map-error-fallback__reasons">
          <li>Network connectivity issues</li>
          <li>Map tile server problems</li>
          <li>Browser compatibility issues</li>
          <li>Insufficient memory or resources</li>
        </ul>
        
        <div className="map-error-fallback__actions">
          <button 
            className="map-error-fallback__button"
            onClick={handleRetry}
            disabled={isRetrying}
          >
            {isRetrying ? 'Retrying...' : 'Retry Loading Map'}
          </button>
        </div>
        
        <div className="map-error-fallback__help">
          <p>If the problem persists:</p>
          <ul>
            <li>Check your internet connection</li>
            <li>Try refreshing the page</li>
            <li>Clear your browser cache</li>
            <li>Try a different browser</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Data loading error boundary
export const DataErrorBoundary: React.FC<{
  children: ReactNode;
  onError?: (error: Error) => void;
  fallbackData?: any[];
}> = ({ children, onError, fallbackData = [] }) => {
  return (
    <ErrorBoundary
      component="DataLoader"
      onError={(error) => onError?.(error)}
      fallback={<DataErrorFallback fallbackData={fallbackData} />}
    >
      {children}
    </ErrorBoundary>
  );
};

// Data loading error fallback
const DataErrorFallback: React.FC<{ fallbackData: any[] }> = ({ fallbackData }) => {
  return (
    <div className="data-error-fallback">
      <div className="data-error-fallback__content">
        <h3>Data Loading Error</h3>
        <p>
          Unable to load the latest data. 
          {fallbackData.length > 0 
            ? ` Showing ${fallbackData.length} cached items.`
            : ' No cached data available.'
          }
        </p>
        
        {fallbackData.length === 0 && (
          <div className="data-error-fallback__empty">
            <p>Try:</p>
            <ul>
              <li>Checking your internet connection</li>
              <li>Refreshing the page</li>
              <li>Trying again later</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

// Hook for using error boundaries programmatically
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
    errorHandler.handleError(error, {
      component: 'useErrorHandler',
      operation: 'manual_capture'
    });
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { captureError, resetError };
};