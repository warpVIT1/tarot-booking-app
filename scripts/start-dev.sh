#!/bin/bash
# scripts/start-dev.sh - Быстрый старт разработки

echo "🔮 Tarot Booking App - Запуск разработки"
echo "========================================"

# Проверяем установлен ли Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js не установлен. Установите Node.js с https://nodejs.org/"
    exit 1
fi

# Проверяем установлен ли npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm не установлен. Установите npm"
    exit 1
fi

echo "✅ Node.js версия: $(node --version)"
echo "✅ npm версия: $(npm --version)"

# Устанавливаем зависимости если нужно
if [ ! -d "node_modules" ]; then
    echo "📦 Установка зависимостей..."
    npm install
fi

echo "🚀 Запуск сервера разработки..."
echo "📝 Откройте http://localhost:3000 в браузере"
echo "🛑 Для остановки нажмите Ctrl+C"

# Запускаем сервер разработки
npm run dev