# Writing Command Handlers

## Use this guide if...

- You need to implement create, update, or delete operations
- You're building write operations that change system state
- You want to understand command validation and error handling
- You need to publish domain events from state changes

## Quick Example

```typescript
// src/commands/CreateUserHandler.ts
import { CommandHandler, CommandHandlerDecorator, BaseService } from '@banyanai/platform-base-service';
import type { AuthenticatedUser } from '@banyanai/platform-core';
import { CreateUserCommand, type CreateUserResult } from '../contracts/commands/CreateUserCommand.js';
import { User } from '../domain/User.js';

@CommandHandlerDecorator(CreateUserCommand)
export class CreateUserHandler extends CommandHandler<CreateUserCommand, CreateUserResult> {
  async handle(
    command: CreateUserCommand,
    user: AuthenticatedUser | null
  ): Promise<CreateUserResult> {
    try {
      // 1. Validate command
      const validation = await this.validateCommand(command);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          validationErrors: validation.errors
        };
      }

      // 2. Create domain aggregate (enforces business rules)
      const newUser = User.create({
        email: command.email,
        passwordHash: await this.hashPassword(command.password),
        profile: command.profile,
        isActive: true,
        emailVerified: false,
        failedLoginAttempts: 0,
        createdBy: user?.userId
      });

      // 3. Persist events
      const eventStore = BaseService.getEventStore();
      await eventStore.append(newUser.id, newUser.getUncommittedEvents());

      // 4. Return success
      return {
        success: true,
        userId: newUser.id,
        email: newUser.email
      };
    } catch (error) {
      Logger.error('Failed to create user:', error as Error);
      return {
        success: false,
        error: 'Failed to create user due to server error'
      };
    }
  }

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

  private async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcrypt');
    return bcrypt.hash(password, 12);
  }
}
```

## Step-by-Step Guide

### Step 1: Define the Contract

Commands represent write operations with clear inputs and outputs.

```typescript
// src/contracts/commands/CreateUserCommand.ts
import { Command, Sensitive } from '@banyanai/platform-contract-system';

@Command({
  description: 'Creates a new user account',
  permissions: ['auth:create-user']  // Layer 1 authorization
})
export class CreateUserCommand {
  @Sensitive()  // Automatically redacted in logs
  email: string;

  @Sensitive()
  password: string;

  profile: UserProfile;

  // Optional fields
  initialRoles?: string[];
  skipEmailVerification?: boolean;
  createdBy?: string;

  constructor(
    email: string,
    password: string,
    profile: UserProfile,
    initialRoles?: string[],
    skipEmailVerification = false,
    createdBy?: string
  ) {
    this.email = email;
    this.password = password;
    this.profile = profile;
    this.initialRoles = initialRoles;
    this.skipEmailVerification = skipEmailVerification;
    this.createdBy = createdBy;
  }
}

export interface CreateUserResult {
  success: boolean;
  userId?: string;
  email?: string;
  error?: string;
  validationErrors?: Array<{
    field: string;
    message: string;
  }>;
}
```

**Key points:**
- Use `@Command()` decorator with permissions
- Mark sensitive fields with `@Sensitive()`
- Define clear result type
- Include validation error structure

### Step 2: Create the Domain Aggregate

Aggregates enforce business rules and emit domain events.

```typescript
// src/domain/User.ts
import { Aggregate, AggregateRoot } from '@banyanai/platform-domain-modeling';

@Aggregate('User')
export class User extends AggregateRoot {
  private constructor(private props: UserProps) {
    super(props.id || '', 'User');
    this.validateInvariants();
  }

  static create(props: Omit<UserProps, 'id' | 'createdAt' | 'updatedAt'>): User {
    const id = uuidv4();
    const now = new Date();

    const user = new User({
      ...props,
      id,
      roles: [],
      permissions: [],
      createdAt: now,
      updatedAt: now
    });

    // Raise domain event - automatically persisted
    user.raiseEvent('UserCreated', {
      email: props.email,
      createdAt: now,
      initialRoles: []
    });

    return user;
  }

  private validateInvariants(): void {
    if (!this.props.email || !this.isValidEmail(this.props.email)) {
      throw new Error('Valid email is required');
    }

    if (!this.props.passwordHash) {
      throw new Error('Password hash is required');
    }
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
```

**See:** [Data Management - Aggregates](../data-management/aggregates.md) for complete guide

### Step 3: Implement the Handler

```typescript
// src/commands/CreateUserHandler.ts
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
      this.logger.info('Creating new user account', {
        email: command.email,  // @Sensitive fields auto-redacted
        hasProfile: !!command.profile,
        createdBy: command.createdBy
      });

      // Validate input
      const validation = await this.validateCommand(command);
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Validation failed',
          validationErrors: validation.errors
        };
      }

      // Check for duplicates (using read model)
      const existingUser = await UserReadModel.findByEmail(command.email);
      if (existingUser) {
        return {
          success: false,
          error: 'User with this email already exists',
          validationErrors: [
            { field: 'email', message: 'A user with this email address already exists' }
          ]
        };
      }

      // Hash password
      const passwordHash = await this.hashPassword(command.password);

      // Create aggregate (enforces business rules)
      const newUser = User.create({
        email: command.email.toLowerCase().trim(),
        passwordHash,
        profile: command.profile,
        isActive: true,
        emailVerified: command.skipEmailVerification || false,
        failedLoginAttempts: 0,
        createdBy: command.createdBy
      });

      // Get event store from BaseService
      const eventStore = BaseService.getEventStore();
      if (!eventStore) {
        throw new Error('Event store not initialized');
      }

      // Persist events
      await eventStore.append(newUser.id, [...newUser.getUncommittedEvents()] as any);

      this.logger.info('User account created successfully', {
        userId: newUser.id,
        emailVerified: newUser.emailVerified
      });

      return {
        success: true,
        userId: newUser.id,
        email: newUser.email
      };
    } catch (error) {
      this.logger.error('Failed to create user account:', error as Error, {
        email: command.email
      });

      return {
        success: false,
        error: 'Failed to create user account due to server error'
      };
    }
  }

  private async validateCommand(command: CreateUserCommand): Promise<{
    isValid: boolean;
    errors: Array<{ field: string; message: string }>;
  }> {
    const errors: Array<{ field: string; message: string }> = [];

    // Email validation
    if (!command.email || typeof command.email !== 'string') {
      errors.push({ field: 'email', message: 'Email is required' });
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(command.email.trim())) {
        errors.push({ field: 'email', message: 'Valid email address is required' });
      }
    }

    // Password validation
    if (!command.password || typeof command.password !== 'string') {
      errors.push({ field: 'password', message: 'Password is required' });
    } else if (command.password.length < 8) {
      errors.push({ field: 'password', message: 'Password must be at least 8 characters long' });
    }

    // Profile validation
    if (!command.profile || typeof command.profile !== 'object') {
      errors.push({ field: 'profile', message: 'User profile is required' });
    }

    return { isValid: errors.length === 0, errors };
  }

  private async hashPassword(password: string): Promise<string> {
    const bcrypt = await import('bcrypt');
    return bcrypt.hash(password, 12);
  }
}
```

### Step 4: Place in Commands Folder

The platform auto-discovers handlers by folder:

```
src/
└── commands/
    └── CreateUserHandler.ts  ← Platform finds this automatically
```

**No manual registration needed!**

## Common Patterns

### Pattern 1: Update Commands

```typescript
@CommandHandlerDecorator(UpdateUserProfileCommand)
export class UpdateUserProfileHandler extends CommandHandler<UpdateUserProfileCommand, UpdateUserProfileResult> {
  async handle(
    command: UpdateUserProfileCommand,
    user: AuthenticatedUser | null
  ): Promise<UpdateUserProfileResult> {
    try {
      // Get event store
      const eventStore = BaseService.getEventStore();

      // Load aggregate from event stream
      const events = await eventStore.getEvents(command.userId);
      const existingUser = User.fromEvents(events);

      // Execute business logic
      existingUser.updateProfile(command.profile, user?.userId || 'system');

      // Persist new events
      await eventStore.append(existingUser.id, existingUser.getUncommittedEvents());

      return { success: true, userId: existingUser.id };
    } catch (error) {
      Logger.error('Failed to update user profile:', error as Error);
      return { success: false, error: 'Failed to update profile' };
    }
  }
}
```

### Pattern 2: Delete Commands

```typescript
@CommandHandlerDecorator(DeactivateUserCommand)
export class DeactivateUserHandler extends CommandHandler<DeactivateUserCommand, DeactivateUserResult> {
  async handle(
    command: DeactivateUserCommand,
    user: AuthenticatedUser | null
  ): Promise<DeactivateUserResult> {
    try {
      const eventStore = BaseService.getEventStore();

      // Load aggregate
      const events = await eventStore.getEvents(command.userId);
      const existingUser = User.fromEvents(events);

      // Soft delete via deactivation
      existingUser.deactivate(user?.userId || 'system', command.reason);

      // Persist events
      await eventStore.append(existingUser.id, existingUser.getUncommittedEvents());

      return { success: true };
    } catch (error) {
      Logger.error('Failed to deactivate user:', error as Error);
      return { success: false, error: 'Failed to deactivate user' };
    }
  }
}
```

### Pattern 3: Commands with Service Clients

```typescript
@CommandHandlerDecorator(CreateOrderCommand)
export class CreateOrderHandler extends CommandHandler<CreateOrderCommand, CreateOrderResult> {
  constructor(
    private userClient: UserServiceClient  // Auto-injected by BaseService
  ) {
    super();
  }

  async handle(
    command: CreateOrderCommand,
    user: AuthenticatedUser | null
  ): Promise<CreateOrderResult> {
    try {
      // Call other service
      const customer = await this.userClient.getUser({ userId: command.customerId });

      if (!customer.success) {
        return { success: false, error: 'Customer not found' };
      }

      // Create order
      const order = Order.create(command.customerId, command.items);

      const eventStore = BaseService.getEventStore();
      await eventStore.append(order.id, order.getUncommittedEvents());

      return { success: true, orderId: order.id };
    } catch (error) {
      Logger.error('Failed to create order:', error as Error);
      return { success: false, error: 'Failed to create order' };
    }
  }
}
```

### Pattern 4: Layer 2 Authorization

```typescript
async handle(
  command: CreateOrderCommand,
  user: AuthenticatedUser | null
): Promise<CreateOrderResult> {
  // Layer 2: Business policy checks
  if (command.totalAmount > 10000 && !user?.permissions.includes('order:approve-large')) {
    return {
      success: false,
      error: 'Orders over $10,000 require approval permission'
    };
  }

  if (command.customerId !== user?.userId && !user?.permissions.includes('order:create-for-others')) {
    return {
      success: false,
      error: 'You can only create orders for yourself'
    };
  }

  // Continue with order creation...
}
```

### Pattern 5: Idempotency

```typescript
async handle(
  command: CreatePaymentCommand,
  user: AuthenticatedUser | null
): Promise<CreatePaymentResult> {
  // Check idempotency key
  const existing = await PaymentReadModel.findByIdempotencyKey(command.idempotencyKey);
  if (existing) {
    return {
      success: true,
      paymentId: existing.id,
      alreadyProcessed: true
    };
  }

  // Process payment...
  const payment = Payment.create(command.orderId, command.amount, command.idempotencyKey);

  const eventStore = BaseService.getEventStore();
  await eventStore.append(payment.id, payment.getUncommittedEvents());

  return { success: true, paymentId: payment.id };
}
```

## Validation Best Practices

### Input Validation

```typescript
private async validateCommand(command: CreateUserCommand): Promise<{
  isValid: boolean;
  errors: Array<{ field: string; message: string }>;
}> {
  const errors: Array<{ field: string; message: string }> = [];

  // Required field validation
  if (!command.email) {
    errors.push({ field: 'email', message: 'Email is required' });
  }

  // Format validation
  if (command.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(command.email)) {
    errors.push({ field: 'email', message: 'Valid email address is required' });
  }

  // Type validation
  if (typeof command.profile !== 'object' || command.profile === null) {
    errors.push({ field: 'profile', message: 'Profile must be an object' });
  }

  // Array validation
  if (command.initialRoles && !Array.isArray(command.initialRoles)) {
    errors.push({ field: 'initialRoles', message: 'Initial roles must be an array' });
  }

  return { isValid: errors.length === 0, errors };
}
```

### Business Rule Validation

```typescript
// Let aggregates enforce business rules
const order = Order.create(command.customerId, command.items);
// ↑ Throws error if business rules violated

// Or handle in handler
if (command.items.length === 0) {
  return {
    success: false,
    error: 'Order must have at least one item',
    validationErrors: [
      { field: 'items', message: 'At least one item is required' }
    ]
  };
}
```

## Error Handling

### Standard Error Pattern

```typescript
async handle(
  command: CreateUserCommand,
  user: AuthenticatedUser | null
): Promise<CreateUserResult> {
  try {
    // Command logic here

    return { success: true, userId: newUser.id };
  } catch (error) {
    // Log error with context
    Logger.error('Failed to create user:', error as Error, {
      email: command.email,
      createdBy: command.createdBy
    });

    // Return user-friendly error
    return {
      success: false,
      error: 'Failed to create user due to server error'
    };
  }
}
```

### Specific Error Handling

```typescript
try {
  await eventStore.append(user.id, user.getUncommittedEvents());
} catch (error) {
  if (error instanceof ConcurrencyError) {
    return {
      success: false,
      error: 'User was modified by another process. Please retry.'
    };
  }

  if (error instanceof ValidationError) {
    return {
      success: false,
      error: error.message,
      validationErrors: error.errors
    };
  }

  throw error; // Re-throw unknown errors
}
```

## Testing

```typescript
// src/commands/__tests__/CreateUserHandler.test.ts
import { CreateUserHandler } from '../CreateUserHandler';
import { CreateUserCommand } from '../../contracts/commands/CreateUserCommand';
import { mockEventStore, mockReadModelManager } from '../../test-setup';

describe('CreateUserHandler', () => {
  let handler: CreateUserHandler;

  beforeEach(() => {
    handler = new CreateUserHandler();
    mockEventStore.reset();
    mockReadModelManager.reset();
  });

  it('should create user with valid input', async () => {
    const command = new CreateUserCommand(
      'test@example.com',
      'SecurePass123!',
      { firstName: 'Test', lastName: 'User' }
    );

    const result = await handler.handle(command, null);

    expect(result.success).toBe(true);
    expect(result.userId).toBeDefined();
    expect(result.email).toBe('test@example.com');

    // Verify events saved
    const events = mockEventStore.getAllEvents(result.userId!);
    expect(events[0].type).toBe('UserCreated');
  });

  it('should reject invalid email', async () => {
    const command = new CreateUserCommand(
      'invalid-email',
      'SecurePass123!',
      { firstName: 'Test', lastName: 'User' }
    );

    const result = await handler.handle(command, null);

    expect(result.success).toBe(false);
    expect(result.validationErrors).toContainEqual({
      field: 'email',
      message: 'Valid email address is required'
    });
  });

  it('should reject duplicate email', async () => {
    mockReadModelManager.seed(
      UserReadModel,
      'existing-user-id',
      {
        id: 'existing-user-id',
        email: 'existing@example.com',
        isActive: true
      }
    );

    const command = new CreateUserCommand(
      'existing@example.com',
      'SecurePass123!',
      { firstName: 'Test', lastName: 'User' }
    );

    const result = await handler.handle(command, null);

    expect(result.success).toBe(false);
    expect(result.error).toBe('User with this email already exists');
  });
});
```

**See:** [testing-handlers.md](./testing-handlers.md) for complete guide

## Anti-Patterns to Avoid

❌ **Don't use old decorator names**
```typescript
// DON'T DO THIS
@CommandHandler(CreateUserCommand)  // Wrong!
```

✅ **Use correct decorator**
```typescript
// DO THIS
@CommandHandlerDecorator(CreateUserCommand)
```

---

❌ **Don't forget user parameter**
```typescript
// DON'T DO THIS
async handle(command: CreateUserCommand): Promise<CreateUserResult> { }
```

✅ **Always include user parameter**
```typescript
// DO THIS
async handle(command: CreateUserCommand, user: AuthenticatedUser | null): Promise<CreateUserResult> { }
```

---

❌ **Don't persist aggregates directly**
```typescript
// DON'T DO THIS
await database.save(user);  // Wrong!
```

✅ **Persist events**
```typescript
// DO THIS
await eventStore.append(user.id, user.getUncommittedEvents());
```

---

❌ **Don't return raw errors to users**
```typescript
// DON'T DO THIS
return { success: false, error: error.stack };
```

✅ **Return user-friendly messages**
```typescript
// DO THIS
Logger.error('Failed to create user:', error as Error);
return { success: false, error: 'Failed to create user due to server error' };
```

## Related Guides

- [Query Handlers](./query-handlers.md) - Read operations
- [Event Handlers](./event-handlers.md) - Reacting to events
- [Service Clients](./service-clients.md) - Calling other services
- [Data Management - Aggregates](../data-management/aggregates.md) - Domain modeling
- [Error Handling](./error-handling.md) - Comprehensive error patterns
- [Testing Handlers](./testing-handlers.md) - Testing strategies
