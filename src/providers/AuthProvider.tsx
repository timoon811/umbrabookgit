"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface User {
  id: string;
  name?: string | null;
  email: string;
  role: string;
  status?: string;
  isBlocked?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  mounted: boolean;
  refreshUser: () => Promise<void>;
  forceRefresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [lastFetchTime, setLastFetchTime] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchUser = async () => {
    try {
      // Защита от частых запросов - минимум 1 секунда между запросами
      const now = Date.now();
      if (now - lastFetchTime < 1000) {
        console.log('AuthProvider: пропуск запроса - слишком частые вызовы');
        return;
      }
      setLastFetchTime(now);
      
      setLoading(true);
      const response = await fetch("/api/auth/me", {
        credentials: "include",
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('AuthProvider: received user data:', {
          ...data.user,
          nameType: typeof data.user?.name,
          nameValue: data.user?.name
        });
        
        // Убедимся, что name - это строка или null
        const sanitizedUser = {
          ...data.user,
          name: data.user?.name === undefined ? null : data.user.name
        };
        
        setUser(sanitizedUser);
      } else {
        console.log('AuthProvider: response not ok, setting user to null');
        setUser(null);
        
        // Если получили 403 (заблокирован/удален), очищаем сессию и перенаправляем
        // НО НЕ при 401 на странице входа, чтобы избежать бесконечного цикла
        if (response.status === 403) {
          console.log('AuthProvider: получен статус 403 - пользователь заблокирован, очищаем сессию');
          
          try {
            // Попытаемся выполнить logout для очистки cookie
            await fetch("/api/auth/logout", { 
              method: "POST",
              credentials: "include"
            });
          } catch (logoutError) {
            console.error("Ошибка при очистке сессии:", logoutError);
          }
          
          // Перенаправляем на страницу входа только если мы НЕ на ней
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        } else if (response.status === 401) {
          // При 401 просто логируем, но НЕ перенаправляем если уже на странице входа
          if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
            console.log('AuthProvider: получен статус 401 - неавторизован, перенаправляем на логин');
            window.location.href = '/login';
          } else {
            console.log('AuthProvider: получен статус 401 на странице входа - это нормально');
          }
        }
      }
    } catch (error) {
      console.error("Ошибка сети при получении данных пользователя:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      fetchUser();
    }
  }, [mounted]);

  // Добавляем слушатель для обновления пользователя при возвращении фокуса
  useEffect(() => {
    if (typeof window !== 'undefined') {
      let lastFocusTime = Date.now();
      
      const handleFocus = () => {
        // Обновляем данные пользователя только если прошло достаточно времени
        // Это предотвращает ненужные запросы при быстрой навигации между вкладками
        const now = Date.now();
        const timeSinceLastFocus = now - lastFocusTime;
        
        // Обновляем только если прошло больше 30 секунд с последнего фокуса
        if (timeSinceLastFocus > 30000) {
          console.log('AuthProvider: обновление пользователя по событию focus (прошло времени:', timeSinceLastFocus, 'мс)');
          fetchUser();
        } else {
          console.log('AuthProvider: пропуск обновления по focus - слишком рано (прошло времени:', timeSinceLastFocus, 'мс)');
        }
        
        lastFocusTime = now;
      };

      // Слушаем события кастомного обновления аутентификации
      const handleAuthUpdate = (event: CustomEvent) => {
        console.log('AuthProvider: получено событие обновления аутентификации', event.detail);
        // Принудительно обновляем состояние пользователя с показом лоадера
        const eventType = event.detail?.type;
        if (eventType === 'login') {
          setLoading(true);
          // Сбрасываем время последнего запроса для немедленного обновления при логине
          setLastFetchTime(0);
          // Небольшая задержка для завершения установки cookies
          setTimeout(() => {
            fetchUser();
          }, 100);
        } else if (eventType === 'logout') {
          // При выходе просто очищаем пользователя без дополнительных запросов
          setUser(null);
          setLoading(false);
        } else {
          fetchUser();
        }
      };

      window.addEventListener('focus', handleFocus);
      window.addEventListener('auth-update', handleAuthUpdate as EventListener);

      return () => {
        window.removeEventListener('focus', handleFocus);
        window.removeEventListener('auth-update', handleAuthUpdate);
      };
    }
  }, []);

  const refreshUser = async () => {
    await fetchUser();
  };

  const forceRefresh = async () => {
    console.log('AuthProvider: принудительное обновление данных пользователя');
    setLoading(true);
    setLastFetchTime(0); // Сбрасываем время для принудительного запроса
    await fetchUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, mounted, refreshUser, forceRefresh }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
