---
title: GraphQL API Overview
description: Auto-generated GraphQL schema from service contracts with permission-based filtering
category: graphql-api
tags: [graphql, api, schema, auto-generation, permissions]
related:
  - ./schema.md
  - ./examples.md
  - ../rest-api/overview.md
  - ../../03-guides/api-integration/graphql-api.md
difficulty: intermediate
---

# GraphQL API Overview

The Banyan Platform automatically generates a complete GraphQL schema from all service contracts, with permission-based filtering for enhanced security.

## Key Features

### Automatic Schema Generation

Every service contract automatically generates GraphQL types:

- **Commands** generate mutations with input types
- **Queries** generate query fields with input types
- **Events** generate subscription types
- **Permissions** filter schema based on user access
- **Validation** enforced from contract definitions

### Permission-Based Schema Filtering

The schema dynamically filters based on user permissions. Users only see operations they can perform:

```graphql
# User with permissions: ["users:read"]
type Query {
  getUser(input: GetUserInput!): UserResult
  listUsers(input: ListUsersInput!): ListUsersResult
}
# No mutations visible (no users:create permission)
```

```graphql
# User with permissions: ["users:read", "users:create", "users:update"]
type Query {
  getUser(input: GetUserInput!): UserResult
  listUsers(input: ListUsersInput!): ListUsersResult
}

type Mutation {
  createUser(input: CreateUserInput!): CreateUserResult
  updateUser(input: UpdateUserInput!): UpdateUserResult
}
# Still no deleteUser (no users:delete permission)
```

This provides:
- **Better security** - Users can't discover unauthorized operations
- **Cleaner API** - Schema shows only relevant operations
- **Developer experience** - Auto-completion shows available actions

## GraphQL Endpoint

### Interactive Playground

Access the GraphiQL interactive playground:

```
http://localhost:3003/graphql
```

Features:
- Auto-completion and syntax highlighting
- Interactive documentation explorer
- Query history
- Real-time validation
- Permission-aware schema

### GraphQL Endpoint

All GraphQL requests go to:

```
POST http://localhost:3003/graphql
Content-Type: application/json
Authorization: Bearer <token>
```

Request body:
```json
{
  "query": "query GetUser($userId: String!) { ... }",
  "variables": { "userId": "user-123" },
  "operationName": "GetUser"
}
```

## Schema Generation Rules

### Commands → Mutations

Commands represent state-changing operations:

```typescript
@Command({
  description: 'Create a new user',
  permissions: ['users:create']
})
export class CreateUserCommand {
  email!: string;
  firstName!: string;
  lastName?: string;
}
```

**Generates:**
```graphql
input CreateUserInput {
  email: String!
  firstName: String!
  lastName: String
}

type CreateUserResult {
  userId: String!
  email: String!
  createdAt: String!
}

type Mutation {
  createUser(input: CreateUserInput!): CreateUserResult
}
```

### Queries → Query Fields

Queries represent read operations:

```typescript
@Query({
  description: 'Get user by ID',
  permissions: ['users:read']
})
export class GetUserQuery {
  userId!: string;
}
```

**Generates:**
```graphql
input GetUserInput {
  userId: String!
}

type UserResult {
  userId: ID!
  email: String!
  firstName: String!
  lastName: String
}

type Query {
  getUser(input: GetUserInput!): UserResult
}
```

### Events → Subscriptions

Events generate real-time subscriptions:

```typescript
@DomainEvent('User.Events.UserCreated', { broadcast: true })
export class UserCreatedEvent {
  userId!: string;
  email!: string;
  firstName!: string;
}
```

**Generates:**
```graphql
type UserCreatedEvent {
  userId: String!
  email: String!
  firstName: String!
  timestamp: String!
}

type Subscription {
  userCreated: UserCreatedEvent
}
```

## Type System

### Scalar Types

GraphQL scalars map to TypeScript types:

| GraphQL | TypeScript | Description |
|---------|------------|-------------|
| `String` | `string` | UTF-8 text |
| `Int` | `number` | 32-bit integer |
| `Float` | `number` | Floating point |
| `Boolean` | `boolean` | true/false |
| `ID` | `string` | Unique identifier |

### Input Types

Input types represent command/query parameters:

```graphql
input CreateUserInput {
  email: String!        # Required
  firstName: String!    # Required
  lastName: String      # Optional
  age: Int
  active: Boolean
}
```

### Object Types

Object types represent results:

```graphql
type UserResult {
  userId: ID!
  email: String!
  firstName: String!
  lastName: String
  createdAt: String!
  updatedAt: String
}
```

### Lists

Lists represent collections:

```graphql
type ListUsersResult {
  users: [UserResult!]!    # Non-null list of non-null users
  totalCount: Int!
  page: Int!
  pageSize: Int!
}
```

### Enums

Enums represent fixed sets of values:

```graphql
enum UserRole {
  ADMIN
  USER
  GUEST
}

input CreateUserInput {
  role: UserRole!
}
```

## Operations

### Queries (Read Operations)

Fetch data without side effects:

```graphql
query GetUser {
  getUser(input: { userId: "user-123" }) {
    userId
    email
    firstName
  }
}
```

### Mutations (Write Operations)

Modify data:

```graphql
mutation CreateUser {
  createUser(input: {
    email: "user@example.com"
    firstName: "John"
    lastName: "Doe"
  }) {
    userId
    email
    createdAt
  }
}
```

### Subscriptions (Real-time Updates)

Receive real-time events:

```graphql
subscription OnUserCreated {
  userCreated {
    userId
    email
    firstName
  }
}
```

## Authentication

All GraphQL requests require authentication (except public operations):

### Production (JWT)

```http
POST /graphql
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Development Mode

For local development only:

```http
POST /graphql
X-Dev-User-Id: dev-user-123
X-Dev-Permissions: users:create,users:read
Content-Type: application/json
```

> **WARNING**: Development mode bypasses all authentication. Never use in production.

## Error Handling

GraphQL errors follow a standard format:

```json
{
  "errors": [
    {
      "message": "Validation failed",
      "locations": [{ "line": 2, "column": 3 }],
      "path": ["createUser"],
      "extensions": {
        "code": "VALIDATION_ERROR",
        "details": {
          "email": "Invalid email format"
        }
      }
    }
  ],
  "data": null
}
```

Common error codes:
- `VALIDATION_ERROR` - Input validation failed
- `PERMISSION_DENIED` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `INTERNAL_ERROR` - Server error

## Query Complexity Limits

Queries are analyzed for complexity to prevent abuse:

**Limits:**
- Max depth: 10 levels
- Max fields: 100 per query
- Max complexity: 1000 points

**Example - too complex:**
```graphql
query TooComplex {
  listUsers(input: { page: 1, pageSize: 100 }) {
    users {
      orders {
        items {
          product {
            reviews {
              user {
                orders {
                  # Too deeply nested - rejected
                }
              }
            }
          }
        }
      }
    }
  }
}
```

## Best Practices

### Request Only Needed Fields

✅ **DO:**
```graphql
query GetUser {
  getUser(input: { userId: "123" }) {
    userId
    email
  }
}
```

❌ **DON'T:**
```graphql
query GetUser {
  getUser(input: { userId: "123" }) {
    userId
    email
    firstName
    lastName
    address
    phoneNumber
    # Requesting unnecessary fields
  }
}
```

### Use Fragments for Reusability

```graphql
fragment UserFields on UserResult {
  userId
  email
  firstName
  lastName
}

query GetUser {
  getUser(input: { userId: "123" }) {
    ...UserFields
  }
}

query ListUsers {
  listUsers(input: { page: 1 }) {
    users {
      ...UserFields
    }
  }
}
```

### Use Variables for Dynamic Values

✅ **DO:**
```graphql
query GetUser($userId: String!) {
  getUser(input: { userId: $userId }) {
    userId
    email
  }
}
```

❌ **DON'T:**
```graphql
query GetUser {
  getUser(input: { userId: "user-123" }) {
    userId
    email
  }
}
```

### Avoid Deep Nesting

Keep queries shallow for better performance:

✅ **DO:**
```graphql
query GetUserOrders {
  getUser(input: { userId: "123" }) {
    userId
  }
  getUserOrders(input: { userId: "123" }) {
    orders {
      orderId
    }
  }
}
```

❌ **DON'T:**
```graphql
query GetUserOrders {
  getUser(input: { userId: "123" }) {
    userId
    orders {
      items {
        product {
          reviews {
            # Too nested
          }
        }
      }
    }
  }
}
```

## Advantages Over REST

### Single Request for Multiple Resources

```graphql
query GetUserDashboard {
  getUser(input: { userId: "123" }) {
    userId
    email
  }
  getUserSettings(input: { userId: "123" }) {
    theme
    notifications
  }
  getUserOrders(input: { userId: "123" }) {
    orders {
      orderId
      total
    }
  }
}
```

### No Over-fetching or Under-fetching

Request exactly the fields you need:

```graphql
query GetUserEmails {
  listUsers(input: { page: 1 }) {
    users {
      email  # Only fetch emails
    }
  }
}
```

### Strong Typing and Validation

Schema provides compile-time validation and IDE auto-completion.

### Real-time Subscriptions

Built-in support for real-time updates:

```graphql
subscription OnUserCreated {
  userCreated {
    userId
    email
  }
}
```

## Next Steps

- **[GraphQL Schema](./schema.md)** - Complete schema reference
- **[GraphQL Examples](./examples.md)** - Working code examples
- **[WebSocket API](../websocket-api/overview.md)** - Alternative for real-time
- **[Authentication](../authentication.md)** - JWT tokens and permissions
