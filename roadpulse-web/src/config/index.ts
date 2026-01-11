/**
 * Application Configuration Management
 * Centralizes all environment variables and configuration settings
 */

// Environment type
export type Environment = 'development' | 'staging' | 'production';

// Configuration interface
export interface AppConfig {
  // Environment
  environment: Environment;
  version: string;
  buildTime: string;
  
  // API Configuration
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    key?: string;
  };
  
  // Map Configuration
  map: {
    defaultCenter: {
      lat: number;
      lng: number;
    };
    defaultZoom: number;
    tileServers: {
      street: string;
      satellite: string;
    };
  };
  
  // Performance Configuration
  performance: {
    enableMonitoring: boolean;
    sampleRate: number;
    maxVisibleMarkers: number;
    clusterRadius: number;
    heatMapRadius: number;
  };
  
  // Cache Configuration
  cache: {
    duration: number;
    maxSize: number;
    offlineDataTtl: number;
  };
  
  // Feature Flags
  features: {
    clustering: boolean;
    heatMap: boolean;
    filtering: boolean;
    offlineMode: boolean;
    accessibility: boolean;
    performanceOptimizations: boolean;
  };
  
  // Analytics Configuration
  analytics: {
    enabled: boolean;
    endpoint?: string;
    errorReporting?: string;
    performanceReporting?: string;
  };
  
  // Development Configuration
  development: {
    debugMode: boolean;
    showPerformanceMonitor: boolean;
    mockApiResponses: boolean;
    logLevel: 'debug' | 'info' | 'warn' | 'error';
  };
  
  // Security Configuration
  security: {
    enableCSP: boolean;
    allowedOrigins: string[];
  };
}

// Helper function to parse boolean environment variables
function parseBoolean(value: string | undefined, defaultValue: boolean = false): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

// Helper function to parse number environment variables
function parseNumber(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = Number(value);
  return isNaN(parsed) ? defaultValue : parsed;
}

// Helper function to parse array environment variables
function parseArray(value: string | undefined, defaultValue: string[] = []): string[] {
  if (!value) return defaultValue;
  return value.split(',').map(item => item.trim()).filter(Boolean);
}

// Create configuration from environment variables
function createConfig(): AppConfig {
  const environment = (import.meta.env.VITE_DEPLOYMENT_ENVIRONMENT || 'development') as Environment;
  
  return {
    // Environment
    environment,
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    buildTime: import.meta.env.VITE_BUILD_TIMESTAMP || new Date().toISOString(),
    
    // API Configuration
    api: {
      baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api',
      timeout: parseNumber(import.meta.env.VITE_API_TIMEOUT, 30000),
      retryAttempts: parseNumber(import.meta.env.VITE_API_RETRY_ATTEMPTS, 3),
      key: import.meta.env.VITE_API_KEY,
    },
    
    // Map Configuration
    map: {
      defaultCenter: {
        lat: parseNumber(import.meta.env.VITE_DEFAULT_MAP_CENTER_LAT, 40.7128),
        lng: parseNumber(import.meta.env.VITE_DEFAULT_MAP_CENTER_LNG, -74.0060),
      },
      defaultZoom: parseNumber(import.meta.env.VITE_DEFAULT_MAP_ZOOM, 12),
      tileServers: {
        street: import.meta.env.VITE_MAP_TILE_SERVER || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        satellite: import.meta.env.VITE_SATELLITE_TILE_SERVER || 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      },
    },
    
    // Performance Configuration
    performance: {
      enableMonitoring: parseBoolean(import.meta.env.VITE_ENABLE_PERFORMANCE_MONITORING, true),
      sampleRate: parseNumber(import.meta.env.VITE_PERFORMANCE_SAMPLE_RATE, 0.1),
      maxVisibleMarkers: parseNumber(import.meta.env.VITE_MAX_VISIBLE_MARKERS, 1000),
      clusterRadius: parseNumber(import.meta.env.VITE_CLUSTER_RADIUS, 60),
      heatMapRadius: parseNumber(import.meta.env.VITE_HEAT_MAP_RADIUS, 25),
    },
    
    // Cache Configuration
    cache: {
      duration: parseNumber(import.meta.env.VITE_CACHE_DURATION, 600000),
      maxSize: parseNumber(import.meta.env.VITE_MAX_CACHE_SIZE, 52428800),
      offlineDataTtl: parseNumber(import.meta.env.VITE_OFFLINE_DATA_TTL, 604800000),
    },
    
    // Feature Flags
    features: {
      clustering: parseBoolean(import.meta.env.VITE_ENABLE_CLUSTERING, true),
      heatMap: parseBoolean(import.meta.env.VITE_ENABLE_HEAT_MAP, true),
      filtering: parseBoolean(import.meta.env.VITE_ENABLE_FILTERING, true),
      offlineMode: parseBoolean(import.meta.env.VITE_ENABLE_OFFLINE_MODE, true),
      accessibility: parseBoolean(import.meta.env.VITE_ENABLE_ACCESSIBILITY_FEATURES, true),
      performanceOptimizations: parseBoolean(import.meta.env.VITE_ENABLE_PERFORMANCE_OPTIMIZATIONS, true),
    },
    
    // Analytics Configuration
    analytics: {
      enabled: parseBoolean(import.meta.env.VITE_ENABLE_ANALYTICS, false),
      endpoint: import.meta.env.VITE_ANALYTICS_ENDPOINT,
      errorReporting: import.meta.env.VITE_ERROR_REPORTING_ENDPOINT,
      performanceReporting: import.meta.env.VITE_PERFORMANCE_REPORTING_ENDPOINT,
    },
    
    // Development Configuration
    development: {
      debugMode: parseBoolean(import.meta.env.VITE_ENABLE_DEBUG_MODE, false),
      showPerformanceMonitor: parseBoolean(import.meta.env.VITE_SHOW_PERFORMANCE_MONITOR, false),
      mockApiResponses: parseBoolean(import.meta.env.VITE_MOCK_API_RESPONSES, false),
      logLevel: (import.meta.env.VITE_LOG_LEVEL as AppConfig['development']['logLevel']) || 'info',
    },
    
    // Security Configuration
    security: {
      enableCSP: parseBoolean(import.meta.env.VITE_ENABLE_CSP, true),
      allowedOrigins: parseArray(import.meta.env.VITE_ALLOWED_ORIGINS, ['http://localhost:3000']),
    },
  };
}

// Export the configuration
export const config = createConfig();

// Configuration validation
export function validateConfig(config: AppConfig): string[] {
  const errors: string[] = [];
  
  // Validate required fields
  if (!config.api.baseUrl) {
    errors.push('API base URL is required');
  }
  
  if (!config.map.tileServers.street) {
    errors.push('Street map tile server is required');
  }
  
  if (!config.map.tileServers.satellite) {
    errors.push('Satellite map tile server is required');
  }
  
  // Validate numeric ranges
  if (config.map.defaultCenter.lat < -90 || config.map.defaultCenter.lat > 90) {
    errors.push('Default map center latitude must be between -90 and 90');
  }
  
  if (config.map.defaultCenter.lng < -180 || config.map.defaultCenter.lng > 180) {
    errors.push('Default map center longitude must be between -180 and 180');
  }
  
  if (config.map.defaultZoom < 1 || config.map.defaultZoom > 18) {
    errors.push('Default map zoom must be between 1 and 18');
  }
  
  if (config.performance.sampleRate < 0 || config.performance.sampleRate > 1) {
    errors.push('Performance sample rate must be between 0 and 1');
  }
  
  // Validate URLs
  try {
    new URL(config.api.baseUrl);
  } catch {
    errors.push('API base URL must be a valid URL');
  }
  
  if (config.analytics.endpoint) {
    try {
      new URL(config.analytics.endpoint);
    } catch {
      errors.push('Analytics endpoint must be a valid URL');
    }
  }
  
  return errors;
}

// Runtime configuration validation
const configErrors = validateConfig(config);
if (configErrors.length > 0) {
  console.error('Configuration validation errors:', configErrors);
  if (config.environment === 'production') {
    throw new Error(`Invalid configuration: ${configErrors.join(', ')}`);
  }
}

// Export utilities
export { Environment };
export default config;