'use client';

import { ThemeProvider } from "@/contexts/ThemeContext";
import ThemeToggle from "@/components/ThemeToggle";
import { Toaster } from 'react-hot-toast';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <ThemeToggle />
      {children}
      <Toaster position="bottom-right" />
    </ThemeProvider>
  );
} 