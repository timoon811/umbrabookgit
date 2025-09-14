#!/bin/bash

echo "🔄 Начинаем восстановление базы данных..."

# Устанавливаем переменные окружения
export PGPASSWORD=$(echo $DATABASE_URL | sed 's/.*:\([^@]*\)@.*/\1/')
export PGUSER=$(echo $DATABASE_URL | sed 's/.*\/\/\([^:]*\):.*/\1/')
export PGHOST=$(echo $DATABASE_URL | sed 's/.*@\([^:]*\):.*/\1/')
export PGPORT=$(echo $DATABASE_URL | sed 's/.*:\([0-9]*\)\/.*/\1/')
export PGDATABASE=$(echo $DATABASE_URL | sed 's/.*\/\([^?]*\).*/\1/')

echo "📊 Параметры подключения:"
echo "Host: $PGHOST"
echo "Port: $PGPORT"
echo "Database: $PGDATABASE"
echo "User: $PGUSER"

# Восстанавливаем дамп
echo "📥 Восстанавливаем дамп..."
psql $DATABASE_URL -f ~/umbra_full_dump.sql

echo "✅ Восстановление завершено!"
