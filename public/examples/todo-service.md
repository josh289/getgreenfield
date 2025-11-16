---
title: "Todo Service Example"
description: "Complete reference implementation of a CRUD todo list service"
category: "examples"
tags: ["example", "crud", "reference", "beginner"]
difficulty: "beginner"
last_updated: "2025-01-15"
status: "published"
---

# Todo Service Example

> **Reference Implementation**: A complete, production-ready todo list service demonstrating CQRS patterns without event sourcing.

## Overview

This is a reference implementation of a simple CRUD todo service. Use this as a template for building your own services with basic create, read, update, and delete operations.

For the complete implementation, see:
- [Basic CRUD Service Example](./basic-crud-service/README.md)

## Features

- Create, read, update, complete, and delete todos
- User ownership and authorization
- Permission-based access control
- Policy-based business rules
- REST and GraphQL APIs auto-generated

## Architecture

```
Commands:
- CreateTodo
- UpdateTodo
- CompleteTodo
- DeleteTodo

Queries:
- GetTodo
- ListTodos

Read Model:
- TodoReadModel (in-memory or PostgreSQL)
```

## Key Implementation Details

### Command Handler Example

```typescript
@CommandHandlerDecorator(CreateTodoCommand)
export class CreateTodoHandler extends CommandHandler<CreateTodoCommand, CreateTodoResult> {
  async handle(command: CreateTodoCommand, user: AuthenticatedUser | null): Promise<CreateTodoResult> {
    // Validation
    if (!command.text || command.text.trim().length === 0) {
      return { success: false, error: 'Todo text is required' };
    }

    // Generate ID and create
    const todoId = this.generateId();
    await TodoReadModel.create({
      id: todoId,
      text: command.text,
      userId: command.userId,
      completed: false,
      createdAt: new Date(),
    });

    return { success: true, todoId };
  }
}
```

### Authorization Pattern

```typescript
// Layer 2: Policy-based authorization
if (user && todo.userId !== user.userId) {
  const isAdmin = user.permissions?.includes('todo:admin');
  if (!isAdmin) {
    return { success: false, error: 'You can only access your own todos' };
  }
}
```

## Use Cases

Use this example when you need:
- Simple CRUD operations
- User-owned resources
- Basic authorization patterns
- Learning platform fundamentals

## Getting Started

See the [Todo Service Tutorial](../01-tutorials/beginner/todo-service.md) for step-by-step instructions to build this service yourself.

## Additional Resources

- [CQRS Pattern](../02-concepts/cqrs-pattern.md)
- [Authorization](../02-concepts/authorization.md)
- [Read Models](../02-concepts/read-models.md)
