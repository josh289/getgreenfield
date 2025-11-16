---
title: Testing Services
description: Comprehensive testing patterns for commands, queries, and events with 90%+ coverage
category: Service Development
tags: [testing, jest, unit-tests, integration-tests, coverage, quality]
difficulty: intermediate
last_updated: 2025-01-15
applies_to: ["v1.0.0+"]
related:
  - writing-handlers.md
  - using-service-clients.md
  - data-access-patterns.md
---

# Testing Services

The Banyan Platform uses Jest for testing with strict 90%+ coverage requirements. Tests focus on message-based communication, not HTTP endpoints.

## Use This Guide If...

- You're writing tests for your handlers
- You need to meet the 90%+ coverage requirement
- You're mocking service clients for unit tests
- You want to write integration tests via message bus
- You're testing event-sourced aggregates

## Quick Example

```typescript
import { CreateUserHandler } from './CreateUserHandler';
import { CreateUserCommand } from '../contracts/commands';
import type { AuthenticatedUser } from '@banyanai/platform-core';

describe('CreateUserHandler', () => {
  it('should create user successfully', async () => {
    // Arrange
    const handler = new CreateUserHandler();
    const command = new CreateUserCommand();
    command.email = 'test@example.com';
    command.firstName = 'John';
    command.lastName = 'Doe';

    const user: AuthenticatedUser = {
      userId: 'admin-123',
      email: 'admin@example.com',
      name: 'Admin User',
      permissions: ['users:create']
    };

    // Act
    const result = await handler.handle(command, user);

    // Assert
    expect(result.userId).toBeDefined();
    expect(result.email).toBe('test@example.com');
    expect(result.createdAt).toBeDefined();
  });
});
```

## Test Framework Setup

### Jest Configuration

**package.json:**

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "jest": {
    "preset": "ts-jest",
    "testEnvironment": "node",
    "roots": ["<rootDir>/src"],
    "testMatch": ["**/__tests__/**/*.test.ts", "**/*.test.ts"],
    "collectCoverageFrom": [
      "src/**/*.ts",
      "!src/**/*.test.ts",
      "!src/**/__tests__/**",
      "!src/**/index.ts"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 90,
        "functions": 90,
        "lines": 90,
        "statements": 90
      }
    }
  }
}
```

### TypeScript Configuration

**tsconfig.json:**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "esModuleInterop": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

## Unit Testing Handlers

### Testing Command Handlers

```typescript
import { CreateUserHandler } from '../commands/CreateUserHandler';
import { CreateUserCommand } from '../contracts/commands';
import type { AuthenticatedUser } from '@banyanai/platform-core';

describe('CreateUserHandler', () => {
  let handler: CreateUserHandler;
  let mockUser: AuthenticatedUser;

  beforeEach(() => {
    handler = new CreateUserHandler();
    mockUser = {
      userId: 'admin-123',
      email: 'admin@example.com',
      name: 'Admin',
      permissions: ['users:create']
    };
  });

  describe('handle', () => {
    it('should create user with valid input', async () => {
      // Arrange
      const command = new CreateUserCommand();
      command.email = 'john@example.com';
      command.firstName = 'John';
      command.lastName = 'Doe';

      // Act
      const result = await handler.handle(command, mockUser);

      // Assert
      expect(result).toMatchObject({
        email: 'john@example.com',
        userId: expect.any(String),
        createdAt: expect.any(String)
      });
    });

    it('should throw error for invalid email', async () => {
      // Arrange
      const command = new CreateUserCommand();
      command.email = 'invalid-email';
      command.firstName = 'John';
      command.lastName = 'Doe';

      // Act & Assert
      await expect(handler.handle(command, mockUser))
        .rejects
        .toThrow('Invalid email format');
    });
  });
});
```

### Testing Query Handlers

```typescript
import { GetUserHandler } from '../queries/GetUserHandler';
import { GetUserQuery } from '../contracts/queries';
import type { AuthenticatedUser } from '@banyanai/platform-core';

describe('GetUserHandler', () => {
  let handler: GetUserHandler;

  beforeEach(() => {
    handler = new GetUserHandler();
  });

  describe('handle', () => {
    it('should return user by ID', async () => {
      // Arrange
      const query = new GetUserQuery();
      query.userId = 'user-123';

      const user: AuthenticatedUser = {
        userId: 'admin-123',
        permissions: ['users:read']
      };

      // Act
      const result = await handler.handle(query, user);

      // Assert
      expect(result).toMatchObject({
        userId: 'user-123',
        email: expect.any(String),
        firstName: expect.any(String),
        lastName: expect.any(String)
      });
    });

    it('should throw error for non-existent user', async () => {
      // Arrange
      const query = new GetUserQuery();
      query.userId = 'non-existent';

      // Act & Assert
      await expect(handler.handle(query, null))
        .rejects
        .toThrow('User not found');
    });
  });
});
```

### Testing Event Handlers

```typescript
import { UserCreatedHandler } from '../subscriptions/UserCreatedHandler';
import { UserCreatedEvent } from '@myorg/user-service-contracts';

describe('UserCreatedHandler', () => {
  let handler: UserCreatedHandler;

  beforeEach(() => {
    handler = new UserCreatedHandler();
  });

  describe('handle', () => {
    it('should process user created event', async () => {
      // Arrange
      const event = new UserCreatedEvent();
      event.userId = 'user-123';
      event.email = 'user@example.com';
      event.createdAt = new Date().toISOString();

      // Act
      await handler.handle(event, null);

      // Assert - verify side effects
      // (e.g., check logs, database updates, etc.)
    });

    it('should be idempotent', async () => {
      // Arrange
      const event = new UserCreatedEvent();
      event.userId = 'user-123';
      event.email = 'user@example.com';
      event.createdAt = new Date().toISOString();

      // Act - handle same event twice
      await handler.handle(event, null);
      await handler.handle(event, null);

      // Assert - should not cause errors or duplicate effects
    });
  });
});
```

## Mocking Service Clients

### Jest Mocks

```typescript
import { NotificationServiceClient } from '../clients/NotificationServiceClient';

// Mock the entire module
jest.mock('../clients/NotificationServiceClient');

describe('CreateUserHandler', () => {
  let handler: CreateUserHandler;
  let mockNotifications: jest.Mocked<NotificationServiceClient>;

  beforeEach(() => {
    // Create mock instance
    mockNotifications = new NotificationServiceClient() as jest.Mocked<NotificationServiceClient>;
    mockNotifications.sendWelcomeEmail = jest.fn().mockResolvedValue(undefined);

    handler = new CreateUserHandler(mockNotifications);
  });

  it('should call notification service', async () => {
    // Arrange
    const command = new CreateUserCommand();
    command.email = 'test@example.com';
    command.firstName = 'John';
    command.lastName = 'Doe';

    // Act
    await handler.handle(command, null);

    // Assert
    expect(mockNotifications.sendWelcomeEmail).toHaveBeenCalledWith(
      expect.any(String),
      'test@example.com',
      'John'
    );
  });
});
```

### Manual Mocks

```typescript
// Create manual mock
const mockNotifications = {
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
} as any;

describe('CreateUserHandler', () => {
  it('should send welcome email', async () => {
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

## Testing with Event Sourcing

### Testing Aggregates

```typescript
import { UserAggregate } from '../domain/UserAggregate';
import { UserCreatedEvent, UserUpdatedEvent } from '../domain/events';

describe('UserAggregate', () => {
  describe('create', () => {
    it('should create user aggregate', () => {
      // Arrange
      const command = new CreateUserCommand();
      command.email = 'test@example.com';
      command.firstName = 'John';
      command.lastName = 'Doe';

      // Act
      const aggregate = UserAggregate.create(command, 'creator-123');

      // Assert
      expect(aggregate.id).toBeDefined();
      expect(aggregate.email).toBe('test@example.com');

      // Check uncommitted events
      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(UserCreatedEvent);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', () => {
      // Arrange
      const aggregate = UserAggregate.create(
        { email: 'test@example.com', firstName: 'John', lastName: 'Doe' },
        'creator-123'
      );
      aggregate.clearUncommittedEvents();

      // Act
      aggregate.updateProfile('Jane', 'Smith');

      // Assert
      expect(aggregate.firstName).toBe('Jane');
      expect(aggregate.lastName).toBe('Smith');

      const events = aggregate.getUncommittedEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(UserUpdatedEvent);
    });
  });
});
```

### Testing Event Sourced Handlers

```typescript
import { CreateUserHandler } from '../commands/CreateUserHandler';
import { UserAggregate } from '../domain/UserAggregate';

describe('CreateUserHandler with Event Sourcing', () => {
  let handler: CreateUserHandler;

  beforeEach(() => {
    handler = new CreateUserHandler();

    // Mock save method
    handler.save = jest.fn().mockResolvedValue(undefined);
  });

  it('should create and save aggregate', async () => {
    // Arrange
    const command = new CreateUserCommand();
    command.email = 'test@example.com';
    command.firstName = 'John';
    command.lastName = 'Doe';

    const user: AuthenticatedUser = {
      userId: 'admin-123',
      permissions: ['users:create']
    };

    // Act
    const result = await handler.handle(command, user);

    // Assert
    expect(handler.save).toHaveBeenCalledWith(
      expect.any(UserAggregate)
    );

    const savedAggregate = (handler.save as jest.Mock).mock.calls[0][0];
    expect(savedAggregate.email).toBe('test@example.com');
  });
});
```

## Integration Testing

### Message Bus Integration Tests

**Integration tests validate message-based communication, NOT HTTP:**

```typescript
import { MessageBusClient } from '@banyanai/platform-message-bus-client';
import { CreateUserCommand, CreateUserResult } from '../contracts/commands';

describe('User Service Integration', () => {
  let messageBus: MessageBusClient;

  beforeAll(async () => {
    messageBus = await MessageBusClient.connect({
      host: 'localhost',
      port: 5672
    });
  });

  afterAll(async () => {
    await messageBus.disconnect();
  });

  it('should handle create user command via message bus', async () => {
    // Arrange
    const command = new CreateUserCommand();
    command.email = 'integration@example.com';
    command.firstName = 'Integration';
    command.lastName = 'Test';

    // Act - send command to message bus
    const result = await messageBus.sendCommand<CreateUserResult>(
      'User.Commands.CreateUser',
      command
    );

    // Assert
    expect(result).toMatchObject({
      userId: expect.any(String),
      email: 'integration@example.com',
      createdAt: expect.any(String)
    });
  });
});
```

## Coverage Requirements

### 90%+ Coverage Threshold

**Required coverage:**
- Branches: 90%
- Functions: 90%
- Lines: 90%
- Statements: 90%

**Check coverage:**
```bash
pnpm run test:coverage
```

**Coverage report:**
```
-------------------------------|---------|----------|---------|---------|
File                           | % Stmts | % Branch | % Funcs | % Lines |
-------------------------------|---------|----------|---------|---------|
All files                      |   94.23 |    92.85 |   95.12 |   94.15 |
 commands                      |   96.15 |    94.44 |   97.22 |   96.10 |
  CreateUserHandler.ts         |   97.50 |    95.83 |  100.00 |   97.44 |
  UpdateUserHandler.ts         |   95.00 |    93.33 |   95.00 |   94.87 |
 queries                       |   93.75 |    91.66 |   94.44 |   93.65 |
  GetUserHandler.ts            |   95.45 |    93.75 |   96.77 |   95.38 |
  ListUsersHandler.ts          |   92.30 |    90.00 |   92.85 |   92.10 |
-------------------------------|---------|----------|---------|---------|
```

### Excluded from Coverage

**Coverage collection excludes:**
- Test files (`*.test.ts`, `*.spec.ts`)
- Mock files (`__mocks__/*`)
- Setup files (`test-setup.ts`)
- Entry points (`main.ts`, `index.ts`)

## Test Organization

### Directory Structure

```
src/
├── commands/
│   ├── CreateUserHandler.ts
│   ├── CreateUserHandler.test.ts        # Unit tests
│   └── __tests__/
│       └── CreateUser.integration.test.ts
├── queries/
│   ├── GetUserHandler.ts
│   ├── GetUserHandler.test.ts
│   └── __tests__/
│       └── GetUser.integration.test.ts
├── subscriptions/
│   ├── UserCreatedHandler.ts
│   └── UserCreatedHandler.test.ts
└── __tests__/
    └── e2e/
        └── UserService.e2e.test.ts
```

### Test Naming

**DO:**
```typescript
// Unit tests
CreateUserHandler.test.ts
GetUserHandler.test.ts

// Integration tests
CreateUser.integration.test.ts
GetUser.integration.test.ts

// E2E tests
UserService.e2e.test.ts
```

**DON'T:**
```typescript
test-create-user.ts
CreateUser.spec.ts
user-handler-tests.ts
```

## Best Practices

### Test Structure

**DO:**
```typescript
describe('CreateUserHandler', () => {
  // Setup
  let handler: CreateUserHandler;

  beforeEach(() => {
    handler = new CreateUserHandler();
  });

  // Group related tests
  describe('handle', () => {
    it('should create user with valid input', async () => {
      // Arrange
      const command = new CreateUserCommand();

      // Act
      const result = await handler.handle(command, mockUser);

      // Assert
      expect(result).toBeDefined();
    });
  });
});
```

**DON'T:**
```typescript
// No organization
test('test1', () => { /* ... */ });
test('test2', () => { /* ... */ });
test('test3', () => { /* ... */ });
```

### Assertions

**DO:**
```typescript
// Specific assertions
expect(result.userId).toBe('user-123');
expect(result.email).toBe('test@example.com');
expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}/);

// Object matching
expect(result).toMatchObject({
  userId: 'user-123',
  email: 'test@example.com'
});
```

**DON'T:**
```typescript
// Vague assertions
expect(result).toBeDefined();
expect(result).toBeTruthy();
expect(result.userId).not.toBeNull();
```

### Mocking

**DO:**
```typescript
// Mock external dependencies
const mockClient = {
  sendCommand: jest.fn().mockResolvedValue({ success: true })
};

// Verify mock calls
expect(mockClient.sendCommand).toHaveBeenCalledWith(
  'Some.Command',
  expect.objectContaining({ userId: 'user-123' })
);
```

**DON'T:**
```typescript
// Don't mock everything
const mockHandler = {
  handle: jest.fn().mockResolvedValue({ userId: '123' })
};

// This doesn't test your code!
expect(mockHandler.handle).toHaveBeenCalled();
```

## Troubleshooting

### "Cannot find module" errors

1. Check imports use `.js` extensions
2. Check `moduleResolution` set to `Node16` in tsconfig
3. Add `.js` extensions to all imports

### "Decorator errors" in tests

1. Check `experimentalDecorators` enabled in tsconfig
2. Check `emitDecoratorMetadata` enabled
3. Import `reflect-metadata` if needed

### Coverage below 90%

1. Check all code paths are tested
2. Add tests for error cases
3. Add tests for edge cases
4. Review uncovered branches in coverage report

## Related Resources

- [Writing Handlers](./writing-handlers.md) - Handler implementation patterns
- [Using Service Clients](./using-service-clients.md) - Testing cross-service calls
- [Data Access Patterns](./data-access-patterns.md) - Testing event sourcing

---

**Next Steps:**
1. Set up Jest configuration with 90%+ thresholds
2. Write unit tests for all handlers
3. Add integration tests for critical flows
4. Monitor coverage reports
5. Refactor to improve testability
