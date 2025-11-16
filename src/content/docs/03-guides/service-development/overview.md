---
title: "Service Development Overview"
---

# Service Development Overview

## Use this guide if...

- You're creating a new microservice from scratch
- You want to understand the complete service development lifecycle
- You're transitioning from other microservice frameworks to banyan-core
- You need to understand which guide to read next for specific tasks

## Quick Start

The banyan-core platform is designed for **zero infrastructure code**. You write pure business logic - the platform handles all infrastructure concerns.

### Core Philosophy

```typescript
// This is ALL the infrastructure code you write:
await BaseService.start({
  name: 'order-service',
  version: '1.0.0'
});

// Everything else is business logic!
```

The platform automatically provides:
- Message bus communication
- Distributed tracing
- Event sourcing
- Circuit breakers and retries
- Health checks and metrics
- Contract validation
- Two-layer authorization

## Service Development Workflow

### 1. Create Service Structure

```bash
# Create new service from template
npx @banyanai/platform-cli create order-service

# Or manually create folders
mkdir -p my-service/src/{commands,queries,events,domain,contracts,read-models}
```

### 2. Define Contracts

Contracts are type-safe definitions of your service's API.

```typescript
// src/contracts/commands/CreateOrderCommand.ts
import { Command } from '@banyanai/platform-contract-system';

@Command({
  description: 'Creates a new order',
  permissions: ['order:create']
})
export class CreateOrderCommand {
  customerId: string;
  items: OrderItem[];

  constructor(customerId: string, items: OrderItem[]) {
    this.customerId = customerId;
    this.items = items;
  }
}

export interface CreateOrderResult {
  success: boolean;
  orderId?: string;
  error?: string;
}
```

**See:** [defining-contracts.md](./defining-contracts.md) for complete guide

### 3. Implement Domain Logic

Create aggregates that enforce business rules.

```typescript
// src/domain/Order.ts
import { Aggregate, AggregateRoot } from '@banyanai/platform-domain-modeling';

@Aggregate('Order')
export class Order extends AggregateRoot {
  static create(customerId: string, items: OrderItem[]): Order {
    // Validate business rules
    if (items.length === 0) {
      throw new Error('Order must have at least one item');
    }

    const order = new Order(/* ... */);
    order.raiseEvent('OrderCreated', { customerId, items });
    return order;
  }
}
```

**See:** [Data Management - Aggregates](../data-management/aggregates.md)

### 4. Create Handlers

Handlers are auto-discovered by folder convention.

```typescript
// src/commands/CreateOrderHandler.ts
import { CommandHandler, CommandHandlerDecorator } from '@banyanai/platform-base-service';

@CommandHandlerDecorator(CreateOrderCommand)
export class CreateOrderHandler extends CommandHandler<CreateOrderCommand, CreateOrderResult> {
  async handle(command: CreateOrderCommand, user: AuthenticatedUser | null): Promise<CreateOrderResult> {
    // Pure business logic - no infrastructure code!
    const order = Order.create(command.customerId, command.items);

    const eventStore = BaseService.getEventStore();
    await eventStore.append(order.id, order.getUncommittedEvents());

    return { success: true, orderId: order.id };
  }
}
```

**See:** [command-handlers.md](./command-handlers.md), [query-handlers.md](./query-handlers.md), [event-handlers.md](./event-handlers.md)

### 5. Build Read Models

Read models provide optimized query views.

```typescript
// src/read-models/OrderReadModel.ts
import { ReadModel, ReadModelBase, MapFromEvent, Index } from '@banyanai/platform-event-sourcing';

@ReadModel({ tableName: 'rm_orders', aggregateType: 'Order' })
export class OrderReadModel extends ReadModelBase<OrderReadModel> {
  @Index(undefined, { unique: true, type: 'btree' })
  @MapFromEvent('OrderCreated')
  id!: string;

  @Index()
  @MapFromEvent('OrderCreated')
  customerId!: string;

  @MapFromEvent('OrderCreated')
  @MapFromEvent('OrderUpdated')
  status!: string;

  getId(): string {
    return this.id;
  }

  // Static query methods
  static async findByCustomer(customerId: string): Promise<OrderReadModel[]> {
    return OrderReadModel.findBy<OrderReadModel>({ customerId });
  }
}
```

**See:** [Data Management - Read Models](../data-management/read-models.md)

### 6. Call Other Services

Use type-safe service clients (automatically injected).

```typescript
@CommandHandlerDecorator(CreateOrderCommand)
export class CreateOrderHandler extends CommandHandler<CreateOrderCommand, CreateOrderResult> {
  constructor(
    private userClient: UserServiceClient  // Auto-injected by BaseService
  ) {
    super();
  }

  async handle(command: CreateOrderCommand, user: AuthenticatedUser | null): Promise<CreateOrderResult> {
    // Simple method call - all infrastructure handled automatically
    const customer = await this.userClient.getUser({ userId: command.customerId });

    if (!customer.success) {
      return { success: false, error: 'Customer not found' };
    }

    // Continue with order creation...
  }
}
```

**See:** [service-clients.md](./service-clients.md)

### 7. Start the Service

One line starts everything.

```typescript
// src/main.ts
import { BaseService } from '@banyanai/platform-base-service';

await BaseService.start({
  name: 'order-service',
  version: '1.0.0'
});
```

## Handler Discovery

The platform automatically discovers handlers by folder convention:

```
src/
├── commands/           → Command handlers (creates, updates, deletes)
│   ├── CreateOrderHandler.ts
│   └── UpdateOrderHandler.ts
├── queries/            → Query handlers (reads, searches)
│   ├── GetOrderHandler.ts
│   └── ListOrdersHandler.ts
└── events/             → Event subscription handlers (reactions)
    └── OrderPaidHandler.ts
```

**No manual registration required!**

## Communication Patterns

### Commands (Write Operations)

Commands change system state.

```typescript
@Command({
  description: 'Creates a new order',
  permissions: ['order:create']
})
export class CreateOrderCommand { /* ... */ }
```

**When to use:**
- Creating entities
- Updating entities
- Deleting entities
- Any operation that changes state

**See:** [command-handlers.md](./command-handlers.md)

### Queries (Read Operations)

Queries retrieve data without changing state.

```typescript
@Query({
  description: 'Retrieves an order by ID',
  permissions: ['order:view']
})
export class GetOrderQuery { /* ... */ }
```

**When to use:**
- Retrieving single entities
- Searching/filtering
- Listing entities
- Any read-only operation

**See:** [query-handlers.md](./query-handlers.md)

### Events (Notifications)

Events notify other services of state changes.

```typescript
// Publishing (automatic from aggregates)
order.raiseEvent('OrderCreated', { orderId, customerId });

// Subscribing
@EventHandlerDecorator(OrderCreatedEvent)
export class SendOrderConfirmationHandler extends EventHandler<OrderCreatedEvent, void> {
  async handle(event: OrderCreatedEvent): Promise<void> {
    // React to order creation
  }
}
```

**When to use:**
- Cross-service coordination
- Async workflows
- Audit trails
- Notifications

**See:** [event-handlers.md](./event-handlers.md)

## Authorization

The platform provides two-layer authorization:

### Layer 1: Permission-Based (API Gateway)

```typescript
@Command({
  permissions: ['order:create']  // Checked at API Gateway
})
export class CreateOrderCommand { /* ... */ }
```

**Who can call this operation?**

### Layer 2: Policy-Based (Handler)

```typescript
async handle(command: CreateOrderCommand, user: AuthenticatedUser | null): Promise<CreateOrderResult> {
  // Business rules: Can this specific user perform this specific operation?
  if (command.amount > 10000 && !user?.permissions.includes('order:approve-large')) {
    return { success: false, error: 'Large orders require approval' };
  }

  // Continue...
}
```

**Can this user perform this specific operation with these specific parameters?**

**See:** [Security - Authorization](../security/authorization.md)

## Testing

Test handlers with the provided mock infrastructure.

```typescript
import { mockEventStore, mockReadModelManager } from '../test-setup';

describe('CreateOrderHandler', () => {
  let handler: CreateOrderHandler;

  beforeEach(() => {
    handler = new CreateOrderHandler();
    mockEventStore.reset();
    mockReadModelManager.reset();
  });

  it('should create order with valid input', async () => {
    const command = new CreateOrderCommand('customer-1', [{ productId: 'p1', quantity: 2 }]);
    const result = await handler.handle(command, null);

    expect(result.success).toBe(true);
    expect(result.orderId).toBeDefined();

    // Verify events
    const events = mockEventStore.getAllEvents(result.orderId!);
    expect(events[0].type).toBe('OrderCreated');
  });
});
```

**See:** [testing-handlers.md](./testing-handlers.md)

## Error Handling

All handlers should handle errors gracefully.

```typescript
async handle(command: CreateOrderCommand, user: AuthenticatedUser | null): Promise<CreateOrderResult> {
  try {
    // Business logic
    const order = Order.create(command.customerId, command.items);
    await eventStore.append(order.id, order.getUncommittedEvents());

    return { success: true, orderId: order.id };
  } catch (error) {
    Logger.error('Failed to create order:', error as Error, {
      customerId: command.customerId,
      itemCount: command.items.length
    });

    return {
      success: false,
      error: 'Failed to create order due to server error'
    };
  }
}
```

**See:** [error-handling.md](./error-handling.md)

## Distributed Transactions

For workflows spanning multiple services, use the saga framework.

```typescript
@Saga()
export class OrderFulfillmentSaga {
  @StartsWith(OrderCreatedEvent)
  async onOrderCreated(event: OrderCreatedEvent): Promise<void> {
    // Step 1: Reserve inventory
    await this.execute(() =>
      this.inventoryClient.reserveItems({ orderId: event.orderId })
    );

    // Step 2: Process payment
    await this.execute(() =>
      this.paymentClient.processPayment({ orderId: event.orderId })
    );

    // Step 3: Ship order
    await this.execute(() =>
      this.shippingClient.createShipment({ orderId: event.orderId })
    );
  }
}
```

**See:** [distributed-transactions.md](./distributed-transactions.md)

## Development Workflow Summary

1. **Define contracts** → What operations does your service expose?
2. **Create domain aggregates** → What business rules must be enforced?
3. **Implement handlers** → How do operations work?
4. **Build read models** → How do you query data efficiently?
5. **Add tests** → Does everything work correctly?
6. **Start service** → One-line deployment!

## Next Steps

Choose your path based on what you're building:

### Building Write Operations
→ [command-handlers.md](./command-handlers.md) - Creates, updates, deletes

### Building Read Operations
→ [query-handlers.md](./query-handlers.md) - Retrieving and searching data

### Reacting to Events
→ [event-handlers.md](./event-handlers.md) - Cross-service coordination

### Calling Other Services
→ [service-clients.md](./service-clients.md) - Type-safe inter-service calls

### Complex Workflows
→ [distributed-transactions.md](./distributed-transactions.md) - Multi-service sagas

### Data Management
→ [Data Management Overview](../data-management/overview.md) - Event sourcing, aggregates, read models

## Common Questions

**Q: Do I need to configure RabbitMQ, PostgreSQL, or Redis?**
A: No. BaseService.start() handles all infrastructure automatically.

**Q: How do I add HTTP endpoints?**
A: You don't. Define contracts and handlers - the API Gateway automatically creates GraphQL/REST endpoints.

**Q: How do I handle retries and circuit breakers?**
A: Service clients include automatic retry and circuit breaker patterns. No code needed.

**Q: How do I add distributed tracing?**
A: Automatic. All service calls include OpenTelemetry tracing with correlation IDs.

**Q: How do I test my handlers?**
A: Use the provided mock infrastructure. See [testing-handlers.md](./testing-handlers.md).

## Anti-Patterns to Avoid

❌ **Don't write infrastructure code**
```typescript
// DON'T DO THIS
const connection = await amqp.connect('amqp://localhost');
const channel = await connection.createChannel();
```

✅ **Use platform abstractions**
```typescript
// DO THIS
const client = new UserServiceClient();
const result = await client.getUser({ userId: '123' });
```

---

❌ **Don't make direct HTTP calls between services**
```typescript
// DON'T DO THIS
const response = await fetch('http://user-service/api/users/123');
```

✅ **Use service clients**
```typescript
// DO THIS
const result = await this.userClient.getUser({ userId: '123' });
```

---

❌ **Don't manually register handlers**
```typescript
// DON'T DO THIS
messageBus.registerHandler('CreateOrder', new CreateOrderHandler());
```

✅ **Use folder convention and decorators**
```typescript
// DO THIS - automatic discovery
// Place in src/commands/CreateOrderHandler.ts
@CommandHandlerDecorator(CreateOrderCommand)
export class CreateOrderHandler { /* ... */ }
```

## Related Guides

- [Defining Contracts](./defining-contracts.md) - Type-safe service APIs
- [Creating Services](./creating-services.md) - Complete service setup
- [Data Access Patterns](./data-access-patterns.md) - Event sourcing best practices
- [Testing Services](./testing-services.md) - Comprehensive testing strategies
- [Using Service Clients](./using-service-clients.md) - Cross-service communication
