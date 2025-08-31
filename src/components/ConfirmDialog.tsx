"use client";

import { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

export type ConfirmType = 'danger' | 'warning' | 'info' | 'success';

export interface ConfirmDialogData {
  id: string;
  type: ConfirmType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

interface ConfirmDialogProps {
  dialog: ConfirmDialogData;
  onRemove: (id: string) => void;
}

function ConfirmDialog({ dialog, onRemove }: ConfirmDialogProps) {
  const handleConfirm = () => {
    dialog.onConfirm();
    onRemove(dialog.id);
  };

  const handleCancel = () => {
    dialog.onCancel();
    onRemove(dialog.id);
  };

  const getDialogStyles = () => {
    switch (dialog.type) {
      case 'danger':
        return {
          iconColor: 'text-red-500',
          confirmBg: 'bg-red-600 hover:bg-red-700',
          iconBg: 'bg-red-100 dark:bg-red-900/30'
        };
      case 'warning':
        return {
          iconColor: 'text-yellow-500',
          confirmBg: 'bg-yellow-600 hover:bg-yellow-700',
          iconBg: 'bg-yellow-100 dark:bg-yellow-900/30'
        };
      case 'success':
        return {
          iconColor: 'text-green-500',
          confirmBg: 'bg-green-600 hover:bg-green-700',
          iconBg: 'bg-green-100 dark:bg-green-900/30'
        };
      case 'info':
      default:
        return {
          iconColor: 'text-blue-500',
          confirmBg: 'bg-blue-600 hover:bg-blue-700',
          iconBg: 'bg-blue-100 dark:bg-blue-900/30'
        };
    }
  };

  const getIcon = () => {
    const styles = getDialogStyles();
    const iconClass = `w-6 h-6 ${styles.iconColor}`;

    switch (dialog.type) {
      case 'danger':
        return <XCircle className={iconClass} />;
      case 'warning':
        return <AlertTriangle className={iconClass} />;
      case 'success':
        return <CheckCircle className={iconClass} />;
      case 'info':
      default:
        return <Info className={iconClass} />;
    }
  };

  const styles = getDialogStyles();

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleCancel}
      />
      
      {/* Dialog */}
      <div className="relative bg-white dark:bg-[#0a0a0a] rounded-xl shadow-2xl border border-[#171717]/10 dark:border-[#ededed]/10 max-w-md w-full transform transition-all duration-300 scale-100 opacity-100">
        <div className="p-6">
          {/* Icon and Title */}
          <div className="flex items-start gap-4 mb-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-full ${styles.iconBg} flex items-center justify-center`}>
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-[#171717] dark:text-[#ededed] mb-2">
                {dialog.title}
              </h3>
              <p className="text-sm text-[#171717]/70 dark:text-[#ededed]/70 leading-relaxed">
                {dialog.message}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-[#171717]/80 dark:text-[#ededed]/80 bg-[#171717]/5 dark:bg-[#ededed]/5 hover:bg-[#171717]/10 dark:hover:bg-[#ededed]/10 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:ring-offset-2"
            >
              {dialog.cancelText || 'Отмена'}
            </button>
            <button
              onClick={handleConfirm}
              className={`px-4 py-2 text-sm font-medium text-white ${styles.confirmBg} rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-opacity-50`}
            >
              {dialog.confirmText || 'Подтвердить'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Глобальное состояние для confirm диалогов
let confirmCallbacks: Array<(dialogs: ConfirmDialogData[]) => void> = [];
let dialogs: ConfirmDialogData[] = [];

export const useConfirmDialog = () => {
  const [dialogList, setDialogList] = useState<ConfirmDialogData[]>(dialogs);

  useEffect(() => {
    confirmCallbacks.push(setDialogList);
    return () => {
      confirmCallbacks = confirmCallbacks.filter(callback => callback !== setDialogList);
    };
  }, []);

  const addDialog = (dialog: Omit<ConfirmDialogData, 'id'>) => {
    return new Promise<boolean>((resolve) => {
      const newDialog: ConfirmDialogData = {
        ...dialog,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        onConfirm: () => {
          dialog.onConfirm();
          resolve(true);
        },
        onCancel: () => {
          dialog.onCancel();
          resolve(false);
        }
      };
      
      dialogs = [...dialogs, newDialog];
      confirmCallbacks.forEach(callback => callback(dialogs));
    });
  };

  const removeDialog = (id: string) => {
    dialogs = dialogs.filter(dialog => dialog.id !== id);
    confirmCallbacks.forEach(callback => callback(dialogs));
  };

  const confirm = (title: string, message: string, options?: {
    type?: ConfirmType;
    confirmText?: string;
    cancelText?: string;
  }) => {
    return addDialog({
      type: options?.type || 'info',
      title,
      message,
      confirmText: options?.confirmText,
      cancelText: options?.cancelText,
      onConfirm: () => {},
      onCancel: () => {}
    });
  };

  return {
    dialogs: dialogList,
    removeDialog,
    confirm,
    confirmDanger: (title: string, message: string, confirmText?: string) => 
      confirm(title, message, { type: 'danger', confirmText }),
    confirmWarning: (title: string, message: string, confirmText?: string) => 
      confirm(title, message, { type: 'warning', confirmText }),
    confirmSuccess: (title: string, message: string, confirmText?: string) => 
      confirm(title, message, { type: 'success', confirmText }),
    confirmInfo: (title: string, message: string, confirmText?: string) => 
      confirm(title, message, { type: 'info', confirmText })
  };
};

export default function ConfirmDialogContainer() {
  const { dialogs, removeDialog } = useConfirmDialog();

  if (dialogs.length === 0) return null;

  return (
    <>
      {dialogs.map((dialog) => (
        <ConfirmDialog
          key={dialog.id}
          dialog={dialog}
          onRemove={removeDialog}
        />
      ))}
    </>
  );
}
