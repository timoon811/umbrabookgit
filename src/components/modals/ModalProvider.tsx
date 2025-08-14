"use client";

import { useModal } from '@/hooks/useModal';
import AlertModal from './AlertModal';
import ConfirmModal from './ConfirmModal';

interface ModalProviderProps {
  children: React.ReactNode;
}

export default function ModalProvider({ children }: ModalProviderProps) {
  const { alertModal, confirmModal } = useModal();

  return (
    <>
      {children}
      
      <AlertModal
        isOpen={alertModal.isOpen}
        onClose={alertModal.onClose}
        title={alertModal.options.title}
        message={alertModal.options.message}
        type={alertModal.options.type}
        confirmText={alertModal.options.confirmText}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={confirmModal.onClose}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.options.title}
        message={confirmModal.options.message}
        confirmText={confirmModal.options.confirmText}
        cancelText={confirmModal.options.cancelText}
        type={confirmModal.options.type}
        actionType={confirmModal.options.actionType}
      />
    </>
  );
}
