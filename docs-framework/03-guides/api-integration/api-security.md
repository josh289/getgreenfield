# API Security Guide

## Overview

The API Gateway provides two-layer security for all external APIs:

1. **Layer 1: Permission-based at API Gateway** - Who can call what
2. **Layer 2: Policy-based at service handlers** - Business rule enforcement

## Authentication

### JWT Bearer Tokens

All API requests (except public endpoints) require JWT authentication:

```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  http://localhost:3003/api/users
```

### JWT Token Structure

```json
{
  "sub": "usr_1234567890",
  "email": "alice@example.com",
  "name": "Alice Smith",
  "permissions": ["users:read", "users:create", "orders:read"],
  "iat": 1700000000,
  "exp": 1700003600
}
```

**Required Claims**:
- `sub` - User ID
- `email` - User email
- `name` - User display name
- `permissions` - Array of permission strings
- `exp` - Token expiration (Unix timestamp)

### Obtaining JWT Tokens

#### Login Endpoint

```bash
POST http://localhost:3003/api/auth/login
Content-Type: application/json

{
  "email": "alice@example.com",
  "password": "SecurePassword123"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": 3600,
  "user": {
    "id": "usr_1234567890",
    "email": "alice@example.com",
    "name": "Alice Smith"
  }
}
```

#### External Auth (Auth0)

The platform supports Auth0 integration:

```typescript
// Environment configuration
AUTH0_DOMAIN=your-tenant.us.auth0.com
AUTH0_AUDIENCE=https://api.your-service.com
AUTH0_ISSUER=https://your-tenant.us.auth0.com/
```

Use Auth0 SDK to obtain tokens, then pass to API Gateway.

## Authorization

### Permission-Based (Layer 1)

Enforced at the API Gateway before messages reach services.

#### Defining Required Permissions

```typescript
export const CreateUserContract = createContract({
  messageType: 'CreateUserCommand',
  targetService: 'user-service',
  requiredPermissions: ['users:create'], // ← Required permission
  // ...
});
```

#### Permission Check Flow

1. Client sends request with JWT token
2. API Gateway validates JWT signature
3. Gateway extracts `permissions` claim
4. Gateway checks if user has ALL required permissions
5. If yes → route to service, if no → 403 Forbidden

#### Permission Naming

Use resource:action pattern:

```
users:read        - Read user data
users:create      - Create new users
users:update      - Update existing users
users:delete      - Delete users
users:admin       - Full user management

orders:read       - View orders
orders:process    - Process orders
orders:cancel     - Cancel orders

reports:generate  - Generate reports
reports:export    - Export report data
```

### Policy-Based (Layer 2)

Enforced in service handlers for business rules.

#### Example: Resource Ownership

```typescript
@QueryHandler(GetUserContract)
export class GetUserHandler {
  async handle(input: { id: string }, context: MessageContext) {
    const requestingUserId = context.userId;
    const targetUserId = input.id;

    // Policy: Users can only read their own data (unless admin)
    if (requestingUserId !== targetUserId &&
        !context.permissions.includes('users:admin')) {
      throw new UnauthorizedError(
        'You can only access your own user data'
      );
    }

    return await this.userRepository.findById(targetUserId);
  }
}
```

#### Example: Time-Based Access

```typescript
@CommandHandler(ProcessOrderContract)
export class ProcessOrderHandler {
  async handle(input: { orderId: string }, context: MessageContext) {
    const order = await this.orderRepository.findById(input.orderId);

    // Policy: Orders can only be processed during business hours
    const now = new Date();
    const hour = now.getHours();
    if (hour < 9 || hour >= 17) {
      throw new BusinessRuleError(
        'Orders can only be processed between 9 AM and 5 PM'
      );
    }

    // Process order...
  }
}
```

## Rate Limiting

### Default Limits

The API Gateway enforces per-user rate limits:

| User Type | Limit | Window |
|-----------|-------|--------|
| Authenticated | 100 requests | 1 minute |
| Anonymous | 10 requests | 1 minute |

### Rate Limit Headers

Responses include rate limit information:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1700000060
```

### Rate Limit Exceeded

When limit is exceeded, API returns:

```http
HTTP/1.1 429 Too Many Requests
Retry-After: 30

{
  "error": "TooManyRequests",
  "message": "Rate limit exceeded. Try again in 30 seconds.",
  "correlationId": "cor_abc123xyz",
  "retryAfter": 30
}
```

### Custom Rate Limits

Configure per-contract limits:

```typescript
export const BulkImportContract = createContract({
  messageType: 'BulkImportCommand',
  targetService: 'import-service',
  metadata: {
    rateLimit: {
      requests: 10,
      window: 3600 // 10 requests per hour
    }
  },
  // ...
});
```

## Public Endpoints

### Defining Public Contracts

Endpoints accessible without authentication:

```typescript
export const RegisterUserContract = createContract({
  messageType: 'RegisterUserCommand',
  targetService: 'auth-service',
  isPublic: true, // ← No authentication required
  requiredPermissions: [], // Must be empty for public
  inputSchema: {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' },
      password: { type: 'string', minLength: 8 },
      name: { type: 'string' }
    },
    required: ['email', 'password', 'name']
  },
  // ...
});
```

### Public Endpoint Examples

```bash
# User registration (public)
POST http://localhost:3003/api/auth/register

# Login (public)
POST http://localhost:3003/api/auth/login

# Password reset (public)
POST http://localhost:3003/api/auth/reset-password

# Public data query (public)
GET http://localhost:3003/api/products
```

## CORS Configuration

### Default CORS Policy

The API Gateway allows cross-origin requests:

```typescript
{
  origin: '*',  // Allow all origins (configure for production)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours
}
```

### Preflight Requests

Browser automatically sends OPTIONS request:

```http
OPTIONS http://localhost:3003/api/users
Origin: http://localhost:3000
Access-Control-Request-Method: POST
Access-Control-Request-Headers: Authorization, Content-Type
```

Response:
```http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: POST, GET, PUT, DELETE
Access-Control-Allow-Headers: Authorization, Content-Type
Access-Control-Max-Age: 86400
```

## Security Best Practices

### 1. Use Strong Permissions

```typescript
// Good: Granular permissions
requiredPermissions: ['users:create']
requiredPermissions: ['orders:process']

// Avoid: Overly broad
requiredPermissions: ['admin']
requiredPermissions: []
```

### 2. Validate Input Thoroughly

```typescript
inputSchema: {
  type: 'object',
  properties: {
    email: {
      type: 'string',
      format: 'email',
      maxLength: 255 // Prevent abuse
    },
    password: {
      type: 'string',
      minLength: 8,
      maxLength: 100,
      pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*$'
    }
  },
  required: ['email', 'password']
}
```

### 3. Implement Business Policies

```typescript
@CommandHandler(DeleteUserContract)
export class DeleteUserHandler {
  async handle(input: { id: string }, context: MessageContext) {
    // Policy: Cannot delete yourself
    if (input.id === context.userId) {
      throw new BusinessRuleError('Cannot delete your own account');
    }

    // Policy: Only admins can delete users
    if (!context.permissions.includes('users:admin')) {
      throw new UnauthorizedError('Admin permission required');
    }

    await this.userRepository.delete(input.id);
  }
}
```

### 4. Protect Sensitive Data

```typescript
outputSchema: {
  type: 'object',
  properties: {
    id: { type: 'string' },
    email: { type: 'string' },
    name: { type: 'string' },
    // DON'T include password hash, tokens, etc.
  }
}
```

### 5. Use Short Token Expiration

```typescript
// Environment configuration
JWT_EXPIRATION=300  // 5 minutes (adjust as needed)
```

Implement token refresh for better UX:
```bash
POST http://localhost:3003/api/auth/refresh
```

## Error Responses

### 401 Unauthorized

Missing or invalid authentication:

```json
{
  "error": "Unauthorized",
  "message": "Missing or invalid authentication token",
  "correlationId": "cor_abc123xyz",
  "timestamp": "2025-11-15T10:30:00Z"
}
```

### 403 Forbidden

Insufficient permissions:

```json
{
  "error": "Forbidden",
  "message": "Missing required permission: users:create",
  "correlationId": "cor_abc123xyz",
  "timestamp": "2025-11-15T10:30:00Z",
  "requiredPermissions": ["users:create"],
  "userPermissions": ["users:read"]
}
```

### 429 Too Many Requests

Rate limit exceeded:

```json
{
  "error": "TooManyRequests",
  "message": "Rate limit exceeded. Try again in 30 seconds.",
  "correlationId": "cor_abc123xyz",
  "retryAfter": 30,
  "limit": 100,
  "window": 60
}
```

## Message Context

Handlers receive authentication context automatically:

```typescript
interface MessageContext {
  userId: string;            // Authenticated user ID
  email: string;             // User email
  name: string;              // User name
  permissions: string[];     // User permissions
  correlationId: string;     // Request correlation ID
  timestamp: Date;           // Request timestamp
}
```

Usage in handlers:

```typescript
@CommandHandler(CreateOrderContract)
export class CreateOrderHandler {
  async handle(input: { productId: string }, context: MessageContext) {
    // Access authenticated user
    const userId = context.userId;
    const userEmail = context.email;

    // Check permissions programmatically
    if (!context.permissions.includes('orders:create')) {
      throw new UnauthorizedError('Permission denied');
    }

    // Create order for authenticated user
    return await this.orderRepository.create({
      userId,
      productId: input.productId,
      createdBy: userEmail
    });
  }
}
```

## Development Mode

### Bypass Authentication (Development Only)

```typescript
// Environment configuration
DEVELOPMENT_AUTH_ENABLED=true
```

**WARNING**: Never enable in production!

When enabled, requests without auth are allowed with default permissions.

## Troubleshooting

### "Missing or invalid authentication token"

**Cause**: No Authorization header or invalid JWT

**Solution**:
```bash
curl -H "Authorization: Bearer YOUR_VALID_JWT" \
  http://localhost:3003/api/users
```

### "Missing required permission: users:create"

**Cause**: User JWT lacks required permission

**Solution**: Ensure user has permission granted in auth system

### "Rate limit exceeded"

**Cause**: Too many requests in time window

**Solution**: Wait for `retryAfter` seconds or reduce request rate

### "CORS policy blocked"

**Cause**: Browser blocking cross-origin request

**Solution**: Configure CORS in API Gateway or use proxy in development

## Next Steps

- [API Contracts](./api-contracts.md) - Defining secure contracts
- [REST API Guide](./rest-api.md) - Building RESTful endpoints
- [GraphQL API Guide](./graphql-api.md) - Creating GraphQL schemas
