/**
 * Deployment Configuration for RoadPulse Web Application
 * Centralizes deployment settings for different environments
 */

export const deploymentConfig = {
  // Environment configurations
  environments: {
    development: {
      name: 'Development',
      domain: 'localhost:4173',
      protocol: 'http',
      apiUrl: 'http://localhost:3001/api',
      cdnUrl: null,
      
      // Build settings
      build: {
        sourcemap: true,
        minify: false,
        analyze: false,
        target: 'es2020'
      },
      
      // Performance settings
      performance: {
        budgets: {
          initial: '2MB',
          anyChunkFile: '1MB',
          anyAssetFile: '500KB'
        },
        monitoring: false
      },
      
      // Security settings
      security: {
        csp: false,
        hsts: false,
        httpsRedirect: false
      },
      
      // Caching settings
      caching: {
        staticAssets: '1h',
        htmlFiles: '0',
        serviceWorker: '0'
      }
    },
    
    staging: {
      name: 'Staging',
      domain: 'staging.roadpulse.app',
      protocol: 'https',
      apiUrl: 'https://api-staging.roadpulse.app/api',
      cdnUrl: 'https://cdn-staging.roadpulse.app',
      
      // Build settings
      build: {
        sourcemap: true,
        minify: true,
        analyze: true,
        target: 'es2018'
      },
      
      // Performance settings
      performance: {
        budgets: {
          initial: '1.5MB',
          anyChunkFile: '750KB',
          anyAssetFile: '300KB'
        },
        monitoring: true,
        lighthouse: {
          performance: 80,
          accessibility: 90,
          bestPractices: 90,
          seo: 80
        }
      },
      
      // Security settings
      security: {
        csp: true,
        hsts: true,
        httpsRedirect: true,
        allowedOrigins: ['https://staging.roadpulse.app']
      },
      
      // Caching settings
      caching: {
        staticAssets: '1y',
        htmlFiles: '1h',
        serviceWorker: '0'
      },
      
      // Deployment settings
      deployment: {
        strategy: 'blue-green',
        healthCheck: {
          enabled: true,
          timeout: 30000,
          retries: 3
        },
        rollback: {
          enabled: true,
          automatic: false
        }
      }
    },
    
    production: {
      name: 'Production',
      domain: 'roadpulse.app',
      protocol: 'https',
      apiUrl: 'https://api.roadpulse.app/api',
      cdnUrl: 'https://cdn.roadpulse.app',
      
      // Build settings
      build: {
        sourcemap: false,
        minify: true,
        analyze: true,
        target: 'es2018'
      },
      
      // Performance settings
      performance: {
        budgets: {
          initial: '1MB',
          anyChunkFile: '500KB',
          anyAssetFile: '250KB'
        },
        monitoring: true,
        lighthouse: {
          performance: 90,
          accessibility: 95,
          bestPractices: 95,
          seo: 90
        }
      },
      
      // Security settings
      security: {
        csp: true,
        hsts: true,
        httpsRedirect: true,
        allowedOrigins: ['https://roadpulse.app']
      },
      
      // Caching settings
      caching: {
        staticAssets: '1y',
        htmlFiles: '1h',
        serviceWorker: '0'
      },
      
      // Deployment settings
      deployment: {
        strategy: 'blue-green',
        healthCheck: {
          enabled: true,
          timeout: 60000,
          retries: 5
        },
        rollback: {
          enabled: true,
          automatic: true,
          threshold: {
            errorRate: 0.05,
            responseTime: 5000
          }
        },
        canary: {
          enabled: true,
          percentage: 10,
          duration: 300000 // 5 minutes
        }
      }
    }
  },
  
  // Infrastructure configurations
  infrastructure: {
    docker: {
      registry: 'ghcr.io',
      namespace: 'roadpulse',
      image: 'roadpulse-web',
      
      // Resource limits
      resources: {
        development: {
          cpu: '0.5',
          memory: '512Mi'
        },
        staging: {
          cpu: '1',
          memory: '1Gi'
        },
        production: {
          cpu: '2',
          memory: '2Gi'
        }
      }
    },
    
    kubernetes: {
      namespace: 'roadpulse',
      
      // Replica configurations
      replicas: {
        development: 1,
        staging: 2,
        production: 3
      },
      
      // Service configurations
      service: {
        type: 'ClusterIP',
        port: 8080,
        targetPort: 8080
      },
      
      // Ingress configurations
      ingress: {
        className: 'nginx',
        annotations: {
          'nginx.ingress.kubernetes.io/ssl-redirect': 'true',
          'nginx.ingress.kubernetes.io/force-ssl-redirect': 'true',
          'nginx.ingress.kubernetes.io/proxy-body-size': '10m',
          'nginx.ingress.kubernetes.io/rate-limit': '100',
          'nginx.ingress.kubernetes.io/rate-limit-window': '1m'
        }
      }
    },
    
    monitoring: {
      prometheus: {
        enabled: true,
        scrapeInterval: '30s',
        path: '/metrics'
      },
      
      grafana: {
        enabled: true,
        dashboards: [
          'application-performance',
          'infrastructure-metrics',
          'user-experience'
        ]
      },
      
      alerting: {
        enabled: true,
        rules: [
          {
            name: 'high-error-rate',
            condition: 'error_rate > 0.05',
            duration: '5m'
          },
          {
            name: 'high-response-time',
            condition: 'response_time_p95 > 3000',
            duration: '5m'
          },
          {
            name: 'low-availability',
            condition: 'availability < 0.99',
            duration: '2m'
          }
        ]
      }
    }
  },
  
  // CI/CD configurations
  cicd: {
    triggers: {
      development: ['push:develop', 'pull_request:develop'],
      staging: ['push:main'],
      production: ['release:published']
    },
    
    pipeline: {
      stages: [
        'quality-checks',
        'security-scan',
        'build',
        'test',
        'deploy',
        'verify'
      ],
      
      parallelization: {
        'quality-checks': ['lint', 'type-check', 'unit-tests'],
        'security-scan': ['dependency-audit', 'code-scan'],
        'build': ['build-app', 'build-docker'],
        'test': ['integration-tests', 'e2e-tests'],
        'verify': ['health-check', 'performance-test']
      }
    },
    
    notifications: {
      slack: {
        enabled: true,
        channels: {
          success: '#deployments',
          failure: '#alerts'
        }
      },
      
      email: {
        enabled: true,
        recipients: ['devops@roadpulse.app']
      }
    }
  },
  
  // Feature flags
  features: {
    development: {
      debugMode: true,
      performanceMonitoring: true,
      errorReporting: false,
      analytics: false
    },
    
    staging: {
      debugMode: false,
      performanceMonitoring: true,
      errorReporting: true,
      analytics: true
    },
    
    production: {
      debugMode: false,
      performanceMonitoring: true,
      errorReporting: true,
      analytics: true
    }
  }
};

// Helper functions
export function getEnvironmentConfig(environment) {
  const config = deploymentConfig.environments[environment];
  if (!config) {
    throw new Error(`Unknown environment: ${environment}`);
  }
  return config;
}

export function getInfrastructureConfig() {
  return deploymentConfig.infrastructure;
}

export function getCICDConfig() {
  return deploymentConfig.cicd;
}

export function getFeatureFlags(environment) {
  const flags = deploymentConfig.features[environment];
  if (!flags) {
    throw new Error(`Unknown environment for feature flags: ${environment}`);
  }
  return flags;
}

// Validation functions
export function validateEnvironmentConfig(environment) {
  const config = getEnvironmentConfig(environment);
  const errors = [];
  
  // Required fields
  const requiredFields = ['name', 'domain', 'protocol', 'apiUrl'];
  for (const field of requiredFields) {
    if (!config[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // URL validation
  try {
    new URL(`${config.protocol}://${config.domain}`);
  } catch {
    errors.push('Invalid domain or protocol');
  }
  
  try {
    new URL(config.apiUrl);
  } catch {
    errors.push('Invalid API URL');
  }
  
  return errors;
}

export default deploymentConfig;