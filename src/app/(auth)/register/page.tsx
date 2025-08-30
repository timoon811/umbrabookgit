"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UmbraLogo from "@/components/UmbraLogo";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

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

    if (!formData.name.trim()) {
      newErrors.name = "Имя обязательно";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Имя должно содержать минимум 2 символа";
    }

    if (!formData.email) {
      newErrors.email = "Email обязателен";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Некорректный email";
    }

    if (!formData.password) {
      newErrors.password = "Пароль обязателен";
    } else if (formData.password.length < 6) {
      newErrors.password = "Пароль должен содержать минимум 6 символов";
    } else if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Пароль должен содержать буквы и цифры";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Подтверждение пароля обязательно";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Пароли не совпадают";
    }

    // Валидация telegram удалена (поле больше не используется)

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.toLowerCase(),
          password: formData.password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
        // Через 3 секунды перенаправляем на страницу входа
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setErrors({ general: result.message || "Ошибка регистрации" });
      }
    } catch {
      setErrors({ general: "Ошибка сети. Попробуйте еще раз." });
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white dark:bg-[#0a0a0a] py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-black/5 dark:border-white/10">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
                <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-[#171717] dark:text-[#ededed]">
                Регистрация успешна!
              </h3>
              <p className="mt-2 text-sm text-[#171717]/60 dark:text-[#ededed]/60">
                Добро пожаловать в Umbra Platform! Теперь вы можете войти в систему.
              </p>
              <p className="mt-1 text-sm text-[#171717]/50 dark:text-[#ededed]/50">
                Перенаправление на страницу входа...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <UmbraLogo size="lg" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-[#171717] dark:text-[#ededed]">
          Регистрация в Umbra Platform
        </h2>
        <p className="mt-2 text-center text-sm text-[#171717]/60 dark:text-[#ededed]/60">
          Или{" "}
          <Link
            href="/login"
            className="font-medium text-gray-700 hover:text-gray-900 dark:text-gray-300"
          >
            войдите в существующий аккаунт
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-[#0a0a0a] py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-black/5 dark:border-white/10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {errors.general && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
                <div className="text-sm text-red-700 dark:text-red-400">
                  {errors.general}
                </div>
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#171717] dark:text-[#ededed]">
                Полное имя *
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-[#171717]/40 dark:placeholder-[#ededed]/40 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm bg-transparent dark:bg-transparent text-[#171717] dark:text-[#ededed] ${
                    errors.name ? "border-red-300 dark:border-red-600" : "border-black/10 dark:border-white/10"
                  }`}
                  placeholder="Иван Иванов"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-[#171717] dark:text-[#ededed]">
                Email адрес *
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-[#171717]/40 dark:placeholder-[#ededed]/40 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm bg-transparent dark:bg-transparent text-[#171717] dark:text-[#ededed] ${
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
                Пароль *
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-[#171717]/40 dark:placeholder-[#ededed]/40 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm bg-transparent dark:bg-transparent text-[#171717] dark:text-[#ededed] ${
                    errors.password ? "border-red-300 dark:border-red-600" : "border-black/10 dark:border-white/10"
                  }`}
                  placeholder="Минимум 6 символов"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.password}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#171717] dark:text-[#ededed]">
                Подтверждение пароля *
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-[#171717]/40 dark:placeholder-[#ededed]/40 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm bg-transparent dark:bg-transparent text-[#171717] dark:text-[#ededed] ${
                    errors.confirmPassword ? "border-red-300 dark:border-red-600" : "border-black/10 dark:border-white/10"
                  }`}
                  placeholder="Повторите пароль"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Поле Telegram удалено */}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 dark:bg-white/10 dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? "Регистрация..." : "Зарегистрироваться"}
              </button>
            </div>

            <div className="text-xs text-gray-500 dark:text-white/60 text-center">
              Нажимая &quot;Зарегистрироваться&quot;, вы соглашаетесь с{" "}
              <a href="#" className="underline">условиями использования</a> и{" "}
              <a href="#" className="underline">политикой конфиденциальности</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
