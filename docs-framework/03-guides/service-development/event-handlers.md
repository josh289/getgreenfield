# Writing Event Handlers

## Use this guide if...

- You need to react to events from other services
- You're building cross-service workflows
- You want to implement async notification patterns
- You need to keep services loosely coupled

## Quick Example

```typescript
// src/events/UserCreatedHandler.ts
import { EventHandler, EventHandlerDecorator } from '@banyanai/platform-base-service';
import { Logger } from '@banyanai/platform-telemetry';
import { UserCreatedEvent } from '../contracts/events/UserCreatedEvent.js';

@EventHandlerDecorator(UserCreatedEvent)
export class SendWelcomeEmailHandler extends EventHandler<UserCreatedEvent, void> {
  private readonly logger = Logger;

  constructor(
    private emailClient: EmailServiceClient  // Auto-injected by BaseService
  ) {
    super();
  }

  async handle(event: UserCreatedEvent): Promise<void> {
    try {
      this.logger.info('Sending welcome email for new user', {
        userId: event.userId,
        email: event.email
      });

      // Call email service
      await this.emailClient.sendEmail({
        to: event.email,
        template: 'welcome',
        data: {
          userId: event.userId,
          email: event.email
        }
      });

      this.logger.info('Welcome email sent successfully', {
        userId: event.userId
      });
    } catch (error) {
      this.logger.error('Failed to send welcome email:', error as Error, {
        userId: event.userId
      });
      // Event handlers should not throw - log and continue
    }
  }
}
```

## Step-by-Step Guide

### Step 1: Define the Event Contract

Events represent things that have already happened.

```typescript
// src/contracts/events/UserCreatedEvent.ts
import { DomainEvent } from '@banyanai/platform-event-sourcing';

export interface UserCreatedEvent extends DomainEvent {
  eventType: 'UserCreated';
  aggregateType: 'User';
  aggregateId: string;  // userId
  eventData: {
    userId: string;
    email: string;
    createdAt: Date;
    initialRoles: string[];
  };
}
```

**Key points:**
- Events are past tense ("UserCreated", not "CreateUser")
- Events are immutable facts
- Events contain all necessary data
- Events extend DomainEvent interface

### Step 2: Implement the Event Handler

```typescript
// src/events/UserCreatedHandler.ts
import { EventHandler, EventHandlerDecorator } from '@banyanai/platform-base-service';
import { Logger } from '@banyanai/platform-telemetry';

@EventHandlerDecorator(UserCreatedEvent)
export class SendWelcomeEmailHandler extends EventHandler<UserCreatedEvent, void> {
  private readonly logger = Logger;

  constructor(
    private emailClient: EmailServiceClient
  ) {
    super();
  }

  async handle(event: UserCreatedEvent): Promise<void> {
    try {
      this.logger.info('Processing UserCreated event', {
        userId: event.aggregateId,
        eventId: event.eventId
      });

      // React to the event
      await this.emailClient.sendEmail({
        to: event.eventData.email,
        template: 'welcome',
        data: {
          userId: event.eventData.userId
        }
      });

      this.logger.info('UserCreated event processed successfully', {
        userId: event.aggregateId
      });
    } catch (error) {
      // Log error but don't throw - events should not fail the original operation
      this.logger.error('Failed to process UserCreated event:', error as Error, {
        userId: event.aggregateId,
        eventId: event.eventId
      });

      // Optional: Publish failure event for dead letter handling
      // this.publishEvent('UserCreatedHandlingFailed', { ... });
    }
  }
}
```

### Step 3: Place in Events Folder

The platform auto-discovers event handlers by folder:

```
src/
└── events/
    ├── SendWelcomeEmailHandler.ts
    ├── CreateUserProfileHandler.ts
    └── NotifyAdminsHandler.ts
```

**No manual registration or subscription code needed!**

## Common Patterns

### Pattern 1: Multiple Handlers for Same Event

Different services can react to the same event independently.

```typescript
// Email Service
@EventHandlerDecorator(UserCreatedEvent)
export class SendWelcomeEmailHandler extends EventHandler<UserCreatedEvent, void> {
  async handle(event: UserCreatedEvent): Promise<void> {
    await this.emailClient.sendEmail({
      to: event.eventData.email,
      template: 'welcome'
    });
  }
}

// Notification Service
@EventHandlerDecorator(UserCreatedEvent)
export class SendPushNotificationHandler extends EventHandler<UserCreatedEvent, void> {
  async handle(event: UserCreatedEvent): Promise<void> {
    await this.pushClient.sendNotification({
      userId: event.eventData.userId,
      message: 'Welcome to the platform!'
    });
  }
}

// Analytics Service
@EventHandlerDecorator(UserCreatedEvent)
export class TrackUserSignupHandler extends EventHandler<UserCreatedEvent, void> {
  async handle(event: UserCreatedEvent): Promise<void> {
    await this.analyticsClient.track({
      event: 'user_signup',
      userId: event.eventData.userId,
      timestamp: event.eventData.createdAt
    });
  }
}
```

### Pattern 2: Event Chaining

One event triggers actions that produce more events.

```typescript
@EventHandlerDecorator(OrderCreatedEvent)
export class ProcessOrderHandler extends EventHandler<OrderCreatedEvent, void> {
  constructor(
    private inventoryClient: InventoryServiceClient,
    private paymentClient: PaymentServiceClient
  ) {
    super();
  }

  async handle(event: OrderCreatedEvent): Promise<void> {
    try {
      // Step 1: Reserve inventory (produces InventoryReservedEvent)
      await this.inventoryClient.reserveItems({
        orderId: event.eventData.orderId,
        items: event.eventData.items
      });

      // Step 2: Process payment (produces PaymentProcessedEvent)
      await this.paymentClient.processPayment({
        orderId: event.eventData.orderId,
        amount: event.eventData.totalAmount
      });

      Logger.info('Order processing initiated', {
        orderId: event.eventData.orderId
      });
    } catch (error) {
      Logger.error('Failed to process order:', error as Error, {
        orderId: event.eventData.orderId
      });

      // Publish compensation event
      // This would trigger cleanup/rollback in other services
      await this.publishCompensationEvent(event.eventData.orderId);
    }
  }

  private async publishCompensationEvent(orderId: string): Promise<void> {
    // Implementation would publish OrderProcessingFailed event
  }
}
```

### Pattern 3: Idempotent Event Handling

Handle duplicate event deliveries safely.

```typescript
@EventHandlerDecorator(PaymentProcessedEvent)
export class UpdateOrderStatusHandler extends EventHandler<PaymentProcessedEvent, void> {
  async handle(event: PaymentProcessedEvent): Promise<void> {
    try {
      // Check if already processed using read model
      const order = await OrderReadModel.findById<OrderReadModel>(event.eventData.orderId);

      if (order?.paymentStatus === 'processed') {
        Logger.info('Payment already processed, skipping', {
          orderId: event.eventData.orderId,
          eventId: event.eventId
        });
        return;  // Idempotent - safe to skip
      }

      // Update order status
      await this.orderClient.updatePaymentStatus({
        orderId: event.eventData.orderId,
        status: 'processed',
        transactionId: event.eventData.transactionId
      });
    } catch (error) {
      Logger.error('Failed to update order status:', error as Error);
    }
  }
}
```

### Pattern 4: Event Aggregation

Collect multiple events before taking action.

```typescript
@EventHandlerDecorator(InventoryReservedEvent)
@EventHandlerDecorator(PaymentProcessedEvent)
@EventHandlerDecorator(ShippingScheduledEvent)
export class CompleteOrderHandler extends EventHandler<DomainEvent, void> {
  async handle(event: DomainEvent): Promise<void> {
    try {
      const orderId = event.aggregateId;

      // Check if all required events have occurred
      const order = await OrderReadModel.findById<OrderReadModel>(orderId);

      if (this.isOrderComplete(order)) {
        await this.orderClient.completeOrder({ orderId });
        Logger.info('Order completed', { orderId });
      } else {
        Logger.info('Order not yet complete, waiting for more events', {
          orderId,
          currentStatus: order?.status
        });
      }
    } catch (error) {
      Logger.error('Failed to check order completion:', error as Error);
    }
  }

  private isOrderComplete(order: OrderReadModel | null): boolean {
    return !!(
      order &&
      order.inventoryReserved &&
      order.paymentProcessed &&
      order.shippingScheduled
    );
  }
}
```

### Pattern 5: Filtering Events

Only process events that meet certain criteria.

```typescript
@EventHandlerDecorator(OrderCreatedEvent)
export class NotifyHighValueOrderHandler extends EventHandler<OrderCreatedEvent, void> {
  async handle(event: OrderCreatedEvent): Promise<void> {
    // Filter: Only process high-value orders
    if (event.eventData.totalAmount < 10000) {
      return;  // Skip low-value orders
    }

    try {
      // Notify sales team about high-value order
      await this.notificationClient.notifyTeam({
        team: 'sales',
        message: `High value order created: $${event.eventData.totalAmount}`,
        orderId: event.eventData.orderId
      });
    } catch (error) {
      Logger.error('Failed to notify about high-value order:', error as Error);
    }
  }
}
```

### Pattern 6: Event Transformation

Transform events from one service's format to another.

```typescript
@EventHandlerDecorator(UserCreatedEvent)
export class SyncUserToCRMHandler extends EventHandler<UserCreatedEvent, void> {
  constructor(
    private crmClient: CRMServiceClient
  ) {
    super();
  }

  async handle(event: UserCreatedEvent): Promise<void> {
    try {
      // Transform platform event to CRM format
      const crmContact = {
        externalId: event.eventData.userId,
        email: event.eventData.email,
        firstName: event.eventData.profile?.firstName,
        lastName: event.eventData.profile?.lastName,
        createdAt: event.eventData.createdAt,
        source: 'platform'
      };

      await this.crmClient.createContact(crmContact);

      Logger.info('User synced to CRM', {
        userId: event.eventData.userId
      });
    } catch (error) {
      Logger.error('Failed to sync user to CRM:', error as Error, {
        userId: event.eventData.userId
      });
    }
  }
}
```

## Event Handler vs Command Handler

### Event Handlers (Reactive)

```typescript
// Reacts to something that already happened
@EventHandlerDecorator(UserCreatedEvent)
export class SendWelcomeEmailHandler extends EventHandler<UserCreatedEvent, void> {
  async handle(event: UserCreatedEvent): Promise<void> {
    // No return value - fire and forget
    // Should not throw errors
    // Idempotent - safe to retry
  }
}
```

### Command Handlers (Proactive)

```typescript
// Handles an explicit request to do something
@CommandHandlerDecorator(CreateUserCommand)
export class CreateUserHandler extends CommandHandler<CreateUserCommand, CreateUserResult> {
  async handle(command: CreateUserCommand, user: AuthenticatedUser | null): Promise<CreateUserResult> {
    // Returns result
    // Can return errors
    // Creates events as side effect
  }
}
```

## Error Handling

### Standard Error Pattern

```typescript
async handle(event: UserCreatedEvent): Promise<void> {
  try {
    // Event processing logic

    Logger.info('Event processed successfully', {
      eventId: event.eventId,
      eventType: event.eventType
    });
  } catch (error) {
    // Log error but don't throw
    Logger.error('Failed to process event:', error as Error, {
      eventId: event.eventId,
      eventType: event.eventType,
      aggregateId: event.aggregateId
    });

    // Optional: Dead letter queue or compensation event
  }
}
```

### Retry Logic

Event handlers automatically retry on failure (configured by platform).

```typescript
async handle(event: OrderCreatedEvent): Promise<void> {
  try {
    // This will be retried automatically if it fails
    await this.inventoryClient.reserveItems({
      orderId: event.eventData.orderId,
      items: event.eventData.items
    });
  } catch (error) {
    Logger.error('Failed to reserve inventory (will retry):', error as Error, {
      orderId: event.eventData.orderId,
      attempt: this.getRetryAttempt()
    });

    // Platform handles retry automatically
    throw error;  // Trigger retry
  }
}
```

### Dead Letter Handling

```typescript
async handle(event: UserCreatedEvent): Promise<void> {
  try {
    await this.processEvent(event);
  } catch (error) {
    Logger.error('Event processing failed after retries:', error as Error, {
      eventId: event.eventId
    });

    // After max retries, send to dead letter queue
    await this.sendToDeadLetterQueue(event, error);
  }
}

private async sendToDeadLetterQueue(event: DomainEvent, error: Error): Promise<void> {
  // Implementation would send to DLQ for manual review
}
```

## Testing

```typescript
// src/events/__tests__/SendWelcomeEmailHandler.test.ts
import { SendWelcomeEmailHandler } from '../SendWelcomeEmailHandler';
import { UserCreatedEvent } from '../../contracts/events/UserCreatedEvent';

describe('SendWelcomeEmailHandler', () => {
  let handler: SendWelcomeEmailHandler;
  let mockEmailClient: jest.Mocked<EmailServiceClient>;

  beforeEach(() => {
    mockEmailClient = {
      sendEmail: jest.fn().mockResolvedValue({ success: true })
    } as any;

    handler = new SendWelcomeEmailHandler(mockEmailClient);
  });

  it('should send welcome email when user is created', async () => {
    const event: UserCreatedEvent = {
      eventId: 'event-123',
      eventType: 'UserCreated',
      aggregateType: 'User',
      aggregateId: 'user-123',
      aggregateVersion: 1,
      occurredAt: new Date(),
      eventData: {
        userId: 'user-123',
        email: 'test@example.com',
        createdAt: new Date(),
        initialRoles: []
      }
    };

    await handler.handle(event);

    expect(mockEmailClient.sendEmail).toHaveBeenCalledWith({
      to: 'test@example.com',
      template: 'welcome',
      data: {
        userId: 'user-123'
      }
    });
  });

  it('should not throw on email service failure', async () => {
    mockEmailClient.sendEmail.mockRejectedValue(new Error('Email service down'));

    const event: UserCreatedEvent = {
      eventId: 'event-123',
      eventType: 'UserCreated',
      aggregateType: 'User',
      aggregateId: 'user-123',
      aggregateVersion: 1,
      occurredAt: new Date(),
      eventData: {
        userId: 'user-123',
        email: 'test@example.com',
        createdAt: new Date(),
        initialRoles: []
      }
    };

    // Should not throw
    await expect(handler.handle(event)).resolves.not.toThrow();
  });
});
```

**See:** [testing-handlers.md](./testing-handlers.md) for complete guide

## Anti-Patterns to Avoid

❌ **Don't throw errors from event handlers**
```typescript
// DON'T DO THIS
async handle(event: UserCreatedEvent): Promise<void> {
  await this.emailClient.sendEmail({...});
  // If this fails, it throws and breaks the event stream
}
```

✅ **Catch and log errors**
```typescript
// DO THIS
async handle(event: UserCreatedEvent): Promise<void> {
  try {
    await this.emailClient.sendEmail({...});
  } catch (error) {
    Logger.error('Failed to send email:', error as Error);
    // Event stream continues
  }
}
```

---

❌ **Don't create circular event dependencies**
```typescript
// DON'T DO THIS
@EventHandlerDecorator(UserCreatedEvent)
export class Handler1 {
  async handle(event: UserCreatedEvent): Promise<void> {
    // Publishes ProfileCreatedEvent
  }
}

@EventHandlerDecorator(ProfileCreatedEvent)
export class Handler2 {
  async handle(event: ProfileCreatedEvent): Promise<void> {
    // Publishes UserCreatedEvent - CIRCULAR!
  }
}
```

✅ **Design clear event flows**
```typescript
// DO THIS
@EventHandlerDecorator(UserCreatedEvent)
export class Handler1 {
  async handle(event: UserCreatedEvent): Promise<void> {
    // Publishes ProfileCreatedEvent (terminal event)
  }
}
```

---

❌ **Don't use events for request-response**
```typescript
// DON'T DO THIS
async handle(event: GetUserEvent): Promise<UserDto> {
  return await this.getUserData();  // Wrong! Events don't return data
}
```

✅ **Use queries for request-response**
```typescript
// DO THIS - Use a query instead
@QueryHandlerDecorator(GetUserQuery)
export class GetUserHandler extends QueryHandler<GetUserQuery, GetUserResult> {
  async handle(query: GetUserQuery, user: AuthenticatedUser | null): Promise<GetUserResult> {
    return { success: true, user: await this.getUserData() };
  }
}
```

---

❌ **Don't make event handlers stateful**
```typescript
// DON'T DO THIS
export class ProcessOrderHandler extends EventHandler<OrderCreatedEvent, void> {
  private processedOrders: Set<string> = new Set();  // Bad! State in handler

  async handle(event: OrderCreatedEvent): Promise<void> {
    if (this.processedOrders.has(event.eventData.orderId)) return;
    this.processedOrders.add(event.eventData.orderId);
  }
}
```

✅ **Use read models for state**
```typescript
// DO THIS
async handle(event: OrderCreatedEvent): Promise<void> {
  const order = await OrderReadModel.findById(event.eventData.orderId);
  if (order?.processed) return;  // Check state in read model
}
```

## Related Guides

- [Command Handlers](./command-handlers.md) - Write operations
- [Query Handlers](./query-handlers.md) - Read operations
- [Distributed Transactions](./distributed-transactions.md) - Sagas and compensation
- [Data Management - Event Sourcing](../data-management/event-sourcing.md) - Event sourcing patterns
- [Testing Handlers](./testing-handlers.md) - Testing strategies
