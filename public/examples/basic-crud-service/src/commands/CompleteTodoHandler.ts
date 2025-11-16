/**
 * CompleteTodoHandler - Handles todo completion/incompletion commands
 *
 * Demonstrates:
 * - Boolean state changes
 * - Idempotent operations
 * - Ownership validation
 */

import { CommandHandler, CommandHandlerDecorator } from '@banyanai/platform-base-service';
import type { AuthenticatedUser } from '@banyanai/platform-core';
import { NotFoundError, PolicyViolationError } from '@banyanai/platform-core';
import { Logger } from '@banyanai/platform-telemetry';
import { toTodoDto } from '../domain/Todo.js';
import {
  CompleteTodoCommand,
  type CompleteTodoResult,
} from '../domain/contracts.js';
import { TodoReadModel } from '../read-models/TodoReadModel.js';

@CommandHandlerDecorator(CompleteTodoCommand)
export class CompleteTodoHandler extends CommandHandler<CompleteTodoCommand, CompleteTodoResult> {
  async handle(
    command: CompleteTodoCommand,
    user: AuthenticatedUser | null,
  ): Promise<CompleteTodoResult> {
    try {
      Logger.info('Completing todo', {
        todoId: command.todoId,
        completed: command.completed,
      });

      // 1. Fetch existing todo
      const existingTodo = await TodoReadModel.findById(command.todoId);
      if (!existingTodo) {
        throw new NotFoundError('Todo', command.todoId);
      }

      // 2. Policy enforcement - ownership check
      if (user && existingTodo.userId !== user.userId) {
        const isAdmin = user.permissions.includes('todo:admin');
        if (!isAdmin) {
          throw new PolicyViolationError('You can only modify your own todos');
        }
      }

      // 3. Idempotent check - if already in desired state, skip update
      if (existingTodo.completed === command.completed) {
        Logger.info('Todo already in desired completion state', {
          todoId: command.todoId,
          completed: command.completed,
        });

        return {
          success: true,
          todo: toTodoDto(existingTodo.toTodo()),
        };
      }

      // 4. Update completion status
      await TodoReadModel.updateTodo(command.todoId, {
        completed: command.completed,
      });

      // 5. Fetch updated todo for response
      const updatedTodo = await TodoReadModel.findById(command.todoId);
      if (!updatedTodo) {
        throw new Error('Todo was deleted during update');
      }

      Logger.info('Todo completion status updated', {
        todoId: command.todoId,
        completed: command.completed,
      });

      return {
        success: true,
        todo: toTodoDto(updatedTodo.toTodo()),
      };
    } catch (error) {
      Logger.error('Failed to update todo completion status', error as Error, {
        todoId: command.todoId,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update todo',
      };
    }
  }
}
