import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export interface Toast {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onPress: () => void;
  };
  createdAt: number;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id' | 'createdAt'>) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useToastStore = create<ToastStore>()(subscribeWithSelector((set, get) => ({
  toasts: [],
  
  addToast: (toast) => {
    const id = generateId();
    const newToast: Toast = {
      ...toast,
      id,
      createdAt: Date.now(),
      duration: toast.duration ?? 4000, // Default 4 seconds
    };
    
    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));
    
    // Auto-remove toast after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, newToast.duration);
    }
    
    return id;
  },
  
  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }));
  },
  
  clearAllToasts: () => {
    set({ toasts: [] });
  },
})));

// Helper functions for easy toast creation
export const toast = {
  success: (title: string, description?: string, options?: Partial<Toast>) => {
    return useToastStore.getState().addToast({
      title,
      description,
      type: 'success',
      ...options,
    });
  },
  
  error: (title: string, description?: string, options?: Partial<Toast>) => {
    return useToastStore.getState().addToast({
      title,
      description,
      type: 'error',
      ...options,
    });
  },
  
  warning: (title: string, description?: string, options?: Partial<Toast>) => {
    return useToastStore.getState().addToast({
      title,
      description,
      type: 'warning',
      ...options,
    });
  },
  
  info: (title: string, description?: string, options?: Partial<Toast>) => {
    return useToastStore.getState().addToast({
      title,
      description,
      type: 'info',
      ...options,
    });
  },
  
  custom: (toastData: Omit<Toast, 'id' | 'createdAt'>) => {
    return useToastStore.getState().addToast(toastData);
  },
};