"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import UmbraLogo from "@/components/UmbraLogo";

function LoginForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('from') || '/overview';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Очищаем ошибку при изменении поля
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email) {
      newErrors.email = "Email обязателен";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Некорректный email";
    }

    if (!formData.password) {
      newErrors.password = "Пароль обязателен";
    } else if (formData.password.length < 6) {
      newErrors.password = "Пароль должен содержать минимум 6 символов";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        // Показываем уведомление об успешном входе
        setShowSuccess(true);
        setErrors({});
        
        console.log("✅ Успешный вход, перенаправляем на", redirectTo);
        
        // Немедленное перенаправление
        router.push(redirectTo);
        
        // Альтернативный способ через window.location если router не работает
        setTimeout(() => {
          if (window.location.pathname === "/login") {
            console.log("⚠️ Router.push не сработал, используем window.location");
            window.location.href = redirectTo;
          }
        }, 1000);
      } else {
        setErrors({ general: result.message || "Ошибка входа" });
        setShowSuccess(false);
      }
    } catch {
      setErrors({ general: "Ошибка сети. Попробуйте еще раз." });
      setShowSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <UmbraLogo size="lg" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-[#171717] dark:text-[#ededed]">
          Вход в Umbra Platform
        </h2>
        <p className="mt-2 text-center text-sm text-[#171717]/60 dark:text-[#ededed]/60">
          Или{" "}
          <Link
            href="/register"
            className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
          >
            зарегистрируйтесь бесплатно
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-[#0a0a0a] py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-black/5 dark:border-white/10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {showSuccess && (
              <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-green-800 dark:text-green-200">
                      ✅ Успешный вход! Перенаправление...
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            {errors.general && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700 dark:text-red-400">
                      {errors.general}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#171717] dark:text-[#ededed]">
                Email адрес
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-[#171717]/40 dark:placeholder-[#ededed]/40 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-transparent dark:bg-transparent text-[#171717] dark:text-[#ededed] ${
                    errors.email ? "border-red-300 dark:border-red-600" : "border-black/10 dark:border-white/10"
                  }`}
                  placeholder="your@email.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#171717] dark:text-[#ededed]">
                Пароль
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-[#171717]/40 dark:placeholder-[#ededed]/40 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-transparent dark:bg-transparent text-[#171717] dark:text-[#ededed] ${
                    errors.password ? "border-red-300 dark:border-red-600" : "border-black/10 dark:border-white/10"
                  }`}
                  placeholder="Введите пароль"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-black/10 dark:border-white/10 rounded bg-transparent"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-[#171717] dark:text-[#ededed]">
                  Запомнить меня
                </label>
              </div>

              <div className="text-sm">
                <a href="#" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400">
                  Забыли пароль?
                </a>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-white/10 dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Вход..." : "Войти"}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-black/10 dark:border-white/10" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white dark:bg-[#0a0a0a] text-[#171717]/60 dark:text-[#ededed]/60">
                  Нет аккаунта?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link
                href="/register"
                className="w-full flex justify-center py-2 px-4 border border-black/10 dark:border-white/10 rounded-md shadow-sm bg-white dark:bg-[#0a0a0a] text-sm font-medium text-[#171717] dark:text-[#ededed] hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              >
                Создать аккаунт
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>}>
      <LoginForm />
    </Suspense>
  );
}
