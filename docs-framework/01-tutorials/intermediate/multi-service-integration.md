---
title: "Multi-Service Integration"
description: "Build a workflow that integrates multiple microservices through message-based communication"
category: "tutorials"
tags: ["intermediate", "integration", "messaging", "workflow", "hands-on"]
difficulty: "intermediate"
estimated_time: "180 minutes"
prerequisites:
  - "Completed beginner tutorials"
  - "Understanding of message-based communication"
  - "Multiple services running"
learning_objectives:
  - "Integrate multiple services via message bus"
  - "Handle inter-service communication"
  - "Implement service clients"
  - "Handle distributed failures"
  - "Test multi-service workflows"
last_updated: "2025-01-15"
status: "published"
---

# Multi-Service Integration

> **What You'll Build:** A complete e-commerce checkout workflow that integrates user, order, inventory, and notification services.

## Overview

This tutorial teaches you to build workflows that span multiple microservices. You'll integrate services through the message bus, handle failures gracefully, and implement distributed business processes.

### The Workflow

```
1. User places order (Order Service)
   ↓
2. Reserve inventory (Inventory Service)
   ↓
3. Process payment (Payment Service)
   ↓
4. Send confirmation (Notification Service)
   ↓
5. Update user profile (User Service)
```

### Learning Objectives

By the end of this tutorial, you will be able to:

- Design multi-service workflows
- Implement service-to-service communication
- Create typed service clients
- Handle compensating actions
- Test distributed workflows
- Debug cross-service issues

### Prerequisites

Before starting this tutorial, you should:

- Complete beginner tutorials
- Have multiple services running
- Understand message-based architecture

## Part 1: Service Architecture

### Services Involved

**Order Service:**
- Creates orders
- Manages order lifecycle
- Emits `OrderPlaced` event

**Inventory Service:**
- Tracks product stock
- Reserves inventory
- Subscribes to `OrderPlaced`

**Payment Service:**
- Processes payments
- Emits `PaymentProcessed` event

**Notification Service:**
- Sends emails/SMS
- Subscribes to `OrderPlaced`, `PaymentProcessed`

**User Service:**
- Manages user data
- Tracks purchase history

### Communication Pattern

Services communicate exclusively through RabbitMQ:

```
Order Service → OrderPlaced Event → RabbitMQ
                                      ↓
                          [Inventory, Payment, Notification]
                                      ↓
Payment Service → PaymentProcessed → RabbitMQ
                                      ↓
                                 [Notification]
```

## Part 2: Implement Service Clients

### Step 1: Create OrderServiceClient

In Inventory Service, create a client to query Order Service:

```typescript
// inventory-service/src/clients/OrderServiceClient.ts
import { MessageBusClient } from '@banyanai/platform-message-bus-client';

export class OrderServiceClient {
  private messageBus: MessageBusClient;

  constructor() {
    this.messageBus = new MessageBusClient({
      url: process.env.MESSAGE_BUS_URL || 'amqp://localhost:5672',
      exchange: 'platform',
    });
  }

  async getOrder(orderId: string) {
    return await this.messageBus.sendQuery(
      'OrderService.Queries.GetOrder',
      { orderId }
    );
  }
}
```

### Step 2: Subscribe to Events

Create event handlers in each service:

```typescript
// inventory-service/src/events/OrderPlacedHandler.ts
import { EventHandler, EventHandlerDecorator } from '@banyanai/platform-base-service';
import { Logger } from '@banyanai/platform-telemetry';

export class OrderPlaced {
  constructor(
    public orderId: string,
    public items: Array<{ productId: string; quantity: number }>,
    public customerId: string
  ) {}
}

@EventHandlerDecorator(OrderPlaced)
export class OrderPlacedHandler extends EventHandler<OrderPlaced> {
  async handle(event: OrderPlaced): Promise<void> {
    Logger.info('Order placed, reserving inventory', { orderId: event.orderId });

    for (const item of event.items) {
      await this.reserveInventory(item.productId, item.quantity);
    }

    Logger.info('Inventory reserved', { orderId: event.orderId });
  }

  private async reserveInventory(productId: string, quantity: number): Promise<void> {
    // Implementation
  }
}
```

## Part 3: Handle Distributed Failures

### Compensating Actions

If payment fails after inventory is reserved:

```typescript
// payment-service/src/commands/ProcessPaymentHandler.ts
async handle(command: ProcessPaymentCommand): Promise<ProcessPaymentResult> {
  try {
    // Process payment
    const result = await this.processPayment(command);

    if (!result.success) {
      // Emit failure event
      await this.publishEvent(new PaymentFailed(command.orderId, result.error));
    }

    return result;
  } catch (error) {
    // Critical failure - emit event for compensation
    await this.publishEvent(new PaymentFailed(command.orderId, error.message));
    throw error;
  }
}
```

Handle compensation in Inventory Service:

```typescript
// inventory-service/src/events/PaymentFailedHandler.ts
@EventHandlerDecorator(PaymentFailed)
export class PaymentFailedHandler extends EventHandler<PaymentFailed> {
  async handle(event: PaymentFailed): Promise<void> {
    Logger.info('Payment failed, releasing inventory', { orderId: event.orderId });

    // Load order to get items
    const order = await this.orderClient.getOrder(event.orderId);

    // Release reserved inventory
    for (const item of order.items) {
      await this.releaseInventory(item.productId, item.quantity);
    }
  }
}
```

## Part 4: Testing Multi-Service Workflows

### Integration Test

```typescript
describe('Checkout Workflow', () => {
  it('should complete full checkout process', async () => {
    // 1. Create order
    const orderResult = await orderClient.createOrder({
      customerId: 'customer-123',
      items: [{ productId: 'product-1', quantity: 2 }]
    });

    // 2. Wait for inventory reservation
    await waitForEvent('InventoryReserved', { orderId: orderResult.orderId });

    // 3. Process payment
    const paymentResult = await paymentClient.processPayment({
      orderId: orderResult.orderId,
      amount: 100.00
    });

    expect(paymentResult.success).toBe(true);

    // 4. Wait for notification
    await waitForEvent('NotificationSent', { orderId: orderResult.orderId });

    // 5. Verify order status
    const order = await orderClient.getOrder(orderResult.orderId);
    expect(order.status).toBe('completed');
  });

  it('should rollback on payment failure', async () => {
    // Create order
    const orderResult = await orderClient.createOrder({
      customerId: 'customer-123',
      items: [{ productId: 'product-1', quantity: 2 }]
    });

    // Wait for inventory reservation
    await waitForEvent('InventoryReserved', { orderId: orderResult.orderId });

    // Simulate payment failure
    const paymentResult = await paymentClient.processPayment({
      orderId: orderResult.orderId,
      amount: 999999.99 // Amount that will fail
    });

    expect(paymentResult.success).toBe(false);

    // Wait for inventory release
    await waitForEvent('InventoryReleased', { orderId: orderResult.orderId });

    // Verify inventory was released
    const inventory = await inventoryClient.getInventory('product-1');
    expect(inventory.reserved).toBe(0);
  });
});
```

## Understanding Multi-Service Integration

### Key Patterns

1. **Event-Driven Communication**: Services react to events
2. **Service Clients**: Type-safe inter-service queries
3. **Compensating Actions**: Undo operations on failure
4. **Eventual Consistency**: Services sync asynchronously
5. **Idempotency**: Event handlers can be called multiple times

### Benefits

- **Loose Coupling**: Services don't know about each other's internals
- **Resilience**: Failures are isolated
- **Scalability**: Services can be scaled independently
- **Flexibility**: Easy to add new services to workflow

### Challenges

- **Debugging**: Trace requests across services
- **Testing**: Need integration tests
- **Consistency**: Eventual consistency requires careful design
- **Ordering**: Event order may not be guaranteed

## Next Steps

- [Saga Orchestration](../advanced/saga-orchestration.md) - Coordinate complex workflows
- [Distributed Tracing](../../03-guides/distributed-tracing.md) - Debug cross-service issues
- [Event Design Patterns](../../03-guides/event-patterns.md)

## Additional Resources

- [Message Bus Client](../../02-concepts/message-bus.md)
- [Event Handling](../../02-concepts/events.md)
- [Service Discovery](../../02-concepts/service-discovery.md)
