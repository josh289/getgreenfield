---
title: "Deployment Guide"
---

# Deployment Guide

## Overview

The banyan-core platform deploys as a Docker Compose stack with all services containerized. This guide covers local development, staging, and production deployment strategies.

## Local Development

### Quick Start

```bash
# Clone repository
git clone https://github.com/your-org/banyan-core.git
cd banyan-core

# Start all services
docker compose up

# Verify services are healthy
docker compose ps
```

### Development Workflow

```bash
# Start infrastructure only
docker compose up postgres rabbitmq redis jaeger grafana elasticsearch

# Run services locally for debugging
cd platform/services/api-gateway
pnpm run dev

# Watch mode with hot-reload
pnpm run dev
```

### Stopping Services

```bash
# Stop all services
docker compose down

# Stop and remove volumes (reset data)
docker compose down -v

# Stop specific service
docker compose stop api-gateway
```

## Production Deployment

### Prerequisites

- **Docker Engine**: 20.10+
- **Docker Compose**: 2.0+
- **CPU**: 4+ cores recommended
- **Memory**: 8GB+ RAM recommended
- **Disk**: 50GB+ available space

### Environment Configuration

Create production `.env` file:

```bash
# Production environment
NODE_ENV=production

# Database (use secure credentials)
DATABASE_HOST=postgres
DATABASE_NAME=eventstore
DATABASE_USER=prod_user
DATABASE_PASSWORD=<SECURE_PASSWORD>
DATABASE_PORT=5432

# Message Bus
RABBITMQ_URL=amqp://prod_user:<SECURE_PASSWORD>@rabbitmq:5672

# Cache
REDIS_URL=redis://:<SECURE_PASSWORD>@redis:6379

# JWT (use strong secret)
JWT_SECRET=<SECURE_RANDOM_SECRET>
JWT_EXPIRATION=300

# Auth0 (if using external auth)
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_AUDIENCE=https://api.your-domain.com
AUTH0_ISSUER=https://your-tenant.us.auth0.com/

# Telemetry
JAEGER_ENDPOINT=http://jaeger:4318/v1/traces

# Admin email
ADMIN_EMAIL=admin@your-domain.com
```

### Security Hardening

#### 1. Change Default Credentials

```yaml
# docker-compose.yml
services:
  rabbitmq:
    environment:
      RABBITMQ_DEFAULT_USER: ${RABBITMQ_USER}
      RABBITMQ_DEFAULT_PASS: ${RABBITMQ_PASSWORD}

  postgres:
    environment:
      POSTGRES_USER: ${DATABASE_USER}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}

  redis:
    command: redis-server --requirepass ${REDIS_PASSWORD}
```

#### 2. Enable TLS

```yaml
services:
  api-gateway:
    environment:
      ENABLE_HTTPS: true
      SSL_CERT_PATH: /certs/server.crt
      SSL_KEY_PATH: /certs/server.key
    volumes:
      - ./certs:/certs:ro
```

#### 3. Network Isolation

```yaml
networks:
  frontend:
    driver: bridge
  backend:
    driver: bridge
    internal: true  # No external access

services:
  api-gateway:
    networks:
      - frontend  # Exposed
      - backend

  postgres:
    networks:
      - backend  # Internal only
```

### Resource Limits

Configure resource limits for production:

```yaml
services:
  api-gateway:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G

  postgres:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
        reservations:
          cpus: '1'
          memory: 2G

  rabbitmq:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G

  elasticsearch:
    environment:
      ES_JAVA_OPTS: "-Xms2g -Xmx2g"
    deploy:
      resources:
        limits:
          memory: 4G
```

### Health Checks

Ensure all services have health checks:

```yaml
services:
  api-gateway:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3003/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  postgres:
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DATABASE_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  rabbitmq:
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 30s
      timeout: 10s
      retries: 5
```

### Starting Production

```bash
# Pull latest images
docker compose pull

# Start in detached mode
docker compose up -d

# Check service health
docker compose ps

# View logs
docker compose logs -f

# Follow specific service
docker compose logs -f api-gateway
```

## Horizontal Scaling

### Scaling Services

Scale specific services for load:

```bash
# Scale API Gateway to 3 instances
docker compose up -d --scale api-gateway=3

# Scale business service
docker compose up -d --scale user-service=5
```

### Load Balancing

Use reverse proxy for load balancing:

```yaml
# docker-compose.yml
services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - api-gateway

  api-gateway:
    deploy:
      replicas: 3
    expose:
      - "3003"
```

**nginx.conf**:
```nginx
upstream api_gateway {
    least_conn;
    server api-gateway-1:3003;
    server api-gateway-2:3003;
    server api-gateway-3:3003;
}

server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://api_gateway;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### Message Bus Considerations

RabbitMQ handles load balancing automatically:

- **Commands/Queries**: Round-robin to available handlers
- **Events**: Each subscriber gets copy
- **Competing Consumers**: Multiple instances share queue

## Data Persistence

### Backup Strategy

#### PostgreSQL Backup

```bash
# Create backup
docker exec flow-platform-postgres pg_dump -U ${DATABASE_USER} eventstore > backup.sql

# Automated daily backups
0 2 * * * docker exec flow-platform-postgres pg_dump -U ${DATABASE_USER} eventstore | gzip > /backups/eventstore-$(date +\%Y\%m\%d).sql.gz
```

#### Volume Backup

```bash
# Backup volumes
docker run --rm -v flow-platform-postgres-data:/data -v $(pwd):/backup alpine tar czf /backup/postgres-backup.tar.gz /data

# Restore volume
docker run --rm -v flow-platform-postgres-data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres-backup.tar.gz -C /
```

### Disaster Recovery

1. **Stop services**: `docker compose down`
2. **Restore volumes** from backup
3. **Restore database** from SQL dump
4. **Start services**: `docker compose up -d`
5. **Verify health**: `docker compose ps`

## Monitoring

### Production Monitoring

#### Grafana Dashboards

Access: `http://your-domain:5005`

**Key Dashboards**:
- Service health and performance
- Message bus metrics
- Database performance
- Error rates and trends
- Business metrics

#### Jaeger Tracing

Access: `http://your-domain:16686`

Monitor distributed traces for:
- Slow requests
- Error traces
- Service dependencies
- Performance bottlenecks

### Alerting

Configure alerts for critical metrics:

```yaml
# Grafana alert configuration
alerts:
  - name: High Error Rate
    condition: error_rate > 0.05
    for: 5m
    notify: slack, email

  - name: Database Connection Issues
    condition: postgres.connections.active < postgres.connections.max * 0.9
    for: 2m
    notify: pagerduty

  - name: Queue Depth Warning
    condition: rabbitmq.queue.depth > 1000
    for: 5m
    notify: slack
```

## Logging

### Centralized Logging

#### Elasticsearch Storage

Logs stored in Elasticsearch indices:

```bash
# View indices
curl http://localhost:9200/_cat/indices?v

# Query logs
curl http://localhost:9200/logs-*/_search?q=level:error

# Delete old logs (30+ days)
curl -X DELETE "http://localhost:9200/logs-*/_delete_by_query" -H 'Content-Type: application/json' -d'
{
  "query": {
    "range": {
      "timestamp": {
        "lt": "now-30d"
      }
    }
  }
}
'
```

### Log Rotation

Configure Elasticsearch index lifecycle:

```bash
# Create lifecycle policy
curl -X PUT "http://localhost:9200/_ilm/policy/logs-policy" -H 'Content-Type: application/json' -d'
{
  "policy": {
    "phases": {
      "hot": {
        "actions": {
          "rollover": {
            "max_size": "50GB",
            "max_age": "7d"
          }
        }
      },
      "delete": {
        "min_age": "30d",
        "actions": {
          "delete": {}
        }
      }
    }
  }
}
'
```

## Updates and Maintenance

### Rolling Updates

```bash
# Pull new image
docker compose pull api-gateway

# Restart with zero downtime (if scaled)
docker compose up -d --no-deps --scale api-gateway=3 api-gateway

# Verify health
docker compose ps
```

### Database Migrations

```bash
# Run migrations in devbox container
docker exec flow-platform-devbox pnpm run migrate

# Or run migration service
docker compose run --rm migrations
```

### Maintenance Window

For major updates:

```bash
# 1. Notify users of maintenance
# 2. Drain traffic (stop accepting new requests)
# 3. Wait for in-flight requests to complete
# 4. Stop services
docker compose down

# 5. Update configuration
# 6. Pull new images
docker compose pull

# 7. Start services
docker compose up -d

# 8. Verify health
docker compose ps

# 9. Monitor logs
docker compose logs -f
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
docker compose logs <service-name>

# Check dependencies
docker compose ps

# Verify configuration
docker compose config
```

### High Memory Usage

```bash
# Check container memory
docker stats

# Increase limits if needed
# Edit docker-compose.yml resources section

# Restart service
docker compose restart <service-name>
```

### Database Connection Pool Exhausted

```bash
# Check active connections
docker exec flow-platform-postgres psql -U ${DATABASE_USER} -d eventstore -c "SELECT count(*) FROM pg_stat_activity;"

# Increase pool size in service configuration
DATABASE_POOL_MAX=20

# Restart services
docker compose restart
```

## Best Practices

### 1. Use Environment Variables

```yaml
# Don't hardcode credentials
services:
  postgres:
    environment:
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD}
```

### 2. Enable Health Checks

All services should have health checks for automatic recovery.

### 3. Set Resource Limits

Prevent resource exhaustion:

```yaml
deploy:
  resources:
    limits:
      memory: 2G
```

### 4. Use Named Volumes

For data persistence:

```yaml
volumes:
  postgres-data:
    name: production-postgres-data
```

### 5. Implement Backups

Automated daily backups are essential for production.

## Next Steps

- [Scalability Guide](./scalability.md)
- [Monitoring Guide](./monitoring.md)
- [Message Bus Guide](./message-bus.md)
