"use client";

import { useState, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastData {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastProps {
  toast: ToastData;
  onRemove: (id: string) => void;
}

function Toast({ toast, onRemove }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, toast.duration || 5000);

    return () => clearTimeout(timer);
  }, [toast.id, toast.duration, onRemove]);

  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-white dark:bg-[#0a0a0a] border-l-4 border-l-green-500 border border-[#171717]/10 dark:border-[#ededed]/10 text-[#171717] dark:text-[#ededed] shadow-lg';
      case 'error':
        return 'bg-white dark:bg-[#0a0a0a] border-l-4 border-l-red-500 border border-[#171717]/10 dark:border-[#ededed]/10 text-[#171717] dark:text-[#ededed] shadow-lg';
      case 'warning':
        return 'bg-white dark:bg-[#0a0a0a] border-l-4 border-l-yellow-500 border border-[#171717]/10 dark:border-[#ededed]/10 text-[#171717] dark:text-[#ededed] shadow-lg';
      case 'info':
      default:
        return 'bg-white dark:bg-[#0a0a0a] border-l-4 border-l-blue-500 border border-[#171717]/10 dark:border-[#ededed]/10 text-[#171717] dark:text-[#ededed] shadow-lg';
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      case 'warning':
        return (
          <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        );
      case 'info':
      default:
        return (
          <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className={`rounded-xl p-5 mb-3 shadow-xl backdrop-blur-sm transform transition-all duration-300 ease-out animate-in slide-in-from-right-5 ${getToastStyles()}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">{getIcon()}</div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm">{toast.title}</h4>
            {toast.message && (
              <p className="text-sm mt-1 text-[#171717]/70 dark:text-[#ededed]/70 leading-relaxed">{toast.message}</p>
            )}
          </div>
        </div>
        <button
          onClick={() => onRemove(toast.id)}
          className="flex-shrink-0 ml-4 text-[#171717]/40 dark:text-[#ededed]/40 hover:text-[#171717]/70 dark:hover:text-[#ededed]/70 transition-colors duration-200 p-1 rounded-md hover:bg-[#171717]/5 dark:hover:bg-[#ededed]/5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Глобальное состояние для toast-ов
let toastCallbacks: Array<(toasts: ToastData[]) => void> = [];
let toasts: ToastData[] = [];

export const useToast = () => {
  const [toastList, setToastList] = useState<ToastData[]>(toasts);

  useEffect(() => {
    toastCallbacks.push(setToastList);
    return () => {
      toastCallbacks = toastCallbacks.filter(callback => callback !== setToastList);
    };
  }, []);

  const addToast = (toast: Omit<ToastData, 'id'>) => {
    const newToast: ToastData = {
      ...toast,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    };
    
    toasts = [...toasts, newToast];
    toastCallbacks.forEach(callback => callback(toasts));
  };

  const removeToast = (id: string) => {
    toasts = toasts.filter(toast => toast.id !== id);
    toastCallbacks.forEach(callback => callback(toasts));
  };

  return {
    toasts: toastList,
    addToast,
    removeToast,
    showSuccess: (title: string, message?: string) => addToast({ type: 'success', title, message }),
    showError: (title: string, message?: string) => addToast({ type: 'error', title, message }),
    showWarning: (title: string, message?: string) => addToast({ type: 'warning', title, message }),
    showInfo: (title: string, message?: string) => addToast({ type: 'info', title, message })
  };
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 right-6 z-[9999] max-w-sm w-full">
      <div className="space-y-3">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onRemove={removeToast}
          />
        ))}
      </div>
    </div>
  );
}
