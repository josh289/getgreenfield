---
title: "Event Projections with @MapFromEvent"
---

# Event Projections with @MapFromEvent

## Use this guide if...

- You need to automatically update read models from events
- You want to understand how projections map events to fields
- You're implementing multi-event field updates
- You need to transform event data for read models

## Quick Example

```typescript
import { Index, MapFromEvent, ReadModel, ReadModelBase } from '@banyanai/platform-event-sourcing';

@ReadModel({ tableName: 'rm_users', aggregateType: 'User' })
export class UserReadModel extends ReadModelBase<UserReadModel> {
  // Simple mapping - event field → read model field (same name)
  @MapFromEvent('UserCreated')
  id!: string;

  // Multiple events can update same field
  @MapFromEvent('UserCreated')
  @MapFromEvent('UserEmailChanged')
  email!: string;

  // Map from different source field
  @MapFromEvent('UserCreated', 'isActive')
  @MapFromEvent('UserActivated', 'newStatus')
  status!: string;

  // Multiple events, multiple sources
  @MapFromEvent('UserCreated')
  @MapFromEvent('UserProfileUpdated')
  profile!: Record<string, unknown>;

  getId(): string {
    return this.id;
  }
}
```

**The platform automatically:**
- Subscribes to events
- Maps event data to fields
- Updates read models in the shared `projections` table
- Stores data as JSONB
- Manages indexes

**No manual event handler code needed!**

**How it's stored:**
```sql
-- All read models stored in single shared projections table
SELECT * FROM projections WHERE projection_name = 'rm_users';

-- Example:
id          | projection_name | data                                      | version
----------- | --------------- | ----------------------------------------- | -------
'user-123'  | 'rm_users'      | '{"id":"user-123","email":"user@ex.com"}' | 1
```

## @MapFromEvent Decorator

### Basic Syntax

```typescript
@MapFromEvent(eventName: string, sourceField?: string)
propertyName!: type;
```

### Pattern 1: Same Field Names

When event field matches read model field:

```typescript
// Event: { userId: '123', email: 'test@example.com' }
// Read model gets: id = '123', email = 'test@example.com'

@MapFromEvent('UserCreated')
id!: string;

@MapFromEvent('UserCreated')
email!: string;
```

### Pattern 2: Different Field Names

When event field differs from read model field:

```typescript
// Event: { aggregateId: '123' }
// Read model field: id

@MapFromEvent('UserCreated', 'aggregateId')
id!: string;

// Event: { userEmail: 'test@example.com' }
// Read model field: email

@MapFromEvent('UserCreated', 'userEmail')
email!: string;
```

### Pattern 3: Multiple Events, Same Field

Field updated by different events:

```typescript
// UserCreated sets initial email
// UserEmailChanged updates email
@MapFromEvent('UserCreated')
@MapFromEvent('UserEmailChanged')
email!: string;

// UserCreated sets initial status
// UserActivated changes status
// UserDeactivated changes status
@MapFromEvent('UserCreated')
@MapFromEvent('UserActivated')
@MapFromEvent('UserDeactivated')
isActive!: boolean;
```

### Pattern 4: Nested Event Data

Mapping from nested event data:

```typescript
// Event: { eventData: { profile: { firstName: 'John' } } }

@MapFromEvent('UserCreated', 'profile')
profile!: Record<string, unknown>;

// Event: { eventData: { address: { city: 'NYC' } } }

@MapFromEvent('UserCreated', 'address')
shippingAddress!: Address;
```

## Complete Example

```typescript
@ReadModel({ tableName: 'rm_users', aggregateType: 'User' })
export class UserReadModel extends ReadModelBase<UserReadModel> {
  // Primary key (from event aggregateId)
  @Index(undefined, { unique: true, type: 'btree' })
  @MapFromEvent('UserCreated')
  @MapFromEvent('UserRegistered')
  id!: string;

  // Email (updated by multiple events)
  @Index(undefined, { unique: true, type: 'btree' })
  @MapFromEvent('UserCreated')
  @MapFromEvent('UserRegistered')
  @MapFromEvent('UserEmailChanged')
  email!: string;

  // Profile (complex object, multiple update events)
  @MapFromEvent('UserCreated')
  @MapFromEvent('UserRegistered')
  @MapFromEvent('UserProfileUpdated')
  profile!: Record<string, unknown>;

  // Status flags
  @Index()
  @MapFromEvent('UserCreated')
  @MapFromEvent('UserActivated')
  @MapFromEvent('UserDeactivated')
  isActive!: boolean;

  @Index()
  @MapFromEvent('UserCreated')
  @MapFromEvent('UserEmailVerified')
  emailVerified!: boolean;

  // Arrays
  @MapFromEvent('UserCreated')
  @MapFromEvent('RoleAssignedToUser')
  @MapFromEvent('RoleRemovedFromUser')
  roles!: string[];

  // Optional fields (not mapped from all events)
  @MapFromEvent('UserCreated')
  passwordHash?: string;

  lastLogin?: Date;  // Updated by application logic, not events

  // Timestamps
  @MapFromEvent('UserCreated')
  @MapFromEvent('UserRegistered')
  createdAt!: Date;

  updatedAt!: Date;  // Auto-updated on any change

  getId(): string {
    return this.id;
  }
}
```

## Event Data Mapping

### How It Works

1. Event published: `UserCreated`
2. Platform finds read models with `@MapFromEvent('UserCreated')`
3. For each decorated field:
   - Extract value from event data
   - Set read model field
4. Save read model to database

### Event Structure

```typescript
const event: DomainEvent = {
  eventId: 'event-123',
  eventType: 'UserCreated',
  aggregateType: 'User',
  aggregateId: 'user-123',
  aggregateVersion: 1,
  occurredAt: new Date(),
  eventData: {
    email: 'test@example.com',
    profile: { firstName: 'John' },
    isActive: true,
    createdAt: new Date()
  }
};
```

### Mapping Process

```typescript
// @MapFromEvent('UserCreated')
// id!: string;
// → Looks for event.eventData.id or event.aggregateId
// → Sets readModel.id = 'user-123'

// @MapFromEvent('UserCreated')
// email!: string;
// → Looks for event.eventData.email
// → Sets readModel.email = 'test@example.com'

// @MapFromEvent('UserCreated', 'userEmail')
// email!: string;
// → Looks for event.eventData.userEmail
// → Sets readModel.email = value
```

## Advanced Patterns

### Pattern 1: Conditional Updates

Some events only update specific fields:

```typescript
@ReadModel({ tableName: 'rm_users' })
export class UserReadModel extends ReadModelBase<UserReadModel> {
  // Always set on creation
  @MapFromEvent('UserCreated')
  id!: string;

  // Set on creation, updated on change
  @MapFromEvent('UserCreated')
  @MapFromEvent('UserEmailChanged')
  email!: string;

  // Only updated on specific event
  @MapFromEvent('UserEmailVerified')
  emailVerifiedAt?: Date;
}
```

### Pattern 2: Array Accumulation

Arrays updated by multiple event types:

```typescript
// Roles array updated by different events
@MapFromEvent('UserCreated')  // Initial: []
@MapFromEvent('UserRegistered')  // Initial: []
@MapFromEvent('RoleAssignedToUser')  // Add role
@MapFromEvent('RoleRemovedFromUser')  // Remove role
roles!: string[];

// External identities array
@MapFromEvent('UserCreated')  // Initial: []
@MapFromEvent('UserRegistered')  // With initial identity
@MapFromEvent('ExternalIdentityLinked')  // Add identity
externalIdentities!: Array<{ provider: string; userId: string }>;
```

### Pattern 3: Denormalized Data

Include related data for query performance:

```typescript
@ReadModel({ tableName: 'rm_orders' })
export class OrderReadModel extends ReadModelBase<OrderReadModel> {
  @MapFromEvent('OrderCreated')
  id!: string;

  @MapFromEvent('OrderCreated')
  customerId!: string;

  // Denormalized customer data (snapshot at order time)
  @MapFromEvent('OrderCreated', 'customerEmail')
  customerEmail!: string;

  @MapFromEvent('OrderCreated', 'customerName')
  customerName!: string;
}
```

## Indexes with Projections

Combine @Index and @MapFromEvent:

```typescript
// Unique indexed field
@Index(undefined, { unique: true, type: 'btree' })
@MapFromEvent('UserCreated')
id!: string;

// Non-unique indexed field
@Index()
@MapFromEvent('UserCreated')
@MapFromEvent('UserActivated')
isActive!: boolean;

// Compound index (define in @ReadModel decorator)
@ReadModel({
  tableName: 'rm_orders',
  indexes: [
    { fields: ['customerId', 'status'], unique: false }
  ]
})
```

## Testing Projections

Projections are tested automatically via integration tests:

```typescript
describe('UserReadModel projections', () => {
  it('should update email from UserEmailChanged event', async () => {
    // Create user
    const user = User.create({...});
    await eventStore.append(user.id, user.getUncommittedEvents());

    // Verify initial email
    let readModel = await UserReadModel.findById<UserReadModel>(user.id);
    expect(readModel?.email).toBe('old@example.com');

    // Change email
    user.changeEmail('new@example.com');
    await eventStore.append(user.id, user.getUncommittedEvents());

    // Verify projection updated
    readModel = await UserReadModel.findById<UserReadModel>(user.id);
    expect(readModel?.email).toBe('new@example.com');
  });
});
```

## Anti-Patterns

❌ **Don't manually update read models**
```typescript
// DON'T DO THIS
const readModel = await UserReadModel.findById(userId);
readModel.email = 'new@example.com';
await readModel.save();
```

✅ **Update via events (projections do the rest)**
```typescript
// DO THIS
const events = await eventStore.getEvents(userId);
const user = User.fromEvents(events);
user.changeEmail('new@example.com');
await eventStore.append(user.id, user.getUncommittedEvents());
// Read model auto-updates via projection!
```

## Related Guides

- [Read Models](./read-models.md)
- [Event Sourcing](./event-sourcing.md)
- [Aggregates](./aggregates.md)
