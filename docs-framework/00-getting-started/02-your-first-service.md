---
title: "Your First Service"
description: "Create a working microservice with one command handler in under 10 minutes"
category: "getting-started"
tags: ["quickstart", "service", "handlers", "commands"]
difficulty: "beginner"
estimated_time: "10 minutes"
prerequisites:
  - "Completed Installation and Setup"
  - "Basic TypeScript knowledge"
last_updated: "2025-01-15"
status: "published"
---

# Your First Service

> **TL;DR:** Create a microservice with one command handler that automatically gets REST and GraphQL endpoints.

## Overview

In this guide, you'll create a simple user management service from scratch. You'll learn how the platform automatically discovers your handlers and generates API endpoints without any infrastructure code.

### What You'll Learn

- How to structure a Banyan microservice
- How to create a command handler
- How to define service contracts
- How the platform auto-generates APIs
- How to verify your service is working

### Prerequisites

- Completed [Installation and Setup](./01-installation.md)
- Docker containers running (`docker compose up -d`)
- Basic understanding of TypeScript

## Quick Start

For experienced developers:

```bash
# Create service structure
mkdir -p my-service/{packages/contracts/src,service/src/commands}
cd my-service

# Create package.json files and code (see steps below)
# Build and run
pnpm install
pnpm run build
cd service && node dist/index.js
```

## Step 1: Create Service Structure

### Create Directory Structure

```bash
# Navigate to your workspace (outside banyan-core)
cd /path/to/your/workspace

# Create directory structure
mkdir -p my-service/{packages/contracts/src,service/src/commands}
cd my-service
```

### Create Workspace Configuration

Create `pnpm-workspace.yaml` in the service root:

```yaml
packages:
  - 'packages/*'
  - 'service'
```

### Verify

```bash
tree -L 3
```

You should see:
```
my-service/
├── packages/
│   └── contracts/
│       └── src/
├── service/
│   └── src/
│       └── commands/
└── pnpm-workspace.yaml
```

## Step 2: Configure GitHub Packages Authentication

Before installing platform dependencies, configure access to GitHub Packages.

### Create .npmrc File

Create `.npmrc` in your service root:

```bash
# From my-service/ directory
cat > .npmrc << 'EOF'
@banyanai:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
EOF
```

### Set GitHub Token

Export your GitHub Personal Access Token:

```bash
# Set environment variable (add to ~/.bashrc or ~/.zshrc for persistence)
export NODE_AUTH_TOKEN=your_github_token_here
```

**Don't have a token?**

1. Go to [GitHub Settings → Tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Name: "Banyan Platform Development"
4. Scope: Select `read:packages`
5. Click "Generate token" and copy it

### Verify Authentication

```bash
# Check token is set
echo $NODE_AUTH_TOKEN

# Should output your token (not empty)

# Verify .npmrc exists
cat .npmrc

# Should show:
# @banyanai:registry=https://npm.pkg.github.com
# //npm.pkg.github.com/:_authToken=${NODE_AUTH_TOKEN}
```

**Important:** Never commit `.npmrc` files with hardcoded tokens to version control. The configuration above safely uses an environment variable.

## Step 3: Set Up Contracts Package

The contracts package defines your service's API - what commands it accepts and what data it returns.

### Create Package Configuration

Create `packages/contracts/package.json`:

```json
{
  "name": "@myorg/my-service-contracts",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@banyanai/platform-core": "^1.0.116",
    "@banyanai/platform-contract-system": "^1.0.116"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}
```

### Create TypeScript Configuration

Create `packages/contracts/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Define Your Contract

Create `packages/contracts/src/commands.ts`:

```typescript
import { Command } from '@banyanai/platform-contract-system';

@Command({
  name: 'MyService.Commands.CreateUser',
  description: 'Create a new user',
  requiredPermissions: ['users:create'],
})
export class CreateUserCommand {
  email!: string;
  firstName!: string;
  lastName!: string;
}

export interface CreateUserResult {
  userId: string;
  email: string;
  createdAt: string;
}
```

### Export Contracts

Create `packages/contracts/src/index.ts`:

```typescript
export * from './commands.js';
```

### Verify

```bash
cd packages/contracts
pnpm install
pnpm run build
```

Expected output:
```
Compiled successfully
```

Check the output:
```bash
ls dist/
```

You should see:
```
index.js
index.d.ts
commands.js
commands.d.ts
```

## Step 4: Set Up Service Package

### Create Service Configuration

Create `service/package.json`:

```json
{
  "name": "@myorg/my-service",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@banyanai/platform-base-service": "^1.0.116",
    "@banyanai/platform-core": "^1.0.116",
    "@banyanai/platform-telemetry": "^1.0.116",
    "@myorg/my-service-contracts": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.3"
  }
}
```

### Create TypeScript Configuration

Create `service/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Step 5: Create Your First Handler

Now for the magic - create a handler and the platform does the rest!

Create `service/src/commands/CreateUserHandler.ts`:

```typescript
import { CommandHandler, CommandHandlerDecorator } from '@banyanai/platform-base-service';
import type { AuthenticatedUser } from '@banyanai/platform-core';
import { Logger } from '@banyanai/platform-telemetry';
import { CreateUserCommand, type CreateUserResult } from '@myorg/my-service-contracts';

@CommandHandlerDecorator(CreateUserCommand)
export class CreateUserHandler extends CommandHandler<CreateUserCommand, CreateUserResult> {
  constructor() {
    super();
  }

  async handle(command: CreateUserCommand, user: AuthenticatedUser | null): Promise<CreateUserResult> {
    Logger.info('Creating user', { email: command.email });

    // Your business logic here
    const userId = `user-${Date.now()}`;

    return {
      userId,
      email: command.email,
      createdAt: new Date().toISOString(),
    };
  }
}
```

**That's your entire handler!** The platform automatically:
- ✅ Discovers this handler
- ✅ Generates `POST /api/users` REST endpoint
- ✅ Generates `createUser` GraphQL mutation
- ✅ Validates the `users:create` permission
- ✅ Sets up message bus routing

## Step 6: Create Service Entry Point

Create `service/src/index.ts`:

```typescript
import { BaseService } from '@banyanai/platform-base-service';
import { Logger } from '@banyanai/platform-telemetry';

async function main() {
  try {
    await BaseService.start({
      name: 'my-service',
      version: '1.0.0',
    });

    Logger.info('My Service started successfully');
  } catch (error) {
    Logger.error('Failed to start service', { error });
    process.exit(1);
  }
}

main();
```

**One line** (`BaseService.start()`) handles:
- Message bus connection
- Handler discovery
- Contract registration
- Service discovery registration
- Health checks
- Distributed tracing
- Metrics collection

## Step 7: Build and Run

### Install Dependencies

```bash
# From service root (my-service/)
pnpm install
```

### Build

```bash
pnpm run build
```

Expected output:
```
Compiling contracts...
Compiling service...
Build complete
```

### Run Your Service

```bash
cd service
node dist/index.js
```

Expected output:
```
Handler discovery completed {
  commandHandlers: 1,
  queryHandlers: 0,
  eventHandlers: 0,
  totalHandlers: 1
}
Service registered with discovery: my-service
Contract broadcast complete: 1 contracts
My Service started successfully
```

**Congratulations!** Your service is running. Keep this terminal open.

## Verify Your Service

Your service is now available through the API Gateway. Let's test it!

### Test with REST API

Open a new terminal and run:

```bash
curl -X POST http://localhost:3003/api/users \
  -H "Content-Type: application/json" \
  -H "X-Dev-User-Id: dev-user-123" \
  -H "X-Dev-Permissions: users:create" \
  -d '{
    "email": "john@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

Expected response:
```json
{
  "userId": "user-1705334567890",
  "email": "john@example.com",
  "createdAt": "2025-01-15T10:30:45.123Z"
}
```

### Test with GraphQL

```bash
curl -X POST http://localhost:3003/graphql \
  -H "Content-Type: application/json" \
  -H "X-Dev-User-Id: dev-user-123" \
  -H "X-Dev-Permissions: users:create" \
  -d '{
    "query": "mutation { createUser(input: { email: \"jane@example.com\", firstName: \"Jane\", lastName: \"Smith\" }) { userId email createdAt } }"
  }'
```

Expected response:
```json
{
  "data": {
    "createUser": {
      "userId": "user-1705334567891",
      "email": "jane@example.com",
      "createdAt": "2025-01-15T10:31:15.456Z"
    }
  }
}
```

### Test with GraphiQL UI

Open your browser to [http://localhost:3003/graphql](http://localhost:3003/graphql)

Try this mutation:
```graphql
mutation CreateUser {
  createUser(input: {
    email: "test@example.com"
    firstName: "Test"
    lastName: "User"
  }) {
    userId
    email
    createdAt
  }
}
```

You should see the interactive GraphQL playground with auto-completion!

## What Just Happened?

Let's understand what the platform did automatically:

### 1. Handler Discovery

The platform scanned `service/src/commands/` and found `CreateUserHandler.ts`.

### 2. Contract Registration

Your `@Command` decorator registered the contract with service discovery:
- Contract name: `MyService.Commands.CreateUser`
- Required permissions: `users:create`
- Input type: `CreateUserCommand`
- Output type: `CreateUserResult`

### 3. REST Endpoint Generation

The API Gateway generated:
- **Endpoint:** `POST /api/users`
- **Input validation:** Checks email, firstName, lastName fields
- **Permission check:** Validates `users:create` permission
- **Response:** Returns `CreateUserResult`

### 4. GraphQL Schema Generation

The API Gateway generated:
```graphql
type Mutation {
  createUser(input: CreateUserInput!): CreateUserResult
}

input CreateUserInput {
  email: String!
  firstName: String!
  lastName: String!
}

type CreateUserResult {
  userId: String!
  email: String!
  createdAt: String!
}
```

### 5. Message Bus Routing

RabbitMQ exchanges and queues were created:
- Exchange: `my-service.commands`
- Queue: `my-service.commands.CreateUser`
- Routing: API Gateway → RabbitMQ → Your Handler

### 6. Distributed Tracing

Every request is traced with OpenTelemetry. View traces at [http://localhost:16686](http://localhost:16686).

## Next Steps

Now that you have a working service, you can:

- **[Call Your API](./03-calling-apis.md)** - Learn different ways to consume your service
- **[Add More Handlers](./04-next-steps.md)** - Add queries, events, and more complex logic
- **[Tutorial: Build a User Service](../01-tutorials/building-user-service.md)** - Build a complete CRUD service
- **[Concepts: Handlers](../02-concepts/handlers.md)** - Understand handler patterns in depth

## Common Issues

### Handler Not Discovered

**Problem:** Handler doesn't appear in discovery output

**Solution:** Check these requirements:
- ✅ File is in `src/commands/` directory
- ✅ File name ends with `Handler.ts`
- ✅ Class has `@CommandHandlerDecorator(YourCommand)` decorator
- ✅ Class extends `CommandHandler<Input, Output>`

### Cannot Find Module Error

**Problem:** TypeScript can't find `@banyanai/platform-*` packages

**Solution:** Ensure packages are built

```bash
# Build contracts first
cd packages/contracts
pnpm run build

# Then build service
cd ../../service
pnpm install
pnpm run build
```

### Permission Denied Error

**Problem:** API returns "Permission denied" error

**Solution:** Add the required permission to your request headers

```bash
# Development mode uses X-Dev-Permissions header
curl -H "X-Dev-Permissions: users:create" ...
```

### Port 3003 Connection Refused

**Problem:** Cannot connect to API Gateway

**Solution:** Ensure API Gateway is running in banyan-core

```bash
cd /path/to/banyan-core
docker compose ps api-gateway
```

If not running:
```bash
cd platform/services/api-gateway
pnpm run dev
```

For more help, see [Troubleshooting Guide](../05-troubleshooting/common-errors.md).

## Additional Resources

- [Handler Patterns](../03-guides/handler-patterns.md) - Deep dive on commands, queries, events
- [Contract System](../02-concepts/contracts.md) - API definition patterns
- [Service Architecture](../02-concepts/service-architecture.md) - How services are structured
- [Testing Handlers](../03-guides/testing-handlers.md) - Write tests for your handlers

## Development Tips

### Hot Reload During Development

Instead of `node dist/index.js`, use watch mode:

```bash
cd service
pnpm run dev
```

Now when you edit handlers, TypeScript recompiles automatically!

### View Service Logs

Your handler's `Logger.info()` calls appear in the console. For structured logging:

```typescript
Logger.info('User created', {
  userId: result.userId,
  email: command.email,
  timestamp: new Date().toISOString()
});
```

### Test Without API Gateway

You can test handlers directly via message bus. See [Testing Guide](../03-guides/testing-handlers.md).

### Add More Commands

Create more handlers in `src/commands/`:
- `UpdateUserHandler.ts`
- `DeleteUserHandler.ts`
- `ActivateUserHandler.ts`

Each gets auto-discovered and gets its own API endpoint!
