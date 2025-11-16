# Commands Reference

## Overview

Commands represent **state-changing operations** that modify system state. They follow request-response pattern with exactly one handler processing each command.

## Command Characteristics

- **Intent**: Modify system state
- **Pattern**: Request-response (synchronous)
- **Handlers**: Exactly one handler per command
- **Response**: Returns result or error
- **Routing**: Direct to service queue
- **Idempotency**: Should be idempotent when possible

## Command Message Structure

### Complete Example

```json
{
  "id": "msg_abc123xyz789",
  "correlationId": "cor_def456uvw012",
  "traceContext": {
    "traceId": "0af7651916cd43dd8448eb211c80319c",
    "spanId": "b7ad6b7169203331",
    "traceFlags": "01"
  },
  "timestamp": "2025-11-15T10:30:00.123Z",
  "serviceName": "api-gateway",
  "messageType": "CreateUserCommand",
  "payload": {
    "email": "alice@example.com",
    "name": "Alice Smith",
    "role": "user"
  },
  "metadata": {
    "auth": {
      "userId": "usr_admin_123",
      "permissions": ["users:create"],
      "email": "admin@example.com",
      "name": "Admin User",
      "correlationId": "cor_def456uvw012"
    },
    "routing": {
      "priority": "normal",
      "timeout": 30000
    }
  }
}
```

## Command Naming Convention

### Pattern

```
{Verb}{Noun}Command

Examples:
- CreateUserCommand
- UpdateOrderCommand
- DeleteProductCommand
- ProcessPaymentCommand
```

### Best Practices

```typescript
// Good: Clear intent
CreateUserCommand
UpdateOrderCommand
CancelSubscriptionCommand

// Avoid: Ambiguous
HandleUserCommand  // Handle how?
DoSomethingCommand // Do what?
UserCommand        // Too generic
```

## Queue Naming

### Format

```
service.{serviceName}.commands.{CommandName}
```

### Examples

```
service.user-service.commands.CreateUser
service.order-service.commands.ProcessOrder
service.payment-service.commands.CapturePayment
```

## Sending Commands

### Basic Send

```typescript
import { messageBus } from '@banyanai/platform-message-bus-client';
import { CreateUserContract } from './contracts/UserContracts.js';

// Send command
const result = await messageBus.send(CreateUserContract, {
  email: 'alice@example.com',
  name: 'Alice Smith',
  role: 'user'
});

console.log('User created:', result.id);
```

### With Options

```typescript
// Send with custom timeout and priority
const result = await messageBus.send(
  ProcessOrderContract,
  {
    orderId: 'ord_123',
    items: [...]
  },
  {
    timeout: 60000,      // 60 seconds
    priority: 'high',    // Prioritize this message
    metadata: {
      source: 'admin-panel'
    }
  }
);
```

### Error Handling

```typescript
try {
  const result = await messageBus.send(CreateUserContract, payload);
  console.log('Success:', result);
} catch (error) {
  if (error.code === 'ValidationError') {
    console.error('Invalid input:', error.details);
  } else if (error.code === 'TimeoutError') {
    console.error('Command timed out');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Handling Commands

### Handler Implementation

```typescript
import { CommandHandler } from '@banyanai/platform-cqrs';
import { CreateUserContract } from '../contracts/UserContracts.js';

@CommandHandler(CreateUserContract)
export class CreateUserHandler {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly logger: Logger
  ) {}

  async handle(input: { email: string; name: string; role?: string }) {
    this.logger.info('Creating user', { email: input.email });

    // Validate business rules
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new BusinessRuleError('User with this email already exists');
    }

    // Create user
    const user = await this.userRepository.create({
      email: input.email,
      name: input.name,
      role: input.role || 'user'
    });

    this.logger.info('User created successfully', { userId: user.id });

    // Return result
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      createdAt: user.createdAt
    };
  }
}
```

### With Authentication Context

```typescript
@CommandHandler(CreateUserContract)
export class CreateUserHandler {
  async handle(
    input: { email: string; name: string },
    context: MessageContext
  ) {
    // Access authenticated user
    const createdBy = context.userId;
    const creatorPermissions = context.permissions;

    // Check additional permissions
    if (input.role === 'admin' && !creatorPermissions.includes('users:admin')) {
      throw new ForbiddenError('Only admins can create admin users');
    }

    const user = await this.userRepository.create({
      ...input,
      createdBy
    });

    return user;
  }
}
```

## Command Response

### Success Response

```typescript
// Handler returns data
return {
  id: 'usr_abc123',
  email: 'alice@example.com',
  name: 'Alice Smith',
  role: 'user',
  createdAt: new Date()
};

// Wrapped in envelope and sent back
{
  "id": "msg_response_xyz",
  "correlationId": "cor_def456uvw012",  // Same as command
  "timestamp": "2025-11-15T10:30:00.500Z",
  "serviceName": "user-service",
  "messageType": "CreateUserCommandResponse",
  "payload": {
    "id": "usr_abc123",
    "email": "alice@example.com",
    "name": "Alice Smith",
    "role": "user",
    "createdAt": "2025-11-15T10:30:00.400Z"
  }
}
```

### Error Response

```typescript
// Handler throws error
throw new ValidationError('Invalid email format', {
  field: 'email',
  value: input.email
});

// Error wrapped and sent back
{
  "id": "msg_response_xyz",
  "correlationId": "cor_def456uvw012",
  "timestamp": "2025-11-15T10:30:00.500Z",
  "serviceName": "user-service",
  "messageType": "CreateUserCommandResponse",
  "payload": {
    "error": {
      "code": "ValidationError",
      "message": "Invalid email format",
      "details": {
        "field": "email",
        "value": "invalid-email"
      },
      "correlationId": "cor_def456uvw012",
      "timestamp": "2025-11-15T10:30:00.500Z"
    }
  }
}
```

## Common Command Patterns

### Create Commands

```typescript
// CreateUserCommand
{
  "messageType": "CreateUserCommand",
  "payload": {
    "email": "alice@example.com",
    "name": "Alice Smith",
    "role": "user"
  }
}

// Response
{
  "id": "usr_abc123",
  "email": "alice@example.com",
  "name": "Alice Smith",
  "role": "user",
  "createdAt": "2025-11-15T10:30:00Z"
}
```

### Update Commands

```typescript
// UpdateUserCommand
{
  "messageType": "UpdateUserCommand",
  "payload": {
    "id": "usr_abc123",
    "name": "Alice Johnson",
    "role": "admin"
  }
}

// Response
{
  "id": "usr_abc123",
  "email": "alice@example.com",
  "name": "Alice Johnson",
  "role": "admin",
  "updatedAt": "2025-11-15T10:35:00Z"
}
```

### Delete Commands

```typescript
// DeleteUserCommand
{
  "messageType": "DeleteUserCommand",
  "payload": {
    "id": "usr_abc123"
  }
}

// Response (void or confirmation)
{
  "success": true,
  "id": "usr_abc123",
  "deletedAt": "2025-11-15T10:40:00Z"
}
```

### Process Commands

```typescript
// ProcessOrderCommand
{
  "messageType": "ProcessOrderCommand",
  "payload": {
    "orderId": "ord_xyz789",
    "action": "fulfill"
  }
}

// Response
{
  "orderId": "ord_xyz789",
  "status": "fulfilled",
  "fulfilledAt": "2025-11-15T10:45:00Z",
  "trackingNumber": "TRACK123456"
}
```

## Idempotency

### Implementing Idempotent Commands

```typescript
@CommandHandler(CreateUserContract)
export class CreateUserHandler {
  async handle(input: { email: string; name: string }) {
    // Check if already exists (idempotency)
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      this.logger.info('User already exists, returning existing', {
        userId: existing.id
      });
      return existing;  // Return existing instead of error
    }

    // Create new user
    const user = await this.userRepository.create(input);
    return user;
  }
}
```

### Using Idempotency Keys

```typescript
// Send with idempotency key
await messageBus.send(
  CreateUserContract,
  { email: 'alice@example.com', name: 'Alice' },
  {
    metadata: {
      idempotencyKey: 'user-create-alice-20251115'
    }
  }
);

// Handler checks idempotency key
@CommandHandler(CreateUserContract)
export class CreateUserHandler {
  async handle(input: any, context: MessageContext) {
    const key = context.metadata?.idempotencyKey;
    if (key) {
      const existing = await this.idempotencyStore.get(key);
      if (existing) return existing;
    }

    const result = await this.userRepository.create(input);

    if (key) {
      await this.idempotencyStore.set(key, result, 86400); // 24h TTL
    }

    return result;
  }
}
```

## Timeout Handling

### Setting Timeouts

```typescript
// Default timeout (30 seconds)
await messageBus.send(CreateUserContract, payload);

// Custom timeout for long-running commands
await messageBus.send(
  ProcessVideoContract,
  { videoId: 'vid_123' },
  { timeout: 300000 }  // 5 minutes
);

// Short timeout for quick operations
await messageBus.send(
  DeleteCacheContract,
  { key: 'user:123' },
  { timeout: 5000 }  // 5 seconds
);
```

### Handling Timeouts

```typescript
try {
  const result = await messageBus.send(SlowCommand, payload, {
    timeout: 10000
  });
} catch (error) {
  if (error.code === 'TimeoutError') {
    console.error('Command timed out after 10 seconds');
    // Retry or handle timeout
  }
}
```

## Best Practices

### 1. Use Descriptive Names

```typescript
// Good
CreateUserCommand
ProcessPaymentCommand
CancelSubscriptionCommand

// Avoid
UserCommand
PayCommand
SubCommand
```

### 2. Validate Input

```typescript
@CommandHandler(CreateUserContract)
export class CreateUserHandler {
  async handle(input: any) {
    // Validate required fields
    if (!input.email || !input.name) {
      throw new ValidationError('Email and name are required');
    }

    // Validate format
    if (!isValidEmail(input.email)) {
      throw new ValidationError('Invalid email format');
    }

    // Business rule validation
    if (input.role === 'admin' && !context.permissions.includes('users:admin')) {
      throw new ForbiddenError('Cannot create admin users');
    }

    // Process command
    return await this.userRepository.create(input);
  }
}
```

### 3. Return Complete Data

```typescript
// Good: Return all relevant data
return {
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
};

// Avoid: Minimal data
return { id: user.id };
```

### 4. Log Command Execution

```typescript
@CommandHandler(CreateUserContract)
export class CreateUserHandler {
  async handle(input: any) {
    this.logger.info('Executing CreateUserCommand', {
      email: input.email,
      role: input.role
    });

    const user = await this.userRepository.create(input);

    this.logger.info('CreateUserCommand completed', {
      userId: user.id
    });

    return user;
  }
}
```

### 5. Use Transactions

```typescript
@CommandHandler(TransferMoneyCommand)
export class TransferMoneyHandler {
  async handle(input: { fromAccount: string; toAccount: string; amount: number }) {
    return await this.database.transaction(async (tx) => {
      // Debit source
      await tx.execute('UPDATE accounts SET balance = balance - $1 WHERE id = $2', [
        input.amount,
        input.fromAccount
      ]);

      // Credit destination
      await tx.execute('UPDATE accounts SET balance = balance + $1 WHERE id = $2', [
        input.amount,
        input.toAccount
      ]);

      return { success: true };
    });
  }
}
```

## Related References

- [Queries Reference](./queries.md)
- [Events Reference](./events.md)
- [Routing Reference](./routing.md)
- [Message Protocols Overview](./overview.md)
