"use client";

import React, { ReactNode } from "react";
import { hasAdminAccess } from "@/lib/permissions";
import { UserRole } from "@/types/roles";

interface AdminAccessGuardProps {
  user: {
    role: string;
    status: string;
    isBlocked: boolean;
  } | null;
  children: ReactNode;
  fallback?: ReactNode;
}

export default function AdminAccessGuard({ user, children, fallback = null }: AdminAccessGuardProps) {
  // Если пользователь не авторизован или заблокирован
  if (!user || user.isBlocked || user.status !== 'APPROVED') {
    return <>{fallback}</>;
  }

  // Проверяем права доступа к админ панели
  if (!hasAdminAccess(user.role as UserRole)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
