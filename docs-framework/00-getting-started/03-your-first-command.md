---
title: "Your First Command"
description: "Create your first command handler and learn how the platform automatically generates APIs"
category: "getting-started"
tags: ["quickstart", "commands", "handlers", "api"]
difficulty: "beginner"
estimated_time: "15 minutes"
prerequisites:
  - "Completed Your First Service (02-your-first-service.md)"
  - "Service running with basic structure"
last_updated: "2025-01-15"
status: "published"
---

# Your First Command

> **What You'll Build:** Add a complete command handler with validation, business logic, and automated API generation.

## Overview

In the previous guide, you created a basic service with one command handler. Now you'll learn how to create a more complete command that demonstrates validation, business rules, and the full power of the platform's automatic API generation.

We'll add an `UpdateUser` command to your service that shows:
- Input validation
- Business rule enforcement
- Error handling
- Policy-based authorization
- Automatic REST and GraphQL endpoints

### Learning Objectives

By the end of this guide, you will be able to:

- Create commands with validation rules
- Implement business logic in command handlers
- Use policy-based authorization (Layer 2)
- Handle errors gracefully
- Test commands via REST and GraphQL

### Prerequisites

- Completed [Your First Service](./02-your-first-service.md)
- Service running with `CreateUserCommand`
- Basic understanding of TypeScript

## What We're Building

We'll add an `UpdateUser` command that:
- Validates email format
- Enforces business rule: users can only update their own profile (unless admin)
- Returns updated user data
- Automatically gets REST `PUT /api/users/:id` endpoint
- Automatically gets GraphQL `updateUser` mutation

## Step 1: Define the Contract

Commands are defined in your contracts package. This creates the type-safe API.

### Create the Update Command

Create `packages/contracts/src/commands.ts` (or add to existing file):

```typescript
import { Command } from '@banyanai/platform-contract-system';

// Keep your existing CreateUserCommand...

@Command({
  name: 'MyService.Commands.UpdateUser',
  description: 'Update user profile information',
  requiredPermissions: ['users:update'],
})
export class UpdateUserCommand {
  userId!: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface UpdateUserResult {
  success: boolean;
  user?: {
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    updatedAt: string;
  };
  error?: string;
}
```

**Key Concepts:**
- `@Command` decorator registers the command with the platform
- `requiredPermissions` enforces Layer 1 authorization at the API Gateway
- Optional fields (`email?`, `firstName?`) allow partial updates
- Result interface includes success flag and error handling

### Export the Contract

Update `packages/contracts/src/index.ts`:

```typescript
export * from './commands.js';
```

### Rebuild Contracts

```bash
cd packages/contracts
pnpm run build
```

## Step 2: Create a Simple Read Model

Before we can update users, we need somewhere to store them. Create a simple in-memory read model.

### Create Read Model File

Create `service/src/read-models/UserReadModel.ts`:

```typescript
import { ReadModel, ReadModelBase } from '@banyanai/platform-event-sourcing';

interface UserData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
}

@ReadModel({ tableName: 'users' })
export class UserReadModel extends ReadModelBase<UserReadModel> {
  id!: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  createdAt!: Date;
  updatedAt!: Date;

  getId(): string {
    return this.id;
  }

  // In-memory storage for this example
  private static users = new Map<string, UserData>();

  static async findById(id: string): Promise<UserReadModel | null> {
    const userData = this.users.get(id);
    if (!userData) return null;

    const model = new UserReadModel();
    Object.assign(model, userData);
    return model;
  }

  static async create(userData: UserData): Promise<void> {
    this.users.set(userData.id, userData);
  }

  static async update(id: string, updates: Partial<UserData>): Promise<void> {
    const existing = this.users.get(id);
    if (!existing) {
      throw new Error(`User ${id} not found`);
    }

    this.users.set(id, {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    });
  }
}
```

**Key Concepts:**
- `@ReadModel` decorator registers it with the platform
- Static methods provide query interface
- In-memory Map for simplicity (in production, this would be PostgreSQL)
- `getId()` required by platform

## Step 3: Update Create Handler to Use Read Model

Update your `CreateUserHandler` to store users:

```typescript
import { CommandHandler, CommandHandlerDecorator } from '@banyanai/platform-base-service';
import type { AuthenticatedUser } from '@banyanai/platform-core';
import { Logger } from '@banyanai/platform-telemetry';
import { CreateUserCommand, type CreateUserResult } from '@myorg/my-service-contracts';
import { UserReadModel } from '../read-models/UserReadModel.js';

@CommandHandlerDecorator(CreateUserCommand)
export class CreateUserHandler extends CommandHandler<CreateUserCommand, CreateUserResult> {
  constructor() {
    super();
  }

  async handle(command: CreateUserCommand, user: AuthenticatedUser | null): Promise<CreateUserResult> {
    Logger.info('Creating user', { email: command.email });

    // Generate ID
    const userId = `user-${Date.now()}`;

    // Store in read model
    await UserReadModel.create({
      id: userId,
      email: command.email,
      firstName: command.firstName,
      lastName: command.lastName,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return {
      userId,
      email: command.email,
      createdAt: new Date().toISOString(),
    };
  }
}
```

## Step 4: Create the Update Handler

Now create the update command handler with validation and authorization.

### Create Handler File

Create `service/src/commands/UpdateUserHandler.ts`:

```typescript
import { CommandHandler, CommandHandlerDecorator } from '@banyanai/platform-base-service';
import type { AuthenticatedUser } from '@banyanai/platform-core';
import { Logger } from '@banyanai/platform-telemetry';
import { UpdateUserCommand, type UpdateUserResult } from '@myorg/my-service-contracts';
import { UserReadModel } from '../read-models/UserReadModel.js';

@CommandHandlerDecorator(UpdateUserCommand)
export class UpdateUserHandler extends CommandHandler<UpdateUserCommand, UpdateUserResult> {
  constructor() {
    super();
  }

  async handle(command: UpdateUserCommand, user: AuthenticatedUser | null): Promise<UpdateUserResult> {
    try {
      Logger.info('Updating user', { userId: command.userId });

      // 1. Validation: Check user exists
      const existingUser = await UserReadModel.findById(command.userId);
      if (!existingUser) {
        return {
          success: false,
          error: `User ${command.userId} not found`,
        };
      }

      // 2. Validation: Email format (if provided)
      if (command.email && !this.isValidEmail(command.email)) {
        return {
          success: false,
          error: 'Invalid email format',
        };
      }

      // 3. Layer 2 Authorization: Policy-based business rule
      // Users can only update their own profile (unless they're admin)
      if (user) {
        const isAdmin = user.permissions?.includes('users:admin');
        const isOwnProfile = user.userId === command.userId;

        if (!isOwnProfile && !isAdmin) {
          return {
            success: false,
            error: 'You can only update your own profile',
          };
        }
      }

      // 4. Business Logic: Update user
      const updates: any = {};
      if (command.email) updates.email = command.email;
      if (command.firstName) updates.firstName = command.firstName;
      if (command.lastName) updates.lastName = command.lastName;

      await UserReadModel.update(command.userId, updates);

      // 5. Return updated user
      const updatedUser = await UserReadModel.findById(command.userId);
      if (!updatedUser) {
        throw new Error('Failed to retrieve updated user');
      }

      Logger.info('User updated successfully', { userId: command.userId });

      return {
        success: true,
        user: {
          userId: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          updatedAt: updatedUser.updatedAt.toISOString(),
        },
      };
    } catch (error) {
      Logger.error('Failed to update user', { error, userId: command.userId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
```

**Key Concepts:**

1. **Validation**: Check user exists and email format is valid
2. **Layer 2 Authorization**: Business rule enforcement in handler
3. **Business Logic**: Only update fields that were provided
4. **Error Handling**: Try-catch with detailed error messages
5. **Success Response**: Return updated user data

## Step 5: Build and Run

### Rebuild Service

```bash
cd service
pnpm run build
```

### Restart Service

```bash
node dist/index.js
```

Expected output:
```
Handler discovery completed {
  commandHandlers: 2,
  queryHandlers: 0,
  eventHandlers: 0,
  totalHandlers: 2
}
Service registered with discovery: my-service
Contract broadcast complete: 2 contracts
My Service started successfully
```

**Notice:** 2 command handlers discovered (`CreateUser` and `UpdateUser`)

## Step 6: Test Your Command

### Create a User First

```bash
curl -X POST http://localhost:3003/api/users \
  -H "Content-Type: application/json" \
  -H "X-Dev-User-Id: user-1705334567890" \
  -H "X-Dev-Permissions: users:create" \
  -d '{
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

Response:
```json
{
  "userId": "user-1705334567890",
  "email": "john@example.com",
  "createdAt": "2025-01-15T10:30:45.123Z"
}
```

### Update the User

```bash
curl -X POST http://localhost:3003/api/users/update \
  -H "Content-Type: application/json" \
  -H "X-Dev-User-Id: user-1705334567890" \
  -H "X-Dev-Permissions: users:update" \
  -d '{
    "userId": "user-1705334567890",
    "firstName": "Jonathan",
    "email": "jonathan@example.com"
  }'
```

Response:
```json
{
  "success": true,
  "user": {
    "userId": "user-1705334567890",
    "email": "jonathan@example.com",
    "firstName": "Jonathan",
    "lastName": "Doe",
    "updatedAt": "2025-01-15T10:35:22.456Z"
  }
}
```

### Test Authorization

Try updating someone else's profile:

```bash
curl -X POST http://localhost:3003/api/users/update \
  -H "Content-Type: application/json" \
  -H "X-Dev-User-Id: different-user-999" \
  -H "X-Dev-Permissions: users:update" \
  -d '{
    "userId": "user-1705334567890",
    "firstName": "Hacker"
  }'
```

Response:
```json
{
  "success": false,
  "error": "You can only update your own profile"
}
```

### Test Validation

Try invalid email:

```bash
curl -X POST http://localhost:3003/api/users/update \
  -H "Content-Type: application/json" \
  -H "X-Dev-User-Id: user-1705334567890" \
  -H "X-Dev-Permissions: users:update" \
  -d '{
    "userId": "user-1705334567890",
    "email": "not-an-email"
  }'
```

Response:
```json
{
  "success": false,
  "error": "Invalid email format"
}
```

## Understanding What Happened

### 1. Layer 1 Authorization (API Gateway)

The API Gateway checked the `users:update` permission before routing the request:

```typescript
requiredPermissions: ['users:update']
```

If the user didn't have this permission, they'd get a 403 before reaching your handler.

### 2. Layer 2 Authorization (Handler)

Your handler enforced the business rule:

```typescript
if (!isOwnProfile && !isAdmin) {
  return {
    success: false,
    error: 'You can only update your own profile',
  };
}
```

This is a **policy** - a business rule that can't be expressed as a simple permission.

### 3. Automatic API Generation

The platform automatically created:

**REST Endpoint:**
```
POST /api/users/update
```

**GraphQL Mutation:**
```graphql
mutation {
  updateUser(input: {
    userId: "user-123"
    firstName: "Jonathan"
  }) {
    success
    user {
      userId
      email
      firstName
      lastName
      updatedAt
    }
    error
  }
}
```

### 4. Type Safety

The entire flow is type-safe:
- Contract defines input/output types
- Handler is strongly typed
- API Gateway validates input against contract
- No runtime type errors possible

## Next Steps

Now that you understand commands, you can:

- **[Add a Query Handler](../03-guides/query-handlers.md)** - Learn read operations
- **[Add Event Handlers](../03-guides/event-handlers.md)** - React to state changes
- **[Tutorial: Todo Service](../01-tutorials/beginner/todo-service.md)** - Build complete CRUD service
- **[Authorization Deep Dive](../02-concepts/authorization.md)** - Master two-layer auth

## Common Patterns

### Partial Updates

Only update fields that are provided:

```typescript
const updates: Partial<UserData> = {};
if (command.email) updates.email = command.email;
if (command.firstName) updates.firstName = command.firstName;
```

### Validation

Create reusable validation methods:

```typescript
private isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

### Error Handling

Always wrap in try-catch and return success/error:

```typescript
try {
  // Business logic
  return { success: true, user: updatedUser };
} catch (error) {
  Logger.error('Operation failed', { error });
  return { success: false, error: error.message };
}
```

### Policy Checks

Implement business rules as policy checks:

```typescript
const isAdmin = user.permissions?.includes('users:admin');
const isOwner = resource.userId === user.userId;

if (!isOwner && !isAdmin) {
  throw new PolicyViolationError('Access denied');
}
```

## Troubleshooting

### Handler Not Discovered

**Problem:** New handler doesn't appear in discovery output

**Solution:** Check these requirements:
- File is in `src/commands/` directory
- File name ends with `Handler.ts`
- Class has `@CommandHandlerDecorator(Command)` decorator
- Class extends `CommandHandler<Input, Output>`
- Contract was rebuilt: `cd packages/contracts && pnpm run build`

### User Not Found

**Problem:** Always returns "User not found"

**Solution:** Ensure you're using the same user ID:
1. Create user and note the `userId` in response
2. Use that exact `userId` in update command
3. Check CreateUserHandler is storing users in UserReadModel

### Authorization Always Fails

**Problem:** "You can only update your own profile" even for own profile

**Solution:** Ensure `X-Dev-User-Id` header matches the `userId` in the command:
```bash
# These must match:
-H "X-Dev-User-Id: user-1705334567890"
-d '{ "userId": "user-1705334567890", ... }'
```

## Additional Resources

- [Command Handler Patterns](../03-guides/command-handlers.md)
- [Validation Strategies](../03-guides/validation.md)
- [Authorization Guide](../02-concepts/authorization.md)
- [Error Handling Best Practices](../03-guides/error-handling.md)
