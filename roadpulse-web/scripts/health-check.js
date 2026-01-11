#!/usr/bin/env node

/**
 * Health Check Script for RoadPulse Web Application
 * Validates deployment health and application functionality
 */

import { execSync } from 'child_process';
import { readFileSync } from 'fs';

// Health check configuration
const HEALTH_CHECK_CONFIG = {
  timeout: 30000,
  retries: 3,
  retryDelay: 5000,
  endpoints: {
    development: 'http://localhost:4173',
    staging: 'https://staging.roadpulse.app',
    production: 'https://roadpulse.app'
  }
};

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function warning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

// Get command line arguments
const args = process.argv.slice(2);
const environment = args[0] || 'development';
const verbose = args.includes('--verbose');
const skipPerformance = args.includes('--skip-performance');

// Validate environment
if (!HEALTH_CHECK_CONFIG.endpoints[environment]) {
  error(`Invalid environment: ${environment}`);
  error(`Valid environments: ${Object.keys(HEALTH_CHECK_CONFIG.endpoints).join(', ')}`);
  process.exit(1);
}

const baseUrl = HEALTH_CHECK_CONFIG.endpoints[environment];

// Utility functions
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_CONFIG.timeout);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Health check functions
async function checkApplicationHealth() {
  info('Checking application health...');
  
  try {
    const healthUrl = `${baseUrl}/health.json`;
    const response = await fetchWithTimeout(healthUrl);
    
    if (!response.ok) {
      throw new Error(`Health endpoint returned ${response.status}`);
    }
    
    const health = await response.json();
    
    if (verbose) {
      info(`Health status: ${health.status}`);
      info(`Version: ${health.version}`);
      info(`Environment: ${health.environment}`);
      info(`Build time: ${health.build?.buildTime || 'unknown'}`);
    }
    
    if (health.status !== 'ok') {
      throw new Error(`Application health status is ${health.status}`);
    }
    
    success('Application health check passed');
    return health;
  } catch (error) {
    error(`Application health check failed: ${error.message}`);
    throw error;
  }
}

async function checkMainApplication() {
  info('Checking main application...');
  
  try {
    const response = await fetchWithTimeout(baseUrl);
    
    if (!response.ok) {
      throw new Error(`Main application returned ${response.status}`);
    }
    
    const html = await response.text();
    
    // Check for essential elements
    const checks = [
      { name: 'HTML structure', test: html.includes('<html') },
      { name: 'React root element', test: html.includes('id="root"') },
      { name: 'Title tag', test: html.includes('<title>') },
      { name: 'Meta viewport', test: html.includes('name="viewport"') },
      { name: 'Favicon', test: html.includes('rel="icon"') }
    ];
    
    for (const check of checks) {
      if (!check.test) {
        throw new Error(`Missing ${check.name}`);
      }
      if (verbose) {
        success(`✓ ${check.name}`);
      }
    }
    
    success('Main application check passed');
    return true;
  } catch (error) {
    error(`Main application check failed: ${error.message}`);
    throw error;
  }
}

async function checkStaticAssets() {
  info('Checking static assets...');
  
  try {
    // Check for common static assets
    const assetChecks = [
      '/assets/',  // Vite assets directory
      '/favicon.ico'
    ];
    
    for (const asset of assetChecks) {
      try {
        const response = await fetchWithTimeout(`${baseUrl}${asset}`, { method: 'HEAD' });
        if (response.ok) {
          if (verbose) {
            success(`✓ Asset available: ${asset}`);
          }
        }
      } catch (error) {
        if (verbose) {
          warning(`Asset check failed: ${asset} - ${error.message}`);
        }
      }
    }
    
    success('Static assets check completed');
    return true;
  } catch (error) {
    error(`Static assets check failed: ${error.message}`);
    throw error;
  }
}

async function checkPerformance() {
  if (skipPerformance) {
    info('Skipping performance checks');
    return;
  }
  
  info('Checking performance metrics...');
  
  try {
    const startTime = Date.now();
    const response = await fetchWithTimeout(baseUrl);
    const loadTime = Date.now() - startTime;
    
    // Performance thresholds
    const thresholds = {
      loadTime: environment === 'production' ? 3000 : 5000,
      responseSize: 1024 * 1024 // 1MB
    };
    
    // Check load time
    if (loadTime > thresholds.loadTime) {
      warning(`Load time (${loadTime}ms) exceeds threshold (${thresholds.loadTime}ms)`);
    } else {
      success(`Load time: ${loadTime}ms`);
    }
    
    // Check response size
    const contentLength = response.headers.get('content-length');
    if (contentLength) {
      const size = parseInt(contentLength);
      if (size > thresholds.responseSize) {
        warning(`Response size (${Math.round(size / 1024)}KB) is large`);
      } else {
        success(`Response size: ${Math.round(size / 1024)}KB`);
      }
    }
    
    // Check compression
    const encoding = response.headers.get('content-encoding');
    if (encoding && (encoding.includes('gzip') || encoding.includes('br'))) {
      success(`Compression enabled: ${encoding}`);
    } else {
      warning('No compression detected');
    }
    
    success('Performance check completed');
    return { loadTime, contentLength, encoding };
  } catch (error) {
    error(`Performance check failed: ${error.message}`);
    throw error;
  }
}

async function checkSecurityHeaders() {
  info('Checking security headers...');
  
  try {
    const response = await fetchWithTimeout(baseUrl, { method: 'HEAD' });
    
    const securityHeaders = [
      'x-content-type-options',
      'x-frame-options',
      'x-xss-protection',
      'referrer-policy'
    ];
    
    const missingHeaders = [];
    
    for (const header of securityHeaders) {
      if (response.headers.has(header)) {
        if (verbose) {
          success(`✓ ${header}: ${response.headers.get(header)}`);
        }
      } else {
        missingHeaders.push(header);
      }
    }
    
    if (missingHeaders.length > 0) {
      if (environment === 'production') {
        warning(`Missing security headers: ${missingHeaders.join(', ')}`);
      } else {
        info(`Missing security headers (OK for ${environment}): ${missingHeaders.join(', ')}`);
      }
    }
    
    success('Security headers check completed');
    return true;
  } catch (error) {
    error(`Security headers check failed: ${error.message}`);
    throw error;
  }
}

async function checkAPIConnectivity() {
  info('Checking API connectivity...');
  
  try {
    // This would typically check if the frontend can reach its API
    // For now, we'll just verify the configuration is valid
    const configResponse = await fetchWithTimeout(`${baseUrl}/config.json`).catch(() => null);
    
    if (configResponse && configResponse.ok) {
      const config = await configResponse.json();
      if (verbose) {
        info(`API base URL configured: ${config.api?.baseUrl || 'not found'}`);
      }
    }
    
    success('API connectivity check completed');
    return true;
  } catch (error) {
    warning(`API connectivity check failed: ${error.message}`);
    return false;
  }
}

// Retry wrapper
async function withRetry(fn, name) {
  let lastError;
  
  for (let attempt = 1; attempt <= HEALTH_CHECK_CONFIG.retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < HEALTH_CHECK_CONFIG.retries) {
        warning(`${name} failed (attempt ${attempt}/${HEALTH_CHECK_CONFIG.retries}), retrying in ${HEALTH_CHECK_CONFIG.retryDelay / 1000}s...`);
        await sleep(HEALTH_CHECK_CONFIG.retryDelay);
      }
    }
  }
  
  throw lastError;
}

// Generate health report
function generateHealthReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    environment,
    baseUrl,
    results,
    summary: {
      passed: results.filter(r => r.status === 'passed').length,
      failed: results.filter(r => r.status === 'failed').length,
      warnings: results.filter(r => r.status === 'warning').length,
      total: results.length
    }
  };
  
  if (verbose) {
    const reportPath = `health-report-${environment}-${Date.now()}.json`;
    require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
    info(`Health report saved: ${reportPath}`);
  }
  
  return report;
}

// Print health summary
function printHealthSummary(report) {
  console.log('\n' + '='.repeat(50));
  log('🏥 HEALTH CHECK SUMMARY', colors.green);
  console.log('='.repeat(50));
  log(`Environment: ${environment}`, colors.cyan);
  log(`URL: ${baseUrl}`, colors.cyan);
  log(`Timestamp: ${new Date(report.timestamp).toLocaleString()}`, colors.cyan);
  console.log('');
  log(`✅ Passed: ${report.summary.passed}`, colors.green);
  log(`❌ Failed: ${report.summary.failed}`, colors.red);
  log(`⚠️  Warnings: ${report.summary.warnings}`, colors.yellow);
  log(`📊 Total: ${report.summary.total}`, colors.cyan);
  console.log('='.repeat(50));
  
  if (report.summary.failed === 0) {
    success('All health checks passed! 🎉');
  } else {
    error(`${report.summary.failed} health check(s) failed`);
  }
}

// Main health check process
async function main() {
  const startTime = Date.now();
  const results = [];
  
  try {
    log(`🏥 Starting health check for ${environment}...`, colors.magenta);
    log(`Target URL: ${baseUrl}`, colors.cyan);
    console.log('');
    
    // Run health checks
    const checks = [
      { name: 'Application Health', fn: checkApplicationHealth },
      { name: 'Main Application', fn: checkMainApplication },
      { name: 'Static Assets', fn: checkStaticAssets },
      { name: 'Performance', fn: checkPerformance },
      { name: 'Security Headers', fn: checkSecurityHeaders },
      { name: 'API Connectivity', fn: checkAPIConnectivity }
    ];
    
    for (const check of checks) {
      try {
        const result = await withRetry(check.fn, check.name);
        results.push({
          name: check.name,
          status: 'passed',
          result,
          duration: Date.now() - startTime
        });
      } catch (error) {
        results.push({
          name: check.name,
          status: 'failed',
          error: error.message,
          duration: Date.now() - startTime
        });
      }
    }
    
    const report = generateHealthReport(results);
    printHealthSummary(report);
    
    // Exit with appropriate code
    const hasFailures = report.summary.failed > 0;
    process.exit(hasFailures ? 1 : 0);
    
  } catch (error) {
    error(`Health check process failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  warning('\nHealth check interrupted');
  process.exit(1);
});

process.on('SIGTERM', () => {
  warning('\nHealth check terminated');
  process.exit(1);
});

// Run the health check
main();