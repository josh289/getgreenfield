---
title: REST API Overview
description: Understanding auto-generated RESTful endpoints from service contracts
category: rest-api
tags: [rest, api, http, endpoints, auto-generation]
related:
  - ./endpoints.md
  - ./examples.md
  - ../graphql-api/overview.md
  - ../../03-guides/api-integration/rest-api.md
difficulty: beginner
---

# REST API Overview

The Banyan Platform automatically generates RESTful HTTP endpoints for all service commands and queries without any additional code or configuration.

## Key Concepts

### Automatic Endpoint Generation

Every command and query contract automatically creates a REST endpoint with proper HTTP semantics:

- **Commands** generate POST endpoints (state-changing operations)
- **Queries** generate GET endpoints (read-only operations)
- **URLs** follow RESTful resource patterns
- **Authentication** handled automatically via JWT tokens
- **Validation** enforced from contract definitions

### Zero Configuration Required

No manual routing, controller classes, or HTTP-specific code needed. The API Gateway:

1. Discovers all service contracts via service discovery
2. Generates appropriate HTTP endpoints automatically
3. Translates HTTP requests to message bus commands/queries
4. Returns responses in standard JSON format
5. Handles errors with proper HTTP status codes

## RESTful Patterns

### Command → POST Endpoints

Commands represent state-changing operations and always use POST:

```typescript
@Command({
  description: 'Create a new user account',
  permissions: ['users:create']
})
export class CreateUserCommand {
  email!: string;
  firstName!: string;
  lastName?: string;
}
```

**Generates:**
```http
POST /api/users
Content-Type: application/json
Authorization: Bearer <token>

{
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Query → GET Endpoints

Queries represent read operations and use GET with URL parameters:

```typescript
@Query({
  description: 'Retrieve user by ID',
  permissions: ['users:read']
})
export class GetUserQuery {
  userId!: string;
}
```

**Generates:**
```http
GET /api/users/:userId
Authorization: Bearer <token>
```

Or with query parameters:

```http
GET /api/users?userId=user-123
Authorization: Bearer <token>
```

## Base URL

All API endpoints are served from the API Gateway:

```
Development: http://localhost:3003
Production:  https://api.your-domain.com
```

All endpoints are prefixed with `/api/`:
- `POST /api/users` - Create user
- `GET /api/users/:userId` - Get user
- `PUT /api/users/:userId` - Update user

## HTTP Methods

The platform maps commands and queries to appropriate HTTP methods:

| Operation | HTTP Method | Idempotent | Cacheable |
|-----------|-------------|------------|-----------|
| Create | POST | No | No |
| Read | GET | Yes | Yes |
| Update | PUT | Yes | No |
| Delete | DELETE | Yes | No |
| List | GET | Yes | Yes |

## Request/Response Format

### Request Format

All requests use JSON:

```http
POST /api/users
Content-Type: application/json
Authorization: Bearer <token>

{
  "email": "user@example.com",
  "firstName": "John"
}
```

### Response Format

All responses return JSON:

```json
{
  "userId": "user-123",
  "email": "user@example.com",
  "firstName": "John",
  "createdAt": "2025-11-15T12:00:00Z"
}
```

### Error Format

Errors follow a consistent structure:

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "email": "Invalid email format"
  }
}
```

## Authentication

All requests require authentication via JWT tokens (except public endpoints):

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

See [Authentication Reference](../authentication.md) for details.

### Development Mode

For local development only:

```http
X-Dev-User-Id: dev-user-123
X-Dev-Permissions: users:create,users:read
```

> **WARNING**: Development mode bypasses all authentication. Never use in production.

## HTTP Headers

### Required Headers

```http
Content-Type: application/json        # For POST/PUT requests
Authorization: Bearer <token>         # Production authentication
```

### Optional Headers

```http
X-Correlation-Id: custom-trace-id    # For distributed tracing
Accept: application/json              # Response format preference
```

### Response Headers

The API Gateway includes helpful headers in responses:

```http
X-Correlation-Id: abc-123-def        # Request correlation ID
X-Request-Id: req-456-ghi            # Unique request ID
Content-Type: application/json
```

## CORS Configuration

CORS is automatically configured for browser clients:

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type, X-Dev-User-Id, X-Dev-Permissions
Access-Control-Max-Age: 86400
```

## Rate Limiting

When rate limiting is configured, responses include headers:

```http
X-RateLimit-Limit: 1000             # Requests allowed per window
X-RateLimit-Remaining: 999          # Remaining requests
X-RateLimit-Reset: 1700056800       # Window reset timestamp
```

## Next Steps

- **[Endpoint Catalog](./endpoints.md)** - Complete list of available endpoints
- **[API Examples](./examples.md)** - Working code examples in multiple languages
- **[GraphQL Alternative](../graphql-api/overview.md)** - Query language option
- **[WebSocket API](../websocket-api/overview.md)** - Real-time events
