#!/usr/bin/env node

/**
 * Production build script for RoadPulse Web Application
 * Handles environment setup, build optimization, and deployment preparation
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

// Build configuration
const BUILD_CONFIG = {
  environments: ['development', 'staging', 'production'],
  requiredEnvVars: [
    'VITE_API_BASE_URL',
    'VITE_DEPLOYMENT_ENVIRONMENT'
  ],
  outputDir: 'dist',
  assetsDir: 'assets'
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
const environment = args[0] || 'production';
const skipTests = args.includes('--skip-tests');
const skipLint = args.includes('--skip-lint');
const analyze = args.includes('--analyze');

// Validate environment
if (!BUILD_CONFIG.environments.includes(environment)) {
  error(`Invalid environment: ${environment}`);
  error(`Valid environments: ${BUILD_CONFIG.environments.join(', ')}`);
  process.exit(1);
}

info(`Building for environment: ${environment}`);

// Set build timestamp
process.env.VITE_BUILD_TIMESTAMP = new Date().toISOString();
process.env.VITE_DEPLOYMENT_ENVIRONMENT = environment;

// Load environment-specific configuration
const envFile = `.env.${environment}`;
if (existsSync(envFile)) {
  info(`Loading environment file: ${envFile}`);
} else {
  warning(`Environment file not found: ${envFile}, using defaults`);
}

// Validate required environment variables
function validateEnvironment() {
  info('Validating environment variables...');
  
  const missing = BUILD_CONFIG.requiredEnvVars.filter(varName => {
    const value = process.env[varName];
    return !value || value.trim() === '';
  });

  if (missing.length > 0) {
    error('Missing required environment variables:');
    missing.forEach(varName => error(`  - ${varName}`));
    process.exit(1);
  }

  success('Environment validation passed');
}

// Run linting
function runLint() {
  if (skipLint) {
    warning('Skipping linting');
    return;
  }

  info('Running ESLint...');
  try {
    execSync('npm run lint', { stdio: 'inherit' });
    success('Linting passed');
  } catch (error) {
    error('Linting failed');
    process.exit(1);
  }
}

// Run tests
function runTests() {
  if (skipTests) {
    warning('Skipping tests');
    return;
  }

  info('Running tests...');
  try {
    execSync('npm run test', { stdio: 'inherit' });
    success('Tests passed');
  } catch (error) {
    error('Tests failed');
    process.exit(1);
  }
}

// Clean previous build
function cleanBuild() {
  info('Cleaning previous build...');
  try {
    execSync(`rm -rf ${BUILD_CONFIG.outputDir}`, { stdio: 'inherit' });
    success('Build directory cleaned');
  } catch (error) {
    warning('Failed to clean build directory (may not exist)');
  }
}

// Run the build
function runBuild() {
  info('Building application...');
  
  const buildCommand = environment === 'production' 
    ? 'npm run build'
    : 'npm run build -- --mode development';

  try {
    execSync(buildCommand, { stdio: 'inherit' });
    success('Build completed successfully');
  } catch (error) {
    error('Build failed');
    process.exit(1);
  }
}

// Generate build manifest
function generateBuildManifest() {
  info('Generating build manifest...');
  
  const manifest = {
    buildTime: new Date().toISOString(),
    environment: environment,
    version: process.env.VITE_APP_VERSION || '1.0.0',
    commit: getGitCommit(),
    branch: getGitBranch(),
    nodeVersion: process.version,
    buildConfig: {
      environment,
      skipTests,
      skipLint,
      analyze
    }
  };

  const manifestPath = join(BUILD_CONFIG.outputDir, 'build-manifest.json');
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  success(`Build manifest generated: ${manifestPath}`);
}

// Get git commit hash
function getGitCommit() {
  try {
    return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

// Get git branch
function getGitBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

// Analyze bundle size
function analyzeBundleSize() {
  if (!analyze) {
    return;
  }

  info('Analyzing bundle size...');
  try {
    execSync('npx vite-bundle-analyzer dist', { stdio: 'inherit' });
  } catch (error) {
    warning('Bundle analysis failed (vite-bundle-analyzer may not be installed)');
  }
}

// Generate security headers
function generateSecurityHeaders() {
  if (environment !== 'production') {
    return;
  }

  info('Generating security headers...');
  
  const headers = {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "connect-src 'self' https://tile.openstreetmap.org https://server.arcgisonline.com",
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; '),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(self)'
  };

  const headersPath = join(BUILD_CONFIG.outputDir, '_headers');
  const headersContent = Object.entries(headers)
    .map(([key, value]) => `  ${key}: ${value}`)
    .join('\n');
  
  writeFileSync(headersPath, `/*\n${headersContent}\n`);
  success(`Security headers generated: ${headersPath}`);
}

// Generate deployment configuration
function generateDeploymentConfig() {
  info('Generating deployment configuration...');
  
  const deployConfig = {
    environment,
    buildTime: new Date().toISOString(),
    healthCheck: {
      endpoint: '/health',
      expectedStatus: 200
    },
    caching: {
      staticAssets: '1y',
      htmlFiles: '0',
      apiResponses: '5m'
    },
    compression: {
      enabled: true,
      types: ['text/html', 'text/css', 'application/javascript', 'application/json']
    }
  };

  const configPath = join(BUILD_CONFIG.outputDir, 'deploy-config.json');
  writeFileSync(configPath, JSON.stringify(deployConfig, null, 2));
  success(`Deployment configuration generated: ${configPath}`);
}

// Create health check endpoint
function createHealthCheck() {
  info('Creating health check endpoint...');
  
  const healthCheck = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.VITE_APP_VERSION || '1.0.0',
    environment: environment,
    build: {
      commit: getGitCommit(),
      branch: getGitBranch(),
      buildTime: process.env.VITE_BUILD_TIMESTAMP
    }
  };

  const healthPath = join(BUILD_CONFIG.outputDir, 'health.json');
  writeFileSync(healthPath, JSON.stringify(healthCheck, null, 2));
  success(`Health check endpoint created: ${healthPath}`);
}

// Print build summary
function printBuildSummary() {
  const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
  
  console.log('\n' + '='.repeat(50));
  log('🚀 BUILD SUMMARY', colors.green);
  console.log('='.repeat(50));
  log(`Application: ${packageJson.name}`, colors.cyan);
  log(`Version: ${packageJson.version}`, colors.cyan);
  log(`Environment: ${environment}`, colors.cyan);
  log(`Build Time: ${new Date().toLocaleString()}`, colors.cyan);
  log(`Git Commit: ${getGitCommit().substring(0, 8)}`, colors.cyan);
  log(`Git Branch: ${getGitBranch()}`, colors.cyan);
  log(`Output Directory: ${BUILD_CONFIG.outputDir}`, colors.cyan);
  
  if (existsSync(BUILD_CONFIG.outputDir)) {
    try {
      const stats = execSync(`du -sh ${BUILD_CONFIG.outputDir}`, { encoding: 'utf8' });
      log(`Build Size: ${stats.split('\t')[0]}`, colors.cyan);
    } catch {
      // Ignore if du command fails
    }
  }
  
  console.log('='.repeat(50));
  success('Build completed successfully! 🎉');
  console.log('');
  
  // Next steps
  info('Next steps:');
  console.log(`  1. Test the build: npm run preview`);
  console.log(`  2. Deploy to ${environment}: npm run deploy:${environment}`);
  if (analyze) {
    console.log(`  3. Review bundle analysis results`);
  }
}

// Main build process
async function main() {
  try {
    log(`🏗️  Starting build process for ${environment}...`, colors.magenta);
    
    validateEnvironment();
    runLint();
    runTests();
    cleanBuild();
    runBuild();
    generateBuildManifest();
    generateSecurityHeaders();
    generateDeploymentConfig();
    createHealthCheck();
    analyzeBundleSize();
    printBuildSummary();
    
  } catch (error) {
    error(`Build process failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  warning('\nBuild process interrupted');
  process.exit(1);
});

process.on('SIGTERM', () => {
  warning('\nBuild process terminated');
  process.exit(1);
});

// Run the build
main();