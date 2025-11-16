# Events Reference

## Overview

Events represent **things that happened** in the system. They follow publish-subscribe pattern where multiple services can subscribe to and react to events independently.

## Event Characteristics

- **Intent**: Notify about state changes
- **Pattern**: Publish-subscribe (asynchronous)
- **Subscribers**: Zero or more subscribers per event
- **Response**: No response (fire-and-forget)
- **Routing**: Broadcast via exchange to all subscribers
- **Side Effects**: Multiple independent actions
- **Eventual Consistency**: Subscribers process asynchronously

## Event Message Structure

### Complete Example

```json
{
  "id": "evt_abc123xyz789",
  "correlationId": "cor_def456uvw012",
  "traceContext": {
    "traceId": "0af7651916cd43dd8448eb211c80319c",
    "spanId": "b7ad6b7169203331",
    "traceFlags": "01"
  },
  "timestamp": "2025-11-15T10:30:00.123Z",
  "serviceName": "user-service",
  "messageType": "UserCreated",
  "payload": {
    "userId": "usr_abc123",
    "email": "alice@example.com",
    "name": "Alice Smith",
    "role": "user",
    "createdAt": "2025-11-15T10:30:00.000Z"
  },
  "metadata": {
    "routing": {
      "priority": "normal"
    }
  }
}
```

## Event Naming Convention

### Pattern

```
{Noun}{PastTenseVerb}

Examples:
- UserCreated
- OrderPlaced
- PaymentProcessed
- SubscriptionCancelled
```

### Best Practices

```typescript
// Good: Past tense, domain event
UserCreated
OrderPlaced
PaymentProcessed
EmailSent

// Avoid: Present tense, command-like
CreateUser      // This is a command
PlaceOrder      // This is a command
UserCreate      // Wrong tense
OrderPlace      // Wrong tense
```

## Queue Naming

### Format

```
exchange.platform.events.{subscriberService}.{eventName}
```

### Examples

```
exchange.platform.events.email-service.usercreated
exchange.platform.events.analytics-service.usercreated
exchange.platform.events.notification-service.orderplaced
```

**Note**: Event name is lowercase, no dashes.

## Publishing Events

### Basic Publish

```typescript
import { messageBus } from '@banyanai/platform-message-bus-client';
import { UserCreatedEvent } from './contracts/UserEvents.js';

// Publish event
await messageBus.publish(UserCreatedEvent, {
  userId: 'usr_abc123',
  email: 'alice@example.com',
  name: 'Alice Smith',
  role: 'user',
  createdAt: new Date()
});

console.log('Event published');
// No response - fire and forget
```

### With Options

```typescript
// Publish with priority
await messageBus.publish(
  PaymentProcessedEvent,
  {
    paymentId: 'pay_xyz789',
    orderId: 'ord_abc123',
    amount: 99.99,
    currency: 'USD'
  },
  {
    priority: 'high',  // Prioritize this event
    waitForConfirmation: true  // Wait for RabbitMQ confirmation
  }
);
```

### From Command Handler

```typescript
@CommandHandler(CreateUserContract)
export class CreateUserHandler {
  async handle(input: { email: string; name: string }) {
    // Create user
    const user = await this.userRepository.create(input);

    // Publish event
    await this.messageBus.publish(UserCreatedEvent, {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt
    });

    return user;
  }
}
```

## Subscribing to Events

### Basic Subscription

```typescript
import { messageBus } from '@banyanai/platform-message-bus-client';
import { UserCreatedEvent } from './contracts/UserEvents.js';

// Subscribe to event
await messageBus.subscribe(
  UserCreatedEvent,
  async (event) => {
    console.log('User created:', event.userId);
    // Handle event (send welcome email, update analytics, etc.)
  }
);
```

### Event Handler Class

```typescript
import { EventHandler } from '@banyanai/platform-cqrs';
import { UserCreatedEvent } from '../contracts/UserEvents.js';

@EventHandler(UserCreatedEvent)
export class UserCreatedHandler {
  constructor(
    private readonly emailService: EmailService,
    private readonly logger: Logger
  ) {}

  async handle(event: {
    userId: string;
    email: string;
    name: string;
  }) {
    this.logger.info('Processing UserCreated event', {
      userId: event.userId
    });

    // Send welcome email
    await this.emailService.sendWelcomeEmail({
      to: event.email,
      name: event.name
    });

    this.logger.info('Welcome email sent', {
      userId: event.userId
    });
  }
}
```

### Multiple Subscribers

Different services can subscribe to the same event:

```typescript
// Email Service
@EventHandler(UserCreatedEvent)
export class SendWelcomeEmailHandler {
  async handle(event: any) {
    await this.emailService.sendWelcomeEmail(event);
  }
}

// Analytics Service
@EventHandler(UserCreatedEvent)
export class TrackUserCreationHandler {
  async handle(event: any) {
    await this.analytics.track('user_created', event);
  }
}

// Notification Service
@EventHandler(UserCreatedEvent)
export class NotifyAdminsHandler {
  async handle(event: any) {
    await this.notifications.notifyAdmins('New user registered', event);
  }
}
```

### With Subscription Options

```typescript
await messageBus.subscribe(
  OrderPlacedEvent,
  async (event) => {
    await this.processOrder(event);
  },
  {
    subscriptionGroup: 'order-processor',  // Load balancing group
    concurrency: 5,                        // Process 5 events concurrently
    prefetch: 10,                          // Prefetch 10 messages
    autoAck: true                          // Auto-acknowledge on success
  }
);
```

## Common Event Patterns

### Entity Created

```typescript
// UserCreated
{
  "messageType": "UserCreated",
  "payload": {
    "userId": "usr_abc123",
    "email": "alice@example.com",
    "name": "Alice Smith",
    "role": "user",
    "createdAt": "2025-11-15T10:30:00Z"
  }
}
```

### Entity Updated

```typescript
// UserUpdated
{
  "messageType": "UserUpdated",
  "payload": {
    "userId": "usr_abc123",
    "changes": {
      "name": { "old": "Alice Smith", "new": "Alice Johnson" },
      "role": { "old": "user", "new": "admin" }
    },
    "updatedAt": "2025-11-15T10:35:00Z",
    "updatedBy": "usr_admin_456"
  }
}
```

### Entity Deleted

```typescript
// UserDeleted
{
  "messageType": "UserDeleted",
  "payload": {
    "userId": "usr_abc123",
    "email": "alice@example.com",
    "deletedAt": "2025-11-15T10:40:00Z",
    "deletedBy": "usr_admin_456",
    "reason": "User requested account deletion"
  }
}
```

### State Transition

```typescript
// OrderStatusChanged
{
  "messageType": "OrderStatusChanged",
  "payload": {
    "orderId": "ord_xyz789",
    "oldStatus": "pending",
    "newStatus": "processing",
    "changedAt": "2025-11-15T10:45:00Z",
    "reason": "Payment confirmed"
  }
}
```

### Business Event

```typescript
// PaymentProcessed
{
  "messageType": "PaymentProcessed",
  "payload": {
    "paymentId": "pay_abc123",
    "orderId": "ord_xyz789",
    "amount": 99.99,
    "currency": "USD",
    "method": "credit_card",
    "processedAt": "2025-11-15T10:50:00Z"
  }
}
```

## Event Sourcing Integration

### Publishing Domain Events

```typescript
@CommandHandler(PlaceOrderContract)
export class PlaceOrderHandler {
  async handle(input: any) {
    // Create order aggregate
    const order = new Order();
    order.place(input);

    // Save events
    await this.eventStore.save(order.id, order.uncommittedEvents);

    // Publish events to message bus
    for (const event of order.uncommittedEvents) {
      await this.messageBus.publish(event.type, event.data);
    }

    return { orderId: order.id };
  }
}
```

### Event Store Integration

```typescript
// Events stored in event store AND published to message bus
await this.eventStore.appendToStream('order-' + orderId, [
  {
    type: 'OrderPlaced',
    data: {
      orderId,
      userId,
      items,
      total
    },
    metadata: {
      correlationId: context.correlationId,
      causationId: context.messageId
    }
  }
]);

// Automatically published to message bus
await this.messageBus.publish(OrderPlacedEvent, {
  orderId,
  userId,
  items,
  total
});
```

## Error Handling

### Retry on Failure

```typescript
@EventHandler(UserCreatedEvent)
export class SendWelcomeEmailHandler {
  async handle(event: any) {
    try {
      await this.emailService.sendWelcomeEmail(event);
    } catch (error) {
      this.logger.error('Failed to send welcome email', error, {
        userId: event.userId
      });

      // Throw to trigger retry
      throw error;
    }
  }
}
```

### Dead Letter Queue

Events that fail after max retries go to DLQ:

```
Queue: dlq.exchange.platform.events.email-service.usercreated
```

Manual inspection and reprocessing required.

### Idempotent Handlers

```typescript
@EventHandler(UserCreatedEvent)
export class SendWelcomeEmailHandler {
  async handle(event: { userId: string; email: string }) {
    // Check if already processed (idempotency)
    const processed = await this.processedEvents.exists(
      `welcome-email:${event.userId}`
    );

    if (processed) {
      this.logger.info('Event already processed, skipping', {
        userId: event.userId
      });
      return;
    }

    // Send email
    await this.emailService.sendWelcomeEmail(event);

    // Mark as processed
    await this.processedEvents.add(
      `welcome-email:${event.userId}`,
      86400  // 24h TTL
    );
  }
}
```

## Event Versioning

### Version 1

```typescript
// UserCreatedV1
{
  "messageType": "UserCreated",
  "version": 1,
  "payload": {
    "userId": "usr_abc123",
    "email": "alice@example.com",
    "name": "Alice Smith"
  }
}
```

### Version 2 (Added fields)

```typescript
// UserCreatedV2
{
  "messageType": "UserCreated",
  "version": 2,
  "payload": {
    "userId": "usr_abc123",
    "email": "alice@example.com",
    "name": "Alice Smith",
    "role": "user",           // New field
    "preferences": {          // New field
      "newsletter": true
    }
  }
}
```

### Handling Multiple Versions

```typescript
@EventHandler(UserCreatedEvent)
export class UserCreatedHandler {
  async handle(event: any) {
    const version = event.version || 1;

    switch (version) {
      case 1:
        return this.handleV1(event);
      case 2:
        return this.handleV2(event);
      default:
        this.logger.warn('Unknown event version', { version });
    }
  }

  private async handleV1(event: any) {
    // Handle v1 format
    await this.emailService.sendWelcomeEmail({
      to: event.email,
      name: event.name
    });
  }

  private async handleV2(event: any) {
    // Handle v2 format with new fields
    await this.emailService.sendWelcomeEmail({
      to: event.email,
      name: event.name,
      includeNewsletter: event.preferences?.newsletter
    });
  }
}
```

## Event Ordering

### Guaranteed Ordering

Events from same aggregate are ordered:

```typescript
// Order 1
await messageBus.publish(OrderPlacedEvent, { orderId: 'ord_123' });

// Order 2
await messageBus.publish(OrderPaymentProcessedEvent, { orderId: 'ord_123' });

// Order 3
await messageBus.publish(OrderShippedEvent, { orderId: 'ord_123' });
```

Subscriber receives in order for same `orderId`.

### Out-of-Order Handling

```typescript
@EventHandler(OrderShippedEvent)
export class OrderShippedHandler {
  async handle(event: { orderId: string }) {
    // Check order exists and is paid
    const order = await this.orderRepository.findById(event.orderId);

    if (!order) {
      this.logger.warn('Order not found, requeueing event', {
        orderId: event.orderId
      });
      // Retry later
      throw new Error('Order not found');
    }

    if (order.status !== 'paid') {
      this.logger.warn('Order not paid yet, requeueing event', {
        orderId: event.orderId
      });
      // Retry later
      throw new Error('Order not paid');
    }

    // Process shipping
    await this.shippingService.ship(order);
  }
}
```

## Best Practices

### 1. Use Past Tense

```typescript
// Good
UserCreated
OrderPlaced
PaymentProcessed

// Avoid
CreateUser
PlaceOrder
ProcessPayment
```

### 2. Include Complete Data

```typescript
// Good: Complete event data
await messageBus.publish(UserCreatedEvent, {
  userId: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  createdAt: user.createdAt,
  createdBy: context.userId
});

// Avoid: Minimal data (requires lookup)
await messageBus.publish(UserCreatedEvent, {
  userId: user.id  // Subscribers have to fetch rest
});
```

### 3. Make Handlers Idempotent

```typescript
// Always check if already processed
const processed = await this.processedEvents.exists(eventId);
if (processed) return;

// Process event
await this.doSomething();

// Mark as processed
await this.processedEvents.add(eventId);
```

### 4. Log Event Processing

```typescript
@EventHandler(UserCreatedEvent)
export class UserCreatedHandler {
  async handle(event: any) {
    this.logger.info('Processing UserCreated event', {
      userId: event.userId
    });

    await this.sendWelcomeEmail(event);

    this.logger.info('UserCreated event processed', {
      userId: event.userId
    });
  }
}
```

### 5. Don't Block on Event Publishing

```typescript
// Good: Publish and continue
await this.userRepository.create(user);
await this.messageBus.publish(UserCreatedEvent, user);  // Fire and forget
return user;

// Avoid: Waiting for all subscribers
// Events are async - don't wait for subscribers to process
```

## Related References

- [Commands Reference](./commands.md)
- [Queries Reference](./queries.md)
- [Routing Reference](./routing.md)
- [Message Protocols Overview](./overview.md)
