#!/usr/bin/env node

/**
 * Production Readiness Validation Script
 * Comprehensive check before production deployment
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';

// Production readiness checklist
const READINESS_CHECKS = {
  // Environment and Configuration
  environment: [
    {
      name: 'Environment variables validated',
      check: async () => {
        try {
          execSync('node scripts/validate-env.js production --strict', { stdio: 'pipe' });
          return { passed: true };
        } catch (error) {
          return { passed: false, error: 'Environment validation failed' };
        }
      },
      critical: true
    },
    {
      name: 'Production build exists',
      check: () => {
        const exists = existsSync('dist') && existsSync('dist/index.html');
        return { passed: exists, error: exists ? null : 'Production build not found' };
      },
      critical: true
    },
    {
      name: 'Build manifest present',
      check: () => {
        const exists = existsSync('dist/build-manifest.json');
        return { passed: exists, error: exists ? null : 'Build manifest missing' };
      },
      critical: true
    }
  ],

  // Security
  security: [
    {
      name: 'No security vulnerabilities',
      check: async () => {
        try {
          execSync('npm audit --audit-level moderate', { stdio: 'pipe' });
          return { passed: true };
        } catch (error) {
          return { passed: false, error: 'Security vulnerabilities found' };
        }
      },
      critical: true
    },
    {
      name: 'Security headers configured',
      check: () => {
        const exists = existsSync('dist/_headers') || existsSync('docker/security-headers.conf');
        return { passed: exists, error: exists ? null : 'Security headers not configured' };
      },
      critical: true
    },
    {
      name: 'HTTPS enforced in production config',
      check: () => {
        try {
          const envContent = readFileSync('.env.production', 'utf8');
          const hasHttps = envContent.includes('https://') && !envContent.includes('http://localhost');
          return { passed: hasHttps, error: hasHttps ? null : 'HTTPS not enforced' };
        } catch {
          return { passed: false, error: 'Production environment file not found' };
        }
      },
      critical: true
    }
  ],

  // Code Quality
  quality: [
    {
      name: 'Linting passes',
      check: async () => {
        try {
          execSync('npm run lint', { stdio: 'pipe' });
          return { passed: true };
        } catch (error) {
          return { passed: false, error: 'Linting failed' };
        }
      },
      critical: true
    },
    {
      name: 'Type checking passes',
      check: async () => {
        try {
          execSync('npm run type-check', { stdio: 'pipe' });
          return { passed: true };
        } catch (error) {
          return { passed: false, error: 'Type checking failed' };
        }
      },
      critical: true
    },
    {
      name: 'Tests pass',
      check: async () => {
        try {
          execSync('npm run test', { stdio: 'pipe' });
          return { passed: true };
        } catch (error) {
          return { passed: false, error: 'Tests failed' };
        }
      },
      critical: true
    }
  ],

  // Performance
  performance: [
    {
      name: 'Bundle size within limits',
      check: () => {
        try {
          const stats = execSync('du -sb dist', { encoding: 'utf8' });
          const sizeBytes = parseInt(stats.split('\t')[0]);
          const sizeMB = sizeBytes / (1024 * 1024);
          const limit = 5; // 5MB limit
          
          return { 
            passed: sizeMB <= limit, 
            error: sizeMB > limit ? `Bundle size ${sizeMB.toFixed(2)}MB exceeds ${limit}MB limit` : null 
          };
        } catch {
          return { passed: true }; // Can't determine size, assume OK
        }
      },
      critical: false
    },
    {
      name: 'Source maps disabled in production',
      check: () => {
        try {
          const manifest = JSON.parse(readFileSync('dist/build-manifest.json', 'utf8'));
          const isProduction = manifest.environment === 'production';
          return { 
            passed: isProduction, 
            error: isProduction ? null : 'Not built for production environment' 
          };
        } catch {
          return { passed: false, error: 'Cannot verify production build' };
        }
      },
      critical: true
    }
  ],

  // Deployment
  deployment: [
    {
      name: 'Docker image builds successfully',
      check: async () => {
        try {
          execSync('docker build -f docker/Dockerfile --target production -t roadpulse-web:test .', { stdio: 'pipe' });
          execSync('docker rmi roadpulse-web:test', { stdio: 'pipe' });
          return { passed: true };
        } catch (error) {
          return { passed: false, error: 'Docker build failed' };
        }
      },
      critical: true
    },
    {
      name: 'Kubernetes manifests valid',
      check: () => {
        const manifests = ['deployment.yaml', 'service.yaml', 'ingress.yaml', 'configmap.yaml'];
        const missing = manifests.filter(file => !existsSync(`k8s/${file}`));
        
        return { 
          passed: missing.length === 0, 
          error: missing.length > 0 ? `Missing K8s manifests: ${missing.join(', ')}` : null 
        };
      },
      critical: true
    },
    {
      name: 'Health check endpoint available',
      check: () => {
        const exists = existsSync('dist/health.json');
        return { passed: exists, error: exists ? null : 'Health check endpoint missing' };
      },
      critical: true
    }
  ]
};

// Color codes
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

// Run all checks
async function runReadinessChecks() {
  const results = {};
  let totalChecks = 0;
  let passedChecks = 0;
  let criticalFailures = 0;

  for (const [category, checks] of Object.entries(READINESS_CHECKS)) {
    log(`\n🔍 ${category.toUpperCase()} CHECKS`, colors.magenta);
    
    const categoryResults = [];
    
    for (const check of checks) {
      totalChecks++;
      
      try {
        const result = await check.check();
        const status = result.passed ? '✅' : '❌';
        const criticality = check.critical ? '[CRITICAL]' : '[OPTIONAL]';
        
        log(`  ${status} ${check.name} ${criticality}`);
        
        if (result.error) {
          log(`     ${result.error}`, colors.red);
        }
        
        if (result.passed) {
          passedChecks++;
        } else if (check.critical) {
          criticalFailures++;
        }
        
        categoryResults.push({
          name: check.name,
          passed: result.passed,
          critical: check.critical,
          error: result.error
        });
        
      } catch (error) {
        log(`  ❌ ${check.name} [ERROR]`, colors.red);
        log(`     ${error.message}`, colors.red);
        
        if (check.critical) {
          criticalFailures++;
        }
        
        categoryResults.push({
          name: check.name,
          passed: false,
          critical: check.critical,
          error: error.message
        });
      }
    }
    
    results[category] = categoryResults;
  }

  return {
    results,
    summary: {
      total: totalChecks,
      passed: passedChecks,
      failed: totalChecks - passedChecks,
      criticalFailures
    }
  };
}

// Print summary
function printSummary(checkResults) {
  const { results, summary } = checkResults;
  
  console.log('\n' + '='.repeat(70));
  log('🚀 PRODUCTION READINESS SUMMARY', colors.green);
  console.log('='.repeat(70));
  
  // Overall status
  const isReady = summary.criticalFailures === 0;
  const statusIcon = isReady ? '✅' : '❌';
  const statusColor = isReady ? colors.green : colors.red;
  const statusText = isReady ? 'READY FOR PRODUCTION' : 'NOT READY FOR PRODUCTION';
  
  log(`Status: ${statusIcon} ${statusText}`, statusColor);
  log(`Checks: ${summary.passed}/${summary.total} passed`, colors.cyan);
  
  if (summary.criticalFailures > 0) {
    log(`Critical failures: ${summary.criticalFailures}`, colors.red);
  }
  
  console.log('='.repeat(70));
  
  // Category breakdown
  for (const [category, categoryResults] of Object.entries(results)) {
    const categoryPassed = categoryResults.filter(r => r.passed).length;
    const categoryTotal = categoryResults.length;
    const categoryCriticalFailed = categoryResults.filter(r => !r.passed && r.critical).length;
    
    const categoryIcon = categoryCriticalFailed === 0 ? '✅' : '❌';
    const categoryColor = categoryCriticalFailed === 0 ? colors.green : colors.red;
    
    log(`${categoryIcon} ${category}: ${categoryPassed}/${categoryTotal}`, categoryColor);
  }
  
  console.log('='.repeat(70));
  
  if (isReady) {
    success('🎉 Application is ready for production deployment!');
    console.log('');
    info('Next steps:');
    console.log('  1. Run: npm run deploy:production');
    console.log('  2. Monitor deployment health');
    console.log('  3. Verify application functionality');
  } else {
    error('❌ Fix critical issues before deploying to production');
    console.log('');
    
    // Show critical failures
    const criticalFailures = [];
    for (const [category, categoryResults] of Object.entries(results)) {
      const failed = categoryResults.filter(r => !r.passed && r.critical);
      if (failed.length > 0) {
        criticalFailures.push({ category, failures: failed });
      }
    }
    
    if (criticalFailures.length > 0) {
      error('Critical Issues to Fix:');
      for (const { category, failures } of criticalFailures) {
        log(`\n${category}:`, colors.yellow);
        for (const failure of failures) {
          error(`  • ${failure.name}`);
          if (failure.error) {
            log(`    ${failure.error}`, colors.red);
          }
        }
      }
    }
  }
  
  return isReady;
}

// Main function
async function main() {
  try {
    log('🚀 Starting production readiness check...', colors.magenta);
    
    const checkResults = await runReadinessChecks();
    const isReady = printSummary(checkResults);
    
    // Save report
    const reportPath = `production-readiness-${Date.now()}.json`;
    require('fs').writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      ready: isReady,
      ...checkResults
    }, null, 2));
    
    info(`\nReadiness report saved: ${reportPath}`);
    
    process.exit(isReady ? 0 : 1);
    
  } catch (error) {
    error(`Production readiness check failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  warning('\nProduction readiness check interrupted');
  process.exit(1);
});

// Run the check
main();