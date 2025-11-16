---
title: "Service Discovery"
description: "Message-based service discovery with contract registry and automatic health monitoring"
category: "concepts"
tags: ["architecture", "service-discovery", "health-monitoring"]
difficulty: "intermediate"
related_concepts:
  - "platform-overview.md"
  - "message-bus-architecture.md"
  - "api-gateway.md"
prerequisites:
  - "platform-overview.md"
last_updated: "2025-01-15"
status: "published"
---

# Service Discovery

> **Core Idea:** Services automatically register their contracts and health status through message bus communication, enabling dynamic API Gateway routing without manual configuration.

## Overview

The service discovery system provides automatic service registration, health monitoring, and contract management through message-based communication. Unlike traditional service discovery (Consul, Eureka) that requires HTTP endpoints, banyan-core uses the existing message bus infrastructure for zero-configuration service discovery.

## The Problem

Traditional service discovery systems require infrastructure code and HTTP endpoints:

### Example Scenario

```typescript
// Traditional approach - manual registration
import Consul from 'consul';

const consul = new Consul();

// Manual registration on startup
await consul.agent.service.register({
  name: 'user-service',
  id: `user-service-${instanceId}`,
  address: 'localhost',
  port: 3000,
  check: {
    http: 'http://localhost:3000/health',
    interval: '10s'
  }
});

// Manual health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'UP' });
});

// Manual deregistration on shutdown
process.on('SIGTERM', async () => {
  await consul.agent.service.deregister(`user-service-${instanceId}`);
});
```

**Why This Matters:**
- Requires HTTP health endpoints in every service
- Manual registration and deregistration code
- Additional infrastructure dependency (Consul)
- No integration with contract system
- Health checks via HTTP add latency

## The Solution

Message-based service discovery with automatic contract registration and health monitoring.

### Core Principles

1. **Message Bus Only**: All health checks via RabbitMQ, no HTTP required
2. **Automatic Registration**: Services register via first health check response
3. **Contract Integration**: Service contracts stored alongside health status
4. **Zero Configuration**: Completely transparent to service developers
5. **PostgreSQL + Redis**: Contracts in PostgreSQL, cached in Redis
6. **Cascading Degradation**: Track dependency health for routing decisions

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│                   Service Startup Sequence                       │
└─────────────────────────────────────────────────────────────────┘

1. Service starts with BaseService.start()
   ↓
2. Service subscribes to health check queries
   ↓
3. Service Discovery sends health check via message bus
   ↓
4. Service responds with health status + contracts (first time only)
   ↓
5. Service Discovery stores contracts in PostgreSQL
   ↓
6. Service Discovery caches contracts in Redis
   ↓
7. API Gateway notified of new service contracts
   ↓
8. API Gateway regenerates routes

┌─────────────────────────────────────────────────────────────────┐
│                  Periodic Health Monitoring                      │
└─────────────────────────────────────────────────────────────────┘

Every 60 seconds:
1. Service Discovery sends health check to all services
   ↓
2. Services respond with current health status
   ↓
3. Service Discovery tracks healthy/unhealthy services
   ↓
4. If status changes: publish ServiceHealthChangedEvent
   ↓
5. API Gateway updates routing to exclude unhealthy services
```

## Implementation in the Platform

### Key Components

- **ServiceDiscovery**: Main orchestrator
  - Location: `platform/services/service-discovery/`
  - Coordinates health monitoring and contract management
  - Publishes health change events

- **MessageBasedHealthMonitor**: Health check coordinator
  - Sends health checks via message bus
  - Tracks service lifecycle (started, stopping)
  - Manages health check intervals (60s default)

- **PostgreSQLContractRegistry**: Contract storage
  - Stores service contracts in PostgreSQL
  - Caches contracts in Redis (sub-10ms lookup)
  - Detects breaking contract changes

- **ContractValidator**: Contract validation
  - Ensures contract compatibility
  - Detects breaking changes
  - Validates contract structure

### Database Schema

```sql
-- Service contracts table
CREATE TABLE service_contracts (
  id SERIAL PRIMARY KEY,
  service_name VARCHAR(255) NOT NULL,
  version VARCHAR(50) NOT NULL,
  contracts JSONB NOT NULL,
  checksum VARCHAR(64) NOT NULL,
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(service_name, version)
);

CREATE INDEX idx_service_name ON service_contracts(service_name);
CREATE INDEX idx_checksum ON service_contracts(checksum);
```

### Code Example

```typescript
// Service automatically registers - NO developer code required
// This happens automatically in BaseService.start()

// main.ts
import { BaseService } from '@banyanai/platform-base-service';

await BaseService.start({
  serviceName: 'user-service',
  version: '1.0.0'
});

// Behind the scenes:
// 1. BaseService subscribes to health check queries
// 2. Service Discovery sends HealthCheckQuery
// 3. BaseService responds with:
//    - health status: 'healthy'
//    - contracts: [CreateUserContract, GetUserContract, ...]
// 4. Service Discovery stores contracts
// 5. API Gateway generates routes

// API Gateway uses service discovery
class DynamicGatewayEngine {
  async initialize() {
    // Get all service contracts
    const contracts = await this.serviceDiscovery.getAllServiceContracts();

    // Generate routes dynamically
    this.routes = this.generateRoutes(contracts);
  }

  async handleRequest(req, res) {
    // Get currently healthy services
    const healthyServices = await this.serviceDiscovery.getHealthyServicesForRouting();

    // Route only to healthy services
    if (!healthyServices.includes(route.serviceName)) {
      return res.status(503).json({ error: 'Service temporarily unavailable' });
    }

    // Forward request via message bus
  }
}
```

**Key Points:**
- Zero service code for discovery
- Automatic contract registration
- Health-aware routing
- No HTTP dependencies

## Benefits and Trade-offs

### Benefits

- **Zero Configuration**: Services automatically discovered
- **Message Bus Integration**: Reuses existing infrastructure
- **Contract-First**: Routes generated from actual service contracts
- **Health-Aware Routing**: Traffic only to healthy services
- **Fast Lookups**: Redis caching for sub-10ms contract retrieval
- **Dependency Tracking**: Cascading degradation analysis

### Trade-offs

- **Message Bus Dependency**: Health checks require RabbitMQ
- **Eventual Consistency**: Contract changes take ~1 minute to propagate
- **Single Registry**: PostgreSQL as single source of truth
- **60-Second Interval**: Fixed health check frequency

### When to Use This Pattern

Use message-based service discovery when:
- Building microservices with message bus architecture
- Want zero-configuration service registration
- Need contract-based API generation
- Already using RabbitMQ for communication

Avoid when:
- Services communicate via direct HTTP (use Consul/Eureka)
- Need sub-second health check intervals
- Running without message bus infrastructure

## Real-World Examples

### Example 1: Service Startup and Registration

```typescript
// Service A starts
await BaseService.start({
  serviceName: 'order-service',
  version: '2.1.0'
});

// Automatic sequence:
// 1. Subscribe to PlatformServiceContract.queries.HealthCheck
// 2. Receive health check from Service Discovery
// 3. Respond with contracts:
const response = {
  status: 'healthy',
  contracts: [
    CreateOrderContract,
    GetOrderContract,
    UpdateOrderContract,
    OrderCreatedEvent
  ]
};

// 4. Service Discovery stores in PostgreSQL
await contractRegistry.registerContracts('order-service', response.contracts);

// 5. Service Discovery caches in Redis
await redis.set('contracts:order-service:2.1.0', JSON.stringify(contracts));

// 6. API Gateway regenerates routes
await gatewayEngine.loadContracts();
// Now: POST /orders, GET /orders/:id routes available
```

**Outcome:** Order service available for routing within 60 seconds, zero configuration code.

### Example 2: Health-Aware Routing

```typescript
// Payment service becomes unhealthy
// (e.g., database connection lost)

// Service Discovery detects via health check
const health = await messageBus.send(
  PlatformServiceContract.queries.HealthCheck,
  { serviceName: 'payment-service' },
  { timeout: 5000 }
);
// No response or error response

// Service Discovery publishes event
await messageBus.publish(ServiceHealthChangedEvent, {
  serviceName: 'payment-service',
  previousStatus: 'healthy',
  newStatus: 'unhealthy',
  reason: 'Health check timeout'
});

// API Gateway receives event and updates routing
@EventHandler(ServiceHealthChangedEvent)
class UpdateRoutingHandler {
  async handle(event: ServiceHealthChangedEvent) {
    if (event.newStatus === 'unhealthy') {
      this.gatewayEngine.updateHealthyServices(
        this.healthyServices.filter(s => s !== event.serviceName)
      );
    }
  }
}

// Future requests to payment-service return 503
// POST /payments → 503 Service Unavailable
```

**Outcome:** Unhealthy service automatically excluded from routing, preventing errors.

## Related Concepts

- [Platform Overview](platform-overview.md) - Overall architecture
- [Message Bus Architecture](message-bus-architecture.md) - Communication infrastructure
- [API Gateway](api-gateway.md) - Dynamic route generation
- [Contract System](../../04-reference/platform-packages/contract-system.md)

## Common Patterns

### Pattern 1: Dependency Health Tracking

```typescript
// Track service dependencies for cascading degradation
const dependencyHealth = await serviceDiscovery.getDependencyHealthStatus('order-service');
// Returns: { inventory-service: 'healthy', payment-service: 'degraded' }
```

### Pattern 2: Contract Versioning

```typescript
// Register multiple versions simultaneously
await BaseService.start({
  serviceName: 'user-service',
  version: '2.0.0'  // New version with breaking changes
});
// Old version (1.0.0) still running
// API Gateway supports both: /v1/users and /v2/users
```

## Best Practices

1. **Use Semantic Versioning**
   - Major version for breaking changes
   - Minor version for backward-compatible additions
   - Example: `2.1.3`

2. **Monitor Health Check Response Times**
   - Slow health checks indicate service issues
   - Set up alerts for >1 second health check latency

3. **Design Idempotent Health Checks**
   - Health check should not modify state
   - Should be fast (<100ms)

4. **Handle Health Check Timeouts**
   - Services marked unhealthy after 5-second timeout
   - Ensure health check responds quickly

## Further Reading

### Internal Resources
- [Service Discovery Service](../../04-reference/platform-services/service-discovery.md)
- [Health Monitoring](../../03-guides/operations/health-monitoring.md)
- [Contract Management](../../03-guides/contracts/contract-management.md)

### External Resources
- [Service Discovery Patterns](https://microservices.io/patterns/service-registry.html)
- [Health Check API Pattern](https://microservices.io/patterns/observability/health-check-api.html)

## Glossary

**Contract Registry**: Storage for service contracts (commands, queries, events).

**Health Check**: Periodic query to verify service is operational.

**Service Discovery**: System for tracking available services and their contracts.

**Cascading Degradation**: Health status that considers service dependencies.

**Contract Checksum**: Hash of contract definition to detect changes.
