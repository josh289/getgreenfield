---
title: Service Discovery Service
description: Contract registry, service health monitoring, and dynamic service discovery
category: platform-services
tags: [service-discovery, contracts, health-monitoring, registry]
related:
  - ./api-gateway.md
  - ./auth-service.md
  - ../../02-concepts/architecture/service-discovery.md
difficulty: advanced
---

# Service Discovery Service

The Service Discovery service maintains a registry of all platform services, their contracts, and health status, enabling dynamic service discovery and API generation.

## Overview

The Service Discovery service provides:

- **Contract Registry** - Centralized storage of service contracts
- **Health Monitoring** - Continuous health checks of all services
- **Service Registration** - Automatic service registration on startup
- **Contract Validation** - Schema validation for contracts
- **Dependency Tracking** - Service dependency graph
- **Cache Management** - Redis-backed contract caching
- **Persistence** - PostgreSQL-backed contract storage

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│               Service Discovery                          │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Contract Registry                         │   │
│  │                                                   │   │
│  │  ┌──────────────┐  ┌─────────────────────────┐  │   │
│  │  │ PostgreSQL   │  │    Redis Cache          │  │   │
│  │  │              │  │                         │  │   │
│  │  │ - Contracts  │  │ - Active contracts      │  │   │
│  │  │ - Versions   │  │ - TTL: 5 minutes        │  │   │
│  │  │ - Checksums  │  │ - Quick lookups         │  │   │
│  │  └──────────────┘  └─────────────────────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Health Monitor                            │   │
│  │                                                   │   │
│  │  - Continuous health checks                      │   │
│  │  - Service status tracking                       │   │
│  │  - Dependency health                             │   │
│  │  - Cascading failure detection                   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                           │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Event Handlers                            │   │
│  │                                                   │   │
│  │  - ServiceContractsRegistered                    │   │
│  │  - ServiceHealthCheck                            │   │
│  │  - ServiceDeregistered                           │   │
│  └──────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────┘
```

## Configuration

### Environment Variables

```bash
# Port Configuration
PORT=3002                           # HTTP port

# Database (Contract Storage)
DATABASE_HOST=postgres              # PostgreSQL host
DATABASE_NAME=eventstore            # Database name
DATABASE_USER=actor_user            # Database user
DATABASE_PASSWORD=actor_pass123     # Database password
DATABASE_PORT=5432                  # Database port

# Legacy database URL (for compatibility)
SERVICE_DISCOVERY_DATABASE_URL=postgresql://actor_user:actor_pass123@postgres:5432/eventstore

# Redis (Contract Cache)
REDIS_URL=redis://:redis123@redis:6379

# Message Bus
MESSAGE_BUS_URL=amqp://admin:admin123@rabbitmq:5672

# Health Monitoring
HEALTH_CHECK_INTERVAL_MS=10000      # Health check interval (10 seconds)
HEALTH_CHECK_TIMEOUT_MS=5000        # Health check timeout (5 seconds)
SERVICE_UNHEALTHY_THRESHOLD=3       # Failed checks before unhealthy

# Telemetry
JAEGER_ENDPOINT=http://jaeger:4318/v1/traces
```

### Docker Compose

```yaml
service-discovery:
  build: ./platform/services/service-discovery
  ports:
    - "3002:3002"
  environment:
    - PORT=3002
    - DATABASE_HOST=postgres
    - DATABASE_NAME=eventstore
    - DATABASE_USER=actor_user
    - DATABASE_PASSWORD=actor_pass123
    - REDIS_URL=redis://:redis123@redis:6379
    - MESSAGE_BUS_URL=amqp://admin:admin123@rabbitmq:5672
    - HEALTH_CHECK_INTERVAL_MS=10000
  depends_on:
    postgres:
      condition: service_healthy
    redis:
      condition: service_healthy
    rabbitmq:
      condition: service_healthy
```

## Contract Registration

### Automatic Registration

Services automatically register their contracts on startup:

```typescript
// In service main.ts
await BaseService.start({
  serviceName: 'my-service',
  serviceVersion: '1.0.0'
});

// BaseService automatically:
// 1. Discovers all contracts from handlers
// 2. Broadcasts ServiceContractsRegistered event
// 3. Service Discovery stores contracts
```

### Contract Structure

```typescript
interface ContractDefinition {
  messageType: string;              // "CreateUserCommand"
  description?: string;             // Human-readable description
  inputSchema: JSONSchema;          // Input validation schema
  outputSchema: JSONSchema;         // Output schema
  requiredPermissions: string[];    // ["users:create"]
  isPublic: boolean;                // Public endpoint?
  version: string;                  // "1.0.0"
}
```

### Contract Storage

**PostgreSQL Schema:**
```sql
CREATE TABLE service_contracts (
  id SERIAL PRIMARY KEY,
  service_name VARCHAR(255) NOT NULL,
  version VARCHAR(50) NOT NULL,
  contracts JSONB NOT NULL,
  checksum VARCHAR(64) NOT NULL,
  registered_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(service_name, version)
);

CREATE INDEX idx_service_contracts_service_name
  ON service_contracts(service_name);

CREATE INDEX idx_service_contracts_registered_at
  ON service_contracts(registered_at DESC);

CREATE INDEX idx_service_contracts_service_version
  ON service_contracts(service_name, version);
```

**Redis Cache:**
```
Key: contracts:<service-name>:<version>
Value: JSON array of contracts
TTL: 300 seconds (5 minutes)
```

## Health Monitoring

### Health Check Mechanism

**Message-Based Health Checks:**
```typescript
// Service Discovery sends HealthCheckRequest
messageBus.publish('HealthCheckRequest', {
  serviceName: 'auth-service',
  timestamp: Date.now()
});

// Service responds with HealthCheckResponse
messageBus.publish('HealthCheckResponse', {
  serviceName: 'auth-service',
  status: 'healthy',
  timestamp: Date.now(),
  dependencies: {
    database: 'healthy',
    messageBus: 'healthy'
  }
});
```

**Health Check Interval:**
- Default: 10 seconds
- Configurable via `HEALTH_CHECK_INTERVAL_MS`
- Timeout: 5 seconds (configurable)

### Health Status States

**Healthy:**
- Service responding to health checks
- Response time < threshold
- All dependencies healthy

**Degraded:**
- Service responding but slow
- Some dependencies unhealthy
- Partial functionality

**Unhealthy:**
- Service not responding
- Failed > threshold consecutive checks
- Critical dependencies down

**Unknown:**
- No health data available
- Service just registered
- Service not yet checked

### Health Check Response

```typescript
interface HealthCheckResponse {
  serviceName: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  responseTime: number;
  dependencies?: {
    database?: 'healthy' | 'unhealthy';
    messageBus?: 'healthy' | 'unhealthy';
    cache?: 'healthy' | 'unhealthy';
    [key: string]: string | undefined;
  };
  errors?: string[];
}
```

## Queries

### GetAllContracts

Get all contracts from all services.

**Permission Required:** `admin:view-contracts`

**Input:**
```typescript
{
  includeInternalServices: false
}
```

**Output:**
```typescript
[
  {
    serviceName: "auth-service",
    version: "1.0.0",
    contracts: [
      {
        messageType: "CreateUserCommand",
        description: "Create a new user",
        inputSchema: { ... },
        outputSchema: { ... },
        requiredPermissions: ["users:create"]
      },
      ...
    ],
    registeredAt: "2025-11-15T10:00:00Z"
  },
  {
    serviceName: "api-gateway",
    version: "1.0.0",
    contracts: [ ... ]
  }
]
```

### GetServiceContracts

Get contracts for a specific service.

**Permission Required:** `admin:view-contracts`

**Input:**
```typescript
{
  serviceName: "auth-service"
}
```

**Output:**
```typescript
{
  serviceName: "auth-service",
  version: "1.0.0",
  contracts: [
    {
      messageType: "CreateUserCommand",
      description: "Create a new user",
      requiredPermissions: ["users:create"]
    }
  ]
}
```

### GetServiceHealth

Get health status for a specific service.

**Permission Required:** `admin:view-services`

**Input:**
```typescript
{
  serviceName: "auth-service"
}
```

**Output:**
```typescript
{
  serviceName: "auth-service",
  status: "healthy",
  lastHealthCheck: "2025-11-15T14:30:00Z",
  responseTime: 12,
  errors: null
}
```

### GetAllServiceHealth

Get health status for all services.

**Permission Required:** `admin:view-services`

**Output:**
```typescript
{
  services: [
    {
      serviceName: "auth-service",
      status: "healthy",
      lastHealthCheck: "2025-11-15T14:30:00Z",
      responseTime: 12
    },
    {
      serviceName: "api-gateway",
      status: "healthy",
      lastHealthCheck: "2025-11-15T14:30:05Z",
      responseTime: 8
    }
  ]
}
```

### GetDependencyHealth

Get health status for service dependencies (cascading check).

**Permission Required:** `admin:view-services`

**Input:**
```typescript
{
  serviceName: "api-gateway"
}
```

**Output:**
```typescript
{
  serviceName: "api-gateway",
  status: "healthy",
  dependencies: [
    {
      serviceName: "auth-service",
      status: "healthy",
      isDirect: true
    },
    {
      serviceName: "service-discovery",
      status: "healthy",
      isDirect: true
    }
  ],
  cascadingStatus: "healthy"
}
```

## Events

### ServiceContractsRegistered

Published when a service registers its contracts.

**Published By:** Services on startup (via BaseService)

**Event Data:**
```typescript
{
  serviceName: "auth-service",
  version: "1.0.0",
  serviceId: "auth-service-v1-abc123",
  contracts: [
    {
      messageType: "CreateUserCommand",
      description: "Create a new user",
      inputSchema: { ... },
      outputSchema: { ... },
      requiredPermissions: ["users:create"]
    }
  ],
  endpoint: "amqp://rabbitmq:5672",
  timestamp: "2025-11-15T14:30:00.123Z"
}
```

**Handler Actions:**
1. Validate contracts against schema
2. Store in PostgreSQL
3. Cache in Redis
4. Register service for health monitoring
5. Notify API Gateway of new contracts

### ServiceHealthChanged

Published when service health status changes.

**Published By:** Service Discovery health monitor

**Event Data:**
```typescript
{
  serviceName: "auth-service",
  status: "unhealthy",
  previousStatus: "healthy",
  healthCheckTime: "2025-11-15T14:35:00Z",
  responseTime: null,
  errors: ["Health check timeout after 5000ms"],
  timestamp: "2025-11-15T14:35:00.456Z"
}
```

**Subscribers:**
- API Gateway (for circuit breaker state)
- Monitoring systems
- Admin dashboards

### ServiceDeregistered

Published when a service is removed.

**Event Data:**
```typescript
{
  serviceName: "auth-service",
  serviceId: "auth-service-v1-abc123",
  reason: "Graceful shutdown",
  timestamp: "2025-11-15T14:40:00.789Z"
}
```

## Contract Validation

### Schema Validation

All contracts are validated on registration:

```typescript
interface ContractValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}
```

**Validation Rules:**
1. `messageType` must be unique per service
2. `inputSchema` must be valid JSON Schema
3. `outputSchema` must be valid JSON Schema
4. `requiredPermissions` must be string array
5. `version` must follow semver

**Validation Errors:**
```typescript
{
  isValid: false,
  errors: [
    {
      field: "messageType",
      message: "Duplicate message type: CreateUserCommand",
      severity: "error"
    },
    {
      field: "inputSchema",
      message: "Invalid JSON Schema: missing 'type' property",
      severity: "error"
    }
  ]
}
```

## API Gateway Integration

### Contract Discovery Flow

```
1. API Gateway starts
   └─> Queries Service Discovery for all contracts

2. Service Discovery responds
   └─> Returns all registered contracts from cache/DB

3. API Gateway generates schemas
   └─> REST routes from contracts
   └─> GraphQL schema from contracts
   └─> WebSocket event subscriptions

4. Service registers new contracts
   └─> ServiceContractsRegistered event

5. API Gateway receives event
   └─> Refreshes contract cache
   └─> Regenerates schemas
   └─> Updates routes

6. Clients see new operations
   └─> New REST endpoints
   └─> New GraphQL operations
   └─> New WebSocket subscriptions
```

### Dynamic Route Generation

```typescript
// Service Discovery provides contracts
const contracts = await serviceDiscovery.getAllContracts();

// API Gateway generates routes
for (const contract of contracts) {
  if (contract.messageType.endsWith('Command')) {
    // Generate POST endpoint
    router.post(`/api/${toRoute(contract)}`, handler);
  } else if (contract.messageType.endsWith('Query')) {
    // Generate GET endpoint
    router.get(`/api/${toRoute(contract)}`, handler);
  }
}
```

## Monitoring and Observability

### Metrics

```prometheus
# Contract metrics
service_discovery_contracts_total
service_discovery_services_registered_total
service_discovery_contract_updates_total

# Health metrics
service_discovery_health_checks_total{service="auth-service", status="success"}
service_discovery_unhealthy_services_total
service_discovery_health_check_duration_seconds{service="auth-service"}

# Cache metrics
service_discovery_cache_hits_total
service_discovery_cache_misses_total
service_discovery_cache_size
```

### Health Check Endpoint

```bash
curl http://localhost:3002/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "service-discovery",
  "version": "1.0.0",
  "dependencies": {
    "database": "healthy",
    "redis": "healthy",
    "messageBus": "healthy"
  },
  "registeredServices": 3,
  "healthyServices": 3
}
```

### Admin Endpoints

**List All Services:**
```bash
curl http://localhost:3002/admin/services
```

**View Service Details:**
```bash
curl http://localhost:3002/admin/services/auth-service
```

**Contract Statistics:**
```bash
curl http://localhost:3002/admin/stats
```

**Response:**
```json
{
  "totalServices": 3,
  "totalContracts": 47,
  "healthyServices": 3,
  "unhealthyServices": 0,
  "cacheHitRatio": 0.95,
  "averageResponseTime": 15
}
```

## Troubleshooting

### Service Not Appearing in Registry

**Symptoms:**
- Service started but not in registry
- Contracts not available to API Gateway

**Checks:**
```bash
# Check if service published ServiceContractsRegistered event
docker logs service-discovery | grep "ServiceContractsRegistered"

# Check PostgreSQL for contracts
docker exec -it postgres psql -U actor_user -d eventstore \
  -c "SELECT service_name, version, registered_at FROM service_contracts;"

# Check Redis cache
docker exec -it redis redis-cli
> KEYS contracts:*
> GET contracts:auth-service:1.0.0
```

**Fix:**
```bash
# Restart service to re-register
docker restart auth-service

# Check service logs for errors
docker logs auth-service | grep "contract"
```

### Stale Contracts in API Gateway

**Symptoms:**
- Old operations still visible
- New operations not available
- Schema not updated

**Checks:**
```bash
# Check cache TTL
docker exec -it redis redis-cli
> TTL contracts:auth-service:1.0.0

# Check contract update timestamp
curl http://localhost:3002/admin/services/auth-service
```

**Fix:**
```bash
# Clear API Gateway schema cache
curl -X POST http://localhost:3003/admin/clear-cache

# Restart API Gateway
docker restart api-gateway

# Clear Service Discovery cache
docker exec -it redis redis-cli
> FLUSHDB
```

### Health Check Failures

**Symptoms:**
- Service marked as unhealthy
- Circuit breakers opening
- Requests failing

**Checks:**
```bash
# Check service logs
docker logs auth-service | grep "health"

# Check health endpoint directly
curl http://localhost:3001/health

# Check Service Discovery health status
curl http://localhost:3002/admin/services/auth-service
```

**Fix:**
```bash
# Restart unhealthy service
docker restart auth-service

# Check dependencies
docker ps | grep postgres
docker ps | grep rabbitmq

# Adjust health check interval if needed
# In docker-compose.yml:
HEALTH_CHECK_INTERVAL_MS=30000  # Longer interval
```

### Database Connection Issues

**Symptoms:**
- Contract storage failures
- Service registration errors

**Checks:**
```bash
# Check database connectivity
docker exec -it postgres pg_isready

# Check table exists
docker exec -it postgres psql -U actor_user -d eventstore \
  -c "\dt service_contracts"

# Check database logs
docker logs postgres | grep ERROR
```

**Fix:**
```bash
# Restart PostgreSQL
docker restart postgres

# Recreate tables (if schema issue)
docker exec service-discovery npm run migrate
```

## Best Practices

### Contract Versioning

```typescript
// Include version in contract
@Command({
  description: 'Create user (v2)',
  version: '2.0.0',
  permissions: ['users:create']
})
export class CreateUserCommandV2 {
  // New fields
}

// Keep old version for compatibility
@Command({
  description: 'Create user (v1 - deprecated)',
  version: '1.0.0',
  permissions: ['users:create']
})
export class CreateUserCommand {
  // Old fields
}
```

### Health Check Implementation

```typescript
// In your service
class MyService {
  async healthCheck(): Promise<HealthCheckResponse> {
    const start = Date.now();

    // Check dependencies
    const dbHealthy = await this.checkDatabase();
    const mbHealthy = await this.checkMessageBus();

    return {
      serviceName: 'my-service',
      status: dbHealthy && mbHealthy ? 'healthy' : 'degraded',
      timestamp: Date.now(),
      responseTime: Date.now() - start,
      dependencies: {
        database: dbHealthy ? 'healthy' : 'unhealthy',
        messageBus: mbHealthy ? 'healthy' : 'unhealthy'
      }
    };
  }
}
```

### Graceful Deregistration

```typescript
// On service shutdown
process.on('SIGTERM', async () => {
  // Publish deregistration event
  await messageBus.publish('ServiceDeregistered', {
    serviceName: 'my-service',
    serviceId: 'my-service-v1-abc123',
    reason: 'Graceful shutdown'
  });

  // Wait for message to be sent
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Stop service
  await service.stop();
});
```

## Next Steps

- **[API Gateway](./api-gateway.md)** - How contracts generate APIs
- **[Auth Service](./auth-service.md)** - Service example
- **[Base Service Package](../platform-packages/base-service.md)** - Service startup
- **[Service Discovery Concepts](../../02-concepts/architecture/service-discovery.md)** - Architecture details
