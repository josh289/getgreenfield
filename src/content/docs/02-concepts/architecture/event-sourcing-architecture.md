---
title: "Event Sourcing Architecture"
description: "PostgreSQL-based event sourcing system with automatic read model projections and event replay"
category: "concepts"
tags: ["architecture", "event-sourcing", "postgresql"]
difficulty: "advanced"
related_concepts:
  - "platform-overview.md"
  - "message-bus-architecture.md"
  - "../patterns/event-sourcing-pattern.md"
  - "../patterns/read-model-pattern.md"
prerequisites:
  - "platform-overview.md"
  - "../patterns/domain-event-pattern.md"
last_updated: "2025-01-15"
status: "published"
---

# Event Sourcing Architecture

> **Core Idea:** Persist application state as an immutable sequence of events in PostgreSQL, enabling complete audit trails, time travel, and automatic read model projections - all transparent to developers.

## Overview

The event sourcing architecture provides enterprise-grade event persistence without requiring developers to write infrastructure code. By decorating domain classes with `@AggregateRoot` and read models with `@MapFromEvent`, the platform handles event storage, replay, and projection management automatically.

This architecture enables powerful capabilities like complete audit trails, temporal queries, and event replay, while keeping business logic clean and focused.

## The Problem

Traditional CRUD (Create, Read, Update, Delete) approaches lose information and create operational challenges:

### Example Scenario

```typescript
// Traditional CRUD approach
class OrderService {
  async updateOrderStatus(orderId: string, newStatus: string) {
    // Update database - losing historical information
    await db.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2',
      [newStatus, orderId]
    );

    // What we lost:
    // - Who made the change?
    // - Why was it changed?
    // - What was the previous status?
    // - When exactly did it change?
    // - What other fields changed at the same time?
  }

  async getOrder(orderId: string) {
    // Can only see current state
    const order = await db.query(
      'SELECT * FROM orders WHERE id = $1',
      [orderId]
    );

    // Questions we can't answer:
    // - What was the order status yesterday?
    // - How long did the order spend in each status?
    // - Did the customer change their address after placing order?
    // - What sequence of events led to this state?
  }
}
```

**Why This Matters:**
- Lost historical information makes debugging difficult
- No audit trail for compliance requirements
- Can't reconstruct past states for analysis
- Business insights hidden in deleted/overwritten data
- Concurrent updates cause data loss
- Can't replay events to build new projections

## The Solution

Event sourcing architecture stores every state change as an immutable event, providing complete history and enabling powerful querying capabilities.

### Core Principles

1. **Events as Source of Truth**: Store events, derive state from events

2. **Immutable Event Log**: Events never updated or deleted, only appended

3. **Optimistic Concurrency**: Version numbers prevent conflicting updates

4. **Automatic Projections**: Read models automatically updated from events

5. **Event Replay**: Rebuild state by replaying event sequence

6. **Transparent to Business Logic**: Developers work with domain objects, platform handles events

### How It Works

```
┌──────────────────────────────────────────────────────────────────┐
│                    Command Handler (Write Side)                   │
└───────────────────────────┬──────────────────────────────────────┘
                            │
                            │ 1. Load Aggregate
                            ▼
                    ┌───────────────┐
                    │   Aggregate   │
                    │   Repository  │
                    └───────┬───────┘
                            │
                            │ 2. Replay events to
                            │    reconstruct state
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     PostgreSQL Event Store                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  events table (shared across all services)                 │ │
│  ├────────┬───────────┬──────────┬─────────┬─────────────────┤ │
│  │ event_ │ aggregate_│aggregate_│ version │   event_data    │ │
│  │   id   │   type    │   id     │         │     (JSONB)     │ │
│  ├────────┼───────────┼──────────┼─────────┼─────────────────┤ │
│  │ uuid-1 │   Order   │  ord-123 │    1    │ {type:"Created"}│ │
│  │ uuid-2 │   Order   │  ord-123 │    2    │ {type:"Paid"}   │ │
│  │ uuid-3 │   Order   │  ord-123 │    3    │ {type:"Shipped"}│ │
│  └────────┴───────────┴──────────┴─────────┴─────────────────┘ │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ 3. Apply events to aggregate
                            ▼
                    ┌───────────────┐
                    │  Order (v3)   │
                    │               │
                    │ id: ord-123   │
                    │ status: shipped│
                    │ items: [...]  │
                    └───────┬───────┘
                            │
                            │ 4. Business logic
                            │    creates new events
                            ▼
                    ┌───────────────┐
                    │ New Event:    │
                    │ OrderDelivered│
                    └───────┬───────┘
                            │
                            │ 5. Persist event
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Event Store (append)                         │
│  │ uuid-4 │   Order   │  ord-123 │    4    │{type:"Delivered"}│ │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            │ 6. Publish to message bus
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Read Models                               │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │  OrderReadModel  │  │ OrderStatsModel  │                    │
│  │                  │  │                  │                    │
│  │ @MapFromEvent    │  │ @MapFromEvent    │                    │
│  │ OrderDelivered   │  │ OrderDelivered   │                    │
│  └──────────────────┘  └──────────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

## Implementation in the Platform

### Key Components

- **PostgresEventStore**: Event persistence and retrieval
  - Location: `platform/packages/event-sourcing/src/event-store/`
  - Shared `events` table across all services
  - Optimistic concurrency control
  - JSONB storage for flexible event data

- **EventSourcedRepository**: Aggregate loading and saving
  - Reconstructs aggregates by replaying events
  - Handles concurrency conflicts
  - Automatic snapshot management

- **AggregateRoot**: Base class for event-sourced entities
  - Tracks uncommitted events
  - Applies events to update state
  - Version tracking for concurrency

- **ReadModelManager**: Automatic projection management
  - Discovers read models via `@ReadModel` decorator
  - Subscribes to events via `@MapFromEvent`
  - Handles projection updates automatically

- **EventReplayer**: Rebuild read models from events
  - Replay events to reconstruct projections
  - Support for catchup processing
  - Deployment-safe updates

### Database Schema

```sql
-- Shared events table (all services use this table)
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
CREATE INDEX idx_events_type
  ON events (event_type);
CREATE INDEX idx_events_occurred
  ON events (occurred_at);

-- Shared projections table for ALL read models across ALL services
CREATE TABLE projections (
  id VARCHAR(255) NOT NULL,
  projection_name VARCHAR(255) NOT NULL,  -- Discriminator (e.g., 'rm_users')
  data JSONB NOT NULL,                    -- Read model stored as JSON
  version INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id, projection_name)
);

-- GIN index on JSONB data for efficient JSON queries
CREATE INDEX idx_projections_data ON projections USING GIN (data);
CREATE INDEX idx_projections_name ON projections (projection_name);

-- Shared snapshots table (performance optimization)
CREATE TABLE snapshots (
  aggregate_type VARCHAR(255) NOT NULL,
  aggregate_id VARCHAR(255) NOT NULL,
  version INTEGER NOT NULL,
  state JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  PRIMARY KEY (aggregate_type, aggregate_id)
);

-- Projection tracking (catchup support)
CREATE TABLE projection_positions (
  projection_name VARCHAR(255) PRIMARY KEY,
  last_processed_position BIGINT NOT NULL,
  last_processed_at TIMESTAMP WITH TIME ZONE NOT NULL
);
```

**Important: Single-Table Design for Read Models**

The `projections` table uses a single-table design where:
- **All read models** from all services share this table
- **`projection_name`** acts as a discriminator (comes from `tableName` in `@ReadModel`)
- **`data`** column stores the read model as JSONB
- **Composite primary key** `(id, projection_name)` allows same ID across different projections
- **GIN index** on `data` enables efficient JSON queries

This design:
- Eliminates schema migration complexity
- Enables cross-service queries
- Follows event sourcing best practices
- Provides flexible schema evolution

### Code Example

```typescript
// domain/Order.ts - Aggregate Root
import { AggregateRoot, ApplyEvent } from '@banyanai/platform-event-sourcing';
import { OrderCreatedEvent, OrderPaidEvent, OrderShippedEvent } from './events';

@AggregateRoot('Order')
export class Order extends AggregateRoot {
  private items: OrderItem[] = [];
  private status: OrderStatus = OrderStatus.Pending;
  private totalAmount: number = 0;

  // Factory method - creates new aggregate
  static create(userId: string, items: OrderItem[]): Order {
    const order = new Order();

    // Apply event (not saved yet)
    order.applyEvent(new OrderCreatedEvent({
      orderId: order.id,
      userId,
      items,
      totalAmount: this.calculateTotal(items)
    }));

    return order;
  }

  // Business logic - payment received
  markAsPaid(paymentId: string): void {
    if (this.status !== OrderStatus.Pending) {
      throw new Error('Order already paid');
    }

    this.applyEvent(new OrderPaidEvent({
      orderId: this.id,
      paymentId,
      paidAmount: this.totalAmount
    }));
  }

  // Event handlers - update internal state
  @ApplyEvent(OrderCreatedEvent)
  onOrderCreated(event: OrderCreatedEvent): void {
    this.items = event.items;
    this.totalAmount = event.totalAmount;
    this.status = OrderStatus.Pending;
  }

  @ApplyEvent(OrderPaidEvent)
  onOrderPaid(event: OrderPaidEvent): void {
    this.status = OrderStatus.Paid;
  }

  @ApplyEvent(OrderShippedEvent)
  onOrderShipped(event: OrderShippedEvent): void {
    this.status = OrderStatus.Shipped;
  }
}

// read-models/OrderReadModel.ts - Query optimization
import { ReadModel, ReadModelBase, MapFromEvent, Index } from '@banyanai/platform-event-sourcing';

@ReadModel({
  tableName: 'order_read_model',  // Becomes projection_name in projections table
  aggregateType: 'Order'
})
export class OrderReadModel extends ReadModelBase<OrderReadModel> {
  // Fields automatically mapped and stored as JSONB
  @Index(undefined, { unique: true, type: 'btree' })
  @MapFromEvent('OrderCreated')
  id!: string;

  @MapFromEvent('OrderCreated')
  userId!: string;

  @Index()
  @MapFromEvent('OrderCreated')
  @MapFromEvent('OrderPaid')
  @MapFromEvent('OrderShipped')
  status!: string;

  @MapFromEvent('OrderCreated')
  totalAmount!: number;

  @MapFromEvent('OrderCreated')
  createdAt!: Date;

  updatedAt!: Date;

  getId(): string {
    return this.id;
  }
}

// Stored in database as:
// projections table:
// id='order-123', projection_name='order_read_model',
// data='{"id":"order-123","userId":"user-456","status":"pending","totalAmount":100}'::jsonb

// commands/CreateOrderHandler.ts - Using the aggregate
import { CommandHandler } from '@banyanai/platform-cqrs';
import { Order } from '../domain/Order';

@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler {
  constructor(
    private orderRepository: EventSourcedRepository<Order>
  ) {}

  async handle(command: CreateOrderCommand) {
    // Create aggregate (events not yet saved)
    const order = Order.create(command.userId, command.items);

    // Save aggregate - persists events, publishes to message bus
    await this.orderRepository.save(order);

    return { orderId: order.id };
  }
}
```

**Key Points:**
- Business logic in aggregate (`markAsPaid()`)
- Events automatically persisted
- Read model automatically updated
- Complete audit trail maintained
- No infrastructure code in domain logic

## Benefits and Trade-offs

### Benefits

- **Complete Audit Trail**: Every state change recorded permanently
- **Time Travel**: Reconstruct state at any point in history
- **Event Replay**: Build new projections from existing events
- **Natural Debugging**: Event log shows exact sequence that led to current state
- **Compliance Ready**: Immutable audit log meets regulatory requirements
- **Performance**: Read models optimized for queries without affecting write model
- **Flexibility**: Add new read models without touching write side

### Trade-offs

- **Complexity**: More complex than CRUD for simple use cases
- **Storage**: Events accumulate (mitigated by snapshots)
- **Eventual Consistency**: Read models updated asynchronously
- **Learning Curve**: Requires understanding event sourcing concepts
- **Schema Evolution**: Event schema changes require migration strategy

### When to Use Event Sourcing

Use event sourcing when:
- Need complete audit trail for compliance
- History and temporal queries important
- Building event-driven architecture
- Multiple read models needed (analytics, reports, search)
- Domain logic complex with state transitions

Avoid event sourcing when:
- Simple CRUD application
- No audit or history requirements
- Team unfamiliar with pattern
- Strong consistency required for all reads

## Comparison with Alternatives

### Event Sourcing vs Traditional CRUD

| Aspect | Event Sourcing | CRUD |
|--------|----------------|------|
| Data Model | Events (immutable) | Current state (mutable) |
| History | Complete audit trail | None (or separate audit table) |
| Queries | Read models (optimized) | Direct database queries |
| Debugging | Event log shows sequence | Only current state visible |
| Complexity | Higher | Lower |
| Storage | Events + snapshots + read models | Single table |
| Compliance | Built-in audit trail | Manual audit logging |

### Event Sourcing vs Change Data Capture (CDC)

| Aspect | Event Sourcing | CDC (Debezium) |
|--------|----------------|----------------|
| Intent | Domain events with business meaning | Database change log |
| Granularity | Business operations | Row-level changes |
| Schema | Business-focused | Database-focused |
| Replay | Application-controlled | Infrastructure-controlled |
| Performance | Optimized for event append | Overhead on database |

## Real-World Examples

### Example 1: Order Management with Full History

```typescript
// Create order
const order = Order.create(userId, items);
await repository.save(order);
// Events: OrderCreatedEvent

// Payment received
order.markAsPaid(paymentId);
await repository.save(order);
// Events: OrderCreatedEvent, OrderPaidEvent

// Ship order
order.ship(trackingNumber);
await repository.save(order);
// Events: OrderCreatedEvent, OrderPaidEvent, OrderShippedEvent

// Query: What was order status yesterday?
const historicalOrder = await repository.loadAtTime(
  orderId,
  yesterday
);
// Replays only events before yesterday

// Query: How long in each status?
const timeline = await eventStore.getEventsByAggregate('Order', orderId);
timeline.forEach(event => {
  console.log(`${event.type} at ${event.occurredAt}`);
});
// OrderCreated at 2025-01-10 10:00
// OrderPaid at 2025-01-10 10:15
// OrderShipped at 2025-01-11 14:30
```

**Outcome:** Complete order history with exact timestamps, enabling customer service, fraud detection, and operational analytics.

### Example 2: Multi-View Read Models

```typescript
// Same events feed multiple read models
// All stored in shared projections table with different projection_name values

// Read Model 1: Order listing (fast queries)
@ReadModel({ tableName: 'order_list', aggregateType: 'Order' })
export class OrderListReadModel extends ReadModelBase<OrderListReadModel> {
  @MapFromEvent('OrderCreated')
  id!: string;

  @MapFromEvent('OrderCreated')
  userId!: string;

  @MapFromEvent('OrderCreated')
  total!: number;

  @Index()
  @MapFromEvent('OrderCreated')
  status!: string;

  getId(): string { return this.id; }
}
// Stored as: projection_name='order_list', data={"id":"...","userId":"...","total":100}

// Read Model 2: User order history
@ReadModel({ tableName: 'user_orders', aggregateType: 'Order' })
export class UserOrdersReadModel extends ReadModelBase<UserOrdersReadModel> {
  @MapFromEvent('OrderCreated')
  id!: string;

  @Index()
  @MapFromEvent('OrderCreated')
  userId!: string;

  @MapFromEvent('OrderCreated')
  orderId!: string;

  @MapFromEvent('OrderCreated')
  orderDate!: Date;

  getId(): string { return this.id; }
}
// Stored as: projection_name='user_orders', data={"id":"...","userId":"...","orderId":"..."}

// Read Model 3: Order analytics
@ReadModel({ tableName: 'order_stats', aggregateType: 'Order' })
export class OrderStatsReadModel extends ReadModelBase<OrderStatsReadModel> {
  @MapFromEvent('OrderCreated')
  id!: string;

  @MapFromEvent('OrderCreated')
  dailyTotal!: number;

  @MapFromEvent('OrderCreated')
  orderCount!: number;

  getId(): string { return this.id; }
}
// Stored as: projection_name='order_stats', data={"id":"...","dailyTotal":500,"orderCount":5}
```

**Outcome:** Three optimized read models from same event stream, each tailored for specific query pattern.

**Database storage:**
```sql
-- All three read models in same projections table
SELECT projection_name, COUNT(*) FROM projections
WHERE projection_name IN ('order_list', 'user_orders', 'order_stats')
GROUP BY projection_name;

-- projection_name | count
-- --------------- | -----
-- order_list      | 100
-- user_orders     | 100
-- order_stats     | 30
```

## Related Concepts

Event sourcing architecture connects to:

- [Event Sourcing Pattern](../patterns/event-sourcing-pattern.md) - Pattern details and benefits
- [Read Model Pattern](../patterns/read-model-pattern.md) - Query optimization via projections
- [Domain Event Pattern](../patterns/domain-event-pattern.md) - Event design principles
- [Aggregate Pattern](../patterns/aggregate-pattern.md) - Domain modeling for event sourcing
- [Message Bus Architecture](message-bus-architecture.md) - Event distribution

## Common Patterns

### Pattern 1: Snapshot Optimization

```typescript
// Automatic snapshots every 100 events
@AggregateRoot('Order', { snapshotFrequency: 100 })
export class Order extends AggregateRoot {
  // Load: snapshot at version 500 + events 501-550 = version 550
}
```

### Pattern 2: Event Upcasting (Schema Evolution)

```typescript
// Handle event schema changes
export class OrderCreatedEventV2 extends DomainEvent {
  static fromV1(v1Event: OrderCreatedEventV1): OrderCreatedEventV2 {
    return new OrderCreatedEventV2({
      ...v1Event.payload,
      currency: 'USD'  // Add new field with default
    });
  }
}
```

### Pattern 3: Temporal Queries

```typescript
// Query state at specific time
const orderYesterday = await repository.loadAtTime(
  orderId,
  new Date('2025-01-14')
);

// Query all events in time range
const januaryEvents = await eventStore.getEventsByTimeRange(
  new Date('2025-01-01'),
  new Date('2025-01-31')
);
```

## Common Misconceptions

### Misconception 1: "Event sourcing means I can't delete data (GDPR)"

**Reality:** Events can be encrypted per-user and encryption keys deleted for GDPR compliance. Alternatively, anonymize events while preserving structure.

**Why This Matters:** GDPR compliance compatible with event sourcing through proper design.

### Misconception 2: "Read models make queries too complex"

**Reality:** Read models simplify queries by pre-computing views. Direct event queries reserved for special cases (debugging, analytics).

**Why This Matters:** Read models provide better query performance than querying events directly.

### Misconception 3: "Event sourcing requires eventual consistency everywhere"

**Reality:** Commands can wait for read model updates before returning if strong consistency required. Trade performance for consistency where needed.

**Why This Matters:** Platform supports both eventual and strong consistency based on requirements.

## Best Practices

1. **Design Events for Business Meaning**
   - Events should represent domain concepts: `OrderPlaced`, not `OrderStatusChanged`
   - Include all relevant data in event (don't require joining)
   - Example: `OrderPlacedEvent` includes items, total, shipping address

2. **Keep Aggregates Focused**
   - One aggregate = one consistency boundary
   - Small aggregates (typically one entity)
   - Example: `Order` aggregate, separate `User` aggregate

3. **Use Read Models for All Queries**
   - Never query events directly in production code
   - Create read model for each query pattern
   - Example: `OrderListReadModel`, `UserOrderHistoryReadModel`

4. **Version Events from Day One**
   - Include version in event type or metadata
   - Plan for schema evolution
   - Example: `OrderCreatedEventV1`, `OrderCreatedEventV2`

5. **Snapshot Large Aggregates**
   - Configure snapshot frequency based on event volume
   - Typically snapshot every 50-100 events
   - Monitor aggregate load performance

## Practical Applications

Now that you understand event sourcing architecture:

- [Working with Aggregates](../../03-guides/event-sourcing/working-with-aggregates.md)
- [Creating Read Models](../../03-guides/event-sourcing/creating-read-models.md)
- [Event Replay and Projections](../../03-guides/event-sourcing/event-replay.md)
- [Event Store Reference](../../04-reference/platform-packages/event-sourcing.md)

## Further Reading

### Internal Resources
- [Event Sourcing Package Documentation](../../04-reference/platform-packages/event-sourcing.md)
- [Domain Modeling Guide](../../03-guides/domain-modeling/aggregates.md)
- [Troubleshooting Event Sourcing](../../05-troubleshooting/event-sourcing-issues.md)

### External Resources
- [Event Sourcing - Martin Fowler](https://martinfowler.com/eaaDev/EventSourcing.html)
- [CQRS Journey - Microsoft](https://docs.microsoft.com/en-us/previous-versions/msp-n-p/jj554200(v=pandp.10))
- [Versioning in an Event Sourced System](https://leanpub.com/esversioning)

## Glossary

**Aggregate Root**: Domain entity serving as consistency boundary for event sourcing.

**Event Store**: Persistent storage for domain events (PostgreSQL in this platform).

**Optimistic Concurrency**: Conflict detection using version numbers rather than locks.

**Projection**: Read model built by applying events to create queryable view.

**Read Model**: Denormalized view optimized for specific query patterns.

**Snapshot**: Cached aggregate state at specific version to optimize load performance.

**Temporal Query**: Query that reconstructs state at specific point in time.

**Upcasting**: Converting old event schema to new schema during replay.
