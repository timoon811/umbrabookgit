"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UmbraLogo from "@/components/UmbraLogo";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    telegram: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    console.log(`🔧 Field changed: ${name} = "${value}"`);
    
    // Обработка поля Telegram - автоматическая подстановка @ и очистка от пробелов
    if (name === "telegram") {
      let telegramValue = value.trim();
      if (telegramValue && !telegramValue.startsWith("@")) {
        telegramValue = "@" + telegramValue;
      }
      // Удаляем множественные символы @
      telegramValue = telegramValue.replace(/^@+/, "@");
      setFormData(prev => ({ ...prev, [name]: telegramValue }));
      console.log(`📲 Telegram processed: "${telegramValue}"`);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Очищаем ошибку при изменении поля
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    // Делаем более мягкую валидацию на клиенте
    const errors: Record<string, string> = {};
    
    console.log('🔍 Validating form data:', formData);
    
    // Проверяем обязательные поля
    if (!formData.name.trim()) errors.name = "Имя обязательно";
    if (!formData.email.trim()) errors.email = "Email обязателен";
    if (!formData.telegram.trim()) errors.telegram = "Telegram обязателен";
    if (!formData.password) errors.password = "Пароль обязателен";
    if (!formData.confirmPassword) errors.confirmPassword = "Подтверждение пароля обязательно";
    
    // Проверяем минимальные требования
    if (formData.name.trim() && formData.name.trim().length < 2) {
      errors.name = "Имя должно содержать минимум 2 символа";
    }
    
    if (formData.email.trim() && !formData.email.includes('@')) {
      errors.email = "Введите корректный email";
    }
    
    if (formData.password && formData.password.length < 6) {
      errors.password = "Пароль должен содержать минимум 6 символов";
    }
    
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Пароли не совпадают";
      console.log('❌ Password mismatch:', {
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        passwordLength: formData.password?.length,
        confirmPasswordLength: formData.confirmPassword?.length
      });
    }
    
    console.log('🔍 Validation errors:', errors);
    
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return false;
    }
    
    setErrors({});
    return true;
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
          telegram: formData.telegram.trim(),
          password: formData.password,
          confirmPassword: formData.confirmPassword,
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
        // Проверяем, есть ли ошибки валидации полей
        if (result.isValidationError && result.errors) {
          setErrors(result.errors);
        } else {
          setErrors({ general: result.message || "Ошибка регистрации" });
        }
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
                Ваша заявка на регистрацию отправлена! Администратор рассмотрит её в ближайшее время.
              </p>
              <p className="mt-1 text-sm text-[#171717]/50 dark:text-[#ededed]/50">
                После одобрения вы сможете войти в систему. Перенаправление на страницу входа...
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
          <form className="space-y-6" onSubmit={handleSubmit} noValidate>
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
                  type="text"
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
              <label htmlFor="telegram" className="block text-sm font-medium text-[#171717] dark:text-[#ededed]">
                Telegram *
              </label>
              <div className="mt-1">
                <input
                  id="telegram"
                  name="telegram"
                  type="text"
                  autoComplete="username"
                  value={formData.telegram}
                  onChange={handleChange}
                  className={`appearance-none block w-full px-3 py-2 border rounded-md shadow-sm placeholder-[#171717]/40 dark:placeholder-[#ededed]/40 focus:outline-none focus:ring-gray-500 focus:border-gray-500 sm:text-sm bg-transparent dark:bg-transparent text-[#171717] dark:text-[#ededed] ${
                    errors.telegram ? "border-red-300 dark:border-red-600" : "border-black/10 dark:border-white/10"
                  }`}
                  placeholder="@username или username"
                />
                {errors.telegram && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.telegram}</p>
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
