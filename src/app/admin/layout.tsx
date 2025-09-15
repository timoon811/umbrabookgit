import React from 'react';
import { redirect } from "next/navigation";
import AdminHeader from "@/components/AdminHeader";
import AdminSidebar from "@/components/AdminSidebar";
import { checkAdminAuth } from "@/lib/admin-auth";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await checkAdminAuth();
  } catch {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      {/* Админ хедер */}
      <AdminHeader />
      
      {/* Основная область с сайдбаром и контентом */}
      <div className="mx-auto max-w-screen-2xl px-6 lg:px-6 md:px-4 sm:px-3 pt-6">
        <div className="grid layout-root admin-layout">
          {/* Админ сайдбар */}
          <AdminSidebar />
          
          {/* Основной контент */}
          <main className="p-6">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
