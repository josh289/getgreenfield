---
title: REST API Error Handling
description: HTTP status codes, error formats, and troubleshooting guide
category: rest-api
tags: [rest, errors, http-status, troubleshooting]
related:
  - ./authentication.md
  - ./endpoints.md
  - ../graphql-api/overview.md
difficulty: beginner
---

# REST API Error Handling

Complete reference for HTTP status codes, error response formats, and troubleshooting common API errors.

## Error Response Format

All API errors follow a consistent JSON format:

```json
{
  "error": "Error type",
  "message": "Human-readable description",
  "code": "ERROR_CODE",
  "details": {
    "field": "Additional context"
  }
}
```

**Fields:**
- `error` - Error category (string)
- `message` - Human-readable error description
- `code` - Machine-readable error code (uppercase snake_case)
- `details` - Optional additional context (object)

## HTTP Status Codes

### 2xx Success

#### 200 OK

Request succeeded with data in response.

```http
GET /api/users/user-123
Authorization: Bearer <token>

HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": "user-123",
  "email": "user@example.com",
  "profile": {
    "firstName": "John"
  }
}
```

#### 201 Created

Resource created successfully.

```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

HTTP/1.1 201 Created
Content-Type: application/json
Location: /api/users/user-456

{
  "success": true,
  "userId": "user-456",
  "email": "newuser@example.com"
}
```

#### 204 No Content

Request succeeded with no response body.

```http
DELETE /api/users/user-123
Authorization: Bearer <token>

HTTP/1.1 204 No Content
```

### 4xx Client Errors

#### 400 Bad Request

Invalid request syntax or validation errors.

```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "invalid-email"
}

HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": "Validation failed",
  "message": "Request validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "email": "Invalid email format",
    "password": "Password is required"
  }
}
```

**Common causes:**
- Missing required fields
- Invalid field values
- Malformed JSON
- Type mismatches

#### 401 Unauthorized

Missing or invalid authentication.

```http
GET /api/users/user-123

HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "Unauthorized",
  "message": "No authorization header provided",
  "code": "NO_AUTH_HEADER"
}
```

**Common causes:**
- Missing Authorization header
- Invalid JWT token
- Expired token
- Token signature verification failed

**Variations:**

**Invalid Token:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token",
  "code": "INVALID_TOKEN"
}
```

**Token Expired:**
```json
{
  "error": "Unauthorized",
  "message": "Token has expired",
  "code": "TOKEN_EXPIRED"
}
```

#### 403 Forbidden

Authenticated but insufficient permissions.

```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "error": "Forbidden",
  "message": "Missing required permission: users:create",
  "code": "INSUFFICIENT_PERMISSIONS",
  "requiredPermission": "users:create"
}
```

**Common causes:**
- Missing required permissions
- Policy violation (business rule)
- Resource access denied

**Variations:**

**Policy Violation:**
```json
{
  "error": "Forbidden",
  "message": "Policy violation: Users can only update their own profile",
  "code": "POLICY_VIOLATION"
}
```

#### 404 Not Found

Resource does not exist.

```http
GET /api/users/user-999
Authorization: Bearer <token>

HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "error": "Not Found",
  "message": "User not found",
  "code": "NOT_FOUND",
  "resourceType": "User",
  "resourceId": "user-999"
}
```

**Common causes:**
- Invalid resource ID
- Resource deleted
- Incorrect URL path

#### 409 Conflict

Request conflicts with current state.

```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "existing@example.com",
  "password": "password123"
}

HTTP/1.1 409 Conflict
Content-Type: application/json

{
  "error": "Conflict",
  "message": "User with this email already exists",
  "code": "RESOURCE_CONFLICT",
  "conflictingField": "email"
}
```

**Common causes:**
- Duplicate unique field (email, username)
- Concurrent modification
- Business rule violation

#### 422 Unprocessable Entity

Semantically incorrect request.

```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "123",
  "profile": {
    "firstName": ""
  }
}

HTTP/1.1 422 Unprocessable Entity
Content-Type: application/json

{
  "error": "Validation failed",
  "message": "Input validation failed",
  "code": "VALIDATION_ERROR",
  "validationErrors": [
    {
      "field": "password",
      "message": "Password must be at least 8 characters"
    },
    {
      "field": "profile.firstName",
      "message": "First name cannot be empty"
    }
  ]
}
```

**Common causes:**
- Business rule violations
- Complex validation errors
- Invalid state transitions

#### 429 Too Many Requests

Rate limit exceeded.

```http
GET /api/users
Authorization: Bearer <token>

HTTP/1.1 429 Too Many Requests
Content-Type: application/json
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1700060400

{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "retryAfter": 300
}
```

**Headers:**
- `X-RateLimit-Limit` - Total requests allowed per window
- `X-RateLimit-Remaining` - Requests remaining in window
- `X-RateLimit-Reset` - Timestamp when window resets

### 5xx Server Errors

#### 500 Internal Server Error

Unexpected server error.

```http
GET /api/users/user-123
Authorization: Bearer <token>

HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{
  "error": "Internal Server Error",
  "message": "An unexpected error occurred",
  "code": "INTERNAL_ERROR",
  "correlationId": "abc-123-def-456"
}
```

**Common causes:**
- Unhandled exception
- Database connection failure
- Service unavailable
- Message bus error

**Never includes:**
- Stack traces
- Internal paths
- Database errors
- Sensitive information

#### 502 Bad Gateway

Upstream service error.

```http
GET /api/users/user-123
Authorization: Bearer <token>

HTTP/1.1 502 Bad Gateway
Content-Type: application/json

{
  "error": "Bad Gateway",
  "message": "Upstream service unavailable",
  "code": "SERVICE_UNAVAILABLE",
  "service": "auth-service"
}
```

**Common causes:**
- Service not responding
- Message bus timeout
- Service crashed
- Network issue

#### 503 Service Unavailable

Service temporarily unavailable.

```http
GET /api/users
Authorization: Bearer <token>

HTTP/1.1 503 Service Unavailable
Content-Type: application/json
Retry-After: 60

{
  "error": "Service Unavailable",
  "message": "Service is temporarily unavailable",
  "code": "SERVICE_UNAVAILABLE",
  "retryAfter": 60
}
```

**Common causes:**
- Maintenance mode
- Overloaded service
- Database connection pool exhausted
- Circuit breaker open

#### 504 Gateway Timeout

Upstream service timeout.

```http
GET /api/users
Authorization: Bearer <token>

HTTP/1.1 504 Gateway Timeout
Content-Type: application/json

{
  "error": "Gateway Timeout",
  "message": "Request timed out",
  "code": "TIMEOUT",
  "timeoutMs": 30000
}
```

**Common causes:**
- Long-running query
- Service not responding
- Message bus timeout
- Network latency

## Error Codes Reference

### Authentication Errors

| Code | Status | Description |
|------|--------|-------------|
| `NO_AUTH_HEADER` | 401 | Missing Authorization header |
| `INVALID_TOKEN` | 401 | Token format invalid or verification failed |
| `TOKEN_EXPIRED` | 401 | JWT token has expired |
| `INVALID_CREDENTIALS` | 401 | Email/password authentication failed |

### Authorization Errors

| Code | Status | Description |
|------|--------|-------------|
| `INSUFFICIENT_PERMISSIONS` | 403 | User lacks required permissions |
| `POLICY_VIOLATION` | 403 | Business rule policy check failed |
| `ACCESS_DENIED` | 403 | Resource access not allowed |

### Validation Errors

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400/422 | Input validation failed |
| `MISSING_REQUIRED_FIELD` | 400 | Required field not provided |
| `INVALID_FORMAT` | 400 | Field format invalid |
| `INVALID_TYPE` | 400 | Field type mismatch |

### Resource Errors

| Code | Status | Description |
|------|--------|-------------|
| `NOT_FOUND` | 404 | Resource does not exist |
| `RESOURCE_CONFLICT` | 409 | Resource already exists or conflicts |
| `RESOURCE_DELETED` | 410 | Resource was deleted |

### System Errors

| Code | Status | Description |
|------|--------|-------------|
| `INTERNAL_ERROR` | 500 | Unexpected server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |
| `TIMEOUT` | 504 | Request timeout |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |

## Troubleshooting Guide

### 401 Unauthorized

**Check:**
1. Is Authorization header present?
2. Is token format correct (`Bearer <token>`)?
3. Is token expired? (check `exp` claim)
4. Is JWT_SECRET correct?

**Fix:**
```bash
# Get new token
curl -X POST http://localhost:3003/api/auth/authenticate \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Use in request
curl -X GET http://localhost:3003/api/users/user-123 \
  -H "Authorization: Bearer <new-token>"
```

### 403 Forbidden

**Check:**
1. Does user have required permissions?
2. Check JWT token `permissions` claim
3. Review contract `@Command` or `@Query` decorator
4. Check for policy violations

**Fix:**
```bash
# Check user permissions
curl -X GET http://localhost:3003/api/users/user-123/permissions \
  -H "Authorization: Bearer <token>"

# Grant required permission
curl -X POST http://localhost:3003/api/users/user-123/permissions \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"permission":"users:create"}'
```

### 404 Not Found

**Check:**
1. Is resource ID correct?
2. Does resource exist?
3. Is URL path correct?
4. Was resource deleted?

**Fix:**
```bash
# List available resources
curl -X GET http://localhost:3003/api/users \
  -H "Authorization: Bearer <token>"

# Check specific resource
curl -X GET http://localhost:3003/api/users/user-123 \
  -H "Authorization: Bearer <token>"
```

### 409 Conflict

**Check:**
1. Is email/username unique?
2. Is there a concurrent modification?
3. Review business rules

**Fix:**
```bash
# Use different email
curl -X POST http://localhost:3003/api/users \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"email":"unique@example.com","password":"password123"}'
```

### 422 Validation Error

**Check:**
1. Review validation errors in response
2. Check required fields
3. Verify field formats
4. Review business rules

**Fix:**
```bash
# Correct validation errors
curl -X POST http://localhost:3003/api/users \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email":"valid@example.com",
    "password":"SecurePassword123!",
    "profile":{"firstName":"John","lastName":"Doe"}
  }'
```

### 500 Internal Server Error

**Check:**
1. Review server logs
2. Check `correlationId` for tracing
3. Verify service health
4. Check database connectivity

**Fix:**
```bash
# Check service health
curl -X GET http://localhost:3003/health

# Check logs
docker logs api-gateway
docker logs auth-service

# Restart services if needed
docker compose restart
```

### 503 Service Unavailable

**Check:**
1. Is service running?
2. Check service health
3. Review resource usage
4. Check message bus connectivity

**Fix:**
```bash
# Check service status
docker compose ps

# Check service health
curl -X GET http://localhost:3003/health

# Restart services
docker compose restart auth-service
```

## Best Practices

### Error Handling in Clients

```typescript
async function handleApiRequest(url: string, options: RequestInit) {
  try {
    const response = await fetch(url, options);

    // Success
    if (response.ok) {
      return await response.json();
    }

    // Parse error
    const error = await response.json();

    // Handle specific errors
    switch (response.status) {
      case 401:
        // Token expired, try refresh
        await refreshToken();
        return handleApiRequest(url, options); // Retry

      case 403:
        // Insufficient permissions
        showPermissionError(error.message);
        break;

      case 404:
        // Resource not found
        showNotFoundError(error.message);
        break;

      case 422:
        // Validation errors
        showValidationErrors(error.validationErrors);
        break;

      case 429:
        // Rate limited
        const retryAfter = error.retryAfter || 60;
        await sleep(retryAfter * 1000);
        return handleApiRequest(url, options); // Retry

      case 500:
      case 502:
      case 503:
        // Server errors - retry with backoff
        await exponentialBackoff();
        return handleApiRequest(url, options); // Retry

      default:
        showGenericError(error.message);
    }

    throw new Error(error.message);
  } catch (err) {
    // Network error or JSON parse error
    console.error('Request failed:', err);
    throw err;
  }
}
```

### Logging Errors

```typescript
function logApiError(error: any, context: Record<string, any>) {
  console.error('API Error:', {
    status: error.status,
    code: error.code,
    message: error.message,
    correlationId: error.correlationId,
    ...context
  });
}
```

### Retry Logic

```typescript
async function retryWithBackoff(
  fn: () => Promise<any>,
  maxRetries: number = 3
) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      // Don't retry client errors (4xx)
      if (error.status >= 400 && error.status < 500) {
        throw error;
      }

      // Retry server errors (5xx)
      if (i === maxRetries - 1) {
        throw error;
      }

      const delay = Math.min(1000 * 2 ** i, 10000);
      await sleep(delay);
    }
  }
}
```

## Next Steps

- **[REST API Authentication](./authentication.md)** - Authentication methods
- **[REST API Endpoints](./endpoints.md)** - Complete endpoint reference
- **[REST API Overview](./overview.md)** - REST API concepts
- **[GraphQL API](../graphql-api/overview.md)** - Alternative API option
