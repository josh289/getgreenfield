---
title: Security Architecture Overview
description: Understanding the two-layer authorization model and security architecture in banyan-core
category: Security
tags: [security, authorization, authentication, two-layer-auth, architecture]
difficulty: intermediate
last_updated: 2025-01-15
applies_to: ["v1.0.0+"]
related:
  - authentication.md
  - permission-based-authorization.md
  - policy-based-authorization.md
  - rbac.md
  - external-auth-providers.md
---

# Security Architecture Overview

This guide explains the comprehensive security architecture in banyan-core, including the critical **two-layer authorization model** that separates permission-based access control from business policy enforcement.

## Use This Guide If...

- You're designing security for a new microservice
- You need to understand when to use Layer 1 vs Layer 2 authorization
- You're implementing authentication flows
- You want to understand the complete request security lifecycle
- You're integrating external identity providers

## Security Model Philosophy

The banyan-core platform implements a **defense-in-depth** security model with multiple layers of protection:

1. **Layer 0: Transport Security** - TLS/HTTPS encryption (infrastructure)
2. **Layer 1: Permission-Based Authorization** - WHO can call WHAT (API Gateway)
3. **Layer 2: Policy-Based Authorization** - WHEN and HOW operations can execute (Service Handlers)
4. **Layer 3: Data Security** - Field-level encryption, audit logging (application)

This guide focuses on **Layers 1 and 2** - the two-layer authorization model.

## Two-Layer Authorization Model

### Why Two Layers?

Traditional authorization often conflates two separate concerns:
- **Access Control**: Can this user call this operation at all?
- **Business Rules**: Should this operation execute given the current context?

Mixing these concerns leads to:
- Repeated authorization logic across services
- Tight coupling between services and auth systems
- Difficulty testing business rules independently
- Complex authorization code scattered throughout handlers

The two-layer model **separates these concerns** for cleaner architecture.

### Layer 1: Permission-Based Authorization (API Gateway)

**Location**: API Gateway (before message creation)
**Purpose**: Enforce WHO can call WHAT operations
**Mechanism**: `@Command()` and `@Query()` decorator permissions
**Technology**: JWT token validation + permission checking

```typescript
// In contract definition
@Command({
  description: 'Create a new product',
  permissions: ['product:create']  // Layer 1 requirement
})
export class CreateProductCommand {
  name: string;
  price: number;
}
```

**Layer 1 Flow:**
1. Client sends request with JWT token
2. API Gateway validates JWT signature
3. Gateway extracts permissions from token
4. Gateway checks contract's `permissions` array
5. If user lacks required permission → **403 Forbidden** (request rejected)
6. If user has permission → Route to service via message bus

**Characteristics:**
- Happens at gateway (centralized)
- Fast permission checking
- Based on static permissions in JWT
- No business context awareness
- Prevents unauthorized requests from reaching services

### Layer 2: Policy-Based Authorization (Service Handlers)

**Location**: Service handlers (during message processing)
**Purpose**: Enforce WHEN and HOW operations can execute
**Mechanism**: `@RequirePolicy()` decorator + business logic
**Technology**: Custom policy functions with business context

```typescript
// In handler implementation
@CommandHandlerDecorator(CreateProductCommand)
export class CreateProductHandler extends CommandHandler<...> {
  @RequirePolicy(async (user, command) => {
    // Layer 2: Business rules
    if (!user) {
      throw new Error('Authentication required');
    }

    // Can only create products in categories you manage
    const userManagesCategory = await checkCategoryOwnership(
      user.userId,
      command.categoryId
    );

    if (!userManagesCategory) {
      throw new PolicyViolationError(
        'CreateProductHandler',
        user.userId,
        'category_ownership',
        'You can only create products in categories you manage'
      );
    }
  })
  async handle(command: CreateProductCommand, user: AuthenticatedUser | null) {
    // Business logic here - policy already enforced
  }
}
```

**Layer 2 Flow:**
1. Message arrives from gateway (Layer 1 passed)
2. BaseService extracts `@RequirePolicy` metadata
3. Platform executes policy function with user + message
4. If policy fails → Throw `PolicyViolationError` (operation rejected)
5. If policy passes → Execute `handler.handle()`

**Characteristics:**
- Happens in service (distributed)
- Context-aware business rules
- Access to full message payload
- Can query other services/databases
- Enforces temporal, ownership, state-based constraints

## Comparison: Layer 1 vs Layer 2

| Aspect | Layer 1 (Permission) | Layer 2 (Policy) |
|--------|---------------------|------------------|
| **Location** | API Gateway | Service Handler |
| **Timing** | Before message creation | During message processing |
| **Decorator** | `@Command()` / `@Query()` | `@RequirePolicy()` |
| **Checks** | Static permissions | Dynamic business rules |
| **Context** | JWT claims only | Full message + database access |
| **Speed** | Very fast | May require queries |
| **Purpose** | Coarse-grained access control | Fine-grained business rules |
| **Examples** | "user:create", "order:read" | "Can only edit own orders", "Must be draft status" |

## Complete Request Security Flow

Let's trace a complete request through both security layers:

```
┌─────────────────────────────────────────────────────────────────┐
│ CLIENT REQUEST                                                   │
│ POST /api/create-product                                        │
│ Authorization: Bearer eyJhbGc...                                │
│ { "name": "Widget", "categoryId": "cat-123" }                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 0: TRANSPORT SECURITY                                     │
│ ✓ TLS encryption verified                                       │
│ ✓ HTTPS connection established                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 1: PERMISSION-BASED AUTHORIZATION (API Gateway)           │
│                                                                  │
│ 1. Extract JWT from Authorization header                        │
│ 2. Validate JWT signature (JWKS or shared secret)              │
│ 3. Check expiry (exp claim)                                     │
│ 4. Extract user permissions from token                          │
│    → permissions: ["product:read", "product:create"]           │
│                                                                  │
│ 5. Load contract for CreateProductCommand                       │
│    → requiredPermissions: ["product:create"]                   │
│                                                                  │
│ 6. Check: Does user have "product:create"?                     │
│    → YES ✓ Continue to service                                 │
│    → NO  ✗ Return 403 Forbidden (request never reaches service)│
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ MESSAGE BUS                                                      │
│ Publishes CreateProductCommand to product-service queue         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 2: POLICY-BASED AUTHORIZATION (Service Handler)           │
│                                                                  │
│ 1. BaseService receives message from queue                      │
│ 2. BaseService extracts @RequirePolicy metadata                │
│ 3. Execute policy function:                                     │
│    async (user, command) => {                                   │
│      // Business rule: Must be authenticated                    │
│      if (!user) throw PolicyAuthenticationError();             │
│                                                                  │
│      // Business rule: Category must exist                      │
│      const category = await db.findCategory(command.categoryId);│
│      if (!category) throw PolicyViolationError();              │
│                                                                  │
│      // Business rule: Must manage this category                │
│      if (!category.managers.includes(user.userId)) {           │
│        throw PolicyViolationError('Not category manager');     │
│      }                                                          │
│                                                                  │
│      // Business rule: Category must be active                  │
│      if (category.status !== 'active') {                       │
│        throw PolicyViolationError('Category inactive');        │
│      }                                                          │
│    }                                                            │
│                                                                  │
│ 4. Policy passed? Execute handler.handle()                     │
│    Policy failed? Return error (operation rejected)             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ BUSINESS LOGIC EXECUTION                                         │
│ - Create Product aggregate                                       │
│ - Apply business rules                                           │
│ - Emit domain events                                             │
│ - Save to event store                                            │
└─────────────────────────────────────────────────────────────────┘
```

## When to Use Each Layer

### Use Layer 1 (Permission-Based) When:

✓ Enforcing **coarse-grained access control**
✓ Checking **static permissions** (create, read, update, delete)
✓ Need to **reject requests early** before they reach services
✓ Permission is based **only on user identity**, not context
✓ Want **centralized permission management**

**Examples:**
- "Can this user create products at all?"
- "Does this user have read access to orders?"
- "Is this user allowed to delete categories?"

### Use Layer 2 (Policy-Based) When:

✓ Enforcing **fine-grained business rules**
✓ Checking **contextual constraints** (ownership, state, time)
✓ Need to **query data** to make authorization decision
✓ Rules depend on **current system state**
✓ Want **domain-specific authorization logic**

**Examples:**
- "Can this user edit THIS SPECIFIC order?" (ownership)
- "Can products be created in THIS category?" (state-based)
- "Is it currently allowed to process returns?" (temporal)
- "Does this user manage the category they're creating in?" (relationship)

## Security Best Practices

### 1. Always Use Both Layers

Every operation should have Layer 1 permissions, even if it's just an empty array for public endpoints.

```typescript
// GOOD: Explicit about permissions
@Command({
  description: 'Public health check',
  permissions: []  // Explicitly public
})
export class HealthCheckCommand {}

// BAD: Unclear if permissions were forgotten
@Command({
  description: 'Create product'
  // Missing permissions - is this a bug?
})
```

### 2. Layer 1 Protects Against Brute Force

Layer 1 prevents unauthorized users from flooding your services with invalid requests.

```typescript
// Without Layer 1, attackers could send millions of invalid requests
// to your service, causing:
// - Database load from policy checks
// - Service degradation
// - Log spam

// With Layer 1, invalid requests are rejected at the gateway
// before consuming service resources
```

### 3. Layer 2 Enforces Business Integrity

Layer 1 alone is insufficient for complex business rules.

```typescript
// Layer 1: User has "order:update" permission ✓
// But Layer 2 enforces:
// - Can only update own orders (ownership)
// - Can only update pending orders (state)
// - Can only update during business hours (temporal)
// - Can only update if inventory available (consistency)
```

### 4. Fail Securely

Both layers should fail closed (deny by default).

```typescript
// GOOD: Explicit denial
@RequirePolicy(async (user, command) => {
  if (!user) {
    throw new PolicyAuthenticationError(...);
  }
  // ... business rules
})

// BAD: Silent failure
@RequirePolicy(async (user, command) => {
  if (user) {
    // Only check if user exists - silently allows if no user
  }
})
```

### 5. Audit Both Layers

Log authorization decisions at both layers for security monitoring.

```typescript
// Layer 1 logs in API Gateway
Logger.info('Permission check', {
  user: user.userId,
  operation: 'CreateProduct',
  requiredPermissions: ['product:create'],
  userPermissions: user.permissions,
  result: 'allowed'
});

// Layer 2 logs in service
Logger.info('Policy check', {
  user: user.userId,
  handler: 'CreateProductHandler',
  policyName: 'CreateProductBusinessRules',
  result: 'allowed',
  context: { categoryId: command.categoryId }
});
```

## Authentication vs Authorization

**Authentication**: WHO are you?
**Authorization**: WHAT can you do?

The platform separates these concerns:

| Concern | Component | Responsibility |
|---------|-----------|---------------|
| **Authentication** | Auth Service | Validate credentials, issue JWT tokens |
| **Authorization Layer 1** | API Gateway | Check JWT permissions against contract requirements |
| **Authorization Layer 2** | Service Handlers | Enforce business policies with full context |

See [authentication.md](./authentication.md) for authentication details.

## Common Security Mistakes

### ❌ Mistake 1: Only Using Layer 1

```typescript
// User has "order:update" permission
// But no checks for:
// - Is this their order?
// - Is the order in an editable state?
// - Are they allowed to change this specific field?

// Result: Authorization bypass via permission escalation
```

### ❌ Mistake 2: Only Using Layer 2

```typescript
// No Layer 1 permissions
// Result: Attackers can flood service with requests
// Even if Layer 2 rejects them, it still consumes resources
```

### ❌ Mistake 3: Confusing Validation with Authorization

```typescript
// VALIDATION: Is the data well-formed?
if (!command.email.includes('@')) {
  throw new ValidationError('Invalid email format');
}

// AUTHORIZATION: Is the user allowed to perform this action?
if (!user.permissions.includes('user:create')) {
  throw new AuthorizationError('Insufficient permissions');
}

// Don't mix these - they serve different purposes
```

### ❌ Mistake 4: Hardcoding Permissions

```typescript
// BAD: Hardcoded permission check
if (user.permissions.includes('admin')) {
  // allow
}

// GOOD: Use Layer 1 contract permissions + Layer 2 policies
@Command({ permissions: ['user:delete'] })
// ... handler with @RequirePolicy for business rules
```

## Development vs Production Security

### Development Mode

```typescript
// Enable development auth bypass (local testing only)
DEVELOPMENT_AUTH_ENABLED=true

// Send requests with dev headers (no JWT needed)
X-Dev-User-Id: test-user-123
X-Dev-Permissions: product:create,product:read
```

⚠️ **WARNING**: NEVER enable `DEVELOPMENT_AUTH_ENABLED` in production!

### Production Mode

```typescript
// Production requires real JWT validation
JWT_SECRET=<secure-random-secret>
# OR
JWKS_URI=https://your-identity-provider.com/.well-known/jwks.json
JWT_ISSUER=https://your-identity-provider.com/
JWT_AUDIENCE=https://your-api.com

// Development mode automatically disabled
DEVELOPMENT_AUTH_ENABLED=false  # or omit entirely
```

## Production Security Checklist

Before deploying to production, verify:

- [ ] `DEVELOPMENT_AUTH_ENABLED` is NOT set (or explicitly false)
- [ ] `JWT_SECRET` is cryptographically random (32+ characters)
- [ ] JWKS_URI uses HTTPS (never HTTP)
- [ ] All contracts have explicit permissions (even `[]` for public)
- [ ] Critical operations have Layer 2 policies
- [ ] Authorization failures are logged for monitoring
- [ ] Token expiry is configured appropriately (5-15 minutes)
- [ ] Refresh tokens are implemented for session management
- [ ] TLS/HTTPS is enforced for all endpoints
- [ ] Security headers are configured (HSTS, CSP, etc.)

## Next Steps

Now that you understand the two-layer authorization model:

1. **Authentication**: Learn how to implement [JWT authentication](./authentication.md)
2. **Layer 1**: Implement [permission-based authorization](./permission-based-authorization.md)
3. **Layer 2**: Add [policy-based authorization](./policy-based-authorization.md)
4. **RBAC**: Configure [role-based access control](./rbac.md)
5. **External Auth**: Integrate [external auth providers](./external-auth-providers.md)

## Related Guides

- [Authentication](./authentication.md) - JWT tokens, validation, development mode
- [Permission-Based Authorization](./permission-based-authorization.md) - Layer 1 implementation
- [Policy-Based Authorization](./policy-based-authorization.md) - Layer 2 with @RequirePolicy
- [RBAC](./rbac.md) - Role-based access control patterns
- [External Auth Providers](./external-auth-providers.md) - Auth0, Okta, OIDC integration
- [Writing Handlers](../service-development/writing-handlers.md) - Handler implementation patterns
- [Defining Contracts](../service-development/defining-contracts.md) - Contract permissions
