---
title: BaseService Issues
description: Troubleshooting guide for BaseService startup, lifecycle, and configuration issues
category: troubleshooting
tags: [base-service, startup, lifecycle, configuration, initialization]
related:
  - ../../02-core-concepts/base-service.md
  - ../by-symptom/service-wont-start.md
  - ../debugging-tools/log-analysis.md
difficulty: intermediate
---

# BaseService Issues

BaseService provides one-line service startup with automatic infrastructure setup. This guide helps diagnose and resolve common BaseService initialization and lifecycle issues.

## Quick Fix

```bash
# Check service startup logs
docker logs my-service 2>&1 | grep -E "BaseService|started|error|failed"

# Verify configuration
docker exec my-service env | grep -E "SERVICE_|RABBITMQ|DATABASE|REDIS"

# Test service health
curl http://localhost:3000/health

# Check handler discovery
docker logs my-service 2>&1 | grep "Handler discovery"
```

## Common Problems

### 1. Service Startup Failed

**Symptoms:**
- Service crashes during `BaseService.start()`
- Container exits immediately after starting
- Error: "ServiceStartupError"
- Logs show initialization failures

**Diagnostic Steps:**

```bash
# Check startup sequence
docker logs my-service 2>&1 | tail -100

# Look for specific initialization phase failures
docker logs my-service 2>&1 | grep -E "Connecting|Initializing|Discovering|Broadcasting"

# Check exit code
docker inspect my-service | jq '.[0].State.ExitCode'
```

**Common Causes:**

**A. Configuration Validation Failed**

```typescript
// Error from ServiceConfig.ts
throw new Error('Service name is required and cannot be empty'); // Line 262
throw new Error('Service name must be lowercase alphanumeric with hyphens (DNS compliant)'); // Line 267
```

**Solution:**

```typescript
// ✓ CORRECT service configuration
await BaseService.start({
  name: 'user-service',           // Required: DNS-compliant (lowercase, hyphens)
  version: '1.0.0',               // Required: Semantic version
  description: 'User management', // Optional but recommended
  handlersPath: './src'           // Optional: Defaults to './src'
});

// ❌ WRONG configurations
await BaseService.start({
  name: 'UserService',    // Error: Must be lowercase
  version: '1.0.0'
});

await BaseService.start({
  name: 'user_service',   // Error: Use hyphens, not underscores
  version: '1.0.0'
});

await BaseService.start({
  name: '',               // Error: Cannot be empty
  version: '1.0.0'
});
```

**B. Database Configuration Invalid**

```typescript
// Errors from ServiceConfig.ts database validation
throw new Error('Database host is required'); // Line 647
throw new Error('Database name is required'); // Line 651
throw new Error('Database username is required'); // Line 655
throw new Error('Database password is required'); // Line 659
throw new Error('Database port must be between 1 and 65535'); // Line 663
throw new Error('Database max connections must be at least 1'); // Line 667
```

**Solution:**

```yaml
# docker-compose.yml - Complete database configuration
services:
  my-service:
    environment:
      # Full database URL (recommended)
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/platform

      # OR individual components
      - DATABASE_HOST=postgres
      - DATABASE_PORT=5432
      - DATABASE_NAME=platform
      - DATABASE_USER=postgres
      - DATABASE_PASSWORD=postgres
      - DATABASE_MAX_CONNECTIONS=20
      - DATABASE_SSL=false
```

**C. Missing Required Environment Variables**

```typescript
// Check ServiceConfig for required variables
throw new Error(
  'Either RABBITMQ_URL or RABBITMQ_HOST must be provided'
); // ServiceConfig.ts:348
```

**Solution:**

Provide all required configuration:

```yaml
services:
  my-service:
    environment:
      # Service identity (REQUIRED)
      - SERVICE_NAME=my-service
      - SERVICE_VERSION=1.0.0

      # Message bus (REQUIRED)
      - RABBITMQ_URL=amqp://admin:admin123@rabbitmq:5672

      # Database (REQUIRED for event sourcing services)
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/platform

      # Optional but recommended
      - LOG_LEVEL=info
      - NODE_ENV=development
      - REDIS_URL=redis://redis:6379
```

---

### 2. Database Connection Failed

**Symptoms:**
- Error: "DatabaseConnectionError"
- Service starts but cannot access database
- "Pool not initialized" errors
- Database query failures

**Diagnostic Steps:**

```bash
# Check database connectivity
docker exec my-service nc -zv postgres 5432

# Test database from service container
docker exec my-service psql -h postgres -U postgres -d platform -c "SELECT 1;"

# Check connection pool status
docker logs my-service 2>&1 | grep -E "Database|Pool|connection"

# Verify DATABASE_URL
docker exec my-service env | grep DATABASE
```

**Common Errors:**

```typescript
// From DatabaseManager.ts
throw new Error('Pool not initialized'); // Line 151
throw new Error('Database pool not available'); // Lines 183, 193, 225, 230

// From HealthMonitor.ts
throw new DatabaseConnectionError(
  'Failed to connect to database',
  correlationId,
  { host, port, database }
); // Line 715
```

**Solution:**

**A. Ensure PostgreSQL is Running**

```bash
# Check PostgreSQL container
docker ps | grep postgres

# If not running, start it
docker compose up -d postgres

# Wait for ready
docker logs postgres 2>&1 | grep "database system is ready to accept connections"
```

**B. Fix Connection String**

```bash
# ✓ CORRECT connection strings
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/platform
DATABASE_URL=postgresql://user:pass@postgres:5432/mydb
DATABASE_URL=postgresql://user:pass@postgres:5432/mydb?sslmode=require

# ❌ WRONG connection strings
DATABASE_URL=postgresql://localhost:5432/platform  # Use service name, not localhost
DATABASE_URL=postgres://postgres@postgres/platform # Missing password and port
```

**C. Initialize Database Schema**

```typescript
// BaseService automatically initializes event store schema
// But you may need to create database first

// Manual database creation if needed
const client = new Client({
  host: 'postgres',
  port: 5432,
  user: 'postgres',
  password: 'postgres',
  database: 'postgres' // Connect to default postgres db
});

await client.connect();
await client.query('CREATE DATABASE platform;');
await client.end();
```

**D. Configure Connection Pool**

```typescript
// Adjust pool size for high-traffic services
await BaseService.start({
  name: 'user-service',
  version: '1.0.0',
  database: {
    url: process.env.DATABASE_URL,
    poolSize: 50,              // Increase from default 20
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000,
    ssl: false
  }
});
```

---

### 3. Message Bus Connection Failed

**Symptoms:**
- Error: "MessageBusConnectionError"
- Cannot publish or receive messages
- Service starts but RabbitMQ not connected
- "Connection closed" errors

**Diagnostic Steps:**

```bash
# Check RabbitMQ connectivity
docker exec my-service nc -zv rabbitmq 5672

# Check RabbitMQ status
docker ps | grep rabbitmq
docker logs rabbitmq | tail -50

# Test RabbitMQ management API
curl http://localhost:15672/api/overview

# Check service connection logs
docker logs my-service 2>&1 | grep -E "RabbitMQ|MessageBus|connection"
```

**Common Errors:**

```typescript
// From HealthMonitor.ts
throw new MessageBusConnectionError(
  'Failed to connect to message bus',
  correlationId,
  { urls: config.urls }
); // Line 760
```

**Solution:**

**A. Verify RabbitMQ is Running and Healthy**

```bash
# Start RabbitMQ
docker compose up -d rabbitmq

# Wait for RabbitMQ to be ready
docker logs rabbitmq 2>&1 | grep "Server startup complete"

# Check health
docker exec rabbitmq rabbitmq-diagnostics ping
```

**B. Fix Connection URL**

```yaml
services:
  my-service:
    environment:
      # ✓ CORRECT formats
      - RABBITMQ_URL=amqp://admin:admin123@rabbitmq:5672
      - RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672/vhost

      # ❌ WRONG formats
      # - RABBITMQ_URL=amqp://localhost:5672  # Use service name
      # - RABBITMQ_URL=rabbitmq:5672          # Missing protocol
```

**C. Add Service Dependencies**

```yaml
services:
  my-service:
    depends_on:
      rabbitmq:
        condition: service_healthy
      postgres:
        condition: service_healthy

  rabbitmq:
    healthcheck:
      test: rabbitmq-diagnostics -q ping
      interval: 10s
      timeout: 5s
      retries: 5

  postgres:
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
```

**D. Configure Connection Retry**

```typescript
// BaseService automatically retries connections
// But you can configure retry behavior
await BaseService.start({
  name: 'user-service',
  version: '1.0.0',
  messageBus: {
    urls: [process.env.RABBITMQ_URL!],
    connectionRetry: {
      maxAttempts: 10,
      initialDelayMs: 2000,
      maxDelayMs: 30000,
      backoffMultiplier: 2
    }
  }
});
```

---

### 4. Handler Discovery Failed

**Symptoms:**
- Error: "HandlerDiscoveryError"
- No handlers discovered
- Handlers discovered but not registered
- Contract broadcasting failures

**Diagnostic Steps:**

```bash
# Check handler discovery logs
docker logs my-service 2>&1 | grep "Handler discovery"

# Should show:
# Handler discovery completed {
#   commandHandlers: 5,
#   queryHandlers: 3,
#   eventHandlers: 2
# }

# Verify handler files exist
docker exec my-service ls -R /app/dist/commands /app/dist/queries /app/dist/events

# Check handler exports
docker exec my-service grep -r "export class.*Handler" /app/dist/
```

**Common Errors:**

```typescript
// From BaseServiceErrors.ts
export class HandlerDiscoveryError extends BaseServiceError {
  code = 'HANDLER_DISCOVERY_ERROR';
}

export class HandlerRegistrationError extends BaseServiceError {
  code = 'HANDLER_REGISTRATION_ERROR';
}
```

**Solution:**

**A. Ensure Handlers in Correct Directories**

```
src/
├── commands/           # Command handlers here
│   ├── CreateUserHandler.ts
│   └── UpdateUserHandler.ts
├── queries/            # Query handlers here
│   ├── GetUserHandler.ts
│   └── ListUsersHandler.ts
└── events/             # Event handlers here
    ├── UserCreatedHandler.ts
    └── UserUpdatedHandler.ts
```

**B. Add Required Decorators**

```typescript
// ✓ CORRECT: Handler with decorator
import { CommandHandler } from '@banyanai/platform-cqrs';
import { CreateUserCommand } from '../contracts/commands.js';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler {
  async handle(command: CreateUserCommand) {
    // Implementation
  }
}

// ❌ WRONG: Missing decorator
export class CreateUserHandler {
  async handle(command: CreateUserCommand) {
    // Won't be discovered!
  }
}
```

**C. Verify Handler Exports**

```typescript
// ❌ WRONG: Not exported
class CreateUserHandler { }

// ❌ WRONG: Default export
export default class CreateUserHandler { }

// ✓ CORRECT: Named export
export class CreateUserHandler { }
```

**D. Configure Custom Handlers Path**

```typescript
// If handlers are in non-standard location
await BaseService.start({
  name: 'user-service',
  version: '1.0.0',
  handlersPath: './dist/handlers' // Custom path
});
```

**E. Check TypeScript Compilation**

```bash
# Ensure TypeScript compiled successfully
pnpm run build

# Check for .js files in dist
ls -R dist/commands dist/queries dist/events

# Verify decorators preserved
grep -r "@CommandHandler" dist/
# Should show decorator calls
```

---

### 5. Health Check Failed

**Symptoms:**
- Error: "HealthCheckError"
- Health endpoint returns unhealthy status
- Service marked degraded or unavailable
- Dependency health checks failing

**Diagnostic Steps:**

```bash
# Check health endpoint
curl http://localhost:3000/health | jq

# View health check logs
docker logs my-service 2>&1 | grep -E "Health|check"

# Check dependency health
curl http://localhost:3000/health/dependencies | jq
```

**Common Error:**

```typescript
// From HealthMonitor.ts
throw new HealthCheckError(`Health check '${name}' not found`); // Line 237
```

**Solution:**

**A. Verify All Dependencies Healthy**

```bash
# Check each dependency
docker ps --format "table {{.Names}}\t{{.Status}}"

# Test database
docker exec my-service psql -h postgres -U postgres -d platform -c "SELECT 1;"

# Test RabbitMQ
docker exec my-service nc -zv rabbitmq 5672

# Test Redis (if used)
docker exec my-service redis-cli -h redis ping
```

**B. Add Custom Health Checks**

```typescript
import { BaseService } from '@banyanai/platform-base-service';

await BaseService.start({
  name: 'user-service',
  version: '1.0.0'
});

// Add custom health check after startup
const healthMonitor = BaseService.getHealthMonitor();

healthMonitor.registerHealthCheck('external-api', async () => {
  try {
    const response = await fetch('https://api.example.com/health');
    return response.ok;
  } catch {
    return false;
  }
});
```

**C. Configure Health Check Thresholds**

```typescript
await BaseService.start({
  name: 'user-service',
  version: '1.0.0',
  health: {
    checkInterval: 30000,        // Check every 30 seconds
    unhealthyThreshold: 3,       // Mark unhealthy after 3 failures
    degradedThreshold: 2,        // Mark degraded after 2 failures
    timeout: 5000                // 5 second timeout per check
  }
});
```

---

### 6. Service Shutdown Errors

**Symptoms:**
- Error: "ServiceShutdownError"
- Service doesn't stop gracefully
- Connections not closed properly
- Database connections leak

**Diagnostic Steps:**

```bash
# Check shutdown logs
docker logs my-service 2>&1 | grep -E "shutdown|stopping|closed"

# Look for connection cleanup
docker logs my-service 2>&1 | grep -E "Closing|Disconnecting"

# Check for hanging connections
docker exec postgres psql -U postgres -d platform -c \
  "SELECT pid, usename, application_name, state, query
   FROM pg_stat_activity
   WHERE application_name LIKE 'my-service%';"
```

**Solution:**

**A. Handle SIGTERM/SIGINT Properly**

```typescript
// BaseService automatically handles shutdown signals
// But you can add custom cleanup

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');

  // Custom cleanup before BaseService shutdown
  await myCustomCleanup();

  // BaseService.shutdown() called automatically
  process.exit(0);
});
```

**B. Implement Cleanup Hooks**

```typescript
import { BaseService } from '@banyanai/platform-base-service';

await BaseService.start({
  name: 'user-service',
  version: '1.0.0',
  onShutdown: async () => {
    // Called before BaseService cleanup
    console.log('Running custom shutdown logic');

    // Close custom connections
    await myDatabasePool.end();
    await myCache.disconnect();
  }
});
```

**C. Set Graceful Shutdown Timeout**

```yaml
# docker-compose.yml
services:
  my-service:
    stop_grace_period: 30s  # Allow 30 seconds for graceful shutdown

    environment:
      - SHUTDOWN_TIMEOUT=25000  # 25 seconds (less than stop_grace_period)
```

---

### 7. Service Client Injection Failed

**Symptoms:**
- Error: "ServiceClientInjectionError"
- Cannot inject service clients
- Client not found for service
- Circular dependency errors

**Diagnostic Steps:**

```bash
# Check client injection logs
docker logs my-service 2>&1 | grep -E "client|injection|dependency"

# Verify service discovery has target service
curl http://localhost:3001/api/services | jq '.services[] | select(.name=="target-service")'

# Check handler constructor
grep -A5 "constructor" src/commands/CreateUserHandler.ts
```

**Common Error:**

```typescript
// From BaseServiceErrors.ts
export class ServiceClientInjectionError extends BaseServiceError {
  code = 'SERVICE_CLIENT_INJECTION_ERROR';
}
```

**Solution:**

**A. Use Proper Client Injection**

```typescript
import { CommandHandler } from '@banyanai/platform-cqrs';
import { InjectClient } from '@banyanai/platform-base-service';
import type { UserServiceClient } from '@banyanai/user-service-client';

@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler {
  constructor(
    @InjectClient('user-service') private userService: UserServiceClient
  ) {}

  async handle(command: CreateOrderCommand) {
    // Use injected client
    const user = await this.userService.queries.getUser({ userId: command.userId });

    // Create order...
  }
}
```

**B. Ensure Target Service Registered**

```bash
# Check if target service is in service discovery
curl http://localhost:3001/api/services | jq '.services[].name'

# Should include target service name
# If not, start the target service
docker compose up -d user-service
```

**C. Avoid Circular Dependencies**

```typescript
// ❌ WRONG: Circular dependency
// Service A depends on Service B
// Service B depends on Service A

// ✓ CORRECT: One-way dependency
// Service A depends on Service B
// Service B depends on shared library or event bus
```

---

## Advanced Diagnostics

### Enable Debug Logging

```yaml
services:
  my-service:
    environment:
      - LOG_LEVEL=debug
      - DEBUG=base-service:*
```

View detailed logs:

```bash
docker logs my-service 2>&1 | grep -E "DEBUG|BaseService"
```

### Check Initialization Sequence

```bash
# BaseService initialization order:
# 1. Configuration validation
# 2. Database connection
# 3. Message bus connection
# 4. Handler discovery
# 5. Contract broadcasting
# 6. Service registration
# 7. Health checks
# 8. Ready state

docker logs my-service 2>&1 | grep -E "Step|Phase|Initializing"
```

### Monitor Resource Usage

```bash
# Check memory usage
docker stats my-service --no-stream

# Check CPU usage
docker stats my-service --no-stream --format "table {{.Name}}\t{{.CPUPerc}}"

# Check connection count
docker exec postgres psql -U postgres -d platform -c \
  "SELECT count(*) FROM pg_stat_activity WHERE application_name LIKE 'my-service%';"
```

### Test Service Manually

```typescript
// test-service.ts
import { BaseService } from '@banyanai/platform-base-service';

async function test() {
  try {
    await BaseService.start({
      name: 'test-service',
      version: '1.0.0'
    });

    console.log('✓ Service started successfully');

    // Test operations
    const healthMonitor = BaseService.getHealthMonitor();
    const health = await healthMonitor.getHealth();
    console.log('Health:', health);

  } catch (error) {
    console.error('✗ Service startup failed:', error);
    process.exit(1);
  }
}

test();
```

---

## Best Practices

### 1. Always Validate Configuration

```typescript
// Validate before starting service
const config = {
  name: process.env.SERVICE_NAME,
  version: process.env.SERVICE_VERSION,
  database: {
    url: process.env.DATABASE_URL
  },
  messageBus: {
    urls: [process.env.RABBITMQ_URL!]
  }
};

// Check required fields
if (!config.name || !config.version) {
  throw new Error('SERVICE_NAME and SERVICE_VERSION required');
}

await BaseService.start(config);
```

### 2. Use Health Checks

```typescript
// Register custom health checks for dependencies
const healthMonitor = BaseService.getHealthMonitor();

healthMonitor.registerHealthCheck('cache', async () => {
  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
});
```

### 3. Implement Graceful Shutdown

```typescript
let isShuttingDown = false;

process.on('SIGTERM', async () => {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log('Shutting down gracefully');

  // Stop accepting new requests
  await stopAcceptingRequests();

  // Wait for in-flight requests
  await waitForInFlightRequests();

  // BaseService cleanup happens automatically
});
```

### 4. Monitor Startup Time

```typescript
const startTime = Date.now();

await BaseService.start({ /* config */ });

const duration = Date.now() - startTime;
console.log(`Service started in ${duration}ms`);

// Alert if startup takes too long
if (duration > 30000) {
  console.warn('Slow startup detected');
}
```

---

## Related Documentation

- [BaseService Concepts](../../02-core-concepts/base-service.md)
- [Service Won't Start](../by-symptom/service-wont-start.md)
- [Handler Discovery Issues](../by-symptom/handlers-not-discovered.md)
- [Error Catalog](../common-errors/error-catalog.md)
- [Log Analysis](../debugging-tools/log-analysis.md)

---

## Summary

Most BaseService issues are caused by:

1. **Configuration errors** - Validate service name, version, and required config
2. **Missing dependencies** - Ensure PostgreSQL and RabbitMQ are running and healthy
3. **Handler discovery failures** - Place handlers in correct folders with proper decorators
4. **Connection failures** - Use correct URLs and service names (not localhost)
5. **Missing environment variables** - Provide all required configuration

Use `docker logs` and health checks to diagnose issues. BaseService provides detailed logging of initialization steps.
