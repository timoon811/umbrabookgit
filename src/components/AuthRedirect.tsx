"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface AuthRedirectProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function AuthRedirect({ 
  children, 
  redirectTo = "/" 
}: AuthRedirectProps) {
  const { user, loading, mounted } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (mounted && !loading && user) {
      // Если пользователь авторизован, перенаправляем его
      console.log('AuthRedirect: перенаправляем авторизованного пользователя на', redirectTo);
      router.replace(redirectTo);
    }
  }, [mounted, loading, user, router, redirectTo]);

  // Показываем единый loading state до полной загрузки
  if (!mounted) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500"></div>
      </div>
    );
  }

  // После монтирования - показываем loading только если данные загружаются
  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500"></div>
      </div>
    );
  }

  // Если пользователь авторизован, показываем loading (идет редирект)
  if (user) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Перенаправление...</p>
        </div>
      </div>
    );
  }

  // Если пользователь не авторизован, показываем страницу авторизации
  return <>{children}</>;
}
