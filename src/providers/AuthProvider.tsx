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

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchUser = async () => {
    try {
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
          // Небольшая задержка для завершения установки cookies
          setTimeout(() => {
            fetchUser();
          }, 100);
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
