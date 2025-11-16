/**
 * DeleteTodoHandler - Handles todo deletion commands
 *
 * Demonstrates:
 * - Soft vs hard deletes (this is hard delete)
 * - Ownership validation
 * - Idempotent delete operations
 */

import { CommandHandler, CommandHandlerDecorator } from '@banyanai/platform-base-service';
import type { AuthenticatedUser } from '@banyanai/platform-core';
import { NotFoundError, PolicyViolationError } from '@banyanai/platform-core';
import { Logger } from '@banyanai/platform-telemetry';
import {
  DeleteTodoCommand,
  type DeleteTodoResult,
} from '../domain/contracts.js';
import { TodoReadModel } from '../read-models/TodoReadModel.js';

@CommandHandlerDecorator(DeleteTodoCommand)
export class DeleteTodoHandler extends CommandHandler<DeleteTodoCommand, DeleteTodoResult> {
  async handle(
    command: DeleteTodoCommand,
    user: AuthenticatedUser | null,
  ): Promise<DeleteTodoResult> {
    try {
      Logger.info('Deleting todo', { todoId: command.todoId, userId: command.userId });

      // 1. Fetch existing todo
      const existingTodo = await TodoReadModel.findById(command.todoId);
      if (!existingTodo) {
        // Idempotent - already deleted
        Logger.info('Todo not found, already deleted', { todoId: command.todoId });
        return { success: true };
      }

      // 2. Policy enforcement - ownership check
      if (user && existingTodo.userId !== user.userId) {
        const isAdmin = user.permissions.includes('todo:admin');
        if (!isAdmin) {
          throw new PolicyViolationError('You can only delete your own todos');
        }
      }

      // 3. Delete the todo
      await TodoReadModel.deleteTodo(command.todoId);

      Logger.info('Todo deleted successfully', { todoId: command.todoId });

      return { success: true };
    } catch (error) {
      Logger.error('Failed to delete todo', error as Error, {
        todoId: command.todoId,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete todo',
      };
    }
  }
}
