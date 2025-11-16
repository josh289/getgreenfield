---
title: Authentication and Authorization
description: Complete reference for JWT authentication and two-layer authorization
category: authentication
tags: [authentication, authorization, jwt, permissions, security, policies]
related:
  - ./rest-api/overview.md
  - ./graphql-api/overview.md
  - ./websocket-api/overview.md
  - ../02-concepts/architecture/authorization.md
difficulty: intermediate
---

# Authentication and Authorization

Complete reference for authentication and authorization in the Banyan Platform.

## Overview

The platform implements a comprehensive two-layer security model:

1. **Layer 1: Permission-Based** (API Gateway) - Who can call what
2. **Layer 2: Policy-Based** (Service Handlers) - Business rule enforcement

## JWT Token Structure

### Token Claims

```json
{
  "sub": "user-123",
  "email": "user@example.com",
  "name": "John Doe",
  "permissions": [
    "users:create",
    "users:read",
    "users:update",
    "orders:read"
  ],
  "iat": 1700056800,
  "exp": 1700060400
}
```

### Required Claims

| Claim | Type | Description |
|-------|------|-------------|
| `sub` | `string` | User ID (subject) |
| `email` | `string` | User's email address |
| `name` | `string` | User's display name |
| `permissions` | `string[]` | Array of permission strings |
| `exp` | `number` | Token expiration timestamp |

### Token Generation

```typescript
import * as jwt from 'jsonwebtoken';

const token = jwt.sign(
  {
    sub: user.userId,
    email: user.email,
    name: user.name,
    permissions: user.permissions,
  },
  process.env.JWT_SECRET,
  {
    expiresIn: '1h',
    algorithm: 'HS256'
  }
);
```

**Configuration:**
- Algorithm: HS256 (HMAC with SHA-256)
- Secret: Must match `JWT_SECRET` environment variable
- Expiration: Typically 1 hour
- Subject: User ID for identification

### Token Validation

The platform automatically validates:
- ✅ Signature using `JWT_SECRET`
- ✅ Expiration time
- ✅ Required claims presence
- ✅ Token format and structure

**Invalid tokens result in:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or expired token",
  "code": "INVALID_TOKEN"
}
```

## Permission Model

### Permission Format

**Structure:** `resource:action`

**Examples:**
```
users:create        # Create users
users:read          # Read user data
users:update        # Update users
users:delete        # Delete users
orders:read         # Read orders
orders:approve      # Approve orders
admin:all           # All admin permissions
```

### Permission Strings

```typescript
// Resource-based permissions
'users:create'
'users:read'
'users:update'
'users:delete'

// Action-specific permissions
'orders:approve'
'orders:cancel'
'orders:refund'

// Administrative permissions
'admin:all'
'admin:users'
'admin:reports'

// Read-only permissions
'reports:read'
'analytics:read'
```

### Declaring Required Permissions

In command/query contracts:

```typescript
import { Command } from '@banyanai/platform-contract-system';

@Command({
  description: 'Create a new user account',
  permissions: ['users:create']
})
export class CreateUserCommand {
  email!: string;
  name!: string;
}
```

Multiple permissions (OR logic):

```typescript
@Command({
  description: 'Update any user account (admin)',
  permissions: ['users:update', 'admin:all']
})
export class UpdateAnyUserCommand {
  // User needs EITHER users:update OR admin:all
}
```

## Two-Layer Authorization

### Layer 1: Permission-Based (API Gateway)

**When:** Before message creation
**Where:** API Gateway
**What:** Validates user has required permissions

```typescript
@Command({
  permissions: ['users:update']
})
export class UpdateUserCommand {
  userId!: string;
  name!: string;
}
```

**API Gateway checks:**
1. Extract permissions from JWT token
2. Compare with `permissions` in contract
3. Reject request if permissions missing
4. Create message if permissions match

**Failure response:**
```json
{
  "error": "Unauthorized",
  "message": "Missing required permission: users:update",
  "code": "INSUFFICIENT_PERMISSIONS"
}
```

### Layer 2: Policy-Based (Service Handler)

**When:** After message received
**Where:** Service handler
**What:** Validates business rules

```typescript
// Policy class (co-located with handler)
export class UpdateOwnProfilePolicy {
  static canExecute(user: AuthenticatedUser, command: UpdateUserCommand): boolean {
    // Users can only update their own profile (unless admin)
    return user.permissions.includes('admin:all') ||
           user.userId === command.userId;
  }
}

// Handler with policy
@CommandHandler(UpdateUserCommand)
@RequiresPermissions('users:update')
@RequirePolicy('UpdateOwnProfilePolicy')
export class UpdateUserHandler {
  async handle(command: UpdateUserCommand, context: CommandContext): Promise<UserDto> {
    // Policy already validated - safe to proceed
  }
}
```

**Failure response:**
```json
{
  "error": "Unauthorized",
  "message": "Policy violation: User cannot update another user's profile",
  "code": "POLICY_VIOLATION"
}
```

## Authentication Modes

### Production Mode (JWT Tokens)

**Default mode for production environments:**

```http
Authorization: Bearer <jwt-token>
```

**JWT token contains:**
- User ID (subject claim)
- Email address
- Display name
- Permissions array
- Expiration time

### Development Mode

> **CRITICAL SECURITY WARNING**
>
> Development mode (`DEVELOPMENT_AUTH_ENABLED=true`) **BYPASSES ALL AUTHENTICATION AND AUTHORIZATION**.
>
> - ❌ NO JWT validation
> - ❌ NO token verification
> - ❌ NO permission enforcement
> - ❌ NO security checks of any kind
> - ⚠️ **Anyone can impersonate ANY user with ANY permissions**
>
> **NEVER enable in production. NEVER commit `.env` with this enabled.**

**For local development only:**

```bash
# Set user identity and permissions via headers
X-Dev-User-Id: user-123
X-Dev-Permissions: users:create,users:read,orders:create
```

**Development mode behavior:**
- Bypasses all JWT validation
- Accepts any user ID from headers
- Grants any permissions from headers
- Should ONLY be used on localhost
- Must be explicitly enabled via environment variable

**Production Security Checklist:**
- ✅ NEVER set `DEVELOPMENT_AUTH_ENABLED=true` in production
- ✅ NEVER commit this setting to version control
- ✅ Set up CI/CD checks to block dev mode deployment
- ✅ Use environment-specific configuration
- ✅ Audit logs to detect unauthorized dev mode usage

## Authentication Flow

### Production Flow (JWT)

```
1. Client obtains JWT token from auth service
   └─> Token contains: userId, email, name, permissions

2. Client includes token in request
   └─> Authorization: Bearer <token>

3. API Gateway extracts token
   └─> Validates signature and expiration

4. Gateway extracts permissions from token
   └─> permissions: ['users:create', 'users:read']

5. Gateway validates against contract
   └─> requiredPermissions: ['users:create']
   └─> Check: Does user have 'users:create'? Yes ✓

6. Gateway creates authenticated message
   └─> Embeds auth context in message metadata

7. Message sent to service via RabbitMQ
   └─> Service receives message with auth context

8. Service handler evaluates policy (if present)
   └─> @RequirePolicy checks business rules

9. Handler executes business logic
   └─> Returns result to gateway

10. Gateway returns HTTP response
    └─> 200 OK with result data
```

### Development Flow (Headers)

```
1. Client sends request with dev headers
   └─> X-Dev-User-Id: user-123
   └─> X-Dev-Permissions: users:create,users:read

2. Gateway checks DEVELOPMENT_AUTH_ENABLED
   └─> Must be explicitly enabled

3. Gateway extracts user from headers
   └─> Creates mock AuthenticatedUser

4. Gateway validates permissions
   └─> Same as production flow

5. Message created and sent to service
   └─> Same as production flow

6. Handler executes with mock user
   └─> Same as production flow
```

## Token Refresh Patterns

### Short-Lived Access Tokens

**Recommended pattern:**

```typescript
// Access token: 1 hour
const accessToken = jwt.sign(payload, secret, { expiresIn: '1h' });

// Refresh token: 7 days
const refreshToken = jwt.sign({ sub: user.userId }, secret, { expiresIn: '7d' });
```

### Refresh Token Endpoint

```http
POST /api/refresh-token
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600
}
```

### Client-Side Token Management

```typescript
class AuthService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  async request(url: string, options: RequestInit) {
    // Add current access token
    const headers = {
      ...options.headers,
      Authorization: `Bearer ${this.accessToken}`
    };

    let response = await fetch(url, { ...options, headers });

    // If token expired, refresh and retry
    if (response.status === 401) {
      await this.refreshAccessToken();

      headers.Authorization = `Bearer ${this.accessToken}`;
      response = await fetch(url, { ...options, headers });
    }

    return response;
  }

  private async refreshAccessToken() {
    const response = await fetch('/api/refresh-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: this.refreshToken })
    });

    const data = await response.json();
    this.accessToken = data.accessToken;
  }
}
```

## Common Patterns

### Public Endpoints

Endpoints with no authentication:

```typescript
@Query({
  description: 'Health check endpoint',
  permissions: []  // No permissions required
})
export class GetHealthQuery {}
```

### Admin-Only Endpoints

```typescript
@Command({
  description: 'Permanently delete user account',
  permissions: ['admin:all']
})
export class DeleteUserCommand {
  userId!: string;
}
```

### Self-Service Endpoints

```typescript
@Command({
  description: 'Update own profile',
  permissions: ['users:update']
})
export class UpdateOwnProfileCommand {
  userId!: string;
  name!: string;
}

// Policy ensures users can only update their own profile
export class UpdateOwnProfilePolicy {
  static canExecute(user: AuthenticatedUser, command: UpdateOwnProfileCommand): boolean {
    return user.userId === command.userId;
  }
}
```

## Security Best Practices

### Token Security

✅ **DO:**
- Use HTTPS in production (wss:// for WebSocket)
- Set short expiration times (1 hour)
- Use refresh tokens for session management
- Rotate JWT secrets periodically
- Store tokens securely (httpOnly cookies)

❌ **DON'T:**
- Use HTTP in production
- Set long expiration times (> 24 hours)
- Store tokens in localStorage (XSS risk)
- Share JWT secrets across environments
- Log JWT tokens

### Permission Management

✅ **DO:**
- Use specific permissions (`users:create`)
- Follow resource:action naming convention
- Grant minimal required permissions
- Validate permissions at both layers
- Log permission violations

❌ **DON'T:**
- Use broad permissions (`admin:all` for everyone)
- Use inconsistent naming patterns
- Grant permissions without review
- Skip permission checks
- Ignore authorization logs

### Development Mode

✅ **DO:**
- Use development mode for local testing
- Document required permissions
- Test with minimal permissions
- Disable before deployment

❌ **DON'T:**
- Enable in production
- Skip permission testing
- Use development mode in CI/CD
- Commit DEVELOPMENT_AUTH_ENABLED=true

## Error Handling

### Invalid Token Signature

```
Check: Is JWT_SECRET correct?
Check: Was token generated with same secret?
Check: Is token format correct?
Fix: Ensure JWT_SECRET matches between auth service and gateway
```

### Token Expired

```
Check: Is token expiration time appropriate?
Check: Are server clocks synchronized?
Fix: Implement token refresh flow
Fix: Use refresh tokens for session management
```

### Missing Permission

```
Check: Is permission string correct?
Check: Does user have permission in JWT?
Check: Is permissions in contract correct?
Fix: Grant permission to user
Fix: Update contract permissions
```

### Development Mode Not Working

```
Check: Is DEVELOPMENT_AUTH_ENABLED=true?
Check: Are headers correctly formatted?
Check: Is X-Dev-Permissions comma-separated?
Fix: Set environment variable
Fix: Use correct header names (X-Dev-User-Id, X-Dev-Permissions)
```

## Next Steps

- **[REST API](./rest-api/overview.md)** - HTTP API authentication
- **[GraphQL API](./graphql-api/overview.md)** - GraphQL authentication
- **[WebSocket API](./websocket-api/overview.md)** - WebSocket authentication
- **[Authorization Architecture](../02-concepts/architecture/authorization.md)** - Deep dive on two-layer model
