#!/usr/bin/env node

/**
 * Kubernetes Deployment Script for RoadPulse Web Application
 * Handles deployment to Kubernetes clusters with proper validation and rollback
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Deployment configuration
const K8S_DEPLOY_CONFIG = {
  environments: {
    development: {
      name: 'Development',
      namespace: 'roadpulse-dev',
      context: 'development-cluster',
      replicas: 1,
      resources: {
        requests: { cpu: '100m', memory: '128Mi' },
        limits: { cpu: '500m', memory: '512Mi' }
      }
    },
    staging: {
      name: 'Staging',
      namespace: 'roadpulse-staging',
      context: 'staging-cluster',
      replicas: 2,
      resources: {
        requests: { cpu: '200m', memory: '256Mi' },
        limits: { cpu: '1', memory: '1Gi' }
      }
    },
    production: {
      name: 'Production',
      namespace: 'roadpulse',
      context: 'production-cluster',
      replicas: 3,
      resources: {
        requests: { cpu: '500m', memory: '512Mi' },
        limits: { cpu: '2', memory: '2Gi' }
      }
    }
  },
  
  manifests: [
    'namespace.yaml',
    'configmap.yaml',
    'deployment.yaml',
    'service.yaml',
    'ingress.yaml'
  ],
  
  healthCheck: {
    timeout: 600,
    interval: 10,
    retries: 60
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
const environment = args[0];
const imageTag = args[1];
const dryRun = args.includes('--dry-run');
const skipHealthCheck = args.includes('--skip-health-check');
const force = args.includes('--force');

// Validate arguments
if (!environment || !K8S_DEPLOY_CONFIG.environments[environment]) {
  error('Invalid or missing environment');
  error(`Usage: npm run deploy:k8s <environment> <image-tag> [options]`);
  error(`Available environments: ${Object.keys(K8S_DEPLOY_CONFIG.environments).join(', ')}`);
  error(`Options:`);
  error(`  --dry-run           Show what would be deployed without actually deploying`);
  error(`  --skip-health-check Skip post-deployment health check`);
  error(`  --force             Skip confirmation prompts`);
  process.exit(1);
}

if (!imageTag) {
  error('Image tag is required');
  error(`Usage: npm run deploy:k8s ${environment} <image-tag>`);
  process.exit(1);
}

const envConfig = K8S_DEPLOY_CONFIG.environments[environment];

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
  if (force || dryRun) {
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

  // Check if kubectl is available
  try {
    execCommand('kubectl version --client', { stdio: 'pipe' });
    success('kubectl is available');
  } catch (error) {
    error('kubectl is not available or not configured');
    throw error;
  }

  // Check if context exists and is accessible
  try {
    const contexts = execCommand('kubectl config get-contexts -o name', { stdio: 'pipe' });
    if (!contexts.includes(envConfig.context)) {
      warning(`Context ${envConfig.context} not found, using current context`);
    } else {
      execCommand(`kubectl config use-context ${envConfig.context}`, { stdio: 'pipe' });
      success(`Switched to context: ${envConfig.context}`);
    }
  } catch (error) {
    warning('Could not switch context, using current context');
  }

  // Check if namespace exists
  try {
    execCommand(`kubectl get namespace ${envConfig.namespace}`, { stdio: 'pipe' });
    success(`Namespace ${envConfig.namespace} exists`);
  } catch (error) {
    warning(`Namespace ${envConfig.namespace} does not exist, will be created`);
  }

  // Check if manifests exist
  for (const manifest of K8S_DEPLOY_CONFIG.manifests) {
    const manifestPath = join('k8s', manifest);
    if (!existsSync(manifestPath)) {
      error(`Manifest file not found: ${manifestPath}`);
      throw new Error(`Missing manifest: ${manifest}`);
    }
  }
  success('All manifest files found');

  // Validate image tag format
  if (!/^[a-zA-Z0-9._-]+:[a-zA-Z0-9._-]+$/.test(imageTag)) {
    error(`Invalid image tag format: ${imageTag}`);
    throw new Error('Image tag must be in format registry/image:tag');
  }
  success(`Image tag validated: ${imageTag}`);
}

// Apply Kubernetes manifests
async function applyManifests() {
  info('Applying Kubernetes manifests...');

  for (const manifest of K8S_DEPLOY_CONFIG.manifests) {
    const manifestPath = join('k8s', manifest);
    
    try {
      info(`Applying ${manifest}...`);
      
      if (manifest === 'deployment.yaml') {
        // Update image tag in deployment
        let deploymentContent = readFileSync(manifestPath, 'utf8');
        deploymentContent = deploymentContent.replace(
          /image: .*/,
          `image: ${imageTag}`
        );
        
        // Update replicas
        deploymentContent = deploymentContent.replace(
          /replicas: .*/,
          `replicas: ${envConfig.replicas}`
        );
        
        // Update resources
        deploymentContent = deploymentContent.replace(
          /cpu: ".*"/g,
          (match, offset, string) => {
            const isRequest = string.substring(0, offset).includes('requests:') && 
                             !string.substring(offset).substring(0, 100).includes('limits:');
            return isRequest ? 
              `cpu: "${envConfig.resources.requests.cpu}"` : 
              `cpu: "${envConfig.resources.limits.cpu}"`;
          }
        );
        
        deploymentContent = deploymentContent.replace(
          /memory: ".*"/g,
          (match, offset, string) => {
            const isRequest = string.substring(0, offset).includes('requests:') && 
                             !string.substring(offset).substring(0, 100).includes('limits:');
            return isRequest ? 
              `memory: "${envConfig.resources.requests.memory}"` : 
              `memory: "${envConfig.resources.limits.memory}"`;
          }
        );
        
        // Apply with modified content
        execCommand(`echo '${deploymentContent}' | kubectl apply -f -`);
      } else {
        execCommand(`kubectl apply -f ${manifestPath}`);
      }
      
      success(`Applied ${manifest}`);
    } catch (error) {
      error(`Failed to apply ${manifest}: ${error.message}`);
      throw error;
    }
  }
}

// Wait for deployment to be ready
async function waitForDeployment() {
  if (skipHealthCheck) {
    info('Skipping deployment health check');
    return;
  }

  info('Waiting for deployment to be ready...');

  const deploymentName = 'roadpulse-web';
  const maxRetries = K8S_DEPLOY_CONFIG.healthCheck.retries;
  const interval = K8S_DEPLOY_CONFIG.healthCheck.interval * 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      info(`Health check attempt ${attempt}/${maxRetries}...`);
      
      // Check deployment status
      const deploymentStatus = execCommand(
        `kubectl get deployment ${deploymentName} -n ${envConfig.namespace} -o jsonpath='{.status.readyReplicas}'`,
        { stdio: 'pipe' }
      );
      
      const readyReplicas = parseInt(deploymentStatus.trim()) || 0;
      
      if (readyReplicas >= envConfig.replicas) {
        success(`Deployment is ready with ${readyReplicas}/${envConfig.replicas} replicas`);
        
        // Additional health check via HTTP
        try {
          const serviceName = 'roadpulse-web-service';
          const healthCheckUrl = `http://${serviceName}.${envConfig.namespace}.svc.cluster.local/health.json`;
          
          // Port forward for health check (in background)
          const portForwardProcess = execCommand(
            `kubectl port-forward service/${serviceName} 8080:80 -n ${envConfig.namespace} &`,
            { stdio: 'pipe' }
          );
          
          await sleep(2000); // Wait for port forward to establish
          
          // Try to access health endpoint
          try {
            execCommand('curl -f http://localhost:8080/health.json', { stdio: 'pipe' });
            success('Health check endpoint is responding');
          } catch {
            warning('Health check endpoint not accessible via port-forward');
          }
          
          // Kill port forward process
          try {
            execCommand('pkill -f "kubectl port-forward"', { stdio: 'pipe' });
          } catch {
            // Ignore if process not found
          }
        } catch (error) {
          warning(`HTTP health check failed: ${error.message}`);
        }
        
        return;
      } else {
        info(`Deployment not ready: ${readyReplicas}/${envConfig.replicas} replicas ready`);
      }
    } catch (error) {
      warning(`Health check attempt ${attempt} failed: ${error.message}`);
    }

    if (attempt < maxRetries) {
      info(`Waiting ${K8S_DEPLOY_CONFIG.healthCheck.interval} seconds before next attempt...`);
      await sleep(interval);
    }
  }

  error('Deployment health check failed after all attempts');
  throw new Error('Deployment did not become ready within timeout');
}

// Get deployment status
function getDeploymentStatus() {
  info('Getting deployment status...');

  try {
    const deploymentInfo = execCommand(
      `kubectl get deployment roadpulse-web -n ${envConfig.namespace} -o wide`,
      { stdio: 'pipe' }
    );
    
    const podInfo = execCommand(
      `kubectl get pods -n ${envConfig.namespace} -l app.kubernetes.io/name=roadpulse-web`,
      { stdio: 'pipe' }
    );
    
    const serviceInfo = execCommand(
      `kubectl get service roadpulse-web-service -n ${envConfig.namespace}`,
      { stdio: 'pipe' }
    );
    
    console.log('\n' + '='.repeat(60));
    log('📊 DEPLOYMENT STATUS', colors.green);
    console.log('='.repeat(60));
    
    console.log('\nDeployment:');
    console.log(deploymentInfo);
    
    console.log('\nPods:');
    console.log(podInfo);
    
    console.log('\nService:');
    console.log(serviceInfo);
    
    console.log('='.repeat(60));
    
  } catch (error) {
    warning(`Could not get deployment status: ${error.message}`);
  }
}

// Rollback deployment
async function rollbackDeployment() {
  warning('Rolling back deployment...');
  
  if (dryRun) {
    info('[DRY RUN] Would rollback deployment');
    return;
  }

  try {
    execCommand(`kubectl rollout undo deployment/roadpulse-web -n ${envConfig.namespace}`);
    success('Rollback initiated');
    
    // Wait for rollback to complete
    execCommand(
      `kubectl rollout status deployment/roadpulse-web -n ${envConfig.namespace} --timeout=300s`
    );
    success('Rollback completed');
  } catch (error) {
    error(`Rollback failed: ${error.message}`);
  }
}

// Generate deployment report
function generateDeploymentReport() {
  const report = {
    timestamp: new Date().toISOString(),
    environment: environment,
    imageTag: imageTag,
    namespace: envConfig.namespace,
    replicas: envConfig.replicas,
    resources: envConfig.resources,
    success: true
  };

  if (!dryRun) {
    const reportPath = `k8s-deployment-report-${environment}-${Date.now()}.json`;
    require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
    success(`Deployment report saved: ${reportPath}`);
  }

  return report;
}

// Print deployment summary
function printDeploymentSummary(report) {
  console.log('\n' + '='.repeat(60));
  log('🚀 KUBERNETES DEPLOYMENT SUMMARY', colors.green);
  console.log('='.repeat(60));
  log(`Environment: ${envConfig.name}`, colors.cyan);
  log(`Namespace: ${envConfig.namespace}`, colors.cyan);
  log(`Image: ${imageTag}`, colors.cyan);
  log(`Replicas: ${envConfig.replicas}`, colors.cyan);
  log(`Timestamp: ${new Date(report.timestamp).toLocaleString()}`, colors.cyan);
  console.log('='.repeat(60));
  success('Kubernetes deployment completed successfully! 🎉');
  console.log('');
  
  info('Next steps:');
  console.log(`  1. Monitor deployment: kubectl get pods -n ${envConfig.namespace} -w`);
  console.log(`  2. Check logs: kubectl logs -f deployment/roadpulse-web -n ${envConfig.namespace}`);
  console.log(`  3. Access application via ingress or port-forward`);
}

// Main deployment process
async function main() {
  try {
    log(`🚀 Starting Kubernetes deployment to ${envConfig.name}...`, colors.magenta);
    log(`Image: ${imageTag}`, colors.cyan);
    log(`Namespace: ${envConfig.namespace}`, colors.cyan);
    console.log('');
    
    await preDeploymentChecks();
    
    // Confirmation for production
    if (environment === 'production') {
      const proceed = await promptConfirmation(
        `⚠️  You are about to deploy to PRODUCTION. Are you sure?`
      );
      
      if (!proceed) {
        error('Production deployment cancelled');
        process.exit(1);
      }
    }
    
    await applyManifests();
    await waitForDeployment();
    getDeploymentStatus();
    
    const report = generateDeploymentReport();
    printDeploymentSummary(report);
    
  } catch (error) {
    error(`Kubernetes deployment failed: ${error.message}`);
    
    if (!dryRun) {
      const rollback = await promptConfirmation('Deployment failed. Attempt rollback?');
      if (rollback) {
        await rollbackDeployment();
      }
    }
    
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  warning('\nKubernetes deployment interrupted');
  process.exit(1);
});

process.on('SIGTERM', () => {
  warning('\nKubernetes deployment terminated');
  process.exit(1);
});

// Show usage if help requested
if (args.includes('--help') || args.includes('-h')) {
  console.log('Kubernetes Deployment Script');
  console.log('');
  console.log('Usage: node scripts/deploy-k8s.js <environment> <image-tag> [options]');
  console.log('');
  console.log('Arguments:');
  console.log('  environment    Target environment (development, staging, production)');
  console.log('  image-tag      Docker image tag to deploy (e.g., ghcr.io/org/app:v1.0.0)');
  console.log('');
  console.log('Options:');
  console.log('  --dry-run           Show what would be deployed without actually deploying');
  console.log('  --skip-health-check Skip post-deployment health check');
  console.log('  --force             Skip confirmation prompts');
  console.log('  --help, -h          Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/deploy-k8s.js production ghcr.io/roadpulse/roadpulse-web:v1.0.0');
  console.log('  node scripts/deploy-k8s.js staging ghcr.io/roadpulse/roadpulse-web:latest --dry-run');
  process.exit(0);
}

// Run the deployment
main();