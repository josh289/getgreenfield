# REST API Guide

## Overview

The API Gateway automatically generates RESTful HTTP endpoints from your service contracts. Services never handle HTTP - they define contracts, and REST endpoints are created automatically.

## Auto-Generated Endpoints

### URL Pattern

The API Gateway generates RESTful URLs following standard conventions:

```
POST   /api/users           → CreateUserCommand
GET    /api/users/:id       → GetUserQuery
PUT    /api/users/:id       → UpdateUserCommand
DELETE /api/users/:id       → DeleteUserCommand
GET    /api/users           → ListUsersQuery
```

**Key Pattern**: Resource names are derived from contract message types:
- `CreateUserCommand` → `/api/users`
- `GetOrderQuery` → `/api/orders/:id`
- `ListProductsQuery` → `/api/products`

### HTTP Method Mapping

| Contract Type | HTTP Method | Example |
|--------------|-------------|---------|
| Create*Command | POST | POST /api/users |
| Update*Command | PUT | PUT /api/users/:id |
| Delete*Command | DELETE | DELETE /api/users/:id |
| Get*Query | GET | GET /api/users/:id |
| List*Query | GET | GET /api/users |
| *Command | POST | POST /api/actions |
| *Query | GET | GET /api/data |

## Creating REST Endpoints

### 1. Define a Contract

Create a contract in your service:

```typescript
// contracts/CreateUserContract.ts
import { createContract } from '@banyanai/platform-contract-system';

export const CreateUserContract = createContract({
  messageType: 'CreateUserCommand',
  targetService: 'user-service',
  inputSchema: {
    type: 'object',
    properties: {
      email: { type: 'string', format: 'email' },
      name: { type: 'string' },
      role: { type: 'string', enum: ['user', 'admin'] }
    },
    required: ['email', 'name']
  },
  outputSchema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      email: { type: 'string' },
      name: { type: 'string' },
      role: { type: 'string' },
      createdAt: { type: 'string', format: 'date-time' }
    },
    required: ['id', 'email', 'name', 'role', 'createdAt']
  },
  requiredPermissions: ['users:create']
});
```

### 2. Implement the Handler

Write only business logic:

```typescript
// commands/CreateUserHandler.ts
import { CommandHandler } from '@banyanai/platform-cqrs';
import { CreateUserContract } from '../contracts/CreateUserContract.js';

@CommandHandler(CreateUserContract)
export class CreateUserHandler {
  async handle(input: { email: string; name: string; role?: string }) {
    // Pure business logic - no HTTP code
    const user = await this.userRepository.create({
      email: input.email,
      name: input.name,
      role: input.role || 'user'
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt
    };
  }
}
```

### 3. Endpoint Generated Automatically

The API Gateway creates:

```bash
POST http://localhost:3003/api/users
```

## Making REST API Calls

### POST Request (Commands)

```bash
curl -X POST http://localhost:3003/api/users \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "name": "Alice Smith",
    "role": "user"
  }'
```

Response:
```json
{
  "id": "usr_1234567890",
  "email": "alice@example.com",
  "name": "Alice Smith",
  "role": "user",
  "createdAt": "2025-11-15T10:30:00Z"
}
```

### GET Request (Queries)

```bash
# Get single resource
curl -X GET http://localhost:3003/api/users/usr_1234567890 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# List resources
curl -X GET http://localhost:3003/api/users?limit=10&offset=0 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### PUT Request (Updates)

```bash
curl -X PUT http://localhost:3003/api/users/usr_1234567890 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "role": "admin"
  }'
```

### DELETE Request

```bash
curl -X DELETE http://localhost:3003/api/users/usr_1234567890 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Path Parameters

For queries with IDs, the API Gateway automatically extracts path parameters:

```typescript
// GetUserQuery contract
export const GetUserContract = createContract({
  messageType: 'GetUserQuery',
  targetService: 'user-service',
  inputSchema: {
    type: 'object',
    properties: {
      id: { type: 'string' }
    },
    required: ['id']
  },
  outputSchema: { /* user object */ }
});
```

Generated endpoint:
```
GET /api/users/:id
```

The `id` parameter is extracted and passed to the handler:
```bash
curl http://localhost:3003/api/users/usr_123
# Handler receives: { id: "usr_123" }
```

## Query Parameters

For list endpoints, query parameters are passed to handlers:

```bash
GET /api/users?limit=10&offset=0&role=admin
# Handler receives: { limit: 10, offset: 0, role: "admin" }
```

## Response Codes

The API Gateway automatically maps responses to HTTP status codes:

| Scenario | Status Code | Description |
|----------|-------------|-------------|
| Success (Command) | 201 Created | Resource created |
| Success (Query) | 200 OK | Data retrieved |
| Success (Update) | 200 OK | Resource updated |
| Success (Delete) | 204 No Content | Resource deleted |
| Validation Error | 400 Bad Request | Invalid input |
| Unauthorized | 401 Unauthorized | Missing/invalid auth |
| Forbidden | 403 Forbidden | Insufficient permissions |
| Not Found | 404 Not Found | Resource doesn't exist |
| Server Error | 500 Internal Server Error | Handler exception |

## Error Responses

Errors are returned in a standard format:

```json
{
  "error": "ValidationError",
  "message": "Invalid email format",
  "correlationId": "cor_abc123xyz",
  "timestamp": "2025-11-15T10:30:00Z",
  "details": {
    "field": "email",
    "constraint": "format"
  }
}
```

## CORS Configuration

The API Gateway enables CORS by default:

```typescript
// Configured in API Gateway
{
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}
```

## OpenAPI Documentation

The API Gateway generates OpenAPI/Swagger documentation automatically:

```bash
# Access Swagger UI
http://localhost:3003/api-docs

# Download OpenAPI spec
http://localhost:3003/api-docs/openapi.json
```

## Best Practices

### 1. Use Resource-Oriented Contracts

```typescript
// Good: Resource-oriented
CreateUserCommand → POST /api/users
GetUserQuery → GET /api/users/:id

// Avoid: Action-oriented (still works but less RESTful)
RegisterUserCommand → POST /api/register-user
```

### 2. Include Proper Validation

```typescript
inputSchema: {
  type: 'object',
  properties: {
    email: {
      type: 'string',
      format: 'email',
      maxLength: 255
    },
    age: {
      type: 'number',
      minimum: 0,
      maximum: 150
    }
  },
  required: ['email']
}
```

### 3. Set Appropriate Permissions

```typescript
export const CreateUserContract = createContract({
  messageType: 'CreateUserCommand',
  targetService: 'user-service',
  requiredPermissions: ['users:create'], // ← Enforce permissions
  // ...
});
```

### 4. Document Your Schemas

```typescript
inputSchema: {
  type: 'object',
  properties: {
    email: {
      type: 'string',
      format: 'email',
      description: 'User email address for authentication'
    },
    name: {
      type: 'string',
      description: 'Full name of the user'
    }
  }
}
```

## Troubleshooting

### Endpoint Not Found (404)

**Cause**: Service not registered or contract not discovered

**Solution**: Check contract cache:
```bash
curl http://localhost:3003/debug/contracts
```

Verify your service is running and contracts are broadcast.

### Unauthorized (401)

**Cause**: Missing or invalid JWT token

**Solution**: Include valid Bearer token:
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  http://localhost:3003/api/users
```

### Forbidden (403)

**Cause**: User lacks required permissions

**Solution**: Verify user has permissions in contract's `requiredPermissions`:
```typescript
requiredPermissions: ['users:create']
```

## Next Steps

- [GraphQL API Guide](./graphql-api.md) - Alternative to REST
- [API Contracts](./api-contracts.md) - Contract best practices
- [API Security](./api-security.md) - Authentication and authorization
