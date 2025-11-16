---
title: "Event Sourcing Pattern"
description: "Store state changes as immutable events enabling audit trails, time travel, and event replay"
category: "concepts"
tags: ["patterns", "event-sourcing", "domain-events"]
difficulty: "advanced"
related_concepts:
  - "../architecture/event-sourcing-architecture.md"
  - "aggregate-pattern.md"
  - "read-model-pattern.md"
  - "domain-event-pattern.md"
prerequisites:
  - "../architecture/platform-overview.md"
  - "domain-event-pattern.md"
last_updated: "2025-01-15"
status: "published"
---

# Event Sourcing Pattern

> **Core Idea:** Store all state changes as immutable events rather than current state, enabling complete audit trails, time travel queries, and event replay.

## Overview

Event sourcing persists application state as a sequence of events rather than current state. Instead of UPDATE queries that overwrite data, event sourcing appends new events to an immutable log. Current state is derived by replaying events.

This pattern enables powerful capabilities: complete audit trails, temporal queries (state at any point in time), event replay to build new projections, and natural integration with event-driven architectures.

## The Problem

Traditional CRUD loses historical information:

```typescript
// Traditional CRUD - loses history
class OrderService {
  async updateStatus(orderId: string, newStatus: string) {
    // Overwrites previous status - information lost
    await db.query(
      'UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2',
      [newStatus, orderId]
    );
    
    // Lost information:
    // - What was previous status?
    // - Who changed it?
    // - Why was it changed?
    // - When exactly did it change?
  }
}
```

**Why This Matters:**
- Cannot answer "what was order status yesterday?"
- No audit trail for compliance
- Can't debug by seeing sequence of changes
- Lost business insights in deleted data

## The Solution

Store events representing state changes, derive current state from events:

### Core Principles

1. **Events are Immutable**: Never update or delete events
2. **Events are Source of Truth**: Current state derived from events
3. **Complete History**: Every state change recorded
4. **Event Replay**: Rebuild state by replaying events
5. **Temporal Queries**: Reconstruct state at any point in time

### How It Works

```
Traditional CRUD:
┌─────────────────┐
│ orders table    │
├─────────────────┤
│ id: ord-123     │
│ status: shipped │  ← Only current state
│ updated: 2025...│
└─────────────────┘

Event Sourcing:
┌──────────────────────────────────────────────┐
│ events table (immutable, append-only)        │
├──────────────────────────────────────────────┤
│ OrderCreatedEvent   | v1 | 2025-01-10 10:00 │
│ OrderPaidEvent      | v2 | 2025-01-10 10:15 │
│ OrderShippedEvent   | v3 | 2025-01-11 14:30 │
│ OrderDeliveredEvent | v4 | 2025-01-12 09:00 │ ← Complete history
└──────────────────────────────────────────────┘

Current state = Replay events v1→v2→v3→v4
State yesterday = Replay events v1→v2→v3 (stop before v4)
```

## Implementation in the Platform

```typescript
// domain/Order.ts - Aggregate
import { AggregateRoot, ApplyEvent } from '@banyanai/platform-event-sourcing';

@AggregateRoot('Order')
export class Order extends AggregateRoot {
  private status: OrderStatus = OrderStatus.Pending;
  private items: OrderItem[] = [];

  // Create new order - generates event
  static create(userId: string, items: OrderItem[]): Order {
    const order = new Order();
    order.applyEvent(new OrderCreatedEvent({
      orderId: order.id,
      userId,
      items,
      total: this.calculateTotal(items)
    }));
    return order;
  }

  // Business logic - generates event
  markAsPaid(paymentId: string): void {
    if (this.status !== OrderStatus.Pending) {
      throw new Error('Order already paid');
    }
    this.applyEvent(new OrderPaidEvent({
      orderId: this.id,
      paymentId
    }));
  }

  // Event handler - updates state
  @ApplyEvent(OrderCreatedEvent)
  onOrderCreated(event: OrderCreatedEvent): void {
    this.items = event.items;
    this.status = OrderStatus.Pending;
  }

  @ApplyEvent(OrderPaidEvent)
  onOrderPaid(event: OrderPaidEvent): void {
    this.status = OrderStatus.Paid;
  }
}

// Using the aggregate
@CommandHandler(CreateOrderCommand)
export class CreateOrderHandler {
  constructor(private orderRepo: EventSourcedRepository<Order>) {}

  async handle(command: CreateOrderCommand) {
    // Create aggregate (events not saved yet)
    const order = Order.create(command.userId, command.items);
    
    // Save - persists events to PostgreSQL
    await this.orderRepo.save(order);
    
    return { orderId: order.id };
  }
}

// Load aggregate (replays events)
const order = await orderRepo.load('ord-123');
// Behind the scenes:
// 1. Load events for ord-123 from database
// 2. Create new Order()
// 3. Apply each event: OrderCreated, OrderPaid, OrderShipped
// 4. Return order in current state
```

**Key Points:**
- Business logic creates events
- Events automatically persisted
- Current state derived from events
- Complete audit trail maintained

## Benefits and Trade-offs

### Benefits

- **Complete Audit Trail**: Every change recorded with timestamp, user, reason
- **Time Travel**: Query state at any point: "what was order status yesterday?"
- **Event Replay**: Build new read models from existing events
- **Debugging**: See exact sequence leading to current state
- **Compliance**: Immutable audit log for regulations
- **Performance**: Read models optimized for queries

### Trade-offs

- **Complexity**: More complex than CRUD
- **Storage**: Events accumulate (mitigated by snapshots)
- **Learning Curve**: Requires understanding pattern
- **Eventual Consistency**: Read models updated async

### When to Use Event Sourcing

Use when:
- Need complete audit trail
- History and temporal queries important
- Building event-driven architecture
- Complex domain with state transitions

Avoid when:
- Simple CRUD application
- No audit requirements
- Team unfamiliar with pattern

## Real-World Examples

### Example 1: Complete Audit Trail

```typescript
// Create order
const order = Order.create(userId, items);
await repo.save(order);

// Payment received
order.markAsPaid(paymentId);
await repo.save(order);

// Ship order
order.ship(trackingNumber);
await repo.save(order);

// Query history
const events = await eventStore.getEventsByAggregate('Order', order.id);
events.forEach(event => {
  console.log(`${event.type} at ${event.occurredAt} by ${event.userId}`);
});
// Output:
// OrderCreatedEvent at 2025-01-10 10:00 by user-123
// OrderPaidEvent at 2025-01-10 10:15 by user-123
// OrderShippedEvent at 2025-01-11 14:30 by admin-456
```

### Example 2: Time Travel Queries

```typescript
// What was order status yesterday?
const yesterday = new Date('2025-01-11');
const historicalOrder = await repo.loadAtTime(orderId, yesterday);
console.log(historicalOrder.status);  // 'paid' (not yet shipped)
```

## Related Concepts

- [Event Sourcing Architecture](../architecture/event-sourcing-architecture.md)
- [Aggregate Pattern](aggregate-pattern.md)
- [Read Model Pattern](read-model-pattern.md)
- [Domain Event Pattern](domain-event-pattern.md)

## Best Practices

1. **Events Represent Facts**
   - Past tense names: `OrderCreated`, not `CreateOrder`
   - Include all relevant data
   - Never modify events after creation

2. **Snapshot Large Aggregates**
   - Snapshot every 50-100 events
   - Optimize load performance

3. **Version Events**
   - Plan for schema evolution
   - Support event upcasting

## Further Reading

### Internal Resources
- [Event Sourcing Architecture](../architecture/event-sourcing-architecture.md)
- [Working with Aggregates](../../03-guides/event-sourcing/working-with-aggregates.md)

### External Resources
- [Event Sourcing - Martin Fowler](https://martinfowler.com/eaaDev/EventSourcing.html)
- [Versioning in Event Sourced Systems](https://leanpub.com/esversioning)

## Glossary

**Event Store**: Persistent storage for events (PostgreSQL in this platform).

**Aggregate**: Consistency boundary for event sourcing.

**Snapshot**: Cached state at specific version for performance.

**Temporal Query**: Query reconstructing state at specific time.
