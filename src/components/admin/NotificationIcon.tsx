"use client";

import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotificationContext } from '@/providers/NotificationProvider';
import NotificationDropdown from './NotificationDropdown';

export default function NotificationIcon() {
  const [isOpen, setIsOpen] = useState(false);
  const { 
    history, 
    getUnviewedCount, 
    markAsViewed, 
    removeNotification, 
    clearAllNotifications 
  } = useNotificationContext();

  const unviewedCount = getUnviewedCount();

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      {/* Иконка уведомлений */}
      <button
        onClick={handleToggle}
        className="relative p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="Уведомления"
      >
        <Bell className="w-5 h-5" />
        
        {/* Бэдж с количеством непросмотренных */}
        {unviewedCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unviewedCount > 99 ? '99+' : unviewedCount}
          </span>
        )}
      </button>

      {/* Выпадающая панель */}
      <NotificationDropdown
        notifications={history}
        onMarkAsViewed={markAsViewed}
        onClose={removeNotification}
        onClearAll={clearAllNotifications}
        isOpen={isOpen}
        onToggle={handleToggle}
      />
    </div>
  );
}

