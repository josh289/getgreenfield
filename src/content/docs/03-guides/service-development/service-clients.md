---
title: "Using Service Clients"
---

# Using Service Clients

## Use this guide if...

- You need to call other microservices from your handlers
- You want type-safe cross-service communication
- You're implementing workflows that span multiple services
- You need to understand circuit breakers and retry policies

## Quick Example

```typescript
// src/commands/CreateOrderHandler.ts
import { CommandHandler, CommandHandlerDecorator } from '@banyanai/platform-base-service';
import type { AuthenticatedUser } from '@banyanai/platform-core';
import { CreateOrderCommand, type CreateOrderResult } from '../contracts/commands/CreateOrderCommand.js';
import { UserServiceClient } from '@services/user-service-client';
import { InventoryServiceClient } from '@services/inventory-service-client';

@CommandHandlerDecorator(CreateOrderCommand)
export class CreateOrderHandler extends CommandHandler<CreateOrderCommand, CreateOrderResult> {
  constructor(
    private userClient: UserServiceClient,        // Auto-injected by BaseService
    private inventoryClient: InventoryServiceClient
  ) {
    super();
  }

  async handle(
    command: CreateOrderCommand,
    user: AuthenticatedUser | null
  ): Promise<CreateOrderResult> {
    try {
      // Simple method calls - all infrastructure handled automatically!
      const customer = await this.userClient.getUser({ userId: command.customerId });
      
      if (!customer.success) {
        return { success: false, error: 'Customer not found' };
      }

      const inventory = await this.inventoryClient.checkAvailability({
        items: command.items
      });

      if (!inventory.available) {
        return { success: false, error: 'Items not available' };
      }

      // Create order...
      return { success: true, orderId: 'order-123' };
    } catch (error) {
      Logger.error('Failed to create order:', error as Error);
      return { success: false, error: 'Failed to create order' };
    }
  }
}
```

**All calls automatically include:**
- Correlation ID propagation
- Circuit breaker protection
- Retry policies for transient failures
- Distributed tracing
- Performance monitoring

**No infrastructure code needed!**

## How Service Clients Work

### Auto-Generation

Service clients are automatically generated from service contracts:

```typescript
// Service A defines a contract
@Query({
  description: 'Gets a user by ID',
  permissions: ['auth:view-users']
})
export class GetUserQuery {
  userId: string;
}

// Generated client (automatic!)
export class UserServiceClient {
  async getUser(query: GetUserQuery): Promise<GetUserResult> {
    // All infrastructure handled automatically
  }
}
```

### Auto-Injection

BaseService automatically injects clients via constructor:

```typescript
@CommandHandlerDecorator(CreateOrderCommand)
export class CreateOrderHandler extends CommandHandler<CreateOrderCommand, CreateOrderResult> {
  constructor(
    private userClient: UserServiceClient  // Injected automatically!
  ) {
    super();
  }
}
```

## Common Patterns

### Pattern 1: Sequential Service Calls

```typescript
async handle(command: CreateOrderCommand, user: AuthenticatedUser | null): Promise<CreateOrderResult> {
  // Call services in sequence
  const customer = await this.userClient.getUser({ userId: command.customerId });
  const inventory = await this.inventoryClient.checkAvailability({ items: command.items });
  const pricing = await this.pricingClient.calculatePrice({ items: command.items });

  // Process results...
}
```

### Pattern 2: Parallel Service Calls

```typescript
async handle(command: CreateOrderCommand, user: AuthenticatedUser | null): Promise<CreateOrderResult> {
  // Call multiple services in parallel
  const [customer, inventory, pricing] = await Promise.all([
    this.userClient.getUser({ userId: command.customerId }),
    this.inventoryClient.checkAvailability({ items: command.items }),
    this.pricingClient.calculatePrice({ items: command.items })
  ]);

  if (!customer.success || !inventory.available || !pricing.success) {
    return { success: false, error: 'Failed to validate order' };
  }

  // Process results...
}
```

### Pattern 3: Error Handling

```typescript
async handle(command: CreateOrderCommand, user: AuthenticatedUser | null): Promise<CreateOrderResult> {
  try {
    const customer = await this.userClient.getUser({ userId: command.customerId });
    
    if (!customer.success) {
      return { success: false, error: 'Customer not found' };
    }

    return { success: true, orderId: 'order-123' };
  } catch (error) {
    if (error instanceof ServiceUnavailableError) {
      return { success: false, error: 'User service temporarily unavailable' };
    }
    
    if (error instanceof CircuitBreakerOpenError) {
      return { success: false, error: 'User service is down, please try again later' };
    }

    throw error;  // Re-throw unknown errors
  }
}
```

### Pattern 4: Optional Service Calls

```typescript
async handle(command: CreateOrderCommand, user: AuthenticatedUser | null): Promise<CreateOrderResult> {
  // Required call
  const customer = await this.userClient.getUser({ userId: command.customerId });
  
  if (!customer.success) {
    return { success: false, error: 'Customer not found' };
  }

  // Optional call - don't fail if recommendation service is down
  let recommendations;
  try {
    recommendations = await this.recommendationClient.getRecommendations({
      userId: command.customerId
    });
  } catch (error) {
    Logger.warn('Failed to get recommendations (non-critical):', error as Error);
    recommendations = null;  // Continue without recommendations
  }

  // Process order with or without recommendations...
}
```

## Circuit Breaker Pattern

The platform automatically includes circuit breaker protection for all service calls.

### How It Works

```
Closed → (failures exceed threshold) → Open → (timeout expires) → Half-Open → (success) → Closed
                                        ↓                            ↓ (failure)
                                   Fail Fast                    → Open
```

### Configuration

```typescript
import { DEFAULT_CLIENT_CONFIG } from '@banyanai/platform-client-system';

const config = {
  ...DEFAULT_CLIENT_CONFIG,
  circuitBreaker: {
    failureThreshold: 5,      // Open after 5 failures
    successThreshold: 2,      // Close after 2 successes in half-open
    recoveryTimeout: 60000,   // Wait 60s before trying again
    monitoringWindow: 300000  // Track failures over 5 minutes
  }
};
```

## Retry Policies

The platform automatically retries transient failures.

### Automatic Retry

```typescript
// This automatically retries on transient failures
const result = await this.userClient.getUser({ userId: '123' });

// Retry policy:
// - 3 attempts
// - Exponential backoff: 1s, 2s, 4s
// - Jitter to prevent thundering herd
// - Smart predicates (don't retry validation errors)
```

### Configuration

```typescript
const config = {
  retryPolicy: {
    maxAttempts: 3,
    initialDelay: 1000,
    backoffMultiplier: 2,
    maxDelay: 30000,
    jitter: true
  }
};
```

## Correlation ID Propagation

All service calls automatically propagate correlation IDs for distributed tracing.

```typescript
// Correlation ID flows automatically through all service calls
async handle(command: CreateOrderCommand, user: AuthenticatedUser | null): Promise<CreateOrderResult> {
  // This call includes correlation ID from original request
  const customer = await this.userClient.getUser({ userId: command.customerId });
  
  // This call uses the same correlation ID
  const inventory = await this.inventoryClient.checkAvailability({ items: command.items });
  
  // All calls are traced together in distributed tracing UI
}
```

**View in Jaeger:** All related calls show up under the same trace ID.

## Testing with Mock Clients

```typescript
// src/commands/__tests__/CreateOrderHandler.test.ts
import { CreateOrderHandler } from '../CreateOrderHandler';
import { CreateOrderCommand } from '../../contracts/commands/CreateOrderCommand';

describe('CreateOrderHandler', () => {
  let handler: CreateOrderHandler;
  let mockUserClient: jest.Mocked<UserServiceClient>;
  let mockInventoryClient: jest.Mocked<InventoryServiceClient>;

  beforeEach(() => {
    mockUserClient = {
      getUser: jest.fn()
    } as any;

    mockInventoryClient = {
      checkAvailability: jest.fn()
    } as any;

    handler = new CreateOrderHandler(mockUserClient, mockInventoryClient);
  });

  it('should create order with valid customer and inventory', async () => {
    // Setup mocks
    mockUserClient.getUser.mockResolvedValue({
      success: true,
      user: { id: 'user-123', email: 'test@example.com' }
    });

    mockInventoryClient.checkAvailability.mockResolvedValue({
      available: true
    });

    // Execute
    const command = new CreateOrderCommand('user-123', [{ productId: 'p1', quantity: 1 }]);
    const result = await handler.handle(command, null);

    // Verify
    expect(result.success).toBe(true);
    expect(mockUserClient.getUser).toHaveBeenCalledWith({ userId: 'user-123' });
    expect(mockInventoryClient.checkAvailability).toHaveBeenCalled();
  });

  it('should handle customer not found', async () => {
    mockUserClient.getUser.mockResolvedValue({
      success: false,
      error: 'User not found'
    });

    const command = new CreateOrderCommand('invalid-user', []);
    const result = await handler.handle(command, null);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Customer not found');
  });
});
```

## Anti-Patterns to Avoid

❌ **Don't make direct HTTP calls**
```typescript
// DON'T DO THIS
const response = await fetch('http://user-service/api/users/123');
```

✅ **Use service clients**
```typescript
// DO THIS
const result = await this.userClient.getUser({ userId: '123' });
```

---

❌ **Don't manually handle retries**
```typescript
// DON'T DO THIS
let retries = 0;
while (retries < 3) {
  try {
    return await this.userClient.getUser({ userId });
  } catch (error) {
    retries++;
  }
}
```

✅ **Let platform handle retries**
```typescript
// DO THIS - automatic retry with exponential backoff
const result = await this.userClient.getUser({ userId });
```

## Related Guides

- [Command Handlers](./command-handlers.md)
- [Query Handlers](./query-handlers.md)
- [Error Handling](./error-handling.md)
- [Distributed Transactions](./distributed-transactions.md)
