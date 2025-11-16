---
title: Performance Issues
description: Troubleshooting slow queries, memory leaks, and high CPU usage
category: troubleshooting
tags: [performance, optimization, memory, cpu, slow-queries]
related:
  - ../../04-reference/performance-tuning.md
  - ../by-component/read-model-issues.md
  - ../debugging-tools/jaeger-tracing.md
difficulty: advanced
---

# Performance Issues

Quick reference for diagnosing and fixing performance problems.

## Quick Diagnosis

```bash
# Check service resource usage
docker stats my-service --no-stream

# View slow query logs
docker logs my-service 2>&1 | grep -i "slow\|timeout\|performance"

# Check database connections
docker exec postgres psql -U postgres -d platform -c \
  "SELECT count(*), state FROM pg_stat_activity GROUP BY state;"

# View Jaeger traces for slow operations
open http://localhost:16686

# Check memory usage
docker exec my-service node -e "console.log(process.memoryUsage())"
```

## Common Performance Problems

### 1. Slow Query Performance

**Symptom:** Queries taking >5 seconds, timeouts

**Diagnostic:**
```bash
# Enable slow query logging in PostgreSQL
docker exec postgres psql -U postgres -c \
  "ALTER SYSTEM SET log_min_duration_statement = 1000;"  # Log queries >1s

# View slow queries
docker logs postgres 2>&1 | grep "duration:"

# Check query execution plan
docker exec postgres psql -U postgres -d platform -c \
  "EXPLAIN ANALYZE SELECT * FROM projections WHERE projection_name='user_read_model';"
```

**Fix - Add Database Indexes:**
```sql
-- Index for projection queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projections_name_id
  ON projections(projection_name, id);

-- Index for JSONB queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_projections_email
  ON projections((data->>'email'));

-- Compound index for common filters
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_aggregate_type_occurred
  ON events(aggregate_type, occurred_at DESC);

-- Analyze table for query planner
ANALYZE projections;
ANALYZE events;
```

**Fix - Enable Query Caching:**
```typescript
@QueryHandler(GetUserQuery, {
  cacheTTL: 3600,  // Cache for 1 hour
  cacheKey: (query) => `user:${query.userId}`
})
export class GetUserHandler {
  async handle(query: GetUserQuery) {
    // Result cached automatically
    return await this.userRepository.findById(query.userId);
  }
}
```

**Fix - Optimize N+1 Queries:**
```typescript
// ❌ WRONG: N+1 query pattern
@QueryHandler(ListUsersWithPostsQuery)
export class ListUsersWithPostsHandler {
  async handle(query: ListUsersWithPostsQuery) {
    const users = await this.userRepository.findAll();

    // N additional queries!
    for (const user of users) {
      user.posts = await this.postRepository.findByUserId(user.id);
    }

    return users;
  }
}

// ✓ CORRECT: Batch query
@QueryHandler(ListUsersWithPostsQuery)
export class ListUsersWithPostsHandler {
  async handle(query: ListUsersWithPostsQuery) {
    const users = await this.userRepository.findAll();
    const userIds = users.map(u => u.id);

    // Single batch query
    const allPosts = await this.postRepository.findByUserIds(userIds);

    // Group in memory
    const postsByUserId = groupBy(allPosts, 'userId');
    for (const user of users) {
      user.posts = postsByUserId[user.id] || [];
    }

    return users;
  }
}
```

### 2. High Memory Usage

**Symptom:** Service memory increasing over time, crashes with OOM

**Diagnostic:**
```bash
# Monitor memory over time
watch -n 5 'docker stats my-service --no-stream --format "{{.MemUsage}}"'

# Take heap snapshot
docker exec my-service node -e "require('v8').writeHeapSnapshot('/tmp/heap.heapsnapshot')"
docker cp my-service:/tmp/heap.heapsnapshot ./

# Check for memory leaks
docker logs my-service 2>&1 | grep -i "heap\|memory"

# View event store size
docker exec postgres psql -U postgres -d platform -c \
  "SELECT pg_size_pretty(pg_total_relation_size('events'));"
```

**Fix - Limit Batch Sizes:**
```typescript
// ❌ WRONG: Loading all events at once
async function loadAggregate(aggregateId: string) {
  const events = await eventStore.getEvents(aggregateId);  // Could be 10,000+ events
  // OOM if aggregate has many events
}

// ✓ CORRECT: Batch loading with snapshots
async function loadAggregate(aggregateId: string) {
  const snapshot = await snapshotStore.getLatest(aggregateId);

  if (snapshot) {
    const aggregate = Aggregate.fromSnapshot(snapshot.state);
    const events = await eventStore.getEvents(
      aggregateId,
      snapshot.version + 1,  // Only events after snapshot
      1000  // Batch size limit
    );
    return aggregate;
  }

  // Load in batches for aggregates without snapshot
  return loadInBatches(aggregateId, 1000);
}
```

**Fix - Stream Large Result Sets:**
```typescript
// ❌ WRONG: Loading all results into memory
@QueryHandler(ExportAllUsersQuery)
export class ExportAllUsersHandler {
  async handle(query: ExportAllUsersQuery) {
    const allUsers = await this.userRepository.findAll();  // Could be millions
    return allUsers;  // OOM!
  }
}

// ✓ CORRECT: Stream results
@QueryHandler(ExportAllUsersQuery)
export class ExportAllUsersHandler {
  async *handle(query: ExportAllUsersQuery) {
    const pageSize = 1000;
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const users = await this.userRepository.findAll({
        limit: pageSize,
        offset
      });

      for (const user of users) {
        yield user;  // Stream one at a time
      }

      hasMore = users.length === pageSize;
      offset += pageSize;
    }
  }
}
```

**Fix - Clear Caches Periodically:**
```typescript
// Add cache eviction
setInterval(() => {
  const memUsage = process.memoryUsage();
  const heapUsedMB = memUsage.heapUsed / 1024 / 1024;

  if (heapUsedMB > 1024) {  // If using >1GB
    console.log('High memory usage, clearing cache');
    cache.clear();

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }
}, 60000);
```

### 3. High CPU Usage

**Symptom:** CPU usage consistently >80%, slow response times

**Diagnostic:**
```bash
# Monitor CPU usage
docker stats my-service --no-stream --format "{{.CPUPerc}}"

# Check for busy loops
docker exec my-service node -e "const v8 = require('v8'); console.log(v8.getHeapStatistics())"

# View CPU profiling in Jaeger
open http://localhost:16686
```

**Fix - Optimize Event Loops:**
```typescript
// ❌ WRONG: Blocking event loop
@CommandHandler(ProcessAllUsersCommand)
export class ProcessAllUsersHandler {
  async handle(command: ProcessAllUsersCommand) {
    const users = await this.userRepository.findAll();

    // Blocking loop - processes all users synchronously
    for (const user of users) {
      await this.processUser(user);
    }
  }
}

// ✓ CORRECT: Process in batches with yields
@CommandHandler(ProcessAllUsersCommand)
export class ProcessAllUsersHandler {
  async handle(command: ProcessAllUsersCommand) {
    const users = await this.userRepository.findAll();

    // Process in batches
    const batchSize = 100;
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);

      await Promise.all(batch.map(user => this.processUser(user)));

      // Yield to event loop between batches
      await new Promise(resolve => setImmediate(resolve));
    }
  }
}
```

**Fix - Use Worker Threads for CPU-Intensive Tasks:**
```typescript
import { Worker } from 'worker_threads';

async function processDataIntensive(data: any) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./cpu-intensive-worker.js', {
      workerData: data
    });

    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}
```

### 4. Read Model Projection Lag

**Symptom:** Read models not updating, stale data

**Diagnostic:**
```bash
# Check projection lag
docker exec postgres psql -U postgres -d platform -c \
  "SELECT
     projection_name,
     COUNT(*) as total,
     MAX(updated_at) as last_update,
     EXTRACT(EPOCH FROM (NOW() - MAX(updated_at))) as lag_seconds
   FROM projections
   GROUP BY projection_name;"

# View projection errors
docker logs my-service 2>&1 | grep "projection\|read model"
```

**Fix - Optimize Projection Handlers:**
```typescript
// ❌ WRONG: N+1 queries in projection
@EventHandler('UserCreated')
async onUserCreated(event: DomainEvent): Promise<void> {
  // Separate query for each related entity
  const org = await OrganizationReadModel.findById(event.orgId);  // N+1!
  this.organizationName = org?.name;
}

// ✓ CORRECT: Denormalize data in events
@EventHandler('UserCreated')
async onUserCreated(event: DomainEvent): void {
  // Event includes denormalized data
  this.organizationName = event.organizationName;
  // No additional query needed
}
```

**Fix - Batch Projection Updates:**
```typescript
// Configure batch processing
await readModelManager.initialize([UserReadModel], {
  enableCatchup: true,
  catchupBatchSize: 500,  // Process 500 events at a time
  enableLogging: true
});
```

### 5. Connection Pool Exhaustion

**Symptom:** "Pool exhausted" errors, slow database queries

**Diagnostic:**
```bash
# Check active connections
docker exec postgres psql -U postgres -d platform -c \
  "SELECT
     application_name,
     state,
     COUNT(*) as count
   FROM pg_stat_activity
   GROUP BY application_name, state;"

# Check pool configuration
docker logs my-service 2>&1 | grep "pool"
```

**Fix - Increase Pool Size:**
```typescript
await BaseService.start({
  name: 'user-service',
  version: '1.0.0',
  database: {
    url: process.env.DATABASE_URL,
    poolSize: 50,              // Increase from default 20
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 30000
  }
});
```

**Fix - Release Connections Properly:**
```typescript
// ❌ WRONG: Connection not released
async function queryData() {
  const client = await pool.connect();
  const result = await client.query('SELECT ...');
  return result.rows;  // Connection not released!
}

// ✓ CORRECT: Always release
async function queryData() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT ...');
    return result.rows;
  } finally {
    client.release();  // Always release
  }
}
```

### 6. Event Replay Performance

**Symptom:** Slow aggregate loading, replay timeouts

**Diagnostic:**
```bash
# Count events per aggregate
docker exec postgres psql -U postgres -d platform -c \
  "SELECT
     aggregate_id,
     COUNT(*) as event_count
   FROM events
   GROUP BY aggregate_id
   HAVING COUNT(*) > 1000
   ORDER BY event_count DESC
   LIMIT 20;"
```

**Fix - Implement Snapshots:**
```typescript
// Save snapshot every 100 events
if (aggregate.version % 100 === 0) {
  await snapshotStore.saveSnapshot({
    aggregateId: aggregate.id,
    aggregateType: aggregate.type,
    version: aggregate.version,
    state: aggregate.toSnapshot(),
    createdAt: new Date()
  });
}

// Load from snapshot
async function loadWithSnapshot(aggregateId: string) {
  const snapshot = await snapshotStore.getLatestSnapshot(aggregateId);

  if (snapshot) {
    const aggregate = Aggregate.fromSnapshot(snapshot.state);
    const events = await eventStore.getEvents(
      aggregateId,
      snapshot.version + 1  // Only replay events after snapshot
    );
    for (const event of events) {
      aggregate.applyEvent(event);
    }
    return aggregate;
  }

  return loadFromBeginning(aggregateId);
}
```

## Performance Monitoring

```typescript
// Add performance metrics
import { performance } from 'perf_hooks';

@QueryHandler(GetUserQuery)
export class GetUserHandler {
  async handle(query: GetUserQuery) {
    const start = performance.now();

    const result = await this.userRepository.findById(query.userId);

    const duration = performance.now() - start;

    // Log slow queries
    if (duration > 1000) {
      Logger.warn('Slow query detected', {
        handler: 'GetUserHandler',
        duration,
        userId: query.userId
      });
    }

    return result;
  }
}
```

## Performance Checklist

- [ ] Database indexes on frequently queried fields
- [ ] Query caching enabled for read operations
- [ ] No N+1 query patterns
- [ ] Connection pool properly sized
- [ ] Connections released in finally blocks
- [ ] Snapshots for aggregates with >100 events
- [ ] Batch processing for large datasets
- [ ] Event loop not blocked by CPU-intensive operations
- [ ] Memory monitored for leaks
- [ ] Jaeger traces reviewed for slow spans

## Best Practices

1. **Always use indexes:**
```sql
CREATE INDEX idx_field ON table(field);
ANALYZE table;
```

2. **Enable caching:**
```typescript
@QueryHandler(MyQuery, { cacheTTL: 3600 })
```

3. **Use snapshots:**
```typescript
if (version % 100 === 0) saveSnapshot();
```

4. **Monitor performance:**
```typescript
const duration = performance.now() - start;
if (duration > 1000) Logger.warn('Slow operation');
```

5. **Batch large operations:**
```typescript
for (let i = 0; i < items.length; i += 100) {
  await processBatch(items.slice(i, i + 100));
  await setImmediate(() => {}); // Yield to event loop
}
```

## Related Documentation

- [Performance Tuning Guide](../../04-reference/performance-tuning.md)
- [Read Model Issues](../by-component/read-model-issues.md)
- [Event Store Issues](../by-component/event-store-issues.md)
- [Jaeger Tracing](../debugging-tools/jaeger-tracing.md)
