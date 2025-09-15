"use client";

import React, { ReactNode, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
  allowedRoles?: string[];
  blockManagers?: boolean;
}

export default function AuthGuard({ 
  children, 
  fallback = null, 
  redirectTo = "/login",
  allowedRoles = [],
  blockManagers = false
}: AuthGuardProps) {
  const { user, loading, mounted } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (mounted && !loading) {
      // Если пользователь не авторизован
      if (!user) {
        router.push(redirectTo);
        return;
      }

      // Если есть ограничения по ролям
      if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        router.push("/");
        return;
      }

      // Если нужно блокировать менеджеров
      if (blockManagers && user.role === "PROCESSOR") {
        router.push("/management");
        return;
      }
    }
  }, [mounted, loading, user, router, redirectTo, allowedRoles, blockManagers]);

  // Показываем loading state до монтирования
  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500"></div>
        </div>
      </div>
    );
  }

  // Показываем loading state пока загружаются данные
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500"></div>
        </div>
      </div>
    );
  }

  // Если пользователь не авторизован
  if (!user) {
    return fallback;
  }

  // Если есть ограничения по ролям и пользователь не подходит
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return fallback;
  }

  // Если нужно блокировать менеджеров
  if (blockManagers && user.role === "PROCESSOR") {
    return fallback;
  }

  // Показываем контент если все проверки пройдены
  return <>{children}</>;
}
