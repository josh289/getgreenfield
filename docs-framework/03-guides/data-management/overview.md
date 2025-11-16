# Data Management Overview

## Use this guide if...

- You're new to event sourcing and CQRS
- You want to understand the platform's data architecture
- You need to choose between aggregates, read models, and projections
- You're transitioning from traditional CRUD to event-sourced systems

## Core Concepts

### Event Sourcing

Instead of storing current state, store the sequence of events that led to that state.

```typescript
// Traditional approach: Store current state
User: { id: '123', email: 'user@example.com', status: 'active' }

// Event sourcing: Store events
[
  { type: 'UserCreated', data: { email: 'user@example.com' } },
  { type: 'UserActivated', data: { activatedAt: '2024-01-15' } }
]
```

**Benefits:**
- Complete audit trail
- Time travel (reconstruct state at any point)
- Event replay for debugging
- Event-driven architecture

### CQRS (Command Query Responsibility Segregation)

Separate write operations (commands) from read operations (queries).

```typescript
// Write side: Commands → Aggregates → Events
CreateUserCommand → User Aggregate → UserCreatedEvent

// Read side: Events → Read Models → Queries
UserCreatedEvent → UserReadModel → GetUserQuery
```

**Benefits:**
- Optimized read models for queries
- Independent scaling of reads and writes
- Multiple read models from same events
- Eventual consistency

## Data Architecture

### Write Side (Commands)

**Aggregates** enforce business rules and emit events.

```typescript
@Aggregate('User')
export class User extends AggregateRoot {
  static create(props: UserProps): User {
    const user = new User(props);
    user.raiseEvent('UserCreated', { email: props.email });
    return user;
  }

  changeEmail(newEmail: string, updatedBy: string): void {
    // Validate business rules
    if (!this.isValidEmail(newEmail)) {
      throw new Error('Invalid email');
    }

    this.props.email = newEmail;
    this.raiseEvent('UserEmailChanged', { newEmail, updatedBy });
  }
}
```

**See:** [aggregates.md](./aggregates.md)

### Read Side (Queries)

**Read Models** provide optimized views for queries.

```typescript
@ReadModel({ tableName: 'rm_users', aggregateType: 'User' })
export class UserReadModel extends ReadModelBase<UserReadModel> {
  @Index(undefined, { unique: true, type: 'btree' })
  @MapFromEvent('UserCreated')
  id!: string;

  @MapFromEvent('UserCreated')
  @MapFromEvent('UserEmailChanged')
  email!: string;

  @MapFromEvent('UserCreated')
  isActive!: boolean;

  getId(): string {
    return this.id;
  }

  static async findByEmail(email: string): Promise<UserReadModel | null> {
    const results = await UserReadModel.findBy<UserReadModel>({ email });
    return results.length > 0 ? results[0] : null;
  }
}
```

**Note:** The `tableName` parameter (`'rm_users'`) is NOT a separate database table. All read models are stored in a shared `projections` table with JSONB data. The `tableName` becomes the `projection_name` discriminator. See [read-models.md](./read-models.md) for details.

**See:** [read-models.md](./read-models.md), [projections.md](./projections.md)

## Data Flow

```
1. Command arrives
   ↓
2. Load aggregate from events
   ↓
3. Execute business logic
   ↓
4. Aggregate raises events
   ↓
5. Events saved to event store
   ↓
6. Events published to message bus
   ↓
7. Read models updated (projections)
   ↓
8. Queries read from read models
```

## Component Responsibilities

### Aggregates

**Purpose:** Enforce business rules and maintain consistency

```typescript
// Aggregates ensure invariants
if (this.props.failedLoginAttempts >= 5) {
  throw new Error('Account locked');
}
```

**Use aggregates for:**
- Enforcing business rules
- Maintaining invariants
- Coordinating related entities
- Emitting domain events

**See:** [aggregates.md](./aggregates.md)

### Event Store

**Purpose:** Persist event streams

```typescript
const eventStore = BaseService.getEventStore();

// Append events
await eventStore.append(user.id, user.getUncommittedEvents());

// Load events
const events = await eventStore.getEvents(userId);
```

**Features:**
- Optimistic concurrency control
- Event versioning
- Snapshots for performance
- Event replay

**See:** [event-sourcing.md](./event-sourcing.md)

### Read Models

**Purpose:** Provide optimized query views

```typescript
// Optimized for specific queries
const users = await UserReadModel.findBy<UserReadModel>({ isActive: true });
const user = await UserReadModel.findByEmail('test@example.com');
```

**Use read models for:**
- All query operations
- List/search functionality
- Dashboard data
- Reports and analytics

**See:** [read-models.md](./read-models.md)

### Projections

**Purpose:** Automatically update read models from events

```typescript
// Projections map events to read model fields
@MapFromEvent('UserCreated')
@MapFromEvent('UserEmailChanged')
email!: string;
```

**Features:**
- Automatic field mapping
- Multiple events per field
- Field transformation
- Index management

**See:** [projections.md](./projections.md)

## Common Patterns

### Pattern 1: Create Entity

```typescript
// Command handler
const user = User.create({ email: 'test@example.com', ... });
const eventStore = BaseService.getEventStore();
await eventStore.append(user.id, user.getUncommittedEvents());

// Read model automatically updated via projection
// Query returns updated data
const savedUser = await UserReadModel.findById<UserReadModel>(user.id);
```

### Pattern 2: Update Entity

```typescript
// Load aggregate from events
const events = await eventStore.getEvents(userId);
const user = User.fromEvents(events);

// Execute business logic
user.changeEmail('new@example.com', 'admin');

// Save new events
await eventStore.append(user.id, user.getUncommittedEvents());

// Read model automatically updated
```

### Pattern 3: Query Data

```typescript
// Never query the event store directly!
// Use read models instead
const user = await UserReadModel.findById<UserReadModel>(userId);
const activeUsers = await UserReadModel.findBy<UserReadModel>({ isActive: true });
```

### Pattern 4: Complex Queries

```typescript
// Create specialized read models for complex queries
@ReadModel({ tableName: 'rm_user_stats' })
export class UserStatsReadModel extends ReadModelBase<UserStatsReadModel> {
  @MapFromEvent('UserCreated')
  totalUsers!: number;

  @MapFromEvent('UserActivated')
  activeUsers!: number;

  @MapFromEvent('UserEmailVerified')
  verifiedUsers!: number;
}
```

## When to Use What

### Use Aggregates When:
- Enforcing business rules
- Maintaining consistency within a boundary
- Coordinating multiple entities
- Emitting domain events

### Use Read Models When:
- Querying data
- Displaying lists
- Searching/filtering
- Reporting

### Use Projections When:
- Automatically updating read models
- Deriving data from events
- Creating multiple views of same data

## Migration from Traditional CRUD

### Before (Traditional)

```typescript
// Update user directly
await db.users.update({ id: userId }, { email: newEmail });

// Query directly
const user = await db.users.findOne({ id: userId });
```

### After (Event Sourced)

```typescript
// Command: Load aggregate, execute logic, save events
const events = await eventStore.getEvents(userId);
const user = User.fromEvents(events);
user.changeEmail(newEmail, updatedBy);
await eventStore.append(user.id, user.getUncommittedEvents());

// Query: Use read model
const user = await UserReadModel.findById<UserReadModel>(userId);
```

## Performance Considerations

### Event Store
- Use snapshots for large event streams
- Typical performance: 1000+ events/sec writes

### Read Models
- Indexed for fast queries
- Eventually consistent (typically <100ms lag)
- Typical performance: 10,000+ queries/sec

### Caching
- Query results can be cached
- Automatic cache invalidation on events

**See:** [caching.md](./caching.md)

## Next Steps

Choose your path based on what you're building:

### Building Domain Logic
→ [aggregates.md](./aggregates.md) - Domain modeling and business rules

### Implementing Complete Event Sourcing
→ [event-sourcing.md](./event-sourcing.md) - Full event sourcing guide

### Building Read Operations
→ [read-models.md](./read-models.md) - Query optimization

### Setting Up Projections
→ [projections.md](./projections.md) - Automatic read model updates

### Optimizing Performance
→ [caching.md](./caching.md) - Caching strategies

## Related Guides

- [Service Development - Command Handlers](../service-development/command-handlers.md)
- [Service Development - Query Handlers](../service-development/query-handlers.md)
- [Service Development - Event Handlers](../service-development/event-handlers.md)
