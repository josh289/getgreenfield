---
title: Policy-Based Authorization (Layer 2)
description: Implement Layer 2 authorization with @RequirePolicy decorator for fine-grained business rules
category: Security
tags: [authorization, policies, layer-2, business-rules, security, require-policy]
difficulty: advanced
last_updated: 2025-01-15
applies_to: ["v1.0.0+"]
related:
  - overview.md
  - permission-based-authorization.md
  - authentication.md
  - rbac.md
---

# Policy-Based Authorization (Layer 2)

This guide covers **Layer 2 authorization** - policy-based business rule enforcement within service handlers using the `@RequirePolicy` decorator.

## Use This Guide If...

- You need to enforce fine-grained business rules beyond basic permissions
- You want to check ownership, state, or contextual constraints
- You're implementing complex authorization logic
- You need to query data to make authorization decisions
- You want to separate business policies from handler logic

## Layer 2 Authorization Overview

**Layer 2** is the second line of defense in the two-layer authorization model:

- **Location**: Service handlers (distributed)
- **Timing**: AFTER Layer 1 passes, BEFORE handler execution
- **Mechanism**: `@RequirePolicy()` decorator with policy functions
- **Purpose**: Enforce dynamic, context-aware business rules
- **Question**: "Given this user and context, SHOULD this operation execute NOW?"

### How It Works

```
┌────────────────────────────────────────────────┐
│ Message arrives from API Gateway               │
│ (Layer 1 permission check already passed)     │
└────────────────┬───────────────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────────────┐
│ Service Handler - Layer 2                      │
│                                                │
│ 1. BaseService receives message                │
│                                                │
│ 2. Extract @RequirePolicy metadata            │
│    → policyFunction: (user, message) => {...} │
│                                                │
│ 3. Execute policy function with full context  │
│    → user: AuthenticatedUser                  │
│    → message: Command/Query payload           │
│                                                │
│ 4. Policy function checks business rules:     │
│    - Is user authenticated?                   │
│    - Does user own this resource?             │
│    - Is resource in valid state?              │
│    - Are temporal constraints satisfied?      │
│    - Do related resources allow this?         │
│    - Custom business logic...                 │
│                                                │
│ 5. Policy result:                             │
│    → PASS: Execute handler.handle()           │
│    → FAIL: Throw PolicyViolationError         │
└────────────────────────────────────────────────┘
```

If Layer 2 fails, the operation is rejected with a policy violation error, and `handler.handle()` is **never called**.

## The @RequirePolicy Decorator

The `@RequirePolicy` decorator attaches policy functions to handler methods.

### Basic Usage

```typescript
// File: src/commands/UpdateOrderHandler.ts
import { CommandHandler, CommandHandlerDecorator, RequirePolicy } from '@banyanai/platform-base-service';
import { PolicyViolationError, type AuthenticatedUser } from '@banyanai/platform-core';
import type { UpdateOrderCommand, UpdateOrderResult } from '../contracts/commands.js';

@CommandHandlerDecorator(UpdateOrderCommand)
export class UpdateOrderHandler extends CommandHandler\<UpdateOrderCommand, UpdateOrderResult\> {

  @RequirePolicy(async (user: AuthenticatedUser | null, command: UpdateOrderCommand) => {
    // Layer 2: Enforce business rules

    // Rule 1: User must be authenticated
    if (!user) {
      throw new PolicyViolationError(
        'UpdateOrderHandler',
        'anonymous',
        'update_order',
        'Authentication required to update orders'
      );
    }

    // Rule 2: Load order from database
    const order = await db.orders.findById(command.orderId);
    if (!order) {
      throw new PolicyViolationError(
        'UpdateOrderHandler',
        user.userId,
        'update_order',
        `Order ${command.orderId} not found`
      );
    }

    // Rule 3: User must own the order (ownership check)
    if (order.userId !== user.userId) {
      throw new PolicyViolationError(
        'UpdateOrderHandler',
        user.userId,
        'update_order',
        'You can only update your own orders'
      );
    }

    // Rule 4: Order must be in editable state (state-based check)
    const editableStates = ['pending', 'processing'];
    if (!editableStates.includes(order.status)) {
      throw new PolicyViolationError(
        'UpdateOrderHandler',
        user.userId,
        'update_order',
        `Orders in '${order.status}' status cannot be updated`
      );
    }

    // All rules passed - allow handler execution
  })
  async handle(command: UpdateOrderCommand, user: AuthenticatedUser | null): Promise\<UpdateOrderResult\> {
    // Policy already enforced - safe to execute business logic
    const order = await this.orderRepository.findById(command.orderId);

    order.updateDetails(command.updates);
    await this.orderRepository.save(order);

    return {
      orderId: order.id,
      status: order.status,
      updatedAt: new Date(),
    };
  }
}
```

### Policy Function Signature

```typescript
type PolicyFunction\<TUser, TMessage\> = (
  user: TUser,           // AuthenticatedUser | null
  message: TMessage      // Command or Query payload
) => void | Promise\<void\>;
```

**Policy functions should**:
- Throw `PolicyViolationError` if policy fails
- Throw `PolicyAuthenticationError` if user is required but null
- Return void (or Promise\<void\>) if policy passes
- NOT return boolean (throws are the signal)

## Policy Error Types

### PolicyViolationError

Used when business rules are violated:

```typescript
import { PolicyViolationError } from '@banyanai/platform-core';

throw new PolicyViolationError(
  policyName: string,      // Handler or policy name
  userId: string,          // User who violated policy
  operation: string,       // Operation being attempted
  reason: string,          // Human-readable reason
  correlationId?: string   // Optional correlation ID
);

// Example:
throw new PolicyViolationError(
  'UpdateOrderHandler',
  user.userId,
  'update_order',
  'Orders can only be updated during business hours (9am-5pm EST)'
);
```

### PolicyAuthenticationError

Used when authentication is required but missing:

```typescript
import { PolicyAuthenticationError } from '@banyanai/platform-core';

throw new PolicyAuthenticationError(
  operation: string,       // Operation requiring auth
  correlationId?: string   // Optional correlation ID
);

// Example:
if (!user) {
  throw new PolicyAuthenticationError(
    'create_product',
    command.correlationId
  );
}
```

## Common Policy Patterns

### Pattern 1: Ownership Validation

Ensure users can only access their own resources:

```typescript
@RequirePolicy(async (user: AuthenticatedUser | null, query: GetProfileQuery) => {
  if (!user) {
    throw new PolicyAuthenticationError('get_profile');
  }

  // Users can only view their own profile
  if (query.userId !== user.userId) {
    throw new PolicyViolationError(
      'GetProfileHandler',
      user.userId,
      'get_profile',
      'You can only view your own profile'
    );
  }
})
```

### Pattern 2: State-Based Constraints

Enforce operations based on resource state:

```typescript
@RequirePolicy(async (user: AuthenticatedUser | null, command: CancelOrderCommand) => {
  if (!user) {
    throw new PolicyAuthenticationError('cancel_order');
  }

  const order = await orderRepository.findById(command.orderId);

  // Can only cancel pending or processing orders
  const cancellableStates = ['pending', 'processing'];
  if (!cancellableStates.includes(order.status)) {
    throw new PolicyViolationError(
      'CancelOrderHandler',
      user.userId,
      'cancel_order',
      `Cannot cancel orders in '${order.status}' status`
    );
  }

  // Can't cancel if already shipped
  if (order.shippedAt) {
    throw new PolicyViolationError(
      'CancelOrderHandler',
      user.userId,
      'cancel_order',
      'Cannot cancel orders that have already shipped'
    );
  }
})
```

### Pattern 3: Temporal Constraints

Enforce time-based business rules:

```typescript
@RequirePolicy(async (user: AuthenticatedUser | null, command: ProcessRefundCommand) => {
  if (!user) {
    throw new PolicyAuthenticationError('process_refund');
  }

  const order = await orderRepository.findById(command.orderId);

  // 30-day refund window
  const daysSincePurchase = Math.floor(
    (Date.now() - order.purchasedAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSincePurchase > 30) {
    throw new PolicyViolationError(
      'ProcessRefundHandler',
      user.userId,
      'process_refund',
      'Refund window has expired (30 days from purchase)'
    );
  }

  // Business hours check (9am - 5pm EST)
  const now = new Date();
  const hour = now.getUTCHours() - 5; // Convert to EST
  if (hour < 9 || hour >= 17) {
    throw new PolicyViolationError(
      'ProcessRefundHandler',
      user.userId,
      'process_refund',
      'Refunds can only be processed during business hours (9am-5pm EST)'
    );
  }
})
```

### Pattern 4: Role-Based Policies

Check user roles for advanced operations:

```typescript
@RequirePolicy(async (user: AuthenticatedUser | null, command: DeleteUserCommand) => {
  if (!user) {
    throw new PolicyAuthenticationError('delete_user');
  }

  // Only admins can delete users
  if (!user.roles?.includes('admin')) {
    throw new PolicyViolationError(
      'DeleteUserHandler',
      user.userId,
      'delete_user',
      'Only administrators can delete user accounts'
    );
  }

  // Can't delete your own account
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

### Pattern 5: Relationship Validation

Check relationships between resources:

```typescript
@RequirePolicy(async (user: AuthenticatedUser | null, command: CreateProductCommand) => {
  if (!user) {
    throw new PolicyAuthenticationError('create_product');
  }

  // Check category ownership
  const category = await categoryRepository.findById(command.categoryId);
  if (!category) {
    throw new PolicyViolationError(
      'CreateProductHandler',
      user.userId,
      'create_product',
      `Category ${command.categoryId} not found`
    );
  }

  // Users can only create products in categories they manage
  if (!category.managers.includes(user.userId)) {
    throw new PolicyViolationError(
      'CreateProductHandler',
      user.userId,
      'create_product',
      'You can only create products in categories you manage'
    );
  }

  // Category must be active
  if (category.status !== 'active') {
    throw new PolicyViolationError(
      'CreateProductHandler',
      user.userId,
      'create_product',
      'Cannot create products in inactive categories'
    );
  }
})
```

### Pattern 6: Quota/Limit Enforcement

Enforce rate limits or quotas:

```typescript
@RequirePolicy(async (user: AuthenticatedUser | null, command: CreateReportCommand) => {
  if (!user) {
    throw new PolicyAuthenticationError('create_report');
  }

  // Check daily report generation limit
  const reportsToday = await reportRepository.countByUserAndDate(
    user.userId,
    new Date()
  );

  const dailyLimit = 10;
  if (reportsToday >= dailyLimit) {
    throw new PolicyViolationError(
      'CreateReportHandler',
      user.userId,
      'create_report',
      `Daily report limit reached (${dailyLimit} reports per day)`
    );
  }
})
```

### Pattern 7: Admin Override

Allow admins to bypass certain restrictions:

```typescript
@RequirePolicy(async (user: AuthenticatedUser | null, command: UpdateProductCommand) => {
  if (!user) {
    throw new PolicyAuthenticationError('update_product');
  }

  const product = await productRepository.findById(command.productId);

  // Admins can update any product
  const isAdmin = user.roles?.includes('admin');
  if (isAdmin) {
    return; // Allow
  }

  // Regular users can only update products they created
  if (product.createdBy !== user.userId) {
    throw new PolicyViolationError(
      'UpdateProductHandler',
      user.userId,
      'update_product',
      'You can only update products you created'
    );
  }

  // Regular users can only update draft products
  if (product.status !== 'draft') {
    throw new PolicyViolationError(
      'UpdateProductHandler',
      user.userId,
      'update_product',
      'Only draft products can be updated'
    );
  }
})
```

## Composing Policy Functions

Extract reusable policy logic into helper functions:

### Reusable Policy Helpers

```typescript
// File: src/policies/common-policies.ts
import { PolicyViolationError, PolicyAuthenticationError, type AuthenticatedUser } from '@banyanai/platform-core';

/**
 * Ensure user is authenticated
 */
export function requireAuthentication(
  user: AuthenticatedUser | null,
  operation: string
): asserts user is AuthenticatedUser {
  if (!user) {
    throw new PolicyAuthenticationError(operation);
  }
}

/**
 * Ensure user has specific role
 */
export function requireRole(
  user: AuthenticatedUser,
  role: string,
  handlerName: string,
  operation: string
): void {
  if (!user.roles?.includes(role)) {
    throw new PolicyViolationError(
      handlerName,
      user.userId,
      operation,
      `Role '${role}' is required for this operation`
    );
  }
}

/**
 * Ensure user owns resource
 */
export function requireOwnership(
  user: AuthenticatedUser,
  resourceOwnerId: string,
  handlerName: string,
  operation: string,
  resourceType: string
): void {
  if (resourceOwnerId !== user.userId) {
    throw new PolicyViolationError(
      handlerName,
      user.userId,
      operation,
      `You can only access your own ${resourceType}`
    );
  }
}

/**
 * Ensure resource is in allowed states
 */
export function requireState\<T extends string\>(
  currentState: T,
  allowedStates: T[],
  handlerName: string,
  userId: string,
  operation: string,
  resourceType: string
): void {
  if (!allowedStates.includes(currentState)) {
    throw new PolicyViolationError(
      handlerName,
      userId,
      operation,
      `${resourceType} must be in one of [${allowedStates.join(', ')}] states, currently '${currentState}'`
    );
  }
}
```

### Using Composed Policies

```typescript
import { requireAuthentication, requireOwnership, requireState } from '../policies/common-policies.js';

@RequirePolicy(async (user: AuthenticatedUser | null, command: UpdateOrderCommand) => {
  // Check authentication
  requireAuthentication(user, 'update_order');

  // Load order
  const order = await orderRepository.findById(command.orderId);
  if (!order) {
    throw new PolicyViolationError(
      'UpdateOrderHandler',
      user.userId,
      'update_order',
      `Order ${command.orderId} not found`
    );
  }

  // Check ownership
  requireOwnership(user, order.userId, 'UpdateOrderHandler', 'update_order', 'order');

  // Check state
  requireState(
    order.status,
    ['pending', 'processing'],
    'UpdateOrderHandler',
    user.userId,
    'update_order',
    'Order'
  );
})
```

## Policy Validation Internals

The platform automatically executes policies before handler execution.

### How PolicyValidator Works

```typescript
// platform/packages/base-service/src/authorization/PolicyValidator.ts
export class PolicyValidator {
  static async validate(
    handlerClass: new (...args: any[]) => any,
    payload: unknown,
    user: AuthenticatedUser | null,
    correlationId?: string
  ): Promise\<void\> {
    // 1. Extract @RequirePolicy metadata from handler
    const policyMetadata = MetadataReader.getPolicyMetadata(
      handlerClass.prototype,
      'handle'
    );

    // 2. No policy? Allow execution
    if (!policyMetadata) {
      return;
    }

    // 3. Execute policy function
    const policyFunction = policyMetadata.policyFunction;
    try {
      await policyFunction(user, payload);
      // Policy passed (no throw)
    } catch (error) {
      // Policy failed
      if (error instanceof PolicyViolationError || error instanceof PolicyAuthenticationError) {
        throw error; // Re-throw policy errors
      }
      // Wrap other errors as policy violations
      throw new PolicyViolationError(
        handlerClass.name,
        user?.userId || 'unknown',
        'handler_execution',
        error instanceof Error ? error.message : 'Policy validation failed',
        correlationId
      );
    }
  }
}
```

### Integration with BaseService

```typescript
// BaseService message handler (simplified)
async handleMessage(envelope: MessageEnvelope) {
  const handlerClass = this.getHandlerClass(envelope.messageType);
  const handlerInstance = this.createHandlerInstance(handlerClass);

  // Execute Layer 2 policy validation BEFORE handler
  await PolicyValidator.validate(
    handlerClass,
    envelope.payload,
    envelope.authContext,
    envelope.correlationId
  );

  // Policy passed - execute handler
  const result = await handlerInstance.handle(
    envelope.payload,
    envelope.authContext
  );

  return result;
}
```

## Testing Policy-Based Authorization

### Unit Testing Policies

```typescript
import { describe, expect, test } from '@jest/globals';
import { PolicyValidator } from '@banyanai/platform-base-service';
import { UpdateOrderHandler } from '../commands/UpdateOrderHandler.js';
import type { UpdateOrderCommand } from '../contracts/commands.js';
import type { AuthenticatedUser } from '@banyanai/platform-core';

describe('UpdateOrderHandler Policy', () => {
  test('should reject unauthenticated users', async () => {
    const command: UpdateOrderCommand = {
      orderId: 'order-123',
      updates: { quantity: 5 },
    };

    await expect(
      PolicyValidator.validate(UpdateOrderHandler, command, null)
    ).rejects.toThrow('Authentication required');
  });

  test('should reject users updating others orders', async () => {
    // Setup: Order owned by user-456
    await mockOrderRepository.create({
      id: 'order-123',
      userId: 'user-456',
      status: 'pending',
    });

    const user: AuthenticatedUser = {
      userId: 'user-789', // Different user
      permissions: ['order:update'],
      roles: ['user'],
    };

    const command: UpdateOrderCommand = {
      orderId: 'order-123',
      updates: { quantity: 5 },
    };

    await expect(
      PolicyValidator.validate(UpdateOrderHandler, command, user)
    ).rejects.toThrow('You can only update your own orders');
  });

  test('should reject updates to completed orders', async () => {
    await mockOrderRepository.create({
      id: 'order-123',
      userId: 'user-123',
      status: 'completed', // Not editable
    });

    const user: AuthenticatedUser = {
      userId: 'user-123',
      permissions: ['order:update'],
      roles: ['user'],
    };

    const command: UpdateOrderCommand = {
      orderId: 'order-123',
      updates: { quantity: 5 },
    };

    await expect(
      PolicyValidator.validate(UpdateOrderHandler, command, user)
    ).rejects.toThrow("Orders in 'completed' status cannot be updated");
  });

  test('should allow valid updates', async () => {
    await mockOrderRepository.create({
      id: 'order-123',
      userId: 'user-123',
      status: 'pending', // Editable state
    });

    const user: AuthenticatedUser = {
      userId: 'user-123', // Owner
      permissions: ['order:update'],
      roles: ['user'],
    };

    const command: UpdateOrderCommand = {
      orderId: 'order-123',
      updates: { quantity: 5 },
    };

    // Should not throw
    await expect(
      PolicyValidator.validate(UpdateOrderHandler, command, user)
    ).resolves.not.toThrow();
  });
});
```

### Integration Testing

```typescript
describe('UpdateOrder Complete Flow', () => {
  test('should enforce Layer 2 policy in full flow', async () => {
    // Setup order owned by different user
    await orderRepository.create({
      id: 'order-123',
      userId: 'user-456',
      status: 'pending',
    });

    const user: AuthenticatedUser = {
      userId: 'user-789',
      permissions: ['order:update'], // Has Layer 1 permission
      roles: ['user'],
    };

    const command: UpdateOrderCommand = {
      orderId: 'order-123',
      updates: { quantity: 5 },
    };

    // Layer 1 would pass (user has 'order:update' permission)
    // But Layer 2 should reject (not owner)
    const handler = new UpdateOrderHandler();
    await expect(
      handler.handle(command, user)
    ).rejects.toThrow('You can only update your own orders');
  });
});
```

## Security Best Practices

### 1. Always Check Authentication First

```typescript
// ✓ GOOD: Check auth first
@RequirePolicy(async (user, command) => {
  if (!user) {
    throw new PolicyAuthenticationError('operation_name');
  }
  // ... business rules
})

// ✗ BAD: Might leak information before auth check
@RequirePolicy(async (user, command) => {
  const resource = await db.find(command.id); // Leaks existence
  if (!user) {
    throw new PolicyAuthenticationError('operation_name');
  }
})
```

### 2. Fail Securely (Deny by Default)

```typescript
// ✓ GOOD: Explicit allow after all checks
@RequirePolicy(async (user, command) => {
  if (!user) throw new PolicyAuthenticationError('op');
  if (condition1) throw new PolicyViolationError(...);
  if (condition2) throw new PolicyViolationError(...);
  // All checks passed - implicit allow
})

// ✗ BAD: Could accidentally allow
@RequirePolicy(async (user, command) => {
  if (user && someCondition) {
    return; // Allow
  }
  // What if someCondition is false? Silently allows!
})
```

### 3. Avoid Information Leakage

```typescript
// ✗ BAD: Reveals resource existence to unauthorized users
throw new PolicyViolationError(
  'Handler',
  user.userId,
  'operation',
  `Order ${order.id} belongs to user ${order.userId}` // Leaks data
);

// ✓ GOOD: Generic message
throw new PolicyViolationError(
  'Handler',
  user.userId,
  'operation',
  'You can only access your own orders' // No data leak
);
```

### 4. Audit Policy Decisions

```typescript
@RequirePolicy(async (user, command) => {
  if (!user) {
    Logger.warn('Policy rejected: authentication required', {
      operation: 'update_order',
      orderId: command.orderId,
    });
    throw new PolicyAuthenticationError('update_order');
  }

  const order = await orderRepository.findById(command.orderId);
  if (order.userId !== user.userId) {
    Logger.warn('Policy rejected: ownership violation', {
      operation: 'update_order',
      orderId: command.orderId,
      userId: user.userId,
      ownerId: order.userId,
    });
    throw new PolicyViolationError(...);
  }

  Logger.info('Policy allowed', {
    operation: 'update_order',
    orderId: command.orderId,
    userId: user.userId,
  });
})
```

### 5. Use Type Safety

```typescript
// ✓ GOOD: Type-safe policy function
@RequirePolicy\<UpdateOrderCommand\>(async (
  user: AuthenticatedUser | null,
  command: UpdateOrderCommand  // Typed payload
) => {
  // TypeScript ensures command has correct shape
  const orderId = command.orderId; // ✓ Type-safe
})

// ✗ BAD: Losing type safety
@RequirePolicy(async (user: any, command: any) => {
  const orderId = command.orderId; // No type checking
})
```

## Common Mistakes to Avoid

### ❌ Mistake 1: Mixing Layer 1 and Layer 2 Concerns

```typescript
// BAD: Checking static permissions in Layer 2
@RequirePolicy(async (user, command) => {
  if (!user.permissions.includes('order:update')) {
    throw new PolicyViolationError(...); // This is Layer 1's job!
  }
})

// GOOD: Let Layer 1 handle permissions
@Command({ permissions: ['order:update'] }) // Layer 1
export class UpdateOrderCommand { ... }

@RequirePolicy(async (user, command) => {
  // Only check business rules (Layer 2)
  const order = await db.find(command.orderId);
  if (order.userId !== user.userId) {
    throw new PolicyViolationError(...);
  }
})
```

### ❌ Mistake 2: Returning Boolean Instead of Throwing

```typescript
// BAD: Returning false doesn't signal failure correctly
@RequirePolicy(async (user, command) => {
  if (!user) {
    return false; // Doesn't work!
  }
})

// GOOD: Throw to signal failure
@RequirePolicy(async (user, command) => {
  if (!user) {
    throw new PolicyAuthenticationError('operation');
  }
})
```

### ❌ Mistake 3: Not Handling Async Operations

```typescript
// BAD: Forgetting await
@RequirePolicy(async (user, command) => {
  const order = orderRepository.findById(command.orderId); // Missing await!
  if (!order) { ... } // Always falsy (Promise object)
})

// GOOD: Await async operations
@RequirePolicy(async (user, command) => {
  const order = await orderRepository.findById(command.orderId);
  if (!order) { ... }
})
```

### ❌ Mistake 4: Duplicating Policy Logic in Handler

```typescript
// BAD: Checking same thing twice
@RequirePolicy(async (user, command) => {
  const order = await db.find(command.orderId);
  if (order.userId !== user.userId) throw new PolicyViolationError(...);
})
async handle(command, user) {
  const order = await db.find(command.orderId);
  if (order.userId !== user.userId) throw new Error(...); // Duplicate!
}

// GOOD: Trust that policy already checked
@RequirePolicy(async (user, command) => {
  const order = await db.find(command.orderId);
  if (order.userId !== user.userId) throw new PolicyViolationError(...);
})
async handle(command, user) {
  // Policy guaranteed to have passed - no need to recheck
  const order = await db.find(command.orderId);
  // ... business logic
}
```

## Next Steps

Now that you understand Layer 2 policy-based authorization:

1. **RBAC**: Learn [role-based access control](./rbac.md) patterns
2. **External Auth**: Integrate [external providers](./external-auth-providers.md)
3. **Testing**: Read [testing services](../service-development/testing-services.md)
4. **Handlers**: Review [writing handlers](../service-development/writing-handlers.md)

## Related Guides

- [Security Overview](./overview.md) - Two-layer authorization model
- [Permission-Based Authorization](./permission-based-authorization.md) - Layer 1 at API Gateway
- [Authentication](./authentication.md) - JWT tokens and validation
- [RBAC](./rbac.md) - Role-based access control
- [Writing Handlers](../service-development/writing-handlers.md) - Handler patterns
