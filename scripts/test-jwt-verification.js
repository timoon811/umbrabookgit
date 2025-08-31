const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || "umbra_platform_super_secret_jwt_key_2024";

const testToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWV5NzBnMzIwMDAwamhpajRmbzVnbnp2IiwiZW1haWwiOiJhZG1pbkB1bWJyYS1wbGF0Zm9ybS5kZXYiLCJyb2xlIjoiQURNSU4iLCJpYXQiOjE3NTY2MzU1NzQsImV4cCI6MTc1NzI0MDM3NH0.3XJput3QKsCZPJtuDcLHKVOiqbvtTfLhM19sh1oLvgc";

console.log('🔍 Тестирование JWT верификации...');
console.log('JWT_SECRET доступен:', !!JWT_SECRET);
console.log('JWT_SECRET длина:', JWT_SECRET?.length);

try {
  console.log('🔍 Попытка верификации токена...');
  const decoded = jwt.verify(testToken, JWT_SECRET);
  console.log('✅ Токен успешно верифицирован:', decoded);

  const isAdmin = decoded.role === "ADMIN";
  console.log('🔍 Проверка роли:', { role: decoded.role, isAdmin });
} catch (error) {
  console.log('❌ Ошибка верификации:', error.message);

  try {
    console.log('🔍 Попытка декодирования без верификации...');
    const decoded = jwt.decode(testToken);
    console.log('✅ Токен декодирован без верификации:', decoded);
  } catch (decodeError) {
    console.log('❌ Невозможно декодировать токен:', decodeError.message);
  }
}
