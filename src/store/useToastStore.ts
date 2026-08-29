import { create } from 'zustand';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

interface ToastState {
  toasts: Toast[];
  addToast: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message, type = 'info', duration = 3000) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast: Toast = { id, message, type, duration };

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));

    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, duration);
    }
  },
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));

export const toast = {
  success: (message: string, duration?: number) =>
    useToastStore.getState().addToast(message, 'success', duration),
  error: (message: string, duration?: number) =>
    useToastStore.getState().addToast(message, 'error', duration),
  info: (message: string, duration?: number) =>
    useToastStore.getState().addToast(message, 'info', duration),
};
