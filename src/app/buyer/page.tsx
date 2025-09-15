"use client";

import { useAuth } from "@/hooks/useAuth";
import { redirect } from "next/navigation";
import { hasPermission } from "@/types/roles";
import BuyerDashboard from "@/components/buyer/BuyerDashboard";
import LoadingSpinner from "@/components/LoadingSpinner";

export default function BuyerPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    redirect("/login");
    return null;
  }

  // Проверяем права доступа для buyer
  if (!hasPermission(user.role, 'buyer.dashboard.view')) {
    redirect("/");
    return null;
  }

  return <BuyerDashboard />;
}
