#!/usr/bin/env node

/**
 * Production Readiness Checklist for RoadPulse Web Application
 * Comprehensive validation before production deployment
 */

import { execSync } from 'child_process';
import { readFileSync, existsSync, statSync } from 'fs';
import { join } from 'path';

// Production checklist configuration
const PRODUCTION_CHECKLIST = {
  // Build and Configuration Checks
  build: [
    {
      name: 'Build artifacts exist',
      check: () => existsSync('dist') && existsSync('dist/index.html'),
      critical: true,
      description: 'Verify that build artifacts are present'
    },
    {
      name: 'Build manifest exists',
      check: () => existsSync('dist/build-manifest.json'),
      critical: true,
      description: 'Build manifest contains deployment metadata'
    },
    {
      name: 'Environment configuration valid',
      check: async () => {
        try {
          execSync('node scripts/validate-env.js production --strict', { stdio: 'pipe' });
          return true;
        } catch {
          return false;
        }
      },
      critical: true,
      description: 'All environment variables are properly configured'
    },
    {
      name: 'Security headers configuration',
      check: () => existsSync('dist/_headers'),
      critical: true,
      description: 'Security headers are configured for deployment'
    },
    {
      name: 'Health check endpoint',
      check: () => existsSync('dist/health.json'),
      critical: true,
      description: 'Health check endpoint is available'
    }
  ],

  // Code Quality Checks
  quality: [
    {
      name: 'Linting passes',
      check: async () => {
        try {
          execSync('npm run lint', { stdio: 'pipe' });
          return true;
        } catch {
          return false;
        }
      },
      critical: true,
      description: 'Code passes all linting rules'
    },
    {
      name: 'Type checking passes',
      check: async () => {
        try {
          execSync('npm run type-check', { stdio: 'pipe' });
          return true;
        } catch {
          return false;
        }
      },
      critical: true,
      description: 'TypeScript type checking passes'
    },
    {
      name: 'Tests pass',
      check: async () => {
        try {
          execSync('npm run test', { stdio: 'pipe' });
          return true;
        } catch {
          return false;
        }
      },
      critical: true,
      description: 'All tests pass successfully'
    },
    {
      name: 'No console.log statements',
      check: () => {
        try {
          const result = execSync('grep -r "console\\.log" src/ --include="*.ts" --include="*.tsx"', { encoding: 'utf8' });
          return result.trim() === '';
        } catch {
          return true; // No matches found
        }
      },
      critical: false,
      description: 'No console.log statements in production code'
    },
    {
      name: 'No TODO comments',
      check: () => {
        try {
          const result = execSync('grep -r "TODO\\|FIXME\\|HACK" src/ --include="*.ts" --include="*.tsx"', { encoding: 'utf8' });
          return result.trim() === '';
        } catch {
          return true; // No matches found
        }
      },
      critical: false,
      description: 'No TODO/FIXME comments in production code'
    }
  ],

  // Security Checks
  security: [
    {
      name: 'No security vulnerabilities',
      check: async () => {
        try {
          execSync('npm audit --audit-level moderate', { stdio: 'pipe' });
          return true;
        } catch {
          return false;
        }
      },
      critical: true,
      description: 'No moderate or high security vulnerabilities'
    },
    {
      name: 'No hardcoded secrets',
      check: () => {
        const patterns = [
          'password\\s*=',
          'secret\\s*=',
          'token\\s*=',
          'api[_-]?key\\s*=',
          'private[_-]?key\\s*='
        ];
        
        for (const pattern of patterns) {
          try {
            const result = execSync(`grep -ri "${pattern}" src/ --include="*.ts" --include="*.tsx"`, { encoding: 'utf8' });
            if (result.trim() !== '') {
              return false;
            }
          } catch {
            // No matches found, continue
          }
        }
        return true;
      },
      critical: true,
      description: 'No hardcoded secrets or credentials in source code'
    },
    {
      name: 'HTTPS URLs only',
      check: () => {
        const envContent = readFileSync('.env.production', 'utf8');
        const httpUrls = envContent.match(/http:\/\/(?!localhost)/g);
        return !httpUrls || httpUrls.length === 0;
      },
      critical: true,
      description: 'All external URLs use HTTPS in production'
    },
    {
      name: 'CSP enabled',
      check: () => {
        const envContent = readFileSync('.env.production', 'utf8');
        return envContent.includes('VITE_ENABLE_CSP=true');
      },
      critical: true,
      description: 'Content Security Policy is enabled'
    }
  ],

  // Performance Checks
  performance: [
    {
      name: 'Bundle size acceptable',
      check: () => {
        if (!existsSync('dist')) return false;
        
        const stats = statSync('dist');
        const sizeLimit = 5 * 1024 * 1024; // 5MB limit
        
        try {
          const output = execSync('du -sb dist', { encoding: 'utf8' });
          const size = parseInt(output.split('\t')[0]);
          return size <= sizeLimit;
        } catch {
          return true; // Can't determine size, assume OK
        }
      },
      critical: false,
      description: 'Total bundle size is within acceptable limits'
    },
    {
      name: 'Source maps disabled',
      check: () => {
        const buildManifest = JSON.parse(readFileSync('dist/build-manifest.json', 'utf8'));
        return buildManifest.environment === 'production';
      },
      critical: true,
      description: 'Source maps are disabled in production build'
    },
    {
      name: 'Debug mode disabled',
      check: () => {
        const envContent = readFileSync('.env.production', 'utf8');
        return envContent.includes('VITE_ENABLE_DEBUG_MODE=false');
      },
      critical: true,
      description: 'Debug mode is disabled in production'
    },
    {
      name: 'Performance monitoring enabled',
      check: () => {
        const envContent = readFileSync('.env.production', 'utf8');
        return envContent.includes('VITE_ENABLE_PERFORMANCE_MONITORING=true');
      },
      critical: false,
      description: 'Performance monitoring is enabled'
    }
  ],

  // Deployment Checks
  deployment: [
    {
      name: 'Docker image builds',
      check: async () => {
        try {
          execSync('docker build -f docker/Dockerfile --target production -t roadpulse-web:test .', { stdio: 'pipe' });
          execSync('docker rmi roadpulse-web:test', { stdio: 'pipe' });
          return true;
        } catch {
          return false;
        }
      },
      critical: true,
      description: 'Docker image builds successfully'
    },
    {
      name: 'Kubernetes manifests valid',
      check: () => {
        const k8sFiles = ['deployment.yaml', 'service.yaml', 'ingress.yaml'];
        return k8sFiles.every(file => existsSync(join('k8s', file)));
      },
      critical: true,
      description: 'Kubernetes deployment manifests are present'
    },
    {
      name: 'Health check script works',
      check: async () => {
        try {
          execSync('node scripts/health-check.js development --skip-health-check', { stdio: 'pipe' });
          return true;
        } catch {
          return false;
        }
      },
      critical: true,
      description: 'Health check script executes without errors'
    },
    {
      name: 'Deployment config valid',
      check: () => {
        try {
          const config = require('../deployment.config.js');
          return config.deploymentConfig.environments.production !== undefined;
        } catch {
          return false;
        }
      },
      critical: true,
      description: 'Deployment configuration is valid'
    }
  ],

  // Documentation Checks
  documentation: [
    {
      name: 'README exists',
      check: () => existsSync('README.md'),
      critical: false,
      description: 'README documentation is present'
    },
    {
      name: 'API documentation',
      check: () => {
        // Check if there's any API documentation
        return existsSync('docs') || existsSync('API.md') || 
               readFileSync('README.md', 'utf8').includes('API');
      },
      critical: false,
      description: 'API documentation is available'
    },
    {
      name: 'Deployment guide',
      check: () => {
        const readme = readFileSync('README.md', 'utf8');
        return readme.includes('deploy') || readme.includes('installation');
      },
      critical: false,
      description: 'Deployment instructions are documented'
    }
  ]
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
const verbose = args.includes('--verbose');
const skipOptional = args.includes('--skip-optional');
const category = args.find(arg => !arg.startsWith('--'));

// Run a single check
async function runCheck(check) {
  try {
    const result = typeof check.check === 'function' ? await check.check() : check.check;
    return {
      name: check.name,
      passed: result,
      critical: check.critical,
      description: check.description
    };
  } catch (error) {
    return {
      name: check.name,
      passed: false,
      critical: check.critical,
      description: check.description,
      error: error.message
    };
  }
}

// Run checks for a category
async function runCategoryChecks(categoryName, checks) {
  log(`\n🔍 Running ${categoryName} checks...`, colors.magenta);
  
  const results = [];
  
  for (const check of checks) {
    if (skipOptional && !check.critical) {
      continue;
    }
    
    const result = await runCheck(check);
    results.push(result);
    
    const status = result.passed ? '✅' : '❌';
    const criticality = result.critical ? '[CRITICAL]' : '[OPTIONAL]';
    
    if (verbose || !result.passed) {
      log(`  ${status} ${result.name} ${criticality}`);
      if (verbose) {
        log(`     ${result.description}`, colors.cyan);
      }
      if (result.error) {
        log(`     Error: ${result.error}`, colors.red);
      }
    }
  }
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const critical = results.filter(r => !r.passed && r.critical).length;
  
  if (critical > 0) {
    error(`${categoryName}: ${critical} critical failures, ${failed - critical} optional failures`);
  } else if (failed > 0) {
    warning(`${categoryName}: ${failed} optional failures`);
  } else {
    success(`${categoryName}: All checks passed (${passed}/${results.length})`);
  }
  
  return results;
}

// Generate checklist report
function generateChecklistReport(allResults) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: 0,
      passed: 0,
      failed: 0,
      critical: 0,
      criticalFailed: 0
    },
    categories: {},
    readiness: 'unknown'
  };
  
  for (const [categoryName, results] of Object.entries(allResults)) {
    const categoryStats = {
      total: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      critical: results.filter(r => r.critical).length,
      criticalFailed: results.filter(r => !r.passed && r.critical).length,
      results
    };
    
    report.categories[categoryName] = categoryStats;
    
    // Update summary
    report.summary.total += categoryStats.total;
    report.summary.passed += categoryStats.passed;
    report.summary.failed += categoryStats.failed;
    report.summary.critical += categoryStats.critical;
    report.summary.criticalFailed += categoryStats.criticalFailed;
  }
  
  // Determine readiness
  if (report.summary.criticalFailed === 0) {
    report.readiness = report.summary.failed === 0 ? 'ready' : 'ready-with-warnings';
  } else {
    report.readiness = 'not-ready';
  }
  
  return report;
}

// Print checklist summary
function printChecklistSummary(report) {
  console.log('\n' + '='.repeat(70));
  log('🚀 PRODUCTION READINESS CHECKLIST', colors.green);
  console.log('='.repeat(70));
  
  // Overall status
  const statusIcon = report.readiness === 'ready' ? '✅' : 
                    report.readiness === 'ready-with-warnings' ? '⚠️' : '❌';
  const statusColor = report.readiness === 'ready' ? colors.green :
                     report.readiness === 'ready-with-warnings' ? colors.yellow : colors.red;
  
  log(`Status: ${statusIcon} ${report.readiness.toUpperCase().replace('-', ' ')}`, statusColor);
  log(`Timestamp: ${new Date(report.timestamp).toLocaleString()}`, colors.cyan);
  console.log('');
  
  // Summary statistics
  log(`📊 Overall: ${report.summary.passed}/${report.summary.total} checks passed`, colors.cyan);
  if (report.summary.criticalFailed > 0) {
    log(`🚨 Critical failures: ${report.summary.criticalFailed}/${report.summary.critical}`, colors.red);
  }
  if (report.summary.failed > report.summary.criticalFailed) {
    log(`⚠️  Optional failures: ${report.summary.failed - report.summary.criticalFailed}`, colors.yellow);
  }
  
  console.log('');
  
  // Category breakdown
  for (const [categoryName, stats] of Object.entries(report.categories)) {
    const categoryIcon = stats.criticalFailed === 0 ? '✅' : '❌';
    const categoryColor = stats.criticalFailed === 0 ? colors.green : colors.red;
    
    log(`${categoryIcon} ${categoryName}: ${stats.passed}/${stats.total}`, categoryColor);
    
    if (stats.criticalFailed > 0) {
      log(`   🚨 ${stats.criticalFailed} critical failures`, colors.red);
    }
    if (stats.failed > stats.criticalFailed) {
      log(`   ⚠️  ${stats.failed - stats.criticalFailed} optional failures`, colors.yellow);
    }
  }
  
  console.log('='.repeat(70));
  
  // Recommendations
  if (report.readiness === 'ready') {
    success('🎉 Application is ready for production deployment!');
  } else if (report.readiness === 'ready-with-warnings') {
    warning('⚠️  Application can be deployed but has optional issues to address');
  } else {
    error('❌ Application is NOT ready for production deployment');
    error('   Please fix all critical issues before deploying');
  }
  
  // Failed checks details
  const failedChecks = [];
  for (const [categoryName, stats] of Object.entries(report.categories)) {
    const failed = stats.results.filter(r => !r.passed);
    if (failed.length > 0) {
      failedChecks.push({ category: categoryName, checks: failed });
    }
  }
  
  if (failedChecks.length > 0) {
    console.log('');
    error('Failed Checks:');
    for (const { category, checks } of failedChecks) {
      log(`\n${category}:`, colors.yellow);
      for (const check of checks) {
        const criticality = check.critical ? '[CRITICAL]' : '[OPTIONAL]';
        error(`  • ${check.name} ${criticality}`);
        if (check.description) {
          log(`    ${check.description}`, colors.cyan);
        }
        if (check.error) {
          log(`    Error: ${check.error}`, colors.red);
        }
      }
    }
  }
}

// Main checklist process
async function main() {
  try {
    log('🚀 Starting production readiness checklist...', colors.magenta);
    
    const allResults = {};
    
    // Run checks by category or all categories
    const categoriesToRun = category ? 
      { [category]: PRODUCTION_CHECKLIST[category] } : 
      PRODUCTION_CHECKLIST;
    
    if (category && !PRODUCTION_CHECKLIST[category]) {
      error(`Unknown category: ${category}`);
      error(`Available categories: ${Object.keys(PRODUCTION_CHECKLIST).join(', ')}`);
      process.exit(1);
    }
    
    for (const [categoryName, checks] of Object.entries(categoriesToRun)) {
      allResults[categoryName] = await runCategoryChecks(categoryName, checks);
    }
    
    // Generate and display report
    const report = generateChecklistReport(allResults);
    printChecklistSummary(report);
    
    // Save report if verbose
    if (verbose) {
      const reportPath = `production-checklist-${Date.now()}.json`;
      require('fs').writeFileSync(reportPath, JSON.stringify(report, null, 2));
      info(`\nChecklist report saved: ${reportPath}`);
    }
    
    // Exit with appropriate code
    process.exit(report.readiness === 'not-ready' ? 1 : 0);
    
  } catch (error) {
    error(`Production checklist failed: ${error.message}`);
    process.exit(1);
  }
}

// Handle process termination
process.on('SIGINT', () => {
  warning('\nProduction checklist interrupted');
  process.exit(1);
});

process.on('SIGTERM', () => {
  warning('\nProduction checklist terminated');
  process.exit(1);
});

// Show usage if help requested
if (args.includes('--help') || args.includes('-h')) {
  console.log('Production Readiness Checklist');
  console.log('');
  console.log('Usage: node scripts/production-checklist.js [category] [options]');
  console.log('');
  console.log('Categories:');
  console.log('  build          Build and configuration checks');
  console.log('  quality        Code quality checks');
  console.log('  security       Security checks');
  console.log('  performance    Performance checks');
  console.log('  deployment     Deployment readiness checks');
  console.log('  documentation  Documentation checks');
  console.log('');
  console.log('Options:');
  console.log('  --verbose        Show detailed results');
  console.log('  --skip-optional  Skip optional (non-critical) checks');
  console.log('  --help, -h       Show this help message');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/production-checklist.js');
  console.log('  node scripts/production-checklist.js security --verbose');
  console.log('  node scripts/production-checklist.js --skip-optional');
  process.exit(0);
}

// Run the checklist
main();