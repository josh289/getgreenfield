---
title: "Error Handling Patterns"
---

# Error Handling Patterns

## Use this guide if...

- You need to implement proper error handling in handlers
- You want to understand error types and recovery strategies
- You're building resilient services with graceful degradation
- You need to handle validation errors, business rule violations, and system failures

## Quick Example

```typescript
import { CommandHandler, CommandHandlerDecorator, BaseService } from '@banyanai/platform-base-service';
import type { AuthenticatedUser } from '@banyanai/platform-core';
import { Logger } from '@banyanai/platform-telemetry';

@CommandHandlerDecorator(CreateUserCommand)
export class CreateUserHandler extends CommandHandler<CreateUserCommand, CreateUserResult> {
  private readonly logger = Logger;

  async handle(
    command: CreateUserCommand,
    user: AuthenticatedUser | null
  ): Promise<CreateUserResult> {
    try {
      // Validation errors - return structured errors
      const validation = await this.validateCommand(command);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          validationErrors: validation.errors
        };
      }

      // Business rule violations - return user-friendly errors
      const existingUser = await UserReadModel.findByEmail(command.email);
      if (existingUser) {
        return {
          success: false,
          error: 'User with this email already exists'
        };
      }

      // Create user
      const newUser = User.create({...});
      const eventStore = BaseService.getEventStore();
      await eventStore.append(newUser.id, newUser.getUncommittedEvents());

      return { success: true, userId: newUser.id };
    } catch (error) {
      // System errors - log details, return generic message
      this.logger.error('Failed to create user:', error as Error, {
        email: command.email
      });

      return {
        success: false,
        error: 'Failed to create user due to server error'
      };
    }
  }
}
```

## Error Categories

### 1. Validation Errors

Input doesn't meet requirements.

```typescript
private async validateCommand(command: CreateUserCommand): Promise<{
  isValid: boolean;
  errors: Array<{ field: string; message: string }>;
}> {
  const errors: Array<{ field: string; message: string }> = [];

  if (!command.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(command.email)) {
    errors.push({ field: 'email', message: 'Valid email address is required' });
  }

  if (!command.password || command.password.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters' });
  }

  return { isValid: errors.length === 0, errors };
}
```

### 2. Business Rule Violations

Operation violates domain rules.

```typescript
async handle(command: CreateOrderCommand, user: AuthenticatedUser | null): Promise<CreateOrderResult> {
  // Check business rules
  if (command.totalAmount > 10000 && !user?.permissions.includes('order:approve-large')) {
    return {
      success: false,
      error: 'Orders over $10,000 require approval permission'
    };
  }

  if (command.items.length === 0) {
    return {
      success: false,
      error: 'Order must contain at least one item'
    };
  }

  // Continue...
}
```

### 3. Not Found Errors

Requested entity doesn't exist.

```typescript
async handle(query: GetUserQuery, user: AuthenticatedUser | null): Promise<GetUserResult> {
  const userReadModel = await UserReadModel.findById<UserReadModel>(query.userId);

  if (!userReadModel || !userReadModel.isActive) {
    return {
      success: false,
      error: 'User not found'
    };
  }

  return { success: true, user: this.mapReadModelToDto(userReadModel) };
}
```

### 4. Concurrency Errors

Optimistic locking conflict.

```typescript
try {
  await eventStore.append(user.id, user.getUncommittedEvents());
} catch (error) {
  if (error instanceof ConcurrencyError) {
    return {
      success: false,
      error: 'User was modified by another process. Please refresh and try again.'
    };
  }
  throw error;
}
```

### 5. Service Unavailable Errors

External service is down.

```typescript
try {
  const customer = await this.userClient.getUser({ userId: command.customerId });
  
  if (!customer.success) {
    return { success: false, error: 'Customer not found' };
  }
} catch (error) {
  if (error instanceof ServiceUnavailableError) {
    return {
      success: false,
      error: 'User service is temporarily unavailable. Please try again later.'
    };
  }

  if (error instanceof CircuitBreakerOpenError) {
    return {
      success: false,
      error: 'User service is down. Please try again later.'
    };
  }

  throw error;
}
```

## Error Handling Patterns

### Pattern 1: Result Pattern

Return success/failure instead of throwing.

```typescript
export interface CreateUserResult {
  success: boolean;
  userId?: string;
  error?: string;
  validationErrors?: Array<{ field: string; message: string }>;
}

async handle(command: CreateUserCommand, user: AuthenticatedUser | null): Promise<CreateUserResult> {
  // Return structured result
  if (validation.errors.length > 0) {
    return { success: false, error: 'Validation failed', validationErrors: validation.errors };
  }

  return { success: true, userId: newUser.id };
}
```

### Pattern 2: Graceful Degradation

Continue with reduced functionality when optional services fail.

```typescript
async handle(command: CreateOrderCommand, user: AuthenticatedUser | null): Promise<CreateOrderResult> {
  // Required service call
  const customer = await this.userClient.getUser({ userId: command.customerId });
  if (!customer.success) {
    return { success: false, error: 'Customer not found' };
  }

  // Optional service call - degrade gracefully
  let recommendations = null;
  try {
    recommendations = await this.recommendationClient.getRecommendations({
      userId: command.customerId
    });
  } catch (error) {
    Logger.warn('Failed to get recommendations (non-critical):', error as Error);
    // Continue without recommendations
  }

  return { success: true, orderId: 'order-123', recommendations };
}
```

### Pattern 3: Compensation

Undo previous operations on failure.

```typescript
async handle(command: ProcessOrderCommand, user: AuthenticatedUser | null): Promise<ProcessOrderResult> {
  let inventoryReserved = false;
  let paymentProcessed = false;

  try {
    // Step 1: Reserve inventory
    await this.inventoryClient.reserveItems({ orderId: command.orderId });
    inventoryReserved = true;

    // Step 2: Process payment
    await this.paymentClient.processPayment({ orderId: command.orderId });
    paymentProcessed = true;

    return { success: true };
  } catch (error) {
    Logger.error('Failed to process order, compensating:', error as Error);

    // Compensate in reverse order
    if (paymentProcessed) {
      await this.paymentClient.refundPayment({ orderId: command.orderId });
    }

    if (inventoryReserved) {
      await this.inventoryClient.releaseItems({ orderId: command.orderId });
    }

    return { success: false, error: 'Failed to process order' };
  }
}
```

### Pattern 4: Retry with Backoff

Retry transient failures automatically.

```typescript
async handle(command: CreateUserCommand, user: AuthenticatedUser | null): Promise<CreateUserResult> {
  // Service clients automatically retry with exponential backoff
  // You don't need to implement retry logic!
  
  const result = await this.emailClient.sendWelcomeEmail({
    to: command.email
  });

  // Platform handles:
  // - 3 retry attempts
  // - Exponential backoff: 1s, 2s, 4s
  // - Jitter to prevent thundering herd
  // - Circuit breaker protection
}
```

### Pattern 5: Dead Letter Queue

Handle unrecoverable failures.

```typescript
async handle(event: UserCreatedEvent): Promise<void> {
  try {
    await this.processEvent(event);
  } catch (error) {
    Logger.error('Event processing failed after retries:', error as Error, {
      eventId: event.eventId,
      eventType: event.eventType
    });

    // Send to dead letter queue for manual review
    await this.sendToDeadLetterQueue(event, error);
  }
}
```

## Logging Best Practices

### Log Context, Not Secrets

```typescript
this.logger.error('Failed to create user:', error as Error, {
  email: command.email,  // @Sensitive fields auto-redacted
  createdBy: command.createdBy,
  // Don't log: password, tokens, credit cards
});
```

### Log Levels

```typescript
// ERROR: Something failed
Logger.error('Failed to create user:', error as Error);

// WARN: Something unexpected but handled
Logger.warn('Email service degraded, continuing without confirmation email');

// INFO: Important business events
Logger.info('User created successfully', { userId: newUser.id });

// DEBUG: Detailed debugging info (disabled in production)
Logger.debug('Validating user input', { emailLength: command.email.length });
```

## Anti-Patterns to Avoid

❌ **Don't expose stack traces to users**
```typescript
// DON'T DO THIS
return { success: false, error: error.stack };
```

✅ **Log details, return user-friendly message**
```typescript
// DO THIS
Logger.error('Failed to create user:', error as Error);
return { success: false, error: 'Failed to create user due to server error' };
```

---

❌ **Don't swallow errors silently**
```typescript
// DON'T DO THIS
try {
  await this.processUser(command);
} catch (error) {
  // Silent failure - bad!
}
```

✅ **Always log errors**
```typescript
// DO THIS
try {
  await this.processUser(command);
} catch (error) {
  Logger.error('Failed to process user:', error as Error);
  return { success: false, error: 'Processing failed' };
}
```

## Related Guides

- [Command Handlers](./command-handlers.md)
- [Service Clients](./service-clients.md)
- [Distributed Transactions](./distributed-transactions.md)
