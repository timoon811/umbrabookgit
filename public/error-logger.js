// Глобальный перехватчик ошибок для отладки charAt
if (typeof window !== 'undefined') {
  window.addEventListener('error', function(event) {
    if (event.error && event.error.message && event.error.message.includes('charAt')) {
      console.error('🚨 ОШИБКА charAt перехвачена:', {
        message: event.error.message,
        stack: event.error.stack,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: new Date().toISOString()
      });
      
      // Попробуем получить более детальную информацию
      console.trace('Stack trace на момент ошибки charAt:');
    }
  });
  
  // Также перехватываем unhandled rejections
  window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && event.reason.message && event.reason.message.includes('charAt')) {
      console.error('🚨 Unhandled rejection с charAt:', event.reason);
    }
  });
  
  console.log('✅ Глобальный перехватчик ошибок charAt установлен');
}
