---
title: "Domain Event Pattern"
description: "Events representing significant business occurrences in the domain"
category: "concepts"
tags: ["patterns", "events", "domain-driven-design"]
difficulty: "beginner"
related_concepts:
  - "event-sourcing-pattern.md"
  - "../architecture/message-bus-architecture.md"
prerequisites:
  - "../architecture/platform-overview.md"
last_updated: "2025-01-15"
status: "published"
---

# Domain Event Pattern

> **Core Idea:** Model significant business occurrences as immutable events using past-tense names and complete payload data.

## Overview

Domain events represent things that happened in the domain - facts about the past. They enable loose coupling between services, event-driven architectures, and complete audit trails.

Well-designed domain events use business language, include all relevant context, and are immutable.

## The Problem

Without events, services tightly coupled:

```typescript
// Without events - tight coupling
class OrderService {
  async createOrder(order) {
    await this.orderRepo.save(order);
    
    // Direct coupling to other services
    await this.inventoryService.reserveItems(order.items);
    await this.emailService.sendConfirmation(order.userId);
    await this.analyticsService.trackOrder(order);
    
    // What if new service needs to react to orders?
    // Must modify this code!
  }
}
```

**Why This Matters:**
- Tight coupling between services
- Must modify code to add new integrations
- Difficult to test in isolation

## The Solution

Publish domain events, services react independently:

```typescript
// Domain event - immutable fact
export class OrderCreatedEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly userId: string,
    public readonly items: OrderItem[],
    public readonly total: number,
    public readonly createdAt: Date
  ) {
    super(orderId, 'Order', 1);
  }

  getEventType(): string {
    return 'OrderCreated';  // Past tense!
  }
}

// Publisher - just publishes event
class CreateOrderHandler {
  async handle(command: CreateOrderCommand) {
    const order = await this.orderRepo.create(command);
    
    // Publish event - don't care who listens
    await this.eventBus.publish(
      new OrderCreatedEvent(
        order.id,
        order.userId,
        order.items,
        order.total,
        new Date()
      )
    );
  }
}

// Multiple subscribers - independently react
@EventHandler(OrderCreatedEvent)
class ReserveInventoryHandler {
  async handle(event: OrderCreatedEvent) {
    await this.inventoryService.reserve(event.items);
  }
}

@EventHandler(OrderCreatedEvent)
class SendEmailHandler {
  async handle(event: OrderCreatedEvent) {
    await this.emailService.send(event.userId, 'order-confirmation');
  }
}

// Add new subscriber without modifying publisher!
@EventHandler(OrderCreatedEvent)
class TrackAnalyticsHandler {
  async handle(event: OrderCreatedEvent) {
    await this.analytics.track('order_created', event);
  }
}
```

## Best Practices

1. **Use Past Tense**
   - `OrderCreated`, not `CreateOrder`
   - `UserRegistered`, not `RegisterUser`

2. **Include Complete Data**
   - Event should have all data handlers need
   - Avoid requiring additional queries

3. **Events are Immutable**
   - Never modify event after creation
   - Version events for schema changes

4. **Name in Business Language**
   - Use domain terms, not technical terms
   - `OrderShipped`, not `OrderStatusChanged`

## Further Reading

- [Event Sourcing Pattern](event-sourcing-pattern.md)
- [Message Bus Architecture](../architecture/message-bus-architecture.md)
- [Domain-Driven Design](https://www.domainlanguage.com/ddd/)
