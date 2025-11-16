---
title: API Calls Failing
description: Troubleshooting guide for HTTP requests failing at the API Gateway
category: troubleshooting
tags: [api-gateway, http, rest, graphql, authentication]
related:
  - ../by-component/api-gateway-issues.md
  - ./authentication-errors.md
  - ../debugging-tools/correlation-id-tracking.md
difficulty: beginner
---

# API Calls Failing

## Observable Symptoms

- HTTP requests return error responses (400, 401, 403, 404, 500)
- GraphQL queries/mutations fail
- CORS errors in browser console
- Timeout errors
- Connection refused errors

## Quick Fix

```bash
# Check API Gateway status
docker ps | grep api-gateway
docker logs api-gateway 2>&1 | tail -50

# Test API Gateway health
curl http://localhost:3000/health

# Check for common errors
docker logs api-gateway 2>&1 | grep -i "error\|fail"

# Get correlation ID from response
curl -i http://localhost:3000/api/your-endpoint
# Look for X-Correlation-Id header
```

## Common Causes (Ordered by Frequency)

### 1. Authentication Failures (401 Unauthorized)

**Frequency:** Very Common (35% of cases)

**Symptoms:**
- HTTP 401 response
- Error message: "Unauthorized" or "Authentication required"
- Valid JWT but still rejected
- Development headers not working

**Diagnostic Steps:**

```bash
# Check authentication mode
docker logs api-gateway 2>&1 | grep "JWTAuthenticationEngine\|DEVELOPMENT_AUTH_ENABLED"

# Test with dev headers
curl -H "X-Dev-User-Id: test-user" \
     -H "X-Dev-Permissions: *" \
     http://localhost:3000/api/endpoint

# Test with JWT
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:3000/api/endpoint

# Decode JWT to check claims
echo "YOUR_JWT_TOKEN" | cut -d. -f2 | base64 -d | jq
```

**Common Issues:**

**A. Development Mode Not Enabled:**

```yaml
# ❌ MISSING: Development auth not enabled
api-gateway:
  environment:
    - JWT_SECRET=secret

# ✓ CORRECT: Development auth enabled
api-gateway:
  environment:
    - DEVELOPMENT_AUTH_ENABLED=true
    - JWT_SECRET=secret
```

**B. Invalid JWT Token:**

```bash
# Check token expiration
echo "YOUR_JWT" | cut -d. -f2 | base64 -d | jq '.exp'

# Compare to current time
date +%s

# If exp < current time, token is expired
```

**C. Missing JWT `sub` Claim:**

```json
// ❌ WRONG: No subject claim
{
  "email": "user@example.com",
  "permissions": ["users:read"]
}

// ✓ CORRECT: Has sub claim
{
  "sub": "user-123",
  "email": "user@example.com",
  "permissions": ["users:read"]
}
```

**D. Algorithm Mismatch (HS256 vs RS256):**

```bash
# Check JWT header
echo "YOUR_JWT" | cut -d. -f1 | base64 -d | jq

# If alg is RS256, need JWKS_URI
# If alg is HS256, need JWT_SECRET

# ❌ WRONG: RS256 token with JWT_SECRET
api-gateway:
  environment:
    - JWT_SECRET=secret  # Won't work with RS256

# ✓ CORRECT: RS256 with JWKS
api-gateway:
  environment:
    - JWKS_URI=https://auth-provider.com/.well-known/jwks.json
```

**Solution:**

See [Authentication Errors](./authentication-errors.md) for detailed authentication troubleshooting.

Quick fixes:

1. Enable development mode for local testing
2. Verify JWT has `sub` claim
3. Check token expiration
4. Match algorithm (HS256 vs RS256) with config

**Prevention:**
- Use consistent auth configuration
- Monitor token expiration
- Validate JWT structure in auth service

---

### 2. Permission Denied (403 Forbidden)

**Frequency:** Very Common (25% of cases)

**Symptoms:**
- HTTP 403 response
- Error: "Access denied" or "Insufficient permissions"
- User authenticated but operation rejected
- Permission requirements not met

**Diagnostic Steps:**

```bash
# Check required permissions
curl http://localhost:3001/api/services/SERVICE_NAME/contracts | jq

# Check user permissions in JWT
echo "YOUR_JWT" | cut -d. -f2 | base64 -d | jq '.permissions'

# Test with wildcard permissions
curl -H "X-Dev-User-Id: test" \
     -H "X-Dev-Permissions: *" \
     http://localhost:3000/api/endpoint

# Check API Gateway logs
docker logs api-gateway 2>&1 | grep "AUTHORIZATION_ERROR"
```

**Common Issues:**

**A. Missing Permissions in JWT:**

```json
// ❌ WRONG: User lacks required permission
{
  "sub": "user-123",
  "permissions": ["users:read"]  // Missing users:create
}

// Contract requires:
@RequiresPermissions(['users:create'])

// ✓ CORRECT: User has required permission
{
  "sub": "user-123",
  "permissions": ["users:read", "users:create"]
}
```

**B. Permission Format Mismatch:**

```bash
# ❌ WRONG formats:
"users-create"     # Dash instead of colon
"USERS:CREATE"     # Uppercase
"user:create"      # Wrong resource name (singular vs plural)

# ✓ CORRECT format:
"users:create"     # lowercase, colon separator, plural resource
```

**C. Development Headers Wrong:**

```bash
# ❌ WRONG
curl -H "X-Dev-Permissions: users:create users:read"  # Space-separated

# ✓ CORRECT
curl -H "X-Dev-Permissions: users:create,users:read"  # Comma-separated
# OR
curl -H "X-Dev-Permissions: *"  # Wildcard for all permissions
```

**Solution:**

1. Check contract required permissions
2. Ensure JWT/headers include those permissions
3. Use exact permission format (lowercase, colon)
4. Grant permissions to user/role in auth service

**Prevention:**
- Document required permissions for each operation
- Use permission constants to avoid typos
- Implement permission management UI

---

### 3. Not Found (404)

**Frequency:** Common (20% of cases)

**Symptoms:**
- HTTP 404 response
- Error: "Not found" or "Handler not found"
- Route not registered
- Service not discovered

**Diagnostic Steps:**

```bash
# Check service registration
curl http://localhost:3001/api/services | jq '.services[].name'

# Check API Gateway routes
docker logs api-gateway 2>&1 | grep "route\|endpoint"

# Check handler discovery
docker logs TARGET_SERVICE 2>&1 | grep "Handler discovery"

# Test correct endpoint format
# Commands/Mutations: POST /api/operation-name
# Queries: GET /api/operation-name?param=value
```

**Common Issues:**

**A. Service Not Registered:**

```bash
# Service not in service discovery
curl http://localhost:3001/api/services | jq '.services[] | select(.name=="my-service")'

# Returns empty? Service not started or not registered
docker ps | grep my-service
docker logs my-service | grep "registered"
```

**B. Wrong Endpoint Path:**

```bash
# ❌ WRONG paths:
POST /api/CreateUser        # Wrong case (PascalCase)
GET /api/users              # Wrong format (REST-style)
POST /commands/create-user  # Wrong prefix

# ✓ CORRECT paths:
POST /api/create-user       # kebab-case for commands
GET /api/get-user?userId=123  # kebab-case for queries
```

**C. Handler Not Discovered:**

```bash
# Check handler discovery count
docker logs my-service 2>&1 | grep "Handler discovery"

# Should show handlers found
# If totalHandlers: 0, see handlers-not-discovered.md
```

**D. Wrong HTTP Method:**

```bash
# ❌ WRONG
GET /api/create-user   # Commands need POST

# ✓ CORRECT
POST /api/create-user  # Commands use POST
GET /api/get-user      # Queries use GET
```

**Solution:**

1. Ensure service is running and registered
2. Verify handler discovered (see [Handlers Not Discovered](./handlers-not-discovered.md))
3. Use correct endpoint path format
4. Use correct HTTP method (POST for commands, GET for queries)

**Prevention:**
- Monitor service registration
- Use API client generator for type-safe calls
- Document endpoint conventions

---

### 4. Validation Errors (400 Bad Request)

**Frequency:** Common (10% of cases)

**Symptoms:**
- HTTP 400 response
- Error: "Validation failed" with field details
- Missing required fields
- Invalid field values

**Diagnostic Steps:**

```bash
# Check error response for validation details
curl -X POST http://localhost:3000/api/create-user \
  -H "Content-Type: application/json" \
  -d '{"email":"invalid"}' | jq

# Response shows which fields failed:
# {
#   "error": "Validation failed",
#   "validationErrors": [
#     {"field": "email", "message": "Invalid email format"},
#     {"field": "password", "message": "Required field missing"}
#   ]
# }
```

**Common Issues:**

**A. Missing Required Fields:**

```json
// ❌ WRONG: Missing required fields
{
  "email": "user@example.com"
  // Missing: password, name, etc.
}

// ✓ CORRECT: All required fields
{
  "email": "user@example.com",
  "password": "secure-password",
  "name": "John Doe"
}
```

**B. Invalid Field Format:**

```json
// ❌ WRONG: Invalid formats
{
  "email": "not-an-email",        // Invalid email
  "age": "twenty-five",           // Should be number
  "startDate": "2024-13-45"       // Invalid date
}

// ✓ CORRECT: Valid formats
{
  "email": "user@example.com",
  "age": 25,
  "startDate": "2024-01-15T00:00:00Z"
}
```

**C. Type Mismatch:**

```json
// ❌ WRONG: String where number expected
{
  "userId": "123"  // Should be number or UUID depending on contract
}

// ✓ CORRECT: Proper types
{
  "userId": 123  // or "user-uuid-123" depending on schema
}
```

**Solution:**

1. Review validation error details
2. Ensure all required fields present
3. Use correct field types and formats
4. Validate input client-side before sending

**Prevention:**
- Use TypeScript types for API calls
- Generate client libraries from contracts
- Implement client-side validation

---

### 5. Internal Server Error (500)

**Frequency:** Occasional (5% of cases)

**Symptoms:**
- HTTP 500 response
- Error: "Internal Server Error"
- Correlation ID provided
- Handler execution failure

**Diagnostic Steps:**

```bash
# Get correlation ID from response
curl -i http://localhost:3000/api/endpoint

# Search logs with correlation ID
CORRELATION_ID="abc-123-def-456"
docker logs api-gateway 2>&1 | grep "$CORRELATION_ID"
docker logs target-service 2>&1 | grep "$CORRELATION_ID"

# Check Jaeger trace
# Open http://localhost:16686
# Search for correlation ID
```

**Common Causes:**

**A. Handler Throws Unhandled Exception:**

```typescript
// Handler code with error
@CommandHandler(CreateUserCommand)
export class CreateUserHandler {
  async handle(command: CreateUserCommand) {
    // Throws error
    const result = await this.database.save(user);
    return result.data; // ← result might be null, throws TypeError
  }
}
```

**B. Database Connection Lost:**

```bash
# Check database connectivity
docker ps | grep postgres
docker logs postgres | tail -50

# Test connection from service
docker compose exec my-service nc -zv postgres 5432
```

**C. Message Bus Failure:**

```bash
# Check RabbitMQ
docker ps | grep rabbitmq
docker logs rabbitmq | tail -50

# Check message bus client connection
docker logs my-service 2>&1 | grep "RabbitMQ\|message bus"
```

**Solution:**

1. Get correlation ID from error response
2. Search service logs for correlation ID
3. Find stack trace and root cause
4. Fix handler logic or infrastructure issue
5. Test fix with same request

**Prevention:**
- Add proper error handling in handlers
- Use correlation IDs for tracing
- Monitor service health and dependencies

---

### 6. CORS Errors

**Frequency:** Occasional (3% of cases)

**Symptoms:**
- Browser console: "blocked by CORS policy"
- Preflight OPTIONS request fails
- Cross-origin request blocked

**Diagnostic Steps:**

```bash
# Check CORS headers in response
curl -i -X OPTIONS http://localhost:3000/api/endpoint \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST"

# Should see:
# Access-Control-Allow-Origin: *
# Access-Control-Allow-Methods: GET, POST, OPTIONS
# Access-Control-Allow-Headers: Content-Type, Authorization
```

**Common Issues:**

**A. API Gateway Version Too Old:**

Early versions had CORS bugs. Ensure version 1.0.115+:

```bash
# Check version
docker logs api-gateway 2>&1 | grep "version"

# Update if needed
docker pull ghcr.io/your-org/api-gateway:latest
docker compose up -d api-gateway
```

**B. Custom Headers Not Allowed:**

```javascript
// ❌ WRONG: Custom header not in allowed list
fetch('http://localhost:3000/api/endpoint', {
  headers: {
    'X-Custom-Header': 'value'  // Not allowed by default
  }
});

// ✓ CORRECT: Use allowed headers
fetch('http://localhost:3000/api/endpoint', {
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer token',
    'X-Dev-User-Id': 'test'  // Dev headers allowed
  }
});
```

**Solution:**

1. Update API Gateway to 1.0.115+
2. Use standard headers
3. Check CORS configuration in API Gateway

**Prevention:**
- Keep API Gateway updated
- Use standard HTTP headers when possible
- Test with browser dev tools

---

### 7. Request Timeout

**Frequency:** Rare (2% of cases)

**Symptoms:**
- Request never completes
- Gateway timeout (504)
- Client timeout error

**Diagnostic Steps:**

```bash
# Check if request reached service
CORRELATION_ID="from-response"
docker logs target-service 2>&1 | grep "$CORRELATION_ID"

# Check Jaeger for slow spans
# Open http://localhost:16686
# Find trace and identify slow operations

# Check service health
curl http://localhost:3000/health
```

**Common Causes:**

**A. Handler Too Slow:**

Handler takes longer than timeout (default 30s):

```typescript
// Slow handler
@CommandHandler(ProcessLargeFileCommand)
export class ProcessLargeFileHandler {
  async handle(command: ProcessLargeFileCommand) {
    // Takes 60+ seconds
    await this.processFile(command.fileId);
  }
}
```

**B. Database Query Slow:**

```sql
-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**C. External API Delay:**

```typescript
// Waiting on external service
await externalApi.call(); // Takes 45 seconds
```

**Solution:**

1. Identify slow operation in Jaeger trace
2. Optimize slow database queries (add indexes)
3. Use async processing for long operations
4. Increase timeout if operation legitimately slow
5. Consider saga pattern for multi-step operations

**Prevention:**
- Monitor request duration
- Set query timeouts
- Use background jobs for long operations

---

## Debugging Workflow

For any API failure, follow this workflow:

### 1. Check HTTP Status Code

- **401** → Authentication issue (see [Authentication Errors](./authentication-errors.md))
- **403** → Permission issue (check required permissions)
- **404** → Route/handler not found (verify service registered)
- **400** → Validation error (check request payload)
- **500** → Internal error (use correlation ID to trace)
- **504** → Timeout (check for slow operations)

### 2. Get Correlation ID

```bash
# From response header
curl -i http://localhost:3000/api/endpoint | grep X-Correlation-Id

# From response body
curl http://localhost:3000/api/endpoint | jq '.correlationId'
```

### 3. Search Logs

```bash
CORRELATION_ID="abc-123"

# API Gateway logs
docker logs api-gateway 2>&1 | grep "$CORRELATION_ID"

# Target service logs
docker logs my-service 2>&1 | grep "$CORRELATION_ID"
```

### 4. Check Jaeger Trace

```
1. Open http://localhost:16686
2. Service: Select target service
3. Tags: correlation.id="abc-123"
4. Find Traces
5. Click trace to see timeline
6. Identify error span
```

### 5. Fix and Verify

```bash
# After fix, test with same request
curl -X POST http://localhost:3000/api/endpoint \
  -H "Content-Type: application/json" \
  -d '{"test":"data"}'

# Should succeed with 200 OK
```

---

## Common Error Messages

### "Cannot read property 'X' of undefined"

**Cause:** Handler logic error - accessing undefined object

**Solution:** Add null checks in handler code

### "Connection refused"

**Cause:** API Gateway not running or wrong port

**Solution:** Check gateway status and port mapping

### "Invalid token signature"

**Cause:** JWT signed with different secret than gateway expects

**Solution:** Ensure JWT_SECRET matches between auth service and gateway

---

## Verification Steps

After fixing issue:

### 1. Request Succeeds

```bash
# Test endpoint
curl -X POST http://localhost:3000/api/create-user \
  -H "Content-Type: application/json" \
  -H "X-Dev-User-Id: test" \
  -H "X-Dev-Permissions: users:create" \
  -d '{"email":"test@example.com","password":"password123"}'

# Should return 200 OK with result
```

### 2. Check Response

```json
// Success response
{
  "userId": "user-123",
  "email": "test@example.com"
}

// With correlation ID in headers
X-Correlation-Id: abc-123-def-456
```

### 3. Verify in Jaeger

All spans complete without errors

---

## Related Documentation

- [API Gateway Issues](../by-component/api-gateway-issues.md) - Gateway-specific troubleshooting
- [Authentication Errors](./authentication-errors.md) - Detailed auth troubleshooting
- [Correlation ID Tracking](../debugging-tools/correlation-id-tracking.md) - Using correlation IDs
- [Jaeger Tracing](../debugging-tools/jaeger-tracing.md) - Distributed tracing
- [Error Catalog](../common-errors/error-catalog.md) - Specific error codes

---

## Summary

API call failures usually fall into these categories:

1. **Authentication (401)** - Enable dev mode or fix JWT
2. **Authorization (403)** - Grant required permissions
3. **Not Found (404)** - Verify service registered and handlers discovered
4. **Validation (400)** - Fix request payload
5. **Internal Error (500)** - Use correlation ID to trace root cause

Always capture the correlation ID and use it to trace the request through logs and Jaeger.
