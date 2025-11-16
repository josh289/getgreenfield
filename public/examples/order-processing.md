---
title: "Order Processing Example"
description: "Event-sourced order management with aggregates, domain events, and projections"
category: "examples"
tags: ["example", "event-sourcing", "aggregates", "reference", "intermediate"]
difficulty: "intermediate"
last_updated: "2025-01-15"
status: "published"
---

# Order Processing Example

> **Reference Implementation**: A complete event-sourced order processing service demonstrating aggregates, domain events, and read model projections.

## Overview

This example shows how to build an event-sourced service where all state changes are captured as immutable events, enabling complete audit trails and temporal queries.

For the complete implementation, see:
- [Event-Sourced Service Example](./event-sourced-service/README.md)

## Features

- Event-sourced Order aggregate
- Domain events for all state changes
- Automatic read model projections
- Complete audit trail
- Event replay capability
- Aggregate snapshots for performance

## Architecture

```
Aggregate:
- Order

Domain Events:
- OrderCreated
- ItemAdded
- ItemRemoved
- OrderPlaced
- OrderCancelled

Commands:
- CreateOrder
- AddItem
- RemoveItem
- PlaceOrder
- CancelOrder

Read Model:
- OrderReadModel (projected from events)
```

## Key Patterns

### Aggregate with Business Rules

```typescript
@Aggregate({ aggregateName: 'Order' })
export class Order extends AggregateRoot {
  private status: 'draft' | 'placed' | 'cancelled' = 'draft';
  private items: OrderItem[] = [];

  placeOrder() {
    // Enforce invariant
    if (this.items.length === 0) {
      throw new Error('Cannot place empty order');
    }

    if (this.status !== 'draft') {
      throw new Error('Order already placed');
    }

    // Emit event (doesn't modify state directly)
    this.raiseEvent(new OrderPlaced(this.id, this.customerId, this.total));
  }

  // Event handler updates state
  protected onOrderPlaced(event: OrderPlaced) {
    this.status = 'placed';
  }
}
```

### Command Handler with Event Store

```typescript
@CommandHandlerDecorator(PlaceOrderCommand)
export class PlaceOrderHandler extends CommandHandler<PlaceOrderCommand, PlaceOrderResult> {
  async handle(command: PlaceOrderCommand): Promise<PlaceOrderResult> {
    // Load aggregate from event history
    const eventStore = BaseService.getEventStore();
    const events = await eventStore.getEvents(command.orderId);

    const order = new Order();
    order.loadFromHistory(events);

    // Execute business logic (emits events)
    order.placeOrder();

    // Persist events
    await eventStore.append(command.orderId, order.getUncommittedEvents());

    return { success: true };
  }
}
```

### Automatic Read Model Projection

```typescript
@ReadModel({ tableName: 'rm_orders', aggregateType: 'Order' })
export class OrderReadModel extends ReadModelBase<OrderReadModel> {
  @MapFromEvent('OrderCreated')
  @MapFromEvent('OrderPlaced')
  id!: string;

  @MapFromEvent('OrderCreated')
  customerId!: string;

  @MapFromEvent('OrderPlaced')
  status!: 'draft' | 'placed' | 'cancelled';

  @MapFromEvent('ItemAdded')
  @MapFromEvent('ItemRemoved')
  items!: OrderItem[];
}
```

## Benefits of Event Sourcing

1. **Complete Audit Trail**: Every change is recorded
2. **Temporal Queries**: Query state at any point in time
3. **Event Replay**: Rebuild state from events
4. **Easy to Add Projections**: Create new read models from existing events
5. **Debugging**: Replay events to reproduce issues

## When to Use Event Sourcing

Use event sourcing when you need:
- Complete audit trail of changes
- Ability to replay events
- Temporal queries
- Complex business logic with invariants
- Multiple read models from same events

Don't use when:
- Simple CRUD is sufficient
- Immediate consistency required
- Team unfamiliar with pattern

## Getting Started

See the [Event Sourcing Tutorial](../01-tutorials/intermediate/event-sourcing-service.md) for step-by-step instructions.

## Additional Resources

- [Event Sourcing Concepts](../02-concepts/event-sourcing.md)
- [Aggregates Guide](../02-concepts/aggregates.md)
- [Event Store](../02-concepts/event-store.md)
- [Read Model Projections](../02-concepts/read-models.md)
