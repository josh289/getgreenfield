/**
 * GetTodoHandler - Handles single todo retrieval queries
 *
 * Demonstrates:
 * - Read-only query operations
 * - Policy-based access control
 * - Read model queries
 * - Projection to DTOs
 */

import { QueryHandler, QueryHandlerDecorator } from '@banyanai/platform-base-service';
import type { AuthenticatedUser } from '@banyanai/platform-core';
import { NotFoundError, PolicyViolationError } from '@banyanai/platform-core';
import { Logger } from '@banyanai/platform-telemetry';
import { toTodoDto } from '../domain/Todo.js';
import { GetTodoQuery, type GetTodoResult } from '../domain/contracts.js';
import { TodoReadModel } from '../read-models/TodoReadModel.js';

@QueryHandlerDecorator(GetTodoQuery)
export class GetTodoHandler extends QueryHandler<GetTodoQuery, GetTodoResult> {
  async handle(query: GetTodoQuery, user: AuthenticatedUser | null): Promise<GetTodoResult> {
    try {
      Logger.info('Fetching todo', { todoId: query.todoId, userId: query.userId });

      // 1. Query read model
      const todo = await TodoReadModel.findById(query.todoId);

      if (!todo) {
        throw new NotFoundError('Todo', query.todoId);
      }

      // 2. Policy enforcement - users can only view their own todos
      if (user && todo.userId !== user.userId) {
        const isAdmin = user.permissions.includes('todo:admin');
        if (!isAdmin) {
          throw new PolicyViolationError('You can only view your own todos');
        }
      }

      // 3. Project to DTO (removes sensitive fields if needed)
      const todoDto = toTodoDto(todo.toTodo());

      Logger.info('Todo fetched successfully', { todoId: query.todoId });

      return {
        success: true,
        todo: todoDto,
      };
    } catch (error) {
      Logger.error('Failed to fetch todo', error as Error, {
        todoId: query.todoId,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch todo',
      };
    }
  }
}
