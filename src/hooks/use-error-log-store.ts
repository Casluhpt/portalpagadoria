
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SystemError {
  id: string;
  timestamp: string;
  route: string;
  message: string;
  stack?: string;
  severity: 'error' | 'warning' | 'info';
}

interface ErrorLogState {
  errors: SystemError[];
  addError: (error: Omit<SystemError, 'id' | 'timestamp'>) => void;
  clearErrors: () => void;
}

export const useErrorLogStore = create<ErrorLogState>()(
  persist(
    (set) => ({
      errors: [],
      addError: (error) => set((state) => ({
        errors: [
          {
            ...error,
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
          },
          ...state.errors,
        ].slice(0, 100), // Keep last 100 errors
      })),
      clearErrors: () => set({ errors: [] }),
    }),
    {
      name: 'system-error-logs',
    }
  )
);
