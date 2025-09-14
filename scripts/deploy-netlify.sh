#!/bin/bash
# scripts/deploy-netlify.sh - Деплой на Netlify

echo "🚀 Деплой на Netlify"
echo "==================="

# Проверяем установлен ли Netlify CLI
if ! command -v netlify &> /dev/null; then
    echo "📦 Установка Netlify CLI..."
    npm install -g netlify-cli
fi

# Проверяем авторизацию
echo "🔐 Проверка авторизации..."
if ! netlify status &> /dev/null; then
    echo "🔑 Необходима авторизация в Netlify"
    netlify login
fi

# Сборка проекта
echo "🏗️ Сборка проекта..."
npm run build

# Деплой
echo "🚀 Деплой..."
netlify deploy --prod --dir=.

echo "✅ Деплой завершен!"