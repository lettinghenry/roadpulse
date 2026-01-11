# RoadPulse Web Application - Deployment Guide

This document provides comprehensive instructions for deploying the RoadPulse Web Application across different environments.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Environment Configuration](#environment-configuration)
- [Build Process](#build-process)
- [Deployment Methods](#deployment-methods)
- [Production Readiness](#production-readiness)
- [Monitoring and Health Checks](#monitoring-and-health-checks)
- [Troubleshooting](#troubleshooting)

## Overview

The RoadPulse Web Application supports deployment to three environments:

- **Development**: Local development and testing
- **Staging**: Pre-production testing and validation
- **Production**: Live production environment

Each environment has specific configurations optimized for its purpose.

## Prerequisites

### Required Tools

- **Node.js** (v18 or later)
- **npm** (v9 or later)
- **Docker** (v20 or later)
- **kubectl** (v1.28 or later) - for Kubernetes deployments
- **Git** - for version control

### Required Access

- GitHub repository access
- Container registry access (GitHub Container Registry)
- Kubernetes cluster access (for K8s deployments)
- Environment-specific secrets and configurations

## Environment Configuration

### Environment Files

Each environment uses a specific configuration file:

- `.env.development` - Development settings
- `.env.staging` - Staging settings  
- `.env.production` - Production settings

### Key Configuration Variables

```bash
# API Configuration
VITE_API_BASE_URL=https://api.roadpulse.app/api
VITE_API_TIMEOUT=10000
VITE_API_RETRY_ATTEMPTS=2

# Map Configuration
VITE_DEFAULT_MAP_CENTER_LAT=40.7128
VITE_DEFAULT_MAP_CENTER_LNG=-74.0060
VITE_DEFAULT_MAP_ZOOM=12

# Performance Configuration
VITE_MAX_VISIBLE_MARKERS=1000
VITE_CLUSTER_RADIUS=60
VITE_HEAT_MAP_RADIUS=25

# Security Configuration
VITE_ENABLE_CSP=true
VITE_API_KEY=your-production-api-key

# Deployment Configuration
VITE_APP_VERSION=1.0.0
VITE_DEPLOYMENT_ENVIRONMENT=production
```

### Validating Configuration

Before deployment, validate your environment configuration:

```bash
# Validate production environment
npm run validate-env production --strict

# Validate staging environment
npm run validate-env staging
```

## Build Process

### Development Build

```bash
# Install dependencies
npm ci

# Build for development
npm run build:development

# Preview the build
npm run preview
```

### Staging Build

```bash
# Build for staging
npm run build:staging

# Run production checklist
npm run production-checklist
```

### Production Build

```bash
# Build for production
npm run build:production

# Run comprehensive production readiness check
npm run production-readiness

# Analyze bundle size (optional)
npm run analyze
```

### Build Artifacts

The build process generates:

- `dist/` - Built application files
- `dist/build-manifest.json` - Build metadata
- `dist/health.json` - Health check endpoint
- `dist/_headers` - Security headers configuration
- `dist/deploy-config.json` - Deployment configuration

## Deployment Methods

### 1. Traditional Deployment

#### Development

```bash
# Deploy to development
npm run deploy:development

# Health check
npm run health-check:dev
```

#### Staging

```bash
# Deploy to staging
npm run deploy:staging

# Health check
npm run health-check:staging
```

#### Production

```bash
# Pre-deployment validation
npm run production-readiness

# Deploy to production
npm run deploy:production

# Health check
npm run health-check:prod
```

### 2. Docker Deployment

#### Build Docker Image

```bash
# Build development image
npm run docker:build:dev

# Build production image
npm run docker:build:prod

# Run production container
npm run docker:run:prod
```

#### Docker Compose

```bash
# Development environment
npm run docker:run:dev

# Production environment
npm run docker:run:prod

# Staging environment
npm run docker:run:staging
```

### 3. Kubernetes Deployment

#### Prerequisites

```bash
# Configure kubectl context
kubectl config use-context your-cluster-context

# Verify cluster access
kubectl cluster-info
```

#### Deploy to Kubernetes

```bash
# Deploy to development
npm run deploy:k8s:dev ghcr.io/roadpulse/roadpulse-web:latest

# Deploy to staging
npm run deploy:k8s:staging ghcr.io/roadpulse/roadpulse-web:v1.0.0

# Deploy to production
npm run deploy:k8s:prod ghcr.io/roadpulse/roadpulse-web:v1.0.0
```

#### Kubernetes Resources

The deployment creates:

- **Namespace**: `roadpulse`
- **Deployment**: `roadpulse-web`
- **Service**: `roadpulse-web-service`
- **Ingress**: `roadpulse-web-ingress`
- **ConfigMap**: `roadpulse-web-config`

#### Monitoring Deployment

```bash
# Watch deployment status
kubectl get pods -n roadpulse -w

# Check deployment logs
kubectl logs -f deployment/roadpulse-web -n roadpulse

# Get deployment status
kubectl get deployment roadpulse-web -n roadpulse -o wide
```

### 4. CI/CD Deployment

#### GitHub Actions

The repository includes automated CI/CD workflows:

- **CI/CD Pipeline** (`.github/workflows/ci-cd.yml`)
  - Triggered on push to `main` or `develop`
  - Runs tests, builds, and deploys automatically

- **Production Deployment** (`.github/workflows/production-deployment.yml`)
  - Triggered on release publication
  - Includes comprehensive validation and rollback

#### Manual Workflow Trigger

```bash
# Trigger production deployment via GitHub CLI
gh workflow run production-deployment.yml \
  -f environment=production \
  -f skip_tests=false
```

## Production Readiness

### Pre-Deployment Checklist

Run the comprehensive production readiness check:

```bash
npm run production-readiness
```

This validates:

- ✅ Environment configuration
- ✅ Security settings
- ✅ Code quality (linting, tests, type checking)
- ✅ Performance optimization
- ✅ Deployment artifacts
- ✅ Docker image build
- ✅ Kubernetes manifests

### Security Considerations

#### Environment Variables

- Never commit sensitive values to version control
- Use environment-specific `.env` files
- Validate all required variables before deployment

#### Security Headers

Production deployments include:

```
Content-Security-Policy: default-src 'self'; ...
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
```

#### HTTPS Enforcement

- All production URLs must use HTTPS
- HTTP requests are automatically redirected to HTTPS
- HSTS headers are enabled in production

### Performance Optimization

#### Bundle Optimization

- Code splitting by vendor, features, and routes
- Tree shaking to remove unused code
- Minification and compression in production
- Source maps disabled in production

#### Caching Strategy

- Static assets: 1 year cache with immutable flag
- HTML files: 1 hour cache with revalidation
- API responses: 5 minutes cache
- Service worker: No cache

#### Resource Limits

| Environment | CPU Request | Memory Request | CPU Limit | Memory Limit |
|-------------|-------------|----------------|-----------|--------------|
| Development | 100m        | 128Mi          | 500m      | 512Mi        |
| Staging     | 200m        | 256Mi          | 1         | 1Gi          |
| Production  | 500m        | 512Mi          | 2         | 2Gi          |

## Monitoring and Health Checks

### Health Check Endpoints

- **Application Health**: `/health.json`
- **Build Information**: `/build-manifest.json`
- **Configuration**: `/config.json`

### Health Check Scripts

```bash
# Check application health
npm run health-check:prod

# Verbose health check with detailed output
npm run health-check:prod -- --verbose

# Performance monitoring
npm run lighthouse
```

### Monitoring Integration

#### Prometheus Metrics

The application exposes metrics at `/metrics` for Prometheus scraping:

- Request count and duration
- Error rates
- Performance metrics
- Custom application metrics

#### Grafana Dashboards

Pre-configured dashboards for:

- Application performance
- Infrastructure metrics
- User experience monitoring
- Error tracking

#### Alerting Rules

Configured alerts for:

- High error rate (>5% for 5 minutes)
- High response time (>3s p95 for 5 minutes)
- Low availability (<99% for 2 minutes)
- Memory/CPU usage thresholds

## Troubleshooting

### Common Issues

#### Build Failures

```bash
# Clear cache and rebuild
npm run clean
npm ci
npm run build:production
```

#### Environment Variable Issues

```bash
# Validate environment configuration
npm run validate-env production --verbose

# Check for missing variables
node scripts/validate-env.js production --strict
```

#### Docker Build Issues

```bash
# Build with verbose output
docker build -f docker/Dockerfile --target production -t roadpulse-web:debug . --progress=plain

# Check Docker logs
docker logs roadpulse-web-container
```

#### Kubernetes Deployment Issues

```bash
# Check pod status
kubectl get pods -n roadpulse

# Describe problematic pod
kubectl describe pod <pod-name> -n roadpulse

# Check logs
kubectl logs <pod-name> -n roadpulse

# Check events
kubectl get events -n roadpulse --sort-by='.lastTimestamp'
```

### Rollback Procedures

#### Kubernetes Rollback

```bash
# Rollback to previous version
kubectl rollout undo deployment/roadpulse-web -n roadpulse

# Rollback to specific revision
kubectl rollout undo deployment/roadpulse-web --to-revision=2 -n roadpulse

# Check rollback status
kubectl rollout status deployment/roadpulse-web -n roadpulse
```

#### Docker Rollback

```bash
# Stop current container
docker stop roadpulse-web-prod

# Start previous version
docker run -d --name roadpulse-web-prod-rollback \
  -p 8080:8080 \
  ghcr.io/roadpulse/roadpulse-web:previous-version
```

### Performance Issues

#### Bundle Size Analysis

```bash
# Analyze bundle size
npm run analyze

# Check for large dependencies
npm run build:production -- --analyze
```

#### Memory Leaks

```bash
# Monitor memory usage
kubectl top pods -n roadpulse

# Check for memory leaks in logs
kubectl logs deployment/roadpulse-web -n roadpulse | grep -i memory
```

### Support and Escalation

For deployment issues:

1. Check this documentation
2. Review application logs
3. Check monitoring dashboards
4. Contact the development team
5. Escalate to DevOps team if infrastructure-related

## Additional Resources

- [Application README](./README.md)
- [API Documentation](./docs/API.md)
- [Development Guide](./docs/DEVELOPMENT.md)
- [Security Guidelines](./docs/SECURITY.md)
- [Performance Optimization](./docs/PERFORMANCE.md)

---

**Last Updated**: January 2026  
**Version**: 1.0.0