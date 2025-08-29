"use client";

import { ReactNode } from "react";
import { hasAdminAccess } from "@/lib/auth";

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
  if (!hasAdminAccess(user)) {
    return fallback;
  }

  return <>{children}</>;
}
