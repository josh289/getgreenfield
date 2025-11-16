---
title: Service Won't Start
description: Troubleshooting guide when a platform service fails to start or crashes on startup
category: troubleshooting
tags: [service-startup, initialization, docker, configuration]
related:
  - ../../02-core-concepts/base-service.md
  - ../by-component/message-bus-issues.md
  - ../debugging-tools/log-analysis.md
difficulty: beginner
---

# Service Won't Start

## Observable Symptoms

- Docker container exits immediately after starting
- Service crashes during startup before accepting requests
- Container status shows "Exited" or "Restarting"
- Health check endpoints never become available
- Logs show initialization errors

## Quick Fix

```bash
# Check container status
docker ps -a | grep my-service

# View startup logs
docker logs my-service

# Check recent errors
docker logs my-service 2>&1 | grep -i "error\|fatal\|exception"

# Restart with fresh state
docker compose down my-service
docker compose up my-service
```

## Common Causes (Ordered by Frequency)

### 1. Missing or Invalid Environment Variables

**Frequency:** Very Common (30% of cases)

**Symptoms:**
- Service exits with "Configuration error"
- Logs show missing required variables
- Connection failures to dependencies

**Diagnostic Steps:**

```bash
# Check environment variables in container
docker compose exec my-service env | grep -E "RABBITMQ|POSTGRES|REDIS|JWT"

# View docker-compose configuration
docker compose config | grep -A 10 "my-service"

# Check .env file
cat .env | grep -E "RABBITMQ|POSTGRES|DATABASE"
```

**Common Missing Variables:**

```bash
# Required for most services:
RABBITMQ_URL=amqp://admin:admin123@rabbitmq:5672
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/platform
SERVICE_NAME=my-service
SERVICE_VERSION=1.0.0

# Required for API Gateway:
JWT_SECRET=your-secret-key-change-in-production
# OR
JWKS_URI=https://your-auth-provider.com/.well-known/jwks.json

# Required for services with Redis:
REDIS_URL=redis://redis:6379
```

**Solution:**

Add missing variables to `docker-compose.yml`:

```yaml
services:
  my-service:
    environment:
      - RABBITMQ_URL=amqp://admin:admin123@rabbitmq:5672
      - DATABASE_URL=postgresql://postgres:postgres@postgres:5432/platform
      - REDIS_URL=redis://redis:6379
      - SERVICE_NAME=my-service
      - SERVICE_VERSION=1.0.0
      - LOG_LEVEL=info
```

Or use `.env` file:

```bash
# .env
RABBITMQ_URL=amqp://admin:admin123@rabbitmq:5672
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/platform
REDIS_URL=redis://redis:6379
```

**Prevention:**
- Use environment variable validation on startup
- Document required variables in README
- Provide example `.env.example` file

---

### 2. Cannot Connect to RabbitMQ

**Frequency:** Very Common (25% of cases)

**Symptoms:**
- Logs show: "Failed to connect to RabbitMQ"
- Service retries connection and fails
- Container exits after connection timeout

**Diagnostic Steps:**

```bash
# Check RabbitMQ is running
docker ps | grep rabbitmq

# Test RabbitMQ connectivity from service container
docker compose exec my-service nc -zv rabbitmq 5672

# Check RabbitMQ logs
docker logs rabbitmq 2>&1 | tail -50

# Test RabbitMQ management interface
curl http://localhost:15672/api/overview
```

**Common Issues:**

**A. RabbitMQ Not Started:**

```bash
# Start RabbitMQ
docker compose up -d rabbitmq

# Wait for RabbitMQ to be ready
docker logs rabbitmq 2>&1 | grep "Server startup complete"
```

**B. Wrong Connection URL:**

```yaml
# ❌ WRONG
RABBITMQ_URL=amqp://localhost:5672  # localhost won't work in Docker

# ✓ CORRECT
RABBITMQ_URL=amqp://admin:admin123@rabbitmq:5672  # Use service name
```

**C. Service Starts Before RabbitMQ Ready:**

Add health check dependency:

```yaml
services:
  my-service:
    depends_on:
      rabbitmq:
        condition: service_healthy

  rabbitmq:
    healthcheck:
      test: rabbitmq-diagnostics -q ping
      interval: 10s
      timeout: 5s
      retries: 5
```

**Solution:**

1. Ensure RabbitMQ is running and healthy
2. Use correct connection URL with service name
3. Add `depends_on` with health check
4. Verify credentials match RabbitMQ configuration

**Prevention:**
- Use Docker Compose health checks
- Implement connection retry logic in BaseService
- Monitor RabbitMQ availability

---

### 3. Database Connection Failures

**Frequency:** Common (20% of cases)

**Symptoms:**
- Logs show: "Database connection failed"
- PostgreSQL timeout errors
- "relation does not exist" errors

**Diagnostic Steps:**

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Test database connectivity
docker compose exec my-service nc -zv postgres 5432

# Connect to database
docker compose exec postgres psql -U postgres -d platform

# Check database exists
docker compose exec postgres psql -U postgres -l
```

**Common Issues:**

**A. Database Doesn't Exist:**

```bash
# Create database
docker compose exec postgres psql -U postgres -c "CREATE DATABASE platform;"

# Or in docker-compose.yml
postgres:
  environment:
    - POSTGRES_DB=platform  # Auto-creates database
```

**B. Schema Not Initialized:**

```bash
# Check if event store schema exists
docker compose exec postgres psql -U postgres -d platform \
  -c "\dt" | grep events

# Initialize schema (run from service or migration)
# This is typically done automatically by BaseService or event store
```

**C. Wrong Connection String:**

```bash
# ❌ WRONG
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/platform

# ✓ CORRECT
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/platform
```

**Solution:**

1. Ensure PostgreSQL is running
2. Verify database exists
3. Use correct connection string
4. Initialize schema on first run
5. Add health check dependency:

```yaml
services:
  my-service:
    depends_on:
      postgres:
        condition: service_healthy

  postgres:
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5
```

**Prevention:**
- Auto-create database in docker-compose
- Run migrations on startup
- Use connection retry logic

---

### 4. Build Errors (Missing Dependencies)

**Frequency:** Common (15% of cases)

**Symptoms:**
- Container fails during image build
- "Cannot find module" errors
- npm/pnpm install failures

**Diagnostic Steps:**

```bash
# Check build logs
docker compose build my-service 2>&1 | tee build.log

# Look for specific errors
grep -i "error\|failed" build.log

# Check package.json dependencies
cat package.json | jq '.dependencies'
```

**Common Issues:**

**A. Platform Package Version Mismatch:**

```json
// package.json
{
  "dependencies": {
    "@banyanai/platform-base-service": "^1.0.116",
    "@banyanai/platform-cqrs": "^1.0.110"  // ❌ Different versions
  }
}

// ✓ CORRECT: All same version
{
  "dependencies": {
    "@banyanai/platform-base-service": "^1.0.116",
    "@banyanai/platform-cqrs": "^1.0.116"
  }
}
```

**B. Missing `.js` Extension in Imports:**

```typescript
// ❌ WRONG
import { BusinessError } from '../errors';

// ✓ CORRECT
import { BusinessError } from '../errors.js';
```

**C. node_modules Cached:**

```bash
# Clear Docker build cache
docker compose build --no-cache my-service

# Or clear node_modules in Dockerfile
# Add to .dockerignore:
node_modules
*/node_modules
.npm
```

**Solution:**

1. Update all platform packages to same version
2. Add `.js` extensions to all imports
3. Build with `--no-cache` flag
4. Ensure `.dockerignore` excludes `node_modules`

```bash
# .dockerignore
node_modules
*/node_modules
dist
*/dist
.npm
.git
.env
```

**Prevention:**
- Use exact versions for platform packages
- Run linter to check import extensions
- Use multi-stage Docker builds

---

### 5. Port Already in Use

**Frequency:** Occasional (5% of cases)

**Symptoms:**
- Error: "Port 3000 is already in use"
- Service can't bind to port
- Container exits with port conflict

**Diagnostic Steps:**

```bash
# Check what's using the port
lsof -i :3000
netstat -tuln | grep 3000

# Check Docker port bindings
docker ps --format "table {{.Names}}\t{{.Ports}}"

# Check for duplicate service instances
docker ps -a | grep my-service
```

**Solution:**

**A. Stop Conflicting Process:**

```bash
# Find process ID
lsof -i :3000

# Kill process
kill -9 <PID>
```

**B. Change Service Port:**

```yaml
# docker-compose.yml
services:
  my-service:
    ports:
      - "3001:3000"  # Map host port 3001 to container port 3000
```

**C. Remove Duplicate Containers:**

```bash
# Stop all instances
docker compose down my-service

# Remove stopped containers
docker container prune

# Start fresh
docker compose up my-service
```

**Prevention:**
- Use unique ports per service
- Stop services properly with `docker compose down`
- Use Docker Compose for orchestration

---

### 6. TypeScript Compilation Errors

**Frequency:** Occasional (3% of cases)

**Symptoms:**
- Build fails with TypeScript errors
- Module resolution failures
- Type checking errors

**Diagnostic Steps:**

```bash
# Run TypeScript compiler locally
pnpm run build

# Check for errors
pnpm run type-check

# View detailed errors
npx tsc --noEmit --pretty
```

**Common Issues:**

**A. Missing tsconfig.json Settings:**

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,  // REQUIRED
    "emitDecoratorMetadata": true,   // REQUIRED
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "esModuleInterop": true,
    "strict": true
  }
}
```

**B. Type-Only Imports for Decorators:**

```typescript
// ❌ WRONG: Type-only import
import type { CreateUserCommand } from '../contracts/commands.js';
@CommandHandlerDecorator(CreateUserCommand)  // Error!

// ✓ CORRECT: Value import
import { CreateUserCommand } from '../contracts/commands.js';
@CommandHandlerDecorator(CreateUserCommand)
```

**Solution:**

1. Fix TypeScript configuration
2. Resolve type errors
3. Use value imports for decorators
4. Rebuild service

```bash
# Clean build
rm -rf dist/
pnpm run build

# Rebuild Docker image
docker compose build --no-cache my-service
```

**Prevention:**
- Use provided tsconfig.json template
- Run type checking in CI/CD
- Enable strict mode

---

### 7. Handler Discovery Errors

**Frequency:** Occasional (2% of cases)

**Symptoms:**
- Service starts but no handlers discovered
- Contract broadcasting fails
- Handler registration errors

**See:** [Handlers Not Discovered](./handlers-not-discovered.md) for detailed troubleshooting.

**Quick Check:**

```bash
# Check handler discovery logs
docker logs my-service 2>&1 | grep "Handler discovery"

# Should show:
# Handler discovery completed { commandHandlers: N, queryHandlers: M, ... }
```

---

## Advanced Diagnostics

### Enable Debug Logging

```yaml
# docker-compose.yml
services:
  my-service:
    environment:
      - LOG_LEVEL=debug
```

View detailed startup logs:

```bash
docker compose up my-service

# Look for initialization steps:
# [DEBUG] Connecting to RabbitMQ...
# [DEBUG] Connection established
# [DEBUG] Scanning handlers...
# [DEBUG] Handler discovery completed
# [DEBUG] Service ready
```

### Interactive Container Debugging

```bash
# Start container with shell
docker compose run --rm my-service /bin/bash

# Test connections manually
nc -zv rabbitmq 5672
nc -zv postgres 5432
nc -zv redis 6379

# Check environment
env | grep -E "RABBITMQ|DATABASE|REDIS"

# Try starting service manually
node dist/index.js
```

### Check Dependencies Startup Order

```bash
# View dependency graph
docker compose config | grep -A 5 "depends_on"

# Ensure proper order:
# 1. Infrastructure (RabbitMQ, PostgreSQL, Redis)
# 2. Platform services (service-discovery, api-gateway)
# 3. Business services
```

### Review Health Checks

```bash
# Check health status
docker compose ps

# View health check logs
docker inspect my-service | jq '.[0].State.Health'

# Test health endpoint manually
curl http://localhost:3000/health
```

---

## Verification Steps

After fixing the issue:

### 1. Service Starts Successfully

```bash
# Check container status (should be "Up")
docker ps | grep my-service

# View startup logs (no errors)
docker logs my-service | tail -50

# Should see:
# Service 'my-service' started successfully on port 3000
```

### 2. Health Check Passes

```bash
# Test health endpoint
curl http://localhost:3000/health

# Should return:
# {"status":"healthy","service":"my-service","version":"1.0.0"}
```

### 3. Handlers Discovered

```bash
# Check handler discovery
docker logs my-service | grep "Handler discovery"

# Should show handlers found
```

### 4. Service Registered

```bash
# Check service discovery
curl http://localhost:3001/api/services | jq '.services[] | select(.name=="my-service")'

# Should show service registered
```

---

## Common Error Messages

### "Cannot find module '@banyanai/platform-*'"

**Cause:** Missing package installation or wrong version

**Solution:**

```bash
# In docker-compose.yml or Dockerfile
RUN pnpm install --frozen-lockfile

# Verify package.json has correct versions
```

### "Cannot use import statement outside a module"

**Cause:** Missing `"type": "module"` in package.json

**Solution:**

```json
// package.json
{
  "type": "module",
  "main": "./dist/index.js"
}
```

### "ECONNREFUSED" or "getaddrinfo ENOTFOUND"

**Cause:** Service trying to connect to unavailable dependency

**Solution:**

1. Check dependency is running
2. Use correct hostname (service name in Docker)
3. Add health check dependency

---

## Startup Checklist

Before deploying, verify:

- [ ] All required environment variables set
- [ ] RabbitMQ running and accessible
- [ ] PostgreSQL running with database created
- [ ] Redis running (if needed)
- [ ] All dependencies started before service
- [ ] Platform packages at same version
- [ ] TypeScript compiles without errors
- [ ] Handlers in correct directories with decorators
- [ ] Docker image builds successfully
- [ ] No port conflicts
- [ ] Health check endpoint configured

---

## Related Documentation

- [BaseService Startup](../../02-core-concepts/base-service.md) - Service initialization
- [Message Bus Issues](../by-component/message-bus-issues.md) - RabbitMQ troubleshooting
- [Service Discovery Issues](../by-component/service-discovery-issues.md) - Registration problems
- [Log Analysis](../debugging-tools/log-analysis.md) - Reading service logs
- [Error Catalog](../common-errors/error-catalog.md) - Specific error codes

---

## Summary

Most service startup failures are caused by:

1. **Missing environment variables** - Add all required config
2. **Dependency unavailability** - Ensure RabbitMQ/PostgreSQL running
3. **Build errors** - Fix TypeScript compilation and dependencies
4. **Port conflicts** - Use unique ports or stop conflicting services

Use `docker logs` to identify the specific error, then follow the diagnostic steps for that cause.
