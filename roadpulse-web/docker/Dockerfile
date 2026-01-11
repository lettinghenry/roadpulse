# Multi-stage Dockerfile for RoadPulse Web Application
# Optimized for production deployment with security and performance

# Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --silent

# Copy source code
COPY . .

# Set build environment
ARG BUILD_ENV=production
ENV NODE_ENV=production
ENV VITE_DEPLOYMENT_ENVIRONMENT=${BUILD_ENV}

# Build application
RUN npm run build:${BUILD_ENV}

# Production stage
FROM nginx:alpine AS production

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache \
    curl \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S roadpulse -u 1001 -G nodejs

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/default.conf /etc/nginx/conf.d/default.conf

# Copy security headers configuration
COPY docker/security-headers.conf /etc/nginx/conf.d/security-headers.conf

# Create directories and set permissions
RUN mkdir -p /var/cache/nginx /var/log/nginx /var/run && \
    chown -R roadpulse:nodejs /var/cache/nginx /var/log/nginx /var/run /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health.json || exit 1

# Switch to non-root user
USER roadpulse

# Expose port
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

# Development stage (for local development)
FROM node:18-alpine AS development

WORKDIR /app

# Install development dependencies
RUN apk add --no-cache git

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm ci --silent

# Copy source code
COPY . .

# Expose development port
EXPOSE 5173

# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Testing stage
FROM builder AS testing

# Install test dependencies
RUN npm ci --silent

# Copy test files
COPY . .

# Run tests
RUN npm run test
RUN npm run lint

# Build for testing
RUN npm run build

# Default to production stage
FROM production