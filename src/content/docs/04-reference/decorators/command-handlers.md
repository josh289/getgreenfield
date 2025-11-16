---
title: Command Handler Decorators
description: Complete reference for command handler decorators and patterns
category: decorators
tags: [decorators, commands, handlers, cqrs, typescript]
related:
  - ./query-handlers.md
  - ./event-handlers.md
  - ./contracts.md
  - ../platform-packages/base-service.md
difficulty: intermediate
aliases:
  - "@CommandHandler"
  - command handler decorator
  - command handler syntax
  - command handler reference
relatedConcepts:
  - CQRS pattern
  - command processing
  - handler registration
  - state modification
  - command validation
commonQuestions:
  - What parameters does @CommandHandler take?
  - How do I create a command handler?
  - What's the syntax for command handlers?
  - Do command handlers need to be exported?
  - Can command handlers return values?
  - How do I validate commands?
---

# Command Handler Decorators

Complete reference for decorators used in command handlers. Commands represent state-changing operations in the system.

## @CommandHandler

Registers a class as a handler for a specific command type.

### Signature

```typescript
function CommandHandler(commandType: any): ClassDecorator
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `commandType` | `class \| string` | Yes | The command class or type name this handler processes |

### Usage

```typescript
import { CommandHandler } from '@banyanai/platform-base-service';
import { CreateUserCommand } from './commands/CreateUserCommand';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler {
  async handle(command: CreateUserCommand, context: CommandContext): Promise<UserDto> {
    // Command handling logic
    return { userId: 'user-123', email: command.email };
  }
}
```

### With String Type Name

```typescript
@CommandHandler('CreateUserCommand')
export class CreateUserHandler {
  async handle(command: CreateUserCommand, context: CommandContext): Promise<UserDto> {
    // Handler implementation
  }
}
```

### Handler Discovery

The platform automatically discovers command handlers by:

1. **Folder Convention**: Handlers in `/commands/` directory
2. **Decorator Metadata**: Classes with `@CommandHandler` decorator
3. **Naming Pattern**: Classes ending with `Handler` (optional)

### Handler Interface

Command handlers must implement the following interface:

```typescript
interface ICommandHandler<TCommand, TResult> {
  handle(command: TCommand, context: CommandContext): Promise<TResult>;
}
```

### Command Context

The context parameter provides access to:

```typescript
interface CommandContext {
  userId: string;
  permissions: string[];
  correlationId: string;
  timestamp: Date;
  metadata: Record<string, unknown>;
}
```

## @RequiresPermissions

Declares permissions required to execute the command handler (Layer 1 authorization).

### Signature

```typescript
function RequiresPermissions(permissions: string | string[]): ClassDecorator
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `permissions` | `string \| string[]` | Yes | Permission(s) required to execute handler |

### Usage

#### Single Permission

```typescript
import { CommandHandler, RequiresPermissions } from '@banyanai/platform-base-service';

@CommandHandler(CreateUserCommand)
@RequiresPermissions('users:create')
export class CreateUserHandler {
  async handle(command: CreateUserCommand, context: CommandContext): Promise<UserDto> {
    // User has 'users:create' permission
  }
}
```

#### Multiple Permissions (OR Logic)

```typescript
@CommandHandler(UpdateUserCommand)
@RequiresPermissions(['users:update', 'admin:all'])
export class UpdateUserHandler {
  async handle(command: UpdateUserCommand, context: CommandContext): Promise<UserDto> {
    // User has EITHER 'users:update' OR 'admin:all' permission
  }
}
```

### Permission Format

Permissions follow the `resource:action` pattern:

```typescript
'users:create'      // Create users
'users:read'        // Read user data
'users:update'      // Update users
'users:delete'      // Delete users
'orders:approve'    // Approve orders
'admin:all'         // All admin permissions
```

### Validation

The API Gateway validates permissions before sending commands to handlers:

```
1. Extract permissions from JWT token
2. Compare with @RequiresPermissions decorator
3. Reject if permissions missing (403 Forbidden)
4. Send command to handler if permissions match
```

## @RequirePolicy

Declares business policy that must be satisfied (Layer 2 authorization).

### Signature

```typescript
function RequirePolicy(policyName: string): ClassDecorator
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `policyName` | `string` | Yes | Name of the policy class or method |

### Usage

#### With Policy Class

```typescript
// Policy class (co-located with handler)
export class UpdateOwnProfilePolicy {
  static canExecute(user: AuthenticatedUser, command: UpdateUserCommand): boolean {
    // Users can only update their own profile (unless admin)
    return user.permissions.includes('admin:all') || user.userId === command.userId;
  }
}

// Handler with policy
@CommandHandler(UpdateUserCommand)
@RequiresPermissions('users:update')
@RequirePolicy('UpdateOwnProfilePolicy')
export class UpdateUserHandler {
  async handle(command: UpdateUserCommand, context: CommandContext): Promise<UserDto> {
    // Policy already validated - safe to proceed
  }
}
```

### Policy Method Signature

Policy methods must have this signature:

```typescript
static canExecute(
  user: AuthenticatedUser,
  command: TCommand
): boolean | Promise<boolean>
```

Where `AuthenticatedUser` contains:

```typescript
interface AuthenticatedUser {
  userId: string;
  email: string;
  name: string;
  permissions: string[];
}
```

### Policy Evaluation

Policies are evaluated after permission checks:

```
1. API Gateway checks permissions (Layer 1)
2. Command sent to service via message bus
3. BaseService evaluates policy (Layer 2)
4. Handler executed if policy passes
5. 403 Forbidden if policy fails
```

## @Cacheable

Not typically used for command handlers (commands change state and shouldn't be cached).

See [Query Handler Decorators](./query-handlers.md#cacheable) for caching documentation.

## Complete Example

### Command Definition

```typescript
import { Command } from '@banyanai/platform-contract-system';

@Command({
  description: 'Create a new user account',
  permissions: ['users:create']
})
export class CreateUserCommand {
  email!: string;
  firstName!: string;
  lastName?: string;
  role?: 'admin' | 'user';
}
```

### Handler Implementation

```typescript
import {
  CommandHandler,
  RequiresPermissions,
  RequirePolicy,
} from '@banyanai/platform-base-service';

// Policy: Only admins can create admin users
export class AdminCreationPolicy {
  static canExecute(user: AuthenticatedUser, command: CreateUserCommand): boolean {
    if (command.role === 'admin') {
      return user.permissions.includes('admin:all');
    }
    return true; // Non-admin users can be created by anyone with users:create
  }
}

@CommandHandler(CreateUserCommand)
@RequiresPermissions('users:create')
@RequirePolicy('AdminCreationPolicy')
export class CreateUserHandler {
  constructor(
    private userRepository: UserRepository,
    private eventBus: EventBus
  ) {}

  async handle(
    command: CreateUserCommand,
    context: CommandContext
  ): Promise<UserDto> {
    // Validate email uniqueness
    const existing = await this.userRepository.findByEmail(command.email);
    if (existing) {
      throw new ValidationError('Email already exists');
    }

    // Create user aggregate
    const user = new UserAggregate({
      email: command.email,
      firstName: command.firstName,
      lastName: command.lastName,
      role: command.role || 'user',
    });

    // Save to repository
    await this.userRepository.save(user);

    // Publish domain event
    await this.eventBus.publish(new UserCreatedEvent({
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
    }));

    // Return DTO
    return {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
}
```

## Common Patterns

### No Authorization Required

Public commands don't need permission decorators:

```typescript
@CommandHandler(RegisterUserCommand)
export class RegisterUserHandler {
  // No @RequiresPermissions - public endpoint
  async handle(command: RegisterUserCommand, context: CommandContext): Promise<UserDto> {
    // Handle user registration
  }
}
```

### Admin-Only Commands

```typescript
@CommandHandler(DeleteUserCommand)
@RequiresPermissions('admin:all')
export class DeleteUserHandler {
  async handle(command: DeleteUserCommand, context: CommandContext): Promise<void> {
    // Only admins can execute this
  }
}
```

### Self-Service Commands

```typescript
export class SelfServicePolicy {
  static canExecute(user: AuthenticatedUser, command: UpdateProfileCommand): boolean {
    return user.userId === command.userId;
  }
}

@CommandHandler(UpdateProfileCommand)
@RequiresPermissions('users:update')
@RequirePolicy('SelfServicePolicy')
export class UpdateProfileHandler {
  // Users can only update their own profile
}
```

### Command with Dependencies

```typescript
@CommandHandler(ProcessPaymentCommand)
@RequiresPermissions('payments:process')
export class ProcessPaymentHandler {
  constructor(
    private paymentGateway: PaymentGateway,
    private orderRepository: OrderRepository,
    private eventBus: EventBus
  ) {}

  async handle(command: ProcessPaymentCommand, context: CommandContext): Promise<PaymentDto> {
    // Dependencies auto-injected by platform
  }
}
```

## Metadata Retrieval

Access decorator metadata programmatically:

```typescript
import { DecoratorMetadata } from '@banyanai/platform-base-service';

// Get required permissions
const permissions = DecoratorMetadata.getRequiredPermissions(CreateUserHandler);
console.log(permissions); // ['users:create']

// Get required policy
const policy = DecoratorMetadata.getRequiredPolicy(UpdateUserHandler);
console.log(policy); // 'UpdateOwnProfilePolicy'

// Get handler type
const handlerType = DecoratorMetadata.getHandlerType(CreateUserHandler);
console.log(handlerType); // { type: 'command', messageType: 'CreateUserCommand' }
```

## Testing

### Unit Testing Handlers

```typescript
describe('CreateUserHandler', () => {
  let handler: CreateUserHandler;
  let userRepository: jest.Mocked<UserRepository>;
  let eventBus: jest.Mocked<EventBus>;

  beforeEach(() => {
    userRepository = {
      save: jest.fn(),
      findByEmail: jest.fn(),
    } as any;

    eventBus = {
      publish: jest.fn(),
    } as any;

    handler = new CreateUserHandler(userRepository, eventBus);
  });

  it('should create user successfully', async () => {
    const command: CreateUserCommand = {
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
    };

    const context: CommandContext = {
      userId: 'admin-123',
      permissions: ['users:create'],
      correlationId: 'test-correlation-id',
      timestamp: new Date(),
      metadata: {},
    };

    const result = await handler.handle(command, context);

    expect(result.email).toBe('test@example.com');
    expect(userRepository.save).toHaveBeenCalled();
    expect(eventBus.publish).toHaveBeenCalled();
  });

  it('should reject duplicate email', async () => {
    userRepository.findByEmail.mockResolvedValue({ id: 'existing-user' });

    const command: CreateUserCommand = {
      email: 'existing@example.com',
      firstName: 'John',
    };

    await expect(handler.handle(command, context)).rejects.toThrow('Email already exists');
  });
});
```

### Testing Policies

```typescript
describe('AdminCreationPolicy', () => {
  it('should allow admin to create admin users', () => {
    const user: AuthenticatedUser = {
      userId: 'admin-123',
      email: 'admin@example.com',
      name: 'Admin User',
      permissions: ['admin:all'],
    };

    const command: CreateUserCommand = {
      email: 'newadmin@example.com',
      firstName: 'New',
      role: 'admin',
    };

    expect(AdminCreationPolicy.canExecute(user, command)).toBe(true);
  });

  it('should reject non-admin creating admin users', () => {
    const user: AuthenticatedUser = {
      userId: 'user-123',
      email: 'user@example.com',
      name: 'Regular User',
      permissions: ['users:create'],
    };

    const command: CreateUserCommand = {
      email: 'newadmin@example.com',
      firstName: 'New',
      role: 'admin',
    };

    expect(AdminCreationPolicy.canExecute(user, command)).toBe(false);
  });
});
```

## Best Practices

### DO:

- ✅ Use descriptive handler names (`CreateUserHandler`, not `UserHandler`)
- ✅ Place handlers in `/commands/` directory for auto-discovery
- ✅ Declare required permissions with `@RequiresPermissions`
- ✅ Use policies for business rule authorization
- ✅ Return DTOs, not domain entities
- ✅ Publish domain events after state changes
- ✅ Validate input in handlers (double validation with contracts)

### DON'T:

- ❌ Don't cache command results (commands change state)
- ❌ Don't put HTTP-specific code in handlers
- ❌ Don't handle multiple command types in one handler
- ❌ Don't return domain aggregates directly
- ❌ Don't skip permission/policy decorators for protected operations
- ❌ Don't perform queries in command handlers (use CQRS separation)

## Next Steps

- **[Query Handler Decorators](./query-handlers.md)** - Read operation handlers
- **[Event Handler Decorators](./event-handlers.md)** - Event subscription handlers
- **[Contract Decorators](./contracts.md)** - Command contract definitions
- **[BaseService Package](../platform-packages/base-service.md)** - Service infrastructure
