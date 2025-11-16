---
title: "Deployment Infrastructure"
description: "Docker-based deployment with service orchestration and environment configuration"
category: "concepts"
tags: ["infrastructure", "docker", "deployment"]
difficulty: "intermediate"
related_concepts:
  - "../architecture/platform-overview.md"
prerequisites: []
last_updated: "2025-01-15"
status: "published"
---

# Deployment Infrastructure

> **Core Idea:** Docker Compose orchestrates platform services (RabbitMQ, PostgreSQL, Redis, Jaeger) with devbox for development and isolated containers for production.

## Overview

The platform uses Docker for consistent deployment across development and production:
- **Development**: `docker-compose.yml` with devbox container
- **Production**: Individual service containers with Docker orchestration
- **Infrastructure**: Shared services (RabbitMQ, PostgreSQL, Redis, Jaeger, Grafana)

## Development Deployment

### Start Platform

```bash
# Start all infrastructure + devbox
docker compose up

# Services started:
# - devbox (development environment)
# - rabbitmq (message bus)
# - postgres (event store)
# - redis (cache)
# - jaeger (tracing)
# - elasticsearch (jaeger backend)
# - grafana (dashboards)
```

### Access Points

- Devbox shell: `docker exec -it flow-platform-devbox bash`
- RabbitMQ UI: `http://localhost:55672` (admin/admin123)
- Jaeger UI: `http://localhost:16686`
- Grafana: `http://localhost:5005` (admin/admin)
- PostgreSQL: `localhost:55432` (actor_user/actor_pass123)
- Redis: `localhost:56379`

## Production Deployment

### Service Container

```dockerfile
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY dist/ ./dist/

# Run service
CMD ["node", "dist/main.js"]
```

### Environment Variables

```bash
# Service configuration
NODE_ENV=production
SERVICE_NAME=order-service
SERVICE_VERSION=1.0.0

# Infrastructure
DATABASE_HOST=postgres-production
DATABASE_NAME=eventstore
DATABASE_USER=production_user
DATABASE_PASSWORD=<secure-password>
RABBITMQ_URL=amqp://production-user:<password>@rabbitmq-cluster:5672
REDIS_URL=redis://:<password>@redis-cluster:6379

# Telemetry
JAEGER_ENDPOINT=http://jaeger:4318/v1/traces
```

### Health Checks

```yaml
healthcheck:
  test: ["CMD", "node", "health-check.js"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

## Scaling

### Horizontal Scaling

```bash
# Scale service instances
docker compose up --scale order-service=3

# Load balancing automatic via message bus
# Each instance consumes from same queue
```

### Resource Limits

```yaml
services:
  order-service:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## Monitoring

### Container Health

```bash
# Check container status
docker ps

# View logs
docker logs flow-platform-devbox

# Resource usage
docker stats
```

### Infrastructure Health

```bash
# RabbitMQ
docker exec rabbitmq rabbitmqctl status

# PostgreSQL
docker exec postgres pg_isready

# Redis
docker exec redis redis-cli ping
```

## Best Practices

1. **Use Health Checks**
   - All services should expose health endpoint
   - Platform services respond to health check queries

2. **Set Resource Limits**
   - Prevent resource exhaustion
   - Enable auto-scaling triggers

3. **Centralized Logging**
   - All logs to stdout/stderr
   - Use logging aggregation (ELK stack)

4. **Secrets Management**
   - Never commit secrets to repository
   - Use environment variables or secret management

5. **Graceful Shutdown**
   - Handle SIGTERM signal
   - Complete in-flight requests
   - Close connections cleanly

## Troubleshooting

### Issue: Service Won't Start

```bash
# Check logs
docker logs <container-name>

# Check environment
docker exec <container-name> env

# Check connectivity
docker exec <container-name> ping postgres
```

### Issue: Database Connection Failed

```bash
# Verify PostgreSQL running
docker ps | grep postgres

# Test connection
docker exec postgres pg_isready

# Check credentials
docker exec postgres psql -U actor_user -d eventstore -c "SELECT 1"
```

## Further Reading

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)
- [Platform Overview](../architecture/platform-overview.md)
