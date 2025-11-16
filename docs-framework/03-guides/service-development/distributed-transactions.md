# Distributed Transactions

## Use this guide if...

- You need to coordinate operations across multiple services
- You're implementing multi-step workflows with compensation
- You want to ensure consistency without distributed locks
- You need to handle failures in complex business processes

## Quick Example

```typescript
// src/sagas/OrderFulfillmentSaga.ts
import { Saga, StartsWith, CompensateWith } from '@banyanai/platform-saga-framework';

@Saga()
export class OrderFulfillmentSaga {
  constructor(
    private inventoryClient: InventoryServiceClient,
    private paymentClient: PaymentServiceClient,
    private shippingClient: ShippingServiceClient
  ) {}

  @StartsWith(OrderCreatedEvent)
  async onOrderCreated(event: OrderCreatedEvent): Promise<void> {
    const orderId = event.eventData.orderId;

    // Step 1: Reserve inventory (with compensation)
    await this.execute(
      () => this.inventoryClient.reserveItems({ orderId }),
      () => this.inventoryClient.releaseItems({ orderId })
    );

    // Step 2: Process payment (with compensation)
    await this.execute(
      () => this.paymentClient.processPayment({ orderId }),
      () => this.paymentClient.refundPayment({ orderId })
    );

    // Step 3: Schedule shipping (with compensation)
    await this.execute(
      () => this.shippingClient.scheduleShipment({ orderId }),
      () => this.shippingClient.cancelShipment({ orderId })
    );

    // All steps succeeded - saga complete
    await this.complete({ orderId, status: 'fulfilled' });
  }
}
```

**Saga automatically:**
- Tracks workflow state
- Retries failed steps
- Executes compensation on failure
- Ensures eventual consistency

## Saga Pattern

### What is a Saga?

A saga is a sequence of local transactions where each transaction:
1. Updates the database
2. Publishes an event or sends a command
3. Has a compensating transaction to undo its effects

### When to Use Sagas

✅ **Use sagas for:**
- Multi-service workflows
- Long-running processes
- Complex business transactions
- Operations that need compensation

❌ **Don't use sagas for:**
- Single-service operations (use aggregates)
- Simple CRUD (use commands/queries)
- Read-only operations (use queries)

## Step-by-Step Guide

### Step 1: Define the Saga

```typescript
// src/sagas/OrderProcessingSaga.ts
import { Saga, StartsWith } from '@banyanai/platform-saga-framework';

@Saga()
export class OrderProcessingSaga {
  constructor(
    private inventoryClient: InventoryServiceClient,
    private paymentClient: PaymentServiceClient
  ) {}

  @StartsWith(OrderCreatedEvent)
  async processOrder(event: OrderCreatedEvent): Promise<void> {
    // Saga implementation
  }
}
```

### Step 2: Implement Steps with Compensation

```typescript
@StartsWith(OrderCreatedEvent)
async processOrder(event: OrderCreatedEvent): Promise<void> {
  const orderId = event.eventData.orderId;

  try {
    // Step 1: Reserve inventory
    await this.execute({
      action: () => this.inventoryClient.reserveItems({
        orderId,
        items: event.eventData.items
      }),
      compensation: () => this.inventoryClient.releaseItems({ orderId })
    });

    // Step 2: Process payment
    await this.execute({
      action: () => this.paymentClient.processPayment({
        orderId,
        amount: event.eventData.totalAmount
      }),
      compensation: () => this.paymentClient.refundPayment({ orderId })
    });

    // Mark saga as complete
    await this.complete({ orderId, status: 'processed' });
  } catch (error) {
    // Saga framework automatically runs compensation
    Logger.error('Saga failed, compensating:', error as Error);
    throw error;
  }
}
```

### Step 3: Handle Saga Events

```typescript
// Other services react to saga progress

@EventHandlerDecorator(OrderProcessedEvent)
export class UpdateOrderStatusHandler extends EventHandler<OrderProcessedEvent, void> {
  async handle(event: OrderProcessedEvent): Promise<void> {
    // Update order status after successful saga completion
    await OrderReadModel.update(event.orderId, {
      status: 'processed',
      processedAt: new Date()
    });
  }
}
```

## Common Patterns

### Pattern 1: Sequential Steps

Steps execute one after another.

```typescript
@StartsWith(OrderCreatedEvent)
async processOrder(event: OrderCreatedEvent): Promise<void> {
  // Execute sequentially
  await this.step1();  // Wait for completion
  await this.step2();  // Then execute step 2
  await this.step3();  // Then execute step 3
}
```

### Pattern 2: Parallel Steps

Independent steps execute concurrently.

```typescript
@StartsWith(OrderCreatedEvent)
async processOrder(event: OrderCreatedEvent): Promise<void> {
  // Execute in parallel
  await Promise.all([
    this.checkInventory(),
    this.validateCustomer(),
    this.calculateTax()
  ]);

  // Then proceed with dependent steps
  await this.processPayment();
}
```

### Pattern 3: Conditional Execution

Steps based on business logic.

```typescript
@StartsWith(OrderCreatedEvent)
async processOrder(event: OrderCreatedEvent): Promise<void> {
  await this.reserveInventory();

  // Conditional step
  if (event.eventData.totalAmount > 10000) {
    await this.requireApproval();
  }

  await this.processPayment();
}
```

### Pattern 4: Retry with Timeout

```typescript
@StartsWith(OrderCreatedEvent)
async processOrder(event: OrderCreatedEvent): Promise<void> {
  await this.execute({
    action: () => this.paymentClient.processPayment({...}),
    compensation: () => this.paymentClient.refundPayment({...}),
    retries: 3,
    timeout: 30000  // 30 seconds
  });
}
```

### Pattern 5: Event-Driven Saga

React to multiple events.

```typescript
@Saga()
export class OrderFulfillmentSaga {
  private sagaState: Map<string, SagaState> = new Map();

  @StartsWith(OrderCreatedEvent)
  async onOrderCreated(event: OrderCreatedEvent): Promise<void> {
    const state = this.initState(event.eventData.orderId);
    state.orderCreated = true;
    await this.checkCompletion(state);
  }

  @Handles(InventoryReservedEvent)
  async onInventoryReserved(event: InventoryReservedEvent): Promise<void> {
    const state = this.getState(event.orderId);
    state.inventoryReserved = true;
    await this.checkCompletion(state);
  }

  @Handles(PaymentProcessedEvent)
  async onPaymentProcessed(event: PaymentProcessedEvent): Promise<void> {
    const state = this.getState(event.orderId);
    state.paymentProcessed = true;
    await this.checkCompletion(state);
  }

  private async checkCompletion(state: SagaState): Promise<void> {
    if (state.orderCreated && state.inventoryReserved && state.paymentProcessed) {
      await this.complete({ orderId: state.orderId });
    }
  }
}
```

## Compensation Strategies

### Backward Recovery (Undo)

Reverse the effects of completed steps.

```typescript
try {
  await this.step1();  // Reserve inventory
  await this.step2();  // Process payment
  await this.step3();  // Ship order - FAILS
} catch (error) {
  // Compensate in reverse order
  await this.undoStep2();  // Refund payment
  await this.undoStep1();  // Release inventory
}
```

### Forward Recovery (Retry)

Retry failed steps until they succeed.

```typescript
async processPayment(): Promise<void> {
  let attempts = 0;
  while (attempts < 5) {
    try {
      return await this.paymentClient.processPayment({...});
    } catch (error) {
      attempts++;
      if (attempts >= 5) throw error;
      await this.delay(Math.pow(2, attempts) * 1000);  // Exponential backoff
    }
  }
}
```

## Testing Sagas

```typescript
describe('OrderProcessingSaga', () => {
  let saga: OrderProcessingSaga;
  let mockInventoryClient: jest.Mocked<InventoryServiceClient>;
  let mockPaymentClient: jest.Mocked<PaymentServiceClient>;

  beforeEach(() => {
    mockInventoryClient = {
      reserveItems: jest.fn().mockResolvedValue({ success: true }),
      releaseItems: jest.fn().mockResolvedValue({ success: true })
    } as any;

    mockPaymentClient = {
      processPayment: jest.fn().mockResolvedValue({ success: true }),
      refundPayment: jest.fn().mockResolvedValue({ success: true })
    } as any;

    saga = new OrderProcessingSaga(mockInventoryClient, mockPaymentClient);
  });

  it('should complete saga successfully', async () => {
    const event: OrderCreatedEvent = {...};
    await saga.processOrder(event);

    expect(mockInventoryClient.reserveItems).toHaveBeenCalled();
    expect(mockPaymentClient.processPayment).toHaveBeenCalled();
  });

  it('should compensate on payment failure', async () => {
    mockPaymentClient.processPayment.mockRejectedValue(new Error('Payment failed'));

    const event: OrderCreatedEvent = {...};
    await expect(saga.processOrder(event)).rejects.toThrow();

    // Verify compensation
    expect(mockInventoryClient.releaseItems).toHaveBeenCalled();
  });
});
```

## Anti-Patterns to Avoid

❌ **Don't use distributed locks**
```typescript
// DON'T DO THIS
const lock = await redisClient.lock('order-123');
try {
  await this.processOrder();
} finally {
  await lock.release();
}
```

✅ **Use sagas with compensation**
```typescript
// DO THIS
await this.execute({
  action: () => this.processOrder(),
  compensation: () => this.cancelOrder()
});
```

---

❌ **Don't ignore compensation**
```typescript
// DON'T DO THIS
await this.step1();
await this.step2();  // If this fails, step1 not undone
```

✅ **Always provide compensation**
```typescript
// DO THIS
await this.execute({
  action: () => this.step1(),
  compensation: () => this.undoStep1()
});
```

## Related Guides

- [Event Handlers](./event-handlers.md)
- [Service Clients](./service-clients.md)
- [Error Handling](./error-handling.md)
