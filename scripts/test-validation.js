#!/usr/bin/env node

// Тестовый скрипт для проверки системы валидации
const { validateSchema, registerSchema } = require('../src/lib/zod-schemas.ts');

console.log('🧪 Тестирование системы валидации...\n');

const testCases = [
  {
    name: "Валидные данные",
    data: {
      name: "Иван Иванов",
      email: "ivan@example.com",
      telegram: "@ivan123",
      password: "password123",
      confirmPassword: "password123"
    },
    shouldPass: true
  },
  {
    name: "Простой пароль (раньше не проходил)",
    data: {
      name: "Тест Тестов",
      email: "test@example.com", 
      telegram: "@test",
      password: "simple",
      confirmPassword: "simple"
    },
    shouldPass: true
  },
  {
    name: "Telegram без @",
    data: {
      name: "Пользователь",
      email: "user@example.com",
      telegram: "username",
      password: "password",
      confirmPassword: "password"
    },
    shouldPass: true
  },
  {
    name: "Короткий пароль",
    data: {
      name: "Тест",
      email: "test@example.com",
      telegram: "@test",
      password: "123",
      confirmPassword: "123"
    },
    shouldPass: false
  },
  {
    name: "Несовпадающие пароли",
    data: {
      name: "Тест",
      email: "test@example.com",
      telegram: "@test", 
      password: "password1",
      confirmPassword: "password2"
    },
    shouldPass: false
  }
];

testCases.forEach((testCase, index) => {
  console.log(`${index + 1}. ${testCase.name}:`);
  
  try {
    const result = validateSchema(registerSchema, testCase.data);
    
    if (result.success && testCase.shouldPass) {
      console.log('   ✅ ПРОШЁЛ (ожидалось)');
    } else if (!result.success && !testCase.shouldPass) {
      console.log('   ✅ НЕ ПРОШЁЛ (ожидалось)');
      console.log('   Ошибки:', Object.values(result.errors).join(', '));
    } else if (result.success && !testCase.shouldPass) {
      console.log('   ❌ ПРОШЁЛ (НЕ ожидалось)');
    } else {
      console.log('   ❌ НЕ ПРОШЁЛ (НЕ ожидалось)');
      console.log('   Ошибки:', Object.values(result.errors).join(', '));
    }
    
  } catch (error) {
    console.log('   ❌ ОШИБКА:', error.message);
  }
  
  console.log('');
});

console.log('🏁 Тестирование завершено!');
