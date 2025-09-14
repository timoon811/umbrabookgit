"use client";

import React, { createContext, useContext } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import NotificationCenter from '@/components/admin/NotificationCenter';

type NotificationContextType = ReturnType<typeof useNotifications>;

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotificationContext = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export default function NotificationProvider({ children }: NotificationProviderProps) {
  const notifications = useNotifications();

  return (
    <NotificationContext.Provider value={notifications}>
      {children}
      <NotificationCenter
        notifications={notifications.notifications.filter(n => !n.viewed)}
        onClose={notifications.removeNotification}
        onClearAll={notifications.clearAllNotifications}
      />
    </NotificationContext.Provider>
  );
}
