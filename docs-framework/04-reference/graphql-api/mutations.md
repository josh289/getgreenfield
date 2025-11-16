---
title: GraphQL Mutations
description: Complete reference for all GraphQL mutations with examples
category: graphql-api
tags: [graphql, mutations, api, write-operations, commands]
related:
  - ./queries.md
  - ./subscriptions.md
  - ./schema.md
  - ../rest-api/endpoints.md
difficulty: intermediate
---

# GraphQL Mutations

Complete reference for all GraphQL mutations available in the platform. Mutations are write operations that create, update, or delete data.

## Overview

GraphQL mutations are auto-generated from service **Command** contracts. Each mutation:

- Uses POST semantics (state-changing)
- Requires input parameters via input types
- Returns typed output with operation results
- Filtered by user permissions
- May trigger domain events

## Mutation Structure

All mutations follow this pattern:

```graphql
mutation OperationName($input: InputType!) {
  mutationName(input: $input) {
    success
    field1
    field2
    error
  }
}
```

**Variables:**
```json
{
  "input": {
    "parameter1": "value1",
    "parameter2": "value2"
  }
}
```

## Authentication Mutations

### CreateUser

Create a new user account.

**Permission Required:** `auth:create-user`

```graphql
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    success
    userId
    email
    error
    validationErrors {
      field
      message
    }
  }
}
```

**Variables:**
```json
{
  "input": {
    "email": "newuser@example.com",
    "password": "SecurePassword123!",
    "profile": {
      "firstName": "Jane",
      "lastName": "Smith",
      "displayName": "Jane Smith",
      "timezone": "America/New_York"
    },
    "initialRoles": ["user"],
    "skipEmailVerification": false
  }
}
```

**Response:**
```json
{
  "data": {
    "createUser": {
      "success": true,
      "userId": "user-456",
      "email": "newuser@example.com",
      "error": null,
      "validationErrors": null
    }
  }
}
```

**Validation Error Example:**
```json
{
  "data": {
    "createUser": {
      "success": false,
      "userId": null,
      "email": null,
      "error": "Validation failed",
      "validationErrors": [
        {
          "field": "email",
          "message": "Email already exists"
        },
        {
          "field": "password",
          "message": "Password must be at least 8 characters"
        }
      ]
    }
  }
}
```

### UpdateUser

Update user profile or account settings.

**Permission Required:** `auth:update-user`

```graphql
mutation UpdateUser($input: UpdateUserInput!) {
  updateUser(input: $input) {
    success
    user {
      id
      email
      profile {
        firstName
        lastName
        displayName
      }
      updatedAt
    }
    error
  }
}
```

**Variables:**
```json
{
  "input": {
    "userId": "user-123",
    "profile": {
      "firstName": "John",
      "lastName": "Updated",
      "timezone": "America/Los_Angeles"
    }
  }
}
```

### AuthenticateUser

Authenticate with email and password.

**Permission Required:** None (public endpoint)

```graphql
mutation AuthenticateUser($input: AuthenticateUserInput!) {
  authenticateUser(input: $input) {
    success
    accessToken
    refreshToken
    expiresIn
    user {
      id
      email
      permissions
    }
    error
  }
}
```

**Variables:**
```json
{
  "input": {
    "email": "user@example.com",
    "password": "SecurePassword123!"
  }
}
```

**Response:**
```json
{
  "data": {
    "authenticateUser": {
      "success": true,
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "expiresIn": 3600,
      "user": {
        "id": "user-123",
        "email": "user@example.com",
        "permissions": ["users:read", "orders:read"]
      },
      "error": null
    }
  }
}
```

### RefreshToken

Refresh an expired access token.

**Permission Required:** None (requires valid refresh token)

```graphql
mutation RefreshToken($input: RefreshTokenInput!) {
  refreshToken(input: $input) {
    success
    accessToken
    expiresIn
    error
  }
}
```

**Variables:**
```json
{
  "input": {
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### RevokeToken

Revoke an active token (logout).

**Permission Required:** `auth:revoke-token`

```graphql
mutation RevokeToken($input: RevokeTokenInput!) {
  revokeToken(input: $input) {
    success
    error
  }
}
```

**Variables:**
```json
{
  "input": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## Role and Permission Mutations

### CreateRole

Create a new role with permissions.

**Permission Required:** `auth:manage-roles`

```graphql
mutation CreateRole($input: CreateRoleInput!) {
  createRole(input: $input) {
    success
    roleName
    description
    permissions
    error
  }
}
```

**Variables:**
```json
{
  "input": {
    "roleName": "editor",
    "description": "Content editor role",
    "permissions": ["users:read", "users:create", "content:edit"]
  }
}
```

### AssignRole

Assign a role to a user.

**Permission Required:** `auth:assign-roles`

```graphql
mutation AssignRole($input: AssignRoleInput!) {
  assignRole(input: $input) {
    success
    userId
    roleName
    error
  }
}
```

**Variables:**
```json
{
  "input": {
    "userId": "user-123",
    "roleName": "editor"
  }
}
```

### UpdateRolePermissions

Update permissions for an existing role.

**Permission Required:** `auth:manage-roles`

```graphql
mutation UpdateRolePermissions($input: UpdateRolePermissionsInput!) {
  updateRolePermissions(input: $input) {
    success
    roleName
    permissions
    error
  }
}
```

**Variables:**
```json
{
  "input": {
    "roleName": "editor",
    "permissions": ["users:read", "users:create", "content:edit", "content:publish"]
  }
}
```

### AssignPermission

Assign a direct permission to a user (not via role).

**Permission Required:** `auth:assign-permissions`

```graphql
mutation AssignPermission($input: AssignPermissionInput!) {
  assignPermission(input: $input) {
    success
    userId
    permission
    error
  }
}
```

**Variables:**
```json
{
  "input": {
    "userId": "user-123",
    "permission": "admin:view-logs"
  }
}
```

## Session Management Mutations

### CreateSession

Create a new user session.

**Permission Required:** None (internal use)

```graphql
mutation CreateSession($input: CreateSessionInput!) {
  createSession(input: $input) {
    success
    sessionId
    expiresAt
    error
  }
}
```

### RefreshSession

Refresh an active session.

**Permission Required:** None (requires valid session)

```graphql
mutation RefreshSession($input: RefreshSessionInput!) {
  refreshSession(input: $input) {
    success
    sessionId
    expiresAt
    error
  }
}
```

### RevokeSession

Revoke a specific session.

**Permission Required:** `auth:manage-sessions`

```graphql
mutation RevokeSession($input: RevokeSessionInput!) {
  revokeSession(input: $input) {
    success
    sessionId
    error
  }
}
```

### RevokeAllUserSessions

Revoke all sessions for a user (force logout everywhere).

**Permission Required:** `auth:manage-sessions`

```graphql
mutation RevokeAllUserSessions($input: RevokeAllUserSessionsInput!) {
  revokeAllUserSessions(input: $input) {
    success
    userId
    revokedCount
    error
  }
}
```

**Variables:**
```json
{
  "input": {
    "userId": "user-123",
    "reason": "Security: password changed"
  }
}
```

## Common Patterns

### Transaction-Style Mutations

Execute multiple related mutations:

```graphql
mutation CreateUserWithRole($userInput: CreateUserInput!, $roleInput: AssignRoleInput!) {
  user: createUser(input: $userInput) {
    success
    userId
    error
  }

  role: assignRole(input: $roleInput) {
    success
    error
  }
}
```

**Note:** Each mutation executes independently. Use sagas for true distributed transactions.

### Conditional Mutations

```graphql
mutation UpdateUserIfActive($input: UpdateUserInput!) {
  updateUser(input: $input) {
    success
    user {
      id
      isActive
      updatedAt
    }
    error
  }
}
```

Handle conditional logic in the handler or client based on response.

### Optimistic Updates

Client-side pattern for better UX:

```typescript
// Optimistically update UI
updateUserInCache(userId, newData);

// Execute mutation
const result = await apolloClient.mutate({
  mutation: UPDATE_USER,
  variables: { input }
});

// Rollback on error
if (!result.data.updateUser.success) {
  rollbackUserInCache(userId, oldData);
}
```

## Error Handling

### Validation Errors

```json
{
  "data": {
    "createUser": {
      "success": false,
      "error": "Validation failed",
      "validationErrors": [
        {
          "field": "email",
          "message": "Invalid email format"
        }
      ]
    }
  }
}
```

### Permission Errors

```json
{
  "errors": [
    {
      "message": "Missing required permission: auth:create-user",
      "path": ["createUser"],
      "extensions": {
        "code": "PERMISSION_DENIED"
      }
    }
  ],
  "data": null
}
```

### Business Logic Errors

```json
{
  "data": {
    "assignRole": {
      "success": false,
      "error": "Role 'admin' cannot be assigned to external users",
      "userId": null,
      "roleName": null
    }
  }
}
```

## Best Practices

### Input Validation

Always validate inputs on the client before sending:

```typescript
function validateCreateUserInput(input: CreateUserInput): string[] {
  const errors: string[] = [];

  if (!input.email?.includes('@')) {
    errors.push('Invalid email format');
  }

  if (input.password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  return errors;
}
```

### Error Handling

Check both GraphQL errors and business logic errors:

```typescript
const result = await apolloClient.mutate({
  mutation: CREATE_USER,
  variables: { input }
});

// GraphQL-level errors (permissions, validation)
if (result.errors) {
  handleGraphQLErrors(result.errors);
  return;
}

// Business logic errors (custom validation)
if (!result.data.createUser.success) {
  handleBusinessErrors(result.data.createUser.error);
  return;
}

// Success
handleSuccess(result.data.createUser);
```

### Idempotency

Some mutations should be idempotent (safe to retry):

```graphql
mutation CreateUserIdempotent($input: CreateUserInput!) {
  createUser(input: $input) {
    success
    userId
    error
    # If user exists, returns existing userId instead of error
  }
}
```

### Caching

Mutations can update the cache automatically:

```typescript
const result = await apolloClient.mutate({
  mutation: UPDATE_USER,
  variables: { input },
  update: (cache, { data }) => {
    if (data.updateUser.success) {
      cache.writeQuery({
        query: GET_USER,
        variables: { userId: input.userId },
        data: { getUser: data.updateUser.user }
      });
    }
  }
});
```

## Next Steps

- **[GraphQL Queries](./queries.md)** - Read operations
- **[GraphQL Subscriptions](./subscriptions.md)** - Real-time events
- **[GraphQL Schema](./schema.md)** - Complete type reference
- **[Authentication](../authentication.md)** - JWT tokens and permissions
