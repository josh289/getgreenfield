---
title: API Gateway Issues
description: Component-specific troubleshooting for API Gateway including routing, authentication, and protocol translation
category: troubleshooting
tags: [api-gateway, routing, graphql, rest, websocket, sse]
related:
  - ../by-symptom/api-calls-failing.md
  - ../by-symptom/authentication-errors.md
  - ../../02-core-concepts/api-gateway.md
difficulty: intermediate
---

# API Gateway Issues

## Component Overview

The API Gateway is the single entry point for all client requests. It handles:

- **REST API**: HTTP POST/GET to service operations
- **GraphQL API**: Unified query interface
- **WebSocket**: Real-time bidirectional communication
- **SSE**: Server-Sent Events for notifications
- **Authentication**: JWT/JWKS validation (Layer 1)
- **Permission Validation**: Required permission checks
- **Protocol Translation**: HTTP → RabbitMQ messages
- **Dynamic Schema Generation**: From service contracts

## Common Issues

### 1. GraphQL Schema Generation Failures

**Symptoms:**
- Gateway fails to start
- Error: "Schema generation failed"
- GraphQL playground not accessible
- Duplicate type name errors

**Diagnostic Steps:**

```bash
# Check schema generation logs
docker logs api-gateway 2>&1 | grep -i "schema\|graphql"

# Common errors:
# "Duplicate type name 'User'"
# "Cannot query field 'X' on type 'Y'"
# "Failed to generate GraphQL schema"
```

**Common Causes:**

**A. Type Name Conflicts:**

Multiple services with same type names cause GraphQL conflicts:

```typescript
// user-service contracts
export type User = {
  userId: string;
  email: string;
};

// auth-service contracts (CONFLICT)
export type User = {  // ← Same name
  userId: string;
  permissions: string[];
};
```

**Solution:**

Use service-prefixed type names:

```typescript
// user-service
export type UserProfile = {  // Prefix with domain
  userId: string;
  email: string;
};

// auth-service
export type AuthUser = {  // Different name
  userId: string;
  permissions: string[];
};
```

**B. Dots in Field Names:**

Field names with dots break GraphQL:

```typescript
// ❌ WRONG: Dots in field name
export const GetUserQuery = {
  outputSchema: {
    'user.id': 'string',      // Invalid GraphQL field
    'user.email': 'string'
  }
};

// ✓ CORRECT: No dots
export const GetUserQuery = {
  outputSchema: {
    userId: 'string',
    userEmail: 'string'
  }
};
```

**Solution:**

API Gateway automatically sanitizes field names (dots → underscores):

```
user.id → user_id
organization.settings.name → organization_settings_name
```

But prefer flat structure in contracts.

**C. Invalid GraphQL Type Names:**

```typescript
// ❌ WRONG: Invalid characters
export type User-Profile = { };  // Dash not allowed
export type 123User = { };       // Can't start with number

// ✓ CORRECT: Valid GraphQL names
export type UserProfile = { };
export type User123 = { };
```

**Prevention:**
- Use unique type names per service
- Avoid dots in field names
- Use PascalCase for types
- Test schema generation after adding contracts

---

### 2. Route Registration Problems

**Symptoms:**
- 404 errors for valid endpoints
- Routes not appearing in gateway logs
- Operations not accessible via REST

**Diagnostic Steps:**

```bash
# Check registered routes
docker logs api-gateway 2>&1 | grep "route\|endpoint\|registered"

# Should see:
# Registered route: POST /api/create-user
# Registered route: GET /api/get-user

# Check service discovery
curl http://localhost:3001/api/services | jq '.services[].name'

# Check contracts received
curl http://localhost:3001/api/services/my-service/contracts | jq
```

**Common Causes:**

**A. Service Not Registered:**

```bash
# Service not in service discovery
curl http://localhost:3001/api/services | jq '.services[] | select(.name=="my-service")'

# If empty, service not started or registration failed
docker ps | grep my-service
docker logs my-service | grep "registered"
```

**Solution:** See [Service Discovery Issues](./service-discovery-issues.md)

**B. Contracts Not Broadcast:**

```bash
# Service registered but no contracts
curl http://localhost:3001/api/services/my-service/contracts

# Should show operations
# If empty, contract broadcasting failed

# Check service logs
docker logs my-service | grep "contract\|broadcast"
```

**Solution:**

Ensure `BaseService.start()` called properly:

```typescript
// Service startup
import { BaseService } from '@banyanai/platform-base-service';

await BaseService.start({
  name: 'my-service',
  version: '1.0.0'
});

// BaseService automatically broadcasts contracts
```

**C. Gateway Started Before Services:**

Gateway caches contract-to-route mappings. If services start after gateway, routes not registered.

**Solution:**

Restart gateway to reload contracts:

```bash
docker compose restart api-gateway

# Or use health check dependencies in docker-compose.yml
depends_on:
  service-discovery:
    condition: service_healthy
```

**Prevention:**
- Use proper docker-compose dependency order
- Implement contract change notifications
- Monitor route registration in logs

---

### 3. Authentication Configuration Issues

**Symptoms:**
- All requests return 401 Unauthorized
- Development headers not working
- JWT validation failures

**See:** [Authentication Errors](../by-symptom/authentication-errors.md) for detailed troubleshooting.

**Quick Checks:**

```bash
# Check authentication mode
docker logs api-gateway 2>&1 | grep "JWTAuthenticationEngine\|DEVELOPMENT_AUTH"

# Should show one of:
# "Development auth enabled"
# "Configured for HS256 mode"
# "Configured for RS256 mode with JWKS"

# Test configuration
docker compose exec api-gateway env | grep -E "DEVELOPMENT_AUTH|JWT_SECRET|JWKS_URI"
```

**Common Misconfigurations:**

```yaml
# ❌ WRONG: No auth configured
api-gateway:
  environment:
    - SERVICE_NAME=api-gateway

# ✓ CORRECT: Development mode for local
api-gateway:
  environment:
    - DEVELOPMENT_AUTH_ENABLED=true

# ✓ CORRECT: Production with JWKS
api-gateway:
  environment:
    - JWKS_URI=https://auth-provider.com/.well-known/jwks.json
    - JWT_ISSUER=https://auth-provider.com/
    - JWT_AUDIENCE=https://api.example.com
```

---

### 4. CORS Configuration Problems

**Symptoms:**
- Browser console: "blocked by CORS policy"
- Preflight OPTIONS requests fail
- Cross-origin requests rejected

**Diagnostic Steps:**

```bash
# Test CORS headers
curl -i -X OPTIONS http://localhost:3000/api/endpoint \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"

# Should see:
# Access-Control-Allow-Origin: *
# Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
# Access-Control-Allow-Headers: Content-Type, Authorization, ...
```

**Common Issues:**

**A. Gateway Version Too Old:**

CORS fixed in version 1.0.115+:

```bash
# Check version
docker logs api-gateway | grep "version\|v1\."

# Update if needed
docker pull ghcr.io/your-org/api-gateway:latest
docker compose up -d api-gateway
```

**B. Custom Headers Not Allowed:**

```javascript
// Check which headers are allowed
// API Gateway allows by default:
// - Content-Type
// - Authorization
// - X-Dev-User-Id
// - X-Dev-Permissions
// - X-Correlation-Id

// If using custom headers, may need gateway update
```

**Prevention:**
- Keep API Gateway updated (1.0.115+)
- Use standard HTTP headers when possible
- Test CORS in browser dev tools

---

### 5. WebSocket Connection Issues

**Symptoms:**
- WebSocket connection fails
- Connection closes immediately
- Authentication errors on WebSocket

**Diagnostic Steps:**

```bash
# Check WebSocket endpoint
curl -i -H "Connection: Upgrade" \
        -H "Upgrade: websocket" \
        http://localhost:3000/ws

# Should return 101 Switching Protocols

# Check logs
docker logs api-gateway 2>&1 | grep -i "websocket\|ws"
```

**Common Causes:**

**A. Missing Authentication:**

```javascript
// ❌ WRONG: No authentication
const ws = new WebSocket('ws://localhost:3000/ws');

// ✓ CORRECT: With authentication
const ws = new WebSocket('ws://localhost:3000/ws');
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'YOUR_JWT_TOKEN'
  }));
};
```

**B. Connection Upgrade Failed:**

```bash
# Check if WebSocket enabled
docker logs api-gateway | grep "WebSocket server"

# Should see: "WebSocket server listening"
```

**Solution:**

Ensure gateway supports WebSocket (version 1.0.100+)

---

### 6. SSE (Server-Sent Events) Issues

**Symptoms:**
- SSE connection fails
- No events received
- Connection closed by server

**Diagnostic Steps:**

```bash
# Test SSE endpoint
curl -N -H "Accept: text/event-stream" \
        -H "Authorization: Bearer $TOKEN" \
        http://localhost:3000/api/events

# Should stream events:
# data: {"type":"connected"}
# data: {"type":"event","data":{...}}
```

**Common Issues:**

**A. Missing Token:**

```javascript
// ❌ WRONG: No token
const eventSource = new EventSource('/api/events');

// ✓ CORRECT: With token (query param)
const token = localStorage.getItem('jwt');
const eventSource = new EventSource(`/api/events?token=${token}`);
```

**B. Insufficient Permissions:**

```bash
# Check error response
curl -i -H "Authorization: Bearer $TOKEN" \
        http://localhost:3000/api/events

# 403 Forbidden: Check permissions
# User needs permissions for subscribed event types
```

**C. Connection Limit Exceeded:**

Default: 5 concurrent SSE connections per user

```javascript
// Close unused connections
eventSource.close();

// Track connections
window.addEventListener('beforeunload', () => {
  eventSource.close();
});
```

**Prevention:**
- Include authentication token
- Grant required permissions
- Close connections when page unloads
- Limit SSE connections per user

---

### 7. GraphQL Query Complexity Issues

**Symptoms:**
- Query rejected with "complexity exceeds maximum"
- Deep nested queries fail
- Large queries timeout

**Diagnostic Steps:**

```bash
# Check query complexity limits
docker logs api-gateway | grep "complexity\|depth"

# Default limits:
# Max depth: 5
# Max complexity: 1000
```

**Solution:**

Simplify queries:

```graphql
# ❌ TOO COMPLEX: Deep nesting
query {
  user {
    organization {
      users {
        organization {  # 4 levels deep
          users {
            organization {  # 6 levels - exceeds limit!
              # ...
            }
          }
        }
      }
    }
  }
}

# ✓ BETTER: Flat queries
query {
  user {
    userId
    email
    organizationId
  }

  organization(id: $orgId) {
    name
    users {
      userId
      email
    }
  }
}
```

**Prevention:**
- Limit query depth in client
- Use pagination for lists
- Split complex queries into multiple requests

---

## Configuration Troubleshooting

### Environment Variables

Required environment variables for API Gateway:

```yaml
api-gateway:
  environment:
    # Service identification
    - SERVICE_NAME=api-gateway
    - SERVICE_VERSION=1.0.0

    # Infrastructure
    - RABBITMQ_URL=amqp://admin:admin123@rabbitmq:5672
    - REDIS_URL=redis://redis:6379

    # Authentication (choose one)
    - DEVELOPMENT_AUTH_ENABLED=true  # Dev only
    # OR
    - JWT_SECRET=your-secret-key  # HS256
    # OR
    - JWKS_URI=https://auth-provider.com/.well-known/jwks.json  # RS256

    # Optional
    - JWT_ISSUER=https://auth-provider.com/
    - JWT_AUDIENCE=https://api.example.com
    - PORT=3000
    - LOG_LEVEL=info
```

### Health Check

```bash
# Check gateway health
curl http://localhost:3000/health

# Response:
{
  "status": "healthy",
  "service": "api-gateway",
  "version": "1.0.0",
  "timestamp": "2024-01-15T12:00:00Z"
}
```

### Metrics Endpoint

```bash
# Check metrics
curl http://localhost:3000/metrics

# Prometheus format metrics
```

---

## Performance Issues

### Slow GraphQL Queries

**Symptoms:**
- GraphQL queries take >1s
- Timeout errors
- High CPU usage

**Diagnostic Steps:**

```bash
# Check Jaeger traces
# Open http://localhost:16686
# Search for slow GraphQL operations

# Check Redis cache
docker logs api-gateway | grep "cache\|redis"
```

**Common Causes:**

**A. Cache Disabled:**

```bash
# Check if Redis connected
docker logs api-gateway | grep "Redis"

# Should see: "Redis client connected"
```

**B. N+1 Query Problem:**

GraphQL resolver makes separate query for each item:

```graphql
query {
  users {  # 100 users
    id
    organization {  # 100 separate queries!
      name
    }
  }
}
```

**Solution:**

Use DataLoader pattern (implemented in gateway for platform services)

**C. No Indexes:**

Check database indexes for frequently queried fields

**Prevention:**
- Enable Redis caching
- Use DataLoader for batch loading
- Add database indexes
- Monitor query performance in Jaeger

---

### High Memory Usage

**Symptoms:**
- Gateway OOM (Out of Memory)
- Container restarts
- Slow responses

**Diagnostic Steps:**

```bash
# Check memory usage
docker stats api-gateway

# Check for memory leaks
docker logs api-gateway | grep -i "heap\|memory"
```

**Solutions:**

1. Increase memory limit in docker-compose.yml:

```yaml
api-gateway:
  deploy:
    resources:
      limits:
        memory: 2G
```

2. Enable garbage collection logging:

```yaml
api-gateway:
  environment:
    - NODE_OPTIONS=--max-old-space-size=1024 --trace-gc
```

3. Check for memory leaks (circular references, event listeners)

---

## Debugging Techniques

### Enable Debug Logging

```yaml
api-gateway:
  environment:
    - LOG_LEVEL=debug
```

Logs will show:

- Route registration
- Authentication flow
- Request routing
- Schema generation
- Contract updates

### Test Specific Endpoints

```bash
# REST endpoint
curl -X POST http://localhost:3000/api/create-user \
  -H "Content-Type: application/json" \
  -H "X-Dev-User-Id: test" \
  -H "X-Dev-Permissions: *" \
  -d '{"email":"test@example.com"}'

# GraphQL endpoint
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"query":"{ user(id: \"123\") { email } }"}'

# SSE endpoint
curl -N -H "Accept: text/event-stream" \
        -H "Authorization: Bearer $TOKEN" \
        http://localhost:3000/api/events
```

### Monitor Contract Updates

```bash
# Watch for contract changes
docker logs -f api-gateway | grep "contract"

# Should see:
# Received contract update: my-service.CreateUser
# Route registered: POST /api/create-user
```

### Check Message Bus Connection

```bash
# Verify gateway connected to RabbitMQ
docker logs api-gateway | grep -i "rabbitmq\|amqp"

# Should see:
# Connected to RabbitMQ
# Subscribed to platform.contracts
```

---

## Related Documentation

- [API Calls Failing](../by-symptom/api-calls-failing.md) - Symptom-based troubleshooting
- [Authentication Errors](../by-symptom/authentication-errors.md) - Auth-specific issues
- [API Gateway Architecture](../../02-core-concepts/api-gateway.md) - How gateway works
- [Service Discovery Issues](./service-discovery-issues.md) - Registration problems

---

## Summary

Common API Gateway issues:

1. **Schema generation fails** - Use unique type names, avoid dots in fields
2. **Routes not registered** - Ensure service registered and contracts broadcast
3. **Authentication fails** - Configure auth mode correctly (dev/HS256/RS256)
4. **CORS errors** - Update gateway to 1.0.115+
5. **WebSocket/SSE issues** - Include authentication, check permissions

Always check gateway logs first, then verify service discovery and contract broadcasting.
