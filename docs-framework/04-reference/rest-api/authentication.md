---
title: REST API Authentication
description: Authentication methods, headers, and token management for REST API
category: rest-api
tags: [rest, authentication, jwt, headers, tokens]
related:
  - ../authentication.md
  - ./endpoints.md
  - ./errors.md
  - ../graphql-api/overview.md
difficulty: beginner
---

# REST API Authentication

Complete guide to authenticating REST API requests using JWT tokens and development mode.

## Overview

The REST API supports two authentication methods:

1. **Production Mode:** JWT tokens via Authorization header (default)
2. **Development Mode:** User ID and permissions via headers (local only)

## Production Authentication (JWT)

### Authorization Header

All authenticated requests require a JWT token:

```http
GET /api/users/user-123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Obtaining a Token

**Endpoint:** `POST /api/auth/authenticate`

```http
POST /api/auth/authenticate
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "user": {
    "id": "user-123",
    "email": "user@example.com",
    "permissions": ["users:read", "orders:read"]
  }
}
```

### Using the Token

Include in all subsequent requests:

```http
GET /api/users/user-123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Structure

JWT tokens contain:

```json
{
  "sub": "user-123",
  "email": "user@example.com",
  "name": "John Doe",
  "permissions": [
    "users:read",
    "users:create",
    "orders:read"
  ],
  "iat": 1700056800,
  "exp": 1700060400
}
```

**Claims:**
- `sub` - User ID (subject)
- `email` - User's email
- `name` - Display name
- `permissions` - Array of permission strings
- `iat` - Issued at timestamp
- `exp` - Expiration timestamp

## Token Refresh

### When to Refresh

- Token expires after 1 hour (3600 seconds)
- Refresh before expiration for uninterrupted access
- Use refresh token (valid for 7 days)

### Refresh Endpoint

**Endpoint:** `POST /api/auth/refresh-token`

```http
POST /api/auth/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

### Client-Side Token Management

```typescript
class ApiClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  async request(url: string, options: RequestInit = {}) {
    // Add authorization header
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json'
    };

    let response = await fetch(url, { ...options, headers });

    // Handle token expiration
    if (response.status === 401) {
      await this.refreshAccessToken();

      // Retry with new token
      headers.Authorization = `Bearer ${this.accessToken}`;
      response = await fetch(url, { ...options, headers });
    }

    return response;
  }

  private async refreshAccessToken() {
    const response = await fetch('/api/auth/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: this.refreshToken })
    });

    if (!response.ok) {
      // Refresh token expired, need to re-authenticate
      this.redirectToLogin();
      return;
    }

    const data = await response.json();
    this.accessToken = data.accessToken;
  }

  async login(email: string, password: string) {
    const response = await fetch('/api/auth/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (data.success) {
      this.accessToken = data.accessToken;
      this.refreshToken = data.refreshToken;
    }

    return data;
  }

  async logout() {
    if (this.accessToken) {
      await fetch('/api/auth/revoke-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: this.accessToken })
      });
    }

    this.accessToken = null;
    this.refreshToken = null;
  }
}
```

## Development Mode

> **CRITICAL SECURITY WARNING**
>
> Development mode (`DEVELOPMENT_AUTH_ENABLED=true`) **BYPASSES ALL AUTHENTICATION**.
>
> - ❌ NO JWT validation
> - ❌ NO token verification
> - ❌ NO permission enforcement
> - ⚠️ **Anyone can impersonate ANY user with ANY permissions**
>
> **NEVER enable in production. NEVER commit .env with this enabled.**

### Enabling Development Mode

**Environment variable:**
```bash
DEVELOPMENT_AUTH_ENABLED=true
```

### Development Headers

```http
GET /api/users/user-123
X-Dev-User-Id: dev-user-123
X-Dev-Permissions: users:read,users:create,orders:read
```

**Headers:**
- `X-Dev-User-Id` - User ID to impersonate
- `X-Dev-Permissions` - Comma-separated list of permissions

### Example Request

```http
POST /api/users
X-Dev-User-Id: dev-admin
X-Dev-Permissions: users:create,users:read,admin:all
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "profile": {
    "firstName": "Test",
    "lastName": "User"
  }
}
```

### JavaScript Example

```javascript
const response = await fetch('http://localhost:3003/api/users', {
  method: 'POST',
  headers: {
    'X-Dev-User-Id': 'dev-admin',
    'X-Dev-Permissions': 'users:create,users:read',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'newuser@example.com',
    password: 'password123',
    profile: {
      firstName: 'Test',
      lastName: 'User'
    }
  })
});

const data = await response.json();
console.log(data);
```

## HTTP Headers Reference

### Required Headers

#### Production

```http
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

#### Development

```http
X-Dev-User-Id: <user-id>
X-Dev-Permissions: <comma-separated-permissions>
Content-Type: application/json
```

### Optional Headers

```http
X-Correlation-Id: <custom-trace-id>
Accept: application/json
Accept-Language: en-US
```

### Response Headers

The API Gateway includes these headers in responses:

```http
X-Correlation-Id: abc-123-def-456
X-Request-Id: req-789-ghi-012
Content-Type: application/json
Access-Control-Allow-Origin: *
```

## CORS Configuration

The API Gateway automatically handles CORS:

```http
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type, X-Dev-User-Id, X-Dev-Permissions
Access-Control-Max-Age: 86400
```

### Preflight Requests

```http
OPTIONS /api/users
Access-Control-Request-Method: POST
Access-Control-Request-Headers: Authorization, Content-Type
```

**Response:**
```http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type, X-Dev-User-Id, X-Dev-Permissions
Access-Control-Max-Age: 86400
```

## Error Responses

### Invalid Token

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "Unauthorized",
  "message": "Invalid or expired token",
  "code": "INVALID_TOKEN"
}
```

### Token Expired

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "Unauthorized",
  "message": "Token has expired",
  "code": "TOKEN_EXPIRED"
}
```

### Missing Permission

```http
HTTP/1.1 403 Forbidden
Content-Type: application/json

{
  "error": "Forbidden",
  "message": "Missing required permission: users:create",
  "code": "INSUFFICIENT_PERMISSIONS",
  "requiredPermission": "users:create"
}
```

### Missing Header

```http
HTTP/1.1 401 Unauthorized
Content-Type: application/json

{
  "error": "Unauthorized",
  "message": "No authorization header provided",
  "code": "NO_AUTH_HEADER"
}
```

## Security Best Practices

### Token Storage

✅ **DO:**
- Store tokens in httpOnly cookies (server-side)
- Use secure session storage
- Clear tokens on logout

❌ **DON'T:**
- Store tokens in localStorage (XSS risk)
- Store tokens in sessionStorage (XSS risk)
- Log tokens in console or logs

### Token Transmission

✅ **DO:**
- Use HTTPS in production
- Use WSS for WebSocket connections
- Rotate JWT secrets periodically

❌ **DON'T:**
- Use HTTP in production
- Share tokens across domains
- Transmit tokens in URLs

### Development Mode

✅ **DO:**
- Use for local development only
- Document required permissions
- Disable before deployment

❌ **DON'T:**
- Enable in production
- Commit DEVELOPMENT_AUTH_ENABLED=true
- Use in CI/CD pipelines
- Skip security testing

## Next Steps

- **[REST API Endpoints](./endpoints.md)** - Complete endpoint reference
- **[REST API Errors](./errors.md)** - HTTP status codes and error handling
- **[Authentication Reference](../authentication.md)** - Complete auth guide
- **[GraphQL API](../graphql-api/overview.md)** - Alternative API option
