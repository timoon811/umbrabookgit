"use client";

import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  color?: "blue" | "gray" | "white" | "red" | "green";
  text?: string;
  fullScreen?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12"
};

const colorClasses = {
  blue: "border-blue-500",
  gray: "border-gray-600",
  white: "border-white",
  red: "border-red-500",
  green: "border-green-500"
};

export default function LoadingSpinner({
  size = "md",
  color = "gray",
  text,
  fullScreen = false,
  className = ""
}: LoadingSpinnerProps) {
  const spinnerClasses = [
    sizeClasses[size],
    colorClasses[color],
    "border-2 border-t-transparent rounded-full animate-spin"
  ].join(" ");

  const content = (
    <div className="flex flex-col items-center gap-3">
      <div className={spinnerClasses}></div>
      {text && (
        <p className="text-gray-600 dark:text-gray-400 text-sm font-medium">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center ${className}`}>
        {content}
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center p-8 ${className}`}>
      {content}
    </div>
  );
}

// Компонент для загрузки внутри контейнера
export function InlineLoader({ 
  text = "Загрузка...", 
  size = "sm",
  color = "blue"
}: Partial<LoadingSpinnerProps>) {
  return (
    <div className="flex items-center gap-2">
      <div className={`${sizeClasses[size]} ${colorClasses[color]} border-2 border-t-transparent rounded-full animate-spin`}></div>
      <span className="text-sm text-gray-600 dark:text-gray-400">{text}</span>
    </div>
  );
}

// Компонент для скелетонной загрузки
export function SkeletonLoader({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}></div>
  );
}
