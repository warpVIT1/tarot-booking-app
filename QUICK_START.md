# 🚀 Быстрый старт для Windows

## Шаг 1: Установка зависимостей

```powershell
# В PowerShell или командной строке выполните:
npm install

# Если команды npm run не работают, установите глобальные пакеты:
npm install -g live-server serve ngrok netlify-cli
```

## Шаг 2: Запуск разработки

```powershell
# Запуск сервера разработки
npm run dev
```

Откройте браузер по адресу: **http://localhost:3000**

## Шаг 3: Для Telegram Mini App

### Создание HTTPS сертификата:
```powershell
# Установите OpenSSL для Windows или используйте Git Bash
# В Git Bash выполните:
openssl req -newkey rsa:2048 -new -nodes -x509 -days 3650 -keyout key.pem -out cert.pem
```

### Запуск HTTPS сервера:
```powershell
npm run serve-https
```

### Создание туннеля:
```powershell
# В новом окне терминала:
npm run tunnel
```

## 🔧 Решение проблем

### Проблема: `'live-server' is not recognized`
**Решение:**
```powershell
npm install -g live-server
```

### Проблема: `'serve' is not recognized`
**Решение:**
```powershell
npm install -g serve
```

### Проблема: `'ngrok' is not recognized`
**Решение:**
```powershell
npm install -g ngrok
```

### Проблема: `Permission denied` в PowerShell
**Решение:**
```powershell
# Запустите PowerShell как администратор и выполните:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 📋 Автоматическая установка

Запустите скрипт для автоматической установки всех зависимостей:

```powershell
# Запустите файл:
scripts\install.bat
```

## 🎯 Основные команды

```powershell
npm run dev          # 🚀 Сервер разработки (http://localhost:3000)
npm run serve-https  # 🔒 HTTPS сервер для Telegram
npm run tunnel       # 🌐 Ngrok туннель для интернета
npm run build        # 🏗️ Сборка для продакшена
npm run deploy-netlify # 📤 Деплой на Netlify
```

## ✅ Проверка работы

После `npm run dev` вы должны увидеть:
```
🔮 Tarot Booking App запущен на http://localhost:3000
Для остановки нажмите Ctrl+C
```

## 🆘 Если ничего не работает

1. **Проверьте версию Node.js:**
   ```powershell
   node --version
   npm --version
   ```
   Должно быть Node.js 16+ и npm 8+

2. **Переустановите зависимости:**
   ```powershell
   rmdir /s node_modules
   del package-lock.json
   npm install
   ```

3. **Используйте yarn вместо npm:**
   ```powershell
   npm install -g yarn
   yarn install
   yarn dev
   ```