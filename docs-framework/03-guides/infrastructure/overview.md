# Infrastructure Overview

## Introduction

The banyan-core platform runs on Docker Compose with a complete infrastructure stack. All infrastructure is **abstracted away from services** - developers write pure business logic while the platform handles messaging, databases, observability, and more.

## Infrastructure Stack

### Core Components

| Component | Purpose | Port | Technology |
|-----------|---------|------|------------|
| **Message Bus** | Inter-service communication | 5672, 15672 | RabbitMQ 3.13 |
| **Event Store** | Event sourcing database | 5432 | PostgreSQL 16 |
| **Cache** | Query caching, sessions | 6379 | Redis 7 |
| **Distributed Tracing** | Request tracing | 16686, 4318 | Jaeger 2.9 |
| **Metrics** | Service metrics storage | 9200 | Elasticsearch 8.11 |
| **Dashboards** | Observability UI | 3000 | Grafana 11.5 |

### Platform Services

| Service | Purpose | Port | Implementation |
|---------|---------|------|----------------|
| **API Gateway** | External HTTP/GraphQL/WebSocket | 3003 | TypeScript |
| **Service Discovery** | Contract registry | 3002 | TypeScript |
| **Auth Service** | User authentication | 3001 | TypeScript |

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    External Clients                      │
│            (REST, GraphQL, WebSocket)                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│              API Gateway (Port 3003)                     │
│  • Protocol Translation   • Authentication               │
│  • Rate Limiting         • Permission Checks             │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│             RabbitMQ Message Bus (Port 5672)             │
│  • Command/Query Routing  • Event Publishing             │
│  • Queue Management       • Message Persistence          │
└─────┬──────────────┬──────────────┬─────────────────────┘
      │              │              │
      ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────────────────┐
│ Service  │  │ Service  │  │ Platform Services    │
│    A     │  │    B     │  │ • Auth (3001)        │
│          │  │          │  │ • Discovery (3002)   │
└────┬─────┘  └────┬─────┘  └──────────┬───────────┘
     │             │                   │
     └─────────────┴───────────────────┘
                   │
                   ▼
     ┌─────────────────────────────┐
     │  PostgreSQL Event Store     │
     │  • Events       • Snapshots │
     │  • Projections  • Metadata  │
     └─────────────────────────────┘
```

## Zero-Infrastructure Development

### What Developers Write

```typescript
// Pure business logic - NO infrastructure code
@CommandHandler(CreateUserContract)
export class CreateUserHandler {
  async handle(input: { email: string; name: string }) {
    const user = await this.userRepository.create({
      email: input.email,
      name: input.name
    });
    return user;
  }
}
```

### What the Platform Handles

- **Message routing** via RabbitMQ
- **Database connections** to PostgreSQL
- **Caching** with Redis
- **Distributed tracing** with Jaeger
- **Metrics collection** with Elasticsearch
- **Error handling** and retries
- **Authentication** context propagation
- **Correlation ID** propagation

## Starting the Infrastructure

### Docker Compose

```bash
# Start all infrastructure + platform services
docker compose up

# Start specific services
docker compose up postgres rabbitmq redis

# View logs
docker compose logs -f

# Stop all
docker compose down

# Reset (delete data)
docker compose down -v
```

### Service Dependencies

Services start in dependency order:

1. **PostgreSQL** (database)
2. **Elasticsearch** (metrics storage)
3. **RabbitMQ** (message bus)
4. **Redis** (cache)
5. **Jaeger** (tracing - depends on Elasticsearch)
6. **Grafana** (dashboards - depends on Elasticsearch/Jaeger)
7. **Platform Services** (depend on all infrastructure)

## Port Mapping

### External Access

| Service | Container Port | Host Port | URL |
|---------|---------------|-----------|-----|
| API Gateway | 3003 | 3003 | http://localhost:3003 |
| Auth Service | 3001 | 3001 | http://localhost:3001 |
| Service Discovery | 3002 | 3002 | http://localhost:3002 |
| RabbitMQ Management | 15672 | 55672 | http://localhost:55672 |
| PostgreSQL | 5432 | 55432 | localhost:55432 |
| Redis | 6379 | 56379 | localhost:56379 |
| Jaeger UI | 16686 | 16686 | http://localhost:16686 |
| Grafana | 3000 | 5005 | http://localhost:5005 |
| Elasticsearch | 9200 | 9200 | http://localhost:9200 |

### Internal Communication

Services communicate via Docker network `flow-platform-network`:

```yaml
services:
  api-gateway:
    environment:
      RABBITMQ_URL: amqp://admin:admin123@rabbitmq:5672
      DATABASE_URL: postgresql://actor_user:actor_pass123@postgres:5432/eventstore
      REDIS_URL: redis://:redis123@redis:6379
      JAEGER_ENDPOINT: http://jaeger:4318/v1/traces
```

## Data Persistence

### Volumes

Docker volumes persist data across restarts:

```yaml
volumes:
  postgres-data:        # Event store database
  rabbitmq-data:        # Message queue persistence
  redis-data:           # Cache data
  elasticsearch-data:   # Metrics and traces
  jaeger-data:          # Trace storage
  grafana-data:         # Dashboard configurations
```

### Data Locations

```bash
# View volumes
docker volume ls | grep flow-platform

# Inspect volume
docker volume inspect flow-platform-postgres-data

# Backup PostgreSQL
docker exec flow-platform-postgres pg_dump -U actor_user eventstore > backup.sql

# Restore PostgreSQL
docker exec -i flow-platform-postgres psql -U actor_user eventstore < backup.sql
```

## Health Checks

### Container Health

All services include health checks:

```bash
# Check service health
docker compose ps

# Detailed health status
docker inspect flow-platform-postgres | grep -A10 Health

# Wait for healthy
docker compose up --wait
```

### Health Endpoints

```bash
# RabbitMQ
curl http://localhost:55672/api/health/checks/alarms

# PostgreSQL
docker exec flow-platform-postgres pg_isready -U actor_user

# Redis
docker exec flow-platform-redis redis-cli ping

# Elasticsearch
curl http://localhost:9200/_cluster/health
```

## Environment Configuration

### Default Credentials

**Development Only** - Change in production!

| Service | Username | Password |
|---------|----------|----------|
| RabbitMQ | admin | admin123 |
| PostgreSQL | actor_user | actor_pass123 |
| Redis | (none) | redis123 |
| Grafana | admin | admin |

### Environment Variables

```bash
# .env file or docker-compose.yml
NODE_ENV=development
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_NAME=eventstore
DATABASE_USER=actor_user
DATABASE_PASSWORD=actor_pass123

RABBITMQ_URL=amqp://admin:admin123@rabbitmq:5672
REDIS_URL=redis://:redis123@redis:6379
JAEGER_ENDPOINT=http://jaeger:4318/v1/traces

JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRATION=300
```

## Network Configuration

### Docker Network

All services run on `flow-platform-network`:

```yaml
networks:
  flow-platform-network:
    driver: bridge
    name: flow-platform-network
```

### Service Discovery

Services resolve each other by name:

```typescript
// In service code
const dbUrl = 'postgresql://actor_user:actor_pass123@postgres:5432/eventstore';
const mqUrl = 'amqp://admin:admin123@rabbitmq:5672';
const redisUrl = 'redis://:redis123@redis:6379';
```

## Resource Limits

### Default Limits

```yaml
services:
  postgres:
    deploy:
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M

  elasticsearch:
    environment:
      ES_JAVA_OPTS: "-Xms512m -Xmx512m"
```

### Adjusting Resources

Edit `docker-compose.yml` for your needs:

```yaml
services:
  postgres:
    deploy:
      resources:
        limits:
          memory: 2G  # Increase for production
```

## Troubleshooting

### Services Won't Start

**Check logs**:
```bash
docker compose logs rabbitmq
docker compose logs postgres
```

**Common issues**:
- Port already in use: Change host port mapping
- Volume corruption: `docker compose down -v`
- Resource exhaustion: Increase Docker memory

### Connection Refused

**Cause**: Service not ready or wrong hostname

**Solution**:
```bash
# Check service is running
docker compose ps

# Check network connectivity
docker exec flow-platform-devbox ping postgres
docker exec flow-platform-devbox ping rabbitmq
```

### Data Loss After Restart

**Cause**: Volumes not properly configured

**Solution**:
```bash
# Verify volumes exist
docker volume ls | grep flow-platform

# Check volume mounts
docker inspect flow-platform-postgres | grep -A5 Mounts
```

## Next Steps

- [Message Bus Guide](./message-bus.md) - RabbitMQ configuration
- [Observability Guide](./observability.md) - Logging and tracing
- [Deployment Guide](./deployment.md) - Production deployment
- [Monitoring Guide](./monitoring.md) - Health and metrics
