/**
 * Todo Service Contracts
 *
 * This file defines all commands and queries for the todo service.
 * Contracts are decorated with @Command and @Query to enable:
 * - Type-safe operations
 * - Automatic validation
 * - Permission enforcement at API Gateway
 * - Auto-generated documentation
 */

import { Command, Query } from '@banyanai/platform-contract-system';
import type { TodoDto } from './Todo.js';

// ============================================================================
// COMMANDS (Write Operations)
// ============================================================================

@Command({
  description: 'Creates a new todo item',
  permissions: ['todo:create'],
})
export class CreateTodoCommand {
  text: string;
  userId: string;

  constructor(text: string, userId: string) {
    this.text = text;
    this.userId = userId;
  }
}

export interface CreateTodoResult {
  success: boolean;
  todoId?: string;
  text?: string;
  error?: string;
}

@Command({
  description: 'Updates the text of an existing todo item',
  permissions: ['todo:update'],
})
export class UpdateTodoCommand {
  todoId: string;
  text: string;
  userId: string;

  constructor(todoId: string, text: string, userId: string) {
    this.todoId = todoId;
    this.text = text;
    this.userId = userId;
  }
}

export interface UpdateTodoResult {
  success: boolean;
  todo?: TodoDto;
  error?: string;
}

@Command({
  description: 'Marks a todo item as completed or uncompleted',
  permissions: ['todo:update'],
})
export class CompleteTodoCommand {
  todoId: string;
  completed: boolean;
  userId: string;

  constructor(todoId: string, completed: boolean, userId: string) {
    this.todoId = todoId;
    this.completed = completed;
    this.userId = userId;
  }
}

export interface CompleteTodoResult {
  success: boolean;
  todo?: TodoDto;
  error?: string;
}

@Command({
  description: 'Deletes a todo item',
  permissions: ['todo:delete'],
})
export class DeleteTodoCommand {
  todoId: string;
  userId: string;

  constructor(todoId: string, userId: string) {
    this.todoId = todoId;
    this.userId = userId;
  }
}

export interface DeleteTodoResult {
  success: boolean;
  error?: string;
}

// ============================================================================
// QUERIES (Read Operations)
// ============================================================================

@Query({
  description: 'Retrieves a single todo item by ID',
  permissions: ['todo:read'],
})
export class GetTodoQuery {
  todoId: string;
  userId: string;

  constructor(todoId: string, userId: string) {
    this.todoId = todoId;
    this.userId = userId;
  }
}

export interface GetTodoResult {
  success: boolean;
  todo?: TodoDto;
  error?: string;
}

@Query({
  description: 'Lists all todo items for a user',
  permissions: ['todo:read'],
})
export class ListTodosQuery {
  userId: string;
  completed?: boolean; // Optional filter

  constructor(userId: string, completed?: boolean) {
    this.userId = userId;
    this.completed = completed;
  }
}

export interface ListTodosResult {
  success: boolean;
  todos?: TodoDto[];
  count?: number;
  error?: string;
}
