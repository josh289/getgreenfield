---
title: "Saga Orchestration for Distributed Transactions"
description: "Implement saga pattern to coordinate long-running distributed transactions across multiple services"
category: "tutorials"
tags: ["advanced", "saga", "distributed-transactions", "orchestration", "hands-on"]
difficulty: "advanced"
estimated_time: "360 minutes"
prerequisites:
  - "Completed multi-service integration tutorial"
  - "Understanding of distributed systems"
  - "Understanding of compensation patterns"
learning_objectives:
  - "Implement saga orchestration pattern"
  - "Handle distributed transaction rollbacks"
  - "Create saga state machines"
  - "Implement compensation logic"
  - "Test saga failure scenarios"
last_updated: "2025-01-15"
status: "published"
---

# Saga Orchestration for Distributed Transactions

> **What You'll Build:** A saga orchestrator that manages a complex order fulfillment workflow across inventory, payment, shipping, and notification services.

## Overview

This tutorial teaches the saga pattern for managing distributed transactions. You'll build a saga that coordinates multiple services, handles failures with compensation, and maintains consistency without distributed locks.

### The Problem

Traditional ACID transactions don't work across microservices:
- Services have separate databases
- No global transaction coordinator
- Network failures require careful handling
- Long-running processes can't hold locks

### The Solution: Sagas

A saga is a sequence of local transactions where each transaction updates a single service. If one transaction fails, the saga executes compensating transactions to undo previous changes.

```
Order Fulfillment Saga:
1. Reserve Inventory → [Compensate: Release Inventory]
2. Charge Payment     → [Compensate: Refund Payment]
3. Create Shipment    → [Compensate: Cancel Shipment]
4. Send Notification  → [No compensation needed]
```

## Part 1: Define Saga Steps

### Step Interface

```typescript
// saga-framework/src/types.ts
export interface SagaStep {
  name: string;
  execute: (context: SagaContext) => Promise<void>;
  compensate: (context: SagaContext) => Promise<void>;
}

export interface SagaContext {
  sagaId: string;
  orderId: string;
  data: Record<string, any>;
  completedSteps: string[];
}
```

### Define Fulfillment Saga

```typescript
// order-service/src/sagas/OrderFulfillmentSaga.ts
import { Saga, SagaStep } from '@banyanai/platform-saga-framework';
import { InventoryClient } from '../clients/InventoryClient.js';
import { PaymentClient } from '../clients/PaymentClient.js';
import { ShippingClient } from '../clients/ShippingClient.js';
import { NotificationClient } from '../clients/NotificationClient.js';

export class OrderFulfillmentSaga extends Saga {
  constructor(
    private inventoryClient: InventoryClient,
    private paymentClient: PaymentClient,
    private shippingClient: ShippingClient,
    private notificationClient: NotificationClient
  ) {
    super();
    this.defineSteps();
  }

  private defineSteps() {
    // Step 1: Reserve Inventory
    this.addStep({
      name: 'reserve-inventory',
      execute: async (context) => {
        const { orderId, items } = context.data;
        const result = await this.inventoryClient.reserve({
          orderId,
          items
        });
        context.data.reservationId = result.reservationId;
      },
      compensate: async (context) => {
        const { reservationId } = context.data;
        await this.inventoryClient.release({ reservationId });
      }
    });

    // Step 2: Charge Payment
    this.addStep({
      name: 'charge-payment',
      execute: async (context) => {
        const { orderId, customerId, amount } = context.data;
        const result = await this.paymentClient.charge({
          orderId,
          customerId,
          amount
        });
        context.data.paymentId = result.paymentId;
      },
      compensate: async (context) => {
        const { paymentId } = context.data;
        await this.paymentClient.refund({ paymentId });
      }
    });

    // Step 3: Create Shipment
    this.addStep({
      name: 'create-shipment',
      execute: async (context) => {
        const { orderId, address } = context.data;
        const result = await this.shippingClient.createShipment({
          orderId,
          address
        });
        context.data.shipmentId = result.shipmentId;
      },
      compensate: async (context) => {
        const { shipmentId } = context.data;
        await this.shippingClient.cancelShipment({ shipmentId });
      }
    });

    // Step 4: Send Notification
    this.addStep({
      name: 'send-notification',
      execute: async (context) => {
        const { customerId, orderId } = context.data;
        await this.notificationClient.sendOrderConfirmation({
          customerId,
          orderId
        });
      },
      compensate: async (context) => {
        // No compensation needed for notification
      }
    });
  }
}
```

## Part 2: Saga Orchestrator

### Saga Executor

```typescript
// saga-framework/src/SagaExecutor.ts
export class SagaExecutor {
  async execute(saga: Saga, context: SagaContext): Promise<SagaResult> {
    const steps = saga.getSteps();

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];

      try {
        Logger.info('Executing saga step', {
          sagaId: context.sagaId,
          step: step.name,
          stepNumber: i + 1,
          totalSteps: steps.length
        });

        await step.execute(context);
        context.completedSteps.push(step.name);

        await this.saveSagaState(context);

        Logger.info('Saga step completed', {
          sagaId: context.sagaId,
          step: step.name
        });
      } catch (error) {
        Logger.error('Saga step failed, starting compensation', {
          sagaId: context.sagaId,
          step: step.name,
          error
        });

        await this.compensate(saga, context);

        return {
          success: false,
          failedStep: step.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    return { success: true };
  }

  private async compensate(saga: Saga, context: SagaContext): Promise<void> {
    const steps = saga.getSteps();
    const completedSteps = context.completedSteps;

    // Compensate in reverse order
    for (let i = completedSteps.length - 1; i >= 0; i--) {
      const stepName = completedSteps[i];
      const step = steps.find(s => s.name === stepName);

      if (!step) continue;

      try {
        Logger.info('Compensating saga step', {
          sagaId: context.sagaId,
          step: stepName
        });

        await step.compensate(context);

        Logger.info('Saga step compensated', {
          sagaId: context.sagaId,
          step: stepName
        });
      } catch (error) {
        Logger.error('Compensation failed', {
          sagaId: context.sagaId,
          step: stepName,
          error
        });
        // Continue compensating other steps even if one fails
      }
    }
  }

  private async saveSagaState(context: SagaContext): Promise<void> {
    // Save saga state to database for recovery
    await SagaStateStore.save(context);
  }
}
```

## Part 3: Use Saga in Command Handler

### Order Placement Handler

```typescript
// order-service/src/commands/PlaceOrderHandler.ts
import { CommandHandler, CommandHandlerDecorator } from '@banyanai/platform-base-service';
import { PlaceOrderCommand, PlaceOrderResult } from '@myorg/order-service-contracts';
import { OrderFulfillmentSaga } from '../sagas/OrderFulfillmentSaga.js';
import { SagaExecutor } from '@banyanai/platform-saga-framework';

@CommandHandlerDecorator(PlaceOrderCommand)
export class PlaceOrderHandler extends CommandHandler<PlaceOrderCommand, PlaceOrderResult> {
  private sagaExecutor = new SagaExecutor();

  async handle(command: PlaceOrderCommand): Promise<PlaceOrderResult> {
    // Load order
    const order = await OrderReadModel.findById(command.orderId);
    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    // Create saga context
    const context: SagaContext = {
      sagaId: this.generateId(),
      orderId: command.orderId,
      data: {
        orderId: command.orderId,
        customerId: order.customerId,
        items: order.items,
        amount: order.total,
        address: command.shippingAddress
      },
      completedSteps: []
    };

    // Create and execute saga
    const saga = new OrderFulfillmentSaga(
      new InventoryClient(),
      new PaymentClient(),
      new ShippingClient(),
      new NotificationClient()
    );

    const result = await this.sagaExecutor.execute(saga, context);

    if (result.success) {
      await OrderReadModel.update(command.orderId, { status: 'fulfilled' });
      return { success: true };
    } else {
      await OrderReadModel.update(command.orderId, { status: 'failed' });
      return {
        success: false,
        error: `Order fulfillment failed at step: ${result.failedStep}`
      };
    }
  }
}
```

## Part 4: Saga State Persistence

### Saga State Store

```typescript
// saga-framework/src/SagaStateStore.ts
export class SagaStateStore {
  static async save(context: SagaContext): Promise<void> {
    await db.query(
      `INSERT INTO saga_state (saga_id, order_id, data, completed_steps, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (saga_id)
       DO UPDATE SET data = $3, completed_steps = $4, updated_at = NOW()`,
      [context.sagaId, context.orderId, JSON.stringify(context.data), context.completedSteps]
    );
  }

  static async load(sagaId: string): Promise<SagaContext | null> {
    const result = await db.query(
      'SELECT * FROM saga_state WHERE saga_id = $1',
      [sagaId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      sagaId: row.saga_id,
      orderId: row.order_id,
      data: JSON.parse(row.data),
      completedSteps: row.completed_steps
    };
  }
}
```

## Part 5: Testing Sagas

### Test Successful Execution

```typescript
describe('OrderFulfillmentSaga', () => {
  it('should complete all steps successfully', async () => {
    const context = createTestContext();
    const saga = createTestSaga();

    const result = await sagaExecutor.execute(saga, context);

    expect(result.success).toBe(true);
    expect(context.completedSteps).toHaveLength(4);
    expect(context.data.reservationId).toBeDefined();
    expect(context.data.paymentId).toBeDefined();
    expect(context.data.shipmentId).toBeDefined();
  });

  it('should compensate when payment fails', async () => {
    // Mock payment failure
    paymentClient.charge = jest.fn().mockRejectedValue(new Error('Insufficient funds'));

    const context = createTestContext();
    const saga = createTestSaga();

    const result = await sagaExecutor.execute(saga, context);

    expect(result.success).toBe(false);
    expect(result.failedStep).toBe('charge-payment');

    // Verify inventory was released
    expect(inventoryClient.release).toHaveBeenCalledWith({
      reservationId: context.data.reservationId
    });
  });

  it('should compensate all steps when shipment fails', async () => {
    // Mock shipment failure
    shippingClient.createShipment = jest.fn().mockRejectedValue(new Error('No capacity'));

    const context = createTestContext();
    const saga = createTestSaga();

    const result = await sagaExecutor.execute(saga, context);

    expect(result.success).toBe(false);
    expect(result.failedStep).toBe('create-shipment');

    // Verify compensations in reverse order
    expect(paymentClient.refund).toHaveBeenCalled();
    expect(inventoryClient.release).toHaveBeenCalled();
  });
});
```

## Understanding Saga Patterns

### Choreography vs Orchestration

**Choreography** (Decentralized):
- Services listen to events and react
- No central coordinator
- More resilient but harder to debug

**Orchestration** (Centralized):
- Central orchestrator controls flow
- Easier to understand and debug
- Single point of failure (mitigated by state persistence)

### When to Use Sagas

Use sagas when you need:
- Distributed transactions across services
- Long-running business processes
- Failure recovery with compensation
- Clear audit trail of transaction steps

Don't use sagas when:
- Single service can handle transaction
- Immediate consistency is required
- Compensation is not possible

## Next Steps

- [Custom Read Models](./custom-read-models.md)
- [Performance Optimization](./performance-optimization.md)
- [Event Store Deep Dive](../../02-concepts/event-store.md)

## Additional Resources

- [Saga Pattern](https://microservices.io/patterns/data/saga.html)
- [Distributed Transactions](../../02-concepts/distributed-transactions.md)
- [Compensation Patterns](../../03-guides/compensation-patterns.md)
