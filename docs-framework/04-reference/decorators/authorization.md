---
title: Authorization Decorators
description: Complete reference for authorization decorators (@RequiresPermission, @RequirePolicy)
category: decorators
tags: [decorators, authorization, permissions, policies, security, rbac]
related:
  - ./command-handlers.md
  - ./query-handlers.md
  - ../authentication.md
difficulty: intermediate
aliases:
  - "@RequiresPermission"
  - "@RequirePolicy"
  - authorization decorators
  - permission decorators
relatedConcepts:
  - Two-layer authorization
  - Permission-based access control
  - Policy-based authorization
  - RBAC (Role-Based Access Control)
commonQuestions:
  - How do I require permissions?
  - How do I implement business policies?
  - What's the difference between permissions and policies?
  - How do I combine permissions and policies?
  - How do I handle authorization errors?
---

# Authorization Decorators

Complete reference for authorization decorators used to secure handlers in the Banyan Platform.

## Two-Layer Authorization

The platform implements two layers of authorization:

**Layer 1: Permission-Based (API Gateway)**
- Checks if user has required permissions from JWT token
- Fast, declarative checks
- Uses `@RequiresPermissions` decorator

**Layer 2: Policy-Based (Service Handlers)**
- Executes business logic to determine access
- Can access database, external services, etc.
- Uses `@RequirePolicy` decorator

## @RequiresPermissions

Declares permissions required to execute a handler (Layer 1).

### Signature

```typescript
function RequiresPermissions(permissions: string | string[]): ClassDecorator
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `permissions` | `string \| string[]` | Yes | Permission(s) required (OR logic for arrays) |

### Permission Format

```typescript
'service:action'  // Standard format
```

**Examples:**
```typescript
'users:create'       // Create users
'users:read'         // Read user data
'users:update'       // Update users
'users:delete'       // Delete users
'orders:approve'     // Approve orders
'admin:all'          // All admin permissions
```

**Validation Pattern:** `/^[a-z][a-z0-9-]*:[a-z][a-z0-9-]*$/`

### Usage

#### Single Permission

```typescript
import { CommandHandler, RequiresPermissions } from '@banyanai/platform-base-service';

@CommandHandler(CreateUserCommand)
@RequiresPermissions('users:create')
export class CreateUserHandler {
  async handle(command: CreateUserCommand, context: CommandContext): Promise<UserDto> {
    // User has 'users:create' permission
  }
}
```

#### Multiple Permissions (OR Logic)

```typescript
@CommandHandler(DeleteUserCommand)
@RequiresPermissions(['users:delete', 'admin:all'])
export class DeleteUserHandler {
  async handle(command: DeleteUserCommand, context: CommandContext): Promise<void> {
    // User has EITHER 'users:delete' OR 'admin:all' permission
  }
}
```

#### No Permissions (Public Endpoint)

```typescript
@CommandHandler(RegisterUserCommand)
// No @RequiresPermissions decorator
export class RegisterUserHandler {
  async handle(command: RegisterUserCommand, context: CommandContext): Promise<UserDto> {
    // Public endpoint - no authentication required
  }
}
```

### Permission Checking Flow

```
1. User makes request with JWT token
2. API Gateway extracts permissions from token
3. API Gateway checks if user has any of the required permissions
4. If NO match → 403 Forbidden (request rejected)
5. If YES → Forward request to service handler
```

## @RequirePolicy

Declares business policy that must be satisfied (Layer 2).

### Signature

```typescript
function RequirePolicy(policyName: string): ClassDecorator
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `policyName` | `string` | Yes | Name of the policy class |

### Policy Class Requirements

Policy classes must have a static `canExecute` method:

```typescript
class PolicyName {
  static canExecute(
    user: AuthenticatedUser,
    message: TCommand | TQuery
  ): boolean | Promise<boolean>
}
```

**AuthenticatedUser Interface:**

```typescript
interface AuthenticatedUser {
  userId: string;
  email: string;
  name: string;
  permissions: string[];
}
```

### Usage

#### Basic Policy

```typescript
// Policy class
export class UpdateOwnProfilePolicy {
  static canExecute(user: AuthenticatedUser, command: UpdateUserCommand): boolean {
    // Users can only update their own profile (unless admin)
    return user.permissions.includes('admin:all') || user.userId === command.userId;
  }
}

// Handler with policy
@CommandHandler(UpdateUserCommand)
@RequiresPermissions('users:update')
@RequirePolicy('UpdateOwnProfilePolicy')
export class UpdateUserHandler {
  async handle(command: UpdateUserCommand, context: CommandContext): Promise<UserDto> {
    // Permission check passed (Layer 1)
    // Policy check passed (Layer 2)
    // Safe to proceed
  }
}
```

#### Async Policy (Database Lookup)

```typescript
export class CanApproveOrderPolicy {
  static async canExecute(
    user: AuthenticatedUser,
    command: ApproveOrderCommand
  ): Promise<boolean> {
    // Admin can approve any order
    if (user.permissions.includes('admin:all')) {
      return true;
    }

    // Manager can approve orders in their department
    if (user.permissions.includes('orders:approve-manager')) {
      const order = await orderRepository.findById(command.orderId);
      return order.departmentId === user.departmentId;
    }

    return false;
  }
}
```

#### Complex Business Rules

```typescript
export class CreateAdminUserPolicy {
  static canExecute(user: AuthenticatedUser, command: CreateUserCommand): boolean {
    // Only admins can create admin users
    if (command.role === 'admin') {
      return user.permissions.includes('admin:all');
    }

    // Anyone with users:create can create regular users
    return true;
  }
}

@CommandHandler(CreateUserCommand)
@RequiresPermissions('users:create')
@RequirePolicy('CreateAdminUserPolicy')
export class CreateUserHandler {
  // Implementation
}
```

### Policy Checking Flow

```
1. API Gateway checks permissions (Layer 1)
2. Request sent to service via message bus
3. BaseService checks if @RequirePolicy is present
4. If present → Execute policy.canExecute(user, message)
5. If returns false → 403 Forbidden
6. If returns true → Execute handler
```

## Combining Permissions and Policies

### Pattern 1: Permission + Self-Service Policy

```typescript
export class SelfServicePolicy {
  static canExecute(user: AuthenticatedUser, command: UpdateProfileCommand): boolean {
    return user.userId === command.userId;
  }
}

@CommandHandler(UpdateProfileCommand)
@RequiresPermissions('users:update')  // User must have permission
@RequirePolicy('SelfServicePolicy')   // AND can only update own profile
export class UpdateProfileHandler {
  // Implementation
}
```

### Pattern 2: Permission + Resource Ownership

```typescript
export class OwnOrderPolicy {
  static async canExecute(
    user: AuthenticatedUser,
    query: GetOrderQuery
  ): Promise<boolean> {
    const order = await orderRepository.findById(query.orderId);
    return order.userId === user.userId;
  }
}

@QueryHandler(GetOrderQuery)
@RequiresPermissions('orders:read')
@RequirePolicy('OwnOrderPolicy')
export class GetOrderHandler {
  // Users can read orders they own
}
```

### Pattern 3: Admin Override

```typescript
export class EditOwnPostPolicy {
  static canExecute(user: AuthenticatedUser, command: EditPostCommand): boolean {
    // Admins can edit any post
    if (user.permissions.includes('admin:all')) {
      return true;
    }

    // Users can edit their own posts
    return user.userId === command.authorId;
  }
}

@CommandHandler(EditPostCommand)
@RequiresPermissions(['posts:edit', 'admin:all'])
@RequirePolicy('EditOwnPostPolicy')
export class EditPostHandler {
  // Implementation
}
```

## Complete Examples

### User Management Authorization

```typescript
// Create User - Admin only
@CommandHandler(CreateUserCommand)
@RequiresPermissions('admin:all')
export class CreateUserHandler {
  // No policy needed - simple permission check
}

// Update User - Self-service with admin override
export class UpdateOwnUserPolicy {
  static canExecute(user: AuthenticatedUser, command: UpdateUserCommand): boolean {
    return user.permissions.includes('admin:all') || user.userId === command.userId;
  }
}

@CommandHandler(UpdateUserCommand)
@RequiresPermissions('users:update')
@RequirePolicy('UpdateOwnUserPolicy')
export class UpdateUserHandler {
  // Users can update themselves, admins can update anyone
}

// Delete User - Admin only with confirmation
export class DeleteUserConfirmationPolicy {
  static canExecute(user: AuthenticatedUser, command: DeleteUserCommand): boolean {
    // Must be admin
    if (!user.permissions.includes('admin:all')) {
      return false;
    }

    // Must provide reason for deletion
    return !!command.reason;
  }
}

@CommandHandler(DeleteUserCommand)
@RequiresPermissions('admin:all')
@RequirePolicy('DeleteUserConfirmationPolicy')
export class DeleteUserHandler {
  // Admin must provide deletion reason
}

// Get User - Self-service or admin
export class ViewUserPolicy {
  static canExecute(user: AuthenticatedUser, query: GetUserQuery): boolean {
    return user.permissions.includes('admin:all') || user.userId === query.userId;
  }
}

@QueryHandler(GetUserQuery)
@RequiresPermissions('users:read')
@RequirePolicy('ViewUserPolicy')
export class GetUserHandler {
  // Users can view themselves, admins can view anyone
}
```

### Order Management Authorization

```typescript
// Place Order - Any authenticated user
@CommandHandler(PlaceOrderCommand)
@RequiresPermissions('orders:create')
export class PlaceOrderHandler {
  // Any authenticated user can place orders
}

// Approve Order - Manager of department
export class ApproveOrderDepartmentPolicy {
  static async canExecute(
    user: AuthenticatedUser,
    command: ApproveOrderCommand
  ): Promise<boolean> {
    if (user.permissions.includes('admin:all')) {
      return true;
    }

    const order = await orderRepository.findById(command.orderId);
    const userDepartment = await userRepository.getDepartment(user.userId);

    return order.departmentId === userDepartment.id &&
           user.permissions.includes('orders:approve-manager');
  }
}

@CommandHandler(ApproveOrderCommand)
@RequiresPermissions(['orders:approve-manager', 'admin:all'])
@RequirePolicy('ApproveOrderDepartmentPolicy')
export class ApproveOrderHandler {
  // Managers can approve orders in their department
}

// Cancel Order - Own orders or admin
export class CancelOwnOrderPolicy {
  static async canExecute(
    user: AuthenticatedUser,
    command: CancelOrderCommand
  ): Promise<boolean> {
    if (user.permissions.includes('admin:all')) {
      return true;
    }

    const order = await orderRepository.findById(command.orderId);
    return order.userId === user.userId && order.status === 'pending';
  }
}

@CommandHandler(CancelOrderCommand)
@RequiresPermissions(['orders:cancel', 'admin:all'])
@RequirePolicy('CancelOwnOrderPolicy')
export class CancelOrderHandler {
  // Users can cancel own pending orders, admins can cancel any
}
```

## Error Handling

### Permission Denied (Layer 1)

```typescript
// User makes request without required permission
// API Gateway response:
{
  "error": "Forbidden",
  "message": "Insufficient permissions",
  "required": ["users:create"],
  "provided": ["users:read"]
}
```

### Policy Denied (Layer 2)

```typescript
// User has permission but fails policy check
// Service response:
{
  "error": "Forbidden",
  "message": "Policy check failed: UpdateOwnUserPolicy",
  "details": "Users can only update their own profile"
}
```

## Testing

### Testing Permissions

```typescript
describe('CreateUserHandler permissions', () => {
  it('should have users:create permission requirement', () => {
    const metadata = DecoratorMetadata.getRequiredPermissions(CreateUserHandler);
    expect(metadata).toEqual(['users:create']);
  });
});
```

### Testing Policies

```typescript
describe('UpdateOwnUserPolicy', () => {
  it('should allow admin to update any user', () => {
    const user: AuthenticatedUser = {
      userId: 'admin-123',
      email: 'admin@example.com',
      name: 'Admin',
      permissions: ['admin:all']
    };

    const command: UpdateUserCommand = {
      userId: 'other-user-456',
      firstName: 'John'
    };

    expect(UpdateOwnUserPolicy.canExecute(user, command)).toBe(true);
  });

  it('should allow user to update own profile', () => {
    const user: AuthenticatedUser = {
      userId: 'user-123',
      email: 'user@example.com',
      name: 'User',
      permissions: ['users:update']
    };

    const command: UpdateUserCommand = {
      userId: 'user-123',
      firstName: 'John'
    };

    expect(UpdateOwnUserPolicy.canExecute(user, command)).toBe(true);
  });

  it('should reject user updating other profiles', () => {
    const user: AuthenticatedUser = {
      userId: 'user-123',
      email: 'user@example.com',
      name: 'User',
      permissions: ['users:update']
    };

    const command: UpdateUserCommand = {
      userId: 'other-user-456',
      firstName: 'John'
    };

    expect(UpdateOwnUserPolicy.canExecute(user, command)).toBe(false);
  });
});
```

## Best Practices

### DO:

- ✅ Use `@RequiresPermissions` for simple permission checks
- ✅ Use `@RequirePolicy` for complex business rules
- ✅ Combine both decorators when needed
- ✅ Follow `service:action` permission format
- ✅ Make policies testable (pure functions)
- ✅ Document policy business rules
- ✅ Return clear error messages

### DON'T:

- ❌ Don't skip authorization on sensitive operations
- ❌ Don't implement authorization logic in handlers
- ❌ Don't use complex logic in permission names
- ❌ Don't forget admin override in policies
- ❌ Don't make policies stateful

## Next Steps

- **[Command Handler Decorators](./command-handlers.md)** - Command handler patterns
- **[Query Handler Decorators](./query-handlers.md)** - Query handler patterns
- **[Authentication Reference](../authentication.md)** - JWT and authentication
