---
title: Read Model Issues
description: Troubleshooting guide for read model projections, lag, and synchronization problems
category: troubleshooting
tags: [read-models, event-sourcing, projections, cqrs, lag]
related:
  - ../../02-core-concepts/event-sourcing.md
  - ../../02-core-concepts/cqrs.md
  - ../common-errors/error-catalog.md
difficulty: intermediate
---

# Read Model Issues

Read models are projections of domain events that provide optimized views for queries. This guide helps diagnose and resolve common read model problems.

## Overview

Read models in banyan-core:
- Are built from domain events via projections
- Use PostgreSQL JSONB for flexible storage
- Support automatic field mappings with `@MapFromEvent`
- Include catchup processing for new fields
- Run real-time projections on message bus events

## Common Problems

### 1. Read Model Projection Lag

**Symptoms:**
- Queries return stale data
- Recent changes not visible in read model
- Read model version behind event stream
- Time delay between command and query results

#### Causes and Solutions

**A. Message Bus Subscription Not Active**

Check if read model is subscribed to events:

```typescript
// In service startup, verify read model manager is initialized
const readModelManager = new ReadModelManager(
  eventStore,
  dbConfig,
  'my-service'
);

// Set message bus client BEFORE setting up projections
readModelManager.setMessageBusClient(messageBusClient);

// Initialize read models (this sets up subscriptions)
await readModelManager.initialize([UserReadModel], {
  enableCatchup: true
});
```

**Diagnostic Query:**

```sql
-- Check read model update timestamps
SELECT
  id,
  projection_name,
  version,
  updated_at,
  EXTRACT(EPOCH FROM (NOW() - updated_at)) as seconds_since_update
FROM projections
WHERE projection_name = 'user_read_model'
ORDER BY updated_at DESC
LIMIT 10;
```

**Resolution:**
1. Ensure `readModelManager.setMessageBusClient()` is called before `initialize()`
2. Verify message bus connection is healthy
3. Check service logs for subscription errors

**B. Event Store vs Message Bus Subscription Mismatch**

Read models subscribe to events via either:
1. **Message Bus** (real-time, preferred)
2. **Event Store** (fallback, polling-based)

```typescript
// Check which subscription method is active
console.log('Message bus client available:', !!messageBusClient);

// Message bus subscription (real-time):
// [ReadModelManager] Subscribing to event 'UserCreated' via message bus

// Event store subscription (fallback):
// [ReadModelManager] Subscribing to event 'UserCreated' via event store
```

**Resolution:**
- Ensure message bus client is set for real-time projections
- If using event store fallback, implement polling or manual catchup

**C. Projection Processing Failures**

Events arrive but fail to update read model:

```typescript
// Check logs for projection errors
[ReadModelManager] ERROR: Failed to persist projection user_read_model
  for aggregate user-123: ...
```

**Diagnostic Steps:**

```sql
-- Check for failed projections
SELECT
  id,
  projection_name,
  version,
  data,
  updated_at
FROM projections
WHERE projection_name = 'user_read_model'
  AND updated_at < NOW() - INTERVAL '5 minutes'
ORDER BY updated_at ASC
LIMIT 20;
```

**Resolution:**
1. Check projection handler logic for errors
2. Verify event data contains required fields
3. Review `@MapFromEvent` decorator mappings
4. Check database connectivity and permissions

**D. Catchup Process Not Run**

New fields added to read model but historical data not backfilled:

```typescript
// Catchup runs automatically on service startup
// Check logs for catchup completion
[ReadModelManager] Starting catchup for read model: user_read_model
  with 3 new mappings
[ReadModelManager] Catchup completed for read model: user_read_model
```

**Manual Catchup:**

```typescript
import { ReadModelManager } from '@banyanai/platform-event-sourcing';

// Force catchup for specific read model
const readModelManager = new ReadModelManager(eventStore, dbConfig, 'my-service');
await readModelManager.runCatchupProcess(UserReadModel);
```

**Resolution:**
1. Enable catchup in read model config: `enableCatchup: true`
2. Run manual catchup if automatic catchup disabled
3. Check catchup logs for errors

**E. High Event Volume Overwhelming Projections**

Too many events causing projection lag:

```sql
-- Check projection throughput
SELECT
  projection_name,
  COUNT(*) as total_projections,
  MIN(updated_at) as oldest_update,
  MAX(updated_at) as newest_update,
  EXTRACT(EPOCH FROM (MAX(updated_at) - MIN(updated_at))) / COUNT(*)
    as avg_update_interval_seconds
FROM projections
GROUP BY projection_name;
```

**Resolution:**
1. Increase batch processing size in catchup config
2. Optimize projection handlers (avoid N+1 queries)
3. Add indexes to read model fields
4. Consider read model sharding for high-volume aggregates

**F. Database Connection Pool Exhaustion**

Read model queries consuming all database connections:

```typescript
// Check pool configuration
const readModelManager = new ReadModelManager(
  eventStore,
  {
    ...dbConfig,
    poolSize: 20, // Increase from default 10
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000
  },
  'my-service'
);
```

**Diagnostic Query:**

```sql
-- PostgreSQL: Check active connections
SELECT
  COUNT(*) as active_connections,
  MAX(now() - state_change) as longest_active_duration
FROM pg_stat_activity
WHERE datname = 'your_database_name'
  AND state = 'active';
```

**Resolution:**
1. Increase connection pool size
2. Optimize query patterns to release connections quickly
3. Implement connection pooling at service level
4. Review slow queries and add indexes

### 2. Read Model Not Updating

**Symptoms:**
- Read model remains unchanged after events published
- No errors in logs
- Event store shows events but read model stale

#### Diagnostic Steps

**Step 1: Verify Event Publishing**

```sql
-- Check if events exist in event store
SELECT
  event_id,
  aggregate_id,
  event_type,
  occurred_at
FROM events
WHERE aggregate_id = 'user-123'
ORDER BY aggregate_version DESC
LIMIT 10;
```

**Step 2: Check Read Model Subscription**

```typescript
// In read model class, verify @MapFromEvent decorators
@ReadModel({ tableName: 'user_read_model' })
export class UserReadModel extends ReadModelBase<UserReadModel> {
  @MapFromEvent('UserCreated', 'userId') // Event type must match exactly
  userId!: string;

  @MapFromEvent('UserCreated', 'email')
  email!: string;
}
```

**Step 3: Check Event Type Naming**

```typescript
// Event name in decorator must match event type in event store
// Common mistake: Typo or case mismatch

// WRONG: Event published as 'UserCreated', decorator says 'UserCreatedEvent'
@MapFromEvent('UserCreatedEvent', 'userId') // ❌ Won't match

// CORRECT: Event type matches exactly
@MapFromEvent('UserCreated', 'userId') // ✓ Matches
```

**Step 4: Verify Message Bus Event Delivery**

Check message bus logs for event delivery:

```
[MessageBusClient] Publishing event: UserCreated
[MessageBusClient] Event delivered to queue: UserCreated
```

**Step 5: Test Projection Manually**

```typescript
// Test projection handler directly
const readModel = new UserReadModel();
const event: DomainEvent = {
  eventId: 'evt-123',
  aggregateId: 'user-123',
  aggregateType: 'User',
  aggregateVersion: 1,
  eventType: 'UserCreated',
  eventData: {
    userId: 'user-123',
    email: 'test@example.com'
  },
  occurredAt: new Date(),
  correlationId: 'corr-123'
};

await readModel.handleEvent(event);
await readModel.save();

console.log('Manually projected:', readModel);
```

#### Resolutions

**1. Event Type Mismatch:**

```typescript
// Fix decorator to match actual event type
@MapFromEvent('UserCreated', 'userId') // Must match event.eventType
```

**2. Missing Message Bus Client:**

```typescript
// Ensure message bus client is set
readModelManager.setMessageBusClient(messageBusClient);
```

**3. Database Permissions:**

```sql
-- Grant write permissions on projections table
GRANT INSERT, UPDATE, DELETE ON projections TO your_service_user;
```

**4. Projection Handler Errors:**

Check logs for errors in projection processing:

```
[ReadModelManager] ERROR: Real-time projection subscription failed
  for user_read_model event UserCreated
```

Wrap projection logic in try-catch for debugging:

```typescript
@EventHandler('UserCreated')
async onUserCreated(event: DomainEvent): Promise<void> {
  try {
    this.email = event.eventData.email;
    this.createdAt = event.eventData.createdAt;
  } catch (error) {
    console.error('Projection error:', error);
    throw error; // Re-throw to log at subscription level
  }
}
```

### 3. Stale Data in Queries

**Symptoms:**
- Queries return old data after updates
- Cache not invalidating properly
- Inconsistent query results across requests

#### Causes and Solutions

**A. CQRS Query Cache Not Invalidating**

The CQRS package includes automatic caching:

```typescript
// Check if query cache is enabled and properly configured
import { QueryBus } from '@banyanai/platform-cqrs';

// Cache invalidation should happen automatically on events
// But may fail if:
// 1. Cache key doesn't match query parameters
// 2. Event-to-query mapping not configured
// 3. Redis connection issues
```

**Diagnostic:**

```typescript
// Check cache hit/miss rates in logs
[QueryBus] Cache hit for query: GetUser (userId: user-123)
[QueryBus] Cache miss for query: GetUser (userId: user-123)
```

**Resolution:**

```typescript
// Disable caching for specific query to verify issue
@QueryHandler(GetUserQuery, { enableCache: false })
export class GetUserHandler {
  // ...
}

// Or invalidate cache manually
await queryBus.invalidateCache(GetUserQuery, { userId: 'user-123' });
```

**B. Read Model Not Updated (See Section 2)**

Follow diagnostic steps in "Read Model Not Updating" section.

**C. Multiple Database Replicas with Replication Lag**

If using read replicas, data may lag behind primary:

```sql
-- PostgreSQL: Check replication lag
SELECT
  client_addr,
  state,
  sent_lsn,
  write_lsn,
  flush_lsn,
  replay_lsn,
  EXTRACT(EPOCH FROM (NOW() - replay_timestamp)) as lag_seconds
FROM pg_stat_replication;
```

**Resolution:**
- Configure connection to read from primary for critical queries
- Implement stale-while-revalidate pattern
- Use eventual consistency patterns in UI

### 4. Projection Failures

**Symptoms:**
- Errors in projection handler execution
- Events not applying to read model
- Database constraint violations

#### Common Projection Errors

**A. Field Mapping Errors**

```typescript
// ERROR: Cannot read property 'email' of undefined
@MapFromEvent('UserCreated', 'profile.email') // Nested path
email!: string;

// If event data doesn't have nested structure, use sourceField correctly
@MapFromEvent('UserCreated', 'email') // Direct field
email!: string;
```

**Resolution:**

```typescript
// Verify event structure matches mapping
const event = {
  eventData: {
    email: 'user@example.com', // Direct field
    // NOT: profile: { email: 'user@example.com' }
  }
};

// Or use transformer for complex mappings
@MapFromEvent('UserCreated', 'email', {
  transformer: (value) => value?.toLowerCase()
})
email!: string;
```

**B. Database Constraint Violations**

```
ERROR: duplicate key value violates unique constraint "idx_user_email"
```

**Resolution:**

```sql
-- Check for duplicate data
SELECT email, COUNT(*)
FROM projections
WHERE projection_name = 'user_read_model'
GROUP BY data->>'email'
HAVING COUNT(*) > 1;

-- Resolve duplicates before projection
```

**C. Type Conversion Errors**

```typescript
// ERROR: Invalid date format
@MapFromEvent('UserCreated', 'createdAt')
createdAt!: Date;

// Use transformer for type conversion
@MapFromEvent('UserCreated', 'createdAt', {
  transformer: (value) => new Date(value)
})
createdAt!: Date;
```

**D. Null/Undefined Fields**

```typescript
// Handle optional fields
@MapFromEvent('UserUpdated', 'phoneNumber', {
  transformer: (value) => value ?? null
})
phoneNumber!: string | null;
```

### 5. Event Replay Procedures

When read models need rebuilding from event history:

#### Full Rebuild

```typescript
import { ReadModelManager } from '@banyanai/platform-event-sourcing';

async function rebuildReadModel() {
  const readModelManager = new ReadModelManager(
    eventStore,
    dbConfig,
    'my-service'
  );

  // 1. Truncate existing read model data
  await truncateReadModel('user_read_model');

  // 2. Run full catchup
  await readModelManager.runCatchupForNewFields(
    {
      tableName: 'user_read_model',
      readModelClass: UserReadModel
    },
    {
      batchSize: 1000,
      enableLogging: true
    }
  );

  console.log('Read model rebuild complete');
}

async function truncateReadModel(projectionName: string) {
  const client = await pool.connect();
  try {
    await client.query(
      'DELETE FROM projections WHERE projection_name = $1',
      [projectionName]
    );
  } finally {
    client.release();
  }
}
```

#### Incremental Catchup (New Fields Only)

```typescript
// Add new field to read model
@ReadModel({ tableName: 'user_read_model' })
export class UserReadModel extends ReadModelBase<UserReadModel> {
  // Existing fields
  @MapFromEvent('UserCreated', 'userId')
  userId!: string;

  // NEW FIELD - will trigger catchup automatically on startup
  @MapFromEvent('UserUpdated', 'lastLoginAt', {
    transformer: (value) => new Date(value)
  })
  lastLoginAt?: Date;
}

// On service restart, catchup runs automatically:
// [ReadModelManager] Detected new mappings for user_read_model
// [ReadModelManager] Running catchup for 1 new field: lastLoginAt
// [ReadModelManager] Catchup completed
```

#### Manual Catchup for Specific Aggregate

```typescript
async function catchupSpecificAggregate(aggregateId: string) {
  // Get all events for aggregate
  const events = await eventStore.getEvents(aggregateId);

  // Load or create read model
  let readModel = await UserReadModel.findById(aggregateId);
  if (!readModel) {
    readModel = new UserReadModel();
  }

  // Apply all events
  for (const event of events) {
    await readModel.handleEvent(event);
  }

  // Save final state
  await readModel.save();
}
```

### 6. Performance Optimization for Projections

#### Add Indexes for Query Performance

```typescript
@ReadModel({ tableName: 'user_read_model' })
export class UserReadModel extends ReadModelBase<UserReadModel> {
  @MapFromEvent('UserCreated', 'userId')
  @Index({ type: 'btree', unique: true }) // BTREE index for exact matches
  userId!: string;

  @MapFromEvent('UserCreated', 'email')
  @Index({ type: 'btree', unique: true }) // Enforce uniqueness
  email!: string;

  @MapFromEvent('UserUpdated', 'organizationId')
  @Index({ type: 'btree' }) // Index for filtering
  organizationId?: string;

  @MapFromEvent('UserCreated', 'metadata')
  @Index({ type: 'gin' }) // GIN index for JSONB queries
  metadata?: Record<string, unknown>;
}
```

#### Batch Event Processing

```typescript
// Configure batch size for catchup
await readModelManager.initialize([UserReadModel], {
  enableCatchup: true,
  catchupBatchSize: 500 // Process 500 events at a time
});
```

#### Optimize Projection Handlers

```typescript
// BAD: N+1 query pattern
@EventHandler('UserUpdated')
async onUserUpdated(event: DomainEvent): Promise<void> {
  const org = await OrganizationReadModel.findById(
    event.eventData.organizationId
  ); // Separate query for each event
  this.organizationName = org?.name;
}

// GOOD: Batch load or denormalize
@EventHandler('UserUpdated')
async onUserUpdated(event: DomainEvent): Promise<void> {
  // Just store the ID, query organization separately
  this.organizationId = event.eventData.organizationId;
  // OR: Denormalize by including name in event
  this.organizationName = event.eventData.organizationName;
}
```

## Debugging Tools and Techniques

### Enable Detailed Logging

```typescript
// Set environment variable
process.env.LOG_LEVEL = 'debug';

// Logs will show:
// [ReadModelManager] Subscribing to event 'UserCreated' for user_read_model
// [ReadModelManager] Real-time projection: Applying 'UserCreated' to user_read_model
// [ReadModelManager] Projection persisted: user_read_model.email for aggregate user-123
```

### Query Projection Status

```sql
-- Check read model health
SELECT
  projection_name,
  COUNT(*) as total_records,
  MIN(updated_at) as oldest_update,
  MAX(updated_at) as newest_update,
  AVG(version) as avg_version
FROM projections
GROUP BY projection_name;

-- Find stale projections
SELECT
  id,
  projection_name,
  version,
  updated_at,
  EXTRACT(EPOCH FROM (NOW() - updated_at)) / 60 as minutes_since_update
FROM projections
WHERE updated_at < NOW() - INTERVAL '1 hour'
ORDER BY updated_at ASC;

-- Check for missing projections
SELECT DISTINCT aggregate_id
FROM events
WHERE aggregate_id NOT IN (
  SELECT id FROM projections WHERE projection_name = 'user_read_model'
);
```

### Monitor Read Model Health

```typescript
// Get read model health metrics
const health = await readModelManager.getReadModelHealth(UserReadModel);

console.log({
  tableName: health.tableName,
  recordCount: health.recordCount,
  isHealthy: health.isHealthy,
  error: health.error
});

// Get performance metrics
const metrics = await readModelManager.getReadModelMetrics(UserReadModel);

console.log({
  recordCount: metrics.recordCount,
  averageProcessingTime: metrics.averageProcessingTime,
  lastUpdated: metrics.lastUpdated
});
```

### Test Event Projection

```typescript
// Unit test for projection
import { UserReadModel } from './UserReadModel';
import type { DomainEvent } from '@banyanai/platform-event-sourcing';

describe('UserReadModel', () => {
  it('should project UserCreated event', async () => {
    const readModel = new UserReadModel();

    const event: DomainEvent = {
      eventId: 'evt-123',
      aggregateId: 'user-123',
      aggregateType: 'User',
      aggregateVersion: 1,
      eventType: 'UserCreated',
      eventData: {
        userId: 'user-123',
        email: 'test@example.com',
        name: 'Test User'
      },
      occurredAt: new Date(),
      correlationId: 'corr-123'
    };

    await readModel.handleEvent(event);

    expect(readModel.userId).toBe('user-123');
    expect(readModel.email).toBe('test@example.com');
    expect(readModel.name).toBe('Test User');
  });
});
```

## Common Error Messages

### "ReadModelBase not initialized"

```
Error: ReadModelBase not initialized. Call ReadModelBase.initialize() first.
```

**Cause**: Read model base class not initialized with database config.

**Resolution:**

```typescript
import { ReadModelBase } from '@banyanai/platform-event-sourcing';

// Initialize before using read models
ReadModelBase.initialize(dbConfig, 'my-service');
```

### "Projections table not found"

```
Error: Projections table not found in public schema.
Ensure PostgresEventStore.initializeSchema() has been called first.
```

**Cause**: Event store schema not initialized before read models.

**Resolution:**

```typescript
// Initialize event store BEFORE read models
await eventStore.initializeSchema();

// Then initialize read models
await readModelManager.initialize([UserReadModel]);
```

### "Failed to persist projection"

```
[ReadModelManager] ERROR: Failed to persist projection user_read_model.email
for aggregate user-123: duplicate key value violates unique constraint
```

**Cause**: Unique constraint violation in database.

**Resolution:**
1. Check for duplicate records
2. Review unique indexes on read model
3. Handle idempotency in projection logic

## Best Practices

### 1. Design Idempotent Projections

```typescript
// Projections should produce same result when replayed
@EventHandler('UserUpdated')
async onUserUpdated(event: DomainEvent): Promise<void> {
  // ✓ GOOD: Deterministic
  this.email = event.eventData.email;
  this.updatedAt = new Date(event.eventData.updatedAt);

  // ❌ BAD: Non-deterministic (uses current time)
  // this.lastModified = new Date();
}
```

### 2. Use Transformers for Complex Mappings

```typescript
@MapFromEvent('UserCreated', 'email', {
  transformer: (email: string) => email.toLowerCase().trim()
})
email!: string;
```

### 3. Add Indexes for Query Patterns

```typescript
// Index fields used in WHERE clauses
@Index({ type: 'btree' })
organizationId!: string;

// Use GIN for JSONB containment queries
@Index({ type: 'gin' })
metadata!: Record<string, unknown>;
```

### 4. Monitor Projection Lag

```typescript
// Track time between event and projection
setInterval(async () => {
  const metrics = await readModelManager.getReadModelMetrics(UserReadModel);
  const lagSeconds = (Date.now() - metrics.lastUpdated.getTime()) / 1000;

  if (lagSeconds > 60) {
    console.warn(`Read model lag detected: ${lagSeconds}s`);
  }
}, 30000); // Check every 30 seconds
```

### 5. Handle Eventual Consistency in UI

```typescript
// Show optimistic updates while waiting for projection
async function updateUser(userId: string, email: string) {
  // Execute command
  await commandBus.execute(new UpdateUserCommand(userId, email));

  // Optimistically update UI
  setLocalUserEmail(email);

  // Poll for projection update
  await waitForProjection(userId, (user) => user.email === email);

  // Refresh from server
  const user = await queryBus.execute(new GetUserQuery(userId));
  setUserFromServer(user);
}
```

## Related Documentation

- [Event Sourcing Concepts](../../02-core-concepts/event-sourcing.md)
- [CQRS Pattern](../../02-core-concepts/cqrs.md)
- [Error Catalog](../common-errors/error-catalog.md)
- [Performance Optimization](../../04-operations/performance.md)

## Additional Support

For persistent read model issues:
1. Check [Error Catalog](../common-errors/error-catalog.md) for specific error codes
2. Review service logs for detailed error messages
3. Run database diagnostics for connection and query issues
4. Consider filing an issue with reproduction steps
