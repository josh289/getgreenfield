---
title: "Saga Pattern"
description: "Distributed transaction coordination across microservices using compensating transactions"
category: "concepts"
tags: ["patterns", "saga", "distributed-transactions"]
difficulty: "advanced"
related_concepts:
  - "../architecture/platform-overview.md"
  - "event-sourcing-pattern.md"
  - "domain-event-pattern.md"
prerequisites:
  - "../architecture/platform-overview.md"
  - "../architecture/message-bus-architecture.md"
last_updated: "2025-01-15"
status: "published"
---

# Saga Pattern

> **Core Idea:** Coordinate distributed transactions across microservices using a sequence of local transactions with compensating actions for rollback.

## Overview

The saga pattern enables distributed transactions across multiple microservices by breaking the transaction into a sequence of local transactions, each with a compensating transaction that can undo its effects if the saga fails.

Unlike database ACID transactions, sagas provide eventual consistency through explicit compensation logic.

## The Problem

Distributed transactions across microservices are difficult:

```typescript
// Traditional distributed transaction - doesn't work across services
async function placeOrder(userId, items) {
  const transaction = await db.beginTransaction();
  
  try {
    // Service A: Create order
    const order = await orderService.create(userId, items);
    
    // Service B: Reserve inventory (different database!)
    await inventoryService.reserve(items);  // Can't include in same transaction
    
    // Service C: Charge payment (different database!)
    await paymentService.charge(order.total);  // Can't include in same transaction
    
    await transaction.commit();  // Only commits Service A changes!
  } catch (err) {
    await transaction.rollback();  // Only rolls back Service A!
    // Services B and C changes still committed - data inconsistency!
  }
}
```

**Why This Matters:**
- Can't use database transactions across services
- Partial failures leave inconsistent state
- Manual rollback code error-prone

## The Solution

Saga coordinates multiple local transactions with explicit compensation:

### Core Principles

1. **Local Transactions**: Each service has its own transaction
2. **Compensating Transactions**: Each step has undo operation
3. **Coordination**: Saga orchestrates sequence
4. **Eventual Consistency**: System eventually consistent, not immediately
5. **Explicit Rollback**: Saga executes compensations on failure

### How It Works

```
Happy Path (Success):
┌─────────────────────────────────────────────────────────┐
│ Step 1: CreateOrder                                     │
│         → OrderCreated (can compensate: CancelOrder)    │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│ Step 2: ReserveInventory                                │
│         → InventoryReserved (can compensate: Release)   │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────┐
│ Step 3: ChargePayment                                   │
│         → PaymentCharged (can compensate: Refund)       │
└────────────────────────┬────────────────────────────────┘
                         │
                         ▼
                  Saga Complete!

Failure Path (Step 3 fails):
┌─────────────────────────────────────────────────────────┐
│ Step 1: CreateOrder → OrderCreated                      │
│ Step 2: ReserveInventory → InventoryReserved            │
│ Step 3: ChargePayment → FAILS                           │
└────────────────────────┬────────────────────────────────┘
                         │
                         │ Execute Compensations (reverse order)
                         ▼
┌─────────────────────────────────────────────────────────┐
│ Compensate Step 2: ReleaseInventory                     │
│ Compensate Step 1: CancelOrder                          │
└─────────────────────────────────────────────────────────┘
                  Saga Rolled Back!
```

## Implementation in the Platform

```typescript
// sagas/PlaceOrderSaga.ts
import { Saga, SagaStep } from '@banyanai/platform-saga-framework';

@Saga('PlaceOrder')
export class PlaceOrderSaga {
  @SagaStep({
    compensation: 'cancelOrder'
  })
  async createOrder(context: SagaContext) {
    const result = await this.messageBus.send(
      CreateOrderContract,
      {
        userId: context.data.userId,
        items: context.data.items
      }
    );
    
    // Store for later steps and compensation
    context.data.orderId = result.orderId;
    return result;
  }

  async cancelOrder(context: SagaContext) {
    // Compensating transaction
    await this.messageBus.send(
      CancelOrderContract,
      { orderId: context.data.orderId }
    );
  }

  @SagaStep({
    compensation: 'releaseInventory'
  })
  async reserveInventory(context: SagaContext) {
    const result = await this.messageBus.send(
      ReserveInventoryContract,
      { items: context.data.items }
    );
    
    context.data.reservationId = result.reservationId;
    return result;
  }

  async releaseInventory(context: SagaContext) {
    await this.messageBus.send(
      ReleaseInventoryContract,
      { reservationId: context.data.reservationId }
    );
  }

  @SagaStep({
    compensation: 'refundPayment'
  })
  async chargePayment(context: SagaContext) {
    const result = await this.messageBus.send(
      ChargePaymentContract,
      {
        userId: context.data.userId,
        amount: context.data.total
      }
    );
    
    context.data.paymentId = result.paymentId;
    return result;
  }

  async refundPayment(context: SagaContext) {
    await this.messageBus.send(
      RefundPaymentContract,
      { paymentId: context.data.paymentId }
    );
  }
}

// Using the saga
@CommandHandler(PlaceOrderCommand)
export class PlaceOrderHandler {
  constructor(private sagaOrchestrator: SagaOrchestrator) {}

  async handle(command: PlaceOrderCommand) {
    const saga = await this.sagaOrchestrator.startSaga(
      PlaceOrderSaga,
      {
        userId: command.userId,
        items: command.items,
        total: command.total
      }
    );
    
    // Returns when saga completes or compensates
    return { sagaId: saga.id, orderId: saga.data.orderId };
  }
}
```

**Key Points:**
- Each step has compensation
- Compensations executed in reverse order
- Saga state persisted (survives crashes)
- Automatic retry on failures

## Benefits and Trade-offs

### Benefits

- **Distributed Transactions**: Coordinate across services
- **Automatic Rollback**: Compensations executed automatically
- **Resilient**: Saga state persisted, survives crashes
- **Explicit**: Compensation logic explicit and testable
- **Audit Trail**: Complete saga history recorded

### Trade-offs

- **Complexity**: More complex than local transactions
- **Eventual Consistency**: Not immediately consistent
- **Compensating Logic**: Must design compensations carefully
- **Resource Locking**: Resources locked during saga

### When to Use Sagas

Use when:
- Distributed transaction across services required
- Can tolerate eventual consistency
- Have clear compensation logic

Avoid when:
- Single service (use database transaction)
- Need immediate consistency
- Compensation logic unclear or impossible

## Real-World Examples

### Example: E-commerce Order Processing

```typescript
// Saga with 4 steps
@Saga('CompleteOrder')
export class CompleteOrderSaga {
  @SagaStep({ compensation: 'cancelOrder' })
  async createOrder(ctx) { /* ... */ }
  
  @SagaStep({ compensation: 'releaseInventory' })
  async reserveInventory(ctx) { /* ... */ }
  
  @SagaStep({ compensation: 'refundPayment' })
  async chargePayment(ctx) { /* ... */ }
  
  @SagaStep({ compensation: 'cancelShipment' })
  async createShipment(ctx) { /* ... */ }
}

// If step 4 fails:
// 1. cancelShipment (not needed - never created)
// 2. refundPayment (compensate step 3)
// 3. releaseInventory (compensate step 2)
// 4. cancelOrder (compensate step 1)
```

## Related Concepts

- [Platform Overview](../architecture/platform-overview.md)
- [Message Bus Architecture](../architecture/message-bus-architecture.md)
- [Event Sourcing Pattern](event-sourcing-pattern.md)

## Best Practices

1. **Design Idempotent Operations**
   - Steps and compensations must be idempotent
   - Handle duplicate executions gracefully

2. **Keep Sagas Short**
   - Fewer steps = simpler compensation
   - Target 3-5 steps maximum

3. **Test Compensation Logic**
   - Test each compensation independently
   - Test failure at each step

4. **Monitor Saga Duration**
   - Set timeouts for saga completion
   - Alert on long-running sagas

## Further Reading

### Internal Resources
- [Saga Framework Reference](../../04-reference/platform-packages/saga-framework.md)
- [Implementing Sagas Guide](../../03-guides/sagas/implementing-sagas.md)

### External Resources
- [Saga Pattern - Chris Richardson](https://microservices.io/patterns/data/saga.html)
- [Distributed Sagas - Caitie McCaffrey](https://www.youtube.com/watch?v=0UTOLRTwOX0)

## Glossary

**Saga**: Sequence of local transactions with compensations.

**Compensating Transaction**: Operation that undoes effects of previous transaction.

**Saga Orchestrator**: Coordinates saga execution and compensation.

**Eventual Consistency**: System becomes consistent over time, not immediately.
