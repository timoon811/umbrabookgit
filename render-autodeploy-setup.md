# 🚀 Настройка автодеплоя на Render

## Текущий статус
- ✅ Сервис уже создан: `umbra-platform`
- ❌ Автодеплой отключен
- 🔧 URL: https://umbra-platform.onrender.com
- 📋 Dashboard: https://dashboard.render.com/web/srv-d2p134h5pdvs73bs7vt0/settings

## 🛠️ Включение автодеплоя

### Метод 1: Через веб-интерфейс (быстро)

1. Перейдите по ссылке: https://dashboard.render.com/web/srv-d2p134h5pdvs73bs7vt0/settings
2. Найдите секцию **"Auto-Deploy"**
3. Измените с **"No"** на **"Yes"**
4. Нажмите **"Save Changes"**

### Метод 2: Через настройки репозитория

1. В настройках сервиса найдите раздел **"Git"**
2. Убедитесь что:
   - Repository: `https://github.com/timoon811/umbrabookgit`
   - Branch: `main`
   - Auto-Deploy: `Yes`

## 🔧 Дополнительные настройки

### Build Command (уже настроено)
```bash
npm install && npm run build
```

### Start Command (уже настроено)
```bash
npm start
```

### Environment Variables
Убедитесь что настроены:
- `DATABASE_URL` - PostgreSQL connection string
- `DIRECT_URL` - PostgreSQL direct connection
- `JWT_SECRET` - JWT секретный ключ
- `NODE_ENV=production`

## ⚡ Как работает автодеплой

После включения автодеплоя:

1. **При каждом push в main** → Render автоматически:
   - Скачивает новый код
   - Выполняет `npm install && npm run build`
   - Перезапускает сервис с `npm start`

2. **Миграции базы данных** выполняются автоматически через:
   ```bash
   npm start  # запускает create-admin.js и next start
   ```

3. **Время деплоя**: обычно 3-5 минут

## 📋 Checklist после включения

- [ ] Включить Auto-Deploy в настройках
- [ ] Сделать тестовый push в main
- [ ] Проверить логи деплоя в Render
- [ ] Убедиться что сайт обновился
- [ ] Проверить работоспособность

## 🚨 Важные моменты

1. **Backup**: Render автоматически сохраняет предыдущие версии
2. **Rollback**: Можно откатиться через интерфейс Render
3. **Downtime**: ~30 секунд во время деплоя
4. **Миграции**: Выполняются автоматически в start скрипте

## ✅ Результат

После настройки каждый ваш `git push origin main` будет автоматически деплоить обновления на https://umbra-platform.onrender.com

**Ваша миграция из дампа уже готова к автоматическому деплою! 🎉**
