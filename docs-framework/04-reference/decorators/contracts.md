---
title: Contract Decorators
description: Complete reference for contract decorators (@Command, @Query, @DomainEvent, @Field, @Sensitive)
category: decorators
tags: [decorators, contracts, commands, queries, events, typescript]
related:
  - ./command-handlers.md
  - ./query-handlers.md
  - ./event-handlers.md
  - ../platform-packages/contract-system.md
difficulty: beginner
aliases:
  - "@Command"
  - "@Query"
  - "@DomainEvent"
  - "@Sensitive"
  - contract decorators
relatedConcepts:
  - Type-safe contracts
  - CQRS pattern
  - Domain events
  - Permission-based authorization
  - Data validation
commonQuestions:
  - How do I create a command?
  - How do I create a query?
  - How do I create a domain event?
  - How do I mark sensitive fields?
  - What permissions format should I use?
---

# Contract Decorators

Complete reference for decorators used to define contracts (commands, queries, and domain events) in the Banyan Platform.

## Overview

Contract decorators mark classes as messages that flow through the platform. They enable:

- **Type Safety**: Compile-time validation of message structure
- **Permission Embedding**: Declarative permission requirements
- **Automatic Discovery**: Platform discovers and registers contracts
- **Self-Documentation**: Contracts describe their purpose and requirements

## @Command

Marks a class as a command contract. Commands represent state-changing operations.

### Signature

```typescript
function Command(options: CommandOptions): ClassDecorator
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `options` | `CommandOptions` | Yes | Command configuration |

### CommandOptions

```typescript
interface CommandOptions {
  description: string;           // Command description
  permissions: string[];         // Required permissions (service:action format)
}
```

### Usage

#### Basic Command

```typescript
import { Command } from '@banyanai/platform-contract-system';

@Command({
  description: 'Create a new user account',
  permissions: ['users:create']
})
export class CreateUserCommand {
  email!: string;
  firstName!: string;
  lastName?: string;
  role?: 'admin' | 'user';
}
```

#### Multiple Permissions (OR Logic)

```typescript
@Command({
  description: 'Delete a user account',
  permissions: ['users:delete', 'admin:all']  // Either permission works
})
export class DeleteUserCommand {
  userId!: string;
  reason?: string;
}
```

#### Public Command (No Permissions)

```typescript
@Command({
  description: 'Register a new user (public endpoint)',
  permissions: []  // No authentication required
})
export class RegisterUserCommand {
  email!: string;
  password!: string;
  acceptTerms!: boolean;
}
```

#### Command with TypeScript Types

```typescript
@Command({
  description: 'Update user profile',
  permissions: ['users:update']
})
export class UpdateUserCommand {
  userId!: string;

  // Optional fields
  email?: string;
  firstName?: string;
  lastName?: string;

  // Enum/Union types
  status?: 'active' | 'inactive' | 'suspended';

  // Nested objects
  address?: {
    street: string;
    city: string;
    country: string;
  };

  // Arrays
  tags?: string[];
}
```

### Permission Format

Permissions follow the `service:action` pattern:

```typescript
'users:create'       // Create users
'users:read'         // Read user data
'users:update'       // Update users
'users:delete'       // Delete users
'orders:approve'     // Approve orders
'admin:all'          // All admin permissions
'reports:generate'   // Generate reports
```

**Pattern Validation:**

```typescript
// Valid permissions
'users:create' ✅
'order-management:approve' ✅
'api-keys:revoke' ✅

// Invalid permissions
'CreateUser' ❌         // Missing colon
'users' ❌              // Missing action
'Users:Create' ❌       // Uppercase not allowed
'users:create:all' ❌   // Multiple colons
```

## @Query

Marks a class as a query contract. Queries represent read-only operations that don't modify state.

### Signature

```typescript
function Query(options: QueryOptions): ClassDecorator
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `options` | `QueryOptions` | Yes | Query configuration |

### QueryOptions

```typescript
interface QueryOptions {
  description: string;           // Query description
  permissions: string[];         // Required permissions
}
```

### Usage

#### Basic Query

```typescript
import { Query } from '@banyanai/platform-contract-system';

@Query({
  description: 'Get user by ID',
  permissions: ['users:read']
})
export class GetUserQuery {
  userId!: string;
}
```

#### Query with Multiple Parameters

```typescript
@Query({
  description: 'Search users by criteria',
  permissions: ['users:read']
})
export class SearchUsersQuery {
  // Search criteria
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: 'admin' | 'user';
  status?: 'active' | 'inactive';

  // Pagination
  page?: number;
  pageSize?: number;

  // Sorting
  sortBy?: 'email' | 'firstName' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
```

#### Public Query

```typescript
@Query({
  description: 'Get public product catalog',
  permissions: []  // Public endpoint
})
export class GetProductCatalogQuery {
  category?: string;
  page?: number;
  pageSize?: number;
}
```

#### Query with Complex Filtering

```typescript
@Query({
  description: 'Get user orders with filters',
  permissions: ['orders:read']
})
export class GetUserOrdersQuery {
  userId!: string;

  // Date range
  startDate?: Date;
  endDate?: Date;

  // Status filters
  statuses?: ('pending' | 'completed' | 'cancelled')[];

  // Amount range
  minAmount?: number;
  maxAmount?: number;

  // Pagination
  cursor?: string;
  limit?: number;
}
```

## @DomainEvent

Marks a class as a domain event. Domain events represent something that happened in the system.

### Signature

```typescript
function DomainEvent(
  eventName: string,
  options?: DomainEventOptions
): ClassDecorator
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `eventName` | `string` | Yes | Event name (e.g., 'UserCreated') |
| `options` | `DomainEventOptions` | No | Event configuration |

### DomainEventOptions

```typescript
interface DomainEventOptions {
  broadcast?: boolean;      // Broadcast to all services (default: false)
  description?: string;     // Event description
}
```

### Usage

#### Basic Domain Event

```typescript
import { DomainEvent } from '@banyanai/platform-contract-system';

@DomainEvent('UserCreated')
export class UserCreatedEvent {
  userId!: string;
  email!: string;
  firstName!: string;
  lastName?: string;
  createdAt!: Date;
}
```

#### Broadcast Event

```typescript
@DomainEvent('OrderPlaced', {
  broadcast: true,  // Notify all services
  description: 'Triggered when a new order is placed'
})
export class OrderPlacedEvent {
  orderId!: string;
  userId!: string;
  items!: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  totalAmount!: number;
  placedAt!: Date;
}
```

#### Event with Description

```typescript
@DomainEvent('UserProfileUpdated', {
  description: 'Triggered when user profile information changes'
})
export class UserProfileUpdatedEvent {
  userId!: string;
  changes!: {
    field: string;
    oldValue: unknown;
    newValue: unknown;
  }[];
  updatedAt!: Date;
}
```

#### Event for Event Sourcing

```typescript
@DomainEvent('InventoryAdjusted')
export class InventoryAdjustedEvent {
  // Event sourcing metadata (handled by platform)
  aggregateId!: string;
  aggregateType!: string;
  sequence!: number;

  // Event data
  productId!: string;
  previousQuantity!: number;
  newQuantity!: number;
  reason!: string;
  adjustedAt!: Date;
}
```

#### Lifecycle Events

```typescript
@DomainEvent('UserAccountDeleted', {
  broadcast: true,
  description: 'Triggered when user account is permanently deleted'
})
export class UserAccountDeletedEvent {
  userId!: string;
  email!: string;
  deletedAt!: Date;
  deletedBy!: string;
  reason?: string;
}
```

## @Sensitive

Marks a property as sensitive so it's redacted in logs and telemetry.

### Signature

```typescript
function Sensitive(): PropertyDecorator
```

### Parameters

None.

### Usage

#### Sensitive Field in Command

```typescript
import { Command, Sensitive } from '@banyanai/platform-contract-system';

@Command({
  description: 'User login',
  permissions: []
})
export class LoginCommand {
  email!: string;

  @Sensitive()  // Redacted in logs
  password!: string;
}

// Logged as: { email: 'user@example.com', password: '[REDACTED]' }
```

#### Multiple Sensitive Fields

```typescript
@Command({
  description: 'Create payment method',
  permissions: ['payments:create']
})
export class CreatePaymentMethodCommand {
  userId!: string;

  @Sensitive()
  cardNumber!: string;

  @Sensitive()
  cvv!: string;

  @Sensitive()
  cardholderName!: string;

  expiryMonth!: number;
  expiryYear!: number;
}
```

#### Sensitive Fields in Events

```typescript
@DomainEvent('UserRegistered', {
  broadcast: true
})
export class UserRegisteredEvent {
  userId!: string;
  email!: string;

  @Sensitive()
  initialPassword!: string;  // Temporary password sent via email

  registeredAt!: Date;
}
```

#### Sensitive Nested Data

```typescript
@Command({
  description: 'Update user settings',
  permissions: ['users:update']
})
export class UpdateUserSettingsCommand {
  userId!: string;

  // Entire object marked as sensitive
  @Sensitive()
  apiCredentials?: {
    apiKey: string;
    apiSecret: string;
  };

  // Individual fields marked sensitive
  preferences?: {
    theme: string;

    @Sensitive()
    privateNotes?: string;
  };
}
```

## Complete Examples

### User Management Contracts

```typescript
import { Command, Query, DomainEvent, Sensitive } from '@banyanai/platform-contract-system';

// Commands
@Command({
  description: 'Create a new user account',
  permissions: ['users:create']
})
export class CreateUserCommand {
  email!: string;

  @Sensitive()
  password!: string;

  firstName!: string;
  lastName?: string;
  role?: 'admin' | 'user';
}

@Command({
  description: 'Update user profile',
  permissions: ['users:update']
})
export class UpdateUserCommand {
  userId!: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

@Command({
  description: 'Change user password',
  permissions: ['users:update']
})
export class ChangePasswordCommand {
  userId!: string;

  @Sensitive()
  currentPassword!: string;

  @Sensitive()
  newPassword!: string;
}

// Queries
@Query({
  description: 'Get user by ID',
  permissions: ['users:read']
})
export class GetUserQuery {
  userId!: string;
}

@Query({
  description: 'List all users',
  permissions: ['users:read']
})
export class ListUsersQuery {
  page?: number;
  pageSize?: number;
  role?: 'admin' | 'user';
  status?: 'active' | 'inactive';
}

// Domain Events
@DomainEvent('UserCreated', {
  broadcast: true,
  description: 'New user account created'
})
export class UserCreatedEvent {
  userId!: string;
  email!: string;
  firstName!: string;
  lastName?: string;
  role!: string;
  createdAt!: Date;
}

@DomainEvent('UserUpdated')
export class UserUpdatedEvent {
  userId!: string;
  changes!: Record<string, unknown>;
  updatedAt!: Date;
}

@DomainEvent('PasswordChanged')
export class PasswordChangedEvent {
  userId!: string;
  changedAt!: Date;
  changedBy!: string;
}
```

### E-Commerce Contracts

```typescript
// Order Commands
@Command({
  description: 'Place a new order',
  permissions: ['orders:create']
})
export class PlaceOrderCommand {
  userId!: string;
  items!: Array<{
    productId: string;
    quantity: number;
  }>;
  shippingAddress!: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  paymentMethodId!: string;
}

@Command({
  description: 'Cancel an order',
  permissions: ['orders:cancel']
})
export class CancelOrderCommand {
  orderId!: string;
  reason?: string;
}

// Order Queries
@Query({
  description: 'Get order by ID',
  permissions: ['orders:read']
})
export class GetOrderQuery {
  orderId!: string;
}

@Query({
  description: 'Get user orders',
  permissions: ['orders:read']
})
export class GetUserOrdersQuery {
  userId!: string;
  status?: 'pending' | 'completed' | 'cancelled';
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
}

// Order Events
@DomainEvent('OrderPlaced', {
  broadcast: true,
  description: 'New order placed'
})
export class OrderPlacedEvent {
  orderId!: string;
  userId!: string;
  totalAmount!: number;
  items!: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;
  placedAt!: Date;
}

@DomainEvent('OrderShipped', {
  broadcast: true
})
export class OrderShippedEvent {
  orderId!: string;
  trackingNumber!: string;
  carrier!: string;
  shippedAt!: Date;
}

@DomainEvent('OrderCancelled')
export class OrderCancelledEvent {
  orderId!: string;
  cancelledAt!: Date;
  reason?: string;
}
```

## Metadata Retrieval

Access decorator metadata programmatically:

```typescript
import 'reflect-metadata';
import { METADATA_KEYS } from '@banyanai/platform-contract-system';

// Get command metadata
const commandMetadata = Reflect.getMetadata(
  METADATA_KEYS.COMMAND,
  CreateUserCommand
);
console.log(commandMetadata);
// {
//   description: 'Create a new user account',
//   permissions: ['users:create'],
//   type: 'command'
// }

// Get query metadata
const queryMetadata = Reflect.getMetadata(
  METADATA_KEYS.QUERY,
  GetUserQuery
);

// Get domain event metadata
const eventMetadata = Reflect.getMetadata(
  METADATA_KEYS.DOMAIN_EVENT,
  UserCreatedEvent
);
console.log(eventMetadata);
// {
//   eventName: 'UserCreated',
//   broadcast: true,
//   description: 'New user account created',
//   type: 'domain_event'
// }

// Get sensitive fields
const sensitiveFields: string[] = Reflect.getMetadata(
  METADATA_KEYS.SENSITIVE,
  LoginCommand.prototype
);
console.log(sensitiveFields);  // ['password']
```

## Best Practices

### DO:

- ✅ Use descriptive contract names (`CreateUserCommand`, not `UserCommand`)
- ✅ Always include description in contract decorators
- ✅ Follow `service:action` permission format
- ✅ Mark all sensitive data with `@Sensitive()`
- ✅ Use TypeScript types for type safety (enums, unions, interfaces)
- ✅ Keep contracts simple and focused (single responsibility)
- ✅ Export contracts for use by other services
- ✅ Use optional fields (`?`) for optional data
- ✅ Use broadcast events sparingly (only for critical system-wide events)

### DON'T:

- ❌ Don't put business logic in contract classes
- ❌ Don't use uppercase in permission names (`users:Create` ❌)
- ❌ Don't forget to mark passwords/secrets as `@Sensitive()`
- ❌ Don't create contracts for internal operations (use direct calls)
- ❌ Don't mix commands and queries (keep them separate)
- ❌ Don't use generic contract names (`DataCommand`, `GetQuery`)
- ❌ Don't include methods in contract classes (data only)
- ❌ Don't broadcast every event (causes unnecessary overhead)

## Validation

Contracts are validated at multiple levels:

### Compile-Time Validation

TypeScript ensures type safety:

```typescript
@Command({
  description: 'Create user',
  permissions: ['users:create']
})
export class CreateUserCommand {
  email!: string;
  age!: number;
}

// Compile error: Type 'string' is not assignable to type 'number'
const cmd = new CreateUserCommand();
cmd.email = 'user@example.com';
cmd.age = 'twenty-five';  // ❌ Compile error
```

### Runtime Permission Validation

Platform validates permission format at startup:

```typescript
@Command({
  description: 'Invalid permissions',
  permissions: ['CreateUser']  // ❌ Invalid format
})
export class InvalidCommand {}

// Platform throws error on service startup:
// Error: Invalid permission format 'CreateUser'. Must be 'service:action'
```

### Contract Validation

Platform validates contract structure:

```typescript
// Missing required fields
@Command({
  description: '',  // ❌ Empty description
  permissions: []
})
export class EmptyDescCommand {}

// Invalid event name
@DomainEvent('')  // ❌ Empty event name
export class EmptyEventNameEvent {}
```

## Testing

### Unit Testing Contracts

```typescript
describe('CreateUserCommand', () => {
  it('should create instance with required fields', () => {
    const cmd = new CreateUserCommand();
    cmd.email = 'user@example.com';
    cmd.password = 'secret';
    cmd.firstName = 'John';

    expect(cmd.email).toBe('user@example.com');
    expect(cmd.firstName).toBe('John');
  });

  it('should have correct metadata', () => {
    const metadata = Reflect.getMetadata(
      METADATA_KEYS.COMMAND,
      CreateUserCommand
    );

    expect(metadata.description).toBe('Create a new user account');
    expect(metadata.permissions).toEqual(['users:create']);
    expect(metadata.type).toBe('command');
  });

  it('should mark password as sensitive', () => {
    const sensitiveFields = Reflect.getMetadata(
      METADATA_KEYS.SENSITIVE,
      CreateUserCommand.prototype
    );

    expect(sensitiveFields).toContain('password');
  });
});
```

## Next Steps

- **[Command Handler Decorators](./command-handlers.md)** - Implement command handlers
- **[Query Handler Decorators](./query-handlers.md)** - Implement query handlers
- **[Event Handler Decorators](./event-handlers.md)** - Subscribe to domain events
- **[Contract System Package](../platform-packages/contract-system.md)** - Full contract system API
