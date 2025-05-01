import { Todo } from '@/types/todo';
import toast from 'react-hot-toast';

export interface TodoService {
  getTodos(): Promise<Todo[]>;
  getTodo(id: string): Promise<Todo>;
  createTodo(title: string): Promise<Todo>;
  updateTodo(id: string, todo: Partial<Todo>): Promise<Todo>;
  deleteTodo(id: string): Promise<void>;
}

export class ApiTodoService implements TodoService {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:3001/api') {
    this.baseUrl = baseUrl;
  }

  private async fetchWithErrorHandling<T>(url: string, options?: RequestInit): Promise<T> {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Return null for 204 No Content responses
      if (response.status === 204) {
        return null as T;
      }
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async getTodos(): Promise<Todo[]> {
    return this.fetchWithErrorHandling<Todo[]>(`${this.baseUrl}/todos`);
  }

  async getTodo(id: string): Promise<Todo> {
    return this.fetchWithErrorHandling<Todo>(`${this.baseUrl}/todos/${id}`);
  }

  async createTodo(title: string): Promise<Todo> {
    return this.fetchWithErrorHandling<Todo>(`${this.baseUrl}/todos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    });
  }

  async updateTodo(id: string, todo: Partial<Todo>): Promise<Todo> {
    return this.fetchWithErrorHandling<Todo>(`${this.baseUrl}/todos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(todo),
    });
  }

  async deleteTodo(id: string): Promise<void> {
    await this.fetchWithErrorHandling<void>(`${this.baseUrl}/todos/${id}`, {
      method: 'DELETE',
    });
  }
}

export class LocalStorageTodoService implements TodoService {
  private readonly STORAGE_KEY = 'todos';

  private getTodosFromStorage(): Todo[] {
    const todosJson = localStorage.getItem(this.STORAGE_KEY);
    return todosJson ? JSON.parse(todosJson) : [];
  }

  private saveTodosToStorage(todos: Todo[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(todos));
  }

  async getTodos(): Promise<Todo[]> {
    return this.getTodosFromStorage();
  }

  async getTodo(id: string): Promise<Todo> {
    const todos = this.getTodosFromStorage();
    const todo = todos.find(t => t.id === id);
    if (!todo) {
      throw new Error('Todo not found');
    }
    return todo;
  }

  async createTodo(title: string): Promise<Todo> {
    const todos = this.getTodosFromStorage();
    const newTodo: Todo = {
      id: Date.now().toString(),
      title,
      completed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    todos.push(newTodo);
    this.saveTodosToStorage(todos);
    return newTodo;
  }

  async updateTodo(id: string, updates: Partial<Todo>): Promise<Todo> {
    const todos = this.getTodosFromStorage();
    const index = todos.findIndex(t => t.id === id);
    if (index === -1) {
      throw new Error('Todo not found');
    }
    const updatedTodo = {
      ...todos[index],
      ...updates,
      updatedAt: new Date(),
    };
    todos[index] = updatedTodo;
    this.saveTodosToStorage(todos);
    return updatedTodo;
  }

  async deleteTodo(id: string): Promise<void> {
    const todos = this.getTodosFromStorage();
    const filteredTodos = todos.filter(t => t.id !== id);
    this.saveTodosToStorage(filteredTodos);
  }
}

// Factory function to create the appropriate service
export function createTodoService(): TodoService {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return new ApiTodoService();
  }

  // Try to use API first, fall back to localStorage if it fails
  const apiService = new ApiTodoService();
  const localStorageService = new LocalStorageTodoService();

  // Test API connection
  return new Proxy(apiService, {
    get(target, prop) {
      return async function (...args: any[]) {
        try {
          // @ts-ignore
          return await target[prop](...args);
        } catch (error) {
          console.warn('API failed, falling back to localStorage:', error);
          toast.error('Backend unavailable. Using local storage instead.', {
            duration: 4000,
            position: 'bottom-right',
            style: {
              background: '#333',
              color: '#fff',
              borderRadius: '8px',
              padding: '16px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            },
            icon: '⚠️',
          });
          // @ts-ignore
          return await localStorageService[prop](...args);
        }
      };
    },
  });
} 