"use client";

import { useEffect, useState, ReactNode } from "react";
import { X } from "lucide-react";

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl";
  showCloseButton?: boolean;
  closeOnBackdrop?: boolean;
  className?: string;
}

export default function BaseModal({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = "md",
  showCloseButton = true,
  closeOnBackdrop = true,
  className = ""
}: BaseModalProps) {
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

  const getMaxWidthClass = () => {
    switch (maxWidth) {
      case "sm": return "max-w-sm";
      case "md": return "max-w-md";
      case "lg": return "max-w-lg";
      case "xl": return "max-w-xl";
      case "2xl": return "max-w-2xl";
      default: return "max-w-md";
    }
  };

  const handleBackdropClick = () => {
    if (closeOnBackdrop) {
      onClose();
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={handleBackdropClick}
      />
      
      {/* Modal */}
      <div 
        className={`relative w-full ${getMaxWidthClass()} max-h-[90vh] overflow-y-auto transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        } ${className}`}
      >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200/50 dark:border-gray-700/50">
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-6 border-b border-gray-200/50 dark:border-gray-700/50">
              {title && (
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {title}
                </h3>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>
          )}

          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

// Хук для управления состоянием модального окна
export function useBaseModal() {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);
  const toggleModal = () => setIsOpen(!isOpen);

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal
  };
}
