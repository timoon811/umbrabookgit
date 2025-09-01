// Простые утилиты валидации для API endpoints

export interface ValidationError {
  field: string;
  message: string;
}

export class ValidationException extends Error {
  public errors: ValidationError[];

  constructor(errors: ValidationError[]) {
    super('Validation failed');
    this.errors = errors;
    this.name = 'ValidationException';
  }
}

// Валидаторы базовых типов
export const validators = {
  required: (value: unknown, fieldName: string): ValidationError | null => {
    if (value === undefined || value === null || value === '') {
      return { field: fieldName, message: `${fieldName} обязателен` };
    }
    return null;
  },

  email: (value: string, fieldName: string): ValidationError | null => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return { field: fieldName, message: `${fieldName} должен быть валидным email` };
    }
    return null;
  },

  minLength: (value: string, min: number, fieldName: string): ValidationError | null => {
    if (value.length < min) {
      return { field: fieldName, message: `${fieldName} должен содержать минимум ${min} символов` };
    }
    return null;
  },

  maxLength: (value: string, max: number, fieldName: string): ValidationError | null => {
    if (value.length > max) {
      return { field: fieldName, message: `${fieldName} не должен превышать ${max} символов` };
    }
    return null;
  },

  numeric: (value: unknown, fieldName: string): ValidationError | null => {
    if (isNaN(Number(value))) {
      return { field: fieldName, message: `${fieldName} должен быть числом` };
    }
    return null;
  },

  positiveNumber: (value: number, fieldName: string): ValidationError | null => {
    if (value <= 0) {
      return { field: fieldName, message: `${fieldName} должен быть положительным числом` };
    }
    return null;
  }
};

// Функция для валидации объекта
export function validateObject(data: Record<string, unknown>, rules: Record<string, Array<(value: unknown) => ValidationError | null>>): void {
  const errors: ValidationError[] = [];

  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = data[field];
    
    for (const rule of fieldRules) {
      const error = rule(value);
      if (error) {
        errors.push(error);
        break; // Останавливаемся на первой ошибке для поля
      }
    }
  }

  if (errors.length > 0) {
    throw new ValidationException(errors);
  }
}

// Готовые схемы валидации для частых случаев
export const validationSchemas = {
  userRegistration: {
    email: [
      (value: unknown) => validators.required(value, 'email'),
      (value: unknown) => validators.email(value as string, 'email')
    ],
    password: [
      (value: unknown) => validators.required(value, 'password'),
      (value: unknown) => validators.minLength(value as string, 6, 'password')
    ],
    name: [
      (value: unknown) => validators.required(value, 'name'),
      (value: unknown) => validators.minLength(value as string, 2, 'name'),
      (value: unknown) => validators.maxLength(value as string, 100, 'name')
    ]
  },

  depositCreation: {
    amount: [
      (value: unknown) => validators.required(value, 'amount'),
      (value: unknown) => validators.numeric(value, 'amount'),
      (value: unknown) => validators.positiveNumber(Number(value), 'amount')
    ],
    currency: [
      (value: unknown) => validators.required(value, 'currency'),
      (value: unknown) => validators.minLength(value as string, 3, 'currency'),
      (value: unknown) => validators.maxLength(value as string, 10, 'currency')
    ]
  }
};

// Утилита для безопасного извлечения данных из запроса
export async function safeGetRequestBody(request: Request): Promise<Record<string, unknown>> {
  try {
    const body = await request.json();
    if (typeof body !== 'object' || body === null) {
      throw new ValidationException([{ field: 'body', message: 'Тело запроса должно быть объектом' }]);
    }
    return body as Record<string, unknown>;
  } catch (error) {
    if (error instanceof ValidationException) {
      throw error;
    }
    throw new ValidationException([{ field: 'body', message: 'Невалидный JSON в теле запроса' }]);
  }
}
