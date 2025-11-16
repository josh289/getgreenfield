/**
 * TodoReadModel - Read model for querying todos
 *
 * This read model provides a denormalized view of todos optimized for queries.
 * In this basic CRUD example, it's a simple table without event sourcing.
 *
 * Key features:
 * - Extends ReadModelBase for database persistence
 * - Decorated with @ReadModel for automatic table creation
 * - Provides static query methods for type-safe access
 */

import { ReadModel, ReadModelBase } from '@banyanai/platform-event-sourcing';
import type { Todo } from '../domain/Todo.js';

@ReadModel({ tableName: 'rm_todos' })
export class TodoReadModel extends ReadModelBase<TodoReadModel> {
  id!: string;
  text!: string;
  userId!: string;
  completed!: boolean;
  createdAt!: Date;
  updatedAt!: Date;

  /**
   * Get the unique identifier for this read model instance
   */
  getId(): string {
    return this.id;
  }

  /**
   * Find a todo by ID
   */
  static async findById(id: string): Promise<TodoReadModel | null> {
    const results = await TodoReadModel.findBy<TodoReadModel>({ id });
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find all todos for a specific user
   */
  static async findByUserId(userId: string): Promise<TodoReadModel[]> {
    return await TodoReadModel.findBy<TodoReadModel>({ userId });
  }

  /**
   * Find all todos for a user with optional completion filter
   */
  static async findByUserIdFiltered(
    userId: string,
    completed?: boolean,
  ): Promise<TodoReadModel[]> {
    if (completed === undefined) {
      return await TodoReadModel.findByUserId(userId);
    }
    return await TodoReadModel.findBy<TodoReadModel>({ userId, completed });
  }

  /**
   * Create a new todo in the read model
   */
  static async create(todo: Todo): Promise<void> {
    const readModel = new TodoReadModel();
    readModel.id = todo.id;
    readModel.text = todo.text;
    readModel.userId = todo.userId;
    readModel.completed = todo.completed;
    readModel.createdAt = todo.createdAt;
    readModel.updatedAt = todo.updatedAt;

    await readModel.save();
  }

  /**
   * Update an existing todo in the read model
   */
  static async updateTodo(todoId: string, updates: Partial<Todo>): Promise<void> {
    const todo = await TodoReadModel.findById(todoId);
    if (!todo) {
      throw new Error(`Todo ${todoId} not found`);
    }

    if (updates.text !== undefined) todo.text = updates.text;
    if (updates.completed !== undefined) todo.completed = updates.completed;
    todo.updatedAt = new Date();

    await todo.save();
  }

  /**
   * Delete a todo from the read model
   */
  static async deleteTodo(todoId: string): Promise<void> {
    const todo = await TodoReadModel.findById(todoId);
    if (todo) {
      await todo.delete();
    }
  }

  /**
   * Convert read model instance to Todo domain object
   */
  toTodo(): Todo {
    return {
      id: this.id,
      text: this.text,
      userId: this.userId,
      completed: this.completed,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
