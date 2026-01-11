#!/usr/bin/env node

/**
 * Environment Validation Script for RoadPulse Web Application
 * Validates environment variables and configuration before deployment
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Environment validation configuration
const ENV_VALIDATION_CONFIG = {
  required: {
    all: [
      'VITE_API_BASE_URL',
      'VITE_DEPLOYMENT_ENVIRONMENT',
      'VITE_APP_VERSION'
    ],
    production: [
      'VITE_ANALYTICS_ENDPOINT',
      'VITE_ERROR_REPORTING_ENDPOINT',
      'VITE_API_KEY'
    ],
    staging: [
      'VITE_ANALYTICS_ENDPOINT',
      'VITE_ERROR_REPORTING_ENDPOINT'
    ]
  },
  
  validation: {
    'VITE_API_BASE_URL': {
      type: 'url',
      required: true,
      description: 'Base URL for API endpoints'
    },
    'VITE_API_TIMEOUT': {
      type: 'number',
      min: 1000,
      max: 60000,
      description: 'API request timeout in milliseconds'
    },
    'VITE_API_RETRY_ATTEMPTS': {
      type: 'number',
      min: 0,
      max: 5,
      description: 'Number of API retry attempts'
    },
    'VITE_DEFAULT_MAP_CENTER_LAT': {
      type: 'number',
      min: -90,
      max: 90,
      description: 'Default map center latitude'
    },
    'VITE_DEFAULT_MAP_CENTER_LNG': {
      type: 'number',
      min: -180,
      max: 180,
      description: 'Default map center longitude'
    },
    'VITE_DEFAULT_MAP_ZOOM': {
      type: 'number',
      min: 1,
      max: 18,
      description: 'Default map zoom level'
    },
    'VITE_MAP_TILE_SERVER': {
      type: 'url',
      required: true,
      description: 'Map tile server URL template'
    },
    'VITE_SATELLITE_TILE_SERVER': {
      type: 'url',
      required: true,
      description: 'Satellite tile server URL template'
    },
    'VITE_PERFORMANCE_SAMPLE_RATE': {
      type: 'number',
      min: 0,
      max: 1,
      description: 'Performance monitoring sample rate (0-1)'
    },
    'VITE_MAX_VISIBLE_MARKERS': {
      type: 'number',
      min: 100,
      max: 10000,
      description: 'Maximum number of visible markers'
    },
    'VITE_CLUSTER_RADIUS': {
      type: 'number',
      min: 20,
      max: 100,
      description: 'Clustering radius in pixels'
    },
    'VITE_HEAT_MAP_RADIUS': {
      type: 'number',
      min: 10,
      max: 50,
      description: 'Heat map radius in pixels'
    },
    'VITE_CACHE_DURATION': {
      type: 'number',
      min: 60000,
      max: 3600000,
      description: 'Cache duration in milliseconds'
    },
    'VITE_MAX_CACHE_SIZE': {
      type: 'number',
      min: 1048576,
      max: 104857600,
      description: 'Maximum cache size in bytes'
    },
    'VITE_ANALYTICS_ENDPOINT': {
      type: 'url',
      description: 'Analytics endpoint URL'
    },
    'VITE_ERROR_REPORTING_ENDPOINT': {
      type: 'url',
      description: 'Error reporting endpoint URL'
    },
    'VITE_PERFORMANCE_REPORTING_ENDPOINT': {
      type: 'url',
      description: 'Performance reporting endpoint URL'
    },
    'VITE_LOG_LEVEL': {
      type: 'enum',
      values: ['debug', 'info', 'warn', 'error'],
      description: 'Application log level'
    },
    'VITE_DEPLOYMENT_ENVIRONMENT': {
      type: 'enum',
      values: ['development', 'staging', 'production'],
      required: true,
      description: 'Deployment environment'
    },
    'VITE_APP_VERSION': {
      type: 'semver',
      required: true,
      description: 'Application version (semantic versioning)'
    }
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
const environment = args[0] || process.env.NODE_ENV || 'development';
const strict = args.includes('--strict');
const verbose = args.includes('--verbose');

// Load environment variables from file
function loadEnvironmentFile(env) {
  const envFile = `.env.${env}`;
  const envLocalFile = `.env.${env}.local`;
  const envVars = {};
  
  // Load base environment file
  if (existsSync(envFile)) {
    const content = readFileSync(envFile, 'utf8');
    parseEnvFile(content, envVars);
    if (verbose) {
      info(`Loaded environment file: ${envFile}`);
    }
  }
  
  // Load local override file
  if (existsSync(envLocalFile)) {
    const content = readFileSync(envLocalFile, 'utf8');
    parseEnvFile(content, envVars);
    if (verbose) {
      info(`Loaded local environment file: ${envLocalFile}`);
    }
  }
  
  // Merge with process.env (process.env takes precedence)
  return { ...envVars, ...process.env };
}

function parseEnvFile(content, envVars) {
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    
    // Parse key=value pairs
    const equalIndex = trimmed.indexOf('=');
    if (equalIndex > 0) {
      const key = trimmed.substring(0, equalIndex).trim();
      const value = trimmed.substring(equalIndex + 1).trim();
      
      // Remove quotes if present
      const unquotedValue = value.replace(/^["']|["']$/g, '');
      envVars[key] = unquotedValue;
    }
  }
}

// Validation functions
function validateUrl(value, name) {
  try {
    new URL(value);
    return { valid: true };
  } catch {
    return { valid: false, error: `Invalid URL format for ${name}` };
  }
}

function validateNumber(value, name, config) {
  const num = parseFloat(value);
  
  if (isNaN(num)) {
    return { valid: false, error: `${name} must be a number` };
  }
  
  if (config.min !== undefined && num < config.min) {
    return { valid: false, error: `${name} must be >= ${config.min}` };
  }
  
  if (config.max !== undefined && num > config.max) {
    return { valid: false, error: `${name} must be <= ${config.max}` };
  }
  
  return { valid: true };
}

function validateEnum(value, name, config) {
  if (!config.values.includes(value)) {
    return { 
      valid: false, 
      error: `${name} must be one of: ${config.values.join(', ')}` 
    };
  }
  
  return { valid: true };
}

function validateSemver(value, name) {
  const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*))?(?:\+([a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*))?$/;
  
  if (!semverRegex.test(value)) {
    return { 
      valid: false, 
      error: `${name} must follow semantic versioning (e.g., 1.0.0, 1.0.0-beta.1)` 
    };
  }
  
  return { valid: true };
}

function validateBoolean(value, name) {
  const booleanValues = ['true', 'false', '1', '0', 'yes', 'no'];
  
  if (!booleanValues.includes(value.toLowerCase())) {
    return { 
      valid: false, 
      error: `${name} must be a boolean value (true/false, 1/0, yes/no)` 
    };
  }
  
  return { valid: true };
}

// Main validation function
function validateEnvironmentVariable(name, value, config) {
  if (!value || value.trim() === '') {
    if (config.required) {
      return { valid: false, error: `${name} is required but not set` };
    }
    return { valid: true, skipped: true };
  }
  
  switch (config.type) {
    case 'url':
      return validateUrl(value, name);
    case 'number':
      return validateNumber(value, name, config);
    case 'enum':
      return validateEnum(value, name, config);
    case 'semver':
      return validateSemver(value, name);
    case 'boolean':
      return validateBoolean(value, name);
    default:
      return { valid: true };
  }
}

// Check required variables
function checkRequiredVariables(envVars, environment) {
  const errors = [];
  const requiredVars = [
    ...ENV_VALIDATION_CONFIG.required.all,
    ...(ENV_VALIDATION_CONFIG.required[environment] || [])
  ];
  
  for (const varName of requiredVars) {
    if (!envVars[varName] || envVars[varName].trim() === '') {
      errors.push(`Required environment variable ${varName} is not set`);
    }
  }
  
  return errors;
}

// Validate all environment variables
function validateAllVariables(envVars) {
  const results = [];
  
  for (const [name, config] of Object.entries(ENV_VALIDATION_CONFIG.validation)) {
    const value = envVars[name];
    const result = validateEnvironmentVariable(name, value, config);
    
    results.push({
      name,
      value: value || '(not set)',
      config,
      ...result
    });
  }
  
  return results;
}

// Check for security issues
function checkSecurityIssues(envVars, environment) {
  const issues = [];
  
  // Check for development settings in production
  if (environment === 'production') {
    const devSettings = [
      { name: 'VITE_ENABLE_DEBUG_MODE', value: 'true' },
      { name: 'VITE_SHOW_PERFORMANCE_MONITOR', value: 'true' },
      { name: 'VITE_MOCK_API_RESPONSES', value: 'true' },
      { name: 'VITE_LOG_LEVEL', value: 'debug' }
    ];
    
    for (const setting of devSettings) {
      if (envVars[setting.name] === setting.value) {
        issues.push(`${setting.name} should not be ${setting.value} in production`);
      }
    }
  }
  
  // Check for placeholder values
  const placeholderPatterns = [
    'placeholder',
    'example',
    'changeme',
    'your-key-here',
    'localhost'
  ];
  
  for (const [name, value] of Object.entries(envVars)) {
    if (name.includes('API_KEY') || name.includes('SECRET') || name.includes('TOKEN')) {
      for (const pattern of placeholderPatterns) {
        if (value && value.toLowerCase().includes(pattern)) {
          if (environment === 'production' || strict) {
            issues.push(`${name} appears to contain a placeholder value: ${value}`);
          }
        }
      }
    }
  }
  
  // Check for HTTP URLs in production
  if (environment === 'production') {
    for (const [name, value] of Object.entries(envVars)) {
      if (name.includes('URL') || name.includes('ENDPOINT')) {
        if (value && value.startsWith('http://') && !value.includes('localhost')) {
          issues.push(`${name} should use HTTPS in production: ${value}`);
        }
      }
    }
  }
  
  return issues;
}

// Generate validation report
function generateValidationReport(envVars, environment, results, requiredErrors, securityIssues) {
  const report = {
    timestamp: new Date().toISOString(),
    environment,
    validation: {
      passed: results.filter(r => r.valid && !r.skipped).length,
      failed: results.filter(r => !r.valid).length,
      skipped: results.filter(r => r.skipped).length,
      total: results.length
    },
    requiredErrors: requiredErrors.length,
    securityIssues: securityIssues.length,
    results,
    errors: {
      required: requiredErrors,
      security: securityIssues,
      validation: results.filter(r => !r.valid).map(r => r.error)
    }
  };
  
  return report;
}

// Print validation summary
function printValidationSummary(report) {
  console.log('\n' + '='.repeat(60));
  log('🔍 ENVIRONMENT VALIDATION SUMMARY', colors.green);
  console.log('='.repeat(60));
  log(`Environment: ${report.environment}`, colors.cyan);
  log(`Timestamp: ${new Date(report.timestamp).toLocaleString()}`, colors.cyan);
  console.log('');
  
  // Validation results
  log(`✅ Passed: ${report.validation.passed}`, colors.green);
  log(`❌ Failed: ${report.validation.failed}`, colors.red);
  log(`⏭️  Skipped: ${report.validation.skipped}`, colors.yellow);
  log(`📊 Total: ${report.validation.total}`, colors.cyan);
  console.log('');
  
  // Error summary
  if (report.requiredErrors > 0) {
    log(`🚨 Required variable errors: ${report.requiredErrors}`, colors.red);
  }
  
  if (report.securityIssues > 0) {
    log(`🔒 Security issues: ${report.securityIssues}`, colors.yellow);
  }
  
  console.log('='.repeat(60));
  
  // Detailed errors
  if (report.errors.required.length > 0) {
    console.log('');
    error('Required Variable Errors:');
    report.errors.required.forEach(err => error(`  • ${err}`));
  }
  
  if (report.errors.validation.length > 0) {
    console.log('');
    error('Validation Errors:');
    report.errors.validation.forEach(err => error(`  • ${err}`));
  }
  
  if (report.errors.security.length > 0) {
    console.log('');
    warning('Security Issues:');
    report.errors.security.forEach(issue => warning(`  • ${issue}`));
  }
  
  // Verbose output
  if (verbose && report.results.length > 0) {
    console.log('');
    info('Detailed Validation Results:');
    report.results.forEach(result => {
      const status = result.valid ? '✅' : '❌';
      const skipped = result.skipped ? ' (skipped)' : '';
      log(`  ${status} ${result.name}: ${result.value}${skipped}`, 
          result.valid ? colors.green : colors.red);
      
      if (result.config.description) {
        log(`     ${result.config.description}`, colors.cyan);
      }
    });
  }
  
  console.log('');
  
  const hasErrors = report.validation.failed > 0 || report.requiredErrors > 0;
  const hasWarnings = report.securityIssues > 0;
  
  if (hasErrors) {
    error('Environment validation failed! ❌');
  } else if (hasWarnings) {
    warning('Environment validation passed with warnings ⚠️');
  } else {
    success('Environment validation passed! ✅');
  }
}

// Main validation process
async function main() {
  try {
    log(`🔍 Starting environment validation for ${environment}...`, colors.magenta);
    
    // Load environment variables
    const envVars = loadEnvironmentFile(environment);
    
    if (verbose) {
      info(`Loaded ${Object.keys(envVars).length} environment variables`);
    }
    
    // Run validations
    const requiredErrors = checkRequiredVariables(envVars, environment);
    const validationResults = validateAllVariables(envVars);
    const securityIssues = checkSecurityIssues(envVars, environment);
    
    // Generate and display report
    const report = generateValidationReport(
      envVars, 
      environment, 
      validationResults, 
      requiredErrors, 
      securityIssues
    );
    
    printValidationSummary(report);
    
    // Save report if verbose
    if (verbose) {
      const reportPath = `env-validation-${environment}-${Date.now()}.json`;
      require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
      info(`Validation report saved: ${reportPath}`);
    }
    
    // Exit with appropriate code
    const hasErrors = report.validation.failed > 0 || report.requiredErrors > 0;
    const hasWarnings = report.securityIssues > 0;
    
    if (hasErrors) {
      process.exit(1);
    } else if (hasWarnings && strict) {
      process.exit(1);
    } else {
      process.exit(0);
    }
    
  } catch (error) {
    error(`Environment validation failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  warning('\nEnvironment validation interrupted');
  process.exit(1);
});

process.on('SIGTERM', () => {
  warning('\nEnvironment validation terminated');
  process.exit(1);
});

// Show usage if help requested
if (args.includes('--help') || args.includes('-h')) {
  console.log('Environment Validation Script');
  console.log('');
  console.log('Usage: node scripts/validate-env.js [environment] [options]');
  console.log('');
  console.log('Arguments:');
  console.log('  environment    Target environment (development, staging, production)');
  console.log('');
  console.log('Options:');
  console.log('  --strict       Treat warnings as errors');
  console.log('  --verbose      Show detailed validation results');
  console.log('  --help, -h     Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/validate-env.js production --strict');
  console.log('  node scripts/validate-env.js staging --verbose');
  process.exit(0);
}

// Run the validation
main();