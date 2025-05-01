import { Todo } from '../types/todo';

export class TodoService {
  private todos: Todo[] = [];

  async getTodos(): Promise<Todo[]> {
    return this.todos;
  }

  async getTodo(id: string): Promise<Todo> {
    const todo = this.todos.find(t => t.id === id);
    if (!todo) {
      throw new Error('Todo not found');
    }
    return todo;
  }

  async createTodo(title: string, completed: boolean = false): Promise<Todo> {
    const newTodo: Todo = {
      id: Date.now().toString(),
      title,
      completed,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.todos.push(newTodo);
    return newTodo;
  }

  async updateTodo(id: string, updates: Partial<Todo>): Promise<Todo> {
    const index = this.todos.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Todo not found');
    }
    const updatedTodo = {
      ...this.todos[index],
      ...updates,
      updatedAt: new Date(),
    };
    this.todos[index] = updatedTodo;
    return updatedTodo;
  }

  async deleteTodo(id: string): Promise<void> {
    const index = this.todos.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Todo not found');
    }
    this.todos.splice(index, 1);
  }
}

export const todoService = new TodoService(); 