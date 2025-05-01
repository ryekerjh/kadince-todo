import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Todo, TodoFilter } from '@/types/todo';
import { createTodoService } from '@/services/todoService';

const todoService = createTodoService();

export function useTodos(filter: TodoFilter = 'all') {
  const queryClient = useQueryClient();

  const { data: todos = [], isLoading, error } = useQuery<Todo[]>({
    queryKey: ['todos'],
    queryFn: () => todoService.getTodos(),
  });

  const filteredTodos = todos.filter(todo => {
    if (filter === 'active') return !todo.completed;
    if (filter === 'completed') return todo.completed;
    return true;
  });

  const createTodo = useMutation({
    mutationFn: (title: string) => todoService.createTodo(title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  const updateTodo = useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Partial<Todo>) =>
      todoService.updateTodo(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  const deleteTodo = useMutation({
    mutationFn: (id: string) => todoService.deleteTodo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  const toggleTodo = (id: string, completed: boolean) => {
    updateTodo.mutate({ id, completed });
  };

  return {
    todos: filteredTodos,
    isLoading,
    error,
    createTodo: createTodo.mutate,
    updateTodo: updateTodo.mutate,
    deleteTodo: deleteTodo.mutate,
    toggleTodo,
  };
} 