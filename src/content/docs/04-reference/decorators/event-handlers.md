---
title: Event Handler Decorators
description: Complete reference for event handler decorators and event subscription patterns
category: decorators
tags: [decorators, events, handlers, event-driven, domain-events, typescript]
related:
  - ./command-handlers.md
  - ./query-handlers.md
  - ./contracts.md
  - ./event-sourcing.md
  - ../platform-packages/event-sourcing.md
difficulty: intermediate
aliases:
  - "@EventHandler"
  - event handler decorator
  - event subscription
relatedConcepts:
  - Event-driven architecture
  - Domain events
  - Event sourcing
  - Event handlers
  - Asynchronous processing
commonQuestions:
  - How do I subscribe to events?
  - How do I handle domain events?
  - Can one handler process multiple events?
  - How do event handlers affect transactions?
  - How do I handle event failures?
---

# Event Handler Decorators

Complete reference for decorators used to subscribe to and handle domain events in the Banyan Platform.

## @EventHandler

Registers a method as a handler for a specific domain event type.

### Signature

```typescript
function EventHandler(eventClass: new (...args: any[]) => DomainEvent): MethodDecorator
function EventHandler(eventType: string): MethodDecorator
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `eventClass` or `eventType` | `class \| string` | Yes | The event class or event type name to handle |

### Usage

#### Basic Event Handler

```typescript
import { EventHandler } from '@banyanai/platform-event-sourcing';
import { UserCreatedEvent } from './events/UserCreatedEvent';

export class UserNotificationHandler {
  @EventHandler(UserCreatedEvent)
  async onUserCreated(event: UserCreatedEvent): Promise<void> {
    // Send welcome email
    await this.emailService.sendWelcomeEmail(event.email);
  }
}
```

#### String Event Type

```typescript
export class UserNotificationHandler {
  @EventHandler('UserCreated')
  async onUserCreated(event: UserCreatedEvent): Promise<void> {
    await this.emailService.sendWelcomeEmail(event.email);
  }
}
```

#### Multiple Event Handlers in One Class

```typescript
export class UserEventHandlers {
  constructor(
    private emailService: EmailService,
    private analyticsService: AnalyticsService
  ) {}

  @EventHandler(UserCreatedEvent)
  async onUserCreated(event: UserCreatedEvent): Promise<void> {
    await this.emailService.sendWelcomeEmail(event.email);
    await this.analyticsService.trackSignup(event.userId);
  }

  @EventHandler(UserUpdatedEvent)
  async onUserUpdated(event: UserUpdatedEvent): Promise<void> {
    await this.analyticsService.trackProfileUpdate(event.userId);
  }

  @EventHandler(UserDeletedEvent)
  async onUserDeleted(event: UserDeletedEvent): Promise<void> {
    await this.emailService.sendGoodbyeEmail(event.email);
    await this.analyticsService.trackAccountDeletion(event.userId);
  }
}
```

### Handler Discovery

Event handlers are discovered automatically by:

1. **Folder Convention**: Handlers in `/events/` directory
2. **Decorator Metadata**: Methods with `@EventHandler` decorator
3. **Event Type Matching**: Platform routes events to appropriate handlers

### Event Handler Interface

Event handler methods should follow this pattern:

```typescript
async methodName(event: TEvent): Promise<void>
```

**Key Points:**
- Method can be named anything (recommended: `on{EventName}`)
- Takes single parameter: the event object
- Returns `Promise<void>` (no return value expected)
- Can be async for database/network operations

## Event Sourcing Decorators

### @ReadModel

Marks a class as a read model that projects from event sourced aggregates.

```typescript
import { ReadModel } from '@banyanai/platform-event-sourcing';

@ReadModel({
  aggregateType: 'User',
  tableName: 'user_profiles',
  schemaName: 'public',
  description: 'User profile read model'
})
export class UserProfileReadModel {
  userId!: string;
  email!: string;
  firstName!: string;
  lastName?: string;
  createdAt!: Date;
}
```

See [Event Sourcing Decorators](./event-sourcing.md#readmodel) for full details.

### @MapFromEvent

Maps event fields to read model properties automatically.

```typescript
@ReadModel({ aggregateType: 'User' })
export class UserProfileReadModel {
  @MapFromEvent('UserCreated')
  userId!: string;

  @MapFromEvent('UserCreated')
  email!: string;

  @MapFromEvent('UserCreated', 'fullName')  // Map from different field name
  name!: string;
}
```

See [Event Sourcing Decorators](./event-sourcing.md#mapfromevent) for full details.

## Complete Examples

### Basic Event Subscription

```typescript
import { EventHandler } from '@banyanai/platform-event-sourcing';
import { UserCreatedEvent, UserUpdatedEvent } from '../events';

export class UserNotificationService {
  constructor(
    private emailService: EmailService,
    private logger: Logger
  ) {}

  @EventHandler(UserCreatedEvent)
  async onUserCreated(event: UserCreatedEvent): Promise<void> {
    this.logger.info('Processing UserCreated event', { userId: event.userId });

    try {
      await this.emailService.sendWelcomeEmail({
        to: event.email,
        name: event.firstName,
      });

      this.logger.info('Welcome email sent', { userId: event.userId });
    } catch (error) {
      this.logger.error('Failed to send welcome email', error, {
        userId: event.userId,
      });
      throw error;  // Event will be retried
    }
  }

  @EventHandler(UserUpdatedEvent)
  async onUserUpdated(event: UserUpdatedEvent): Promise<void> {
    // Only send email if email changed
    const emailChanged = event.changes.some(c => c.field === 'email');

    if (emailChanged) {
      await this.emailService.sendEmailChangeNotification({
        to: event.newEmail,
        oldEmail: event.oldEmail,
      });
    }
  }
}
```

### Cross-Service Event Handling

```typescript
// In analytics-service
export class UserAnalyticsHandler {
  constructor(private analyticsRepository: AnalyticsRepository) {}

  @EventHandler('UserCreated')  // Listen to user-service events
  async onUserCreated(event: UserCreatedEvent): Promise<void> {
    // Create analytics record
    await this.analyticsRepository.createUserProfile({
      userId: event.userId,
      signupDate: event.createdAt,
      source: 'web',
    });
  }

  @EventHandler('OrderPlaced')  // Listen to order-service events
  async onOrderPlaced(event: OrderPlacedEvent): Promise<void> {
    // Update user analytics
    await this.analyticsRepository.recordPurchase({
      userId: event.userId,
      amount: event.totalAmount,
      timestamp: event.placedAt,
    });
  }
}
```

### Read Model Projection

```typescript
import { ReadModel, MapFromEvent, EventHandler } from '@banyanai/platform-event-sourcing';

@ReadModel({
  aggregateType: 'Order',
  tableName: 'order_summaries'
})
export class OrderSummaryReadModel {
  @MapFromEvent('OrderPlaced')
  orderId!: string;

  @MapFromEvent('OrderPlaced')
  userId!: string;

  @MapFromEvent('OrderPlaced')
  totalAmount!: number;

  @MapFromEvent('OrderPlaced', 'placedAt')
  createdAt!: Date;

  status!: string;  // Updated by event handler
  lastUpdatedAt?: Date;

  // Complex projection logic
  @EventHandler(OrderShippedEvent)
  onOrderShipped(event: OrderShippedEvent): void {
    if (event.orderId === this.orderId) {
      this.status = 'shipped';
      this.lastUpdatedAt = event.shippedAt;
    }
  }

  @EventHandler(OrderCancelledEvent)
  onOrderCancelled(event: OrderCancelledEvent): void {
    if (event.orderId === this.orderId) {
      this.status = 'cancelled';
      this.lastUpdatedAt = event.cancelledAt;
    }
  }
}
```

### Saga Coordination

```typescript
import { EventHandler } from '@banyanai/platform-event-sourcing';
import { CommandBus } from '@banyanai/platform-cqrs';

export class OrderSaga {
  constructor(
    private commandBus: CommandBus,
    private logger: Logger
  ) {}

  @EventHandler(OrderPlacedEvent)
  async onOrderPlaced(event: OrderPlacedEvent): Promise<void> {
    // Step 1: Reserve inventory
    await this.commandBus.send(new ReserveInventoryCommand({
      orderId: event.orderId,
      items: event.items,
    }));
  }

  @EventHandler(InventoryReservedEvent)
  async onInventoryReserved(event: InventoryReservedEvent): Promise<void> {
    // Step 2: Process payment
    await this.commandBus.send(new ProcessPaymentCommand({
      orderId: event.orderId,
      amount: event.totalAmount,
    }));
  }

  @EventHandler(PaymentProcessedEvent)
  async onPaymentProcessed(event: PaymentProcessedEvent): Promise<void> {
    // Step 3: Ship order
    await this.commandBus.send(new ShipOrderCommand({
      orderId: event.orderId,
    }));
  }

  @EventHandler(PaymentFailedEvent)
  async onPaymentFailed(event: PaymentFailedEvent): Promise<void> {
    // Compensating action: Release inventory
    await this.commandBus.send(new ReleaseInventoryCommand({
      orderId: event.orderId,
    }));
  }
}
```

## Best Practices

### DO:

- ✅ Keep event handlers idempotent (safe to replay)
- ✅ Use descriptive method names (`onUserCreated`, `handleOrderPlaced`)
- ✅ Log important information for debugging
- ✅ Handle errors gracefully
- ✅ Use events for cross-service communication
- ✅ Keep event handlers focused (single responsibility)
- ✅ Test event handlers independently
- ✅ Use sagas for complex workflows

### DON'T:

- ❌ Don't modify the event object
- ❌ Don't perform synchronous HTTP calls in event handlers
- ❌ Don't create tight coupling between services via events
- ❌ Don't return values from event handlers
- ❌ Don't swallow errors silently
- ❌ Don't perform long-running operations without proper handling
- ❌ Don't assume event order (events are asynchronous)

## Error Handling

### Retry on Failure

```typescript
@EventHandler(UserCreatedEvent)
async onUserCreated(event: UserCreatedEvent): Promise<void> {
  try {
    await this.externalService.notifyNewUser(event.userId);
  } catch (error) {
    this.logger.error('Failed to notify external service', error);
    throw error;  // Platform will retry
  }
}
```

### Graceful Degradation

```typescript
@EventHandler(OrderPlacedEvent)
async onOrderPlaced(event: OrderPlacedEvent): Promise<void> {
  try {
    await this.emailService.sendOrderConfirmation(event.userEmail);
  } catch (error) {
    // Don't fail the event processing if email fails
    this.logger.error('Failed to send order confirmation email', error, {
      orderId: event.orderId,
    });
    // Continue processing (email is non-critical)
  }

  // Critical operation - let it throw if it fails
  await this.orderRepository.save(event.orderId, event);
}
```

## Testing

### Unit Testing Event Handlers

```typescript
describe('UserNotificationService', () => {
  let service: UserNotificationService;
  let emailService: jest.Mocked<EmailService>;

  beforeEach(() => {
    emailService = {
      sendWelcomeEmail: jest.fn(),
    } as any;

    service = new UserNotificationService(emailService, logger);
  });

  it('should send welcome email when user created', async () => {
    const event: UserCreatedEvent = {
      userId: 'user-123',
      email: 'test@example.com',
      firstName: 'John',
      createdAt: new Date(),
    };

    await service.onUserCreated(event);

    expect(emailService.sendWelcomeEmail).toHaveBeenCalledWith({
      to: 'test@example.com',
      name: 'John',
    });
  });

  it('should log error if email sending fails', async () => {
    emailService.sendWelcomeEmail.mockRejectedValue(new Error('SMTP error'));

    const event: UserCreatedEvent = {
      userId: 'user-123',
      email: 'test@example.com',
      firstName: 'John',
      createdAt: new Date(),
    };

    await expect(service.onUserCreated(event)).rejects.toThrow('SMTP error');
  });
});
```

## Next Steps

- **[Event Sourcing Decorators](./event-sourcing.md)** - Full event sourcing decorator reference
- **[Contract Decorators](./contracts.md)** - Define domain events
- **[Event Sourcing Package](../platform-packages/event-sourcing.md)** - Event sourcing infrastructure
- **[Saga Framework](../platform-packages/saga-framework.md)** - Distributed transaction coordination
