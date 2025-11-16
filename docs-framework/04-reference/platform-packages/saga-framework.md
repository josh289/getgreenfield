---
title: "Saga Framework Reference"
description: "Distributed transaction management using the Saga pattern for coordinating multi-service operations"
category: "reference"
tags: ["sagas", "distributed-transactions", "orchestration", "patterns"]
api_version: "1.0.0"
package: "@banyanai/platform-saga-framework"
last_updated: "2025-11-15"
status: "draft"
---

# Saga Framework Reference

> **Package:** `@banyanai/platform-saga-framework` | **Status:** Planned (Not Yet Implemented)

## Overview

The Saga Framework package provides distributed transaction management for coordinating complex multi-service operations that require eventual consistency. It implements the Saga pattern to manage long-running transactions across multiple services without requiring distributed locks or two-phase commit protocols.

**IMPORTANT: This package is currently a placeholder and not yet implemented.** This documentation describes the planned architecture and API design based on platform requirements and the Saga pattern.

### What is the Saga Pattern?

The Saga pattern breaks distributed transactions into a series of local transactions, each updating data within a single service. If any local transaction fails, the saga executes compensating transactions to undo the changes made by previous steps.

### When to Use Sagas

Use sagas for multi-service operations that need:

- **Eventual Consistency**: All services eventually reach consistent state
- **Long-Running Processes**: Transactions spanning seconds or minutes
- **Compensation Logic**: Ability to undo/compensate for partial failures
- **Cross-Service Coordination**: Multiple services participating in a single business transaction

### When NOT to Use Sagas

Avoid sagas when:

- **Simple Commands**: Single service operations don't need saga complexity
- **Immediate Consistency**: ACID guarantees required (use event sourcing instead)
- **Read Operations**: Queries don't need transaction management
- **Background Jobs**: Fire-and-forget operations

## Installation

```bash
npm install @banyanai/platform-saga-framework
```

## Planned Architecture

### Core Concepts

The saga framework is planned to include these key components:

1. **Saga Definition**: Declarative definition of saga steps and compensation logic
2. **Saga Orchestrator**: Coordinates saga execution across services
3. **Saga State Management**: Persists saga state for recovery and monitoring
4. **Compensation Logic**: Automatic rollback on failures
5. **Saga Participants**: Services implementing saga steps

### Orchestration vs Choreography

The framework will support **orchestration-based sagas** where a central coordinator manages the saga flow:

```
┌──────────────────────────────────────────────┐
│         Saga Orchestrator                    │
│  - Maintains saga state                      │
│  - Issues commands to services               │
│  - Handles compensation on failure           │
└────────────┬──────────────┬──────────────────┘
             │              │
    ┌────────┘              └─────────┐
    ▼                                 ▼
┌─────────────┐                  ┌─────────────┐
│  Service A  │                  │  Service B  │
│  - Execute  │                  │  - Execute  │
│  - Compensate│                  │  - Compensate│
└─────────────┘                  └─────────────┘
```

**Why Orchestration?**
- Centralized control flow easier to understand and debug
- Explicit saga state makes monitoring straightforward
- Platform's message bus already provides reliable messaging

## Planned API Design

### Defining a Saga

```typescript
import { Saga, SagaStep } from '@banyanai/platform-saga-framework';

/**
 * Example: Order Creation Saga
 *
 * Steps:
 * 1. Reserve inventory
 * 2. Process payment
 * 3. Create order
 *
 * If any step fails, compensate previous steps.
 */
@Saga({
  name: 'CreateOrderSaga',
  version: '1.0.0'
})
export class CreateOrderSaga {
  /**
   * Step 1: Reserve inventory
   * Compensation: Release reserved inventory
   */
  @SagaStep({
    order: 1,
    command: 'inventory.reserve',
    compensation: 'inventory.release'
  })
  async reserveInventory(
    context: SagaContext<OrderData>
  ): Promise<InventoryReservation> {
    return await this.messageBus.send('inventory.reserve', {
      productId: context.data.productId,
      quantity: context.data.quantity
    });
  }

  /**
   * Step 2: Process payment
   * Compensation: Refund payment
   */
  @SagaStep({
    order: 2,
    command: 'payment.process',
    compensation: 'payment.refund'
  })
  async processPayment(
    context: SagaContext<OrderData>
  ): Promise<PaymentResult> {
    return await this.messageBus.send('payment.process', {
      userId: context.data.userId,
      amount: context.data.totalAmount,
      paymentMethodId: context.data.paymentMethodId
    });
  }

  /**
   * Step 3: Create order
   * Compensation: Cancel order
   */
  @SagaStep({
    order: 3,
    command: 'order.create',
    compensation: 'order.cancel'
  })
  async createOrder(
    context: SagaContext<OrderData>
  ): Promise<OrderCreated> {
    return await this.messageBus.send('order.create', {
      userId: context.data.userId,
      items: context.data.items,
      paymentId: context.stepResults.processPayment.paymentId,
      reservationId: context.stepResults.reserveInventory.reservationId
    });
  }
}
```

### Saga Context

```typescript
/**
 * Context passed to each saga step containing:
 * - Initial saga data
 * - Results from previous steps
 * - Current saga state
 * - Correlation ID for tracing
 */
interface SagaContext<T = unknown> {
  /** Unique identifier for this saga execution */
  readonly sagaId: string;

  /** Correlation ID for distributed tracing */
  readonly correlationId: string;

  /** Initial data passed to the saga */
  readonly data: T;

  /** Results from previous saga steps */
  readonly stepResults: Record<string, unknown>;

  /** Current saga execution state */
  readonly state: SagaState;

  /** When this saga started */
  readonly startedAt: Date;

  /** Optional user context */
  readonly auth?: AuthContext;
}
```

### Saga State

```typescript
/**
 * Saga execution state machine
 */
enum SagaState {
  /** Saga is executing forward steps */
  RUNNING = 'RUNNING',

  /** Saga completed successfully */
  COMPLETED = 'COMPLETED',

  /** Saga is executing compensation steps */
  COMPENSATING = 'COMPENSATING',

  /** Saga failed and compensation completed */
  COMPENSATED = 'COMPENSATED',

  /** Saga or compensation failed - manual intervention required */
  FAILED = 'FAILED',

  /** Saga suspended waiting for external event */
  SUSPENDED = 'SUSPENDED'
}
```

### Starting a Saga

```typescript
import { SagaOrchestrator } from '@banyanai/platform-saga-framework';

@CommandHandler('CreateOrder')
export class CreateOrderHandler {
  constructor(
    private readonly sagaOrchestrator: SagaOrchestrator
  ) {}

  async handle(input: CreateOrderInput): Promise<CreateOrderOutput> {
    // Start the saga
    const sagaExecution = await this.sagaOrchestrator.start(
      CreateOrderSaga,
      {
        userId: input.userId,
        productId: input.productId,
        quantity: input.quantity,
        totalAmount: input.totalAmount,
        paymentMethodId: input.paymentMethodId,
        items: input.items
      }
    );

    // Saga runs asynchronously - return saga ID for tracking
    return {
      orderId: sagaExecution.sagaId,
      status: 'pending'
    };
  }
}
```

### Monitoring Saga Execution

```typescript
import { SagaMonitor } from '@banyanai/platform-saga-framework';

@QueryHandler('GetSagaStatus')
export class GetSagaStatusHandler {
  constructor(
    private readonly sagaMonitor: SagaMonitor
  ) {}

  async handle(input: { sagaId: string }): Promise<SagaExecutionStatus> {
    const status = await this.sagaMonitor.getStatus(input.sagaId);

    return {
      sagaId: status.sagaId,
      state: status.state,
      currentStep: status.currentStep,
      completedSteps: status.completedSteps,
      failedStep: status.failedStep,
      error: status.error,
      startedAt: status.startedAt,
      completedAt: status.completedAt
    };
  }
}
```

## Planned Interfaces

### Saga Decorator Options

```typescript
interface SagaOptions {
  /** Unique name for this saga type */
  name: string;

  /** Saga version for evolution/migration */
  version: string;

  /** Maximum time saga can run before timeout (ms) */
  timeout?: number;

  /** Whether to persist saga state for recovery */
  persistent?: boolean;

  /** Retry policy for failed steps */
  retryPolicy?: RetryPolicy;
}
```

### SagaStep Decorator Options

```typescript
interface SagaStepOptions {
  /** Execution order (1, 2, 3, ...) */
  order: number;

  /** Command to send for this step */
  command: string;

  /** Compensation command if this step needs rollback */
  compensation?: string;

  /** Whether this step can be retried on failure */
  retryable?: boolean;

  /** Maximum retry attempts for this step */
  maxRetries?: number;

  /** Timeout for this specific step (ms) */
  timeout?: number;

  /** Whether to wait for this step or execute async */
  async?: boolean;
}
```

### Saga Execution Status

```typescript
interface SagaExecutionStatus {
  /** Unique saga execution ID */
  readonly sagaId: string;

  /** Type of saga (name from @Saga decorator) */
  readonly sagaType: string;

  /** Current execution state */
  readonly state: SagaState;

  /** Index of currently executing step */
  readonly currentStep: number;

  /** Steps that completed successfully */
  readonly completedSteps: string[];

  /** Step that failed (if any) */
  readonly failedStep?: string;

  /** Error details from failed step */
  readonly error?: {
    message: string;
    code: string;
    details?: unknown;
  };

  /** When saga started */
  readonly startedAt: Date;

  /** When saga completed/failed */
  readonly completedAt?: Date;

  /** Correlation ID for tracing */
  readonly correlationId: string;
}
```

## Compensation Logic

### Automatic Compensation

When a saga step fails, the framework automatically executes compensation steps in reverse order:

```typescript
// Saga execution flow with failure:

// Step 1: Reserve Inventory ✓ Success
// Step 2: Process Payment ✓ Success
// Step 3: Create Order ✗ FAILED

// Automatic compensation (reverse order):
// Compensate Step 2: Refund Payment ✓
// Compensate Step 1: Release Inventory ✓

// Final State: COMPENSATED
```

### Manual Compensation

For complex compensation logic:

```typescript
@SagaStep({
  order: 2,
  command: 'payment.process',
  compensation: 'custom-compensation' // Marks as custom
})
async processPayment(context: SagaContext<OrderData>): Promise<PaymentResult> {
  const result = await this.messageBus.send('payment.process', {
    amount: context.data.totalAmount
  });
  return result;
}

/**
 * Custom compensation logic
 * Invoked automatically by framework on failure
 */
async compensateProcessPayment(
  context: SagaContext<OrderData>,
  stepResult: PaymentResult
): Promise<void> {
  // Custom compensation logic
  if (stepResult.requiresManualRefund) {
    await this.messageBus.send('payment.initiateManualRefund', {
      paymentId: stepResult.paymentId,
      reason: 'saga-compensation'
    });
  } else {
    await this.messageBus.send('payment.refund', {
      paymentId: stepResult.paymentId
    });
  }
}
```

## State Persistence

Saga state will be persisted to PostgreSQL for durability and recovery:

```typescript
/**
 * Saga state persistence schema (planned)
 */
interface SagaStateRecord {
  saga_id: string;
  saga_type: string;
  saga_version: string;
  state: SagaState;
  current_step: number;
  step_results: Record<string, unknown>;
  error: object | null;
  correlation_id: string;
  started_at: Date;
  updated_at: Date;
  completed_at: Date | null;
  auth_context: object | null;
}
```

### Recovery After Failure

```typescript
/**
 * Saga recovery after service restart
 */
export class SagaRecoveryService {
  async recoverInProgressSagas(): Promise<void> {
    // Find sagas that were running when service stopped
    const inProgressSagas = await this.sagaRepository.findByState([
      SagaState.RUNNING,
      SagaState.COMPENSATING
    ]);

    for (const saga of inProgressSagas) {
      // Resume or compensate based on state
      if (saga.state === SagaState.RUNNING) {
        await this.orchestrator.resume(saga);
      } else if (saga.state === SagaState.COMPENSATING) {
        await this.orchestrator.resumeCompensation(saga);
      }
    }
  }
}
```

## Error Handling

### Retry Policies

```typescript
interface RetryPolicy {
  /** Maximum retry attempts */
  maxAttempts: number;

  /** Initial delay between retries (ms) */
  initialDelay: number;

  /** Maximum delay between retries (ms) */
  maxDelay: number;

  /** Backoff multiplier (exponential backoff) */
  backoffMultiplier: number;

  /** Errors that should trigger retry */
  retryableErrors?: string[];
}

// Default retry policy
const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  retryableErrors: ['NETWORK_ERROR', 'TIMEOUT', 'SERVICE_UNAVAILABLE']
};
```

### Non-Retryable Failures

Some failures should not retry:

```typescript
@SagaStep({
  order: 2,
  command: 'payment.process',
  retryable: false // Don't retry payment failures
})
async processPayment(context: SagaContext<OrderData>): Promise<PaymentResult> {
  // Business validation failures should not retry
  // Invalid card, insufficient funds, etc.
  return await this.messageBus.send('payment.process', {
    amount: context.data.totalAmount
  });
}
```

## Integration with Event Sourcing

Sagas integrate with the platform's event sourcing:

```typescript
/**
 * Saga completion emits domain event
 */
@Saga({ name: 'CreateOrderSaga', version: '1.0.0' })
export class CreateOrderSaga {
  async onSagaComplete(context: SagaContext<OrderData>): Promise<void> {
    // Emit domain event when saga completes
    await this.eventStore.append('Order', context.stepResults.createOrder.orderId, [
      {
        type: 'OrderCreated',
        data: {
          orderId: context.stepResults.createOrder.orderId,
          userId: context.data.userId,
          items: context.data.items,
          totalAmount: context.data.totalAmount,
          sagaId: context.sagaId
        },
        metadata: {
          correlationId: context.correlationId,
          causedBySaga: context.sagaId
        }
      }
    ]);
  }

  async onSagaFailed(context: SagaContext<OrderData>, error: Error): Promise<void> {
    // Emit failure event
    await this.eventStore.append('Order', context.sagaId, [
      {
        type: 'OrderCreationFailed',
        data: {
          userId: context.data.userId,
          reason: error.message,
          sagaId: context.sagaId
        },
        metadata: {
          correlationId: context.correlationId
        }
      }
    ]);
  }
}
```

## Testing Sagas

### Unit Testing Saga Steps

```typescript
describe('CreateOrderSaga', () => {
  let saga: CreateOrderSaga;
  let messageBus: MockMessageBus;

  beforeEach(() => {
    messageBus = new MockMessageBus();
    saga = new CreateOrderSaga(messageBus);
  });

  it('should reserve inventory successfully', async () => {
    const context: SagaContext<OrderData> = {
      sagaId: 'saga-123',
      correlationId: 'corr-123',
      data: {
        productId: 'prod-1',
        quantity: 2
      },
      stepResults: {},
      state: SagaState.RUNNING,
      startedAt: new Date()
    };

    messageBus.mockResponse('inventory.reserve', {
      reservationId: 'res-123',
      productId: 'prod-1',
      quantity: 2
    });

    const result = await saga.reserveInventory(context);

    expect(result.reservationId).toBe('res-123');
    expect(messageBus.sentMessages).toContainEqual({
      command: 'inventory.reserve',
      payload: { productId: 'prod-1', quantity: 2 }
    });
  });
});
```

### Integration Testing Complete Saga

```typescript
describe('CreateOrderSaga Integration', () => {
  it('should complete full saga successfully', async () => {
    const orchestrator = new SagaOrchestrator(messageBus, sagaRepository);

    const execution = await orchestrator.start(CreateOrderSaga, {
      userId: 'user-1',
      productId: 'prod-1',
      quantity: 2,
      totalAmount: 99.99,
      paymentMethodId: 'pm-1',
      items: [{ productId: 'prod-1', quantity: 2, price: 49.99 }]
    });

    // Wait for saga completion
    await waitForSagaCompletion(execution.sagaId);

    const status = await orchestrator.getStatus(execution.sagaId);
    expect(status.state).toBe(SagaState.COMPLETED);
    expect(status.completedSteps).toHaveLength(3);
  });

  it('should compensate on payment failure', async () => {
    const orchestrator = new SagaOrchestrator(messageBus, sagaRepository);

    // Mock payment failure
    messageBus.mockError('payment.process', new Error('Insufficient funds'));

    const execution = await orchestrator.start(CreateOrderSaga, {
      userId: 'user-1',
      productId: 'prod-1',
      quantity: 2,
      totalAmount: 99.99,
      paymentMethodId: 'pm-1',
      items: [{ productId: 'prod-1', quantity: 2, price: 49.99 }]
    });

    await waitForSagaCompletion(execution.sagaId);

    const status = await orchestrator.getStatus(execution.sagaId);
    expect(status.state).toBe(SagaState.COMPENSATED);
    expect(status.failedStep).toBe('processPayment');

    // Verify compensation executed
    expect(messageBus.sentMessages).toContainEqual({
      command: 'inventory.release',
      payload: expect.objectContaining({ reservationId: expect.any(String) })
    });
  });
});
```

## Real-World Example: Order Processing Saga

### Complete Implementation

```typescript
import {
  Saga,
  SagaStep,
  SagaContext,
  SagaOrchestrator
} from '@banyanai/platform-saga-framework';

/**
 * Order Processing Saga
 *
 * Coordinates:
 * 1. Inventory reservation
 * 2. Payment processing
 * 3. Shipping calculation
 * 4. Order creation
 * 5. Notification sending
 */
@Saga({
  name: 'ProcessOrderSaga',
  version: '1.0.0',
  timeout: 60000, // 1 minute max
  persistent: true
})
export class ProcessOrderSaga {
  constructor(
    private readonly messageBus: MessageBusClient,
    private readonly logger: Logger
  ) {}

  @SagaStep({
    order: 1,
    command: 'inventory.reserve',
    compensation: 'inventory.release',
    retryable: true,
    maxRetries: 3
  })
  async reserveInventory(context: SagaContext<OrderData>): Promise<ReservationResult> {
    this.logger.info('Reserving inventory', {
      sagaId: context.sagaId,
      products: context.data.items
    });

    return await this.messageBus.send('inventory.reserve', {
      items: context.data.items,
      orderId: context.sagaId
    });
  }

  @SagaStep({
    order: 2,
    command: 'payment.process',
    compensation: 'payment.refund',
    retryable: false // Payment failures should not retry
  })
  async processPayment(context: SagaContext<OrderData>): Promise<PaymentResult> {
    this.logger.info('Processing payment', {
      sagaId: context.sagaId,
      amount: context.data.totalAmount
    });

    return await this.messageBus.send('payment.process', {
      userId: context.data.userId,
      amount: context.data.totalAmount,
      paymentMethodId: context.data.paymentMethodId,
      orderId: context.sagaId
    });
  }

  @SagaStep({
    order: 3,
    command: 'shipping.calculate',
    retryable: true
  })
  async calculateShipping(context: SagaContext<OrderData>): Promise<ShippingResult> {
    this.logger.info('Calculating shipping', {
      sagaId: context.sagaId,
      address: context.data.shippingAddress
    });

    return await this.messageBus.send('shipping.calculate', {
      items: context.data.items,
      destination: context.data.shippingAddress,
      orderId: context.sagaId
    });
  }

  @SagaStep({
    order: 4,
    command: 'order.create',
    compensation: 'order.cancel'
  })
  async createOrder(context: SagaContext<OrderData>): Promise<OrderResult> {
    this.logger.info('Creating order', {
      sagaId: context.sagaId
    });

    const reservation = context.stepResults.reserveInventory as ReservationResult;
    const payment = context.stepResults.processPayment as PaymentResult;
    const shipping = context.stepResults.calculateShipping as ShippingResult;

    return await this.messageBus.send('order.create', {
      userId: context.data.userId,
      items: context.data.items,
      reservationId: reservation.reservationId,
      paymentId: payment.paymentId,
      shippingCost: shipping.cost,
      shippingMethod: shipping.method,
      totalAmount: context.data.totalAmount + shipping.cost,
      orderId: context.sagaId
    });
  }

  @SagaStep({
    order: 5,
    command: 'notification.send',
    async: true, // Fire and forget - don't wait for completion
    retryable: true
  })
  async sendNotification(context: SagaContext<OrderData>): Promise<void> {
    this.logger.info('Sending order confirmation', {
      sagaId: context.sagaId
    });

    const order = context.stepResults.createOrder as OrderResult;

    await this.messageBus.send('notification.send', {
      userId: context.data.userId,
      type: 'order-confirmation',
      orderId: order.orderId,
      email: context.data.email
    });
  }

  /**
   * Called when saga completes successfully
   */
  async onComplete(context: SagaContext<OrderData>): Promise<void> {
    this.logger.info('Order processing saga completed', {
      sagaId: context.sagaId,
      orderId: (context.stepResults.createOrder as OrderResult).orderId
    });
  }

  /**
   * Called when saga fails after compensation
   */
  async onFailed(context: SagaContext<OrderData>, error: Error): Promise<void> {
    this.logger.error('Order processing saga failed', {
      sagaId: context.sagaId,
      error: error.message,
      failedStep: context.stepResults
    });

    // Emit failure event for business tracking
    await this.messageBus.publish('order.processing.failed', {
      sagaId: context.sagaId,
      userId: context.data.userId,
      reason: error.message
    });
  }
}
```

## Migration Path

### Current State: No Saga Framework

Currently, complex multi-service operations use manual coordination:

```typescript
// Current approach (without saga framework)
@CommandHandler('CreateOrder')
export class CreateOrderHandler {
  async handle(input: CreateOrderInput) {
    let reservationId: string | undefined;
    let paymentId: string | undefined;

    try {
      // Step 1: Reserve inventory
      const reservation = await this.messageBus.send('inventory.reserve', {
        items: input.items
      });
      reservationId = reservation.reservationId;

      // Step 2: Process payment
      const payment = await this.messageBus.send('payment.process', {
        amount: input.totalAmount
      });
      paymentId = payment.paymentId;

      // Step 3: Create order
      const order = await this.messageBus.send('order.create', {
        reservationId,
        paymentId
      });

      return { orderId: order.orderId };
    } catch (error) {
      // Manual compensation
      if (paymentId) {
        await this.messageBus.send('payment.refund', { paymentId });
      }
      if (reservationId) {
        await this.messageBus.send('inventory.release', { reservationId });
      }
      throw error;
    }
  }
}
```

**Problems:**
- Manual compensation logic scattered across handlers
- No automatic retry on transient failures
- No saga state persistence for recovery
- Difficult to monitor and debug
- Easy to forget compensation steps

### Future State: With Saga Framework

```typescript
// Future approach (with saga framework)
@CommandHandler('CreateOrder')
export class CreateOrderHandler {
  constructor(
    private readonly sagaOrchestrator: SagaOrchestrator
  ) {}

  async handle(input: CreateOrderInput) {
    // Start saga - all coordination handled automatically
    const execution = await this.sagaOrchestrator.start(
      CreateOrderSaga,
      input
    );

    return { orderId: execution.sagaId };
  }
}
```

**Benefits:**
- Declarative saga definition
- Automatic compensation on failures
- Built-in retry policies
- State persistence for recovery
- Monitoring and observability
- Reduced boilerplate code

## Current Workarounds

Until the saga framework is implemented, use these patterns:

### Pattern 1: Try-Catch Compensation

```typescript
@CommandHandler('ComplexOperation')
export class ComplexOperationHandler {
  async handle(input: Input) {
    const compensations: Array<() => Promise<void>> = [];

    try {
      // Step 1
      const result1 = await this.step1(input);
      compensations.push(() => this.compensateStep1(result1));

      // Step 2
      const result2 = await this.step2(result1);
      compensations.push(() => this.compensateStep2(result2));

      // Step 3
      const result3 = await this.step3(result2);

      return result3;
    } catch (error) {
      // Execute compensations in reverse order
      for (const compensate of compensations.reverse()) {
        try {
          await compensate();
        } catch (compensationError) {
          // Log but don't throw - best effort compensation
          logger.error('Compensation failed', compensationError);
        }
      }
      throw error;
    }
  }
}
```

### Pattern 2: Event-Driven Compensation

```typescript
// Use domain events for compensation
@EventHandler('PaymentFailed')
export class PaymentFailedHandler {
  async handle(event: PaymentFailedEvent) {
    // Automatically release inventory on payment failure
    if (event.reservationId) {
      await this.messageBus.send('inventory.release', {
        reservationId: event.reservationId
      });
    }
  }
}
```

## Implementation Roadmap

The saga framework implementation is planned in these phases:

### Phase 1: Core Orchestration (Q1 2026)
- Saga decorator and step decorator
- Basic orchestrator with sequential execution
- In-memory state management
- Simple compensation logic

### Phase 2: Persistence & Recovery (Q2 2026)
- PostgreSQL state persistence
- Saga recovery after service restart
- Retry policies and backoff strategies
- Monitoring and observability

### Phase 3: Advanced Features (Q3 2026)
- Parallel step execution
- Conditional branching
- External event integration
- Performance optimizations

### Phase 4: Production Hardening (Q4 2026)
- Comprehensive testing
- Production monitoring dashboards
- Migration tools from manual coordination
- Documentation and examples

## See Also

### Related Concepts
- [Event Sourcing](../../02-concepts/patterns/event-sourcing.md)
- [CQRS Pattern](../../02-concepts/patterns/cqrs.md)
- [Distributed Transactions](../../02-concepts/patterns/distributed-transactions.md)

### Related Packages
- [@banyanai/platform-event-sourcing](./event-sourcing.md)
- [@banyanai/platform-message-bus-client](./message-bus-client.md)
- [@banyanai/platform-base-service](./base-service.md)

### External Resources
- [Saga Pattern (Microsoft)](https://docs.microsoft.com/en-us/azure/architecture/reference-architectures/saga/saga)
- [Orchestration vs Choreography](https://microservices.io/patterns/data/saga.html)
- [Compensating Transactions](https://docs.microsoft.com/en-us/azure/architecture/patterns/compensating-transaction)

## Glossary

**Saga**: A sequence of local transactions coordinated to maintain data consistency across distributed services.

**Saga Step**: Individual operation within a saga that executes a local transaction on a single service.

**Compensation**: Inverse operation that undoes the effects of a saga step (e.g., refund undoes payment).

**Orchestration**: Centralized coordination where a saga orchestrator controls the flow.

**Choreography**: Decentralized coordination where services react to events without central control.

**Saga State**: Persistent record of saga execution progress, allowing recovery after failures.

**Forward Recovery**: Continuing saga execution after transient failures using retries.

**Backward Recovery**: Executing compensation steps to undo completed saga steps after failure.
