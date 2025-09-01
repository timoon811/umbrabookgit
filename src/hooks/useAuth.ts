"use client";

import { useState, useEffect } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  isBlocked: boolean;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && typeof window !== 'undefined') {
      fetchUser();
    }
  }, [mounted]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error("Ошибка сети при получении данных пользователя:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  return { user, loading, mounted };
}
