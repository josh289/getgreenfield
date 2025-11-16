---
title: Data Access Patterns
description: Work with event sourcing, aggregates, and read models in a CQRS architecture
category: Service Development
tags: [cqrs, event-sourcing, aggregates, read-models, database, data-access]
difficulty: advanced
last_updated: 2025-01-15
applies_to: ["v1.0.0+"]
related:
  - writing-handlers.md
  - defining-contracts.md
  - testing-services.md
---

# Data Access Patterns

The Banyan Platform uses event sourcing for commands and read models for queries, implementing the CQRS (Command Query Responsibility Segregation) pattern.

## Use This Guide If...

- You need to persist data in command handlers
- You're implementing event-sourced aggregates
- You need to query data efficiently in query handlers
- You want to understand the CQRS pattern in practice
- You're building read model projections from events

## Quick Example

```typescript
// Command Handler - Event Sourcing
@CommandHandlerDecorator(CreateUserCommand)
export class CreateUserHandler extends CommandHandler<CreateUserCommand, CreateUserResult> {
  async handle(command: CreateUserCommand, user: AuthenticatedUser | null): Promise<CreateUserResult> {
    // Create aggregate
    const userAggregate = UserAggregate.create(command, user!.userId);

    // Save (publishes domain events)
    await this.save(userAggregate);

    return {
      userId: userAggregate.id,
      email: command.email,
      createdAt: new Date().toISOString()
    };
  }
}

// Query Handler - Read Model
@QueryHandlerDecorator(GetUserQuery)
export class GetUserHandler extends QueryHandler<GetUserQuery, GetUserResult> {
  async handle(query: GetUserQuery, user: AuthenticatedUser | null): Promise<GetUserResult> {
    // Query read model using static method
    const userModel = await UserReadModel.findById<UserReadModel>(query.userId);

    if (!userModel) {
      throw new Error('User not found');
    }

    return {
      userId: userModel.id,
      email: userModel.email,
      // Map other fields...
    };
  }
}
```

## CQRS Pattern

### Command Side (Write)

Commands modify state using event sourcing:

```
1. Command received
2. Load aggregate from event store
3. Execute business logic on aggregate
4. Aggregate generates domain events
5. Save events to event store
6. Publish events to message bus
7. Event handlers update read models
```

### Query Side (Read)

Queries read from optimized read models:

```
1. Query received
2. Query read model (denormalized data)
3. Return result
```

## Event Sourcing with Aggregates

### Defining an Aggregate

```typescript
import { AggregateRoot } from '@banyanai/platform-event-sourcing';
import { UserCreatedEvent, UserUpdatedEvent } from './events';

export class UserAggregate extends AggregateRoot {
  public email!: string;
  public firstName!: string;
  public lastName!: string;
  public createdBy!: string;

  // Factory method to create new aggregate
  static create(command: CreateUserCommand, createdBy: string): UserAggregate {
    const aggregate = new UserAggregate();
    aggregate.id = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Apply event
    const event = new UserCreatedEvent();
    event.userId = aggregate.id;
    event.email = command.email;
    event.firstName = command.firstName;
    event.lastName = command.lastName;
    event.createdBy = createdBy;
    event.createdAt = new Date().toISOString();

    aggregate.apply(event);
    return aggregate;
  }

  // Business logic method
  updateProfile(firstName: string, lastName: string): void {
    if (firstName === this.firstName && lastName === this.lastName) {
      return; // No changes
    }

    const event = new UserUpdatedEvent();
    event.userId = this.id;
    event.firstName = firstName;
    event.lastName = lastName;
    event.updatedAt = new Date().toISOString();

    this.apply(event);
  }

  // Event application methods
  protected onUserCreated(event: UserCreatedEvent): void {
    this.id = event.userId;
    this.email = event.email;
    this.firstName = event.firstName;
    this.lastName = event.lastName;
    this.createdBy = event.createdBy;
  }

  protected onUserUpdated(event: UserUpdatedEvent): void {
    this.firstName = event.firstName;
    this.lastName = event.lastName;
  }
}
```

### Using Aggregates in Command Handlers

**Create new aggregate:**

```typescript
@CommandHandlerDecorator(CreateUserCommand)
export class CreateUserHandler extends CommandHandler<CreateUserCommand, CreateUserResult> {
  async handle(command: CreateUserCommand, user: AuthenticatedUser | null): Promise<CreateUserResult> {
    // Create aggregate
    const aggregate = UserAggregate.create(command, user!.userId);

    // Save (persists events and publishes to message bus)
    await this.save(aggregate);

    return {
      userId: aggregate.id,
      email: aggregate.email,
      createdAt: new Date().toISOString()
    };
  }
}
```

**Load and modify existing aggregate:**

```typescript
@CommandHandlerDecorator(UpdateUserCommand)
export class UpdateUserHandler extends CommandHandler<UpdateUserCommand, UpdateUserResult> {
  async handle(command: UpdateUserCommand, user: AuthenticatedUser | null): Promise<UpdateUserResult> {
    // Load aggregate from event store
    const aggregate = await this.getAggregate<UserAggregate>(
      UserAggregate,
      command.userId
    );

    // Execute business logic
    aggregate.updateProfile(command.firstName, command.lastName);

    // Save changes
    await this.save(aggregate);

    return {
      userId: aggregate.id,
      updatedFields: ['firstName', 'lastName'],
      updatedAt: new Date().toISOString()
    };
  }
}
```

### Event Store

Events are persisted in PostgreSQL:

```sql
-- Event store table structure
CREATE TABLE event_store (
  event_id UUID PRIMARY KEY,
  aggregate_id VARCHAR(255) NOT NULL,
  aggregate_type VARCHAR(255) NOT NULL,
  event_type VARCHAR(255) NOT NULL,
  event_data JSONB NOT NULL,
  event_version INTEGER NOT NULL,
  created_at TIMESTAMP NOT NULL,
  created_by VARCHAR(255),
  metadata JSONB
);

-- Example stored events
{
  "event_id": "evt-123",
  "aggregate_id": "user-456",
  "aggregate_type": "UserAggregate",
  "event_type": "UserCreatedEvent",
  "event_data": {
    "userId": "user-456",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "event_version": 1,
  "created_at": "2025-01-15T12:00:00Z"
}
```

## Read Models for Queries

### Defining a Read Model

```typescript
import { Index, MapFromEvent, ReadModel, ReadModelBase } from '@banyanai/platform-event-sourcing';

@ReadModel({ tableName: 'rm_users', aggregateType: 'User' })
export class UserReadModel extends ReadModelBase<UserReadModel> {
  @Index(undefined, { unique: true, type: 'btree' })
  @MapFromEvent('UserCreated')
  @MapFromEvent('UserRegistered')
  id!: string;

  @Index(undefined, { unique: true, type: 'btree' })
  @MapFromEvent('UserCreated')
  @MapFromEvent('UserRegistered')
  @MapFromEvent('UserProfileUpdated')
  email!: string;

  @MapFromEvent('UserCreated')
  @MapFromEvent('UserRegistered')
  @MapFromEvent('UserProfileUpdated')
  profile!: Record<string, unknown>;

  @Index()
  @MapFromEvent('UserCreated')
  @MapFromEvent('UserRegistered')
  isActive!: boolean;

  @MapFromEvent('UserCreated')
  @MapFromEvent('UserRegistered')
  createdAt!: Date;

  updatedAt!: Date;

  /**
   * Get the unique identifier for this read model
   */
  getId(): string {
    return this.id;
  }

  /**
   * Find a user by email address
   */
  static async findByEmail(email: string): Promise<UserReadModel | null> {
    const results = await UserReadModel.findBy<UserReadModel>({ email });
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Check if a user exists and is active by user ID
   */
  static async existsById(userId: string): Promise<boolean> {
    const results = await UserReadModel.findBy<UserReadModel>({ id: userId });
    return results.length > 0 && results[0].isActive;
  }
}
```

### Query Handler Data Access

**Query single record:**

```typescript
@QueryHandlerDecorator(GetUserQuery)
export class GetUserHandler extends QueryHandler<GetUserQuery, UserResult> {
  async handle(query: GetUserQuery, user: AuthenticatedUser | null): Promise<UserResult> {
    // Query using static method
    const userModel = await UserReadModel.findById<UserReadModel>(query.userId);

    if (!userModel) {
      throw new Error('User not found');
    }

    return {
      userId: userModel.id,
      email: userModel.email,
      // Map other fields...
    };
  }
}
```

**List queries with filtering:**

```typescript
@QueryHandlerDecorator(ListUsersQuery)
export class ListUsersHandler extends QueryHandler<ListUsersQuery, ListUsersResult> {
  async handle(query: ListUsersQuery, user: AuthenticatedUser | null): Promise<ListUsersResult> {
    // Query list with filters
    const users = await UserReadModel.findBy<UserReadModel>({
      isActive: true,
      // Add other filters from query
    });

    // Apply pagination
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const start = (page - 1) * pageSize;
    const paginatedUsers = users.slice(start, start + pageSize);

    return {
      users: paginatedUsers,
      page,
      pageSize,
      totalCount: users.length,
      totalPages: Math.ceil(users.length / pageSize)
    };
  }
}
```

**Custom query methods:**

```typescript
// In read model class
static async findActiveUsersByEmail(emailPattern: string): Promise<UserReadModel[]> {
  const allUsers = await UserReadModel.list<UserReadModel>();

  return allUsers.filter(user =>
    user.isActive &&
    user.email.includes(emailPattern)
  );
}

// In query handler
const users = await UserReadModel.findActiveUsersByEmail(query.emailPattern);
```

## Read Model Updates via Events

Event handlers automatically update read models:

```typescript
import { EventSubscriptionHandler, EventHandlerDecorator } from '@banyanai/platform-base-service';
import { UserCreatedEvent } from '../domain/events';
import { UserReadModel } from '../read-models/UserReadModel';

@EventHandlerDecorator(UserCreatedEvent)
export class UserCreatedHandler extends EventSubscriptionHandler<UserCreatedEvent> {
  async handle(event: UserCreatedEvent, user: AuthenticatedUser | null): Promise<void> {
    // The read model is automatically updated by the event sourcing system
    // using the @MapFromEvent decorators

    Logger.info('Read model updated for user created', {
      userId: event.userId
    });
  }
}
```

The `@MapFromEvent` decorators on the read model fields automatically map event data to the read model when events are processed.

## Domain Events

### Defining Domain Events

```typescript
import { DomainEvent } from '@banyanai/platform-contract-system';

@DomainEvent('User.Events.UserCreated', {
  broadcast: true,
  description: 'User account was created'
})
export class UserCreatedEvent {
  userId!: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  createdBy!: string;
  createdAt!: string;
}

@DomainEvent('User.Events.UserUpdated', {
  broadcast: true,
  description: 'User profile was updated'
})
export class UserUpdatedEvent {
  userId!: string;
  firstName!: string;
  lastName!: string;
  updatedAt!: string;
}
```

### Event Publishing

Events are automatically published when aggregate is saved:

```typescript
@CommandHandlerDecorator(CreateUserCommand)
export class CreateUserHandler extends CommandHandler<CreateUserCommand, CreateUserResult> {
  async handle(command: CreateUserCommand, user: AuthenticatedUser | null): Promise<CreateUserResult> {
    // Create aggregate (generates UserCreatedEvent)
    const aggregate = UserAggregate.create(command, user!.userId);

    // Save - automatically:
    // 1. Persists events to event store
    // 2. Publishes events to message bus
    // 3. Event handlers receive events
    // 4. Read models get updated
    await this.save(aggregate);

    return {
      userId: aggregate.id,
      email: aggregate.email,
      createdAt: new Date().toISOString()
    };
  }
}
```

## Data Flow

### Command to Event Flow

```
1. Client sends HTTP POST /api/create-user
2. API Gateway validates permissions
3. Gateway creates message and sends to RabbitMQ
4. CreateUserHandler receives command
5. Handler creates UserAggregate
6. Aggregate generates UserCreatedEvent
7. Handler calls this.save(aggregate)
8. Event persisted to PostgreSQL event store
9. Event published to RabbitMQ
10. Event handlers receive event
11. Read models automatically updated via @MapFromEvent
12. Client receives CreateUserResult
```

### Query Flow

```
1. Client sends HTTP GET /api/get-user?userId=123
2. API Gateway validates permissions
3. Gateway creates message and sends to RabbitMQ
4. GetUserHandler receives query
5. Handler calls UserReadModel.findById(userId)
6. Read model queries PostgreSQL
7. User data returned
8. Client receives UserResult
```

## Best Practices

### Aggregates

**DO:**
- Keep aggregates small and focused
- Enforce business rules in aggregate methods
- Use factory methods for creation
- Apply events to modify state
- Make aggregates immutable from outside

**DON'T:**
- Load multiple aggregates in one handler
- Modify aggregate state directly
- Skip event application
- Create aggregates with `new` directly
- Query external data in aggregates

### Events

**DO:**
- Name events in past tense (UserCreated, OrderShipped)
- Include all necessary data in event
- Make events immutable
- Use events for all state changes
- Keep event size reasonable

**DON'T:**
- Change event structure (breaks event sourcing)
- Include sensitive data without encryption
- Create events without aggregate
- Modify events after creation
- Use events for queries

### Read Models

**DO:**
- Optimize for query patterns
- Denormalize data for performance
- Use @MapFromEvent for automatic updates
- Include pagination for lists
- Add indexes for common queries

**DON'T:**
- Modify read models from command handlers
- Use read models as source of truth
- Query event store directly
- Share read models across services

## Advanced Patterns

### Compensating Actions

Handle failures with compensating events:

```typescript
@CommandHandlerDecorator(CancelOrderCommand)
export class CancelOrderHandler extends CommandHandler<CancelOrderCommand, CancelOrderResult> {
  async handle(command: CancelOrderCommand, user: AuthenticatedUser | null): Promise<CancelOrderResult> {
    const aggregate = await this.getAggregate<OrderAggregate>(
      OrderAggregate,
      command.orderId
    );

    // Cancel order (generates OrderCancelledEvent)
    aggregate.cancel(command.reason);

    await this.save(aggregate);

    // OrderCancelledEvent handlers will:
    // - Refund payment
    // - Release inventory
    // - Notify customer

    return {
      orderId: aggregate.id,
      status: 'cancelled',
      cancelledAt: new Date().toISOString()
    };
  }
}
```

### Custom Read Model Methods

Add custom query methods to read models:

```typescript
export class UserReadModel extends ReadModelBase<UserReadModel> {
  // ... field definitions ...

  /**
   * Find users by role with pagination
   */
  static async findByRole(role: string, page: number, pageSize: number): Promise<UserReadModel[]> {
    const allUsers = await UserReadModel.list<UserReadModel>();

    const filtered = allUsers.filter(user =>
      user.roles.includes(role) && user.isActive
    );

    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }
}
```

## Troubleshooting

### "Aggregate not found"

1. Check aggregate ID exists in event store
2. Check aggregate type is correct
3. Verify events persisted correctly

### "Read model outdated"

1. Check event handlers are running
2. Verify events are being published
3. Check @MapFromEvent decorators are correct
4. Verify message bus connection

### "Event version conflict"

1. Check if aggregate is being modified concurrently
2. Implement optimistic locking or retry logic

## Related Resources

- [Writing Handlers](./writing-handlers.md) - Command and query handler patterns
- [Defining Contracts](./defining-contracts.md) - Defining events
- [Testing Services](./testing-services.md) - Testing aggregates and event handlers

---

**Next Steps:**
1. Define your aggregates for business entities
2. Create read models for query optimization
3. Implement command handlers using aggregates
4. Build query handlers using read models
5. Test the complete data flow
