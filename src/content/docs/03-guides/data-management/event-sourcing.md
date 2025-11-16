---
title: "Event Sourcing Implementation Guide"
---

# Event Sourcing Implementation Guide

## Use this guide if...

- You need to implement complete event sourcing for an aggregate
- You want to understand event streams and event replay
- You're building audit trails and temporal queries
- You need to implement snapshots for performance

## Quick Example

```typescript
// 1. Define aggregate with event sourcing
@Aggregate('User')
export class User extends AggregateRoot {
  private constructor(private props: UserProps) {
    super(props.id || '', 'User');
  }

  // Factory method emits events
  static create(props: Omit<UserProps, 'id'>): User {
    const id = uuidv4();
    const user = new User({ ...props, id });
    
    // Emit creation event
    user.raiseEvent('UserCreated', {
      email: props.email,
      createdAt: new Date()
    });
    
    return user;
  }

  // Business methods emit events
  changeEmail(newEmail: string): void {
    this.props.email = newEmail;
    this.raiseEvent('UserEmailChanged', { newEmail });
  }

  // Event sourcing: Reconstruct from events
  protected applyEventToState(event: DomainEvent): void {
    switch (event.eventType) {
      case 'UserCreated':
        // State already set in constructor
        break;
      case 'UserEmailChanged':
        this.props.email = event.eventData.newEmail as string;
        break;
    }
  }
}

// 2. Save events to event store
const eventStore = BaseService.getEventStore();
await eventStore.append(user.id, user.getUncommittedEvents());

// 3. Load aggregate from events
const events = await eventStore.getEvents(userId);
const user = User.fromEvents(events);
```

## Event Store Operations

### Append Events

```typescript
const eventStore = BaseService.getEventStore();

// Get uncommitted events from aggregate
const events = user.getUncommittedEvents();

// Append to event store (with optimistic concurrency)
await eventStore.append(user.id, events);

// Events are now persisted and published
```

### Load Events

```typescript
// Get all events for an aggregate
const events = await eventStore.getEvents(userId);

// Reconstruct aggregate from events
const user = User.fromEvents(events);
```

### Event Streams

```typescript
// Stream events (for large event streams)
const stream = eventStore.streamEvents(userId);

for await (const event of stream) {
  console.log(event.eventType, event.occurredAt);
}
```

## Implementing Event Sourced Aggregates

### Step 1: Extend AggregateRoot

```typescript
import { Aggregate, AggregateRoot, DomainEvent } from '@banyanai/platform-domain-modeling';

@Aggregate('Order')
export class Order extends AggregateRoot {
  private constructor(private props: OrderProps) {
    super(props.id || '', 'Order');
  }
}
```

### Step 2: Implement Factory Methods

```typescript
static create(customerId: string, items: OrderItem[]): Order {
  const id = uuidv4();
  const order = new Order({
    id,
    customerId,
    items,
    status: 'pending',
    createdAt: new Date()
  });

  // Raise creation event
  order.raiseEvent('OrderCreated', {
    orderId: id,
    customerId,
    items,
    totalAmount: order.calculateTotal()
  });

  return order;
}
```

### Step 3: Implement Business Methods

```typescript
confirm(): void {
  // Validate business rules
  if (this.props.status !== 'pending') {
    throw new Error('Only pending orders can be confirmed');
  }

  // Update state
  this.props.status = 'confirmed';
  this.props.confirmedAt = new Date();

  // Raise event
  this.raiseEvent('OrderConfirmed', {
    confirmedAt: this.props.confirmedAt
  });
}

cancel(reason: string): void {
  if (this.props.status === 'shipped') {
    throw new Error('Cannot cancel shipped orders');
  }

  this.props.status = 'cancelled';
  this.raiseEvent('OrderCancelled', { reason });
}
```

### Step 4: Implement Event Replay

```typescript
protected applyEventToState(event: DomainEvent): void {
  switch (event.eventType) {
    case 'OrderCreated':
      // State set in constructor
      break;
      
    case 'OrderConfirmed':
      this.props.status = 'confirmed';
      this.props.confirmedAt = event.eventData.confirmedAt as Date;
      break;
      
    case 'OrderCancelled':
      this.props.status = 'cancelled';
      break;
      
    case 'OrderItemAdded':
      this.props.items.push(event.eventData.item as OrderItem);
      break;
      
    case 'OrderItemRemoved':
      this.props.items = this.props.items.filter(
        item => item.id !== event.eventData.itemId
      );
      break;
  }
}
```

## Event Versioning

### Handling Event Schema Changes

```typescript
// Version 1
{
  type: 'UserCreated',
  data: { email: string }
}

// Version 2 (added name)
{
  type: 'UserCreated',
  version: 2,
  data: { email: string, name: string }
}

// Handle both versions in replay
protected applyEventToState(event: DomainEvent): void {
  if (event.eventType === 'UserCreated') {
    if (event.aggregateVersion === 1) {
      // Old version - provide default
      this.props.name = 'Unknown';
    } else {
      // New version
      this.props.name = event.eventData.name as string;
    }
  }
}
```

## Snapshots for Performance

For aggregates with many events, use snapshots.

```typescript
// Save snapshot
await snapshotManager.save(userId, user.toProps());

// Load with snapshot
const snapshot = await snapshotManager.load(userId);
if (snapshot) {
  const user = User.fromProps(snapshot.state);
  const eventsAfterSnapshot = await eventStore.getEvents(userId, snapshot.version);
  user.replayEvents(eventsAfterSnapshot);
} else {
  const events = await eventStore.getEvents(userId);
  const user = User.fromEvents(events);
}
```

## Testing Event Sourced Aggregates

```typescript
describe('Order aggregate', () => {
  it('should create order and emit event', () => {
    const order = Order.create('customer-123', [
      { productId: 'p1', quantity: 2, price: 10 }
    ]);

    const events = order.getUncommittedEvents();
    
    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe('OrderCreated');
    expect(events[0].eventData.customerId).toBe('customer-123');
  });

  it('should only confirm pending orders', () => {
    const order = Order.create('customer-123', [...]);
    order.confirm();
    
    expect(() => order.confirm()).toThrow('Only pending orders can be confirmed');
  });

  it('should reconstruct from events', () => {
    const events: DomainEvent[] = [
      { eventType: 'OrderCreated', eventData: {...} },
      { eventType: 'OrderConfirmed', eventData: {...} }
    ];

    const order = Order.fromEvents(events);
    
    expect(order.status).toBe('confirmed');
  });
});
```

## Anti-Patterns

❌ **Don't query events for reads**
```typescript
// DON'T DO THIS - Slow!
const events = await eventStore.getEvents(userId);
const user = User.fromEvents(events);
return user.email;
```

✅ **Use read models**
```typescript
// DO THIS - Fast!
const user = await UserReadModel.findById<UserReadModel>(userId);
return user.email;
```

## Related Guides

- [Aggregates](./aggregates.md)
- [Read Models](./read-models.md)
- [Projections](./projections.md)
