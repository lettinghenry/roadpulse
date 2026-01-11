/**
 * Comprehensive error handling utilities for the map visualization system
 * Handles API failures, network issues, map rendering errors, and performance degradation
 */

// Error types
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class NetworkError extends Error {
  constructor(
    message: string,
    public retryable: boolean = true
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class MapRenderError extends Error {
  constructor(
    message: string,
    public component?: string,
    public fallbackAvailable: boolean = true
  ) {
    super(message);
    this.name = 'MapRenderError';
  }
}

export class PerformanceError extends Error {
  constructor(
    message: string,
    public metric: string,
    public value: number,
    public threshold: number
  ) {
    super(message);
    this.name = 'PerformanceError';
  }
}

// Error severity levels
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Error context interface
export interface ErrorContext {
  component?: string;
  operation?: string;
  timestamp: number;
  userAgent?: string;
  viewport?: {
    width: number;
    height: number;
  };
  mapState?: {
    zoom: number;
    center: { lat: number; lng: number };
    bounds: any;
  };
  additionalData?: Record<string, any>;
}

// Error report interface
export interface ErrorReport {
  error: Error;
  severity: ErrorSeverity;
  context: ErrorContext;
  id: string;
  handled: boolean;
  retryCount: number;
  maxRetries: number;
}

// Retry configuration
export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
  retryableErrors: string[];
}

// Default retry configuration
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffFactor: 2,
  retryableErrors: ['NetworkError', 'ApiError', 'TypeError']
};

// Error handler class
export class ErrorHandler {
  private errorReports = new Map<string, ErrorReport>();
  private errorCallbacks = new Set<(report: ErrorReport) => void>();
  private retryConfig: RetryConfig;
  private isOnline = navigator.onLine;

  constructor(config: Partial<RetryConfig> = {}) {
    this.retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
    this.setupOnlineStatusMonitoring();
  }

  /**
   * Handle an error with automatic retry logic and fallback strategies
   */
  async handleError(
    error: Error,
    context: Partial<ErrorContext> = {},
    retryFn?: () => Promise<any>
  ): Promise<any> {
    const errorId = this.generateErrorId();
    const severity = this.determineSeverity(error);
    const fullContext = this.enrichContext(context);

    const report: ErrorReport = {
      error,
      severity,
      context: fullContext,
      id: errorId,
      handled: false,
      retryCount: 0,
      maxRetries: this.retryConfig.maxRetries
    };

    this.errorReports.set(errorId, report);
    this.notifyErrorCallbacks(report);

    // Log error for debugging
    this.logError(report);

    // Handle based on error type and severity
    if (this.shouldRetry(error, report) && retryFn) {
      return this.executeWithRetry(retryFn, report);
    }

    // Apply fallback strategies
    return this.applyFallbackStrategy(error, context);
  }

  /**
   * Execute a function with exponential backoff retry logic
   */
  async executeWithRetry<T>(
    fn: () => Promise<T>,
    report: ErrorReport
  ): Promise<T> {
    let lastError: Error = report.error;

    for (let attempt = 0; attempt <= report.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.calculateDelay(attempt);
          await this.sleep(delay);
          
          // Check if we're back online for network-related errors
          if (!this.isOnline && this.isNetworkError(lastError)) {
            throw new NetworkError('Still offline, skipping retry');
          }
        }

        const result = await fn();
        
        // Mark as handled if successful
        report.handled = true;
        report.retryCount = attempt;
        
        return result;
      } catch (error) {
        lastError = error as Error;
        report.retryCount = attempt + 1;
        
        // Don't retry if error is not retryable
        if (!this.shouldRetry(lastError, report)) {
          break;
        }
        
        // Log retry attempt
        console.warn(`Retry attempt ${attempt + 1}/${report.maxRetries} failed:`, error);
      }
    }

    // All retries exhausted, apply fallback
    return this.applyFallbackStrategy(lastError, report.context);
  }

  /**
   * Apply fallback strategies based on error type
   */
  private applyFallbackStrategy(error: Error, context: ErrorContext): any {
    if (error instanceof ApiError || error instanceof NetworkError) {
      return this.handleDataLoadingFailure(error, context);
    }

    if (error instanceof MapRenderError) {
      return this.handleMapRenderingFailure(error, context);
    }

    if (error instanceof PerformanceError) {
      return this.handlePerformanceFailure(error, context);
    }

    // Generic fallback
    return this.handleGenericFailure(error, context);
  }

  /**
   * Handle data loading failures with cached data fallback
   */
  private handleDataLoadingFailure(error: Error, context: ErrorContext): any {
    console.warn('Data loading failed, attempting fallback strategies:', error);

    // Strategy 1: Try to use cached data
    if (context.operation === 'data_loading') {
      // This would integrate with the DataManager's cache
      console.log('Attempting to use cached data as fallback');
      return { fallback: 'cached_data', error: error.message };
    }

    // Strategy 2: Return empty dataset with error indicator
    return {
      fallback: 'empty_dataset',
      error: error.message,
      offline: !this.isOnline,
      retryable: error instanceof NetworkError || error instanceof ApiError
    };
  }

  /**
   * Handle map rendering failures with component fallbacks
   */
  private handleMapRenderingFailure(error: MapRenderError, context: ErrorContext): any {
    console.warn('Map rendering failed, applying fallback:', error);

    const fallbacks: Record<string, any> = {
      'clustering': {
        fallback: 'simple_markers',
        message: 'Clustering unavailable, showing individual markers'
      },
      'heatmap': {
        fallback: 'markers',
        message: 'Heat map unavailable, switching to marker view'
      },
      'tiles': {
        fallback: 'alternative_provider',
        message: 'Map tiles unavailable, using alternative provider'
      },
      'geolocation': {
        fallback: 'manual_location',
        message: 'Location services unavailable, please set location manually'
      }
    };

    const component = error.component || 'unknown';
    return fallbacks[component] || {
      fallback: 'basic_map',
      message: 'Advanced features unavailable, using basic map'
    };
  }

  /**
   * Handle performance failures with automatic optimizations
   */
  private handlePerformanceFailure(error: PerformanceError, context: ErrorContext): any {
    console.warn('Performance issue detected, applying optimizations:', error);

    const optimizations: Record<string, any> = {
      'fps': {
        reduceMarkers: true,
        disableAnimations: true,
        increaseClusterRadius: true
      },
      'memory': {
        clearCache: true,
        reduceDataset: true,
        enableVirtualization: true
      },
      'load_time': {
        enableProgressiveLoading: true,
        reduceInitialDataset: true,
        prioritizeViewport: true
      }
    };

    return optimizations[error.metric] || {
      enableBasicMode: true,
      message: 'Performance optimizations applied'
    };
  }

  /**
   * Handle generic failures
   */
  private handleGenericFailure(error: Error, context: ErrorContext): any {
    console.error('Unhandled error occurred:', error);
    
    return {
      fallback: 'error_state',
      error: error.message,
      context: context.component || 'unknown',
      recoverable: true
    };
  }

  /**
   * Subscribe to error notifications
   */
  onError(callback: (report: ErrorReport) => void): () => void {
    this.errorCallbacks.add(callback);
    return () => this.errorCallbacks.delete(callback);
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const reports = Array.from(this.errorReports.values());
    
    return {
      totalErrors: reports.length,
      handledErrors: reports.filter(r => r.handled).length,
      errorsBySeverity: {
        low: reports.filter(r => r.severity === ErrorSeverity.LOW).length,
        medium: reports.filter(r => r.severity === ErrorSeverity.MEDIUM).length,
        high: reports.filter(r => r.severity === ErrorSeverity.HIGH).length,
        critical: reports.filter(r => r.severity === ErrorSeverity.CRITICAL).length
      },
      errorsByType: this.groupErrorsByType(reports),
      averageRetries: reports.reduce((sum, r) => sum + r.retryCount, 0) / reports.length || 0
    };
  }

  /**
   * Clear error history
   */
  clearErrors(): void {
    this.errorReports.clear();
  }

  // Private helper methods

  private setupOnlineStatusMonitoring(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      console.log('Network connection restored');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      console.log('Network connection lost');
    });
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private determineSeverity(error: Error): ErrorSeverity {
    if (error instanceof PerformanceError) {
      return error.value > error.threshold * 2 ? ErrorSeverity.HIGH : ErrorSeverity.MEDIUM;
    }

    if (error instanceof MapRenderError) {
      return error.fallbackAvailable ? ErrorSeverity.MEDIUM : ErrorSeverity.HIGH;
    }

    if (error instanceof NetworkError) {
      return this.isOnline ? ErrorSeverity.MEDIUM : ErrorSeverity.HIGH;
    }

    if (error instanceof ApiError) {
      if (error.status && error.status >= 500) {
        return ErrorSeverity.HIGH;
      }
      return ErrorSeverity.MEDIUM;
    }

    return ErrorSeverity.LOW;
  }

  private enrichContext(context: Partial<ErrorContext>): ErrorContext {
    return {
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      ...context
    };
  }

  private shouldRetry(error: Error, report: ErrorReport): boolean {
    if (report.retryCount >= report.maxRetries) {
      return false;
    }

    // Don't retry if offline for network errors
    if (!this.isOnline && this.isNetworkError(error)) {
      return false;
    }

    // Check if error type is retryable
    return this.retryConfig.retryableErrors.includes(error.name);
  }

  private isNetworkError(error: Error): boolean {
    return error instanceof NetworkError || 
           (error instanceof TypeError && error.message.includes('fetch'));
  }

  private calculateDelay(attempt: number): number {
    const delay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffFactor, attempt - 1);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private notifyErrorCallbacks(report: ErrorReport): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(report);
      } catch (error) {
        console.error('Error in error callback:', error);
      }
    });
  }

  private logError(report: ErrorReport): void {
    const logLevel = report.severity === ErrorSeverity.CRITICAL ? 'error' : 'warn';
    console[logLevel](`[${report.severity.toUpperCase()}] ${report.error.name}: ${report.error.message}`, {
      id: report.id,
      context: report.context,
      stack: report.error.stack
    });
  }

  private groupErrorsByType(reports: ErrorReport[]): Record<string, number> {
    return reports.reduce((acc, report) => {
      const type = report.error.name;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler();

// Utility functions for common error scenarios

/**
 * Wrap async operations with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: Partial<ErrorContext> = {}
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    await errorHandler.handleError(error as Error, context, operation);
    return null;
  }
}

/**
 * Create a resilient fetch function with retry logic
 */
export async function resilientFetch(
  url: string,
  options: RequestInit = {},
  context: Partial<ErrorContext> = {}
): Promise<Response> {
  const fetchOperation = async () => {
    const response = await fetch(url, options);
    
    if (!response.ok) {
      throw new ApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        undefined,
        response.status >= 500 || response.status === 429 // Retry server errors and rate limits
      );
    }
    
    return response;
  };

  return errorHandler.handleError(
    new Error('Fetch operation'),
    { ...context, operation: 'fetch' },
    fetchOperation
  );
}

/**
 * Wrap component rendering with error boundaries
 */
export function withRenderErrorHandling<T extends React.ComponentType<any>>(
  Component: T,
  fallbackComponent?: React.ComponentType<{ error: Error }>
): T {
  const WrappedComponent = (props: any) => {
    try {
      return React.createElement(Component, props);
    } catch (error) {
      errorHandler.handleError(
        error as Error,
        { component: Component.name || 'Unknown', operation: 'render' }
      );
      
      if (fallbackComponent) {
        return React.createElement(fallbackComponent, { error: error as Error });
      }
      
      return React.createElement('div', {
        className: 'error-fallback',
        children: 'Component failed to render'
      });
    }
  };

  return WrappedComponent as T;
}