# Basic CRUD Service Example - Todo List

## Overview

This example demonstrates a simple todo list service using basic CQRS patterns **without event sourcing**. It's the perfect starting point for understanding the platform's core concepts.

## What You'll Learn

- Creating command and query handlers
- Defining service contracts with permissions
- Using read models for data persistence
- Zero-infrastructure service startup with `BaseService.start()`
- Two-layer authorization (permissions + policies)
- Type-safe operations

## Prerequisites

- Node.js 20+
- pnpm installed
- Docker and Docker Compose (for infrastructure)
- Basic understanding of TypeScript

## Service Architecture

This service implements a simple todo list with the following capabilities:

### Commands (Write Operations)
- **CreateTodo**: Create a new todo item
- **UpdateTodo**: Update todo text
- **CompleteTodo**: Mark a todo as completed
- **DeleteTodo**: Remove a todo item

### Queries (Read Operations)
- **GetTodo**: Retrieve a single todo by ID
- **ListTodos**: List all todos for a user

### Read Model
- **TodoReadModel**: Simple in-memory or database-backed read model for querying todos

## Key Concepts Demonstrated

### 1. Zero Infrastructure Code
The service starts with just one line:
```typescript
await BaseService.start({ serviceName: 'todo-service' });
```

No HTTP servers, no database connections, no message queue setup - the platform handles everything.

### 2. Command/Query Separation (CQRS)
- Commands change state (create, update, delete)
- Queries read state (get, list)
- Handlers are in separate folders for automatic discovery

### 3. Contract-Driven Development
All operations are defined with type-safe contracts:
```typescript
@Command({
  description: 'Creates a new todo item',
  permissions: ['todo:create']
})
export class CreateTodoCommand {
  text: string;
  userId: string;
}
```

### 4. Automatic Handler Discovery
Place handlers in the correct folders:
- `/commands/` → Command handlers
- `/queries/` → Query handlers

The platform discovers and registers them automatically.

### 5. Two-Layer Authorization
- **Layer 1 (API Gateway)**: Permission-based - declared in `@Command` decorator
- **Layer 2 (Handler)**: Policy-based - business rules in handler code

## Project Structure

```
basic-crud-service/
├── README.md                    # This file
├── package.json                 # Dependencies
├── src/
│   ├── main.ts                  # Service entry point (one-line startup)
│   ├── domain/
│   │   └── Todo.ts              # Todo domain model
│   ├── commands/
│   │   ├── CreateTodoHandler.ts
│   │   ├── UpdateTodoHandler.ts
│   │   ├── CompleteTodoHandler.ts
│   │   └── DeleteTodoHandler.ts
│   ├── queries/
│   │   ├── GetTodoHandler.ts
│   │   └── ListTodosHandler.ts
│   └── read-models/
│       └── TodoReadModel.ts     # Read model for queries
```

## Setup Instructions

### 1. Install Dependencies

```bash
cd basic-crud-service
pnpm install
```

### 2. Start Infrastructure

The service requires RabbitMQ and PostgreSQL. Start them with:

```bash
# From the platform root directory
docker compose up -d rabbitmq postgres
```

### 3. Set Environment Variables

Create a `.env` file:

```bash
# Service Configuration
SERVICE_NAME=todo-service
SERVICE_VERSION=1.0.0
ENVIRONMENT=development

# Message Bus (RabbitMQ)
MESSAGE_BUS_URL=amqp://guest:guest@localhost:5672
MESSAGE_BUS_EXCHANGE=platform

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=todos
DB_USERNAME=postgres
DB_PASSWORD=postgres

# Telemetry (Optional)
JAEGER_ENDPOINT=http://localhost:14268/api/traces
```

### 4. Build the Service

```bash
pnpm run build
```

### 5. Run the Service

```bash
pnpm start
```

You should see output indicating the service has started:
```
[INFO] BaseService startup initiated
[INFO] Telemetry initialized
[INFO] Database connected
[INFO] Message bus connected
[INFO] Handlers discovered: 6
[INFO] BaseService startup completed successfully
```

## Testing the Service

### Using the Platform Client

The platform auto-generates a type-safe client for your service:

```typescript
import { TodoServiceClient } from '@your-org/todo-service-client';

const client = new TodoServiceClient();

// Create a todo
const result = await client.createTodo({
  text: 'Learn the Banyan Platform',
  userId: 'user-123'
});

// List todos
const todos = await client.listTodos({ userId: 'user-123' });
```

### Via Message Bus (Direct)

You can also send commands via RabbitMQ directly:

```typescript
import { MessageBusClient } from '@banyanai/platform-message-bus-client';

const messageBus = new MessageBusClient(/* config */);

await messageBus.sendCommand('TodoService.Commands.CreateTodo', {
  text: 'Learn event sourcing',
  userId: 'user-123'
});
```

## Code Walkthrough

### Command Handler Example

```typescript
// src/commands/CreateTodoHandler.ts
import { CommandHandler, CommandHandlerDecorator } from '@banyanai/platform-base-service';
import { AuthenticatedUser } from '@banyanai/platform-core';
import { CreateTodoCommand, CreateTodoResult } from '../contracts';
import { TodoReadModel } from '../read-models/TodoReadModel';

@CommandHandlerDecorator(CreateTodoCommand)
export class CreateTodoHandler extends CommandHandler<CreateTodoCommand, CreateTodoResult> {
  async handle(command: CreateTodoCommand, user: AuthenticatedUser | null): Promise<CreateTodoResult> {
    // Business logic only - no infrastructure code!

    // 1. Validate business rules
    if (!command.text || command.text.trim().length === 0) {
      return { success: false, error: 'Todo text is required' };
    }

    // 2. Create domain entity
    const todoId = this.generateId();
    const todo = {
      id: todoId,
      text: command.text,
      userId: command.userId,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // 3. Save to read model
    await TodoReadModel.create(todo);

    // 4. Return result
    return {
      success: true,
      todoId,
      text: command.text
    };
  }
}
```

### Query Handler Example

```typescript
// src/queries/GetTodoHandler.ts
import { QueryHandler, QueryHandlerDecorator } from '@banyanai/platform-base-service';
import { AuthenticatedUser } from '@banyanai/platform-core';
import { GetTodoQuery, GetTodoResult } from '../contracts';
import { TodoReadModel } from '../read-models/TodoReadModel';

@QueryHandlerDecorator(GetTodoQuery)
export class GetTodoHandler extends QueryHandler<GetTodoQuery, GetTodoResult> {
  async handle(query: GetTodoQuery, user: AuthenticatedUser | null): Promise<GetTodoResult> {
    // Pure query logic - read only

    const todo = await TodoReadModel.findById(query.todoId);

    if (!todo) {
      return { success: false, error: 'Todo not found' };
    }

    // Policy check: Users can only view their own todos
    if (user && todo.userId !== user.userId && !user.permissions.includes('todo:admin')) {
      return { success: false, error: 'Unauthorized' };
    }

    return {
      success: true,
      todo: {
        id: todo.id,
        text: todo.text,
        completed: todo.completed,
        createdAt: todo.createdAt,
        updatedAt: todo.updatedAt
      }
    };
  }
}
```

### Read Model Example

```typescript
// src/read-models/TodoReadModel.ts
import { ReadModel, ReadModelBase } from '@banyanai/platform-event-sourcing';

@ReadModel({ tableName: 'todos' })
export class TodoReadModel extends ReadModelBase<TodoReadModel> {
  id!: string;
  text!: string;
  userId!: string;
  completed!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  getId(): string {
    return this.id;
  }

  static async findById(id: string): Promise<TodoReadModel | null> {
    const results = await TodoReadModel.findBy<TodoReadModel>({ id });
    return results.length > 0 ? results[0] : null;
  }

  static async findByUserId(userId: string): Promise<TodoReadModel[]> {
    return await TodoReadModel.findBy<TodoReadModel>({ userId });
  }
}
```

## Authorization Examples

### Layer 1: Permission-Based (API Gateway)

Declared in the contract decorator:

```typescript
@Command({
  description: 'Deletes a todo item',
  permissions: ['todo:delete'] // Checked at API Gateway
})
export class DeleteTodoCommand {
  todoId: string;
  userId: string;
}
```

Users without the `todo:delete` permission are rejected at the API Gateway - they never reach your handler.

### Layer 2: Policy-Based (Business Rules)

Implemented in the handler:

```typescript
async handle(command: DeleteTodoCommand, user: AuthenticatedUser | null): Promise<DeleteTodoResult> {
  const todo = await TodoReadModel.findById(command.todoId);

  // Policy: Users can only delete their own todos (unless admin)
  if (user && todo.userId !== user.userId && !user.permissions.includes('todo:admin')) {
    throw new PolicyViolationError('You can only delete your own todos');
  }

  // Business logic continues...
}
```

## Common Patterns

### Generating IDs
```typescript
const todoId = this.generateId(); // UUID v4
```

### Error Handling
```typescript
import { NotFoundError, ValidationError, PolicyViolationError } from '@banyanai/platform-core';

// Not found
if (!todo) {
  throw new NotFoundError('Todo', todoId);
}

// Validation error
if (!command.text) {
  throw new ValidationError('Todo text is required');
}

// Policy violation
if (todo.userId !== user.userId) {
  throw new PolicyViolationError('Cannot modify another user\'s todo');
}
```

### Logging
```typescript
import { Logger } from '@banyanai/platform-telemetry';

Logger.info('Creating todo', { todoId, userId: command.userId });
Logger.error('Failed to create todo', error, { todoId });
```

## What's Next?

Once you're comfortable with this basic CRUD example, move on to:

1. **Event-Sourced Service Example**: Learn event sourcing with the Order Management example
2. **External Auth Integration Example**: Integrate Auth0 or other OIDC providers
3. **Saga Framework**: Handle distributed transactions across multiple services

## Key Takeaways

1. **Zero Infrastructure**: You wrote only business logic - no HTTP, database, or message queue code
2. **Convention over Configuration**: Handlers discovered automatically by folder location
3. **Type Safety**: All operations are type-safe at compile time
4. **Two-Layer Auth**: Permissions at gateway, policies in handlers
5. **One-Line Startup**: `BaseService.start()` provides complete service infrastructure

## Troubleshooting

### Service won't start
- Ensure RabbitMQ and PostgreSQL are running
- Check environment variables are set correctly
- Verify no port conflicts

### Handlers not found
- Ensure handlers are in `/commands/` or `/queries/` folders
- Check decorators are applied correctly
- Verify handlers extend the correct base class

### Database errors
- Check database connection string
- Ensure database exists and user has permissions
- Verify migrations have run (if applicable)

## Additional Resources

- [Platform Architecture Documentation](../../01-architecture/)
- [CQRS Pattern Guide](../../02-core-concepts/cqrs-pattern.md)
- [Authorization Guide](../../02-core-concepts/authorization.md)
- [Event-Sourced Service Example](../event-sourced-service/)
