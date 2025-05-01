'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TodoList from '@/components/TodoList';

const queryClient = new QueryClient();

export default function Home() {
  return (
    <QueryClientProvider client={queryClient}>
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <TodoList />
      </main>
    </QueryClientProvider>
  );
}
