import { Todo } from '@/types/todo';
import toast from 'react-hot-toast';

export interface TodoService {
  getTodos(): Promise<Todo[]>;
  getTodo(id: string): Promise<Todo>;
  createTodo(title: string): Promise<Todo>;
  updateTodo(id: string, todo: Partial<Todo>): Promise<Todo>;
  deleteTodo(id: string): Promise<void>;
  syncTodos(todos: Todo[]): Promise<void>;
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

  async syncTodos(todos: Todo[]): Promise<void> {
    // First, get all existing todos from the backend
    const existingTodos = await this.getTodos();
    const existingIds = new Set(existingTodos.map(t => t.id));

    // Create a batch of todos that don't exist in the backend
    const todosToSync = todos.filter(t => !existingIds.has(t.id));
    
    if (todosToSync.length > 0) {
      // Sync each todo that doesn't exist in the backend
      await Promise.all(todosToSync.map(todo => 
        this.fetchWithErrorHandling<Todo>(`${this.baseUrl}/todos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: todo.title,
            completed: todo.completed,
            createdAt: todo.createdAt,
            updatedAt: todo.updatedAt
          }),
        }).then(createdTodo => {
          // Update the local todo with the backend ID
          todo.id = createdTodo.id;
          return todo;
        })
      ));
    }

    // Update existing todos that might have changed while offline
    const existingTodosToUpdate = todos.filter(t => existingIds.has(t.id));
    if (existingTodosToUpdate.length > 0) {
      await Promise.all(existingTodosToUpdate.map(todo =>
        this.updateTodo(todo.id, {
          title: todo.title,
          completed: todo.completed,
          updatedAt: todo.updatedAt
        })
      ));
    }
  }
}

export class LocalStorageTodoService implements TodoService {
  private readonly STORAGE_KEY = 'todos';

  private getTodosFromStorage(): Todo[] {
    const todosJson = localStorage.getItem(this.STORAGE_KEY);
    return todosJson ? JSON.parse(todosJson) : [];
  }

  saveTodosToStorage(todos: Todo[]): void {
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

  async syncTodos(todos: Todo[]): Promise<void> {
    // For LocalStorageTodoService, sync is a no-op since we're already working with the local state
    return Promise.resolve();
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
  let hasShownBackendUnavailableToast = false;
  let isBackendAvailable = true;
  let checkInterval: NodeJS.Timeout | null = null;

  const checkBackendStatus = async () => {
    try {
      await fetch('http://localhost:3001/health');
      if (!isBackendAvailable) {
        isBackendAvailable = true;
        hasShownBackendUnavailableToast = false;
        
        // Get current todos from localStorage
        const currentTodos = await localStorageService.getTodos();
        
        // Get todos from backend
        const backendTodos = await apiService.getTodos();
        
        // If we have todos in localStorage but not in backend, sync them
        if (currentTodos.length > 0 && backendTodos.length === 0) {
          try {
            await apiService.syncTodos(currentTodos);
            toast.success(`Synced ${currentTodos.length} todos to the server!`, {
              duration: 4000,
              position: 'bottom-right',
              style: {
                background: '#333',
                color: '#fff',
                borderRadius: '8px',
                padding: '16px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              },
              icon: '✅',
            });
          } catch (error) {
            console.error('Failed to sync todos:', error);
            toast.error('Failed to sync todos to server. They will remain in local storage.', {
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
          }
        } else if (backendTodos.length > 0) {
          // If backend has todos, merge them with localStorage
          const mergedTodos = [...backendTodos];
          currentTodos.forEach(todo => {
            const existingIndex = mergedTodos.findIndex(t => t.id === todo.id);
            if (existingIndex === -1) {
              // New todo created while offline
              mergedTodos.push(todo);
            } else {
              // Update existing todo with any changes made while offline
              const existingTodo = mergedTodos[existingIndex];
              mergedTodos[existingIndex] = {
                ...existingTodo,
                title: todo.title,
                completed: todo.completed,
                updatedAt: new Date()
              };
            }
          });
          
          // Update both backend and localStorage with merged state
          await apiService.syncTodos(mergedTodos);
          await localStorageService.saveTodosToStorage(mergedTodos);
        }

        toast.success('Backend reconnected! Using server storage again.', {
          duration: 4000,
          position: 'bottom-right',
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          },
          icon: '✅',
        });
      }
    } catch (error) {
      if (isBackendAvailable) {
        // Backend just went down, get the latest state from backend
        try {
          const todos = await apiService.getTodos();
          await localStorageService.saveTodosToStorage(todos);
        } catch (backupError) {
          console.error('Failed to backup todos:', backupError);
        }
      }
      isBackendAvailable = false;
    }
  };

  // Start checking backend status every 5 seconds
  checkInterval = setInterval(checkBackendStatus, 5000);

  // Clean up interval when the service is no longer needed
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    });
  }

  // Test API connection
  return new Proxy(apiService, {
    get(target, prop) {
      return async function (...args: any[]) {
        try {
          // @ts-ignore
          const result = await target[prop](...args);
          
          // If backend is available, keep localStorage in sync
          if (isBackendAvailable) {
            if (prop === 'getTodos') {
              console.log('I think Im in the right place :thumbs:', result)
              // Update localStorage with the latest todos from backend
              await localStorageService.saveTodosToStorage(result);
            } else if (prop === 'createTodo') {
              // Add the new todo to localStorage
              const todos = await localStorageService.getTodos();
              todos.push(result);
              await localStorageService.saveTodosToStorage(todos);
            } else if (prop === 'updateTodo') {
              // Update the todo in localStorage
              const todos = await localStorageService.getTodos();
              const index = todos.findIndex(t => t.id === result.id);
              if (index !== -1) {
                todos[index] = result;
                await localStorageService.saveTodosToStorage(todos);
              }
            } else if (prop === 'deleteTodo') {
              // Remove the todo from localStorage
              const todos = await localStorageService.getTodos();
              const filteredTodos = todos.filter(t => t.id !== args[0]);
              await localStorageService.saveTodosToStorage(filteredTodos);
            }
          }
          
          return result;
        } catch (error) {
          console.warn('API failed, falling back to localStorage:', error);
          
          if (!hasShownBackendUnavailableToast) {
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
            hasShownBackendUnavailableToast = true;
          }
          
          // @ts-ignore
          return await localStorageService[prop](...args);
        }
      };
    },
  });
} 