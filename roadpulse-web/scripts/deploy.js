#!/usr/bin/env node

/**
 * Deployment script for RoadPulse Web Application
 * Handles deployment to different environments with proper validation and rollback
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Deployment configuration
const DEPLOY_CONFIG = {
  environments: {
    development: {
      name: 'Development',
      url: 'http://localhost:3000',
      branch: 'develop',
      autoApprove: true
    },
    staging: {
      name: 'Staging',
      url: 'https://staging.roadpulse.app',
      branch: 'main',
      autoApprove: false
    },
    production: {
      name: 'Production',
      url: 'https://roadpulse.app',
      branch: 'main',
      autoApprove: false
    }
  },
  healthCheckTimeout: 30000,
  rollbackTimeout: 60000
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
const environment = args[0];
const skipHealthCheck = args.includes('--skip-health-check');
const skipBuild = args.includes('--skip-build');
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');

// Validate environment
if (!environment || !DEPLOY_CONFIG.environments[environment]) {
  error('Invalid or missing environment');
  error(`Usage: npm run deploy <environment> [options]`);
  error(`Available environments: ${Object.keys(DEPLOY_CONFIG.environments).join(', ')}`);
  error(`Options:`);
  error(`  --skip-health-check  Skip post-deployment health check`);
  error(`  --skip-build         Skip build process`);
  error(`  --dry-run           Show what would be deployed without actually deploying`);
  error(`  --force             Skip confirmation prompts`);
  process.exit(1);
}

const envConfig = DEPLOY_CONFIG.environments[environment];

// Utility functions
function execCommand(command, options = {}) {
  if (dryRun) {
    info(`[DRY RUN] Would execute: ${command}`);
    return '';
  }
  
  try {
    return execSync(command, { encoding: 'utf8', ...options });
  } catch (error) {
    throw new Error(`Command failed: ${command}\n${error.message}`);
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function promptConfirmation(message) {
  if (force || envConfig.autoApprove || dryRun) {
    return true;
  }

  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(`${message} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// Pre-deployment checks
async function preDeploymentChecks() {
  info('Running pre-deployment checks...');

  // Check if build directory exists
  if (!existsSync('dist')) {
    if (skipBuild) {
      error('Build directory not found and --skip-build specified');
      process.exit(1);
    }
    warning('Build directory not found, will build first');
  }

  // Check git status
  try {
    const gitStatus = execCommand('git status --porcelain', { stdio: 'pipe' });
    if (gitStatus.trim() && !force) {
      warning('Working directory has uncommitted changes');
      const proceed = await promptConfirmation('Continue with uncommitted changes?');
      if (!proceed) {
        error('Deployment cancelled');
        process.exit(1);
      }
    }
  } catch (error) {
    warning('Could not check git status');
  }

  // Check current branch
  try {
    const currentBranch = execCommand('git rev-parse --abbrev-ref HEAD', { stdio: 'pipe' }).trim();
    if (currentBranch !== envConfig.branch && !force) {
      warning(`Current branch (${currentBranch}) does not match target branch (${envConfig.branch})`);
      const proceed = await promptConfirmation('Continue with different branch?');
      if (!proceed) {
        error('Deployment cancelled');
        process.exit(1);
      }
    }
  } catch (error) {
    warning('Could not check current branch');
  }

  // Check if environment file exists
  const envFile = `.env.${environment}`;
  if (!existsSync(envFile) && !existsSync('.env')) {
    warning(`Environment file ${envFile} not found`);
  }

  success('Pre-deployment checks completed');
}

// Build application
async function buildApplication() {
  if (skipBuild) {
    info('Skipping build process');
    return;
  }

  info(`Building application for ${environment}...`);
  
  try {
    execCommand(`node scripts/build.js ${environment}`, { stdio: 'inherit' });
    success('Build completed successfully');
  } catch (error) {
    error('Build failed');
    throw error;
  }
}

// Validate build
function validateBuild() {
  info('Validating build...');

  // Check if dist directory exists
  if (!existsSync('dist')) {
    throw new Error('Build directory not found');
  }

  // Check if index.html exists
  if (!existsSync('dist/index.html')) {
    throw new Error('index.html not found in build directory');
  }

  // Check build manifest
  const manifestPath = 'dist/build-manifest.json';
  if (existsSync(manifestPath)) {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    info(`Build version: ${manifest.version}`);
    info(`Build time: ${manifest.buildTime}`);
    info(`Git commit: ${manifest.commit?.substring(0, 8) || 'unknown'}`);
  }

  success('Build validation completed');
}

// Deploy to environment
async function deployToEnvironment() {
  info(`Deploying to ${envConfig.name} environment...`);

  if (dryRun) {
    info('[DRY RUN] Would deploy to environment');
    return;
  }

  // Environment-specific deployment logic
  switch (environment) {
    case 'development':
      await deployToDevelopment();
      break;
    case 'staging':
      await deployToStaging();
      break;
    case 'production':
      await deployToProduction();
      break;
    default:
      throw new Error(`Deployment method not implemented for ${environment}`);
  }

  success(`Deployment to ${envConfig.name} completed`);
}

// Development deployment (local server)
async function deployToDevelopment() {
  info('Starting development server...');
  
  try {
    // Kill any existing development server
    try {
      execCommand('pkill -f "vite.*preview"');
    } catch {
      // Ignore if no process found
    }

    // Start preview server
    execCommand('npm run preview &');
    await sleep(3000); // Wait for server to start
    
    info('Development server started at http://localhost:4173');
  } catch (error) {
    throw new Error(`Failed to start development server: ${error.message}`);
  }
}

// Staging deployment (example using rsync or cloud deployment)
async function deployToStaging() {
  info('Deploying to staging environment...');
  
  // Example deployment commands - replace with your actual deployment method
  const deployCommands = [
    // 'rsync -avz --delete dist/ user@staging-server:/var/www/roadpulse/',
    // 'ssh user@staging-server "sudo systemctl reload nginx"'
  ];

  // For this example, we'll simulate deployment
  info('Simulating staging deployment...');
  await sleep(2000);
  
  // Uncomment and modify for actual deployment
  // for (const command of deployCommands) {
  //   execCommand(command);
  // }
}

// Production deployment
async function deployToProduction() {
  info('Deploying to production environment...');
  
  // Additional production checks
  const proceed = await promptConfirmation(
    `⚠️  You are about to deploy to PRODUCTION. Are you sure?`
  );
  
  if (!proceed) {
    error('Production deployment cancelled');
    process.exit(1);
  }

  // Example production deployment commands
  const deployCommands = [
    // 'aws s3 sync dist/ s3://roadpulse-production-bucket --delete',
    // 'aws cloudfront create-invalidation --distribution-id ABCDEF123456 --paths "/*"'
  ];

  // For this example, we'll simulate deployment
  info('Simulating production deployment...');
  await sleep(3000);
  
  // Uncomment and modify for actual deployment
  // for (const command of deployCommands) {
  //   execCommand(command);
  // }
}

// Health check
async function performHealthCheck() {
  if (skipHealthCheck) {
    info('Skipping health check');
    return;
  }

  info(`Performing health check for ${envConfig.url}...`);

  if (dryRun) {
    info('[DRY RUN] Would perform health check');
    return;
  }

  const maxAttempts = 10;
  const delay = 3000;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      info(`Health check attempt ${attempt}/${maxAttempts}...`);
      
      // Try to fetch the health endpoint
      const healthUrl = `${envConfig.url}/health.json`;
      const response = await fetch(healthUrl);
      
      if (response.ok) {
        const health = await response.json();
        success(`Health check passed - Status: ${health.status}`);
        info(`Version: ${health.version}`);
        info(`Environment: ${health.environment}`);
        return;
      } else {
        warning(`Health check failed with status: ${response.status}`);
      }
    } catch (error) {
      warning(`Health check attempt ${attempt} failed: ${error.message}`);
    }

    if (attempt < maxAttempts) {
      info(`Waiting ${delay / 1000} seconds before next attempt...`);
      await sleep(delay);
    }
  }

  error('Health check failed after all attempts');
  
  const rollback = await promptConfirmation('Health check failed. Rollback deployment?');
  if (rollback) {
    await performRollback();
  }
  
  throw new Error('Deployment health check failed');
}

// Rollback deployment
async function performRollback() {
  warning('Performing deployment rollback...');
  
  if (dryRun) {
    info('[DRY RUN] Would perform rollback');
    return;
  }

  try {
    // Environment-specific rollback logic
    switch (environment) {
      case 'development':
        info('Stopping development server...');
        execCommand('pkill -f "vite.*preview"');
        break;
      case 'staging':
      case 'production':
        // Implement rollback logic for your deployment method
        info('Rollback not implemented for this environment');
        break;
    }
    
    success('Rollback completed');
  } catch (error) {
    error(`Rollback failed: ${error.message}`);
  }
}

// Generate deployment report
function generateDeploymentReport() {
  info('Generating deployment report...');
  
  const report = {
    timestamp: new Date().toISOString(),
    environment: environment,
    target: envConfig,
    deployment: {
      success: true,
      duration: Date.now() - deploymentStartTime,
      version: getAppVersion(),
      commit: getGitCommit(),
      branch: getGitBranch()
    },
    options: {
      skipHealthCheck,
      skipBuild,
      dryRun,
      force
    }
  };

  if (!dryRun) {
    const reportPath = `deployment-report-${environment}-${Date.now()}.json`;
    require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
    success(`Deployment report saved: ${reportPath}`);
  }

  return report;
}

// Utility functions
function getAppVersion() {
  try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'));
    return packageJson.version;
  } catch {
    return 'unknown';
  }
}

function getGitCommit() {
  try {
    return execCommand('git rev-parse HEAD', { stdio: 'pipe' }).trim();
  } catch {
    return 'unknown';
  }
}

function getGitBranch() {
  try {
    return execCommand('git rev-parse --abbrev-ref HEAD', { stdio: 'pipe' }).trim();
  } catch {
    return 'unknown';
  }
}

// Print deployment summary
function printDeploymentSummary(report) {
  console.log('\n' + '='.repeat(50));
  log('🚀 DEPLOYMENT SUMMARY', colors.green);
  console.log('='.repeat(50));
  log(`Environment: ${envConfig.name}`, colors.cyan);
  log(`URL: ${envConfig.url}`, colors.cyan);
  log(`Version: ${report.deployment.version}`, colors.cyan);
  log(`Duration: ${(report.deployment.duration / 1000).toFixed(2)}s`, colors.cyan);
  log(`Commit: ${report.deployment.commit.substring(0, 8)}`, colors.cyan);
  log(`Branch: ${report.deployment.branch}`, colors.cyan);
  log(`Timestamp: ${new Date(report.timestamp).toLocaleString()}`, colors.cyan);
  console.log('='.repeat(50));
  success('Deployment completed successfully! 🎉');
  console.log('');
  
  info('Next steps:');
  console.log(`  1. Verify deployment: ${envConfig.url}`);
  console.log(`  2. Monitor application logs`);
  console.log(`  3. Run smoke tests`);
}

// Main deployment process
let deploymentStartTime;

async function main() {
  deploymentStartTime = Date.now();
  
  try {
    log(`🚀 Starting deployment to ${envConfig.name}...`, colors.magenta);
    
    await preDeploymentChecks();
    await buildApplication();
    validateBuild();
    await deployToEnvironment();
    await performHealthCheck();
    
    const report = generateDeploymentReport();
    printDeploymentSummary(report);
    
  } catch (error) {
    error(`Deployment failed: ${error.message}`);
    
    if (!dryRun) {
      const rollback = await promptConfirmation('Deployment failed. Attempt rollback?');
      if (rollback) {
        await performRollback();
      }
    }
    
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  warning('\nDeployment process interrupted');
  process.exit(1);
});

process.on('SIGTERM', () => {
  warning('\nDeployment process terminated');
  process.exit(1);
});

// Run the deployment
main();