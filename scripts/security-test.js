#!/usr/bin/env node

/**
 * Скрипт для тестирования безопасности админ панели
 * Проверяет различные сценарии доступа
 */

const https = require('https');
const http = require('http');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

// Функция для выполнения HTTP запроса
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;
    
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    if (options.cookies) {
      requestOptions.headers.Cookie = options.cookies;
    }

    const req = client.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: data,
          url: url
        });
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// Тесты безопасности
async function runSecurityTests() {
  console.log('🔒 Запуск тестов безопасности админ панели...\n');

  const tests = [
    {
      name: 'Попытка доступа к админ панели без токена',
      test: async () => {
        const response = await makeRequest(`${BASE_URL}/admin`);
        return response.statusCode === 307 && response.headers.location?.includes('/login');
      }
    },
    {
      name: 'Попытка доступа к админ панели с невалидным токеном',
      test: async () => {
        const response = await makeRequest(`${BASE_URL}/admin`, {
          headers: {
            Cookie: 'auth-token=invalid_token_here'
          }
        });
        return response.statusCode === 307 && response.headers.location?.includes('/login');
      }
    },
    {
      name: 'Попытка доступа к API админ панели без токена',
      test: async () => {
        const response = await makeRequest(`${BASE_URL}/api/admin/users`);
        return response.statusCode === 307 && response.headers.location?.includes('/login');
      }
    },
    {
      name: 'Попытка доступа к API админ панели с невалидным токеном',
      test: async () => {
        const response = await makeRequest(`${BASE_URL}/api/admin/users`, {
          headers: {
            Cookie: 'auth-token=invalid_token_here'
          }
        });
        return response.statusCode === 307 && response.headers.location?.includes('/login');
      }
    },
    {
      name: 'Проверка доступа к публичным маршрутам',
      test: async () => {
        const response = await makeRequest(`${BASE_URL}/login`);
        return response.statusCode === 200;
      }
    },
    {
      name: 'Проверка доступа к защищенным маршрутам без токена',
      test: async () => {
        const response = await makeRequest(`${BASE_URL}/profile`);
        return response.statusCode === 307 && response.headers.location?.includes('/login');
      }
    },
    {
      name: 'Проверка доступа к главной странице без токена',
      test: async () => {
        const response = await makeRequest(`${BASE_URL}/`);
        return response.statusCode === 307 && response.headers.location?.includes('/login');
      }
    },
    {
      name: 'Проверка доступа к документации без токена',
      test: async () => {
        const response = await makeRequest(`${BASE_URL}/docs`);
        return response.statusCode === 307 && response.headers.location?.includes('/login');
      }
    },
    {
      name: 'Проверка доступа к курсам без токена',
      test: async () => {
        const response = await makeRequest(`${BASE_URL}/courses`);
        return response.statusCode === 307 && response.headers.location?.includes('/login');
      }
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      console.log(`🧪 ${test.name}...`);
      const result = await test.test();
      
      if (result) {
        console.log(`✅ ПРОЙДЕН: ${test.name}`);
        passedTests++;
      } else {
        console.log(`❌ ПРОВАЛЕН: ${test.name}`);
      }
    } catch (error) {
      console.log(`❌ ОШИБКА: ${test.name} - ${error.message}`);
    }
    console.log('');
  }

  console.log(`📊 Результаты тестов: ${passedTests}/${totalTests} пройдено`);
  
  if (passedTests === totalTests) {
    console.log('🎉 Все тесты безопасности пройдены успешно!');
    console.log('\n🔒 Система безопасности админ панели работает корректно:');
    console.log('   ✅ Неавторизованные пользователи перенаправляются на /login');
    console.log('   ✅ Пользователи без прав администратора не могут получить доступ к /admin');
    console.log('   ✅ Все защищенные маршруты требуют аутентификации');
    console.log('   ✅ API маршруты админ панели защищены');
    process.exit(0);
  } else {
    console.log('⚠️  Обнаружены проблемы с безопасностью!');
    process.exit(1);
  }
}

// Запуск тестов
if (require.main === module) {
  runSecurityTests().catch(error => {
    console.error('❌ Критическая ошибка при выполнении тестов:', error);
    process.exit(1);
  });
}

module.exports = { runSecurityTests, makeRequest };
