import { z } from "zod";

// Базовые схемы
export const emailSchema = z
  .string()
  .email("Некорректный формат email")
  .toLowerCase();

export const passwordSchema = z
  .string()
  .min(6, "Пароль должен содержать минимум 6 символов");

export const nameSchema = z
  .string()
  .min(2, "Имя должно содержать минимум 2 символа")
  .max(100, "Имя не должно превышать 100 символов")
  .trim();

export const telegramSchema = z
  .string()
  .min(1, "Telegram обязателен")
  .refine((val) => {
    // Убираем начальные пробелы и проверяем основные требования
    const trimmed = val.trim();
    if (trimmed.length < 2) return false;
    
    // Должен начинаться с @ или мы автоматически добавим
    const normalized = trimmed.startsWith('@') ? trimmed : '@' + trimmed;
    
    // Проверяем базовую структуру: @ + минимум 1 символ
    return /^@[a-zA-Z0-9_]{1,32}$/.test(normalized);
  }, "Telegram должен содержать от 1 до 32 символов (буквы, цифры, подчеркивания)");

// Схемы для аутентификации
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Пароль обязателен"),
});

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, "Подтверждение пароля обязательно"),
  telegram: telegramSchema,
}).refine((data) => {
  // Более мягкая проверка совпадения паролей
  return data.password === data.confirmPassword;
}, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});

// Схемы для пользователя
export const userUpdateSchema = z.object({
  name: nameSchema.optional(),
  email: emailSchema.optional(),
}).refine((data) => data.name || data.email, {
  message: "Необходимо указать хотя бы одно поле для обновления",
});

// Схемы для депозитов
export const depositCreateSchema = z.object({
  amount: z
    .number()
    .positive("Сумма должна быть положительным числом")
    .min(0.01, "Минимальная сумма депозита: 0.01"),
  currency: z
    .string()
    .min(3, "Валюта должна содержать минимум 3 символа")
    .max(10, "Валюта не должна превышать 10 символов")
    .toUpperCase(),
  playerEmail: emailSchema,
  playerName: z
    .string()
    .min(2, "Имя игрока должно содержать минимум 2 символа")
    .max(100, "Имя игрока не должно превышать 100 символов")
    .optional(),
  transactionId: z
    .string()
    .min(1, "ID транзакции обязателен")
    .max(255, "ID транзакции не должен превышать 255 символов")
    .optional(),
  notes: z
    .string()
    .max(1000, "Примечание не должно превышать 1000 символов")
    .optional(),
});

// Схемы для заявок на зарплату
export const salaryRequestCreateSchema = z.object({
  periodStart: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), "Некорректная дата начала периода"),
  periodEnd: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), "Некорректная дата окончания периода"),
  requestedAmount: z
    .number()
    .positive("Запрашиваемая сумма должна быть положительной")
    .optional(),
  paymentDetails: z
    .object({
      method: z.enum(["bank", "crypto", "other"], {
        errorMap: () => ({ message: "Выберите способ выплаты" })
      }),
      details: z.string().min(1, "Реквизиты для выплаты обязательны"),
    })
    .optional(),
  comment: z
    .string()
    .max(500, "Комментарий не должен превышать 500 символов")
    .optional(),
}).refine((data) => {
  const start = new Date(data.periodStart);
  const end = new Date(data.periodEnd);
  return start < end;
}, {
  message: "Дата начала должна быть раньше даты окончания",
  path: ["periodEnd"],
}).refine((data) => {
  const end = new Date(data.periodEnd);
  return end <= new Date();
}, {
  message: "Дата окончания не может быть в будущем",
  path: ["periodEnd"],
});

// Схемы для кошельков
export const walletCreateSchema = z.object({
  network: z.enum(["BTC", "ETH", "USDT", "LTC", "XRP", "ADA", "DOT"], {
    errorMap: () => ({ message: "Выберите поддерживаемую сеть" })
  }),
  address: z
    .string()
    .min(20, "Адрес кошелька слишком короткий")
    .max(200, "Адрес кошелька слишком длинный")
    .trim(),
  label: z
    .string()
    .max(100, "Метка не должна превышать 100 символов")
    .trim()
    .optional(),
});

export const walletUpdateSchema = z.object({
  address: z
    .string()
    .min(20, "Адрес кошелька слишком короткий")
    .max(200, "Адрес кошелька слишком длинный")
    .trim()
    .optional(),
  label: z
    .string()
    .max(100, "Метка не должна превышать 100 символов")
    .trim()
    .optional(),
}).refine((data) => data.address || data.label, {
  message: "Необходимо указать хотя бы одно поле для обновления",
});

// Схемы для файлов
export const fileUploadSchema = z.object({
  file: z.instanceof(File, { message: "Необходимо выбрать файл" }),
  type: z.enum(["image", "document"], {
    errorMap: () => ({ message: "Неподдерживаемый тип файла" })
  }).optional(),
});

// Схемы для курсов и документации
export const courseCreateSchema = z.object({
  title: z
    .string()
    .min(3, "Название должно содержать минимум 3 символа")
    .max(200, "Название не должно превышать 200 символов")
    .trim(),
  description: z
    .string()
    .min(10, "Описание должно содержать минимум 10 символов")
    .max(1000, "Описание не должно превышать 1000 символов")
    .trim()
    .optional(),
  slug: z
    .string()
    .min(3, "Слаг должен содержать минимум 3 символа")
    .max(100, "Слаг не должен превышать 100 символов")
    .regex(/^[a-z0-9-]+$/, "Слаг может содержать только строчные буквы, цифры и дефисы")
    .trim(),
  category: z
    .string()
    .min(2, "Категория должна содержать минимум 2 символа")
    .max(50, "Категория не должна превышать 50 символов")
    .trim()
    .optional(),
  isPublished: z.boolean().default(false),
});

export const courseUpdateSchema = courseCreateSchema.partial();

export const documentationCreateSchema = z.object({
  title: z
    .string()
    .min(3, "Заголовок должен содержать минимум 3 символа")
    .max(200, "Заголовок не должен превышать 200 символов")
    .trim(),
  content: z
    .string()
    .min(10, "Содержимое должно содержать минимум 10 символов"),
  slug: z
    .string()
    .min(3, "Слаг должен содержать минимум 3 символа")
    .max(100, "Слаг не должен превышать 100 символов")
    .regex(/^[a-z0-9-]+$/, "Слаг может содержать только строчные буквы, цифры и дефисы")
    .trim(),
  sectionId: z
    .string()
    .min(1, "Секция обязательна"),
  isPublished: z.boolean().default(false),
  order: z.number().int().min(0).default(0),
});

export const documentationUpdateSchema = documentationCreateSchema.partial();

// Utility функции для валидации
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: true;
  data: T;
} | {
  success: false;
  errors: { [key: string]: string };
} {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: { [key: string]: string } = {};
      error.issues.forEach((err) => {
        const path = err.path.join('.');
        errors[path] = err.message;
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: "Ошибка валидации данных" } };
  }
}

// Middleware для Next.js API routes
export function withValidation<T>(schema: z.ZodSchema<T>) {
  return (data: unknown) => {
    const result = validateSchema(schema, data);
    if (!result.success) {
      throw new Error(JSON.stringify(result.errors));
    }
    return result.data;
  };
}
