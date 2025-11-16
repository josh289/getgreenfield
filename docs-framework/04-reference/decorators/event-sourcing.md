---
title: Event Sourcing Decorators
description: Complete reference for event sourcing decorators (@Aggregate, @ApplyEvent, @MapFromEvent, @ReadModel, @EventHandler, @Index)
category: decorators
tags: [decorators, event-sourcing, aggregates, read-models, projections, typescript]
related:
  - ./event-handlers.md
  - ./contracts.md
  - ../platform-packages/event-sourcing.md
difficulty: advanced
aliases:
  - "@Aggregate"
  - "@ApplyEvent"
  - "@MapFromEvent"
  - "@ReadModel"
  - "@Index"
relatedConcepts:
  - Event sourcing
  - Aggregate roots
  - Read models
  - Event projections
  - CQRS
commonQuestions:
  - How do I create an aggregate?
  - How do I apply events to aggregates?
  - How do I create read models?
  - How do I map events to read models?
  - How do I create database indexes?
---

# Event Sourcing Decorators

Complete reference for decorators used in event-sourced aggregates and read models.

## @ReadModel

Marks a class as a read model that projects data from domain events.

### Signature

```typescript
function ReadModel(options?: {
  aggregateType?: string;
  tableName?: string;
  schemaName?: string;
  description?: string;
}): ClassDecorator
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `options.aggregateType` | `string` | No | Aggregate type this read model projects from |
| `options.tableName` | `string` | No | Database table name (auto-generated if not provided) |
| `options.schemaName` | `string` | No | Database schema name (default: 'public') |
| `options.description` | `string` | No | Read model description |

### Usage

```typescript
import { ReadModel, MapFromEvent } from '@banyanai/platform-event-sourcing';

@ReadModel({
  aggregateType: 'User',
  tableName: 'user_profiles',
  description: 'User profile read model'
})
export class UserProfileReadModel {
  @MapFromEvent('UserCreated')
  userId!: string;

  @MapFromEvent('UserCreated')
  email!: string;

  @MapFromEvent('UserCreated')
  firstName!: string;

  @MapFromEvent('UserCreated')
  lastName?: string;
}
```

See full [Read Model Documentation](../platform-packages/event-sourcing.md#read-models).

## @MapFromEvent

Maps event fields to read model properties automatically.

### Signature

```typescript
function MapFromEvent(eventName: string, sourceField?: string): PropertyDecorator
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `eventName` | `string` | Yes | Name of the event to map from |
| `sourceField` | `string` | No | Source field in event data (defaults to property name) |

### Usage

#### Same Field Names

```typescript
@ReadModel({ aggregateType: 'User' })
export class UserProfile {
  @MapFromEvent('UserCreated')  // Maps from event.userId
  userId!: string;

  @MapFromEvent('UserCreated')  // Maps from event.email
  email!: string;
}
```

#### Different Field Names

```typescript
@ReadModel({ aggregateType: 'User' })
export class UserProfile {
  @MapFromEvent('UserCreated', 'fullName')  // Maps from event.fullName to name
  name!: string;

  @MapFromEvent('UserCreated', 'emailAddress')  // Maps from event.emailAddress to email
  email!: string;
}
```

#### Multiple Events

```typescript
@ReadModel({ aggregateType: 'User' })
export class UserProfile {
  @MapFromEvent('UserCreated')
  @MapFromEvent('UserProfileUpdated', 'newEmail')  // Update from different event
  email!: string;
}
```

## @EventHandler

Handles complex projection logic for read models.

### Signature

```typescript
function EventHandler(eventClass: new (...args: any[]) => DomainEvent): MethodDecorator
function EventHandler(eventType: string): MethodDecorator
```

### Usage

```typescript
@ReadModel({ aggregateType: 'Order' })
export class OrderSummary {
  orderId!: string;
  itemCount: number = 0;
  totalAmount: number = 0;

  @EventHandler(OrderCreatedEvent)
  onOrderCreated(event: OrderCreatedEvent): void {
    this.orderId = event.orderId;
    this.itemCount = event.items.length;
    this.totalAmount = event.items.reduce((sum, item) => sum + item.price, 0);
  }

  @EventHandler(OrderItemAddedEvent)
  onItemAdded(event: OrderItemAddedEvent): void {
    if (event.orderId === this.orderId) {
      this.itemCount++;
      this.totalAmount += event.price;
    }
  }
}
```

See [Event Handler Decorators](./event-handlers.md) for more details.

## @Index

Creates database indexes on read model fields for query performance.

### Signature

```typescript
function Index(
  fieldName?: string,
  options?: {
    type?: 'gin' | 'btree' | 'hash';
    unique?: boolean;
  }
): PropertyDecorator
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `fieldName` | `string` | No | Field to index (defaults to property name) |
| `options.type` | `'gin' \| 'btree' \| 'hash'` | No | Index type (default: 'gin') |
| `options.unique` | `boolean` | No | Create unique index (default: false) |

### Usage

```typescript
@ReadModel({ aggregateType: 'User' })
export class UserProfile {
  @Index()  // Creates GIN index on userId
  @MapFromEvent('UserCreated')
  userId!: string;

  @Index({ unique: true })  // Creates unique GIN index
  @MapFromEvent('UserCreated')
  email!: string;

  @Index({ type: 'btree' })  // Creates BTREE index for ordering
  @MapFromEvent('UserCreated')
  createdAt!: Date;

  @Index({ type: 'hash' })  // Creates hash index for exact matches
  @MapFromEvent('UserCreated')
  status!: string;
}
```

### Index Types

- **GIN** (default): Generalized Inverted Index, good for JSONB and arrays
- **BTREE**: Good for range queries and ordering
- **HASH**: Good for exact equality comparisons

## Complete Examples

### User Read Model

```typescript
import {
  ReadModel,
  MapFromEvent,
  EventHandler,
  Index
} from '@banyanai/platform-event-sourcing';

@ReadModel({
  aggregateType: 'User',
  tableName: 'user_profiles',
  description: 'User profile information'
})
export class UserProfileReadModel {
  @Index({ unique: true })
  @MapFromEvent('UserCreated')
  userId!: string;

  @Index({ unique: true })
  @MapFromEvent('UserCreated')
  @MapFromEvent('UserEmailChanged', 'newEmail')
  email!: string;

  @MapFromEvent('UserCreated')
  @MapFromEvent('UserProfileUpdated', 'newFirstName')
  firstName!: string;

  @MapFromEvent('UserCreated')
  @MapFromEvent('UserProfileUpdated', 'newLastName')
  lastName?: string;

  @Index({ type: 'btree' })
  @MapFromEvent('UserCreated', 'registeredAt')
  createdAt!: Date;

  @Index()
  status!: string;

  lastLoginAt?: Date;

  @EventHandler(UserLoggedInEvent)
  onUserLoggedIn(event: UserLoggedInEvent): void {
    if (event.userId === this.userId) {
      this.lastLoginAt = event.loginAt;
    }
  }

  @EventHandler(UserDeactivatedEvent)
  onUserDeactivated(event: UserDeactivatedEvent): void {
    if (event.userId === this.userId) {
      this.status = 'inactive';
    }
  }
}
```

### Order Summary Read Model

```typescript
@ReadModel({
  aggregateType: 'Order',
  tableName: 'order_summaries',
  description: 'Order summary for quick queries'
})
export class OrderSummaryReadModel {
  @Index()
  @MapFromEvent('OrderPlaced')
  orderId!: string;

  @Index()
  @MapFromEvent('OrderPlaced')
  userId!: string;

  @MapFromEvent('OrderPlaced')
  totalAmount!: number;

  @Index({ type: 'btree' })
  @MapFromEvent('OrderPlaced', 'placedAt')
  createdAt!: Date;

  @Index()
  status!: string;

  itemCount!: number;
  shippingAddress?: string;
  trackingNumber?: string;

  @EventHandler(OrderPlacedEvent)
  onOrderPlaced(event: OrderPlacedEvent): void {
    this.status = 'pending';
    this.itemCount = event.items.length;
    this.shippingAddress = JSON.stringify(event.shippingAddress);
  }

  @EventHandler(OrderShippedEvent)
  onOrderShipped(event: OrderShippedEvent): void {
    if (event.orderId === this.orderId) {
      this.status = 'shipped';
      this.trackingNumber = event.trackingNumber;
    }
  }

  @EventHandler(OrderDeliveredEvent)
  onOrderDelivered(event: OrderDeliveredEvent): void {
    if (event.orderId === this.orderId) {
      this.status = 'delivered';
    }
  }

  @EventHandler(OrderCancelledEvent)
  onOrderCancelled(event: OrderCancelledEvent): void {
    if (event.orderId === this.orderId) {
      this.status = 'cancelled';
    }
  }
}
```

## Best Practices

### DO:

- ✅ Use `@MapFromEvent` for simple field mapping
- ✅ Use `@EventHandler` for complex projection logic
- ✅ Create indexes on frequently queried fields
- ✅ Use unique indexes for fields that should be unique
- ✅ Choose appropriate index types for query patterns
- ✅ Handle multiple events that update the same field
- ✅ Keep read models denormalized for query performance

### DON'T:

- ❌ Don't create too many indexes (impacts write performance)
- ❌ Don't forget to handle all relevant events for a field
- ❌ Don't put business logic in read models
- ❌ Don't modify read models directly (only via events)

## Next Steps

- **[Event Handler Decorators](./event-handlers.md)** - Event subscription patterns
- **[Event Sourcing Package](../platform-packages/event-sourcing.md)** - Full event sourcing API
- **[CQRS Package](../platform-packages/cqrs.md)** - Command/Query separation
