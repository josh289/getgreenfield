---
title: Service Discovery Issues
description: Troubleshooting service registration, health checks, and contract broadcasting
category: troubleshooting
tags: [service-discovery, registration, health-checks, contracts]
related:
  - ../by-symptom/service-wont-start.md
  - ../by-symptom/api-calls-failing.md
  - ../../02-core-concepts/service-discovery.md
difficulty: intermediate
---

# Service Discovery Issues

## Component Overview

Service Discovery maintains a registry of all running services and their contracts. It provides:

- **Service Registration**: Services register on startup
- **Health Monitoring**: Periodic health checks
- **Contract Registry**: Stores service operation contracts
- **Service Catalog**: Queryable service information
- **Availability Tracking**: Which services are online/offline

## Common Issues

### 1. Service Not Registered

**Symptoms:**
- Service running but not in registry
- API Gateway returns 404 for service operations
- Service not visible in discovery API

**Diagnostic Steps:**

```bash
# Check registered services
curl http://localhost:3001/api/services | jq '.services[].name'

# Check specific service
curl http://localhost:3001/api/services/my-service | jq

# If not found, check service logs
docker logs my-service | grep -i "register\|discovery"
```

**Common Causes:**

**A. BaseService.start() Not Called:**

```typescript
// ❌ WRONG: Manual setup without BaseService
const messageBus = new MessageBusClient(config);
await messageBus.connect();
// Service never registers!

// ✓ CORRECT: Use BaseService
import { BaseService } from '@banyanai/platform-base-service';

await BaseService.start({
  name: 'my-service',
  version: '1.0.0'
});
// Automatically registers with discovery
```

**B. Service Discovery Not Running:**

```bash
# Check service discovery status
docker ps | grep service-discovery

# If not running, start it
docker compose up -d service-discovery
```

**C. Message Bus Connection Failed:**

Service can't connect to RabbitMQ to send registration:

```bash
# Check message bus connection
docker logs my-service | grep -i "rabbitmq\|connected"

# Should see: "Connected to RabbitMQ"
```

See [Message Bus Issues](./message-bus-issues.md) for RabbitMQ troubleshooting.

**D. Registration Message Lost:**

```bash
# Check service discovery logs
docker logs service-discovery | grep -i "register"

# Should see: "Service registered: my-service"
```

**Solution:**

1. Ensure `BaseService.start()` called
2. Verify service discovery running
3. Check message bus connectivity
4. Restart service to re-register:

```bash
docker compose restart my-service

# Check registration
curl http://localhost:3001/api/services | jq '.services[] | select(.name=="my-service")'
```

**Prevention:**
- Always use `BaseService.start()` for service initialization
- Monitor service registration in logs
- Add health check dependencies in docker-compose

---

### 2. Health Check Failures

**Symptoms:**
- Service registered but marked unhealthy
- Service removed from registry after timeout
- Health endpoint returning errors

**Diagnostic Steps:**

```bash
# Check service health status
curl http://localhost:3001/api/services/my-service | jq '.status'

# Test service health endpoint directly
curl http://localhost:3000/health

# Check service discovery logs
docker logs service-discovery | grep -i "health\|unhealthy"
```

**Common Causes:**

**A. Health Endpoint Not Responding:**

```bash
# Test health endpoint
curl -i http://localhost:3000/health

# If 404 or error, health endpoint not set up
```

**Solution:**

BaseService automatically provides health endpoint at `/health`. Ensure service listening:

```typescript
await BaseService.start({
  name: 'my-service',
  version: '1.0.0',
  port: 3000  // Ensure port specified
});

// Health endpoint automatically available at /health
```

**B. Service Dependencies Unhealthy:**

Service health check fails because dependencies (database, Redis) unavailable:

```typescript
// Health check implementation
export class HealthCheck {
  async check(): Promise<HealthStatus> {
    // Check dependencies
    const dbHealthy = await this.checkDatabase();
    const redisHealthy = await this.checkRedis();

    if (!dbHealthy || !redisHealthy) {
      return { status: 'unhealthy', dependencies: { db: dbHealthy, redis: redisHealthy } };
    }

    return { status: 'healthy' };
  }
}
```

**Solution:**

Fix dependency connections or implement graceful degradation.

**C. Health Check Timeout:**

Health endpoint takes too long to respond:

```bash
# Check health response time
time curl http://localhost:3000/health

# Should be < 1s
```

**Solution:**

Optimize health check logic:

```typescript
// ❌ SLOW: Waits for all checks sequentially
const dbHealth = await checkDatabase();  // 500ms
const redisHealth = await checkRedis();  // 500ms
// Total: 1000ms

// ✓ FAST: Run checks in parallel
const [dbHealth, redisHealth] = await Promise.all([
  checkDatabase(),
  checkRedis()
]);
// Total: 500ms (max of both)
```

**Prevention:**
- Keep health checks simple and fast
- Use parallel checks for dependencies
- Set reasonable health check intervals

---

### 3. Contracts Not Broadcast

**Symptoms:**
- Service registered but no contracts
- API Gateway can't route to service operations
- Operations return 404

**Diagnostic Steps:**

```bash
# Check service contracts
curl http://localhost:3001/api/services/my-service/contracts | jq

# If empty, contracts not broadcast

# Check service logs
docker logs my-service | grep -i "contract\|broadcast"

# Check service discovery logs
docker logs service-discovery | grep -i "contract.*my-service"
```

**Common Causes:**

**A. Handlers Not Discovered:**

If handlers not found, contracts not generated:

```bash
# Check handler discovery
docker logs my-service | grep "Handler discovery"

# Should show:
# Handler discovery completed {
#   commandHandlers: 2,
#   queryHandlers: 1,
#   ...
# }

# If totalHandlers: 0, see handlers-not-discovered.md
```

See [Handlers Not Discovered](../by-symptom/handlers-not-discovered.md).

**B. Contract Broadcasting Failed:**

Service couldn't send contracts to discovery:

```bash
# Check for broadcast errors
docker logs my-service | grep -i "broadcast.*error\|contract.*fail"

# Check message bus connection
docker logs my-service | grep -i "rabbitmq"
```

**C. Service Discovery Not Receiving Contracts:**

```bash
# Check service discovery subscription
docker logs service-discovery | grep -i "subscribe\|platform.contracts"

# Should see: "Subscribed to platform.contracts exchange"
```

**Solution:**

1. Ensure handlers discovered (check directory structure, decorators)
2. Verify message bus connection healthy
3. Restart service to rebroadcast contracts:

```bash
docker compose restart my-service
```

4. Check contracts received:

```bash
curl http://localhost:3001/api/services/my-service/contracts | jq
```

**Prevention:**
- Verify handler discovery on service startup
- Monitor contract broadcasting in logs
- Use contract schema validation

---

### 4. Service Deregistration Issues

**Symptoms:**
- Service deregistered while still running
- Service removed after restart
- Duplicate registrations

**Diagnostic Steps:**

```bash
# Check service registry
curl http://localhost:3001/api/services | jq '.services[] | select(.name=="my-service")'

# Check for duplicates
curl http://localhost:3001/api/services | jq '.services[] | select(.name=="my-service") | .serviceId'

# View service discovery logs
docker logs service-discovery | grep -i "deregister\|remove"
```

**Common Causes:**

**A. Health Check Timeout:**

Service discovery removes services that fail health checks:

```bash
# Check service discovery health check interval
docker logs service-discovery | grep -i "health check"

# Default: 30s interval, 3 failures = deregister
```

**Solution:**

Ensure service health endpoint responsive:

```bash
# Test health endpoint
while true; do
  curl -s http://localhost:3000/health || echo "FAILED"
  sleep 1
done
```

**B. Graceful Shutdown Not Implemented:**

Service exits without deregistering:

```typescript
// Implement graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully');

  // BaseService automatically deregisters
  await BaseService.shutdown();

  process.exit(0);
});
```

**C. Service Instance ID Collision:**

Multiple instances with same ID:

```bash
# Ensure unique instance IDs
# BaseService generates unique ID automatically
# Format: {serviceName}-{uuid}
```

**Prevention:**
- Implement graceful shutdown
- Ensure health endpoint reliable
- Use BaseService auto-generated instance IDs

---

### 5. Contract Version Conflicts

**Symptoms:**
- Service updated but old contracts cached
- API Gateway using stale contract definitions
- Type mismatches between service versions

**Diagnostic Steps:**

```bash
# Check contract versions
curl http://localhost:3001/api/services/my-service | jq '{
  name: .name,
  version: .version,
  contractCount: (.contracts | length)
}'

# View specific contract
curl http://localhost:3001/api/services/my-service/contracts | jq '.contracts[] | select(.name=="CreateUser")'
```

**Common Causes:**

**A. Old Service Instances Still Registered:**

```bash
# Check for multiple versions
curl http://localhost:3001/api/services | jq '.services[] | select(.name=="my-service") | {serviceId, version}'

# If multiple versions, old instances not deregistered
```

**Solution:**

Stop old service instances:

```bash
# Stop all instances
docker compose down my-service

# Start new version
docker compose up -d my-service
```

**B. Contract Cache Not Invalidated:**

Service discovery caches contracts. Restart to clear:

```bash
docker compose restart service-discovery
docker compose restart api-gateway
```

**Solution:**

Implement contract versioning:

```typescript
export const CreateUserCommand = {
  name: 'CreateUser',
  version: '2.0.0',  // Increment version on breaking changes
  inputSchema: { /* ... */ }
};
```

**Prevention:**
- Use semantic versioning for contracts
- Deploy with zero-downtime (blue-green, rolling)
- Implement contract compatibility checks

---

## Service Discovery API

### List All Services

```bash
curl http://localhost:3001/api/services | jq
```

Response:
```json
{
  "services": [
    {
      "serviceId": "my-service-uuid-123",
      "name": "my-service",
      "version": "1.0.0",
      "status": "healthy",
      "endpoint": "http://my-service:3000",
      "registeredAt": "2024-01-15T12:00:00Z",
      "lastHealthCheck": "2024-01-15T12:05:00Z"
    }
  ]
}
```

### Get Specific Service

```bash
curl http://localhost:3001/api/services/my-service | jq
```

### Get Service Contracts

```bash
curl http://localhost:3001/api/services/my-service/contracts | jq
```

Response:
```json
{
  "service": "my-service",
  "contracts": [
    {
      "name": "CreateUser",
      "type": "command",
      "requiredPermissions": ["users:create"],
      "inputSchema": { /* ... */ },
      "outputSchema": { /* ... */ }
    }
  ]
}
```

---

## Health Check Configuration

### Service Health Endpoint

BaseService provides automatic health endpoint:

```typescript
await BaseService.start({
  name: 'my-service',
  version: '1.0.0',
  port: 3000
});

// Health endpoint: GET http://localhost:3000/health
// Returns:
// {
//   "status": "healthy",
//   "service": "my-service",
//   "version": "1.0.0",
//   "timestamp": "2024-01-15T12:00:00Z"
// }
```

### Custom Health Checks

```typescript
import { HealthCheckManager } from '@banyanai/platform-base-service';

// Add custom health checks
HealthCheckManager.registerCheck('database', async () => {
  const isConnected = await database.ping();
  return { healthy: isConnected };
});

HealthCheckManager.registerCheck('redis', async () => {
  const isConnected = await redis.ping();
  return { healthy: isConnected };
});
```

Health endpoint returns:

```json
{
  "status": "healthy",
  "service": "my-service",
  "checks": {
    "database": { "healthy": true },
    "redis": { "healthy": true }
  }
}
```

---

## Debugging Techniques

### Monitor Service Registration

```bash
# Watch for registrations
docker logs -f service-discovery | grep -i "register"

# Should see:
# Service registered: my-service (version: 1.0.0)
# Contracts received: my-service (3 contracts)
```

### Test Registration Flow

```bash
# 1. Stop service
docker compose stop my-service

# 2. Check deregistered
curl http://localhost:3001/api/services | jq '.services[] | select(.name=="my-service")'
# Should return nothing

# 3. Start service
docker compose up -d my-service

# 4. Wait for registration (check logs)
docker logs my-service | grep -i "registered"

# 5. Verify registered
curl http://localhost:3001/api/services/my-service | jq '.status'
# Should return: "healthy"
```

### Check Health Check Frequency

```bash
# Monitor health checks
docker logs service-discovery | grep -i "health check.*my-service"

# Should see periodic checks:
# Health check: my-service - status: healthy
# (every 30 seconds by default)
```

---

## Common Error Messages

### "Service not found"

**Solution:** Ensure service registered and running. Check `BaseService.start()` called.

### "Health check failed"

**Solution:** Fix health endpoint or service dependencies. Check `/health` endpoint.

### "Contract validation failed"

**Solution:** Fix contract schema. Ensure all required fields present.

### "Service already registered"

**Solution:** Deregister old instance or use unique service instance ID.

---

## Verification Steps

After fixing service discovery issues:

### 1. Service Registered

```bash
curl http://localhost:3001/api/services/my-service | jq '{
  name: .name,
  status: .status,
  version: .version
}'

# Should return:
# {
#   "name": "my-service",
#   "status": "healthy",
#   "version": "1.0.0"
# }
```

### 2. Contracts Available

```bash
curl http://localhost:3001/api/services/my-service/contracts | jq '.contracts | length'

# Should return count > 0
```

### 3. Health Checks Passing

```bash
# Test health endpoint
curl http://localhost:3000/health | jq '.status'

# Should return: "healthy"
```

### 4. API Gateway Can Route

```bash
# Test operation via API Gateway
curl -X POST http://localhost:3000/api/test-operation \
  -H "Content-Type: application/json" \
  -H "X-Dev-User-Id: test" \
  -H "X-Dev-Permissions: *" \
  -d '{}'

# Should return 200 OK (not 404)
```

---

## Related Documentation

- [Service Won't Start](../by-symptom/service-wont-start.md) - Startup troubleshooting
- [API Calls Failing](../by-symptom/api-calls-failing.md) - API routing issues
- [Service Discovery Architecture](../../02-core-concepts/service-discovery.md) - How discovery works
- [BaseService](../../02-core-concepts/base-service.md) - Service initialization

---

## Summary

Common service discovery issues:

1. **Service not registered** - Ensure `BaseService.start()` called and message bus connected
2. **Health checks failing** - Fix health endpoint or dependencies
3. **Contracts not broadcast** - Verify handler discovery and message bus connection
4. **Deregistration issues** - Implement graceful shutdown and reliable health checks
5. **Version conflicts** - Stop old instances and implement contract versioning

Always check service discovery API to verify registration, contracts, and health status.
