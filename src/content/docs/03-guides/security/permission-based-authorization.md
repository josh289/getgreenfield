---
title: Permission-Based Authorization (Layer 1)
description: Implement Layer 1 authorization with permission checks at the API Gateway
category: Security
tags: [authorization, permissions, layer-1, api-gateway, security]
difficulty: intermediate
last_updated: 2025-01-15
applies_to: ["v1.0.0+"]
related:
  - overview.md
  - authentication.md
  - policy-based-authorization.md
  - rbac.md
---

# Permission-Based Authorization (Layer 1)

This guide covers **Layer 1 authorization** - permission-based access control enforced at the API Gateway BEFORE requests reach your services.

## Use This Guide If...

- You're defining permissions for commands and queries
- You want to enforce WHO can call WHAT operations
- You need to protect services from unauthorized requests
- You're implementing coarse-grained access control
- You want to understand the `permissions` field in contracts

## Layer 1 Authorization Overview

**Layer 1** is the first line of defense in the two-layer authorization model:

- **Location**: API Gateway (centralized)
- **Timing**: BEFORE message creation and routing
- **Mechanism**: Contract `permissions` array
- **Purpose**: Enforce static, coarse-grained access control
- **Question**: "Does this user have permission to call this operation AT ALL?"

### How It Works

```
┌─────────┐
│ Request │  Authorization: Bearer <JWT>
└────┬────┘
     │
     ▼
┌────────────────────────────────────────────────┐
│ API Gateway - Layer 1                          │
│                                                │
│ 1. Validate JWT signature and expiry          │
│ 2. Extract permissions from JWT payload        │
│    → ["product:read", "product:create"]       │
│                                                │
│ 3. Load contract for operation                │
│    → @Command({ permissions: ["product:create"] })
│                                                │
│ 4. Check: Does user have ALL required perms?  │
│    → Required: ["product:create"]             │
│    → User has: ["product:read", "product:create"]
│    → ✓ Match found                            │
│                                                │
│ 5. Permission check result:                   │
│    → PASS: Route to service via message bus   │
│    → FAIL: Return 403 Forbidden (stop here)   │
└────────────────────────────────────────────────┘
```

If Layer 1 fails, the request **never reaches the service** - protecting your business logic from unauthorized access attempts.

## Defining Permissions in Contracts

Permissions are declared in `@Command()` and `@Query()` decorators.

### Command with Permissions

```typescript
// File: src/contracts/commands/CreateProductCommand.ts
import { Command } from '@banyanai/platform-contract-system';

@Command({
  description: 'Create a new product',
  permissions: ['product:create']  // Layer 1 requirement
})
export class CreateProductCommand {
  name: string;
  price: number;
  categoryId: string;
  description: string;
}

export interface CreateProductResult {
  productId: string;
  name: string;
  price: number;
}
```

### Query with Permissions

```typescript
// File: src/contracts/queries/GetProductQuery.ts
import { Query } from '@banyanai/platform-contract-system';

@Query({
  description: 'Get a product by ID',
  permissions: ['product:read']  // Layer 1 requirement
})
export class GetProductQuery {
  productId: string;
}

export interface GetProductResult {
  productId: string;
  name: string;
  price: number;
  category: string;
}
```

### Multiple Permissions (ALL required)

```typescript
@Command({
  description: 'Transfer product between warehouses',
  permissions: ['product:update', 'warehouse:manage']  // User must have BOTH
})
export class TransferProductCommand {
  productId: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  quantity: number;
}
```

The gateway checks that the user has **ALL** permissions in the array.

### Public Operations (No Permissions)

```typescript
@Query({
  description: 'Public health check',
  permissions: []  // Explicitly public - no auth required
})
export class HealthCheckQuery {}
```

⚠️ **Best Practice**: Always explicitly set `permissions: []` for public endpoints. This documents intent and prevents accidental exposure.

## Permission Naming Conventions

Use a consistent naming pattern for permissions:

### Standard Format: `resource:action`

```typescript
// Resource-based permissions
'product:create'      // Create products
'product:read'        // Read products
'product:update'      // Update products
'product:delete'      // Delete products

'order:create'        // Create orders
'order:read'          // Read orders
'order:cancel'        // Cancel orders
'order:refund'        // Refund orders

'user:create'         // Create users
'user:read'           // Read users
'user:update'         // Update users
'user:delete'         // Delete users
```

### Hierarchical Permissions (Optional)

```typescript
// Service-level permissions
'product-service:admin'     // Full access to product service
'order-service:admin'       // Full access to order service

// Department-level permissions
'sales:manager'             // Sales department manager
'warehouse:operator'        // Warehouse operator

// Feature-level permissions
'reports:export'            // Export reports
'analytics:view'            // View analytics dashboard
```

### Wildcard Permissions (Implementation Dependent)

Some systems support wildcards for permission checking:

```typescript
// User has: ['product:*']
// Grants: 'product:create', 'product:read', 'product:update', 'product:delete'

// User has: ['*:read']
// Grants: 'product:read', 'order:read', 'user:read', etc.
```

⚠️ **Note**: Wildcard support depends on your permission checking implementation. The default gateway does exact string matching.

## JWT Permissions

Permissions are stored in the JWT token payload and extracted by the API Gateway.

### Token Payload with Permissions

```json
{
  "sub": "user-123",
  "email": "alice@example.com",
  "permissions": [
    "product:create",
    "product:read",
    "product:update",
    "order:read",
    "order:create"
  ],
  "iat": 1705334400,
  "exp": 1705334700
}
```

### How Permissions Get Into Tokens

Permissions are added to tokens during authentication:

```typescript
// platform/services/auth-service/src/commands/AuthenticateUserHandler.ts
async handle(command: AuthenticateUserCommand) {
  // 1. Validate credentials
  const user = await this.validateCredentials(command.email, command.password);

  // 2. Query user's permissions from database
  const permissions = await this.getUserPermissions(user);
  // Returns: ['product:create', 'product:read', ...]

  // 3. Query user's roles
  const roles = await this.getUserRoles(user);

  // 4. Generate JWT with permissions
  const tokens = await this.jwtManager.generateTokenPair({
    userId: user.id,
    email: user.email,
    permissions,  // Include in token payload
    roles,
  });

  return {
    success: true,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  };
}
```

### Permission Sources

Permissions can come from multiple sources (combined):

1. **Direct User Permissions**: Assigned directly to the user
2. **Role Permissions**: Inherited from user's roles
3. **Group Permissions**: Inherited from group membership (if implemented)

```typescript
async getUserPermissions(user: UserReadModel): Promise<string[]> {
  // Direct permissions
  const directPermissions = user.directPermissions || [];

  // Role-based permissions
  const rolePermissions: string[] = [];
  for (const roleId of user.roles || []) {
    const role = await RoleReadModel.findById(roleId);
    if (role?.permissions) {
      rolePermissions.push(...role.permissions);
    }
  }

  // Combine and deduplicate
  return Array.from(new Set([...directPermissions, ...rolePermissions]));
}
```

## Gateway Permission Checking

The API Gateway performs permission checks before routing requests.

### Check Implementation

```typescript
// platform/services/api-gateway/src/auth/JWTAuthenticationEngine.ts
checkRequirePermissionDecorator(
  contract: Contract,
  userPermissions: string[]
): AuthorizationResult {
  const requiredPermissions = contract.requiredPermissions;

  // No permissions required - allow
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return {
      authorized: true,
      requiredPermissions: [],
      userPermissions,
    };
  }

  // Check if user has ALL required permissions
  const missingPermissions = requiredPermissions.filter(
    (required) => !userPermissions.includes(required)
  );

  if (missingPermissions.length === 0) {
    // User has all required permissions
    return {
      authorized: true,
      requiredPermissions: [...requiredPermissions],
      userPermissions,
    };
  }

  // User lacks required permissions
  return {
    authorized: false,
    error: {
      type: 'insufficient_permissions',
      message: `Missing required permissions: ${missingPermissions.join(', ')}`,
      requiredPermissions: [...requiredPermissions],
      userPermissions,
    },
    requiredPermissions: [...requiredPermissions],
    userPermissions,
  };
}
```

### Error Response

When permission check fails, the gateway returns:

```json
{
  "error": {
    "type": "insufficient_permissions",
    "message": "Missing required permissions: product:create",
    "requiredPermissions": ["product:create"],
    "userPermissions": ["product:read"]
  }
}
```

HTTP Status: `403 Forbidden`

## Common Permission Patterns

### CRUD Permissions

Standard create/read/update/delete permissions:

```typescript
// Create
@Command({ permissions: ['product:create'] })
export class CreateProductCommand { ... }

// Read
@Query({ permissions: ['product:read'] })
export class GetProductQuery { ... }

// Update
@Command({ permissions: ['product:update'] })
export class UpdateProductCommand { ... }

// Delete
@Command({ permissions: ['product:delete'] })
export class DeleteProductCommand { ... }
```

### Admin Override

Admin users with special permissions that bypass normal rules:

```typescript
@Command({
  description: 'Delete any user (admin only)',
  permissions: ['user:admin']  // Higher privilege than 'user:delete'
})
export class DeleteUserCommand { ... }
```

### Read-Only Access

Users with read-only permissions:

```typescript
// All queries require only 'read' permission
@Query({ permissions: ['product:read'] })
export class GetProductQuery { ... }

@Query({ permissions: ['product:read'] })
export class ListProductsQuery { ... }

@Query({ permissions: ['product:read'] })
export class SearchProductsQuery { ... }
```

### Tiered Permissions

Different permission levels for different operations:

```typescript
// Basic tier - view only
@Query({ permissions: ['reports:view'] })
export class ViewReportQuery { ... }

// Standard tier - view and download
@Query({ permissions: ['reports:download'] })
export class DownloadReportQuery { ... }

// Premium tier - view, download, and schedule
@Command({ permissions: ['reports:schedule'] })
export class ScheduleReportCommand { ... }
```

## Testing Permission-Based Authorization

### Unit Testing Contract Permissions

```typescript
import { describe, expect, test } from '@jest/globals';
import { CreateProductCommand } from '../contracts/commands.js';
import { getContractMetadata } from '@banyanai/platform-contract-system';

describe('CreateProductCommand Permissions', () => {
  test('should require product:create permission', () => {
    const metadata = getContractMetadata(CreateProductCommand);

    expect(metadata.requiredPermissions).toContain('product:create');
  });

  test('should not allow public access', () => {
    const metadata = getContractMetadata(CreateProductCommand);

    expect(metadata.requiredPermissions.length).toBeGreaterThan(0);
  });
});
```

### Integration Testing Gateway Checks

```typescript
describe('Gateway Permission Checks', () => {
  test('should reject request with missing permissions', async () => {
    // User has only 'product:read'
    const user: AuthenticatedUser = {
      userId: 'user-123',
      permissions: ['product:read'],
      roles: ['user'],
    };

    const contract = {
      name: 'CreateProduct',
      requiredPermissions: ['product:create'],
    };

    const result = jwtEngine.checkRequirePermissionDecorator(
      contract,
      user.permissions
    );

    expect(result.authorized).toBe(false);
    expect(result.error?.type).toBe('insufficient_permissions');
  });

  test('should allow request with sufficient permissions', async () => {
    // User has required permission
    const user: AuthenticatedUser = {
      userId: 'user-123',
      permissions: ['product:read', 'product:create'],
      roles: ['user'],
    };

    const contract = {
      name: 'CreateProduct',
      requiredPermissions: ['product:create'],
    };

    const result = jwtEngine.checkRequirePermissionDecorator(
      contract,
      user.permissions
    );

    expect(result.authorized).toBe(true);
  });
});
```

### Development Testing with Headers

```bash
# Test with sufficient permissions
curl -X POST http://localhost:3000/api/create-product \
  -H "X-Dev-User-Id: alice" \
  -H "X-Dev-Permissions: product:create" \
  -H "Content-Type: application/json" \
  -d '{"name":"Widget","price":29.99}'

# Expected: 200 OK

# Test with insufficient permissions
curl -X POST http://localhost:3000/api/create-product \
  -H "X-Dev-User-Id: bob" \
  -H "X-Dev-Permissions: product:read" \
  -H "Content-Type: application/json" \
  -d '{"name":"Widget","price":29.99}'

# Expected: 403 Forbidden
# {
#   "error": {
#     "type": "insufficient_permissions",
#     "message": "Missing required permissions: product:create"
#   }
# }
```

## Security Best Practices

### 1. Always Specify Permissions Explicitly

```typescript
// ✓ GOOD: Explicit permissions (even if empty)
@Command({
  description: 'Public health check',
  permissions: []
})

// ✗ BAD: Unclear intent
@Command({
  description: 'Create user'
  // Missing permissions - bug or intentional?
})
```

### 2. Use Principle of Least Privilege

```typescript
// ✓ GOOD: Minimal permission for operation
@Query({
  permissions: ['product:read']  // Only need read access
})
export class GetProductQuery { ... }

// ✗ BAD: Excessive permission requirement
@Query({
  permissions: ['product:admin']  // Why require admin for read?
})
export class GetProductQuery { ... }
```

### 3. Separate Admin from Normal Operations

```typescript
// Normal operations
@Command({ permissions: ['product:create'] })
export class CreateProductCommand { ... }

// Administrative operations
@Command({ permissions: ['product:admin'] })
export class PurgeProductDataCommand { ... }
```

### 4. Document Permission Requirements

```typescript
/**
 * Creates a new product in the catalog.
 *
 * Required permissions:
 * - product:create - Allows creating new products
 *
 * Note: Users also need 'category:read' to validate category existence
 * (enforced at Layer 2 in handler, not Layer 1)
 */
@Command({
  description: 'Create a new product',
  permissions: ['product:create']
})
export class CreateProductCommand { ... }
```

### 5. Audit Permission Checks

```typescript
// Gateway logs all permission checks
Logger.info('Permission check', {
  user: user.userId,
  operation: contract.name,
  requiredPermissions: contract.requiredPermissions,
  userPermissions: user.permissions,
  result: authorized ? 'allowed' : 'denied',
  missingPermissions: authorized ? [] : missingPermissions,
});
```

## Common Mistakes to Avoid

### ❌ Mistake 1: Confusing Permissions with Policies

```typescript
// BAD: Trying to encode business rules in permissions
permissions: ['product:create:in-category-123']  // Too specific

// GOOD: Use Layer 1 for access, Layer 2 for business rules
permissions: ['product:create']  // Layer 1
// Then check category ownership in @RequirePolicy (Layer 2)
```

### ❌ Mistake 2: Relying Only on Layer 1

```typescript
// User has 'order:update' permission
// But Layer 1 alone doesn't check:
// - Is this the user's order?
// - Is the order in an editable state?
// - Is the update allowed at this time?

// Need Layer 2 (@RequirePolicy) for these business rules
```

### ❌ Mistake 3: Too Many Permissions Required

```typescript
// BAD: Requiring multiple permissions when one suffices
@Command({
  permissions: ['product:create', 'product:read', 'category:read']
})
export class CreateProductCommand { ... }

// GOOD: Only require what's needed at Layer 1
@Command({
  permissions: ['product:create']  // Layer 1
})
// Check category access in handler (Layer 2)
```

### ❌ Mistake 4: Hardcoding Permission Checks

```typescript
// BAD: Hardcoding in handler (bypasses Layer 1)
async handle(command: CreateProductCommand, user: AuthenticatedUser) {
  if (!user.permissions.includes('product:create')) {
    throw new Error('Insufficient permissions');
  }
  // ...
}

// GOOD: Declare in contract (Layer 1 handles it)
@Command({ permissions: ['product:create'] })
export class CreateProductCommand { ... }
```

## Troubleshooting

### Problem: "Missing required permissions" but user should have access

**Debugging steps:**

1. **Check JWT payload**:
```bash
# Decode JWT to see permissions
echo "eyJhbGc..." | base64 -d | jq .
```

2. **Verify permission name exact match**:
```typescript
// These are different:
'product:create'   // What user has
'products:create'  // What contract requires (typo!)
```

3. **Check permission query**:
```typescript
// Ensure getUserPermissions() returns correct permissions
const permissions = await getUserPermissions(user);
console.log('User permissions:', permissions);
```

### Problem: Public endpoint requires authentication

**Check contract definition**:
```typescript
// Ensure permissions is explicitly empty array
@Query({
  permissions: []  // Must be explicit
})
```

### Problem: Token has permissions but gateway still rejects

**Check token validation**:
```typescript
// Is token being validated correctly?
// Check gateway logs:
grep "JWT validation" gateway.log

// Verify permissions extraction:
grep "extractPermissionsFromClaims" gateway.log
```

## Layer 1 vs Layer 2 Decision Tree

```
Need to enforce a security rule?
│
├─ Is it about WHO can call the operation?
│  └─ Use Layer 1 (Permission-based)
│     Example: Only users with 'product:create' can create products
│
└─ Is it about WHEN/HOW the operation executes?
   └─ Use Layer 2 (Policy-based)
      Example: Users can only create products in categories they manage
```

## Next Steps

Now that you understand Layer 1 permission-based authorization:

1. **Layer 2**: Learn [policy-based authorization](./policy-based-authorization.md) for business rules
2. **RBAC**: Implement [role-based access control](./rbac.md) to manage permissions
3. **External Auth**: Integrate [external providers](./external-auth-providers.md) for SSO
4. **Testing**: Read [testing services](../service-development/testing-services.md) for security testing

## Related Guides

- [Security Overview](./overview.md) - Two-layer authorization model
- [Authentication](./authentication.md) - JWT tokens and validation
- [Policy-Based Authorization](./policy-based-authorization.md) - Layer 2 business rules
- [RBAC](./rbac.md) - Role-based permission management
- [Defining Contracts](../service-development/defining-contracts.md) - Contract system details
