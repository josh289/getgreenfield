# Event-Sourced Service Example - Order Management

## Overview

This example demonstrates a full event-sourced service using the platform's event sourcing capabilities. It implements an order management system where all state changes are captured as events, enabling complete audit trails and temporal queries.

## What You'll Learn

- Event sourcing with aggregates and domain events
- Event-driven architecture patterns
- Read model projections with `@MapFromEvent`
- Event store integration
- Domain-driven design (DDD) with aggregates
- Eventually consistent read models
- Event replay and catchup processes

## Prerequisites

- Completion of the Basic CRUD Service Example (or understanding of platform fundamentals)
- Node.js 20+
- pnpm installed
- Docker and Docker Compose (for infrastructure)
- Understanding of event sourcing concepts

## Service Architecture

This service implements order management with complete event sourcing:

### Commands (Write Operations)
- **CreateOrder**: Create a new order
- **AddItem**: Add an item to an order
- **RemoveItem**: Remove an item from an order
- **PlaceOrder**: Submit an order for processing
- **CancelOrder**: Cancel a pending order

### Queries (Read Operations)
- **GetOrder**: Retrieve order details
- **ListOrders**: List orders for a customer

### Domain Events
- **OrderCreated**: New order was created
- **ItemAdded**: Item was added to order
- **ItemRemoved**: Item was removed from order
- **OrderPlaced**: Order was submitted
- **OrderCancelled**: Order was cancelled

### Aggregates
- **Order**: Root aggregate managing order lifecycle and invariants

### Read Models
- **OrderReadModel**: Denormalized view of orders with automatic projection from events

## Key Concepts Demonstrated

### 1. Event Sourcing
Instead of storing current state, we store **all events** that led to that state:

```typescript
// Traditional approach (state-based)
UPDATE orders SET status = 'placed' WHERE id = '123';

// Event sourcing approach (event-based)
APPEND OrderPlaced event to order-123 event stream
```

Benefits:
- Complete audit trail
- Temporal queries (what was the state at time X?)
- Event replay for debugging
- Easy to add new read models

### 2. Aggregates
Aggregates are consistency boundaries that enforce business rules:

```typescript
@Aggregate({ aggregateName: 'Order' })
export class Order extends AggregateRoot {
  placeOrder() {
    // Enforce invariant: can't place empty order
    if (this.items.length === 0) {
      throw new Error('Cannot place order with no items');
    }

    // Emit event (doesn't modify state directly)
    this.raiseEvent(new OrderPlaced(this.id, this.customerId, this.total));
  }
}
```

### 3. Read Model Projections
Read models are automatically updated from events:

```typescript
@ReadModel({ tableName: 'rm_orders', aggregateType: 'Order' })
export class OrderReadModel extends ReadModelBase<OrderReadModel> {
  @MapFromEvent('OrderCreated')
  @MapFromEvent('OrderPlaced')
  id!: string;

  @MapFromEvent('OrderCreated')
  @MapFromEvent('OrderPlaced')
  customerId!: string;

  @MapFromEvent('OrderPlaced')
  status!: 'draft' | 'placed' | 'cancelled';
}
```

When an `OrderPlaced` event is saved, the platform automatically:
1. Detects which read models care about this event
2. Maps event fields to read model fields
3. Updates the read model in PostgreSQL
4. Makes the updated data immediately available to queries

## Project Structure

```
event-sourced-service/
├── README.md
├── package.json
├── src/
│   ├── main.ts                           # Service entry point
│   ├── domain/
│   │   ├── aggregates/
│   │   │   └── Order.ts                  # Order aggregate root
│   │   └── events/
│   │       ├── OrderCreated.ts
│   │       ├── ItemAdded.ts
│   │       ├── ItemRemoved.ts
│   │       ├── OrderPlaced.ts
│   │       └── OrderCancelled.ts
│   ├── commands/
│   │   ├── CreateOrderHandler.ts
│   │   ├── AddItemHandler.ts
│   │   ├── RemoveItemHandler.ts
│   │   ├── PlaceOrderHandler.ts
│   │   └── CancelOrderHandler.ts
│   ├── queries/
│   │   ├── GetOrderHandler.ts
│   │   └── ListOrdersHandler.ts
│   └── read-models/
│       └── OrderReadModel.ts             # Projection from events
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd event-sourced-service
pnpm install
```

### 2. Start Infrastructure

Event sourcing requires PostgreSQL for the event store:

```bash
# From platform root
docker compose up -d rabbitmq postgres
```

### 3. Set Environment Variables

Create a `.env` file:

```bash
# Service Configuration
SERVICE_NAME=order-service
SERVICE_VERSION=1.0.0
ENVIRONMENT=development

# Event Sourcing (REQUIRED)
EVENT_SOURCING_ENABLED=true

# Message Bus (RabbitMQ)
MESSAGE_BUS_URL=amqp://guest:guest@localhost:5672
MESSAGE_BUS_EXCHANGE=platform

# Event Store Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=orders_eventstore
DB_USERNAME=postgres
DB_PASSWORD=postgres

# Telemetry
JAEGER_ENDPOINT=http://localhost:14268/api/traces
```

### 4. Initialize Event Store

The platform automatically creates the event store schema on first run:

```bash
pnpm run build
pnpm start
```

The event store creates these tables:
- `events`: All domain events
- `snapshots`: Aggregate snapshots for performance
- `rm_orders`: Order read model projection

## Event Sourcing Flow

### Write Path (Commands → Events)

```
1. Command arrives → CreateOrderHandler
2. Handler loads/creates aggregate → new Order()
3. Business logic executes → order.create()
4. Aggregate emits events → OrderCreated event
5. Handler saves aggregate → eventStore.append()
6. Events published to bus → RabbitMQ
7. Read models updated → OrderReadModel projection
```

### Read Path (Queries → Read Models)

```
1. Query arrives → GetOrderHandler
2. Handler queries read model → OrderReadModel.findById()
3. Returns denormalized data → Optimized for reads
```

### Key Insight
**Commands modify aggregates, events update read models.**

Aggregates enforce business rules, read models optimize queries.

## Code Walkthrough

### Domain Event

```typescript
// src/domain/events/OrderCreated.ts
import { DomainEvent } from '@banyanai/platform-contract-system';

@DomainEvent({
  description: 'Order was created',
  broadcast: true // Publish to message bus for other services
})
export class OrderCreated {
  constructor(
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly createdAt: Date,
    public readonly createdBy?: string
  ) {}
}
```

### Aggregate

```typescript
// src/domain/aggregates/Order.ts
import { Aggregate, AggregateRoot } from '@banyanai/platform-event-sourcing';
import { OrderCreated, ItemAdded, OrderPlaced } from '../events';

@Aggregate({ aggregateName: 'Order' })
export class Order extends AggregateRoot {
  private customerId: string = '';
  private items: OrderItem[] = [];
  private status: 'draft' | 'placed' | 'cancelled' = 'draft';
  private total: number = 0;

  // Business method - enforces invariants and emits events
  create(orderId: string, customerId: string, createdBy?: string) {
    if (this.customerId) {
      throw new Error('Order already created');
    }

    this.raiseEvent(new OrderCreated(orderId, customerId, new Date(), createdBy));
  }

  addItem(productId: string, quantity: number, price: number) {
    if (this.status !== 'draft') {
      throw new Error('Cannot modify placed order');
    }

    if (quantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    this.raiseEvent(new ItemAdded(this.id, productId, quantity, price));
  }

  placeOrder() {
    if (this.items.length === 0) {
      throw new Error('Cannot place empty order');
    }

    if (this.status !== 'draft') {
      throw new Error('Order already placed');
    }

    this.raiseEvent(new OrderPlaced(this.id, this.customerId, this.total, new Date()));
  }

  // Event handlers - update internal state
  protected onOrderCreated(event: OrderCreated) {
    this.id = event.orderId;
    this.customerId = event.customerId;
  }

  protected onItemAdded(event: ItemAdded) {
    this.items.push({
      productId: event.productId,
      quantity: event.quantity,
      price: event.price
    });
    this.total += event.quantity * event.price;
  }

  protected onOrderPlaced(event: OrderPlaced) {
    this.status = 'placed';
  }
}
```

### Command Handler with Event Sourcing

```typescript
// src/commands/CreateOrderHandler.ts
import { CommandHandler, CommandHandlerDecorator } from '@banyanai/platform-base-service';
import { AuthenticatedUser } from '@banyanai/platform-core';
import { BaseService } from '@banyanai/platform-base-service';
import { Order } from '../domain/aggregates/Order';
import { CreateOrderCommand, CreateOrderResult } from '../contracts';

@CommandHandlerDecorator(CreateOrderCommand)
export class CreateOrderHandler extends CommandHandler<CreateOrderCommand, CreateOrderResult> {
  async handle(command: CreateOrderCommand, user: AuthenticatedUser | null): Promise<CreateOrderResult> {
    // 1. Create new aggregate
    const order = new Order();
    const orderId = this.generateId();

    // 2. Execute business logic (emits events internally)
    order.create(orderId, command.customerId, user?.userId);

    // 3. Save aggregate (persists events and triggers projections)
    const eventStore = BaseService.getEventStore();
    if (!eventStore) {
      throw new Error('Event store not initialized');
    }

    await eventStore.append(orderId, order.getUncommittedEvents() as any);

    // 4. Return result
    return {
      success: true,
      orderId,
      customerId: command.customerId
    };
  }
}
```

### Read Model with Automatic Projection

```typescript
// src/read-models/OrderReadModel.ts
import { ReadModel, ReadModelBase, MapFromEvent, Index } from '@banyanai/platform-event-sourcing';

@ReadModel({ tableName: 'rm_orders', aggregateType: 'Order' })
export class OrderReadModel extends ReadModelBase<OrderReadModel> {
  @Index(undefined, { unique: true })
  @MapFromEvent('OrderCreated')
  @MapFromEvent('OrderPlaced')
  @MapFromEvent('OrderCancelled')
  id!: string;

  @Index()
  @MapFromEvent('OrderCreated')
  customerId!: string;

  @MapFromEvent('OrderPlaced')
  status!: 'draft' | 'placed' | 'cancelled';

  @MapFromEvent('ItemAdded')
  @MapFromEvent('ItemRemoved')
  @MapFromEvent('OrderPlaced')
  items!: Array<{
    productId: string;
    quantity: number;
    price: number;
  }>;

  @MapFromEvent('OrderPlaced')
  total!: number;

  @MapFromEvent('OrderCreated')
  createdAt!: Date;

  @MapFromEvent('OrderPlaced')
  placedAt?: Date;

  getId(): string {
    return this.id;
  }

  static async findById(id: string): Promise<OrderReadModel | null> {
    const results = await OrderReadModel.findBy<OrderReadModel>({ id });
    return results.length > 0 ? results[0] : null;
  }

  static async findByCustomerId(customerId: string): Promise<OrderReadModel[]> {
    return await OrderReadModel.findBy<OrderReadModel>({ customerId });
  }
}
```

## Testing Event Sourcing

### Create and Place an Order

```typescript
import { OrderServiceClient } from '@your-org/order-service-client';

const client = new OrderServiceClient();

// Create order
const { orderId } = await client.createOrder({
  customerId: 'customer-123'
});

// Add items
await client.addItem({
  orderId,
  productId: 'product-456',
  quantity: 2,
  price: 29.99
});

await client.addItem({
  orderId,
  productId: 'product-789',
  quantity: 1,
  price: 49.99
});

// Place order
await client.placeOrder({ orderId });

// Query order
const order = await client.getOrder({ orderId });
console.log(order);
// {
//   id: 'order-123',
//   customerId: 'customer-123',
//   status: 'placed',
//   items: [...],
//   total: 109.97
// }
```

### Inspect Event Stream

```typescript
// You can replay the full event stream to see order history
const eventStore = BaseService.getEventStore();
const events = await eventStore.getEvents('order-123');

events.forEach(event => {
  console.log(event.type, event.timestamp, event.payload);
});

// Output:
// OrderCreated 2024-01-15T10:00:00Z { orderId: '...', customerId: '...' }
// ItemAdded    2024-01-15T10:01:00Z { productId: '456', quantity: 2 }
// ItemAdded    2024-01-15T10:02:00Z { productId: '789', quantity: 1 }
// OrderPlaced  2024-01-15T10:03:00Z { orderId: '...', total: 109.97 }
```

## Event Sourcing Patterns

### 1. Eventual Consistency

Read models are **eventually consistent** - they update shortly after events are saved:

```typescript
// Command returns immediately
await client.placeOrder({ orderId });

// Read model updates milliseconds later
const order = await client.getOrder({ orderId });
// status is now 'placed'
```

### 2. Event Replay

Rebuild read models from scratch by replaying events:

```typescript
const readModelManager = BaseService.getReadModelManager();
await readModelManager.runCatchupProcess(OrderReadModel);

// This replays ALL OrderCreated, ItemAdded, OrderPlaced events
// and rebuilds the rm_orders table from scratch
```

### 3. Temporal Queries

Query state at any point in time:

```typescript
const eventStore = BaseService.getEventStore();

// Get events up to a specific timestamp
const pastEvents = await eventStore.getEventsUntil('order-123', new Date('2024-01-15'));

// Rebuild aggregate from those events
const order = new Order();
order.loadFromHistory(pastEvents);

// Now 'order' represents the state at that timestamp
```

### 4. Snapshots

For performance, periodically save aggregate snapshots:

```typescript
// After 100 events, save a snapshot
if (eventCount % 100 === 0) {
  await eventStore.saveSnapshot(aggregateId, currentState, eventCount);
}

// When loading, start from snapshot instead of event 1
const snapshot = await eventStore.getLatestSnapshot(aggregateId);
aggregate.loadFromSnapshot(snapshot);
aggregate.loadFromHistory(eventsAfterSnapshot);
```

## Common Patterns

### Handling Concurrency

Event sourcing provides natural optimistic concurrency:

```typescript
try {
  await eventStore.append(orderId, events, expectedVersion);
} catch (error) {
  if (error instanceof ConcurrencyError) {
    // Someone else modified the aggregate
    // Reload and retry
  }
}
```

### Idempotency

Commands should be idempotent:

```typescript
placeOrder() {
  // Idempotent - placing twice has same effect as placing once
  if (this.status === 'placed') {
    return; // Already placed, no-op
  }
  this.raiseEvent(new OrderPlaced(...));
}
```

### Compensation

To "undo" an event, emit a compensating event:

```typescript
// Don't delete OrderPlaced event
// Instead, emit OrderCancelled event
cancelOrder() {
  if (this.status !== 'placed') {
    throw new Error('Can only cancel placed orders');
  }
  this.raiseEvent(new OrderCancelled(this.id, new Date()));
}
```

## What's Next?

After understanding event sourcing:

1. **External Auth Integration Example**: Learn about integrating external identity providers
2. **Saga Framework**: Coordinate distributed transactions across event-sourced services
3. **Process Managers**: Implement long-running business processes

## Key Takeaways

1. **Events are Facts**: OrderPlaced is an immutable fact that happened
2. **Aggregates Enforce Rules**: Business logic lives in aggregates
3. **Read Models Optimize Queries**: Denormalized views for fast reads
4. **Eventual Consistency**: Read models update shortly after events
5. **Complete Audit Trail**: Every state change is recorded forever
6. **Time Travel**: Can query state at any point in history

## Troubleshooting

### Read model not updating
- Check `@MapFromEvent` decorators match event names exactly
- Verify event sourcing is enabled: `EVENT_SOURCING_ENABLED=true`
- Run catchup: `readModelManager.runCatchupProcess(OrderReadModel)`

### Events not being saved
- Ensure event store is initialized
- Check database connection
- Verify aggregate extends `AggregateRoot`

### Concurrency errors
- Implement retry logic with exponential backoff
- Consider using optimistic concurrency with version checks

## Additional Resources

- [Event Sourcing Fundamentals](../../02-core-concepts/event-sourcing.md)
- [DDD with Aggregates](../../02-core-concepts/aggregates.md)
- [Read Model Projections](../../02-core-concepts/read-models.md)
- [Basic CRUD Example](../basic-crud-service/)
