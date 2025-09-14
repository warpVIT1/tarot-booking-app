#!/bin/bash
# scripts/create-tunnel.sh - Создание туннеля ngrok

echo "🌐 Создание туннеля для Telegram"
echo "==============================="

# Проверяем установлен ли ngrok
if ! command -v ngrok &> /dev/null; then
    echo "📦 Установка ngrok..."
    npm install -g ngrok
fi

echo "🔗 Создание туннеля на порт 3000..."
echo "📋 Скопируйте HTTPS URL и добавьте в настройки Telegram бота"
echo "🛑 Для остановки нажмите Ctrl+C"

# Запускаем ngrok
ngrok http 3000