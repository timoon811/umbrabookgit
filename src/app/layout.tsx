import React from 'react';
import type { Metadata } from "next";
import ConditionalNavigation from "@/components/ConditionalNavigation";
import { ThemeProvider } from "@/providers/ThemeProvider";
import ToastContainer from "@/components/Toast";
import ConfirmDialogContainer from "@/components/ConfirmDialog";

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Umbra Platform",
  description: "Платформа для разработчиков и аналитиков - Документация",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}>
        <ThemeProvider>
          <ConditionalNavigation />
          {children}
          <ToastContainer />
          <ConfirmDialogContainer />
        </ThemeProvider>
      </body>
    </html>
  );
}
