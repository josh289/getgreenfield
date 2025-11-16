/**
 * UpdateTodoHandler - Handles todo text update commands
 *
 * Demonstrates:
 * - Reading existing state before updating
 * - Policy-based ownership checks
 * - Partial updates
 * - Optimistic concurrency patterns
 */

import { CommandHandler, CommandHandlerDecorator } from '@banyanai/platform-base-service';
import type { AuthenticatedUser } from '@banyanai/platform-core';
import { NotFoundError, PolicyViolationError, ValidationError } from '@banyanai/platform-core';
import { Logger } from '@banyanai/platform-telemetry';
import { toTodoDto } from '../domain/Todo.js';
import {
  UpdateTodoCommand,
  type UpdateTodoResult,
} from '../domain/contracts.js';
import { TodoReadModel } from '../read-models/TodoReadModel.js';

@CommandHandlerDecorator(UpdateTodoCommand)
export class UpdateTodoHandler extends CommandHandler<UpdateTodoCommand, UpdateTodoResult> {
  async handle(
    command: UpdateTodoCommand,
    user: AuthenticatedUser | null,
  ): Promise<UpdateTodoResult> {
    try {
      Logger.info('Updating todo', { todoId: command.todoId, userId: command.userId });

      // 1. Validate input
      if (!command.text || command.text.trim().length === 0) {
        throw new ValidationError('Todo text is required');
      }

      if (command.text.length > 500) {
        throw new ValidationError('Todo text must be less than 500 characters');
      }

      // 2. Fetch existing todo
      const existingTodo = await TodoReadModel.findById(command.todoId);
      if (!existingTodo) {
        throw new NotFoundError('Todo', command.todoId);
      }

      // 3. Policy enforcement - ownership check
      if (user && existingTodo.userId !== user.userId) {
        const isAdmin = user.permissions.includes('todo:admin');
        if (!isAdmin) {
          throw new PolicyViolationError('You can only update your own todos');
        }
      }

      // 4. Update the todo
      await TodoReadModel.updateTodo(command.todoId, {
        text: command.text.trim(),
      });

      // 5. Fetch updated todo for response
      const updatedTodo = await TodoReadModel.findById(command.todoId);
      if (!updatedTodo) {
        throw new Error('Todo was deleted during update');
      }

      Logger.info('Todo updated successfully', { todoId: command.todoId });

      return {
        success: true,
        todo: toTodoDto(updatedTodo.toTodo()),
      };
    } catch (error) {
      Logger.error('Failed to update todo', error as Error, {
        todoId: command.todoId,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update todo',
      };
    }
  }
}
