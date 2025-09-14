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
      router.replace(redirectTo);
    }
  }, [mounted, loading, user, router, redirectTo]);

  // Показываем loading пока загружаются данные
  if (!mounted || loading) {
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-500"></div>
      </div>
    );
  }

  // Если пользователь не авторизован, показываем страницу авторизации
  return <>{children}</>;
}
