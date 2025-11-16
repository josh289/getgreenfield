---
title: GraphQL Queries
description: Complete reference for all GraphQL queries with examples
category: graphql-api
tags: [graphql, queries, api, read-operations]
related:
  - ./mutations.md
  - ./subscriptions.md
  - ./schema.md
  - ../rest-api/endpoints.md
difficulty: intermediate
---

# GraphQL Queries

Complete reference for all GraphQL queries available in the platform. Queries are read-only operations that fetch data without side effects.

## Overview

GraphQL queries are auto-generated from service **Query** contracts. Each query:

- Uses GET semantics (no state changes)
- Requires input parameters via input types
- Returns typed output
- Filtered by user permissions
- Supports caching

## Query Structure

All queries follow this pattern:

```graphql
query OperationName($variableName: InputType!) {
  queryName(input: $variableName) {
    field1
    field2
    nestedField {
      subField
    }
  }
}
```

**Variables:**
```json
{
  "variableName": {
    "parameter": "value"
  }
}
```

## Authentication Queries

### GetUser

Retrieve a single user by ID.

**Permission Required:** `auth:view-users`

```graphql
query GetUser($userId: String!) {
  getUser(input: { userId: $userId }) {
    id
    email
    profile {
      firstName
      lastName
      displayName
      avatar
      timezone
      locale
    }
    isActive
    emailVerified
    lastLogin
    createdAt
    updatedAt
  }
}
```

**Variables:**
```json
{
  "userId": "user-123"
}
```

**Response:**
```json
{
  "data": {
    "getUser": {
      "id": "user-123",
      "email": "john@example.com",
      "profile": {
        "firstName": "John",
        "lastName": "Doe",
        "displayName": "John Doe",
        "avatar": "https://example.com/avatar.jpg",
        "timezone": "America/New_York",
        "locale": "en-US"
      },
      "isActive": true,
      "emailVerified": true,
      "lastLogin": "2025-11-15T10:30:00Z",
      "createdAt": "2025-01-01T00:00:00Z",
      "updatedAt": "2025-11-15T10:30:00Z"
    }
  }
}
```

### ListUsers

Retrieve a paginated list of users.

**Permission Required:** `auth:view-users`

```graphql
query ListUsers($page: Int!, $pageSize: Int!, $filter: String) {
  listUsers(input: { page: $page, pageSize: $pageSize, filter: $filter }) {
    users {
      id
      email
      profile {
        firstName
        lastName
        displayName
      }
      isActive
      emailVerified
      createdAt
    }
    totalCount
    page
    pageSize
    hasMore
  }
}
```

**Variables:**
```json
{
  "page": 1,
  "pageSize": 20,
  "filter": "active"
}
```

**Response:**
```json
{
  "data": {
    "listUsers": {
      "users": [
        {
          "id": "user-123",
          "email": "john@example.com",
          "profile": {
            "firstName": "John",
            "lastName": "Doe",
            "displayName": "John Doe"
          },
          "isActive": true,
          "emailVerified": true,
          "createdAt": "2025-01-01T00:00:00Z"
        }
      ],
      "totalCount": 42,
      "page": 1,
      "pageSize": 20,
      "hasMore": true
    }
  }
}
```

### GetUserPermissions

Get all permissions for a specific user.

**Permission Required:** `auth:view-permissions`

```graphql
query GetUserPermissions($userId: String!) {
  getUserPermissions(input: { userId: $userId }) {
    userId
    permissions
    roles {
      roleName
      permissions
    }
  }
}
```

**Variables:**
```json
{
  "userId": "user-123"
}
```

**Response:**
```json
{
  "data": {
    "getUserPermissions": {
      "userId": "user-123",
      "permissions": [
        "users:read",
        "users:create",
        "orders:read"
      ],
      "roles": [
        {
          "roleName": "editor",
          "permissions": ["users:read", "users:create"]
        }
      ]
    }
  }
}
```

### GetRole

Retrieve role details by role name.

**Permission Required:** `auth:view-roles`

```graphql
query GetRole($roleName: String!) {
  getRole(input: { roleName: $roleName }) {
    roleName
    description
    permissions
    createdAt
    updatedAt
  }
}
```

### ListRoles

List all available roles.

**Permission Required:** `auth:view-roles`

```graphql
query ListRoles {
  listRoles(input: {}) {
    roles {
      roleName
      description
      permissions
      createdAt
    }
    totalCount
  }
}
```

### ListAvailablePermissions

Get all available permissions in the system.

**Permission Required:** `auth:view-permissions`

```graphql
query ListAvailablePermissions {
  listAvailablePermissions(input: {}) {
    permissions {
      name
      description
      resource
      action
    }
  }
}
```

## Service Discovery Queries

### GetServiceHealth

Get health status for a specific service.

**Permission Required:** `admin:view-services`

```graphql
query GetServiceHealth($serviceName: String!) {
  getServiceHealth(input: { serviceName: $serviceName }) {
    serviceName
    status
    lastHealthCheck
    responseTime
    errors
  }
}
```

### ListServices

List all registered services.

**Permission Required:** `admin:view-services`

```graphql
query ListServices {
  listServices(input: {}) {
    services {
      serviceName
      version
      status
      registeredAt
      lastHealthCheck
    }
    totalCount
  }
}
```

### GetServiceContracts

Get all contracts for a specific service.

**Permission Required:** `admin:view-contracts`

```graphql
query GetServiceContracts($serviceName: String!) {
  getServiceContracts(input: { serviceName: $serviceName }) {
    serviceName
    version
    contracts {
      messageType
      description
      inputSchema
      outputSchema
      requiredPermissions
    }
  }
}
```

## Common Patterns

### Using Variables

Always use variables for dynamic values:

**Good:**
```graphql
query GetUser($userId: String!) {
  getUser(input: { userId: $userId }) {
    email
  }
}
```

**Bad:**
```graphql
query GetUser {
  getUser(input: { userId: "user-123" }) {
    email
  }
}
```

### Fragments for Reusability

Define reusable field sets:

```graphql
fragment UserFields on UserResult {
  id
  email
  profile {
    firstName
    lastName
  }
  isActive
}

query GetUser($userId: String!) {
  getUser(input: { userId: $userId }) {
    ...UserFields
  }
}

query ListUsers {
  listUsers(input: { page: 1, pageSize: 10 }) {
    users {
      ...UserFields
    }
  }
}
```

### Selective Field Fetching

Only request fields you need:

```graphql
# Minimal query - faster
query GetUserEmail($userId: String!) {
  getUser(input: { userId: $userId }) {
    email
  }
}

# Full query - slower
query GetUserFull($userId: String!) {
  getUser(input: { userId: $userId }) {
    id
    email
    profile {
      firstName
      lastName
      displayName
      avatar
      timezone
      locale
      metadata
    }
    isActive
    emailVerified
    lastLogin
    createdAt
    updatedAt
  }
}
```

### Multiple Queries in One Request

Fetch multiple resources efficiently:

```graphql
query GetDashboard($userId: String!) {
  user: getUser(input: { userId: $userId }) {
    email
    profile {
      displayName
    }
  }

  permissions: getUserPermissions(input: { userId: $userId }) {
    permissions
  }

  services: listServices(input: {}) {
    services {
      serviceName
      status
    }
  }
}
```

## Error Handling

### Validation Errors

```json
{
  "errors": [
    {
      "message": "Variable '$userId' has invalid value: Expected type String!, found null",
      "locations": [{ "line": 1, "column": 16 }],
      "extensions": {
        "code": "VALIDATION_ERROR"
      }
    }
  ]
}
```

### Permission Errors

```json
{
  "errors": [
    {
      "message": "Missing required permission: auth:view-users",
      "path": ["getUser"],
      "extensions": {
        "code": "PERMISSION_DENIED",
        "requiredPermission": "auth:view-users"
      }
    }
  ],
  "data": null
}
```

### Not Found Errors

```json
{
  "data": {
    "getUser": null
  },
  "errors": [
    {
      "message": "User not found",
      "path": ["getUser"],
      "extensions": {
        "code": "NOT_FOUND",
        "userId": "user-999"
      }
    }
  ]
}
```

## Best Practices

### Performance

- Request only needed fields
- Use pagination for lists
- Leverage caching with GET requests
- Avoid deeply nested queries

### Security

- Always use variables (prevents injection)
- Never log sensitive field values
- Respect permission boundaries
- Use HTTPS in production

### Maintainability

- Use fragments for common field sets
- Name operations descriptively
- Document complex queries
- Version queries if needed

## Next Steps

- **[GraphQL Mutations](./mutations.md)** - State-changing operations
- **[GraphQL Subscriptions](./subscriptions.md)** - Real-time events
- **[GraphQL Schema](./schema.md)** - Complete type reference
- **[REST API](../rest-api/endpoints.md)** - Alternative HTTP API
