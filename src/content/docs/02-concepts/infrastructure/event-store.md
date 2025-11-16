---
title: "Event Store Infrastructure"
description: "PostgreSQL-based event store with shared tables and optimistic concurrency"
category: "concepts"
tags: ["infrastructure", "postgresql", "event-store"]
difficulty: "intermediate"
related_concepts:
  - "../architecture/event-sourcing-architecture.md"
  - "../patterns/event-sourcing-pattern.md"
prerequisites:
  - "../architecture/platform-overview.md"
last_updated: "2025-01-15"
status: "published"
---

# Event Store Infrastructure

> **Core Idea:** PostgreSQL provides durable, ACID-compliant event storage with shared tables across all services and optimistic concurrency control.

## Overview

The event store uses PostgreSQL 16 with three shared tables (`events`, `snapshots`, `projection_positions`) accessed by all services. Services are differentiated by `aggregate_type` column, enabling centralized event storage without database per service.

## Database Schema

### Events Table

```sql
CREATE TABLE events (
  event_id UUID PRIMARY KEY,
  aggregate_type VARCHAR(255) NOT NULL,  -- Service differentiation
  aggregate_id VARCHAR(255) NOT NULL,
  version INTEGER NOT NULL,
  event_type VARCHAR(255) NOT NULL,
  event_data JSONB NOT NULL,
  metadata JSONB,
  occurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
  correlation_id UUID,
  causation_id UUID,
  UNIQUE (aggregate_type, aggregate_id, version)
);

CREATE INDEX idx_events_aggregate
  ON events (aggregate_type, aggregate_id, version);
CREATE INDEX idx_events_type ON events (event_type);
CREATE INDEX idx_events_occurred ON events (occurred_at);
```

### Snapshots Table

```sql
CREATE TABLE snapshots (
  aggregate_type VARCHAR(255) NOT NULL,
  aggregate_id VARCHAR(255) NOT NULL,
  version INTEGER NOT NULL,
  state JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  PRIMARY KEY (aggregate_type, aggregate_id)
);
```

### Projection Positions Table

```sql
CREATE TABLE projection_positions (
  projection_name VARCHAR(255) PRIMARY KEY,
  last_processed_position BIGINT NOT NULL,
  last_processed_at TIMESTAMP WITH TIME ZONE NOT NULL
);
```

## Configuration

### Development

```yaml
postgres:
  image: postgres:16-alpine
  environment:
    POSTGRES_DB: eventstore
    POSTGRES_USER: actor_user
    POSTGRES_PASSWORD: actor_pass123
  ports:
    - "55432:5432"
  volumes:
    - postgres-data:/var/lib/postgresql/data
```

### Connection

```bash
# Environment variables
DATABASE_HOST=postgres
DATABASE_NAME=eventstore
DATABASE_USER=actor_user
DATABASE_PASSWORD=actor_pass123
DATABASE_PORT=5432
```

## Performance Optimization

### Indexes

- `aggregate_type + aggregate_id + version`: Fast aggregate loading
- `event_type`: Fast event type queries
- `occurred_at`: Temporal queries

### Snapshots

- Created every 50-100 events (configurable)
- Reduces load time for large aggregates
- Automatic snapshot management

### Connection Pooling

- Max 10 connections per service
- Idle timeout: 30 seconds
- Connection timeout: 5 seconds

## Monitoring

### Key Metrics

- **Event Insert Rate**: Events/second written
- **Aggregate Load Time**: Time to load aggregate
- **Snapshot Hit Rate**: % loads using snapshot
- **Table Size**: Disk usage trends

### Queries

```sql
-- Event count by aggregate type
SELECT aggregate_type, COUNT(*) 
FROM events 
GROUP BY aggregate_type;

-- Largest aggregates
SELECT aggregate_type, aggregate_id, COUNT(*) as event_count
FROM events
GROUP BY aggregate_type, aggregate_id
ORDER BY event_count DESC
LIMIT 10;

-- Snapshot coverage
SELECT COUNT(DISTINCT aggregate_id) as total_aggregates,
       COUNT(DISTINCT s.aggregate_id) as snapshotted_aggregates
FROM events e
LEFT JOIN snapshots s USING (aggregate_type, aggregate_id);
```

## Best Practices

1. **Use Snapshots for Large Aggregates**
   - Configure snapshot frequency based on event volume
   - Monitor aggregate load times

2. **Monitor Table Growth**
   - Events table grows indefinitely
   - Plan for archival strategy (e.g., archive events >1 year old)

3. **Partition Events Table**
   - Consider partitioning by `occurred_at` for very high volume

4. **Regular Vacuum**
   - PostgreSQL vacuum essential for performance
   - Configure autovacuum appropriately

## Troubleshooting

### Issue: Slow Aggregate Loading

```sql
-- Check event count for aggregate
SELECT COUNT(*) FROM events 
WHERE aggregate_type = 'Order' AND aggregate_id = 'ord-123';

-- Check if snapshot exists
SELECT * FROM snapshots
WHERE aggregate_type = 'Order' AND aggregate_id = 'ord-123';
```

Solution: Create snapshot if >100 events and no snapshot

### Issue: Concurrency Errors

Error: "Optimistic concurrency check failed"

Cause: Two processes tried to append events with same version

Solution: Retry with exponential backoff

## Further Reading

- [Event Sourcing Architecture](../architecture/event-sourcing-architecture.md)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/16/)
