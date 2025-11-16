---
title: Event Sourcing Issues
description: Troubleshooting event sourcing and aggregate problems
category: troubleshooting
tags: [event-sourcing, aggregates, events, replay]
related:
  - ../../02-core-concepts/event-sourcing.md
  - ../by-component/event-store-issues.md
  - ../common-errors/error-catalog.md
difficulty: advanced
---

# Event Sourcing Issues

Quick reference for diagnosing and fixing event sourcing and aggregate problems.

## Quick Diagnosis

```bash
# Check event store tables
docker exec postgres psql -U postgres -d platform -c "\dt events*"

# View recent events
docker exec postgres psql -U postgres -d platform -c \
  "SELECT event_id, aggregate_id, event_type, aggregate_version FROM events ORDER BY occurred_at DESC LIMIT 10;"

# Check aggregate events
docker exec postgres psql -U postgres -d platform -c \
  "SELECT COUNT(*), MAX(aggregate_version) FROM events WHERE aggregate_id='user-123';"

# View event sourcing logs
docker logs my-service 2>&1 | grep -E "event|aggregate|apply"
```

## Common Event Sourcing Problems

### 1. Aggregate Concurrency Error

**Error:**
```
AggregateConcurrencyError: Concurrency conflict for aggregate user-123.
Expected version 5, but actual version is 6
```

**Cause:** Multiple commands modifying same aggregate concurrently

**Fix - Implement Retry Logic:**
```typescript
import { AggregateConcurrencyError } from '@banyanai/platform-domain-modeling';

async function executeWithRetry(command: Command, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await commandBus.execute(command);
    } catch (error) {
      if (error instanceof AggregateConcurrencyError && attempt < maxRetries) {
        console.log(`Retrying after concurrency conflict (${attempt}/${maxRetries})`);
        await sleep(100 * attempt); // Exponential backoff
        continue;
      }
      throw error;
    }
  }
}
```

### 2. Aggregate Not Found

**Error:**
```
AggregateNotFoundError: User with ID user-123 not found
```

**Diagnostic:**
```bash
# Check if events exist for aggregate
docker exec postgres psql -U postgres -d platform -c \
  "SELECT COUNT(*) FROM events WHERE aggregate_id='user-123';"
```

**Fix - Check Existence Before Loading:**
```typescript
@QueryHandler(GetUserQuery)
export class GetUserHandler {
  async handle(query: GetUserQuery) {
    // Check if aggregate exists
    const exists = await this.aggregateAccess.exists(query.userId);
    if (!exists) {
      throw new NotFoundError('User', query.userId);
    }

    return await this.aggregateAccess.getById(query.userId);
  }
}
```

### 3. Missing Event Handler

**Error:**
```
AggregateOperationError: Failed to apply event UserCreated to aggregate user-123
```

**Cause:** Aggregate missing `@ApplyEvent` decorator for event type

**Fix - Add Event Handler:**
```typescript
import { AggregateRoot, ApplyEvent } from '@banyanai/platform-domain-modeling';

@AggregateRoot()
export class User {
  private userId!: string;
  private email!: string;

  // MUST have handler for every event type
  @ApplyEvent('UserCreated')
  private onUserCreated(event: UserCreatedEvent): void {
    this.userId = event.userId;
    this.email = event.email;
  }

  @ApplyEvent('UserEmailUpdated')
  private onEmailUpdated(event: UserEmailUpdatedEvent): void {
    this.email = event.newEmail;
  }
}
```

### 4. Event Store Schema Not Initialized

**Error:**
```
Projections table not found in public schema.
Ensure PostgresEventStore.initializeSchema() has been called first.
```

**Fix - Initialize Schema:**
```typescript
import { PostgresEventStore } from '@banyanai/platform-event-sourcing';

// Initialize event store FIRST
const eventStore = new PostgresEventStore(dbConfig);
await eventStore.initializeSchema();

// THEN start using it
await BaseService.start({ /* ... */ });
```

### 5. Large Aggregate Performance Issues

**Symptom:** Slow aggregate loading, timeouts

**Diagnostic:**
```bash
# Find aggregates with most events
docker exec postgres psql -U postgres -d platform -c \
  "SELECT aggregate_id, COUNT(*) as event_count FROM events GROUP BY aggregate_id ORDER BY event_count DESC LIMIT 20;"
```

**Fix - Implement Snapshots:**
```typescript
import { SnapshotStore } from '@banyanai/platform-event-sourcing';

// Save snapshot every 100 events
async function saveWithSnapshot(aggregate: User, correlationId: string) {
  await this.aggregateAccess.save(aggregate, correlationId);

  if (aggregate.version % 100 === 0) {
    await snapshotStore.saveSnapshot({
      aggregateId: aggregate.userId,
      aggregateType: 'User',
      version: aggregate.version,
      state: aggregate.toSnapshot(),
      createdAt: new Date()
    });
  }
}

// Load from snapshot
async function loadFromSnapshot(aggregateId: string) {
  const snapshot = await snapshotStore.getLatestSnapshot(aggregateId, 'User');

  if (snapshot) {
    const user = User.fromSnapshot(snapshot.state);
    const events = await eventStore.getEvents(aggregateId, snapshot.version + 1);
    for (const event of events) {
      user.applyEvent(event);
    }
    return user;
  }

  return this.aggregateAccess.getById(aggregateId);
}
```

### 6. Event Migration Failures

**Error:**
```
No migrations found for event type UserCreated
```

**Fix - Define Event Migrations:**
```typescript
import { EventMigration } from '@banyanai/platform-event-sourcing';

// Migration from v1 to v2
const userCreatedMigration: EventMigration = {
  eventType: 'UserCreated',
  fromVersion: 1,
  toVersion: 2,
  migrate: (eventData: any) => {
    return {
      ...eventData,
      status: 'active',        // Add new field
      emailAddress: eventData.email, // Rename field
      email: undefined          // Remove old field
    };
  }
};

EventMigrator.registerMigration(userCreatedMigration);
```

### 7. Event Replay Deadlocks

**Error:**
```
Replay already in progress
```

**Fix - Use Advisory Locks:**
```typescript
async function replayWithLock(replayId: string) {
  const lockId = hashCode(replayId);
  const client = await pool.connect();

  try {
    // Try to acquire lock
    const result = await client.query(
      'SELECT pg_try_advisory_lock($1) as locked',
      [lockId]
    );

    if (!result.rows[0].locked) {
      console.log('Replay already in progress, skipping');
      return;
    }

    // Perform replay
    await doReplay();

  } finally {
    await client.query('SELECT pg_advisory_unlock($1)', [lockId]);
    client.release();
  }
}
```

## Event Sourcing Checklist

- [ ] Event store schema initialized (`initializeSchema()`)
- [ ] All event types have `@ApplyEvent` handlers in aggregate
- [ ] Concurrency conflicts handled with retry logic
- [ ] Aggregate existence checked before loading
- [ ] Snapshots used for large aggregates (>100 events)
- [ ] Event migrations defined for schema changes
- [ ] Event data validated before persisting
- [ ] Replay operations use advisory locks

## Diagnostic Queries

```sql
-- Count events per aggregate
SELECT aggregate_id, COUNT(*) as event_count
FROM events
GROUP BY aggregate_id
ORDER BY event_count DESC
LIMIT 20;

-- Find aggregates with version gaps
SELECT aggregate_id, aggregate_version
FROM events e1
WHERE NOT EXISTS (
  SELECT 1 FROM events e2
  WHERE e2.aggregate_id = e1.aggregate_id
    AND e2.aggregate_version = e1.aggregate_version - 1
)
AND aggregate_version > 1;

-- View recent events by type
SELECT event_type, COUNT(*), MAX(occurred_at) as last_occurred
FROM events
WHERE occurred_at > NOW() - INTERVAL '1 hour'
GROUP BY event_type;

-- Check for duplicate versions (concurrency violations)
SELECT aggregate_id, aggregate_version, COUNT(*)
FROM events
GROUP BY aggregate_id, aggregate_version
HAVING COUNT(*) > 1;
```

## Best Practices

1. **Always initialize schema first**
```typescript
await eventStore.initializeSchema();
```

2. **Implement retry for concurrency**
```typescript
try {
  await save(aggregate);
} catch (error) {
  if (error instanceof AggregateConcurrencyError) {
    // Reload and retry
  }
}
```

3. **Use snapshots for large aggregates**
```typescript
if (aggregate.version % 100 === 0) {
  await saveSnapshot(aggregate);
}
```

4. **Version all events**
```typescript
export class UserCreatedEvent {
  static readonly VERSION = 1;
  toJSON() {
    return { version: 1, ...data };
  }
}
```

5. **Validate event data**
```typescript
@ApplyEvent('UserCreated')
private onCreated(event: UserCreatedEvent): void {
  if (!event.userId || !event.email) {
    throw new Error('Invalid event data');
  }
  this.userId = event.userId;
  this.email = event.email;
}
```

## Related Documentation

- [Event Sourcing Concepts](../../02-core-concepts/event-sourcing.md)
- [Event Store Issues](../by-component/event-store-issues.md)
- [Read Model Issues](../by-component/read-model-issues.md)
- [Error Catalog - Event Store](../common-errors/error-catalog.md#event-store-errors)
