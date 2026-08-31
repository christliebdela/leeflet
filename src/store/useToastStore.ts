import { create } from 'zustand';
import React from 'react';

export interface ToastActionProps {
  children: React.ReactNode;
  onClick: () => void;
}

export interface ToastItem {
  id: string;
  title?: string;
  description?: string;
  type?: 'success' | 'error' | 'info';
  actionProps?: ToastActionProps;
}

interface ToastAddOptions {
  title?: string;
  description?: string;
  type?: 'success' | 'error' | 'info';
  actionProps?: ToastActionProps;
  duration?: number;
}

const MAX_TOASTS = 1;

interface ToastStore {
  toasts: ToastItem[];
  _add: (item: ToastItem, duration: number) => void;
  close: (id: string) => void;
  removeToast: (id: string) => void;
  addToast: (message: string, type?: 'success' | 'error' | 'info', duration?: number) => string;
}

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  _add: (item, duration) => {
    set((s) => {
      // New toast goes to front, keep max MAX_TOASTS
      const next = [item, ...s.toasts].slice(0, MAX_TOASTS);
      return { toasts: next };
    });

    if (duration > 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== item.id) }));
      }, duration);
    }
  },

  close: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  addToast: (message, type = 'info', duration = 4000): string => {
    const id = `t_${Date.now()}`;
    get()._add({ id, title: message, type }, duration);
    return id;
  },
}));

// ─── Public API ───────────────────────────────────────────────────────────────

export const toast = {
  add(options: ToastAddOptions): string {
    const id = `t_${Date.now()}`;
    const duration = options.duration ?? 4000;
    useToastStore.getState()._add(
      {
        id,
        title: options.title,
        description: options.description,
        type: options.type ?? 'success',
        actionProps: options.actionProps,
      },
      duration,
    );
    return id;
  },

  close(id: string) {
    useToastStore.getState().close(id);
  },

  success: (message: string, duration?: number) =>
    toast.add({ title: message, type: 'success', duration }),
  error: (message: string, duration?: number) =>
    toast.add({ title: message, type: 'error', duration }),
  info: (message: string, duration?: number) =>
    toast.add({ title: message, type: 'info', duration }),
};
