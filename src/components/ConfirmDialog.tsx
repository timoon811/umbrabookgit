"use client";

import { useState, useEffect } from 'react';
import ConfirmModal from '@/components/modals/ConfirmModal';

export interface ConfirmDialogData {
  id: string;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  actionType?: 'delete' | 'delete-page' | 'block' | 'unblock' | 'approve' | 'reject' | 'default';
  onConfirm: () => void;
  onCancel?: () => void;
}

// Глобальное состояние для диалогов подтверждения
let confirmCallbacks: Array<(dialog: ConfirmDialogData | null) => void> = [];
let currentDialog: ConfirmDialogData | null = null;

export const useConfirmDialog = () => {
  const [dialog, setDialog] = useState<ConfirmDialogData | null>(currentDialog);

  useEffect(() => {
    confirmCallbacks.push(setDialog);
    return () => {
      confirmCallbacks = confirmCallbacks.filter(callback => callback !== setDialog);
    };
  }, []);

  const showConfirmDialog = (dialogData: Omit<ConfirmDialogData, 'id'>) => {
    const newDialog: ConfirmDialogData = {
      ...dialogData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
    };
    
    currentDialog = newDialog;
    confirmCallbacks.forEach(callback => callback(currentDialog));
  };

  const closeDialog = () => {
    currentDialog = null;
    confirmCallbacks.forEach(callback => callback(currentDialog));
  };

  return {
    dialog,
    showConfirmDialog,
    closeDialog,
    
    // Утилитарные методы для разных типов подтверждений
    showDeleteConfirm: (title: string, message: string, onConfirm: () => void) => 
      showConfirmDialog({
        title,
        message,
        type: 'danger',
        actionType: 'delete',
        onConfirm
      }),
      
    showBlockConfirm: (title: string, message: string, onConfirm: () => void) =>
      showConfirmDialog({
        title,
        message,
        type: 'warning',
        actionType: 'block',
        onConfirm
      }),
      
    showGenericConfirm: (title: string, message: string, onConfirm: () => void, type: 'danger' | 'warning' | 'info' = 'warning') =>
      showConfirmDialog({
        title,
        message,
        type,
        onConfirm
      })
  };
};

export default function ConfirmDialogContainer() {
  const { dialog, closeDialog } = useConfirmDialog();

  if (!dialog) return null;

  const handleConfirm = () => {
    dialog.onConfirm();
    closeDialog();
  };

  const handleCancel = () => {
    if (dialog.onCancel) {
      dialog.onCancel();
    }
    closeDialog();
  };

  return (
    <ConfirmModal
      isOpen={!!dialog}
      onClose={handleCancel}
      onConfirm={handleConfirm}
      title={dialog.title}
      message={dialog.message}
      confirmText={dialog.confirmText}
      cancelText={dialog.cancelText}
      type={dialog.type}
      actionType={dialog.actionType}
    />
  );
}
