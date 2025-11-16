---
title: Auth Service
description: User authentication, authorization, and session management service
category: platform-services
tags: [auth-service, authentication, authorization, users, roles, permissions]
related:
  - ./api-gateway.md
  - ./service-discovery.md
  - ../authentication.md
difficulty: advanced
---

# Auth Service

The Auth Service manages user authentication, authorization, roles, permissions, and session management for the platform.

## Overview

The Auth Service provides:

- **User Management** - Create, update, and delete user accounts
- **Authentication** - Email/password and external provider (OAuth, SAML)
- **Authorization** - Role-based and permission-based access control
- **Session Management** - Stateful sessions with refresh tokens
- **JWT Token Generation** - Signed tokens with user context
- **Password Security** - Bcrypt hashing with configurable rounds
- **Event Sourcing** - Complete audit trail of all auth operations

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Auth Service                          │
│                                                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │  Commands   │  │   Queries   │  │   Events    │     │
│  │             │  │             │  │             │     │
│  │ CreateUser  │  │  GetUser    │  │UserCreated  │     │
│  │ Authenticate│  │  ListUsers  │  │UserUpdated  │     │
│  │ AssignRole  │  │  GetRole    │  │RoleAssigned │     │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘     │
│         │                 │                 │             │
│         └─────────┬───────┴─────────┬───────┘            │
│                   │                 │                     │
│         ┌─────────▼─────────────────▼─────────┐         │
│         │     Event-Sourced Aggregates        │         │
│         │   - UserAggregate                   │         │
│         │   - RoleAggregate                   │         │
│         │   - SessionAggregate                │         │
│         └─────────┬──────────────────┘         │
│                   │                             │
│         ┌─────────▼─────────────┐              │
│         │  Event Store (PG)     │              │
│         └───────────────────────┘              │
└───────────────────────────────────────────────────┘
```

## Configuration

### Environment Variables

```bash
# Port Configuration
PORT=3001                           # HTTP port

# Database (Event Store)
DATABASE_HOST=postgres              # PostgreSQL host
DATABASE_NAME=eventstore            # Database name
DATABASE_USER=actor_user            # Database user
DATABASE_PASSWORD=actor_pass123     # Database password
DATABASE_PORT=5432                  # Database port

# Legacy database URL (for compatibility)
AUTH_DATABASE_URL=postgresql://actor_user:actor_pass123@postgres:5432/eventstore

# Message Bus
MESSAGE_BUS_URL=amqp://admin:admin123@rabbitmq:5672

# JWT Configuration
JWT_SECRET=your-secret-key          # JWT signing secret (CHANGE IN PRODUCTION)
JWT_EXPIRATION=3600                 # Access token expiration (seconds)
REFRESH_TOKEN_EXPIRATION=604800     # Refresh token expiration (7 days)

# Password Security
BCRYPT_ROUNDS=12                    # Bcrypt hashing rounds

# Bootstrap Configuration
ADMIN_EMAIL=admin@example.com       # Default admin user email
ADMIN_PASSWORD=AdminPassword123!    # Default admin password (CHANGE!)

# Telemetry
JAEGER_ENDPOINT=http://jaeger:4318/v1/traces
```

### Docker Compose

```yaml
auth-service:
  build: ./platform/services/auth-service
  ports:
    - "3001:3001"
  environment:
    - PORT=3001
    - DATABASE_HOST=postgres
    - DATABASE_NAME=eventstore
    - DATABASE_USER=actor_user
    - DATABASE_PASSWORD=actor_pass123
    - MESSAGE_BUS_URL=amqp://admin:admin123@rabbitmq:5672
    - JWT_SECRET=${JWT_SECRET}
    - BCRYPT_ROUNDS=12
    - ADMIN_EMAIL=admin@example.com
  depends_on:
    postgres:
      condition: service_healthy
    rabbitmq:
      condition: service_healthy
```

## Commands

### CreateUser

Create a new user account.

**Permission Required:** `auth:create-user`

**Input:**
```typescript
{
  email: "user@example.com",
  password: "SecurePassword123!",
  profile: {
    firstName: "John",
    lastName: "Doe",
    displayName: "John Doe",
    timezone: "America/New_York",
    locale: "en-US"
  },
  initialRoles: ["user"],
  skipEmailVerification: false
}
```

**Output:**
```typescript
{
  success: true,
  userId: "user-123",
  email: "user@example.com",
  error: null,
  validationErrors: null
}
```

**Events Published:**
- `UserCreated` - User account created
- `RoleAssigned` - If initial roles provided

### AuthenticateUser

Authenticate with email and password.

**Permission Required:** None (public)

**Input:**
```typescript
{
  email: "user@example.com",
  password: "SecurePassword123!"
}
```

**Output:**
```typescript
{
  success: true,
  accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  expiresIn: 3600,
  user: {
    id: "user-123",
    email: "user@example.com",
    permissions: ["users:read", "orders:read"]
  }
}
```

**Events Published:**
- `SessionCreated` - New session established

### RefreshToken

Refresh an expired access token.

**Permission Required:** None (requires valid refresh token)

**Input:**
```typescript
{
  refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Output:**
```typescript
{
  success: true,
  accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  expiresIn: 3600
}
```

### CreateRole

Create a new role with permissions.

**Permission Required:** `auth:manage-roles`

**Input:**
```typescript
{
  roleName: "editor",
  description: "Content editor role",
  permissions: ["users:read", "content:edit", "content:publish"]
}
```

**Output:**
```typescript
{
  success: true,
  roleName: "editor",
  description: "Content editor role",
  permissions: ["users:read", "content:edit", "content:publish"]
}
```

**Events Published:**
- `RoleCreated` - New role created

### AssignRole

Assign a role to a user.

**Permission Required:** `auth:assign-roles`

**Input:**
```typescript
{
  userId: "user-123",
  roleName: "editor"
}
```

**Output:**
```typescript
{
  success: true,
  userId: "user-123",
  roleName: "editor"
}
```

**Events Published:**
- `RoleAssigned` - Role assigned to user

### UpdateRolePermissions

Update permissions for an existing role.

**Permission Required:** `auth:manage-roles`

**Input:**
```typescript
{
  roleName: "editor",
  permissions: ["users:read", "content:edit", "content:publish", "content:delete"]
}
```

**Events Published:**
- `RolePermissionsUpdated` - Role permissions modified

## Queries

### GetUser

Retrieve a user by ID.

**Permission Required:** `auth:view-users`

**Input:**
```typescript
{
  userId: "user-123"
}
```

**Output:**
```typescript
{
  success: true,
  user: {
    id: "user-123",
    email: "user@example.com",
    profile: {
      firstName: "John",
      lastName: "Doe",
      displayName: "John Doe",
      timezone: "America/New_York"
    },
    isActive: true,
    emailVerified: true,
    lastLogin: "2025-11-15T10:30:00Z",
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-11-15T10:30:00Z"
  }
}
```

### ListUsers

List all users with pagination.

**Permission Required:** `auth:view-users`

**Input:**
```typescript
{
  page: 1,
  pageSize: 20,
  filter: "active"
}
```

**Output:**
```typescript
{
  users: [
    {
      id: "user-123",
      email: "user@example.com",
      profile: { firstName: "John", lastName: "Doe" },
      isActive: true
    }
  ],
  totalCount: 42,
  page: 1,
  pageSize: 20,
  hasMore: true
}
```

### GetUserPermissions

Get all permissions for a user (direct + role-based).

**Permission Required:** `auth:view-permissions`

**Input:**
```typescript
{
  userId: "user-123"
}
```

**Output:**
```typescript
{
  userId: "user-123",
  permissions: ["users:read", "users:create", "content:edit"],
  roles: [
    {
      roleName: "editor",
      permissions: ["users:read", "content:edit"]
    },
    {
      roleName: "user",
      permissions: ["users:read"]
    }
  ]
}
```

### GetRole

Get role details by name.

**Permission Required:** `auth:view-roles`

**Input:**
```typescript
{
  roleName: "editor"
}
```

**Output:**
```typescript
{
  roleName: "editor",
  description: "Content editor role",
  permissions: ["users:read", "content:edit", "content:publish"],
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2025-01-15T10:00:00Z"
}
```

### ListRoles

List all roles.

**Permission Required:** `auth:view-roles`

**Output:**
```typescript
{
  roles: [
    {
      roleName: "admin",
      description: "Administrator",
      permissions: ["admin:all"]
    },
    {
      roleName: "editor",
      description: "Content editor",
      permissions: ["users:read", "content:edit"]
    }
  ],
  totalCount: 2
}
```

## Events

### UserCreated

Published when a new user account is created.

```typescript
{
  userId: "user-123",
  email: "user@example.com",
  profile: {
    firstName: "John",
    lastName: "Doe"
  },
  createdAt: "2025-11-15T14:30:00Z",
  timestamp: "2025-11-15T14:30:00.123Z"
}
```

### UserUpdated

Published when user profile is updated.

```typescript
{
  userId: "user-123",
  email: "user@example.com",
  updatedFields: ["profile.firstName", "profile.timezone"],
  updatedAt: "2025-11-15T14:35:00Z",
  updatedBy: "user-123",
  timestamp: "2025-11-15T14:35:00.456Z"
}
```

### RoleAssigned

Published when a role is assigned to a user.

```typescript
{
  userId: "user-123",
  roleName: "editor",
  assignedBy: "admin-user",
  timestamp: "2025-11-15T14:40:00.789Z"
}
```

### SessionCreated

Published when a user authenticates.

```typescript
{
  sessionId: "session-456",
  userId: "user-123",
  deviceInfo: "Mozilla/5.0...",
  ipAddress: "192.168.1.100",
  createdAt: "2025-11-15T14:30:00Z",
  expiresAt: "2025-11-22T14:30:00Z",
  timestamp: "2025-11-15T14:30:00.123Z"
}
```

## Security Features

### Password Hashing

```typescript
// Bcrypt with configurable rounds
const hashedPassword = await bcrypt.hash(password, BCRYPT_ROUNDS);

// Default: 12 rounds (production)
// Dev: Can use lower for faster tests
```

### JWT Token Generation

```typescript
// Access token
const accessToken = jwt.sign(
  {
    sub: user.userId,
    email: user.email,
    name: user.profile.displayName,
    permissions: user.getAllPermissions()
  },
  JWT_SECRET,
  { expiresIn: JWT_EXPIRATION }
);

// Refresh token
const refreshToken = jwt.sign(
  {
    sub: user.userId,
    type: 'refresh'
  },
  JWT_SECRET,
  { expiresIn: REFRESH_TOKEN_EXPIRATION }
);
```

### Session Management

- Sessions stored in event store
- Automatic cleanup of expired sessions
- Support for multiple concurrent sessions
- Force logout by revoking all sessions

### External Authentication

**OAuth Support:**
- Google
- GitHub
- Custom OAuth providers

**SAML Support:**
- Enterprise SSO integration
- Configurable identity providers

## Data Model

### User Aggregate

```typescript
class UserAggregate extends AggregateRoot {
  id: string;
  email: string;
  passwordHash: string;
  profile: UserProfile;
  roles: string[];
  directPermissions: string[];
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: Date;

  // Domain logic
  assignRole(roleName: string): void;
  updateProfile(profile: UserProfile): void;
  verifyEmail(): void;
  deactivate(): void;
}
```

### Role Aggregate

```typescript
class RoleAggregate extends AggregateRoot {
  roleName: string;
  description?: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;

  // Domain logic
  updatePermissions(permissions: string[]): void;
  addPermission(permission: string): void;
  removePermission(permission: string): void;
}
```

### Session Aggregate

```typescript
class SessionAggregate extends AggregateRoot {
  sessionId: string;
  userId: string;
  refreshToken: string;
  deviceInfo?: string;
  ipAddress?: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt?: Date;

  // Domain logic
  refresh(): void;
  revoke(): void;
  isExpired(): boolean;
}
```

## Event Store Schema

```sql
-- Events table (append-only)
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  aggregate_id VARCHAR(255) NOT NULL,
  aggregate_type VARCHAR(100) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL,
  metadata JSONB,
  version INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(aggregate_id, version)
);

-- Snapshots table (performance optimization)
CREATE TABLE snapshots (
  aggregate_id VARCHAR(255) PRIMARY KEY,
  aggregate_type VARCHAR(100) NOT NULL,
  snapshot_data JSONB NOT NULL,
  version INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Read Models

The Auth Service maintains read models for efficient querying:

### UserReadModel

```sql
CREATE TABLE user_read_model (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  profile JSONB NOT NULL,
  roles JSONB NOT NULL,
  direct_permissions JSONB NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_user_email ON user_read_model(email);
CREATE INDEX idx_user_active ON user_read_model(is_active);
```

### RoleReadModel

```sql
CREATE TABLE role_read_model (
  role_name VARCHAR(255) PRIMARY KEY,
  description TEXT,
  permissions JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);
```

### SessionReadModel

```sql
CREATE TABLE session_read_model (
  session_id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  refresh_token VARCHAR(500) NOT NULL,
  device_info TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (user_id) REFERENCES user_read_model(id)
);

CREATE INDEX idx_session_user ON session_read_model(user_id);
CREATE INDEX idx_session_expires ON session_read_model(expires_at);
```

## Monitoring and Observability

### Metrics

```prometheus
# Authentication metrics
auth_service_authentications_total{status="success"}
auth_service_authentications_total{status="failed"}
auth_service_token_refreshes_total

# User metrics
auth_service_users_total
auth_service_active_users_total
auth_service_user_registrations_total

# Session metrics
auth_service_active_sessions_total
auth_service_session_expirations_total
```

### Health Check

```bash
curl http://localhost:3001/health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "auth-service",
  "version": "1.0.0",
  "dependencies": {
    "database": "healthy",
    "messageBus": "healthy",
    "eventStore": "healthy"
  }
}
```

## Troubleshooting

### User Cannot Authenticate

**Symptoms:**
- Login fails with valid credentials
- "Invalid credentials" error

**Checks:**
```bash
# Check user exists
docker exec -it postgres psql -U actor_user -d eventstore \
  -c "SELECT id, email, is_active FROM user_read_model WHERE email='user@example.com';"

# Check password hash
# Verify BCRYPT_ROUNDS matches between registration and login

# Check logs
docker logs auth-service | grep "Authentication failed"
```

### JWT Token Invalid

**Symptoms:**
- Token rejected by API Gateway
- "Invalid token" errors

**Checks:**
```bash
# Verify JWT_SECRET matches between services
docker exec api-gateway env | grep JWT_SECRET
docker exec auth-service env | grep JWT_SECRET

# Decode token (without verification)
echo "eyJhbGci..." | base64 -d

# Check expiration
# Token exp claim should be in the future
```

### Permissions Not Working

**Symptoms:**
- User has permission but still gets 403
- Permissions not reflected in token

**Checks:**
```bash
# Check user permissions
curl -X GET http://localhost:3003/api/users/user-123/permissions \
  -H "Authorization: Bearer <admin-token>"

# Check role permissions
curl -X GET http://localhost:3003/api/roles/editor \
  -H "Authorization: Bearer <admin-token>"

# Re-authenticate to get fresh token
curl -X POST http://localhost:3003/api/auth/authenticate \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

## Next Steps

- **[API Gateway](./api-gateway.md)** - Protocol translation service
- **[Service Discovery](./service-discovery.md)** - Service registry
- **[Authentication Reference](../authentication.md)** - Complete auth guide
- **[Event Sourcing Package](../platform-packages/event-sourcing.md)** - Event store implementation
