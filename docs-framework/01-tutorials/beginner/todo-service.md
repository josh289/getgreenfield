---
title: "Build a Todo Service"
description: "Build a complete CRUD todo list service with commands, queries, and read models"
category: "tutorials"
tags: ["beginner", "crud", "commands", "queries", "hands-on"]
difficulty: "beginner"
estimated_time: "90 minutes"
prerequisites:
  - "Completed Getting Started: Your First Service"
  - "Understanding of TypeScript basics"
  - "Docker and pnpm installed"
learning_objectives:
  - "Create a complete CRUD service"
  - "Implement command and query handlers"
  - "Use read models for data persistence"
  - "Test via REST and GraphQL"
  - "Apply two-layer authorization"
last_updated: "2025-01-15"
status: "published"
---

# Build a Todo Service

> **What You'll Build:** A complete todo list service with create, read, update, delete, and complete operations.

## Overview

In this tutorial, you'll build a production-ready todo list service from scratch. This is the perfect first project to understand the platform's CQRS pattern, handler discovery, and automatic API generation.

By the end, you'll have a working service that:
- Creates todo items
- Lists todos for a user
- Marks todos as completed
- Updates todo text
- Deletes todos
- Automatically exposes REST and GraphQL APIs

### Learning Objectives

By the end of this tutorial, you will be able to:

- Structure a complete microservice with commands and queries
- Implement CRUD operations using CQRS patterns
- Create and use read models for data storage
- Apply permission-based and policy-based authorization
- Test your service via REST API and GraphQL
- Handle errors gracefully

### Prerequisites

Before starting this tutorial, you should:

- Complete [Your First Service](../../00-getting-started/02-your-first-service.md)
- Have Node.js 20+ and pnpm installed
- Have Docker running for infrastructure
- Understand TypeScript basics

### What We're Building

A todo list service with these capabilities:

**Commands (Write Operations):**
- `CreateTodo` - Create a new todo item
- `UpdateTodo` - Update todo text
- `CompleteTodo` - Mark a todo as completed
- `DeleteTodo` - Remove a todo

**Queries (Read Operations):**
- `GetTodo` - Retrieve a single todo
- `ListTodos` - List all todos for a user

**Authorization:**
- Layer 1: Permission-based (`todo:create`, `todo:read`, etc.)
- Layer 2: Policy-based (users can only access their own todos)

## Setup

### Create Project Structure

```bash
# Create project directory
mkdir todo-service
cd todo-service

# Create folder structure
mkdir -p packages/contracts/src
mkdir -p service/src/{commands,queries,read-models}

# Create workspace config
cat > pnpm-workspace.yaml << 'EOF'
packages:
  - 'packages/*'
  - 'service'
EOF
```

### Project Structure

```
todo-service/
├── pnpm-workspace.yaml
├── packages/
│   └── contracts/
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── commands.ts
│           └── queries.ts
└── service/
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── index.ts
        ├── commands/
        │   ├── CreateTodoHandler.ts
        │   ├── UpdateTodoHandler.ts
        │   ├── CompleteTodoHandler.ts
        │   └── DeleteTodoHandler.ts
        ├── queries/
        │   ├── GetTodoHandler.ts
        │   └── ListTodosHandler.ts
        └── read-models/
            └── TodoReadModel.ts
```

## Part 1: Define Contracts

Contracts define your service's API - what operations it supports and their types.

### Step 1: Create Contracts Package Configuration

Create `packages/contracts/package.json`:

```json
{
  "name": "@myorg/todo-service-contracts",
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

### Step 2: Define Command Contracts

Create `packages/contracts/src/commands.ts`:

```typescript
import { Command } from '@banyanai/platform-contract-system';

@Command({
  name: 'TodoService.Commands.CreateTodo',
  description: 'Create a new todo item',
  requiredPermissions: ['todo:create'],
})
export class CreateTodoCommand {
  text!: string;
  userId!: string;
}

export interface CreateTodoResult {
  success: boolean;
  todoId?: string;
  error?: string;
}

@Command({
  name: 'TodoService.Commands.UpdateTodo',
  description: 'Update todo text',
  requiredPermissions: ['todo:update'],
})
export class UpdateTodoCommand {
  todoId!: string;
  text!: string;
}

export interface UpdateTodoResult {
  success: boolean;
  error?: string;
}

@Command({
  name: 'TodoService.Commands.CompleteTodo',
  description: 'Mark a todo as completed',
  requiredPermissions: ['todo:update'],
})
export class CompleteTodoCommand {
  todoId!: string;
}

export interface CompleteTodoResult {
  success: boolean;
  error?: string;
}

@Command({
  name: 'TodoService.Commands.DeleteTodo',
  description: 'Delete a todo item',
  requiredPermissions: ['todo:delete'],
})
export class DeleteTodoCommand {
  todoId!: string;
}

export interface DeleteTodoResult {
  success: boolean;
  error?: string;
}
```

**Key Concepts:**
- Each command has a unique name following the pattern `Service.Commands.CommandName`
- `requiredPermissions` defines Layer 1 authorization (checked at API Gateway)
- Result interfaces include success flag and optional error message

### Step 3: Define Query Contracts

Create `packages/contracts/src/queries.ts`:

```typescript
import { Query } from '@banyanai/platform-contract-system';

export interface TodoDto {
  id: string;
  text: string;
  completed: boolean;
  userId: string;
  createdAt: string;
  completedAt?: string;
}

@Query({
  name: 'TodoService.Queries.GetTodo',
  description: 'Get a single todo by ID',
  requiredPermissions: ['todo:read'],
})
export class GetTodoQuery {
  todoId!: string;
}

export interface GetTodoResult {
  success: boolean;
  todo?: TodoDto;
  error?: string;
}

@Query({
  name: 'TodoService.Queries.ListTodos',
  description: 'List all todos for a user',
  requiredPermissions: ['todo:read'],
})
export class ListTodosQuery {
  userId!: string;
}

export interface ListTodosResult {
  success: boolean;
  todos?: TodoDto[];
  error?: string;
}
```

**Key Concepts:**
- Queries use `@Query` decorator (not `@Command`)
- Queries should be read-only - they don't modify state
- TodoDto is a data transfer object representing a todo item

### Step 4: Export Contracts

Create `packages/contracts/src/index.ts`:

```typescript
export * from './commands.js';
export * from './queries.js';
```

### Step 5: Build Contracts

```bash
cd packages/contracts
pnpm install
pnpm run build
```

Expected output:
```
Compiled successfully
```

## Part 2: Create Read Model

The read model stores todo data and provides query methods.

### Step 1: Create Service Package Configuration

Create `service/package.json`:

```json
{
  "name": "@myorg/todo-service",
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
    "@banyanai/platform-event-sourcing": "^1.0.116",
    "@banyanai/platform-telemetry": "^1.0.116",
    "@myorg/todo-service-contracts": "workspace:*"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.3"
  }
}
```

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

### Step 2: Create Todo Read Model

Create `service/src/read-models/TodoReadModel.ts`:

```typescript
import { ReadModel, ReadModelBase } from '@banyanai/platform-event-sourcing';

interface TodoData {
  id: string;
  text: string;
  completed: boolean;
  userId: string;
  createdAt: Date;
  completedAt?: Date;
}

@ReadModel({ tableName: 'todos' })
export class TodoReadModel extends ReadModelBase<TodoReadModel> {
  id!: string;
  text!: string;
  completed!: boolean;
  userId!: string;
  createdAt!: Date;
  completedAt?: Date;

  getId(): string {
    return this.id;
  }

  // In-memory storage (in production, use PostgreSQL)
  private static todos = new Map<string, TodoData>();

  static async findById(id: string): Promise<TodoReadModel | null> {
    const todoData = this.todos.get(id);
    if (!todoData) return null;

    const model = new TodoReadModel();
    Object.assign(model, todoData);
    return model;
  }

  static async findByUserId(userId: string): Promise<TodoReadModel[]> {
    const userTodos = Array.from(this.todos.values())
      .filter(todo => todo.userId === userId);

    return userTodos.map(todoData => {
      const model = new TodoReadModel();
      Object.assign(model, todoData);
      return model;
    });
  }

  static async create(todoData: TodoData): Promise<void> {
    this.todos.set(todoData.id, todoData);
  }

  static async update(id: string, updates: Partial<TodoData>): Promise<void> {
    const existing = this.todos.get(id);
    if (!existing) {
      throw new Error(`Todo ${id} not found`);
    }

    this.todos.set(id, {
      ...existing,
      ...updates,
    });
  }

  static async delete(id: string): Promise<void> {
    this.todos.delete(id);
  }
}
```

**Key Concepts:**
- `@ReadModel` decorator registers with platform
- Static methods provide data access interface
- In-memory Map for this tutorial (production would use database)
- `getId()` required by platform's read model system

## Part 3: Implement Command Handlers

Command handlers modify state (create, update, delete).

### Step 1: Create CreateTodoHandler

Create `service/src/commands/CreateTodoHandler.ts`:

```typescript
import { CommandHandler, CommandHandlerDecorator } from '@banyanai/platform-base-service';
import type { AuthenticatedUser } from '@banyanai/platform-core';
import { Logger } from '@banyanai/platform-telemetry';
import {
  CreateTodoCommand,
  type CreateTodoResult
} from '@myorg/todo-service-contracts';
import { TodoReadModel } from '../read-models/TodoReadModel.js';

@CommandHandlerDecorator(CreateTodoCommand)
export class CreateTodoHandler extends CommandHandler<CreateTodoCommand, CreateTodoResult> {
  constructor() {
    super();
  }

  async handle(command: CreateTodoCommand, user: AuthenticatedUser | null): Promise<CreateTodoResult> {
    try {
      Logger.info('Creating todo', { userId: command.userId, text: command.text });

      // Validation
      if (!command.text || command.text.trim().length === 0) {
        return {
          success: false,
          error: 'Todo text cannot be empty',
        };
      }

      if (command.text.length > 500) {
        return {
          success: false,
          error: 'Todo text cannot exceed 500 characters',
        };
      }

      // Generate ID
      const todoId = this.generateId();

      // Create todo
      await TodoReadModel.create({
        id: todoId,
        text: command.text.trim(),
        completed: false,
        userId: command.userId,
        createdAt: new Date(),
      });

      Logger.info('Todo created successfully', { todoId });

      return {
        success: true,
        todoId,
      };
    } catch (error) {
      Logger.error('Failed to create todo', { error, userId: command.userId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}
```

### Step 2: Create UpdateTodoHandler

Create `service/src/commands/UpdateTodoHandler.ts`:

```typescript
import { CommandHandler, CommandHandlerDecorator } from '@banyanai/platform-base-service';
import type { AuthenticatedUser } from '@banyanai/platform-core';
import { Logger } from '@banyanai/platform-telemetry';
import {
  UpdateTodoCommand,
  type UpdateTodoResult
} from '@myorg/todo-service-contracts';
import { TodoReadModel } from '../read-models/TodoReadModel.js';

@CommandHandlerDecorator(UpdateTodoCommand)
export class UpdateTodoHandler extends CommandHandler<UpdateTodoCommand, UpdateTodoResult> {
  constructor() {
    super();
  }

  async handle(command: UpdateTodoCommand, user: AuthenticatedUser | null): Promise<UpdateTodoResult> {
    try {
      Logger.info('Updating todo', { todoId: command.todoId });

      // Check todo exists
      const todo = await TodoReadModel.findById(command.todoId);
      if (!todo) {
        return {
          success: false,
          error: `Todo ${command.todoId} not found`,
        };
      }

      // Layer 2 Authorization: Users can only update their own todos
      if (user && todo.userId !== user.userId) {
        const isAdmin = user.permissions?.includes('todo:admin');
        if (!isAdmin) {
          return {
            success: false,
            error: 'You can only update your own todos',
          };
        }
      }

      // Validation
      if (!command.text || command.text.trim().length === 0) {
        return {
          success: false,
          error: 'Todo text cannot be empty',
        };
      }

      if (command.text.length > 500) {
        return {
          success: false,
          error: 'Todo text cannot exceed 500 characters',
        };
      }

      // Update todo
      await TodoReadModel.update(command.todoId, {
        text: command.text.trim(),
      });

      Logger.info('Todo updated successfully', { todoId: command.todoId });

      return {
        success: true,
      };
    } catch (error) {
      Logger.error('Failed to update todo', { error, todoId: command.todoId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}
```

### Step 3: Create CompleteTodoHandler

Create `service/src/commands/CompleteTodoHandler.ts`:

```typescript
import { CommandHandler, CommandHandlerDecorator } from '@banyanai/platform-base-service';
import type { AuthenticatedUser } from '@banyanai/platform-core';
import { Logger } from '@banyanai/platform-telemetry';
import {
  CompleteTodoCommand,
  type CompleteTodoResult
} from '@myorg/todo-service-contracts';
import { TodoReadModel } from '../read-models/TodoReadModel.js';

@CommandHandlerDecorator(CompleteTodoCommand)
export class CompleteTodoHandler extends CommandHandler<CompleteTodoCommand, CompleteTodoResult> {
  constructor() {
    super();
  }

  async handle(command: CompleteTodoCommand, user: AuthenticatedUser | null): Promise<CompleteTodoResult> {
    try {
      Logger.info('Completing todo', { todoId: command.todoId });

      // Check todo exists
      const todo = await TodoReadModel.findById(command.todoId);
      if (!todo) {
        return {
          success: false,
          error: `Todo ${command.todoId} not found`,
        };
      }

      // Layer 2 Authorization: Users can only complete their own todos
      if (user && todo.userId !== user.userId) {
        const isAdmin = user.permissions?.includes('todo:admin');
        if (!isAdmin) {
          return {
            success: false,
            error: 'You can only complete your own todos',
          };
        }
      }

      // Idempotency: Already completed is ok
      if (todo.completed) {
        Logger.info('Todo already completed', { todoId: command.todoId });
        return {
          success: true,
        };
      }

      // Complete todo
      await TodoReadModel.update(command.todoId, {
        completed: true,
        completedAt: new Date(),
      });

      Logger.info('Todo completed successfully', { todoId: command.todoId });

      return {
        success: true,
      };
    } catch (error) {
      Logger.error('Failed to complete todo', { error, todoId: command.todoId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}
```

### Step 4: Create DeleteTodoHandler

Create `service/src/commands/DeleteTodoHandler.ts`:

```typescript
import { CommandHandler, CommandHandlerDecorator } from '@banyanai/platform-base-service';
import type { AuthenticatedUser } from '@banyanai/platform-core';
import { Logger } from '@banyanai/platform-telemetry';
import {
  DeleteTodoCommand,
  type DeleteTodoResult
} from '@myorg/todo-service-contracts';
import { TodoReadModel } from '../read-models/TodoReadModel.js';

@CommandHandlerDecorator(DeleteTodoCommand)
export class DeleteTodoHandler extends CommandHandler<DeleteTodoCommand, DeleteTodoResult> {
  constructor() {
    super();
  }

  async handle(command: DeleteTodoCommand, user: AuthenticatedUser | null): Promise<DeleteTodoResult> {
    try {
      Logger.info('Deleting todo', { todoId: command.todoId });

      // Check todo exists
      const todo = await TodoReadModel.findById(command.todoId);
      if (!todo) {
        return {
          success: false,
          error: `Todo ${command.todoId} not found`,
        };
      }

      // Layer 2 Authorization: Users can only delete their own todos
      if (user && todo.userId !== user.userId) {
        const isAdmin = user.permissions?.includes('todo:admin');
        if (!isAdmin) {
          return {
            success: false,
            error: 'You can only delete your own todos',
          };
        }
      }

      // Delete todo
      await TodoReadModel.delete(command.todoId);

      Logger.info('Todo deleted successfully', { todoId: command.todoId });

      return {
        success: true,
      };
    } catch (error) {
      Logger.error('Failed to delete todo', { error, todoId: command.todoId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}
```

## Part 4: Implement Query Handlers

Query handlers read state without modifying it.

### Step 1: Create GetTodoHandler

Create `service/src/queries/GetTodoHandler.ts`:

```typescript
import { QueryHandler, QueryHandlerDecorator } from '@banyanai/platform-base-service';
import type { AuthenticatedUser } from '@banyanai/platform-core';
import { Logger } from '@banyanai/platform-telemetry';
import {
  GetTodoQuery,
  type GetTodoResult
} from '@myorg/todo-service-contracts';
import { TodoReadModel } from '../read-models/TodoReadModel.js';

@QueryHandlerDecorator(GetTodoQuery)
export class GetTodoHandler extends QueryHandler<GetTodoQuery, GetTodoResult> {
  constructor() {
    super();
  }

  async handle(query: GetTodoQuery, user: AuthenticatedUser | null): Promise<GetTodoResult> {
    try {
      Logger.info('Getting todo', { todoId: query.todoId });

      // Fetch todo
      const todo = await TodoReadModel.findById(query.todoId);
      if (!todo) {
        return {
          success: false,
          error: `Todo ${query.todoId} not found`,
        };
      }

      // Layer 2 Authorization: Users can only view their own todos
      if (user && todo.userId !== user.userId) {
        const isAdmin = user.permissions?.includes('todo:admin');
        if (!isAdmin) {
          return {
            success: false,
            error: 'You can only view your own todos',
          };
        }
      }

      return {
        success: true,
        todo: {
          id: todo.id,
          text: todo.text,
          completed: todo.completed,
          userId: todo.userId,
          createdAt: todo.createdAt.toISOString(),
          completedAt: todo.completedAt?.toISOString(),
        },
      };
    } catch (error) {
      Logger.error('Failed to get todo', { error, todoId: query.todoId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}
```

### Step 2: Create ListTodosHandler

Create `service/src/queries/ListTodosHandler.ts`:

```typescript
import { QueryHandler, QueryHandlerDecorator } from '@banyanai/platform-base-service';
import type { AuthenticatedUser } from '@banyanai/platform-core';
import { Logger } from '@banyanai/platform-telemetry';
import {
  ListTodosQuery,
  type ListTodosResult
} from '@myorg/todo-service-contracts';
import { TodoReadModel } from '../read-models/TodoReadModel.js';

@QueryHandlerDecorator(ListTodosQuery)
export class ListTodosHandler extends QueryHandler<ListTodosQuery, ListTodosResult> {
  constructor() {
    super();
  }

  async handle(query: ListTodosQuery, user: AuthenticatedUser | null): Promise<ListTodosResult> {
    try {
      Logger.info('Listing todos', { userId: query.userId });

      // Layer 2 Authorization: Users can only list their own todos
      if (user && query.userId !== user.userId) {
        const isAdmin = user.permissions?.includes('todo:admin');
        if (!isAdmin) {
          return {
            success: false,
            error: 'You can only view your own todos',
          };
        }
      }

      // Fetch todos
      const todos = await TodoReadModel.findByUserId(query.userId);

      return {
        success: true,
        todos: todos.map(todo => ({
          id: todo.id,
          text: todo.text,
          completed: todo.completed,
          userId: todo.userId,
          createdAt: todo.createdAt.toISOString(),
          completedAt: todo.completedAt?.toISOString(),
        })),
      };
    } catch (error) {
      Logger.error('Failed to list todos', { error, userId: query.userId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
}
```

## Part 5: Create Service Entry Point

### Create Main File

Create `service/src/index.ts`:

```typescript
import { BaseService } from '@banyanai/platform-base-service';
import { Logger } from '@banyanai/platform-telemetry';

async function main() {
  try {
    await BaseService.start({
      name: 'todo-service',
      version: '1.0.0',
    });

    Logger.info('Todo Service started successfully');
  } catch (error) {
    Logger.error('Failed to start service', { error });
    process.exit(1);
  }
}

main();
```

## Part 6: Build and Run

### Install Dependencies

```bash
# From todo-service root
pnpm install
```

### Build Everything

```bash
pnpm -r run build
```

Expected output:
```
packages/contracts: Compiled successfully
service: Compiled successfully
```

### Run Service

```bash
cd service
node dist/index.js
```

Expected output:
```
Handler discovery completed {
  commandHandlers: 4,
  queryHandlers: 2,
  eventHandlers: 0,
  totalHandlers: 6
}
Service registered with discovery: todo-service
Contract broadcast complete: 6 contracts
Todo Service started successfully
```

## Part 7: Test Your Service

### Create a Todo

```bash
curl -X POST http://localhost:3003/api/todos \
  -H "Content-Type: application/json" \
  -H "X-Dev-User-Id: user-123" \
  -H "X-Dev-Permissions: todo:create,todo:read,todo:update,todo:delete" \
  -d '{
    "text": "Learn the Banyan Platform",
    "userId": "user-123"
  }'
```

Response:
```json
{
  "success": true,
  "todoId": "550e8400-e29b-41d4-a716-446655440000"
}
```

### List Todos

```bash
curl -X POST http://localhost:3003/api/todos/list \
  -H "Content-Type: application/json" \
  -H "X-Dev-User-Id: user-123" \
  -H "X-Dev-Permissions: todo:read" \
  -d '{
    "userId": "user-123"
  }'
```

Response:
```json
{
  "success": true,
  "todos": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "text": "Learn the Banyan Platform",
      "completed": false,
      "userId": "user-123",
      "createdAt": "2025-01-15T10:30:45.123Z"
    }
  ]
}
```

### Complete a Todo

```bash
curl -X POST http://localhost:3003/api/todos/complete \
  -H "Content-Type: application/json" \
  -H "X-Dev-User-Id: user-123" \
  -H "X-Dev-Permissions: todo:update" \
  -d '{
    "todoId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

Response:
```json
{
  "success": true
}
```

### Update a Todo

```bash
curl -X POST http://localhost:3003/api/todos/update \
  -H "Content-Type: application/json" \
  -H "X-Dev-User-Id: user-123" \
  -H "X-Dev-Permissions: todo:update" \
  -d '{
    "todoId": "550e8400-e29b-41d4-a716-446655440000",
    "text": "Master the Banyan Platform"
  }'
```

Response:
```json
{
  "success": true
}
```

### Delete a Todo

```bash
curl -X POST http://localhost:3003/api/todos/delete \
  -H "Content-Type: application/json" \
  -H "X-Dev-User-Id: user-123" \
  -H "X-Dev-Permissions: todo:delete" \
  -d '{
    "todoId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

Response:
```json
{
  "success": true
}
```

### Test with GraphQL

Open [http://localhost:3003/graphql](http://localhost:3003/graphql) and try:

```graphql
mutation CreateTodo {
  createTodo(input: {
    text: "Build a microservice"
    userId: "user-123"
  }) {
    success
    todoId
    error
  }
}

query ListTodos {
  listTodos(input: {
    userId: "user-123"
  }) {
    success
    todos {
      id
      text
      completed
      createdAt
    }
  }
}
```

## Understanding What We Built

### Architecture

```
API Gateway (REST/GraphQL)
    ↓ (RabbitMQ)
Todo Service
    ├── Commands → Modify state
    ├── Queries → Read state
    └── Read Model → Store data
```

### Key Patterns Used

1. **CQRS (Command Query Responsibility Segregation)**
   - Commands modify state (create, update, delete)
   - Queries read state (get, list)
   - Separate handlers for each operation

2. **Two-Layer Authorization**
   - Layer 1 (API Gateway): Permission checks (`todo:create`, `todo:read`)
   - Layer 2 (Handlers): Policy checks (ownership verification)

3. **Handler Discovery**
   - Files in `/commands/` automatically discovered as command handlers
   - Files in `/queries/` automatically discovered as query handlers
   - No manual registration required

4. **Automatic API Generation**
   - REST endpoints generated from contracts
   - GraphQL schema generated from contracts
   - Type-safe end-to-end

### How It Works

1. **Request arrives** at API Gateway (REST or GraphQL)
2. **Gateway validates** permissions (Layer 1)
3. **Gateway sends** command/query to RabbitMQ
4. **Service receives** message and routes to handler
5. **Handler executes** business logic and policy checks (Layer 2)
6. **Handler returns** result
7. **Gateway sends** response back to client

## Extending the Example

Now that you have a working todo service, try adding:

1. **Priority Levels**: Add a `priority` field (low, medium, high)
2. **Due Dates**: Add a `dueDate` field and query for overdue todos
3. **Categories**: Add a `category` field and filter by category
4. **Search**: Add a query to search todos by text
5. **Batch Operations**: Add commands to complete/delete multiple todos

## Next Steps

Continue your learning journey:

- [User Management Service Tutorial](./user-management-service.md) - Add authentication
- [Event Sourcing Tutorial](../intermediate/event-sourcing-service.md) - Learn event sourcing
- [Multi-Service Integration](../intermediate/multi-service-integration.md) - Connect services

## Troubleshooting

### Handlers Not Discovered

**Problem:** Only some handlers discovered

**Solution:** Ensure all handler files:
- Are in correct directory (`/commands/` or `/queries/`)
- End with `Handler.ts`
- Have correct decorator (`@CommandHandlerDecorator` or `@QueryHandlerDecorator`)
- Extend correct base class (`CommandHandler` or `QueryHandler`)

### Authorization Failures

**Problem:** "You can only view your own todos" error

**Solution:** Ensure `X-Dev-User-Id` header matches `userId` in request:
```bash
-H "X-Dev-User-Id: user-123"
-d '{ "userId": "user-123", ... }'
```

### Todo Not Found

**Problem:** "Todo not found" when it should exist

**Solution:**
- Use the exact `todoId` returned from create
- Check service wasn't restarted (in-memory storage is lost on restart)
- For production, use PostgreSQL instead of in-memory Map

## Additional Resources

- [CQRS Pattern Deep Dive](../../02-concepts/cqrs-pattern.md)
- [Authorization Guide](../../02-concepts/authorization.md)
- [Read Models](../../02-concepts/read-models.md)
- [Testing Handlers](../../03-guides/testing-handlers.md)
