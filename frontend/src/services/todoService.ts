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

  constructor(baseUrl: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api') {
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
    this.saveTodosToStorage(todos);
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

  // Track backend availability
  let isBackendAvailable = false;
  let hasShownOfflineToast = false;
  let hasShownOnlineToast = false;

  // Smart merge function to handle offline changes
  const mergeTodos = (localTodos: Todo[], backendTodos: Todo[]): Todo[] => {
    const mergedTodos = new Map<string, Todo>();
    
    // First, add all backend todos to the map
    backendTodos.forEach(todo => {
      mergedTodos.set(todo.id, { ...todo });
    });
    
    // Then, merge local todos, preserving local changes
    localTodos.forEach(localTodo => {
      const backendTodo = mergedTodos.get(localTodo.id);
      
      if (!backendTodo) {
        // If it's a new local todo, add it
        mergedTodos.set(localTodo.id, { ...localTodo });
      } else {
        // If the local version is newer, use its values
        if (new Date(localTodo.updatedAt) > new Date(backendTodo.updatedAt)) {
          mergedTodos.set(localTodo.id, {
            ...backendTodo,
            title: localTodo.title,
            completed: localTodo.completed,
            updatedAt: localTodo.updatedAt
          });
        }
      }
    });
    
    return Array.from(mergedTodos.values());
  };

  const checkBackendStatus = async () => {
    try {
      await fetch('http://localhost:3001/health');
      
      if (!isBackendAvailable) {
        isBackendAvailable = true;
        hasShownOfflineToast = false;
        
        // When coming back online, treat localStorage as source of truth
        const localTodos = await localStorageService.getTodos();
        
        if (localTodos.length > 0) {
          // Sync local todos to backend
          await apiService.syncTodos(localTodos);
          
          toast.success('Successfully synced local changes to server!', {
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
        
        if (!hasShownOnlineToast) {
          toast.success('Backend reconnected! Using server storage.', {
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
          hasShownOnlineToast = true;
        }
      }
    } catch (error) {
      if (isBackendAvailable) {
        isBackendAvailable = false;
        hasShownOnlineToast = false;
        
        if (!hasShownOfflineToast) {
          toast.error('Backend unavailable. Using local storage.', {
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
          hasShownOfflineToast = true;
        }
      }
    }
  };

  // Start checking backend status every 5 seconds
  const checkInterval = setInterval(checkBackendStatus, 5000);

  // Clean up interval when the service is no longer needed
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      if (checkInterval) {
        clearInterval(checkInterval);
      }
    });
  }

  // Proxy to handle API/localStorage switching
  return new Proxy(apiService, {
    get(target, prop) {
      return async function (...args: any[]) {
        try {
          if (!isBackendAvailable) {
            throw new Error('Backend unavailable');
          }
          
          // Special handling for delete operations
          if (prop === 'deleteTodo') {
            const id = args[0];
            try {
              // Try to delete from backend first
              await target.deleteTodo(id);
              // If successful, also delete from localStorage
              await localStorageService.deleteTodo(id);
              return;
            } catch (error) {
              console.error('Failed to delete from backend:', error);
              throw error;
            }
          }
          
          // Handle other operations
          // @ts-ignore
          const result = await target[prop](...args);
          
          // Keep localStorage in sync with successful API operations
          if (prop === 'getTodos') {
            await localStorageService.saveTodosToStorage(result);
          } else if (prop === 'createTodo' || prop === 'updateTodo') {
            const todos = await target.getTodos();
            await localStorageService.saveTodosToStorage(todos);
          }
          
          return result;
        } catch (error) {
          // If backend is unavailable, use localStorage
          // @ts-ignore
          return await localStorageService[prop](...args);
        }
      };
    },
  });
} 