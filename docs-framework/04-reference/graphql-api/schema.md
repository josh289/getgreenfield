---
title: GraphQL Schema Reference
description: Complete GraphQL schema with all types, inputs, and operations
category: graphql-api
tags: [graphql, schema, types, api-reference]
related:
  - ./queries.md
  - ./mutations.md
  - ./subscriptions.md
  - ./overview.md
difficulty: intermediate
---

# GraphQL Schema Reference

Complete GraphQL schema reference including all types, inputs, queries, mutations, and subscriptions.

## Schema Generation

The GraphQL schema is **automatically generated** from service contracts. This schema represents the current platform services (Auth Service, Service Discovery).

## Scalar Types

### Built-in Scalars

```graphql
scalar String   # UTF-8 text
scalar Int      # 32-bit integer
scalar Float    # Floating point number
scalar Boolean  # true or false
scalar ID       # Unique identifier
```

### Custom Scalars

```graphql
scalar JSON      # Arbitrary JSON data
scalar DateTime  # ISO 8601 timestamp
scalar Email     # Valid email address
```

## Root Types

### Query

All read operations:

```graphql
type Query {
  # User Management
  getUser(input: GetUserInput!): UserResult
  listUsers(input: ListUsersInput!): ListUsersResult

  # Permissions
  getUserPermissions(input: GetUserPermissionsInput!): UserPermissionsResult
  listAvailablePermissions(input: ListAvailablePermissionsInput!): PermissionsListResult

  # Roles
  getRole(input: GetRoleInput!): RoleResult
  listRoles(input: ListRolesInput!): RolesListResult

  # Service Discovery
  getServiceHealth(input: GetServiceHealthInput!): ServiceHealthResult
  listServices(input: ListServicesInput!): ServicesListResult
  getServiceContracts(input: GetServiceContractsInput!): ServiceContractsResult
}
```

### Mutation

All write operations:

```graphql
type Mutation {
  # User Management
  createUser(input: CreateUserInput!): CreateUserResult
  updateUser(input: UpdateUserInput!): UpdateUserResult
  deleteUser(input: DeleteUserInput!): DeleteUserResult

  # Authentication
  authenticateUser(input: AuthenticateUserInput!): AuthenticationResult
  refreshToken(input: RefreshTokenInput!): RefreshTokenResult
  revokeToken(input: RevokeTokenInput!): RevokeTokenResult

  # Role Management
  createRole(input: CreateRoleInput!): CreateRoleResult
  updateRolePermissions(input: UpdateRolePermissionsInput!): UpdateRolePermissionsResult
  assignRole(input: AssignRoleInput!): AssignRoleResult

  # Permission Management
  assignPermission(input: AssignPermissionInput!): AssignPermissionResult

  # Session Management
  createSession(input: CreateSessionInput!): CreateSessionResult
  refreshSession(input: RefreshSessionInput!): RefreshSessionResult
  revokeSession(input: RevokeSessionInput!): RevokeSessionResult
  revokeAllUserSessions(input: RevokeAllUserSessionsInput!): RevokeAllUserSessionsResult
}
```

### Subscription

All real-time events:

```graphql
type Subscription {
  # User Events
  userCreated: UserCreatedEvent
  userUpdated(filter: UserEventFilter): UserUpdatedEvent
  userDeleted: UserDeletedEvent

  # Role Events
  roleAssigned(filter: RoleEventFilter): RoleAssignedEvent
  permissionGranted: PermissionGrantedEvent

  # Session Events
  sessionCreated(filter: SessionEventFilter): SessionCreatedEvent
  sessionExpired: SessionExpiredEvent

  # Service Events
  serviceRegistered: ServiceRegisteredEvent
  serviceHealthChanged(filter: ServiceEventFilter): ServiceHealthChangedEvent
  contractUpdated: ContractUpdatedEvent
}
```

## User Types

### UserResult

```graphql
type UserResult {
  id: ID!
  email: String!
  profile: UserProfile!
  isActive: Boolean!
  emailVerified: Boolean!
  lastLogin: DateTime
  createdAt: DateTime!
  updatedAt: DateTime!
  createdBy: String
  updatedBy: String
}
```

### UserProfile

```graphql
type UserProfile {
  firstName: String
  lastName: String
  displayName: String
  avatar: String
  timezone: String
  locale: String
  metadata: JSON
}
```

### ListUsersResult

```graphql
type ListUsersResult {
  users: [UserResult!]!
  totalCount: Int!
  page: Int!
  pageSize: Int!
  hasMore: Boolean!
}
```

### CreateUserResult

```graphql
type CreateUserResult {
  success: Boolean!
  userId: ID
  email: String
  error: String
  validationErrors: [ValidationError!]
}
```

### ValidationError

```graphql
type ValidationError {
  field: String!
  message: String!
}
```

## Authentication Types

### AuthenticationResult

```graphql
type AuthenticationResult {
  success: Boolean!
  accessToken: String
  refreshToken: String
  expiresIn: Int
  user: AuthenticatedUser
  error: String
}
```

### AuthenticatedUser

```graphql
type AuthenticatedUser {
  id: ID!
  email: String!
  permissions: [String!]!
  roles: [String!]
}
```

### RefreshTokenResult

```graphql
type RefreshTokenResult {
  success: Boolean!
  accessToken: String
  expiresIn: Int
  error: String
}
```

## Role and Permission Types

### RoleResult

```graphql
type RoleResult {
  roleName: String!
  description: String
  permissions: [String!]!
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

### RolesListResult

```graphql
type RolesListResult {
  roles: [RoleResult!]!
  totalCount: Int!
}
```

### UserPermissionsResult

```graphql
type UserPermissionsResult {
  userId: ID!
  permissions: [String!]!
  roles: [RolePermissions!]!
}
```

### RolePermissions

```graphql
type RolePermissions {
  roleName: String!
  permissions: [String!]!
}
```

### PermissionDetail

```graphql
type PermissionDetail {
  name: String!
  description: String!
  resource: String!
  action: String!
}
```

### PermissionsListResult

```graphql
type PermissionsListResult {
  permissions: [PermissionDetail!]!
}
```

## Service Discovery Types

### ServiceHealthResult

```graphql
type ServiceHealthResult {
  serviceName: String!
  status: ServiceStatus!
  lastHealthCheck: DateTime
  responseTime: Int
  errors: [String!]
}
```

### ServiceStatus

```graphql
enum ServiceStatus {
  HEALTHY
  DEGRADED
  UNHEALTHY
  UNKNOWN
}
```

### ServicesListResult

```graphql
type ServicesListResult {
  services: [ServiceInfo!]!
  totalCount: Int!
}
```

### ServiceInfo

```graphql
type ServiceInfo {
  serviceName: String!
  version: String!
  status: ServiceStatus!
  registeredAt: DateTime!
  lastHealthCheck: DateTime
}
```

### ServiceContractsResult

```graphql
type ServiceContractsResult {
  serviceName: String!
  version: String!
  contracts: [ContractDefinition!]!
}
```

### ContractDefinition

```graphql
type ContractDefinition {
  messageType: String!
  description: String
  inputSchema: JSON
  outputSchema: JSON
  requiredPermissions: [String!]
  isPublic: Boolean
}
```

## Input Types

### User Inputs

```graphql
input GetUserInput {
  userId: ID!
}

input ListUsersInput {
  page: Int!
  pageSize: Int!
  filter: String
}

input CreateUserInput {
  email: String!
  password: String!
  profile: UserProfileInput!
  initialRoles: [String!]
  skipEmailVerification: Boolean
}

input UserProfileInput {
  firstName: String
  lastName: String
  displayName: String
  avatar: String
  timezone: String
  locale: String
  metadata: JSON
}

input UpdateUserInput {
  userId: ID!
  profile: UserProfileInput
  isActive: Boolean
}

input DeleteUserInput {
  userId: ID!
  reason: String
}
```

### Authentication Inputs

```graphql
input AuthenticateUserInput {
  email: String!
  password: String!
}

input RefreshTokenInput {
  refreshToken: String!
}

input RevokeTokenInput {
  token: String!
}
```

### Role Inputs

```graphql
input CreateRoleInput {
  roleName: String!
  description: String
  permissions: [String!]!
}

input UpdateRolePermissionsInput {
  roleName: String!
  permissions: [String!]!
}

input AssignRoleInput {
  userId: ID!
  roleName: String!
}

input GetRoleInput {
  roleName: String!
}

input ListRolesInput {
  page: Int
  pageSize: Int
}
```

### Permission Inputs

```graphql
input AssignPermissionInput {
  userId: ID!
  permission: String!
}

input GetUserPermissionsInput {
  userId: ID!
}

input ListAvailablePermissionsInput {
  resource: String
}
```

### Session Inputs

```graphql
input CreateSessionInput {
  userId: ID!
  deviceInfo: String
  ipAddress: String
}

input RefreshSessionInput {
  sessionId: ID!
}

input RevokeSessionInput {
  sessionId: ID!
}

input RevokeAllUserSessionsInput {
  userId: ID!
  reason: String
}
```

### Service Discovery Inputs

```graphql
input GetServiceHealthInput {
  serviceName: String!
}

input ListServicesInput {
  status: ServiceStatus
}

input GetServiceContractsInput {
  serviceName: String!
}
```

## Event Types

### UserCreatedEvent

```graphql
type UserCreatedEvent {
  userId: ID!
  email: String!
  profile: UserProfile!
  createdAt: DateTime!
  timestamp: DateTime!
}
```

### UserUpdatedEvent

```graphql
type UserUpdatedEvent {
  userId: ID!
  email: String!
  updatedFields: [String!]!
  updatedAt: DateTime!
  updatedBy: String
  timestamp: DateTime!
}
```

### UserDeletedEvent

```graphql
type UserDeletedEvent {
  userId: ID!
  email: String!
  deletedAt: DateTime!
  deletedBy: String
  reason: String
  timestamp: DateTime!
}
```

### RoleAssignedEvent

```graphql
type RoleAssignedEvent {
  userId: ID!
  roleName: String!
  assignedBy: String
  timestamp: DateTime!
}
```

### ServiceRegisteredEvent

```graphql
type ServiceRegisteredEvent {
  serviceName: String!
  version: String!
  serviceId: ID!
  endpoint: String
  contracts: [ContractDefinition!]!
  registeredAt: DateTime!
  timestamp: DateTime!
}
```

### ServiceHealthChangedEvent

```graphql
type ServiceHealthChangedEvent {
  serviceName: String!
  status: ServiceStatus!
  previousStatus: ServiceStatus
  healthCheckTime: DateTime!
  responseTime: Int
  errors: [String!]
  timestamp: DateTime!
}
```

## Event Filters

```graphql
input UserEventFilter {
  userId: ID
}

input RoleEventFilter {
  userId: ID
  roleName: String
}

input SessionEventFilter {
  userId: ID
  sessionId: ID
}

input ServiceEventFilter {
  serviceName: String
  minSeverity: String
}
```

## Introspection

### Get Complete Schema

```graphql
query IntrospectionQuery {
  __schema {
    types {
      name
      kind
      description
      fields {
        name
        type {
          name
          kind
        }
      }
    }
    queryType {
      name
    }
    mutationType {
      name
    }
    subscriptionType {
      name
    }
  }
}
```

### Get Type Details

```graphql
query GetTypeDetails {
  __type(name: "UserResult") {
    name
    kind
    description
    fields {
      name
      type {
        name
        kind
      }
      description
    }
  }
}
```

## Permission-Based Schema

The schema is **dynamically filtered** based on user permissions. Users only see operations they can access.

### Example: Limited User

**User permissions:** `["users:read"]`

```graphql
type Query {
  getUser(input: GetUserInput!): UserResult
  listUsers(input: ListUsersInput!): ListUsersResult
  # No admin operations visible
}

# No mutations visible (no write permissions)
```

### Example: Admin User

**User permissions:** `["users:read", "users:create", "admin:all"]`

```graphql
type Query {
  getUser(input: GetUserInput!): UserResult
  listUsers(input: ListUsersInput!): ListUsersResult
  getServiceHealth(input: GetServiceHealthInput!): ServiceHealthResult
  listServices(input: ListServicesInput!): ServicesListResult
  # All operations visible
}

type Mutation {
  createUser(input: CreateUserInput!): CreateUserResult
  updateUser(input: UpdateUserInput!): UpdateUserResult
  deleteUser(input: DeleteUserInput!): DeleteUserResult
  # All mutations visible
}
```

## Next Steps

- **[GraphQL Queries](./queries.md)** - Query examples
- **[GraphQL Mutations](./mutations.md)** - Mutation examples
- **[GraphQL Subscriptions](./subscriptions.md)** - Real-time events
- **[GraphQL Overview](./overview.md)** - Auto-generation and features
