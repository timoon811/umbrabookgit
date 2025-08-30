import React from 'react';
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AdminHeader from "@/components/AdminHeader";
import AdminSidebar from "@/components/AdminSidebar";

const JWT_SECRET = process.env.JWT_SECRET || "umbra_platform_super_secret_jwt_key_2024";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Проверяем права администратора
  const cookieStore = await cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    redirect("/login");
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      role: string;
    };

    if (decoded.role !== "ADMIN") {
      redirect("/");
    }

    // Дополнительная проверка пользователя в базе данных
    const user = await prisma.users.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    if (!user || user.role !== "ADMIN") {
      redirect("/");
    }
  } catch (error) {
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
