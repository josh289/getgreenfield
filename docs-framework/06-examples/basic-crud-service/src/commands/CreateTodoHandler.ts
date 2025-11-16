/**
 * CreateTodoHandler - Handles todo creation commands
 *
 * This handler demonstrates:
 * - Pure business logic (no infrastructure code)
 * - Automatic permission enforcement via @Command decorator
 * - Policy-based authorization in handler
 * - Read model persistence
 * - Error handling patterns
 */

import { CommandHandler, CommandHandlerDecorator } from '@banyanai/platform-base-service';
import type { AuthenticatedUser } from '@banyanai/platform-core';
import { ValidationError } from '@banyanai/platform-core';
import { Logger } from '@banyanai/platform-telemetry';
import type { Todo } from '../domain/Todo.js';
import {
  CreateTodoCommand,
  type CreateTodoResult,
} from '../domain/contracts.js';
import { TodoReadModel } from '../read-models/TodoReadModel.js';

@CommandHandlerDecorator(CreateTodoCommand)
export class CreateTodoHandler extends CommandHandler<CreateTodoCommand, CreateTodoResult> {
  async handle(
    command: CreateTodoCommand,
    user: AuthenticatedUser | null,
  ): Promise<CreateTodoResult> {
    try {
      Logger.info('Creating todo', { userId: command.userId });

      // 1. Validate input (business validation, not infrastructure)
      if (!command.text || command.text.trim().length === 0) {
        throw new ValidationError('Todo text is required');
      }

      if (command.text.length > 500) {
        throw new ValidationError('Todo text must be less than 500 characters');
      }

      // 2. Policy enforcement (Layer 2 authorization)
      // Users can only create todos for themselves unless they're an admin
      if (user && command.userId !== user.userId) {
        const isAdmin = user.permissions.includes('todo:admin');
        if (!isAdmin) {
          return {
            success: false,
            error: 'You can only create todos for yourself',
          };
        }
      }

      // 3. Generate ID and create domain entity
      const todoId = this.generateId();
      const now = new Date();

      const todo: Todo = {
        id: todoId,
        text: command.text.trim(),
        userId: command.userId,
        completed: false,
        createdAt: now,
        updatedAt: now,
      };

      // 4. Persist to read model
      await TodoReadModel.create(todo);

      Logger.info('Todo created successfully', { todoId, userId: command.userId });

      // 5. Return success result
      return {
        success: true,
        todoId,
        text: todo.text,
      };
    } catch (error) {
      Logger.error('Failed to create todo', error as Error, {
        userId: command.userId,
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create todo',
      };
    }
  }
}
