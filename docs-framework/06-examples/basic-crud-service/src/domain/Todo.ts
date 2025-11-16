/**
 * Todo Domain Model
 *
 * Simple domain entity representing a todo item.
 * In this basic CRUD example, we use simple objects rather than complex aggregates.
 */

export interface Todo {
  id: string;
  text: string;
  userId: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TodoDto {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Helper to convert Todo entity to DTO (removes sensitive fields)
 */
export function toTodoDto(todo: Todo): TodoDto {
  return {
    id: todo.id,
    text: todo.text,
    completed: todo.completed,
    createdAt: todo.createdAt,
    updatedAt: todo.updatedAt,
  };
}
