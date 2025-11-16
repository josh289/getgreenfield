---
title: Test Failures
description: Troubleshooting common test failures and fixing flaky tests
category: troubleshooting
tags: [testing, jest, unit-tests, integration-tests, flaky-tests]
related:
  - ../../03-guides/testing/unit-testing.md
  - ../../03-guides/testing/integration-testing.md
  - ../debugging-tools/log-analysis.md
difficulty: intermediate
---

# Test Failures

Quick reference for diagnosing and fixing common test failures.

## Quick Diagnosis

```bash
# Run failing test with verbose output
pnpm run test -- --verbose failing-test.test.ts

# Run single test
pnpm run test -- -t "test name pattern"

# Run with coverage
pnpm run test -- --coverage

# Clear Jest cache
pnpm run test -- --clearCache

# Run in band (sequential, not parallel)
pnpm run test -- --runInBand

# Debug test
node --inspect-brk node_modules/.bin/jest --runInBand failing-test.test.ts
```

## Common Test Failures

### 1. Module Not Found

**Error:**
```
Cannot find module '@banyanai/platform-cqrs' from 'src/commands/CreateUserHandler.ts'
```

**Fix - Check Package Installation:**
```bash
# Install dependencies
pnpm install

# Rebuild packages
pnpm run build

# Check package.json
cat package.json | jq '.dependencies'
```

**Fix - Verify Import Path:**
```typescript
// ❌ WRONG: Missing .js extension
import { CommandHandler } from './decorators';

// ✓ CORRECT: Include .js extension (required for ES modules)
import { CommandHandler } from './decorators.js';
```

**Fix - Check tsconfig.json:**
```json
{
  "compilerOptions": {
    "module": "Node16",              // Required
    "moduleResolution": "Node16",    // Required
    "esModuleInterop": true
  }
}
```

### 2. Timeout Errors

**Error:**
```
Timeout - Async callback was not invoked within the 5000 ms timeout
```

**Fix - Increase Timeout:**
```typescript
// For specific test
it('should process large dataset', async () => {
  // Test code
}, 30000);  // 30 second timeout

// For all tests in file
jest.setTimeout(30000);

// In jest.config.js
module.exports = {
  testTimeout: 30000
};
```

**Fix - Ensure Async Completion:**
```typescript
// ❌ WRONG: Missing await
it('should create user', () => {
  createUser({ email: 'test@example.com' });  // Not awaited!
});

// ✓ CORRECT: Await async operations
it('should create user', async () => {
  await createUser({ email: 'test@example.com' });
});
```

### 3. Connection/Database Errors

**Error:**
```
Error: Connection terminated unexpectedly
Error: database "platform_test" does not exist
```

**Fix - Setup Test Database:**
```bash
# Create test database
docker exec postgres psql -U postgres -c "CREATE DATABASE platform_test;"

# Run migrations
pnpm run db:migrate:test

# Initialize schema
pnpm run db:schema:test
```

**Fix - Use Test Database URL:**
```typescript
// jest.setup.ts or test file
process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/platform_test';
```

**Fix - Clean Up After Tests:**
```typescript
beforeEach(async () => {
  // Clear database before each test
  await clearDatabase();
});

afterAll(async () => {
  // Close connections
  await pool.end();
  await messageBus.disconnect();
});
```

### 4. Mock Not Working

**Error:**
```
Expected mock function to have been called, but it was not called
```

**Fix - Verify Mock Setup:**
```typescript
// ❌ WRONG: Mock after import
import { UserRepository } from './UserRepository.js';
jest.mock('./UserRepository.js');

// ✓ CORRECT: Mock before import
jest.mock('./UserRepository.js');
import { UserRepository } from './UserRepository.js';
```

**Fix - Reset Mocks Between Tests:**
```typescript
beforeEach(() => {
  jest.clearAllMocks();  // Clear call history
  jest.resetAllMocks();  // Reset mock implementation
});
```

**Fix - Check Mock Implementation:**
```typescript
// Define mock properly
const mockUserRepository = {
  findById: jest.fn(),
  save: jest.fn()
};

// Provide implementation
mockUserRepository.findById.mockResolvedValue({
  userId: 'user-123',
  email: 'test@example.com'
});

// Verify calls
expect(mockUserRepository.findById).toHaveBeenCalledWith('user-123');
expect(mockUserRepository.findById).toHaveBeenCalledTimes(1);
```

### 5. Flaky Tests (Intermittent Failures)

**Symptom:** Tests pass sometimes, fail other times

**Fix - Avoid Time-Dependent Tests:**
```typescript
// ❌ WRONG: Depends on current time
it('should set creation date', () => {
  const user = new User();
  expect(user.createdAt).toBe(new Date());  // Flaky! Time changes
});

// ✓ CORRECT: Use fake timers or verify range
it('should set creation date', () => {
  jest.useFakeTimers();
  jest.setSystemTime(new Date('2024-01-01'));

  const user = new User();
  expect(user.createdAt).toEqual(new Date('2024-01-01'));

  jest.useRealTimers();
});

// Or verify it's recent
it('should set creation date', () => {
  const before = new Date();
  const user = new User();
  const after = new Date();

  expect(user.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  expect(user.createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
});
```

**Fix - Avoid Race Conditions:**
```typescript
// ❌ WRONG: Parallel async operations without coordination
it('should process items', async () => {
  await Promise.all([
    processItem(1),
    processItem(2),
    processItem(3)
  ]);
  expect(results).toHaveLength(3);  // Flaky! Results may not be ready
});

// ✓ CORRECT: Wait for completion
it('should process items', async () => {
  const results = await Promise.all([
    processItem(1),
    processItem(2),
    processItem(3)
  ]);
  expect(results).toHaveLength(3);
});
```

**Fix - Use waitFor for Async Updates:**
```typescript
import { waitFor } from '@testing-library/react';

it('should update read model', async () => {
  await commandBus.execute(new CreateUserCommand('user-123', 'test@example.com'));

  // Wait for projection to complete
  await waitFor(async () => {
    const user = await UserReadModel.findById('user-123');
    expect(user).toBeDefined();
    expect(user.email).toBe('test@example.com');
  }, { timeout: 5000 });
});
```

### 6. Type-Only Import Issues

**Error:**
```
Cannot decorate class with @CommandHandler: CreateUserCommand is not defined
```

**Cause:** Using `import type` for decorator argument

**Fix - Use Value Import:**
```typescript
// ❌ WRONG: Type-only import can't be used in decorators
import type { CreateUserCommand } from './commands.js';

@CommandHandler(CreateUserCommand)  // Error! Can't use type
export class CreateUserHandler {}

// ✓ CORRECT: Value import
import { CreateUserCommand } from './commands.js';

@CommandHandler(CreateUserCommand)  // Works!
export class CreateUserHandler {}
```

### 7. Coverage Not Reaching 90%

**Issue:** Tests run but coverage below threshold

**Fix - Check Untested Paths:**
```bash
# Generate coverage report
pnpm run test -- --coverage

# View HTML report
open coverage/lcov-report/index.html

# Check specific file coverage
pnpm run test -- --coverage --collectCoverageFrom="src/handlers/CreateUserHandler.ts"
```

**Fix - Test Error Paths:**
```typescript
describe('CreateUserHandler', () => {
  it('should create user successfully', async () => {
    // Happy path ✓
    const result = await handler.handle(validCommand);
    expect(result.userId).toBeDefined();
  });

  it('should throw error for duplicate email', async () => {
    // Error path ✓
    await expect(
      handler.handle(duplicateEmailCommand)
    ).rejects.toThrow('Email already exists');
  });

  it('should throw error for invalid data', async () => {
    // Validation error path ✓
    await expect(
      handler.handle(invalidCommand)
    ).rejects.toThrow('Validation failed');
  });
});
```

**Fix - Test Edge Cases:**
```typescript
describe('User aggregate', () => {
  it('should handle empty string name', () => {
    // Edge case
    expect(() => user.setName('')).toThrow('Name cannot be empty');
  });

  it('should handle very long name', () => {
    const longName = 'a'.repeat(1000);
    expect(() => user.setName(longName)).toThrow('Name too long');
  });

  it('should handle special characters in name', () => {
    user.setName('John O\'Brien');
    expect(user.name).toBe('John O\'Brien');
  });
});
```

### 8. Event Sourcing Test Issues

**Error:**
```
AggregateNotFoundError: User with ID test-user not found
```

**Fix - Initialize Event Store Schema:**
```typescript
beforeAll(async () => {
  // Initialize event store schema
  const eventStore = new PostgresEventStore(testDbConfig);
  await eventStore.initializeSchema();
});
```

**Fix - Create Test Aggregate:**
```typescript
it('should update user', async () => {
  // Create aggregate first
  const user = new User('test-user-123');
  user.register('test@example.com', 'password');
  await aggregateAccess.save(user, 'test-correlation-id');

  // Now test update
  const loaded = await aggregateAccess.getById('test-user-123');
  loaded.updateEmail('new@example.com');
  await aggregateAccess.save(loaded, 'test-correlation-id');

  // Verify
  const updated = await aggregateAccess.getById('test-user-123');
  expect(updated.email).toBe('new@example.com');
});
```

### 9. Memory Leaks in Tests

**Symptom:** Tests slow down over time, memory usage increases

**Fix - Clean Up Resources:**
```typescript
afterEach(async () => {
  // Close database connections
  await pool.end();

  // Disconnect message bus
  await messageBus.disconnect();

  // Clear event listeners
  eventEmitter.removeAllListeners();

  // Clear timers
  jest.clearAllTimers();
});
```

**Fix - Use beforeEach/afterEach:**
```typescript
describe('UserService', () => {
  let service: UserService;
  let pool: Pool;

  beforeEach(() => {
    pool = new Pool(config);
    service = new UserService(pool);
  });

  afterEach(async () => {
    await pool.end();  // Clean up after each test
  });

  it('test 1', async () => {
    // Uses fresh service and pool
  });

  it('test 2', async () => {
    // Uses fresh service and pool
  });
});
```

## Test Debugging Tools

```typescript
// Enable debug logging
process.env.LOG_LEVEL = 'debug';
process.env.DEBUG = '*';

// Log test data
console.log('Test input:', JSON.stringify(input, null, 2));
console.log('Test output:', JSON.stringify(output, null, 2));

// Use debugger
it('should process data', async () => {
  debugger;  // Breakpoint here
  const result = await processData(input);
  expect(result).toBeDefined();
});

// Run with node inspector
// node --inspect-brk node_modules/.bin/jest --runInBand test.ts
```

## Test Quality Checklist

- [ ] All imports have `.js` extension
- [ ] Async functions use `await`
- [ ] Mocks defined before imports
- [ ] Database cleaned between tests
- [ ] Connections closed in afterAll/afterEach
- [ ] Time-dependent code uses fake timers
- [ ] No race conditions in parallel tests
- [ ] Error paths tested
- [ ] Edge cases covered
- [ ] Coverage >90% for all metrics

## Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1'
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          experimentalDecorators: true,
          emitDecoratorMetadata: true
        }
      }
    ]
  },
  testEnvironment: 'node',
  testTimeout: 30000,
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    }
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/__tests__/**',
    '!src/__mocks__/**'
  ]
};
```

## Best Practices

1. **Always clean up resources:**
```typescript
afterEach(async () => {
  await pool.end();
  await messageBus.disconnect();
});
```

2. **Use fake timers for time-dependent code:**
```typescript
jest.useFakeTimers();
jest.setSystemTime(new Date('2024-01-01'));
```

3. **Avoid test interdependence:**
```typescript
// Each test should be independent
beforeEach(() => {
  // Fresh state for each test
});
```

4. **Test both happy and error paths:**
```typescript
it('succeeds with valid data', async () => { });
it('fails with invalid data', async () => { });
```

5. **Use descriptive test names:**
```typescript
// ❌ WRONG
it('works', () => {});

// ✓ CORRECT
it('should create user with valid email and return userId', async () => {});
```

## Related Documentation

- [Unit Testing Guide](../../03-guides/testing/unit-testing.md)
- [Integration Testing Guide](../../03-guides/testing/integration-testing.md)
- [Test Coverage Requirements](../../03-guides/testing/coverage.md)
- [Log Analysis](../debugging-tools/log-analysis.md)
