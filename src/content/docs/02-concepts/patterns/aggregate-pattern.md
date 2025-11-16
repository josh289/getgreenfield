---
title: "Aggregate Pattern"
description: "Aggregate roots as consistency boundaries for event-sourced domain models"
category: "concepts"
tags: ["patterns", "ddd", "aggregates"]
difficulty: "advanced"
related_concepts:
  - "event-sourcing-pattern.md"
  - "domain-event-pattern.md"
prerequisites:
  - "../architecture/platform-overview.md"
last_updated: "2025-01-15"
status: "published"
---

# Aggregate Pattern

> **Core Idea:** Group related entities under a single root entity that enforces invariants and serves as the consistency boundary for event sourcing.

## Overview

An aggregate is a cluster of domain objects treated as a single unit for data changes. The aggregate root is the only entity accessible from outside, ensuring all modifications go through it to maintain consistency.

In event-sourcing systems, aggregates are the primary unit of state management - they generate events and apply them to update state.

## The Problem

Without aggregates, consistency rules scatter across codebase:

```typescript
// Without aggregates - consistency hard to maintain
class OrderService {
  async addItem(orderId, item) {
    const order = await this.orderRepo.find(orderId);
    const orderItem = await this.itemRepo.create(item);
    await this.itemRepo.save(orderItem);
    
    // Problem: What if order is already shipped?
    // Problem: What if item quantity exceeds stock?
    // Problem: Who validates these rules?
    // Problem: Multiple services can modify order items directly
  }
}
```

**Why This Matters:**
- Validation logic scattered
- No single source of truth for rules
- Concurrent modifications cause inconsistency
- Difficult to test business rules

## The Solution

Aggregate root enforces all business rules and generates events:

```typescript
// Aggregate pattern - single consistency boundary
@AggregateRoot('Order')
export class Order extends AggregateRoot {
  private items: OrderItem[] = [];
  private status: OrderStatus = OrderStatus.Draft;

  // ALL modifications through aggregate root
  addItem(item: OrderItem): void {
    // Enforce business rules
    if (this.status !== OrderStatus.Draft) {
      throw new Error('Cannot modify shipped order');
    }

    if (this.items.length >= 10) {
      throw new Error('Maximum 10 items per order');
    }

    // Generate event
    this.applyEvent(new OrderItemAddedEvent({
      orderId: this.id,
      item
    }));
  }

  // Event handler updates state
  @ApplyEvent(OrderItemAddedEvent)
  onItemAdded(event: OrderItemAddedEvent): void {
    this.items.push(event.item);
  }
}
```

## Best Practices

1. **Keep Aggregates Small**
   - Typically one entity or small cluster
   - Larger aggregates = more contention

2. **Reference by ID**
   - Don't embed other aggregates
   - Use IDs to reference

3. **One Transaction Per Aggregate**
   - Modify one aggregate per transaction
   - Use sagas for multi-aggregate transactions

## Further Reading

- [Event Sourcing Pattern](event-sourcing-pattern.md)
- [Domain Event Pattern](domain-event-pattern.md)
- [DDD Aggregates - Martin Fowler](https://martinfowler.com/bliki/DDD_Aggregate.html)
