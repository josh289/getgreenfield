---
title: Writing Handlers
description: Learn how to write command, query, and event handlers that form the core of your microservices
category: Service Development
tags: [handlers, commands, queries, events, cqrs, business-logic]
difficulty: intermediate
last_updated: 2025-01-15
applies_to: ["v1.0.0+"]
related:
  - defining-contracts.md
  - using-service-clients.md
  - data-access-patterns.md
  - testing-services.md
---

# Writing Handlers

Handlers are the core of your service - they define how your service responds to commands, queries, and events. The platform automatically discovers handlers and generates APIs from them.

## Use This Guide If...

- You're implementing business logic for commands (write operations)
- You're creating queries to retrieve data (read operations)
- You're building event handlers to react to domain events
- You want to understand handler discovery and dependency injection
- You need to integrate cross-service communication

## Handler Types

The platform supports three types of handlers:

1. **Command Handlers**: Write operations (create, update, delete)
2. **Query Handlers**: Read operations (get, find, list, search)
3. **Event Subscription Handlers**: React to events from other services or aggregates

Each handler type has specific conventions and patterns.

## Command Handlers

Commands represent **write operations** that modify state.

### Basic Command Handler

```typescript
// File: service/src/commands/CreateUserHandler.ts
import { CommandHandler, CommandHandlerDecorator } from '@banyanai/platform-base-service';
import type { AuthenticatedUser } from '@banyanai/platform-core';
import { Logger } from '@banyanai/platform-telemetry';
import { CreateUserCommand, type CreateUserResult } from '../contracts/commands.js';

@CommandHandlerDecorator(CreateUserCommand)
export class CreateUserHandler extends CommandHandler<CreateUserCommand, CreateUserResult> {
  constructor() {
    super();
  }

  async handle(command: CreateUserCommand, user: AuthenticatedUser | null): Promise<CreateUserResult> {
    Logger.info('Creating user', { email: command.email });

    const userId = `user-${Date.now()}`;

    return {
      userId,
      email: command.email,
      createdAt: new Date().toISOString(),
    };
  }
}
```

**Automatically generates:**
- REST: `POST /api/create-user`
- GraphQL: `mutation { createUser(input: ...) { ... } }`
- Message bus: Subscribes to `CreateUserCommand`

### Command Handler with Service Clients

```typescript
import { NotificationServiceClient } from '../clients/NotificationServiceClient.js';
import { AuditServiceClient } from '../clients/AuditServiceClient.js';

@CommandHandlerDecorator(CreateUserCommand)
export class CreateUserHandler extends CommandHandler<CreateUserCommand, CreateUserResult> {
  constructor(
    private readonly notifications: NotificationServiceClient,
    private readonly audit: AuditServiceClient
  ) {
    super();
  }

  async handle(command: CreateUserCommand, user: AuthenticatedUser | null): Promise<CreateUserResult> {
    const userId = `user-${Date.now()}`;

    // Cross-service calls (automatically traced)
    await this.audit.logUserCreation(userId, command.email, user!.userId);
    await this.notifications.sendWelcomeEmail(userId, command.email);

    return { userId, email: command.email, createdAt: new Date().toISOString() };
  }
}
```

### Command Handler with Event Sourcing

```typescript
import { UserAggregate } from '../domain/UserAggregate.js';

@CommandHandlerDecorator(CreateUserCommand)
export class CreateUserHandler extends CommandHandler<CreateUserCommand, CreateUserResult> {
  constructor() {
    super();
  }

  async handle(command: CreateUserCommand, user: AuthenticatedUser | null): Promise<CreateUserResult> {
    // Create aggregate (generates domain events)
    const userAggregate = UserAggregate.create(command, user!.userId);

    // Save (publishes domain events automatically)
    await this.save(userAggregate);

    return {
      userId: userAggregate.id,
      email: command.email,
      createdAt: new Date().toISOString(),
    };
  }
}
```

## Query Handlers

Queries represent **read operations** that retrieve data from read models.

### Basic Query Handler

```typescript
// File: service/src/queries/GetUserHandler.ts
import { QueryHandler, QueryHandlerDecorator } from '@banyanai/platform-base-service';
import type { AuthenticatedUser } from '@banyanai/platform-core';
import { Logger } from '@banyanai/platform-telemetry';
import { GetUserQuery, type UserResult } from '../contracts/queries.js';
import { UserReadModel } from '../read-models/UserReadModel.js';

@QueryHandlerDecorator(GetUserQuery)
export class GetUserHandler extends QueryHandler<GetUserQuery, UserResult> {
  constructor() {
    super();
  }

  async handle(query: GetUserQuery, user: AuthenticatedUser | null): Promise<UserResult> {
    Logger.info('Getting user', { userId: query.userId });

    // Query read model using static method
    const userModel = await UserReadModel.findById<UserReadModel>(query.userId);

    if (!userModel) {
      throw new Error('User not found');
    }

    return {
      userId: userModel.id,
      email: userModel.email,
      firstName: userModel.profile.firstName,
      lastName: userModel.profile.lastName,
      createdAt: userModel.createdAt,
    };
  }
}
```

**Automatically generates:**
- REST: `GET /api/get-user?userId=123`
- GraphQL: `query { getUser(input: { userId: "123" }) { ... } }`
- Message bus: Subscribes to `GetUserQuery`

### Query Handler with Pagination

```typescript
@QueryHandlerDecorator(ListUsersQuery)
export class ListUsersHandler extends QueryHandler<ListUsersQuery, ListUsersResult> {
  constructor() {
    super();
  }

  async handle(query: ListUsersQuery, user: AuthenticatedUser | null): Promise<ListUsersResult> {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;

    // Query read model with filters
    const users = await UserReadModel.findBy<UserReadModel>({
      role: query.role,
      status: query.status,
    });

    // Apply pagination
    const start = (page - 1) * pageSize;
    const paginatedUsers = users.slice(start, start + pageSize);

    return {
      users: paginatedUsers,
      page,
      pageSize,
      totalCount: users.length,
      totalPages: Math.ceil(users.length / pageSize),
    };
  }
}
```

## Event Subscription Handlers

Event handlers **react to events** published by other services or aggregates.

**Important:** Event handlers must be in `src/subscriptions/` (NOT `src/events/`)

### Basic Event Handler

```typescript
// File: service/src/subscriptions/UserCreatedHandler.ts
import { EventSubscriptionHandler, EventHandlerDecorator } from '@banyanai/platform-base-service';
import type { AuthenticatedUser } from '@banyanai/platform-core';
import { Logger } from '@banyanai/platform-telemetry';
import { UserCreatedEvent } from '@myorg/user-service-contracts';

@EventHandlerDecorator(UserCreatedEvent)
export class UserCreatedHandler extends EventSubscriptionHandler<UserCreatedEvent> {
  constructor() {
    super();
  }

  async handle(event: UserCreatedEvent, user: AuthenticatedUser | null): Promise<void> {
    Logger.info('User created event received', {
      userId: event.userId,
      email: event.email,
    });

    // Update read models, trigger workflows, etc.
  }
}
```

**Automatically:**
- Subscribes to `UserCreatedEvent` on message bus
- Receives events when users are created
- Can push events to WebSocket subscribers
- Can trigger GraphQL subscriptions

### Event Handler with Service Clients

```typescript
import { WelcomeEmailServiceClient } from '../clients/WelcomeEmailServiceClient.js';

@EventHandlerDecorator(UserCreatedEvent)
export class UserCreatedHandler extends EventSubscriptionHandler<UserCreatedEvent> {
  constructor(
    private readonly welcomeEmail: WelcomeEmailServiceClient
  ) {
    super();
  }

  async handle(event: UserCreatedEvent, user: AuthenticatedUser | null): Promise<void> {
    // Send welcome email when user is created
    await this.welcomeEmail.sendWelcomeEmail(
      event.userId,
      event.email,
      event.firstName
    );
  }
}
```

## Handler Discovery

The platform automatically discovers handlers based on:

### 1. File Location

- **Commands**: `src/commands/`
- **Queries**: `src/queries/`
- **Events**: `src/subscriptions/` (NOT `src/events/`)

### 2. File Naming

Files must end with `Handler.ts`:
```
CreateUserHandler.ts    ✅
GetUserHandler.ts       ✅
UserCreatedHandler.ts   ✅

CreateUser.ts           ❌ Missing Handler suffix
handlers/CreateUser.ts  ❌ Wrong directory
```

### 3. Decorator

Must have appropriate decorator with **class constructor** (not string):

```typescript
@CommandHandlerDecorator(CreateUserCommand)  ✅ Class constructor
@CommandHandlerDecorator('CreateUser')       ❌ String name
```

### 4. Base Class

Must extend appropriate base class:

```typescript
export class CreateUserHandler extends CommandHandler<...>           ✅
export class GetUserHandler extends QueryHandler<...>                ✅
export class UserCreatedHandler extends EventSubscriptionHandler<...> ✅
```

## Constructor Dependency Injection

### Allowed Dependencies

```typescript
// No dependencies
constructor() {
  super();
}

// Only ServiceClient dependencies (automatically injected)
constructor(
  private readonly notifications: NotificationServiceClient,
  private readonly audit: AuditServiceClient
) {
  super();
}
```

### Not Allowed

```typescript
// ❌ Repositories (use ReadModel static methods instead)
constructor(private readonly userRepo: UserRepository) {}

// ❌ Policies (use @RequirePolicy decorator)
constructor(private readonly policy: CreateUserPolicy) {}

// ❌ Logger (use static import: Logger.info())
constructor(private readonly logger: Logger) {}

// ❌ Interfaces (use concrete ServiceClient classes)
constructor(private readonly client: INotificationClient) {}
```

## Data Access Patterns

### Reading Data (Queries)

Use ReadModel static methods:

```typescript
// Find by ID
const user = await UserReadModel.findById<UserReadModel>(userId);

// Find by criteria
const users = await UserReadModel.findBy<UserReadModel>({
  role: 'admin',
  isActive: true
});

// List all
const allUsers = await UserReadModel.list<UserReadModel>();
```

### Writing Data (Commands)

Use aggregates with event sourcing:

```typescript
// Create new aggregate
const aggregate = UserAggregate.create(command, user.userId);
await this.save(aggregate);

// Load and modify existing aggregate
const aggregate = await this.getAggregate<UserAggregate>(
  UserAggregate,
  command.userId
);
aggregate.updateEmail(command.newEmail);
await this.save(aggregate);
```

## Error Handling

```typescript
async handle(command: CreateUserCommand, user: AuthenticatedUser | null): Promise<CreateUserResult> {
  try {
    // Business logic
    return result;
  } catch (error) {
    Logger.error('Failed to create user', {
      error: error.message,
      command,
    });

    // Re-throw for platform error handling
    throw error;
  }
}
```

The platform automatically:
- Logs errors with correlation IDs
- Returns structured error responses
- Records telemetry metrics
- Rolls back transactions

## Validation

### Input Validation

```typescript
async handle(command: CreateUserCommand, user: AuthenticatedUser | null): Promise<CreateUserResult> {
  // Validate email
  if (!command.email || !command.email.includes('@')) {
    throw new Error('Invalid email address');
  }

  // Validate business rules
  if (command.age && command.age < 18) {
    throw new Error('User must be 18 or older');
  }

  // Business logic...
}
```

### Contract Validation

Define validation in contracts (see [Defining Contracts](./defining-contracts.md)):

```typescript
@Command({
  description: 'Create a new user account',
  permissions: ['users:create'],
})
export class CreateUserCommand {
  email!: string;    // Required
  age?: number;      // Optional
}
```

## Best Practices

### Command Handlers

**DO:**
- Keep handlers focused on one operation
- Use aggregates for complex business logic
- Publish domain events for side effects
- Use ServiceClients for cross-service calls

**DON'T:**
- Query data in command handlers (use event sourcing)
- Call multiple services synchronously without reason
- Handle complex orchestration (use sagas)

### Query Handlers

**DO:**
- Query read models (optimized for reads)
- Add pagination for lists
- Return only needed data
- Include user parameter for authorization context

**DON'T:**
- Modify data (queries are read-only)
- Call other services (use direct DB access)
- Include business logic (queries are data retrieval)

### Event Subscription Handlers

**DO:**
- Update read models
- Trigger workflows
- Send notifications
- Keep handlers idempotent

**DON'T:**
- Process the same event twice
- Fail silently (log errors)
- Block event processing (use async)

## Testing Handlers

```typescript
import { CreateUserHandler } from './CreateUserHandler.js';
import { CreateUserCommand } from '../contracts/commands.js';

describe('CreateUserHandler', () => {
  it('should create user successfully', async () => {
    const handler = new CreateUserHandler();
    const command = new CreateUserCommand();
    command.email = 'test@example.com';
    command.firstName = 'Test';
    command.lastName = 'User';

    const user = { userId: 'admin-123', permissions: ['users:create'] };

    const result = await handler.handle(command, user);

    expect(result.userId).toBeDefined();
    expect(result.email).toBe('test@example.com');
  });
});
```

See [Testing Services](./testing-services.md) for comprehensive testing patterns.

## Troubleshooting

### "Handler not discovered"

1. Check file is in correct directory (`src/commands/`, `src/queries/`, `src/subscriptions/`)
2. Check filename ends with `Handler.ts`
3. Check decorator is present and uses class constructor
4. Check class extends correct base class

### "Unsatisfiable parameters"

1. Use concrete ServiceClient classes (not interfaces)
2. ServiceClient class names must end with `ServiceClient`
3. Only ServiceClients allowed in constructor

### "User parameter not provided"

All handlers require the `user: AuthenticatedUser | null` parameter even if not used. This provides the authentication context for the request.

## Related Resources

- [Defining Contracts](./defining-contracts.md) - Creating type-safe service contracts
- [Using Service Clients](./using-service-clients.md) - Cross-service communication
- [Data Access Patterns](./data-access-patterns.md) - Working with aggregates and read models
- [Testing Services](./testing-services.md) - Testing strategies and patterns

---

**Next Steps:**
1. Define your service contracts
2. Implement handlers for each contract
3. Add service client dependencies as needed
4. Test your handlers thoroughly
