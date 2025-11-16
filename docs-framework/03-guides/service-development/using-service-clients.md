---
title: Using Service Clients
description: Enable type-safe cross-service communication through the message bus without HTTP or infrastructure code
category: Service Development
tags: [service-clients, communication, message-bus, dependencies, integration]
difficulty: intermediate
last_updated: 2025-01-15
applies_to: ["v1.0.0+"]
related:
  - writing-handlers.md
  - defining-contracts.md
  - testing-services.md
---

# Using Service Clients

Service Clients enable type-safe cross-service communication without HTTP, REST, or any infrastructure code. All communication goes through the message bus - services never know about HTTP or protocol details.

## Use This Guide If...

- You need to call another service from your handler
- You're implementing cross-service workflows
- You want type-safe service communication
- You need to avoid tight HTTP coupling between services
- You're building distributed transaction patterns

## Quick Example

```typescript
// 1. Create ServiceClient
export class NotificationServiceClient extends ServiceClient {
  async sendWelcomeEmail(userId: string, email: string): Promise<void> {
    await this.sendCommand('Notification.Commands.SendWelcomeEmail', {
      userId,
      email,
    });
  }
}

// 2. Use in handler - automatically injected
@CommandHandlerDecorator(CreateUserCommand)
export class CreateUserHandler extends CommandHandler<CreateUserCommand, CreateUserResult> {
  constructor(
    private readonly notifications: NotificationServiceClient
  ) {
    super();
  }

  async handle(command: CreateUserCommand, user: AuthenticatedUser | null): Promise<CreateUserResult> {
    const userId = 'user-123';

    // Cross-service call (message bus, not HTTP)
    await this.notifications.sendWelcomeEmail(userId, command.email);

    return { userId, ... };
  }
}
```

## Why ServiceClients?

### Without ServiceClients (DON'T)

```typescript
// ❌ Tight coupling to HTTP
const response = await fetch('http://notification-service:3001/api/send-email', {
  method: 'POST',
  body: JSON.stringify({ userId, email }),
});

// ❌ No type safety
// ❌ Manual error handling
// ❌ No retries or circuit breakers
// ❌ Service discovery manual
// ❌ No distributed tracing
```

### With ServiceClients (DO)

```typescript
// ✅ Type-safe
await this.notifications.sendWelcomeEmail(userId, email);

// ✅ Protocol independent (message bus)
// ✅ Automatic retries
// ✅ Circuit breakers
// ✅ Service discovery
// ✅ Distributed tracing
// ✅ Load balancing
```

## Creating a ServiceClient

### Step 1: Extend ServiceClient

```typescript
// File: service/src/clients/NotificationServiceClient.ts
import { ServiceClient } from '@banyanai/platform-client-system';

/**
 * Type-safe client for Notification Service
 */
export class NotificationServiceClient extends ServiceClient {
  /**
   * Send welcome email to new user
   */
  async sendWelcomeEmail(userId: string, email: string, firstName: string): Promise<void> {
    await this.sendCommand('Notification.Commands.SendWelcomeEmail', {
      userId,
      email,
      firstName,
    });
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(userId: string, email: string, token: string): Promise<void> {
    await this.sendCommand('Notification.Commands.SendPasswordReset', {
      userId,
      email,
      token,
    });
  }

  /**
   * Query email delivery status
   */
  async getEmailStatus(emailId: string): Promise<EmailStatus> {
    return await this.sendQuery('Notification.Queries.GetEmailStatus', {
      emailId,
    });
  }
}
```

### Step 2: Export the Client

```typescript
// File: service/src/clients/index.ts
export { NotificationServiceClient } from './NotificationServiceClient.js';
export { AuditServiceClient } from './AuditServiceClient.js';
export { PaymentServiceClient } from './PaymentServiceClient.js';
```

### Step 3: Use in Handlers

```typescript
import { NotificationServiceClient } from '../clients/NotificationServiceClient.js';

@CommandHandlerDecorator(CreateUserCommand)
export class CreateUserHandler extends CommandHandler<CreateUserCommand, CreateUserResult> {
  constructor(
    private readonly notifications: NotificationServiceClient // ✅ Auto-injected
  ) {
    super();
  }

  async handle(command: CreateUserCommand, user: AuthenticatedUser | null): Promise<CreateUserResult> {
    const userId = 'user-123';

    // Type-safe cross-service call
    await this.notifications.sendWelcomeEmail(userId, command.email, command.firstName);

    return { userId, ... };
  }
}
```

## ServiceClient Methods

### Sending Commands (Write Operations)

```typescript
export class AuditServiceClient extends ServiceClient {
  async logUserCreation(userId: string, email: string, createdBy: string): Promise<void> {
    await this.sendCommand('Audit.Commands.LogUserCreation', {
      userId,
      email,
      createdBy,
      timestamp: new Date().toISOString(),
    });
  }

  async logSecurityEvent(eventType: string, details: Record<string, unknown>): Promise<void> {
    await this.sendCommand('Audit.Commands.LogSecurityEvent', {
      eventType,
      details,
      timestamp: new Date().toISOString(),
    });
  }
}
```

### Sending Queries (Read Operations)

```typescript
export class UserServiceClient extends ServiceClient {
  async getUserById(userId: string): Promise<UserInfo | null> {
    return await this.sendQuery<UserInfo>('UserManagement.Queries.GetUser', {
      userId,
    });
  }

  async findUserByEmail(email: string): Promise<UserInfo | null> {
    return await this.sendQuery<UserInfo>('UserManagement.Queries.FindUserByEmail', {
      email,
    });
  }

  async listUsers(page: number, pageSize: number): Promise<UserListResult> {
    return await this.sendQuery<UserListResult>('UserManagement.Queries.ListUsers', {
      page,
      pageSize,
    });
  }
}
```

### Publishing Events

```typescript
export class EventPublisherClient extends ServiceClient {
  async publishUserCreated(userId: string, email: string): Promise<void> {
    await this.publish('UserManagement.Events.UserCreated', {
      userId,
      email,
      timestamp: new Date().toISOString(),
    });
  }
}
```

## ServiceClient Requirements

### 1. Must Extend ServiceClient

```typescript
// ✅ Correct
export class NotificationServiceClient extends ServiceClient {
  // ...
}

// ❌ Wrong - doesn't extend ServiceClient
export class NotificationServiceClient {
  // ...
}
```

### 2. Class Name Must End with "ServiceClient"

```typescript
// ✅ Correct
export class NotificationServiceClient extends ServiceClient {}
export class AuditServiceClient extends ServiceClient {}

// ❌ Wrong - doesn't end with ServiceClient
export class NotificationClient extends ServiceClient {}
export class Notifications extends ServiceClient {}
```

### 3. No Constructor Parameters

```typescript
// ✅ Correct
export class NotificationServiceClient extends ServiceClient {
  // No constructor needed - platform handles initialization
}

// ❌ Wrong - has constructor parameters
export class NotificationServiceClient extends ServiceClient {
  constructor(private readonly config: Config) { // ❌
    super();
  }
}
```

### 4. Use Concrete Classes in Handlers

```typescript
// ✅ Correct - concrete class
import { NotificationServiceClient } from '../clients/NotificationServiceClient.js';

constructor(private readonly notifications: NotificationServiceClient) {}

// ❌ Wrong - interface
import { INotificationServiceClient } from '../clients/interfaces.js';

constructor(private readonly notifications: INotificationServiceClient) {} // ❌
```

## Multiple ServiceClients

```typescript
@CommandHandlerDecorator(CreateUserCommand)
export class CreateUserHandler extends CommandHandler<CreateUserCommand, CreateUserResult> {
  constructor(
    private readonly notifications: NotificationServiceClient,
    private readonly audit: AuditServiceClient,
    private readonly payment: PaymentServiceClient
  ) {
    super();
  }

  async handle(command: CreateUserCommand, user: AuthenticatedUser | null): Promise<CreateUserResult> {
    const userId = 'user-123';

    // Multiple cross-service calls (automatically traced)
    await this.audit.logUserCreation(userId, command.email, user!.userId);
    await this.notifications.sendWelcomeEmail(userId, command.email, command.firstName);
    await this.payment.createCustomerAccount(userId, command.email);

    return { userId, ... };
  }
}
```

## Error Handling

```typescript
export class NotificationServiceClient extends ServiceClient {
  async sendWelcomeEmail(userId: string, email: string): Promise<void> {
    try {
      await this.sendCommand('Notification.Commands.SendWelcomeEmail', {
        userId,
        email,
      });
    } catch (error) {
      Logger.error('Failed to send welcome email', {
        userId,
        email,
        error: error.message,
      });
      throw error; // Re-throw for handler to handle
    }
  }
}
```

The platform automatically:
- Retries failed requests
- Applies circuit breakers
- Logs errors with correlation IDs
- Records telemetry

## Timeouts

```typescript
export class PaymentServiceClient extends ServiceClient {
  async processPayment(orderId: string, amount: number): Promise<PaymentResult> {
    return await this.sendCommand<PaymentResult>(
      'Payment.Commands.ProcessPayment',
      { orderId, amount },
      { timeout: 30000 } // 30 second timeout
    );
  }
}
```

## Testing ServiceClients

### Mocking in Unit Tests

```typescript
import { NotificationServiceClient } from './NotificationServiceClient.js';

describe('CreateUserHandler', () => {
  it('should send welcome email', async () => {
    // Mock ServiceClient
    const mockNotifications = {
      sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
    } as any;

    const handler = new CreateUserHandler(mockNotifications);

    await handler.handle(command, user);

    expect(mockNotifications.sendWelcomeEmail).toHaveBeenCalledWith(
      'user-123',
      'test@example.com',
      'John'
    );
  });
});
```

### Integration Tests

```typescript
describe('NotificationServiceClient Integration', () => {
  it('should send email via message bus', async () => {
    const client = new NotificationServiceClient();

    // Real call through message bus
    await client.sendWelcomeEmail('user-123', 'test@example.com', 'John');

    // Verify email was queued/sent
    // Check notification service logs or database
  });
});
```

## Best Practices

### DO

```typescript
// ✅ Create focused clients (one service per client)
export class NotificationServiceClient extends ServiceClient {
  // Only notification-related methods
}

// ✅ Use descriptive method names
async sendWelcomeEmail(userId: string, email: string): Promise<void>

// ✅ Add JSDoc comments
/**
 * Send welcome email to newly registered user
 * @param userId - User's unique identifier
 * @param email - User's email address
 * @param firstName - User's first name for personalization
 */
async sendWelcomeEmail(userId: string, email: string, firstName: string): Promise<void>

// ✅ Use type parameters for queries
return await this.sendQuery<UserInfo>('GetUser', { userId });
```

### DON'T

```typescript
// ❌ Don't create "god" clients with everything
export class ApiClient extends ServiceClient {
  sendEmail() {}
  processPayment() {}
  createUser() {}
  logAudit() {}
  // ... (too many responsibilities)
}

// ❌ Don't use vague method names
async doThing(): Promise<void>

// ❌ Don't bypass the message bus
async sendEmail() {
  await fetch('http://notification-service/email'); // ❌
}

// ❌ Don't use interfaces in handlers
constructor(private readonly client: INotificationClient) {} // ❌
```

## Common Patterns

### Request-Response Pattern

```typescript
export class UserServiceClient extends ServiceClient {
  async getUserProfile(userId: string): Promise<UserProfile> {
    const user = await this.sendQuery<UserProfile>('GetUser', { userId });

    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    return user;
  }
}
```

### Fire-and-Forget Pattern

```typescript
export class AuditServiceClient extends ServiceClient {
  async logAction(action: string, userId: string): Promise<void> {
    // Don't wait for response
    this.publish('Audit.Events.ActionLogged', {
      action,
      userId,
      timestamp: new Date().toISOString(),
    });
  }
}
```

### Saga Pattern (Complex Workflows)

```typescript
@CommandHandlerDecorator(PlaceOrderCommand)
export class PlaceOrderHandler extends CommandHandler<PlaceOrderCommand, OrderResult> {
  constructor(
    private readonly inventory: InventoryServiceClient,
    private readonly payment: PaymentServiceClient,
    private readonly shipping: ShippingServiceClient
  ) {
    super();
  }

  async handle(command: PlaceOrderCommand, user: AuthenticatedUser | null): Promise<OrderResult> {
    try {
      // Step 1: Reserve inventory
      await this.inventory.reserveItems(command.items);

      // Step 2: Process payment
      await this.payment.chargeCustomer(command.customerId, command.total);

      // Step 3: Schedule shipping
      await this.shipping.scheduleDelivery(command.address);

      return { orderId: 'order-123', status: 'confirmed' };
    } catch (error) {
      // Compensating transactions (rollback)
      await this.inventory.releaseReservation(command.items);
      throw error;
    }
  }
}
```

## Troubleshooting

### "Unsatisfiable parameters: Object"

**Cause:** Using interface instead of concrete class

**Solution:**
```typescript
// ❌ Wrong
import { INotificationServiceClient } from './interfaces.js';
constructor(private readonly client: INotificationServiceClient) {}

// ✅ Correct
import { NotificationServiceClient } from './NotificationServiceClient.js';
constructor(private readonly client: NotificationServiceClient) {}
```

### "ServiceClient not injected"

**Cause:** Class name doesn't end with "ServiceClient"

**Solution:**
```typescript
// ❌ Wrong
export class NotificationClient extends ServiceClient {}

// ✅ Correct
export class NotificationServiceClient extends ServiceClient {}
```

### "Command timeout"

**Solution:** Increase timeout
```typescript
await this.sendCommand('LongRunningOperation', data, {
  timeout: 60000 // 60 seconds
});
```

## Related Resources

- [Writing Handlers](./writing-handlers.md) - Using ServiceClients in handlers
- [Defining Contracts](./defining-contracts.md) - Defining service contracts
- [Testing Services](./testing-services.md) - Testing cross-service calls

---

**Next Steps:**
1. Create ServiceClient classes for external services you need to call
2. Add ServiceClients to handler constructors
3. Use type-safe methods instead of raw HTTP calls
4. Test cross-service communication thoroughly
