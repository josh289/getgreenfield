---
title: "GraphQL API Guide"
---

# GraphQL API Guide

## Overview

The API Gateway automatically generates a GraphQL schema from your service contracts with **permission-filtered** queries and mutations. Services define contracts, and GraphQL operations are created automatically.

## Auto-Generated Schema

### Schema Generation

The API Gateway creates GraphQL types from your contracts:

```typescript
// CreateUserCommand contract
CreateUserCommand → mutation createUser(input: CreateUserInput!): User!

// GetUserQuery contract
GetUserQuery → query getUser(id: ID!): User

// ListUsersQuery contract
ListUsersQuery → query listUsers(filter: UserFilter): [User!]!
```

### Type Mapping

Contract schemas are converted to GraphQL types:

```typescript
// Contract input schema
inputSchema: {
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email' },
    name: { type: 'string' },
    role: { type: 'string', enum: ['user', 'admin'] }
  }
}

// Generated GraphQL type
input CreateUserInput {
  email: String!
  name: String!
  role: UserRole
}

enum UserRole {
  USER
  ADMIN
}
```

## Creating GraphQL Operations

### 1. Define Contracts

Same contracts power both REST and GraphQL:

```typescript
// contracts/UserContracts.ts
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
    }
  },
  requiredPermissions: ['users:create']
});

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
  outputSchema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      email: { type: 'string' },
      name: { type: 'string' },
      role: { type: 'string' }
    }
  },
  requiredPermissions: ['users:read']
});
```

### 2. Implement Handlers

Write only business logic (same for REST and GraphQL):

```typescript
// queries/GetUserHandler.ts
import { QueryHandler } from '@banyanai/platform-cqrs';
import { GetUserContract } from '../contracts/UserContracts.js';

@QueryHandler(GetUserContract)
export class GetUserHandler {
  async handle(input: { id: string }) {
    const user = await this.userRepository.findById(input.id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }
}
```

### 3. Schema Generated Automatically

The API Gateway creates:

```graphql
type Query {
  getUser(id: ID!): User
  listUsers(filter: UserFilter): [User!]!
}

type Mutation {
  createUser(input: CreateUserInput!): User!
  updateUser(id: ID!, input: UpdateUserInput!): User!
  deleteUser(id: ID!): Boolean!
}

type User {
  id: ID!
  email: String!
  name: String!
  role: UserRole!
  createdAt: String!
}

input CreateUserInput {
  email: String!
  name: String!
  role: UserRole
}

enum UserRole {
  USER
  ADMIN
}
```

## Making GraphQL Requests

### Mutations (Commands)

```bash
curl -X POST http://localhost:3003/graphql \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation CreateUser($input: CreateUserInput!) { createUser(input: $input) { id email name role createdAt } }",
    "variables": {
      "input": {
        "email": "alice@example.com",
        "name": "Alice Smith",
        "role": "USER"
      }
    }
  }'
```

Response:
```json
{
  "data": {
    "createUser": {
      "id": "usr_1234567890",
      "email": "alice@example.com",
      "name": "Alice Smith",
      "role": "USER",
      "createdAt": "2025-11-15T10:30:00Z"
    }
  }
}
```

### Queries

```bash
curl -X POST http://localhost:3003/graphql \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "query GetUser($id: ID!) { getUser(id: $id) { id email name role } }",
    "variables": {
      "id": "usr_1234567890"
    }
  }'
```

Response:
```json
{
  "data": {
    "getUser": {
      "id": "usr_1234567890",
      "email": "alice@example.com",
      "name": "Alice Smith",
      "role": "USER"
    }
  }
}
```

### Multiple Operations

```graphql
query GetUserData($userId: ID!) {
  user: getUser(id: $userId) {
    id
    email
    name
    role
  }

  users: listUsers(filter: { role: ADMIN }) {
    id
    name
    email
  }
}
```

## Permission-Filtered Schema

**Key Feature**: Users only see operations they can access.

### Example

User with `users:read` permission sees:
```graphql
type Query {
  getUser(id: ID!): User
  listUsers(filter: UserFilter): [User!]!
}
```

User with both `users:read` and `users:create` sees:
```graphql
type Query {
  getUser(id: ID!): User
  listUsers(filter: UserFilter): [User!]!
}

type Mutation {
  createUser(input: CreateUserInput!): User!
}
```

**Implementation**: The API Gateway filters the schema based on JWT token permissions before serving it.

## GraphQL Playground

Interactive GraphQL explorer available at:
```
http://localhost:3003/graphql
```

Features:
- Schema introspection
- Auto-completion
- Query validation
- Documentation browser
- Variable editor

### Using the Playground

1. **Open** `http://localhost:3003/graphql` in browser
2. **Add auth header** in HTTP Headers tab:
```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```
3. **Write query** with auto-completion
4. **Execute** and see results

## GraphQL Subscriptions (Events)

Subscribe to real-time events via GraphQL subscriptions:

```graphql
subscription OnUserCreated {
  userCreated {
    id
    email
    name
    role
  }
}
```

**Implementation**: Uses WebSocket protocol under the hood.

See [WebSocket documentation](./overview.md#websocket-api) for more details on event subscriptions.

## Error Handling

GraphQL errors follow standard format:

```json
{
  "errors": [
    {
      "message": "User not found",
      "path": ["getUser"],
      "extensions": {
        "code": "NOT_FOUND",
        "correlationId": "cor_abc123xyz",
        "timestamp": "2025-11-15T10:30:00Z"
      }
    }
  ],
  "data": {
    "getUser": null
  }
}
```

### Error Codes

| Code | Description |
|------|-------------|
| UNAUTHENTICATED | Missing or invalid JWT |
| FORBIDDEN | Insufficient permissions |
| BAD_USER_INPUT | Validation error |
| NOT_FOUND | Resource doesn't exist |
| INTERNAL_SERVER_ERROR | Handler exception |

## Field Name Sanitization

The API Gateway sanitizes field names to be GraphQL-compliant:

```typescript
// Contract field with dots
properties: {
  'user.email': { type: 'string' }
}

// Converted to GraphQL
userEmail: String
```

**Pattern**: Dots (`.`) are removed and the next character is capitalized.

## Introspection

Query the schema programmatically:

```graphql
query IntrospectionQuery {
  __schema {
    types {
      name
      fields {
        name
        type {
          name
          kind
        }
      }
    }
  }
}
```

## Best Practices

### 1. Design Clear Operation Names

```typescript
// Good: Clear, descriptive
CreateUserCommand → createUser
GetUserQuery → getUser
ListUsersQuery → listUsers

// Avoid: Ambiguous
ProcessUserCommand → processUser (what does it do?)
```

### 2. Use Input Types for Mutations

```typescript
// Good: Structured input
mutation createUser(input: CreateUserInput!)

// Avoid: Too many arguments
mutation createUser(email: String!, name: String!, role: String!, ...)
```

### 3. Provide Rich Output Types

```typescript
outputSchema: {
  type: 'object',
  properties: {
    id: { type: 'string' },
    email: { type: 'string' },
    name: { type: 'string' },
    role: { type: 'string' },
    createdAt: { type: 'string', format: 'date-time' },
    updatedAt: { type: 'string', format: 'date-time' },
    // Include useful fields clients might need
  }
}
```

### 4. Set Granular Permissions

```typescript
// Read operations
requiredPermissions: ['users:read']

// Write operations
requiredPermissions: ['users:create']

// Admin operations
requiredPermissions: ['users:admin']
```

### 5. Use Enums for Constrained Values

```typescript
inputSchema: {
  properties: {
    role: {
      type: 'string',
      enum: ['user', 'admin', 'moderator'] // → GraphQL enum
    }
  }
}
```

## Client Libraries

### Apollo Client (React)

```typescript
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';

const client = new ApolloClient({
  uri: 'http://localhost:3003/graphql',
  cache: new InMemoryCache(),
  headers: {
    Authorization: `Bearer ${jwtToken}`
  }
});

const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id
      email
      name
    }
  }
`;

const { data } = await client.mutate({
  mutation: CREATE_USER,
  variables: {
    input: {
      email: 'alice@example.com',
      name: 'Alice Smith'
    }
  }
});
```

### GraphQL Request (Node.js)

```typescript
import { request, gql } from 'graphql-request';

const query = gql`
  query GetUser($id: ID!) {
    getUser(id: $id) {
      id
      email
      name
    }
  }
`;

const data = await request(
  'http://localhost:3003/graphql',
  query,
  { id: 'usr_123' },
  {
    Authorization: `Bearer ${jwtToken}`
  }
);
```

## Troubleshooting

### Operation Not in Schema

**Cause**: User lacks required permissions or contract not discovered

**Solution**:
1. Check JWT token contains required permissions
2. Verify contract is registered: `curl http://localhost:3003/debug/contracts`

### Invalid Field Names

**Cause**: Contract field names contain invalid GraphQL characters

**Solution**: API Gateway sanitizes automatically, but avoid special characters in field names:
```typescript
// Avoid
properties: {
  'user.email.address': { type: 'string' } // Too many dots
}

// Prefer
properties: {
  email: { type: 'string' }
}
```

### Type Conflicts

**Cause**: Multiple contracts generate same type name

**Solution**: Use unique message type prefixes:
```typescript
// Service A
messageType: 'UserServiceCreateUser'

// Service B
messageType: 'AuthServiceCreateUser'
```

## Next Steps

- [REST API Guide](./rest-api.md) - Alternative to GraphQL
- [API Contracts](./api-contracts.md) - Contract best practices
- [API Security](./api-security.md) - Authentication and authorization
