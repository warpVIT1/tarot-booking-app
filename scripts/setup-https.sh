#!/bin/bash
# scripts/setup-https.sh - Настройка HTTPS для Telegram

echo "🔒 Настройка HTTPS для Telegram Mini App"
echo "========================================"

# Проверяем наличие OpenSSL
if ! command -v openssl &> /dev/null; then
    echo "❌ OpenSSL не установлен. Установите OpenSSL"
    exit 1
fi

# Генерируем самоподписанный сертификат
if [ ! -f "cert.pem" ] || [ ! -f "key.pem" ]; then
    echo "🔐 Генерация SSL сертификата..."
    openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem -subj "/C=RU/ST=Moscow/L=Moscow/O=TarotApp/OU=Dev/CN=localhost"
    echo "✅ SSL сертификат создан"
else
    echo "✅ SSL сертификат уже существует"
fi

echo "🚀 Запуск HTTPS сервера..."
npm run serve-https