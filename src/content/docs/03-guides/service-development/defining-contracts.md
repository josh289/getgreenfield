---
title: Defining Contracts
description: Create type-safe service contracts that automatically generate REST, GraphQL, and message bus endpoints
category: Service Development
tags: [contracts, api, commands, queries, events, type-safety]
difficulty: beginner
last_updated: 2025-01-15
applies_to: ["v1.0.0+"]
related:
  - writing-handlers.md
  - using-service-clients.md
  - testing-services.md
---

# Defining Contracts

Service contracts define the interface between your service and the outside world. The platform automatically generates REST, GraphQL, and message bus endpoints from contract definitions.

## Use This Guide If...

- You're creating a new microservice and need to define its API
- You want to understand how contracts become APIs
- You need to add permissions to your endpoints
- You're defining commands, queries, or events for your service
- You want compile-time type safety for your service APIs

## Quick Example

```typescript
// packages/contracts/src/commands.ts
import { Command } from '@banyanai/platform-contract-system';

@Command({
  description: 'Create a new user account',
  permissions: ['users:create']
})
export class CreateUserCommand {
  email!: string;
  firstName!: string;
  lastName!: string;
}

export interface CreateUserResult {
  userId: string;
  email: string;
  createdAt: string;
}
```

**Automatically generates:**
- REST: `POST /api/create-user`
- GraphQL: `mutation { createUser(input: ...) { ... } }`
- Message bus: Contract routing with permission validation
- JSON Schema: For input validation

## Contract Types

### Commands

**Commands represent write operations** - create, update, delete, process.

```typescript
import { Command } from '@banyanai/platform-contract-system';

@Command({
  description: 'Create a new order',
  permissions: ['orders:create']
})
export class CreateOrderCommand {
  customerId!: string;
  items!: OrderItem[];
  totalAmount!: number;
}

export interface CreateOrderResult {
  orderId: string;
  status: string;
  createdAt: string;
}

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}
```

### Queries

**Queries represent read operations** - get, find, list, search.

```typescript
import { Query } from '@banyanai/platform-contract-system';

@Query({
  description: 'Retrieve user by ID',
  permissions: ['users:read']
})
export class GetUserQuery {
  userId!: string;
}

export interface UserResult {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}
```

### Events

**Events represent things that happened** - UserCreated, OrderShipped, PaymentProcessed.

```typescript
import { DomainEvent } from '@banyanai/platform-contract-system';

@DomainEvent('User.Events.UserCreated', {
  broadcast: true,
  description: 'User account was created'
})
export class UserCreatedEvent {
  userId!: string;
  email!: string;
  createdAt!: string;
}
```

## Decorator Options

### Command Decorator

```typescript
@Command({
  description: string;       // Human-readable description (required)
  permissions: string[];     // Required permissions (required, can be empty)
})
```

**Example:**
```typescript
@Command({
  description: 'Update product information',
  permissions: ['products:update']
})
export class UpdateProductCommand {
  productId!: string;
  name?: string;
  price?: number;
}
```

### Query Decorator

```typescript
@Query({
  description: string;       // Human-readable description (required)
  permissions: string[];     // Required permissions (required, can be empty)
})
```

**Example:**
```typescript
@Query({
  description: 'List orders with pagination',
  permissions: ['orders:read']
})
export class ListOrdersQuery {
  page?: number;
  pageSize?: number;
  status?: string;
}
```

### Event Decorator

```typescript
@DomainEvent(name: string, options?: {
  broadcast?: boolean;       // Broadcast to WebSocket/GraphQL subscriptions
  description?: string;      // Human-readable description
})
```

**Example:**
```typescript
@DomainEvent('Notification.Events.NotificationSent', {
  broadcast: true,
  description: 'Notification was sent to user'
})
export class NotificationSentEvent {
  notificationId!: string;
  userId!: string;
  channel!: 'email' | 'sms' | 'push';
  sentAt!: string;
}
```

## Input and Output Schemas

### Input Schema (Command/Query)

The class definition IS the input schema:

```typescript
@Command({
  description: 'Create user',
  permissions: ['users:create']
})
export class CreateUserCommand {
  // All properties define the input schema
  email!: string;           // Required string
  firstName!: string;       // Required string
  lastName!: string;        // Required string
  age?: number;             // Optional number
  role?: 'admin' | 'user';  // Optional enum
}
```

**Generated JSON schema:**
```json
{
  "type": "object",
  "properties": {
    "email": { "type": "string" },
    "firstName": { "type": "string" },
    "lastName": { "type": "string" },
    "age": { "type": "number" },
    "role": { "type": "string", "enum": ["admin", "user"] }
  },
  "required": ["email", "firstName", "lastName"]
}
```

### Output Schema (Result Interface)

Export an interface for the result:

```typescript
export interface CreateUserResult {
  userId: string;
  email: string;
  createdAt: string;
}
```

Handler returns this interface:

```typescript
@CommandHandlerDecorator(CreateUserCommand)
export class CreateUserHandler extends CommandHandler<CreateUserCommand, CreateUserResult> {
  async handle(command: CreateUserCommand, user: AuthenticatedUser | null): Promise<CreateUserResult> {
    return {
      userId: 'user-123',
      email: command.email,
      createdAt: new Date().toISOString()
    };
  }
}
```

## Permission Validation

### Required Permissions

Declared in contract decorator:

```typescript
@Command({
  description: 'Permanently delete order',
  permissions: ['orders:delete', 'admin:all']  // User needs EITHER permission
})
export class DeleteOrderCommand {
  orderId!: string;
}
```

**Platform validates at API Gateway (Layer 1):**
- Extracts user permissions from JWT token
- Checks if user has ANY of the required permissions
- Rejects request if no matching permissions
- Creates message if validation passes

### Multiple Permissions (OR Logic)

```typescript
@Command({
  description: 'Generate financial report',
  permissions: [
    'reports:generate',
    'finance:admin',
    'admin:all'
  ]
})
export class GenerateReportCommand {
  reportType!: string;
}
```

**User needs ANY of:**
- `reports:generate`
- `finance:admin`
- `admin:all`

### No Permissions (Public)

```typescript
@Query({
  description: 'Health check endpoint',
  permissions: []  // No authentication required
})
export class GetHealthQuery {}
```

## Contract Broadcasting

### Automatic Broadcasting

When your service starts:

```typescript
await BaseService.start({
  name: 'user-service',
  version: '1.0.0'
});
```

**Platform automatically:**
1. Discovers all contracts in packages/contracts
2. Generates JSON schemas from TypeScript types
3. Broadcasts contracts to service discovery
4. Registers with API Gateway
5. Updates routing tables

**Log output:**
```
Contract broadcast complete: 3 contracts
- User.Commands.CreateUser
- User.Queries.GetUser
- User.Events.UserCreated
```

## Type Safety

### Compile-Time Validation

Handler and contract types must match:

```typescript
@Command({
  description: 'Create user',
  permissions: ['users:create']
})
export class CreateUserCommand {
  email!: string;
  name!: string;
}

// ✅ Correct - types match
@CommandHandlerDecorator(CreateUserCommand)
export class CreateUserHandler extends CommandHandler<CreateUserCommand, CreateUserResult> {
  async handle(command: CreateUserCommand, user: AuthenticatedUser | null): Promise<CreateUserResult> {
    // TypeScript knows command.email and command.name exist
    return { userId: '123', email: command.email };
  }
}

// ❌ Compile error - wrong command type
@CommandHandlerDecorator(UpdateUserCommand)
export class CreateUserHandler extends CommandHandler<CreateUserCommand, CreateUserResult> {
  // Error: Decorator argument doesn't match handler type
}
```

### Runtime Validation

Platform validates incoming requests:

```typescript
// Invalid request (missing required field)
POST /api/create-user
{
  "email": "test@example.com"
  // Missing: firstName, lastName
}

// Platform responds
{
  "error": "ValidationError",
  "message": "Missing required fields: firstName, lastName",
  "fields": ["firstName", "lastName"]
}
```

## Best Practices

### Naming Conventions

**DO:**
```typescript
// Use descriptive names
export class CreateUserCommand {}
export class GetUserQuery {}
export class UserCreatedEvent {}

// Use PascalCase
export class UpdateProductCommand {}
export class SearchOrdersQuery {}
```

**DON'T:**
```typescript
// Vague names
export class UserCommand {}
export class DataQuery {}

// Wrong casing
export class create_user_command {}
export class get-user-query {}
```

### Contract Organization

**DO:**
```
packages/
├── contracts/
│   ├── src/
│   │   ├── commands.ts      # All commands
│   │   ├── queries.ts       # All queries
│   │   ├── events.ts        # All events
│   │   └── index.ts         # Re-export all
│   └── package.json
```

**DON'T:**
```
packages/
├── contracts/
│   ├── src/
│   │   ├── CreateUserCommand.ts      # One file per contract
│   │   ├── GetUserQuery.ts
│   │   ├── UserCreatedEvent.ts
```

### Required vs Optional Fields

**DO:**
```typescript
export class CreateUserCommand {
  email!: string;         // Required (!)
  firstName!: string;     // Required (!)
  lastName!: string;      // Required (!)
  age?: number;           // Optional (?)
}
```

**DON'T:**
```typescript
export class CreateUserCommand {
  email: string;          // ❌ Not explicitly required or optional
  firstName: string | undefined;  // ❌ Verbose
}
```

### Result Interfaces

**DO:**
```typescript
// Simple interface for results
export interface CreateUserResult {
  userId: string;
  email: string;
  createdAt: string;
}
```

**DON'T:**
```typescript
// Complex classes for results
export class CreateUserResult {
  constructor(
    public userId: string,
    public email: string,
    public createdAt: string
  ) {}

  toJSON() { /* ... */ }
}
```

## Advanced Patterns

### Nested Objects

```typescript
@Command({
  description: 'Create order with items',
  permissions: ['orders:create']
})
export class CreateOrderCommand {
  customerId!: string;
  items!: OrderItem[];           // Array of objects
  shippingAddress!: Address;     // Nested object
}

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}
```

### Enums and Union Types

```typescript
@Command({
  description: 'Update user role',
  permissions: ['users:update-role']
})
export class UpdateUserRoleCommand {
  userId!: string;
  role!: 'admin' | 'manager' | 'user';  // Union type
  status!: UserStatus;                   // Enum
}

enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended'
}
```

### Optional Fields for Updates

```typescript
@Command({
  description: 'Update user information',
  permissions: ['users:update']
})
export class UpdateUserCommand {
  userId!: string;           // Required
  firstName?: string;        // Optional - only update if provided
  lastName?: string;         // Optional
  email?: string;            // Optional
}
```

## Complete Example

```typescript
// packages/contracts/src/commands.ts
import { Command } from '@banyanai/platform-contract-system';

@Command({
  description: 'Create a new product',
  permissions: ['products:create']
})
export class CreateProductCommand {
  name!: string;
  description!: string;
  price!: number;
  categoryId!: string;
}

export interface CreateProductResult {
  productId: string;
  name: string;
  createdAt: string;
}

@Command({
  description: 'Update product information',
  permissions: ['products:update']
})
export class UpdateProductCommand {
  productId!: string;
  name?: string;
  description?: string;
  price?: number;
}

export interface UpdateProductResult {
  productId: string;
  updatedFields: string[];
  updatedAt: string;
}
```

```typescript
// packages/contracts/src/queries.ts
import { Query } from '@banyanai/platform-contract-system';

@Query({
  description: 'Retrieve product by ID',
  permissions: ['products:read']
})
export class GetProductQuery {
  productId!: string;
}

export interface ProductResult {
  productId: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
}

@Query({
  description: 'List products with pagination',
  permissions: ['products:read']
})
export class ListProductsQuery {
  page?: number;
  pageSize?: number;
  categoryId?: string;
}

export interface ListProductsResult {
  products: ProductResult[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
```

```typescript
// packages/contracts/src/events.ts
import { DomainEvent } from '@banyanai/platform-contract-system';

@DomainEvent('Product.Events.ProductCreated', {
  broadcast: true,
  description: 'Product was created'
})
export class ProductCreatedEvent {
  productId!: string;
  name!: string;
  price!: number;
  createdAt!: string;
}

@DomainEvent('Product.Events.ProductUpdated', {
  broadcast: true,
  description: 'Product was updated'
})
export class ProductUpdatedEvent {
  productId!: string;
  updatedFields!: string[];
  updatedAt!: string;
}
```

```typescript
// packages/contracts/src/index.ts
export * from './commands.js';
export * from './queries.js';
export * from './events.js';
```

## Troubleshooting

### "Contract not found"

1. Check contract is exported from `packages/contracts/src/index.ts`
2. Check decorator is present (`@Command`, `@Query`, or `@DomainEvent`)
3. Check service broadcast contracts on startup
4. Verify service discovery is running

### "Handler not discovered"

1. Check handler decorator references correct contract class
2. Check handler is in correct directory
3. Check handler filename ends with `Handler.ts`

### "Type mismatch"

1. Check handler type parameter matches contract class
2. Check result interface matches handler return type

## Related Resources

- [Writing Handlers](./writing-handlers.md) - Implementing contract handlers
- [Using Service Clients](./using-service-clients.md) - Calling other service contracts
- [Testing Services](./testing-services.md) - Testing contracts and handlers

---

**Next Steps:**
1. Create your contract package structure
2. Define commands, queries, and events
3. Implement handlers for each contract
4. Test your contracts thoroughly
