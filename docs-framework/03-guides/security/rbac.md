---
title: Role-Based Access Control (RBAC)
description: Implement role-based access control to manage permissions at scale
category: Security
tags: [rbac, roles, permissions, access-control, security, authorization]
difficulty: intermediate
last_updated: 2025-01-15
applies_to: ["v1.0.0+"]
related:
  - overview.md
  - permission-based-authorization.md
  - policy-based-authorization.md
  - authentication.md
---

# Role-Based Access Control (RBAC)

This guide covers implementing Role-Based Access Control (RBAC) to manage user permissions through roles rather than direct permission assignments.

## Use This Guide If...

- You're managing permissions for multiple users
- You want to group permissions into reusable roles
- You need to simplify permission management
- You're implementing hierarchical access control
- You want to understand role assignment patterns

## RBAC Overview

**Role-Based Access Control (RBAC)** simplifies permission management by:

1. **Grouping Permissions**: Bundle related permissions into roles
2. **Assigning Roles to Users**: Users inherit all permissions from assigned roles
3. **Centralized Management**: Update role permissions to affect all users with that role
4. **Scalability**: Easier to manage than individual user permissions

### RBAC Benefits

- ✓ **Simplified Management**: Change one role instead of many users
- ✓ **Consistency**: All users in a role have same permissions
- ✓ **Auditability**: Clear visibility into who has what access
- ✓ **Scalability**: Grows with organization without complexity
- ✓ **Compliance**: Easier to demonstrate access control policies

## RBAC Components

### Roles

A **role** represents a job function or responsibility:

```typescript
interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];  // All permissions granted by this role
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
}
```

**Example roles:**

```typescript
// Admin role - full access
{
  id: 'role-admin',
  name: 'admin',
  description: 'Full system access',
  permissions: [
    'user:create', 'user:read', 'user:update', 'user:delete',
    'product:create', 'product:read', 'product:update', 'product:delete',
    'order:create', 'order:read', 'order:update', 'order:delete',
    'reports:view', 'reports:export', 'reports:schedule',
  ],
  isActive: true
}

// Manager role - can manage products and view reports
{
  id: 'role-manager',
  name: 'manager',
  description: 'Product management and reporting',
  permissions: [
    'product:create', 'product:read', 'product:update',
    'order:read',
    'reports:view', 'reports:export',
  ],
  isActive: true
}

// User role - basic access
{
  id: 'role-user',
  name: 'user',
  description: 'Standard user access',
  permissions: [
    'product:read',
    'order:create', 'order:read',
  ],
  isActive: true
}
```

### User-Role Assignment

Users can have multiple roles:

```typescript
interface User {
  id: string;
  email: string;
  roles: string[];  // Array of role IDs
  directPermissions: string[];  // Optional: Direct permissions beyond roles
}
```

### Permission Resolution

User's total permissions = Role permissions + Direct permissions (deduplicated):

```typescript
async function getUserPermissions(user: User): Promise<string[]> {
  // 1. Get permissions from all assigned roles
  const rolePermissions: string[] = [];
  for (const roleId of user.roles) {
    const role = await RoleRepository.findById(roleId);
    if (role?.isActive) {
      rolePermissions.push(...role.permissions);
    }
  }

  // 2. Add direct permissions
  const directPermissions = user.directPermissions || [];

  // 3. Combine and deduplicate
  return Array.from(new Set([...rolePermissions, ...directPermissions]));
}
```

## Creating Roles

### Using Auth Service Commands

```typescript
// Create a role
import { authServiceClient } from './clients.js';

const result = await authServiceClient.createRole({
  name: 'manager',
  description: 'Product management and reporting',
  permissions: [
    'product:create',
    'product:read',
    'product:update',
    'order:read',
    'reports:view',
    'reports:export',
  ],
});

// Result:
// {
//   roleId: 'role-uuid',
//   name: 'manager',
//   permissions: ['product:create', 'product:read', ...]
// }
```

### Direct Event Sourcing

```typescript
// platform/services/auth-service/src/commands/CreateRoleHandler.ts
import { CommandHandler, CommandHandlerDecorator } from '@banyanai/platform-base-service';
import { RoleAggregate } from '../aggregates/RoleAggregate.js';

@CommandHandlerDecorator(CreateRoleCommand)
export class CreateRoleHandler extends CommandHandler<CreateRoleCommand, CreateRoleResult> {
  async handle(command: CreateRoleCommand, user: AuthenticatedUser | null): Promise<CreateRoleResult> {
    if (!user) {
      throw new Error('Authentication required to create roles');
    }

    // Create role aggregate
    const roleId = uuidv4();
    const role = new RoleAggregate(roleId);

    // Execute domain logic
    role.createRole(
      roleId,
      command.name,
      command.description,
      command.permissions,
      user.userId
    );

    // Save to event store (automatic)
    await this.save(role);

    return {
      roleId,
      name: command.name,
      permissions: command.permissions,
    };
  }
}
```

## Assigning Roles to Users

### Assign Role Command

```typescript
// Assign role to user
const result = await authServiceClient.assignRoleToUser({
  userId: 'user-123',
  roleId: 'role-manager',
});

// User now inherits all permissions from 'manager' role
```

### Implementation

```typescript
// platform/services/auth-service/src/aggregates/UserAggregate.ts
export class UserAggregate extends AggregateRoot {
  private roles: string[] = [];

  assignRole(roleId: string, assignedBy: string): void {
    if (this.roles.includes(roleId)) {
      throw new Error('User already has this role');
    }

    this.raiseEvent(
      {
        userId: this.id,
        roleId,
        assignedAt: new Date(),
        assignedBy,
      },
      'RoleAssignedToUser'
    );
  }

  removeRole(roleId: string, removedBy: string): void {
    if (!this.roles.includes(roleId)) {
      throw new Error('User does not have this role');
    }

    this.raiseEvent(
      {
        userId: this.id,
        roleId,
        removedAt: new Date(),
        removedBy,
      },
      'RoleRemovedFromUser'
    );
  }

  applyRoleAssignedToUser(event: RoleAssignedToUserEvent): void {
    this.roles.push(event.roleId);
  }

  applyRoleRemovedFromUser(event: RoleRemovedFromUserEvent): void {
    this.roles = this.roles.filter(r => r !== event.roleId);
  }
}
```

## Permission Resolution in JWT

When generating JWT tokens, resolve all permissions from roles:

```typescript
// platform/services/auth-service/src/commands/AuthenticateUserHandler.ts
async handle(command: AuthenticateUserCommand) {
  // Validate credentials
  const user = await this.validateCredentials(command.email, command.password);

  // Resolve permissions from roles + direct permissions
  const permissions = await this.getUserPermissions(user);

  // Get role names for JWT
  const roles = await this.getUserRoles(user);

  // Generate JWT with both roles and resolved permissions
  const tokens = await this.jwtManager.generateTokenPair({
    userId: user.id,
    email: user.email,
    permissions,  // Flattened permissions for Layer 1 checks
    roles: roles.map(r => r.name),  // Role names for Layer 2 policies
  });

  return {
    success: true,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}

private async getUserPermissions(user: UserReadModel): Promise<string[]> {
  // Direct permissions
  const directPermissions = user.directPermissions || [];

  // Role-based permissions
  const rolePermissions: string[] = [];
  for (const roleId of user.roles || []) {
    const role = await RoleReadModel.findById(roleId);
    if (role?.isActive && role.permissions) {
      rolePermissions.push(...role.permissions);
    }
  }

  // Combine and deduplicate
  return Array.from(new Set([...directPermissions, ...rolePermissions]));
}
```

## JWT Token with Roles

```json
{
  "sub": "user-123",
  "email": "alice@example.com",
  "name": "Alice Smith",
  "permissions": [
    "product:create",
    "product:read",
    "product:update",
    "order:read",
    "reports:view",
    "reports:export"
  ],
  "roles": ["manager"],
  "iat": 1705334400,
  "exp": 1705334700
}
```

## Using Roles in Authorization

### Layer 1: Permission-Based (Automatic)

Layer 1 uses resolved permissions - roles are transparent:

```typescript
// Contract requires permission
@Command({
  permissions: ['product:create']
})
export class CreateProductCommand { ... }

// User with 'manager' role has this permission
// Gateway checks user.permissions array (which includes role permissions)
// Authorization passes ✓
```

### Layer 2: Role-Based Policies

Layer 2 can check roles directly for business logic:

```typescript
import { RequirePolicy } from '@banyanai/platform-base-service';
import { PolicyViolationError } from '@banyanai/platform-core';

@RequirePolicy(async (user: AuthenticatedUser | null, command: DeleteUserCommand) => {
  if (!user) {
    throw new PolicyAuthenticationError('delete_user');
  }

  // Check if user has admin role
  if (!user.roles?.includes('admin')) {
    throw new PolicyViolationError(
      'DeleteUserHandler',
      user.userId,
      'delete_user',
      'Only administrators can delete users'
    );
  }

  // Can't delete yourself
  if (command.userId === user.userId) {
    throw new PolicyViolationError(
      'DeleteUserHandler',
      user.userId,
      'delete_user',
      'Cannot delete your own account'
    );
  }
})
```

## Common Role Patterns

### Pattern 1: Standard Hierarchy

```typescript
// Super Admin - can do anything
const superAdminRole = {
  name: 'super-admin',
  permissions: ['*:*'],  // If wildcards supported
  // OR list all permissions explicitly
};

// Admin - full CRUD on all resources
const adminRole = {
  name: 'admin',
  permissions: [
    'user:create', 'user:read', 'user:update', 'user:delete',
    'product:create', 'product:read', 'product:update', 'product:delete',
    'order:create', 'order:read', 'order:update', 'order:delete',
    'reports:view', 'reports:export', 'reports:schedule',
  ],
};

// Manager - manage specific domains
const managerRole = {
  name: 'manager',
  permissions: [
    'product:create', 'product:read', 'product:update',
    'order:read', 'order:update',
    'reports:view', 'reports:export',
  ],
};

// User - read and create own data
const userRole = {
  name: 'user',
  permissions: [
    'product:read',
    'order:create', 'order:read',
  ],
};
```

### Pattern 2: Department-Based Roles

```typescript
// Sales department
const salesRole = {
  name: 'sales',
  permissions: [
    'order:create', 'order:read', 'order:update',
    'customer:create', 'customer:read', 'customer:update',
    'reports:view',
  ],
};

// Warehouse department
const warehouseRole = {
  name: 'warehouse',
  permissions: [
    'product:read', 'product:update',
    'inventory:create', 'inventory:read', 'inventory:update',
    'shipment:create', 'shipment:read', 'shipment:update',
  ],
};

// Finance department
const financeRole = {
  name: 'finance',
  permissions: [
    'order:read',
    'invoice:create', 'invoice:read', 'invoice:update',
    'payment:create', 'payment:read',
    'reports:view', 'reports:export', 'reports:schedule',
  ],
};
```

### Pattern 3: Feature-Based Roles

```typescript
// Analytics viewer
const analyticsViewerRole = {
  name: 'analytics-viewer',
  permissions: [
    'reports:view',
    'analytics:view',
    'dashboard:view',
  ],
};

// Report exporter
const reportExporterRole = {
  name: 'report-exporter',
  permissions: [
    'reports:view',
    'reports:export',
    'analytics:view',
    'analytics:export',
  ],
};
```

### Pattern 4: Multiple Roles per User

Users can have multiple roles for combined permissions:

```typescript
// User is both a manager and analytics viewer
const user = {
  id: 'user-123',
  email: 'alice@example.com',
  roles: ['manager', 'analytics-viewer'],
  // Inherits permissions from both roles:
  // - manager: product:*, order:*, reports:view, reports:export
  // - analytics-viewer: analytics:view, dashboard:view
};

// Total permissions = union of all role permissions
```

## Updating Roles

### Update Role Permissions

```typescript
// Update role permissions
const result = await authServiceClient.updateRolePermissions({
  roleId: 'role-manager',
  permissions: [
    // Add new permission
    'product:delete',
    // Keep existing
    'product:create', 'product:read', 'product:update',
    'order:read',
    'reports:view', 'reports:export',
  ],
});

// All users with 'manager' role now have 'product:delete' permission
// (on their next token refresh)
```

⚠️ **Note**: Permission changes only affect users after they get new access tokens (next login or token refresh).

### Permission Refresh Strategy

```typescript
// Option 1: Users refresh tokens periodically
// Access tokens expire after 5 minutes, users get new token with current permissions

// Option 2: Force token refresh for all users in role
async function forceRoleTokenRefresh(roleId: string) {
  // 1. Get all users with this role
  const users = await UserReadModel.findByRole(roleId);

  // 2. Invalidate their refresh tokens
  for (const user of users) {
    await RefreshTokenRepository.revokeAllForUser(user.id);
  }

  // 3. Users must re-authenticate to get new tokens
  // New tokens will include updated permissions
}

// Option 3: Real-time permission updates (advanced)
// Publish permission change event via WebSocket/SSE
// Client fetches new token immediately
```

## Querying Roles and Permissions

### Get User's Roles

```typescript
// Query user's assigned roles
const result = await authServiceClient.getUserRoles({
  userId: 'user-123',
});

// Returns:
// {
//   roles: [
//     { id: 'role-manager', name: 'manager' },
//     { id: 'role-analytics', name: 'analytics-viewer' }
//   ]
// }
```

### Get User's Effective Permissions

```typescript
// Query user's total permissions (roles + direct)
const result = await authServiceClient.getUserPermissions({
  userId: 'user-123',
});

// Returns:
// {
//   permissions: [
//     'product:create', 'product:read', 'product:update',
//     'order:read',
//     'reports:view', 'reports:export',
//     'analytics:view', 'dashboard:view'
//   ],
//   sources: {
//     'product:create': ['role:manager'],
//     'product:read': ['role:manager'],
//     'analytics:view': ['role:analytics-viewer'],
//     // ... permission source tracking
//   }
// }
```

### List All Roles

```typescript
// Query all available roles
const result = await authServiceClient.listRoles({});

// Returns:
// {
//   roles: [
//     {
//       id: 'role-admin',
//       name: 'admin',
//       description: 'Full system access',
//       permissionCount: 20,
//       userCount: 2,
//     },
//     {
//       id: 'role-manager',
//       name: 'manager',
//       description: 'Product management',
//       permissionCount: 8,
//       userCount: 15,
//     },
//     // ...
//   ]
// }
```

## Testing RBAC

### Unit Testing Role Creation

```typescript
import { describe, expect, test } from '@jest/globals';
import { RoleAggregate } from '../aggregates/RoleAggregate.js';

describe('RoleAggregate', () => {
  test('should create role with valid permissions', () => {
    const role = new RoleAggregate('role-123');

    role.createRole(
      'role-123',
      'manager',
      'Product manager role',
      ['product:create', 'product:read', 'product:update'],
      'admin-user'
    );

    const events = role.getUncommittedEvents();
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe('RoleCreated');
    expect(events[0].data.name).toBe('manager');
    expect(events[0].data.permissions).toContain('product:create');
  });

  test('should reject invalid permission format', () => {
    const role = new RoleAggregate('role-123');

    expect(() => {
      role.createRole(
        'role-123',
        'manager',
        'Manager',
        ['invalid-permission'],  // Missing ':' separator
        'admin-user'
      );
    }).toThrow('Invalid permission format');
  });
});
```

### Integration Testing Permission Resolution

```typescript
describe('Permission Resolution', () => {
  test('should combine permissions from multiple roles', async () => {
    // Create user with multiple roles
    const user = await createTestUser({
      roles: ['manager', 'analytics-viewer'],
    });

    // Get effective permissions
    const permissions = await authService.getUserPermissions(user.id);

    // Should have permissions from both roles
    expect(permissions).toContain('product:create');  // From manager
    expect(permissions).toContain('analytics:view');  // From analytics-viewer
  });

  test('should deduplicate permissions from overlapping roles', async () => {
    // Both roles have 'product:read'
    const user = await createTestUser({
      roles: ['manager', 'user'],
    });

    const permissions = await authService.getUserPermissions(user.id);

    // Permission should appear only once
    const readPermissions = permissions.filter(p => p === 'product:read');
    expect(readPermissions).toHaveLength(1);
  });
});
```

## Security Best Practices

### 1. Principle of Least Privilege

```typescript
// ✓ GOOD: Role has only necessary permissions
const salesRole = {
  name: 'sales',
  permissions: [
    'order:create',
    'order:read',
    'customer:read',
  ],
};

// ✗ BAD: Role has excessive permissions
const salesRole = {
  name: 'sales',
  permissions: [
    'order:*',      // Too broad
    'customer:*',   // Can delete customers!
    'product:*',    // Not needed for sales
  ],
};
```

### 2. Separate Admin Roles

```typescript
// ✓ GOOD: Specific admin roles
const userAdminRole = {
  name: 'user-admin',
  permissions: ['user:create', 'user:read', 'user:update', 'user:delete'],
};

const productAdminRole = {
  name: 'product-admin',
  permissions: ['product:create', 'product:read', 'product:update', 'product:delete'],
};

// ✗ BAD: Single god-mode admin
const adminRole = {
  name: 'admin',
  permissions: ['*:*'],  // Too powerful, no separation
};
```

### 3. Audit Role Changes

```typescript
// Log all role modifications
Logger.info('Role updated', {
  roleId: role.id,
  roleName: role.name,
  permissionsAdded: ['product:delete'],
  permissionsRemoved: [],
  updatedBy: user.userId,
  affectedUserCount: 15,
});

// Log role assignments
Logger.info('Role assigned to user', {
  userId: user.id,
  roleId: role.id,
  roleName: role.name,
  assignedBy: admin.userId,
  permissionsGranted: role.permissions,
});
```

### 4. Role Naming Conventions

```typescript
// ✓ GOOD: Clear, descriptive names
'user-admin'
'product-manager'
'sales-representative'
'analytics-viewer'

// ✗ BAD: Vague names
'role1'
'admin'
'power-user'
```

### 5. Regular Permission Audits

```typescript
// Periodic audit: Find users with admin permissions
async function auditAdminAccess() {
  const users = await UserReadModel.findAll();

  for (const user of users) {
    const permissions = await getUserPermissions(user);

    const hasAdminPerms = permissions.some(p =>
      p.includes(':delete') || p.includes('admin')
    );

    if (hasAdminPerms) {
      Logger.info('Admin access detected', {
        userId: user.id,
        email: user.email,
        roles: user.roles,
        adminPermissions: permissions.filter(p =>
          p.includes(':delete') || p.includes('admin')
        ),
      });
    }
  }
}
```

## Common Mistakes to Avoid

### ❌ Mistake 1: Hardcoding Role Checks

```typescript
// BAD: Hardcoded role check
if (user.roles.includes('admin')) {
  // allow
}

// GOOD: Use permissions, not roles
// Let RBAC handle permission resolution
@Command({ permissions: ['user:delete'] })
```

### ❌ Mistake 2: Not Deduplicating Permissions

```typescript
// BAD: User ends up with duplicate permissions
permissions: ['product:read', 'product:read', 'order:read']

// GOOD: Deduplicate when resolving
permissions: Array.from(new Set([...rolePerms, ...directPerms]))
```

### ❌ Mistake 3: Forgetting Inactive Roles

```typescript
// BAD: Including inactive roles
for (const roleId of user.roles) {
  const role = await RoleReadModel.findById(roleId);
  rolePermissions.push(...role.permissions);  // What if role.isActive === false?
}

// GOOD: Filter inactive roles
for (const roleId of user.roles) {
  const role = await RoleReadModel.findById(roleId);
  if (role?.isActive) {
    rolePermissions.push(...role.permissions);
  }
}
```

### ❌ Mistake 4: No Permission Refresh Strategy

```typescript
// BAD: Users keep old permissions forever
// Update role permissions but users never get updated tokens

// GOOD: Force token refresh or use short token expiry
// Access tokens expire after 5 minutes
// Users automatically get refreshed permissions
```

## Next Steps

Now that you understand RBAC:

1. **External Auth**: Learn [external auth providers](./external-auth-providers.md) integration
2. **Policies**: Review [policy-based authorization](./policy-based-authorization.md) for business rules
3. **Testing**: Read [testing services](../service-development/testing-services.md)

## Related Guides

- [Security Overview](./overview.md) - Two-layer authorization model
- [Permission-Based Authorization](./permission-based-authorization.md) - Layer 1 permissions
- [Policy-Based Authorization](./policy-based-authorization.md) - Layer 2 policies
- [Authentication](./authentication.md) - JWT tokens and validation
- [External Auth Providers](./external-auth-providers.md) - SSO integration
