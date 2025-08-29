"use client";

import { useState, useEffect } from 'react';
import { X, AlertTriangle, Trash2, User, UserX, UserCheck, FileX } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  actionType?: 'delete' | 'delete-page' | 'block' | 'unblock' | 'approve' | 'reject' | 'default';
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText = 'Отмена',
  type = 'warning',
  actionType = 'default'
}: ConfirmModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const getIcon = () => {
    switch (actionType) {
      case 'delete':
        return <Trash2 className="w-7 h-7 text-red-600 dark:text-red-400" />;
      case 'delete-page':
        return <FileX className="w-7 h-7 text-red-600 dark:text-red-400" />;
      case 'block':
        return <UserX className="w-7 h-7 text-red-600 dark:text-red-400" />;
      case 'unblock':
        return <UserCheck className="w-7 h-7 text-green-600 dark:text-green-400" />;
      case 'approve':
        return <UserCheck className="w-7 h-7 text-green-600 dark:text-green-400" />;
      case 'reject':
        return <UserX className="w-7 h-7 text-red-600 dark:text-red-400" />;
      default:
        return <AlertTriangle className="w-7 h-7 text-yellow-600 dark:text-yellow-400" />;
    }
  };

  const getConfirmButtonStyle = () => {
    switch (type) {
      case 'danger':
        return 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 focus:ring-red-500 shadow-red-500/25';
      case 'warning':
        return 'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 focus:ring-yellow-500 shadow-yellow-500/25';
      default:
        return 'bg-gradient-to-r from-gray-900 to-gray-800 hover:from-gray-800 hover:to-gray-700 focus:ring-gray-500 dark:from-white/20 dark:to-white/10 dark:hover:from-white/30 dark:hover:to-white/20 shadow-gray-500/25';
    }
  };

  const getHeaderGradient = () => {
    switch (type) {
      case 'danger':
        return 'bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/30 dark:to-pink-950/30';
      case 'warning':
        return 'bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950/30 dark:to-orange-950/30';
      default:
        return 'bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800';
    }
  };

  const getIconBackground = () => {
    switch (type) {
      case 'danger':
        return 'bg-red-100 dark:bg-red-900/30';
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-900/30';
      default:
        return 'bg-gray-100 dark:bg-gray-800';
    }
  };

  const getDefaultConfirmText = () => {
    if (confirmText) return confirmText;
    
    switch (actionType) {
      case 'delete':
        return 'Удалить';
      case 'delete-page':
        return 'Удалить страницу';
      case 'block':
        return 'Заблокировать';
      case 'unblock':
        return 'Разблокировать';
      case 'approve':
        return 'Одобрить';
      case 'reject':
        return 'Отклонить';
      default:
        return 'Подтвердить';
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-all duration-300 ease-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Backdrop with enhanced blur */}
      <div 
        className={`absolute inset-0 transition-all duration-300 ${
          isVisible 
            ? 'bg-black/60 backdrop-blur-md' 
            : 'bg-black/0 backdrop-blur-none'
        }`}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className={`relative w-full max-w-md transform transition-all duration-300 ease-out ${
          isVisible 
            ? 'scale-100 opacity-100 translate-y-0' 
            : 'scale-95 opacity-0 translate-y-4'
        }`}
      >
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
          {/* Enhanced gradient header */}
          <div className={`relative px-6 pt-6 pb-4 ${getHeaderGradient()}`}>
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Icon and title */}
            <div className="flex items-start gap-4">
              <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${getIconBackground()}`}>
                {getIcon()}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 leading-tight">
                  {title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {message}
                </p>
              </div>
            </div>
          </div>

          {/* Actions with enhanced styling */}
          <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-800/50">
            <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 hover:shadow-sm"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
                className={`px-5 py-2.5 text-sm font-bold text-white rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] ${getConfirmButtonStyle()}`}
            >
              {getDefaultConfirmText()}
            </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
