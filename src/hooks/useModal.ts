"use client";

import { useState, useCallback } from 'react';

interface AlertOptions {
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  confirmText?: string;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  actionType?: 'delete' | 'block' | 'unblock' | 'approve' | 'reject' | 'default';
}

export function useModal() {
  const [alertState, setAlertState] = useState<{
    isOpen: boolean;
    options: AlertOptions;
  }>({
    isOpen: false,
    options: { message: '' }
  });

  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    onConfirm?: () => void;
  }>({
    isOpen: false,
    options: { title: '', message: '' }
  });

  const showAlert = useCallback((options: AlertOptions) => {
    setAlertState({
      isOpen: true,
      options
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertState(prev => ({ ...prev, isOpen: false }));
  }, []);

  const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        options,
        onConfirm: () => resolve(true)
      });
    });
  }, []);

  const hideConfirm = useCallback(() => {
    setConfirmState(prev => ({ ...prev, isOpen: false }));
  }, []);

  // Convenience methods
  const alert = useCallback((message: string, type: AlertOptions['type'] = 'info', title?: string) => {
    showAlert({ message, type, title });
  }, [showAlert]);

  const success = useCallback((message: string, title: string = 'Успешно') => {
    showAlert({ message, type: 'success', title });
  }, [showAlert]);

  const error = useCallback((message: string, title: string = 'Ошибка') => {
    showAlert({ message, type: 'error', title });
  }, [showAlert]);

  const warning = useCallback((message: string, title: string = 'Внимание') => {
    showAlert({ message, type: 'warning', title });
  }, [showAlert]);

  const confirm = useCallback(async (
    title: string, 
    message: string, 
    options?: Partial<Omit<ConfirmOptions, 'title' | 'message'>>
  ): Promise<boolean> => {
    try {
      const result = await showConfirm({ title, message, ...options });
      return result;
    } catch {
      return false;
    }
  }, [showConfirm]);

  return {
    // Alert modal
    alertModal: {
      isOpen: alertState.isOpen,
      options: alertState.options,
      onClose: hideAlert
    },
    
    // Confirm modal
    confirmModal: {
      isOpen: confirmState.isOpen,
      options: confirmState.options,
      onConfirm: confirmState.onConfirm || (() => {}),
      onClose: hideConfirm
    },

    // Methods
    alert,
    success,
    error,
    warning,
    confirm,
    showAlert,
    showConfirm
  };
}
