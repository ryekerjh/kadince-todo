import { useState } from 'react';
import { TodoFilter } from '@/types/todo';
import { useTodos } from '@/hooks/useTodos';
import Spinner from './Spinner';

export default function TodoList() {
  const [filter, setFilter] = useState<TodoFilter>('all');
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const {
    todos,
    isLoading,
    error,
    createTodo,
    toggleTodo,
    deleteTodo,
  } = useTodos(filter);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodoTitle.trim()) {
      createTodo(newTodoTitle.trim());
      setNewTodoTitle('');
    }
  };

  if (isLoading) return <Spinner />;
  if (error) return <div className="text-red-600">Error: {error instanceof Error ? error.message : 'Unknown error'}</div>;

  return (
    <div className="max-w-md mx-auto p-4">
      {/* Filter buttons */}
      <div className="flex gap-2 mb-4">
        <button
          className={`px-3 py-1 rounded ${
            filter === 'all' 
              ? 'bg-kadince-lime dark:bg-[#00D1A7] text-kadince-charcoal dark:text-white' 
              : 'bg-white text-kadince-gray-600 dark:bg-kadince-gray-800 dark:text-kadince-gray-300'
          }`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`px-3 py-1 rounded ${
            filter === 'active' 
              ? 'bg-kadince-lime dark:bg-[#00D1A7] text-kadince-charcoal dark:text-white' 
              : 'bg-white text-kadince-gray-600 dark:bg-kadince-gray-800 dark:text-kadince-gray-300'
          }`}
          onClick={() => setFilter('active')}
        >
          Active
        </button>
        <button
          className={`px-3 py-1 rounded ${
            filter === 'completed' 
              ? 'bg-kadince-lime dark:bg-[#00D1A7] text-kadince-charcoal dark:text-white' 
              : 'bg-white text-kadince-gray-600 dark:bg-kadince-gray-800 dark:text-kadince-gray-300'
          }`}
          onClick={() => setFilter('completed')}
        >
          Completed
        </button>
      </div>

      {/* Add todo form */}
      <form onSubmit={handleSubmit} className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTodoTitle}
            onChange={(e) => setNewTodoTitle(e.target.value)}
            placeholder="Add a new todo..."
            className="flex-1 px-3 py-2 border rounded text-kadince-charcoal dark:text-kadince-gray-50 bg-white dark:bg-kadince-gray-800 placeholder-kadince-gray-400 dark:placeholder-kadince-gray-600"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-kadince-lime dark:bg-[#00D1A7] text-kadince-charcoal dark:text-white rounded hover:opacity-90 font-semibold"
          >
            Add
          </button>
        </div>
      </form>

      {/* Todo list */}
      <ul className="space-y-2">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className="flex items-center gap-2 p-2 border rounded bg-white dark:bg-kadince-gray-800 border-kadince-gray-200 dark:border-kadince-gray-700"
          >
            <input
              type="checkbox"
              checked={todo.completed}
              onChange={() => toggleTodo(todo.id, !todo.completed)}
              className="checkbox"
            />
            <span className={`flex-1 ${
              todo.completed 
                ? 'line-through text-kadince-gray-400 dark:text-kadince-gray-500' 
                : 'text-kadince-charcoal dark:text-kadince-gray-50'
            }`}>
              {todo.title}
            </span>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="danger px-2 py-1 text-white hover:opacity-90"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
} 