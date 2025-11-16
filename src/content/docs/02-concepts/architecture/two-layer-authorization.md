---
title: "Two-Layer Authorization"
description: "Permission-based authorization at API Gateway (Layer 1) and policy-based authorization at handlers (Layer 2)"
category: "concepts"
tags: ["architecture", "security", "authorization"]
difficulty: "intermediate"
related_concepts:
  - "platform-overview.md"
  - "api-gateway.md"
prerequisites:
  - "platform-overview.md"
last_updated: "2025-01-15"
status: "published"
---

# Two-Layer Authorization

> **Core Idea:** Separate coarse-grained permission checks (who can call this?) at API Gateway from fine-grained policy checks (does this specific request meet business rules?) at service handlers.

## Overview

The two-layer authorization architecture provides defense-in-depth security by enforcing authorization at two distinct points:

- **Layer 1 (API Gateway)**: Permission-based - "Can this user call CreateOrder at all?"
- **Layer 2 (Service Handler)**: Policy-based - "Can this user create an order for THIS specific customer with THESE items?"

This separation enables consistent permission enforcement across all protocols (REST, GraphQL, WebSocket) while allowing services to implement domain-specific authorization logic.

## The Problem

Traditional authorization mixes permission and policy checks inconsistently:

### Example Scenario

```typescript
// Traditional approach - authorization scattered
app.post('/orders', authenticate, async (req, res) => {
  // Problem 1: Permission check at route level only
  if (!req.user.hasPermission('orders:create')) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  // Problem 2: Business rule check mixed with infrastructure
  if (req.body.userId !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Cannot create order for another user' });
  }

  // Problem 3: What about GraphQL? WebSocket? Must duplicate logic
  // Problem 4: No consistent audit trail
  // Problem 5: Testing requires mocking HTTP request objects
});
```

**Why This Matters:**
- Authorization logic duplicated across protocols
- Permission and policy checks mixed together
- Difficult to audit who can do what
- Testing complicated by HTTP dependencies

## The Solution

Two distinct authorization layers with clear responsibilities:

### Core Principles

1. **Layer 1 (Gateway)**: Who can call what? (Permissions)
2. **Layer 2 (Handler)**: Does this specific request meet business rules? (Policies)
3. **Protocol Independence**: Layer 1 enforces same permissions for all protocols
4. **Explicit Contracts**: Permissions declared in contract decorators
5. **Audit Trail**: Both layers logged with correlation IDs

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Request                        │
│  POST /orders { userId: "123", items: [...] }               │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ 1. JWT Token
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Layer 1: API Gateway                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Permission-Based Authorization                        │ │
│  │                                                        │ │
│  │  • Extract user from JWT                              │ │
│  │  • Check user.permissions includes 'orders:create'     │ │
│  │  • If NO: Return 403 Forbidden                        │ │
│  │  • If YES: Forward to service                         │ │
│  │                                                        │ │
│  │  Questions answered:                                   │ │
│  │  ✓ Can this user call CreateOrder at all?            │ │
│  │  ✗ Can they create order for THIS customer?          │ │
│  │  ✗ Can they order THESE specific items?              │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ 2. Send via Message Bus
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Layer 2: Service Handler                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Policy-Based Authorization                            │ │
│  │                                                        │ │
│  │  • Business Rule: Users can only create orders for    │ │
│  │    themselves (unless admin)                          │ │
│  │  • Business Rule: Items must be in stock              │ │
│  │  • Business Rule: User credit limit not exceeded      │ │
│  │                                                        │ │
│  │  if (command.userId !== user.id && !user.isAdmin) {   │ │
│  │    throw new ForbiddenError(...);                     │ │
│  │  }                                                     │ │
│  │                                                        │ │
│  │  Questions answered:                                   │ │
│  │  ✓ Can they create order for THIS customer?          │ │
│  │  ✓ Can they order THESE specific items?              │ │
│  │  ✓ Does this meet business rules?                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Implementation in the Platform

### Layer 1: Permission-Based (API Gateway)

```typescript
// contracts/CreateOrderContract.ts
import { Contract } from '@banyanai/platform-contract-system';

@Contract({
  name: 'CreateOrder',
  requiredPermissions: ['orders:create']  // Layer 1 permission
})
export class CreateOrderContract {
  constructor(
    public readonly userId: string,
    public readonly items: OrderItem[]
  ) {}
}

// API Gateway automatically enforces permission check
class ProtocolTranslator {
  async handleRequest(req, res) {
    const user = await this.authTranslator.extractUser(req);
    const contract = this.findContract(req.path);

    // Automatic permission check
    if (!this.hasRequiredPermissions(user, contract.requiredPermissions)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Missing required permission: orders:create'
      });
    }

    // Permission granted, forward to service
    await this.messageBus.send(contract, req.body);
  }
}
```

### Layer 2: Policy-Based (Service Handler)

```typescript
// commands/CreateOrderHandler.ts
import { CommandHandler } from '@banyanai/platform-cqrs';

@CommandHandler(CreateOrderContract)
export class CreateOrderHandler {
  async handle(command: CreateOrderCommand, context: ExecutionContext) {
    const user = context.user;

    // Layer 2: Business policy checks
    // Policy: Users can only create orders for themselves (unless admin)
    if (command.userId !== user.id && !user.hasRole('admin')) {
      throw new ForbiddenError(
        'You can only create orders for yourself',
        { userId: command.userId, requestingUser: user.id }
      );
    }

    // Policy: Check credit limit
    const creditCheck = await this.creditService.checkLimit(
      command.userId,
      command.total
    );
    if (!creditCheck.approved) {
      throw new CreditLimitExceededError(
        'Order exceeds credit limit',
        { limit: creditCheck.limit, requested: command.total }
      );
    }

    // Policies passed, create order
    const order = await this.orderRepository.create(command);
    return { orderId: order.id };
  }
}
```

**Key Points:**
- Layer 1: Simple permission check (orders:create)
- Layer 2: Complex business rules (credit limit, ownership)
- Same Layer 1 for REST, GraphQL, WebSocket
- Layer 2 protocol-independent

## Benefits and Trade-offs

### Benefits

- **Defense in Depth**: Two authorization checks catch different scenarios
- **Protocol Independence**: Same permission checks for all protocols
- **Clear Separation**: Permissions vs policies cleanly separated
- **Testability**: Business policies testable without HTTP mocking
- **Audit Trail**: Both layers logged with correlation IDs
- **Explicit Contracts**: Required permissions visible in contract

### Trade-offs

- **Two Checks**: Slight performance overhead (~1-2ms)
- **Learning Curve**: Developers must understand both layers
- **Potential Duplication**: Simple policies might duplicate permission checks

## Real-World Examples

### Example 1: User Management

```typescript
// Layer 1: Can user call UpdateUser?
@Contract({
  requiredPermissions: ['users:update']
})
export class UpdateUserContract { ... }

// Layer 2: Can user update THIS specific user?
@CommandHandler(UpdateUserContract)
export class UpdateUserHandler {
  async handle(command: UpdateUserCommand, context: ExecutionContext) {
    // Policy: Users can update themselves, admins can update anyone
    if (command.userId !== context.user.id && !context.user.isAdmin) {
      throw new ForbiddenError('You can only update your own profile');
    }

    // Policy: Non-admins cannot change roles
    if (command.role && !context.user.isAdmin) {
      throw new ForbiddenError('Only admins can change user roles');
    }

    await this.userRepository.update(command);
  }
}
```

### Example 2: Multi-Tenant Access

```typescript
// Layer 1: Can user access tenant data?
@Contract({
  requiredPermissions: ['tenants:read']
})
export class GetTenantDataContract { ... }

// Layer 2: Can user access THIS tenant's data?
@QueryHandler(GetTenantDataContract)
export class GetTenantDataHandler {
  async handle(query: GetTenantDataQuery, context: ExecutionContext) {
    // Policy: Users can only access their own tenant
    if (query.tenantId !== context.user.tenantId) {
      throw new ForbiddenError('Cannot access other tenant data');
    }

    return await this.tenantRepository.getData(query.tenantId);
  }
}
```

## Related Concepts

- [Platform Overview](platform-overview.md)
- [API Gateway](api-gateway.md)
- [Contract System](../../04-reference/platform-packages/contract-system.md)

## Best Practices

1. **Keep Layer 1 Simple**
   - Use coarse-grained permissions: `orders:create`, not `orders:create:customer:123`
   - RBAC (Role-Based Access Control) at Layer 1

2. **Implement Complex Rules at Layer 2**
   - Business policies belong in handlers
   - Use domain language for errors

3. **Design Consistent Permission Naming**
   - Format: `resource:action` (e.g., `orders:create`, `users:update`)
   - Use plural resources: `orders`, not `order`

4. **Log Both Layers**
   - Layer 1 denials: Permission missing
   - Layer 2 denials: Policy violation
   - Include correlation ID for audit trail

## Further Reading

### Internal Resources
- [Authorization Guide](../../03-guides/security/authorization.md)
- [Contract System](../../04-reference/platform-packages/contract-system.md)

### External Resources
- [NIST RBAC Model](https://csrc.nist.gov/projects/role-based-access-control)
- [OAuth 2.0 Scopes](https://oauth.net/2/scope/)

## Glossary

**Permission**: Coarse-grained capability (e.g., "can create orders").

**Policy**: Fine-grained business rule (e.g., "can create order for this specific user").

**RBAC**: Role-Based Access Control - permissions assigned via roles.

**Defense in Depth**: Multiple layers of security checks.
