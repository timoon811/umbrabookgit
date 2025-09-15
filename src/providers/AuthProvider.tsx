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

  // Добавляем слушатель для обновления пользователя при изменении storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'auth-token') {
          fetchUser();
        }
      };

      const handleFocus = () => {
        // Обновляем данные пользователя при возвращении фокуса на страницу
        fetchUser();
      };

      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('focus', handleFocus);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('focus', handleFocus);
      };
    }
  }, []);

  const refreshUser = async () => {
    await fetchUser();
  };

  return (
    <AuthContext.Provider value={{ user, loading, mounted, refreshUser }}>
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
