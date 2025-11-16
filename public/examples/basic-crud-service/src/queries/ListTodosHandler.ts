/**
 * ListTodosHandler - Handles todo listing queries
 *
 * Demonstrates:
 * - Collection queries
 * - Optional filtering
 * - Batch DTO conversion
 * - Performance considerations for large result sets
 */

import { QueryHandler, QueryHandlerDecorator } from '@banyanai/platform-base-service';
import type { AuthenticatedUser } from '@banyanai/platform-core';
import { Logger } from '@banyanai/platform-telemetry';
import { toTodoDto } from '../domain/Todo.js';
import { ListTodosQuery, type ListTodosResult } from '../domain/contracts.js';
import { TodoReadModel } from '../read-models/TodoReadModel.js';

@QueryHandlerDecorator(ListTodosQuery)
export class ListTodosHandler extends QueryHandler<ListTodosQuery, ListTodosResult> {
  async handle(query: ListTodosQuery, user: AuthenticatedUser | null): Promise<ListTodosResult> {
    try {
      Logger.info('Listing todos', {
        userId: query.userId,
        completed: query.completed,
      });

      // 1. Query read model with optional filter
      const todos = await TodoReadModel.findByUserIdFiltered(query.userId, query.completed);

      // 2. Convert to DTOs
      const todoDtos = todos.map((todo) => toTodoDto(todo.toTodo()));

      Logger.info('Todos listed successfully', {
        userId: query.userId,
        count: todoDtos.length,
      });

      return {
        success: true,
        todos: todoDtos,
        count: todoDtos.length,
      };
    } catch (error) {
      Logger.error('Failed to list todos', error as Error, {
        userId: query.userId,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to list todos',
      };
    }
  }
}
