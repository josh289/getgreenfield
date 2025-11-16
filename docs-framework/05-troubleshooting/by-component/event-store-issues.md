---
title: Event Store Issues
description: Troubleshooting guide for event store, aggregate persistence, and event replay problems
category: troubleshooting
tags: [event-store, event-sourcing, aggregates, persistence, replay]
related:
  - ../../02-core-concepts/event-sourcing.md
  - ../by-symptom/event-sourcing-issues.md
  - ../common-errors/error-catalog.md
difficulty: advanced
---

# Event Store Issues

The event store persists domain events and rebuilds aggregate state through event replay. This guide helps diagnose and resolve event persistence, aggregate loading, and concurrency issues.

## Quick Fix

```bash
# Check event store schema
docker exec postgres psql -U postgres -d platform -c "\dt events*"

# View recent events
docker exec postgres psql -U postgres -d platform -c \
  "SELECT event_id, aggregate_id, event_type, aggregate_version FROM events ORDER BY occurred_at DESC LIMIT 10;"

# Check aggregate state
docker exec postgres psql -U postgres -d platform -c \
  "SELECT aggregate_id, COUNT(*) as event_count, MAX(aggregate_version) as version FROM events WHERE aggregate_id='user-123' GROUP BY aggregate_id;"

# Test event store connection
docker logs my-service 2>&1 | grep -E "EventStore|event store"
```

## Common Problems

### 1. Event Store Initialization Failed

**Symptoms:**
- Error: "Projections table not found"
- "EVENT_STORE_ERROR" during startup
- Schema initialization failures
- Missing events or projections tables

**Diagnostic Steps:**

```bash
# Check if event store tables exist
docker exec postgres psql -U postgres -d platform -c "\dt"

# Should see:
# - events
# - projections
# - snapshots (if enabled)

# Check table schema
docker exec postgres psql -U postgres -d platform -c "\d events"

# View initialization logs
docker logs my-service 2>&1 | grep -E "initializeSchema|EventStore"
```

**Common Errors:**

```typescript
// Projections table not found
throw new Error(
  'Projections table not found in public schema. ' +
  'Ensure PostgresEventStore.initializeSchema() has been called first.'
);
```

**Solution:**

**A. Initialize Schema on First Run**

```typescript
import { PostgresEventStore } from '@banyanai/platform-event-sourcing';

// Initialize event store
const eventStore = new PostgresEventStore({
  host: process.env.DATABASE_HOST || 'postgres',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  database: process.env.DATABASE_NAME || 'platform',
  user: process.env.DATABASE_USER || 'postgres',
  password: process.env.DATABASE_PASSWORD || 'postgres'
});

// MUST call before using event store
await eventStore.initializeSchema();
```

**B. Manual Schema Creation**

```sql
-- Create events table
CREATE TABLE IF NOT EXISTS events (
  event_id TEXT PRIMARY KEY,
  aggregate_id TEXT NOT NULL,
  aggregate_type TEXT NOT NULL,
  aggregate_version INTEGER NOT NULL,
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  occurred_at TIMESTAMP NOT NULL,
  correlation_id TEXT,
  causation_id TEXT,
  metadata JSONB,
  UNIQUE (aggregate_id, aggregate_version)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_events_aggregate_id ON events(aggregate_id);
CREATE INDEX IF NOT EXISTS idx_events_aggregate_type ON events(aggregate_type);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_occurred_at ON events(occurred_at);
CREATE INDEX IF NOT EXISTS idx_events_correlation_id ON events(correlation_id);

-- Create projections table
CREATE TABLE IF NOT EXISTS projections (
  id TEXT NOT NULL,
  projection_name TEXT NOT NULL,
  data JSONB NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (id, projection_name)
);

-- Create projection indexes
CREATE INDEX IF NOT EXISTS idx_projections_name ON projections(projection_name);
CREATE INDEX IF NOT EXISTS idx_projections_data ON projections USING GIN (data);
```

**C. Check Database Permissions**

```sql
-- Grant permissions to service user
GRANT ALL ON TABLE events TO your_service_user;
GRANT ALL ON TABLE projections TO your_service_user;

-- Verify permissions
\dp events
```

---

### 2. Aggregate Concurrency Errors

**Symptoms:**
- Error: "AggregateConcurrencyError"
- "Expected version X, but actual version is Y"
- Concurrent update conflicts
- Version mismatch errors

**Diagnostic Steps:**

```bash
# Check aggregate version
docker exec postgres psql -U postgres -d platform -c \
  "SELECT aggregate_id, aggregate_version, event_type, occurred_at FROM events WHERE aggregate_id='user-123' ORDER BY aggregate_version;"

# View concurrent attempts
docker logs my-service 2>&1 | grep -E "Concurrency|version"

# Check for duplicate version attempts
docker exec postgres psql -U postgres -d platform -c \
  "SELECT aggregate_id, aggregate_version, COUNT(*) FROM events GROUP BY aggregate_id, aggregate_version HAVING COUNT(*) > 1;"
```

**Common Errors:**

```typescript
// From domain-modeling/aggregate-access.ts
export class AggregateConcurrencyError extends Error {
  constructor(
    aggregateId: string,
    expectedVersion: number,
    actualVersion: number
  ) {
    super(
      `Concurrency conflict for aggregate ${aggregateId}. ` +
      `Expected version ${expectedVersion}, but actual version is ${actualVersion}`
    );
  }
}
```

**Solution:**

**A. Implement Retry Logic**

```typescript
import { AggregateConcurrencyError } from '@banyanai/platform-domain-modeling';

async function executeWithRetry(command: Command, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await commandBus.execute(command);
    } catch (error) {
      if (error instanceof AggregateConcurrencyError && attempt < maxRetries) {
        console.log(`Concurrency conflict, retrying (${attempt}/${maxRetries})`);
        await sleep(100 * attempt); // Exponential backoff
        continue;
      }
      throw error;
    }
  }
}
```

**B. Use Optimistic Locking Correctly**

```typescript
@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler {
  async handle(command: UpdateUserCommand) {
    // Load aggregate (gets current version)
    const user = await this.aggregateAccess.getById(command.userId);

    // Modify aggregate (increments version)
    user.updateEmail(command.email);

    // Save with version check
    // Will fail if another process modified the aggregate
    await this.aggregateAccess.save(user, correlationId);
  }
}
```

**C. Detect and Handle Conflicts**

```typescript
try {
  await this.aggregateAccess.save(user, correlationId);
} catch (error) {
  if (error instanceof AggregateConcurrencyError) {
    // Log conflict for monitoring
    Logger.warn('Concurrency conflict detected', {
      aggregateId: user.userId,
      expectedVersion: user.version,
      actualVersion: error.actualVersion,
      command: command.constructor.name
    });

    // Reload and retry
    const freshUser = await this.aggregateAccess.getById(user.userId);
    freshUser.updateEmail(command.email);
    await this.aggregateAccess.save(freshUser, correlationId);
  } else {
    throw error;
  }
}
```

---

### 3. Aggregate Not Found Errors

**Symptoms:**
- Error: "AggregateNotFoundError"
- "User with ID xxx not found"
- Cannot load aggregate from event store
- Empty event stream for aggregate

**Diagnostic Steps:**

```bash
# Check if events exist for aggregate
docker exec postgres psql -U postgres -d platform -c \
  "SELECT COUNT(*) FROM events WHERE aggregate_id='user-123';"

# View all events for aggregate
docker exec postgres psql -U postgres -d platform -c \
  "SELECT event_id, event_type, aggregate_version, occurred_at FROM events WHERE aggregate_id='user-123' ORDER BY aggregate_version;"

# Search for aggregate ID pattern
docker exec postgres psql -U postgres -d platform -c \
  "SELECT DISTINCT aggregate_id FROM events WHERE aggregate_id LIKE 'user%' LIMIT 20;"
```

**Common Errors:**

```typescript
// From domain-modeling/aggregate-access.ts
export class AggregateNotFoundError extends Error {
  constructor(
    aggregateType: string,
    aggregateId: string
  ) {
    super(`${aggregateType} with ID ${aggregateId} not found`);
  }
}
```

**Solution:**

**A. Check Aggregate Existence Before Loading**

```typescript
@QueryHandler(GetUserQuery)
export class GetUserHandler {
  async handle(query: GetUserQuery) {
    // Check if aggregate exists
    const exists = await this.aggregateAccess.exists(query.userId);

    if (!exists) {
      throw new NotFoundError('User', query.userId);
    }

    // Load aggregate
    const user = await this.aggregateAccess.getById(query.userId);
    return user;
  }
}
```

**B. Use getInstance Pattern for Create Operations**

```typescript
@CommandHandler(CreateUserCommand)
export class CreateUserHandler {
  async handle(command: CreateUserCommand) {
    // Check if user already exists
    const existingUser = await User.getInstance(command.userId);

    if (existingUser) {
      throw new ConflictError('User already exists with this ID');
    }

    // Create new user
    const user = new User(command.userId);
    user.register(command.email, command.password);

    // Save to event store
    await this.aggregateAccess.save(user, correlationId);

    return { userId: user.userId };
  }
}
```

**C. Verify Aggregate ID Format**

```typescript
// Ensure consistent ID format
function normalizeUserId(id: string): string {
  // Remove whitespace
  id = id.trim();

  // Ensure prefix
  if (!id.startsWith('user-')) {
    id = `user-${id}`;
  }

  return id.toLowerCase();
}

// Use normalized ID
const userId = normalizeUserId(command.userId);
const user = await this.aggregateAccess.getById(userId);
```

---

### 4. Event Application Errors

**Symptoms:**
- Error: "AggregateOperationError"
- "Failed to apply event X to aggregate Y"
- Event replay failures
- State reconstruction errors

**Diagnostic Steps:**

```bash
# View event data
docker exec postgres psql -U postgres -d platform -c \
  "SELECT event_type, event_data FROM events WHERE aggregate_id='user-123' ORDER BY aggregate_version;"

# Check for malformed event data
docker exec postgres psql -U postgres -d platform -c \
  "SELECT event_id, event_type FROM events WHERE event_data IS NULL OR event_data = '{}'::jsonb;"

# Test event replay
docker logs my-service 2>&1 | grep -E "Applying event|Event applied|Event application failed"
```

**Common Errors:**

```typescript
// From domain-modeling/aggregate-access.ts
export class AggregateOperationError extends Error {
  constructor(
    operation: string,
    aggregateId: string,
    cause?: Error
  ) {
    super(
      `Failed to ${operation} aggregate ${aggregateId}${
        cause ? `: ${cause.message}` : ''
      }`
    );
  }
}
```

**Solution:**

**A. Implement Proper Event Handlers**

```typescript
import { AggregateRoot, ApplyEvent } from '@banyanai/platform-domain-modeling';

@AggregateRoot()
export class User {
  private userId!: string;
  private email!: string;
  private status!: 'active' | 'inactive';

  // Event handler for UserCreated
  @ApplyEvent('UserCreated')
  private onUserCreated(event: UserCreatedEvent): void {
    this.userId = event.userId;
    this.email = event.email;
    this.status = 'active';
  }

  // Event handler for UserEmailUpdated
  @ApplyEvent('UserEmailUpdated')
  private onEmailUpdated(event: UserEmailUpdatedEvent): void {
    this.email = event.newEmail;
  }

  // Event handler for UserDeactivated
  @ApplyEvent('UserDeactivated')
  private onDeactivated(event: UserDeactivatedEvent): void {
    this.status = 'inactive';
  }
}
```

**B. Validate Event Data**

```typescript
@ApplyEvent('UserCreated')
private onUserCreated(event: UserCreatedEvent): void {
  // Validate required fields
  if (!event.userId) {
    throw new Error('UserCreated event missing userId');
  }

  if (!event.email) {
    throw new Error('UserCreated event missing email');
  }

  // Apply event
  this.userId = event.userId;
  this.email = event.email;
  this.status = 'active';
}
```

**C. Handle Missing Event Handlers**

```typescript
// Override applyEvent to log missing handlers
protected applyEvent(event: DomainEvent): void {
  const handler = this.eventHandlers.get(event.eventType);

  if (!handler) {
    console.warn(`No handler found for event type: ${event.eventType}`);
    // Don't throw - allow replay to continue
    return;
  }

  try {
    handler.call(this, event);
  } catch (error) {
    throw new AggregateOperationError(
      `apply event ${event.eventType}`,
      this.aggregateId,
      error
    );
  }
}
```

---

### 5. Event Migration Issues

**Symptoms:**
- Old events fail to apply after schema changes
- Event version conflicts
- Migration errors during replay
- "No migrations found for event type" errors

**Diagnostic Steps:**

```bash
# Check event versions in store
docker exec postgres psql -U postgres -d platform -c \
  "SELECT event_type, event_data->>'version' as version, COUNT(*) FROM events GROUP BY event_type, version ORDER BY event_type, version;"

# View migration logs
docker logs my-service 2>&1 | grep -E "migration|migrate|evolve"

# Test migration
docker logs my-service 2>&1 | grep "Migrating event"
```

**Common Errors:**

```typescript
// From event-migrator.ts
throw new Error(`No migrations found for event type ${eventType}`); // Line 137

throw new Error(
  `Cannot migrate event ${eventType} from version ${fromVersion} to ${toVersion}: ` +
  `No migration path found`
); // Line 183
```

**Solution:**

**A. Define Event Migrations**

```typescript
import { EventMigration } from '@banyanai/platform-event-sourcing';

// Migration from v1 to v2 of UserCreated event
const userCreatedV1toV2: EventMigration = {
  eventType: 'UserCreated',
  fromVersion: 1,
  toVersion: 2,
  migrate: (eventData: any) => {
    return {
      ...eventData,
      // Add new field with default value
      status: 'active',
      // Rename field
      emailAddress: eventData.email,
      // Remove old field
      email: undefined
    };
  }
};

// Register migration
EventMigrator.registerMigration(userCreatedV1toV2);
```

**B. Apply Migrations During Replay**

```typescript
import { EventMigrator } from '@banyanai/platform-event-sourcing';

// Migrate events during load
async function loadAggregateWithMigration(aggregateId: string) {
  // Get raw events from store
  const events = await eventStore.getEvents(aggregateId);

  // Migrate each event to latest version
  const migratedEvents = events.map(event => {
    const currentVersion = event.eventData.version || 1;
    const targetVersion = 2; // Latest version

    if (currentVersion < targetVersion) {
      return EventMigrator.migrate(event, currentVersion, targetVersion);
    }

    return event;
  });

  // Rebuild aggregate from migrated events
  const aggregate = new User(aggregateId);
  for (const event of migratedEvents) {
    aggregate.applyEvent(event);
  }

  return aggregate;
}
```

**C. Version All Events**

```typescript
// Include version in event data
export class UserCreatedEvent extends DomainEventBase {
  static readonly VERSION = 2;

  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly status: string
  ) {
    super();
  }

  toJSON() {
    return {
      version: UserCreatedEvent.VERSION,
      userId: this.userId,
      email: this.email,
      status: this.status
    };
  }
}
```

---

### 6. Event Replay Performance Issues

**Symptoms:**
- Slow aggregate loading
- High CPU during replay
- Memory issues with large aggregates
- Timeout errors on aggregate load

**Diagnostic Steps:**

```bash
# Count events per aggregate
docker exec postgres psql -U postgres -d platform -c \
  "SELECT aggregate_id, COUNT(*) as event_count FROM events GROUP BY aggregate_id ORDER BY event_count DESC LIMIT 20;"

# Check aggregate with most events
docker exec postgres psql -U postgres -d platform -c \
  "SELECT aggregate_id, MAX(aggregate_version) as max_version FROM events GROUP BY aggregate_id ORDER BY max_version DESC LIMIT 10;"

# Measure replay time
time docker exec postgres psql -U postgres -d platform -c \
  "SELECT * FROM events WHERE aggregate_id='user-with-many-events' ORDER BY aggregate_version;"
```

**Solution:**

**A. Implement Snapshots**

```typescript
import { SnapshotStore } from '@banyanai/platform-event-sourcing';

// Save snapshot periodically
async function saveWithSnapshot(aggregate: User) {
  await this.aggregateAccess.save(aggregate, correlationId);

  // Create snapshot every 100 events
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

// Load from snapshot + replay remaining events
async function loadFromSnapshot(aggregateId: string) {
  // Get latest snapshot
  const snapshot = await snapshotStore.getLatestSnapshot(aggregateId, 'User');

  if (snapshot) {
    // Create aggregate from snapshot
    const user = User.fromSnapshot(snapshot.state);

    // Replay events after snapshot
    const events = await eventStore.getEvents(aggregateId, snapshot.version + 1);
    for (const event of events) {
      user.applyEvent(event);
    }

    return user;
  }

  // No snapshot, load from beginning
  return this.aggregateAccess.getById(aggregateId);
}
```

**B. Batch Event Loading**

```typescript
// Load events in batches to reduce memory
async function loadLargeAggregate(aggregateId: string, batchSize = 1000) {
  const aggregate = new User(aggregateId);
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const events = await eventStore.getEvents(aggregateId, offset, batchSize);

    for (const event of events) {
      aggregate.applyEvent(event);
    }

    hasMore = events.length === batchSize;
    offset += batchSize;
  }

  return aggregate;
}
```

**C. Add Database Indexes**

```sql
-- Optimize event loading by aggregate_id
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_aggregate_id_version
  ON events(aggregate_id, aggregate_version);

-- Optimize event type queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_type_occurred
  ON events(event_type, occurred_at DESC);

-- Analyze table statistics
ANALYZE events;
```

**D. Archive Old Events**

```sql
-- Move old events to archive table
CREATE TABLE events_archive (LIKE events INCLUDING ALL);

-- Archive events older than 1 year
WITH archived AS (
  DELETE FROM events
  WHERE occurred_at < NOW() - INTERVAL '1 year'
  RETURNING *
)
INSERT INTO events_archive SELECT * FROM archived;

-- Or partition events table by date
CREATE TABLE events (
  event_id TEXT NOT NULL,
  aggregate_id TEXT NOT NULL,
  -- ... other fields
  occurred_at TIMESTAMP NOT NULL
) PARTITION BY RANGE (occurred_at);

-- Create monthly partitions
CREATE TABLE events_2024_01 PARTITION OF events
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

---

### 7. Event Replay Deadlocks

**Symptoms:**
- Database deadlock errors during event replay
- "Replay already in progress" errors
- Concurrent replay conflicts
- Hanging replay operations

**Diagnostic Steps:**

```bash
# Check for active replays
docker exec postgres psql -U postgres -d platform -c \
  "SELECT * FROM pg_stat_activity WHERE query LIKE '%events%' AND state = 'active';"

# Check for locks
docker exec postgres psql -U postgres -d platform -c \
  "SELECT * FROM pg_locks WHERE relation::regclass::text = 'events';"

# View replay logs
docker logs my-service 2>&1 | grep -E "Replay|replaying"
```

**Common Errors:**

```typescript
// From event-replayer.ts
throw new Error('Replay already in progress'); // Line 88
throw new Error('Progress not initialized'); // Line 176
```

**Solution:**

**A. Use Replay Lock**

```typescript
import { EventReplayer } from '@banyanai/platform-event-sourcing';

const replayer = new EventReplayer(eventStore);

// Ensure only one replay runs at a time
try {
  await replayer.startReplay({
    fromTimestamp: new Date('2024-01-01'),
    toTimestamp: new Date(),
    batchSize: 1000
  });
} catch (error) {
  if (error.message === 'Replay already in progress') {
    console.log('Replay is already running, skipping');
    return;
  }
  throw error;
}
```

**B. Implement Replay Progress Tracking**

```sql
-- Create replay progress table
CREATE TABLE IF NOT EXISTS replay_progress (
  replay_id TEXT PRIMARY KEY,
  started_at TIMESTAMP NOT NULL,
  last_event_id TEXT,
  last_processed_at TIMESTAMP,
  status TEXT NOT NULL,
  error_message TEXT,
  total_events INTEGER,
  processed_events INTEGER
);

-- Track progress
INSERT INTO replay_progress (replay_id, started_at, status, total_events, processed_events)
VALUES ('replay-2024-01', NOW(), 'in_progress', 10000, 0);

-- Update progress
UPDATE replay_progress
SET processed_events = processed_events + 100,
    last_processed_at = NOW()
WHERE replay_id = 'replay-2024-01';
```

**C. Use Advisory Locks**

```typescript
// Acquire advisory lock before replay
async function replayWithLock(replayId: string) {
  const lockId = hashCode(replayId); // Convert to integer

  const client = await pool.connect();
  try {
    // Try to acquire lock
    const result = await client.query(
      'SELECT pg_try_advisory_lock($1) as locked',
      [lockId]
    );

    if (!result.rows[0].locked) {
      throw new Error('Replay already in progress');
    }

    // Perform replay
    await doReplay();

  } finally {
    // Release lock
    await client.query('SELECT pg_advisory_unlock($1)', [lockId]);
    client.release();
  }
}
```

---

## Best Practices

### 1. Always Initialize Schema

```typescript
// In service startup
const eventStore = new PostgresEventStore(dbConfig);
await eventStore.initializeSchema();
```

### 2. Handle Concurrency Conflicts

```typescript
// Retry on concurrency errors
async function saveWithRetry(aggregate, correlationId, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await aggregateAccess.save(aggregate, correlationId);
    } catch (error) {
      if (error instanceof AggregateConcurrencyError && i < maxRetries - 1) {
        await sleep(100 * (i + 1));
        continue;
      }
      throw error;
    }
  }
}
```

### 3. Use Snapshots for Large Aggregates

```typescript
// Snapshot every 100 events
if (aggregate.version % 100 === 0) {
  await snapshotStore.saveSnapshot(aggregate);
}
```

### 4. Version All Events

```typescript
// Include version in every event
export class UserCreatedEvent {
  static readonly VERSION = 1;

  toJSON() {
    return {
      version: UserCreatedEvent.VERSION,
      // ... event data
    };
  }
}
```

### 5. Monitor Event Store Health

```typescript
// Track event store metrics
setInterval(async () => {
  const metrics = {
    totalEvents: await countEvents(),
    eventsPerSecond: await calculateEventRate(),
    avgReplayTime: await measureReplayTime()
  };

  Logger.metric('event-store-health', metrics);
}, 60000);
```

---

## Related Documentation

- [Event Sourcing Concepts](../../02-core-concepts/event-sourcing.md)
- [Event Sourcing Issues](../by-symptom/event-sourcing-issues.md)
- [Error Catalog - Event Store Errors](../common-errors/error-catalog.md#event-store-errors)
- [Read Model Issues](./read-model-issues.md)

---

## Summary

Most event store issues are caused by:

1. **Missing schema initialization** - Call `initializeSchema()` before use
2. **Concurrency conflicts** - Implement retry logic for concurrent updates
3. **Missing event handlers** - Add `@ApplyEvent` for all event types
4. **Large aggregates** - Use snapshots for aggregates with many events
5. **Event migrations** - Version events and define migration paths

Use database queries and replay debugging to diagnose event store issues.
