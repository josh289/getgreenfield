---
title: "Read Model Pattern"
description: "Optimized projections from event streams for query performance"
category: "concepts"
tags: ["patterns", "read-models", "cqrs"]
difficulty: "intermediate"
related_concepts:
  - "event-sourcing-pattern.md"
  - "cqrs-pattern.md"
prerequisites:
  - "event-sourcing-pattern.md"
last_updated: "2025-01-15"
status: "published"
---

# Read Model Pattern

> **Core Idea:** Create denormalized, query-optimized projections from event streams, updated automatically as events occur.

## Overview

Read models are denormalized views of event-sourced data, optimized for specific query patterns. Instead of querying the event log directly, read models provide fast, indexed access to data shaped for UI needs.

The platform automatically keeps read models synchronized with events through `@MapFromEvent` decorators.

## The Problem

Querying event logs directly is slow:

```typescript
// Querying events directly - SLOW
async function getOrderSummary(orderId: string) {
  const events = await eventStore.getEventsByAggregate('Order', orderId);
  
  // Replay all events to get current state
  const order = new Order();
  events.forEach(event => order.applyEvent(event));
  
  return {
    id: order.id,
    status: order.status,
    total: order.items.reduce((sum, item) => sum + item.price, 0)
  };
  // 50-100ms for each query - too slow!
}
```

**Why This Matters:**
- Event replay slow for large aggregates
- Complex queries require joining events
- UI needs denormalized data

## The Solution

Read models provide pre-computed, indexed views:

```typescript
// Read model - optimized for queries
@ReadModel({
  tableName: 'order_summaries',
  schema: {
    order_id: 'uuid PRIMARY KEY',
    user_id: 'uuid NOT NULL',
    status: 'varchar(50) NOT NULL',
    total: 'decimal(10,2) NOT NULL',
    item_count: 'integer NOT NULL',
    created_at: 'timestamp NOT NULL'
  }
})
export class OrderSummaryReadModel {
  // Automatically creates record
  @MapFromEvent(OrderCreatedEvent)
  async onCreate(event: OrderCreatedEvent) {
    await this.insert({
      order_id: event.orderId,
      user_id: event.userId,
      status: 'pending',
      total: event.total,
      item_count: event.items.length,
      created_at: event.occurredAt
    });
  }

  // Automatically updates record
  @MapFromEvent(OrderPaidEvent)
  async onPaid(event: OrderPaidEvent) {
    await this.update(
      { order_id: event.orderId },
      { status: 'paid' }
    );
  }
}

// Query is fast - direct database lookup
@QueryHandler(GetOrderSummaryQuery)
export class GetOrderSummaryHandler {
  async handle(query: GetOrderSummaryQuery) {
    // Sub-10ms query on indexed table
    return await this.db.query(
      'SELECT * FROM order_summaries WHERE order_id = $1',
      [query.orderId]
    );
  }
}
```

## Benefits

- **Fast Queries**: Sub-10ms with indexes
- **Denormalized**: Data shaped for UI
- **Automatic Updates**: Platform keeps synchronized
- **Multiple Views**: Different read models for different needs

## Best Practices

1. **One Read Model Per Query Pattern**
   - Create specific read models for specific UIs
   - Don't try to make one read model serve all queries

2. **Design for Queries**
   - Think about what UI needs
   - Denormalize aggressively

3. **Handle Event Replay**
   - Read models must support rebuilding from events
   - Use catchup process for deployments

## Further Reading

- [Event Sourcing Pattern](event-sourcing-pattern.md)
- [CQRS Pattern](cqrs-pattern.md)
- [Creating Read Models Guide](../../03-guides/event-sourcing/creating-read-models.md)
