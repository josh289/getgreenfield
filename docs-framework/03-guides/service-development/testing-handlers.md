# Testing Handlers

## Use this guide if...

- You need to test command, query, or event handlers
- You want to understand the platform's testing infrastructure
- You need to achieve 90%+ code coverage requirement
- You're writing integration tests for multi-handler workflows

## Quick Example

```typescript
// src/commands/__tests__/CreateUserHandler.test.ts
import { CreateUserHandler } from '../CreateUserHandler';
import { CreateUserCommand } from '../../contracts/commands/CreateUserCommand';
import { mockEventStore, mockReadModelManager } from '../../test-setup';
import { UserReadModel } from '../../read-models/UserReadModel';
import bcrypt from 'bcrypt';

// Mock bcrypt
(bcrypt.hash as jest.Mock) = jest.fn().mockResolvedValue('hashed-password');

describe('CreateUserHandler', () => {
  let handler: CreateUserHandler;

  beforeEach(() => {
    handler = new CreateUserHandler();
    jest.clearAllMocks();
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
});
```

## Testing Infrastructure

### Mock Event Store

```typescript
import { mockEventStore } from '../test-setup';

beforeEach(() => {
  mockEventStore.reset();
});

it('should save events', async () => {
  // Your handler code saves events
  const result = await handler.handle(command, null);

  // Verify events saved
  const events = mockEventStore.getAllEvents(result.userId!);
  expect(events).toHaveLength(1);
  expect(events[0].type).toBe('UserCreated');
  expect(events[0].data.email).toBe('test@example.com');
});
```

### Mock Read Model Manager

```typescript
import { mockReadModelManager } from '../test-setup';

beforeEach(() => {
  mockReadModelManager.reset();
});

it('should check for existing users', async () => {
  // Seed read model with existing data
  mockReadModelManager.seed(
    UserReadModel,
    'existing-user-id',
    {
      id: 'existing-user-id',
      email: 'existing@example.com',
      isActive: true,
      emailVerified: true,
      failedLoginAttempts: 0,
      profile: { firstName: 'Existing', lastName: 'User' },
      roles: [],
      directPermissions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  );

  // Test duplicate detection
  const command = new CreateUserCommand(
    'existing@example.com',
    'password',
    { firstName: 'Test', lastName: 'User' }
  );

  const result = await handler.handle(command, null);

  expect(result.success).toBe(false);
  expect(result.error).toBe('User with this email already exists');
});
```

## Testing Patterns

### Pattern 1: Command Handler Tests

```typescript
describe('CreateUserHandler', () => {
  it('should create user with valid input', async () => {
    const command = new CreateUserCommand(...);
    const result = await handler.handle(command, null);
    expect(result.success).toBe(true);
  });

  it('should validate input', async () => {
    const command = new CreateUserCommand('invalid-email', ...);
    const result = await handler.handle(command, null);
    expect(result.success).toBe(false);
  });

  it('should check business rules', async () => {
    // Test duplicate detection, authorization, etc.
  });

  it('should handle errors gracefully', async () => {
    mockEventStore.append = jest.fn().mockRejectedValue(new Error('DB error'));
    const result = await handler.handle(command, null);
    expect(result.success).toBe(false);
  });
});
```

### Pattern 2: Query Handler Tests

```typescript
describe('GetUserHandler', () => {
  it('should retrieve user by ID', async () => {
    mockReadModelManager.seed(UserReadModel, 'user-123', {...});
    
    const query = new GetUserQuery('user-123');
    const result = await handler.handle(query, null);
    
    expect(result.success).toBe(true);
    expect(result.user?.id).toBe('user-123');
  });

  it('should return error for non-existent user', async () => {
    const query = new GetUserQuery('non-existent');
    const result = await handler.handle(query, null);
    
    expect(result.success).toBe(false);
    expect(result.error).toBe('User not found');
  });
});
```

### Pattern 3: Event Handler Tests

```typescript
describe('SendWelcomeEmailHandler', () => {
  let mockEmailClient: jest.Mocked<EmailServiceClient>;

  beforeEach(() => {
    mockEmailClient = {
      sendEmail: jest.fn().mockResolvedValue({ success: true })
    } as any;

    handler = new SendWelcomeEmailHandler(mockEmailClient);
  });

  it('should send email when user is created', async () => {
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
      data: { userId: 'user-123' }
    });
  });
});
```

### Pattern 4: Service Client Mocking

```typescript
describe('CreateOrderHandler', () => {
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
    mockUserClient.getUser.mockResolvedValue({
      success: true,
      user: { id: 'user-123', email: 'test@example.com' }
    });

    mockInventoryClient.checkAvailability.mockResolvedValue({
      available: true
    });

    const command = new CreateOrderCommand('user-123', [...]);
    const result = await handler.handle(command, null);

    expect(result.success).toBe(true);
    expect(mockUserClient.getUser).toHaveBeenCalledWith({ userId: 'user-123' });
  });
});
```

## Coverage Requirements

The platform requires 90%+ coverage:

```bash
pnpm run test -- --coverage
```

### What to Test

✅ **Do test:**
- Happy path (valid inputs produce expected outputs)
- Validation (invalid inputs produce errors)
- Business rules (domain logic enforced)
- Error handling (graceful degradation)
- Edge cases (empty arrays, null values, etc.)

❌ **Don't test:**
- Platform infrastructure (already tested)
- External libraries (assume they work)
- Mock implementations (test your code, not mocks)

## Related Guides

- [Command Handlers](./command-handlers.md)
- [Query Handlers](./query-handlers.md)
- [Event Handlers](./event-handlers.md)
