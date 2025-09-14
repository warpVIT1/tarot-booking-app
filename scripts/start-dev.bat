@echo off
REM scripts/start-dev.bat - Скрипт для Windows

echo 🔮 Tarot Booking App - Запуск разработки
echo ========================================

REM Проверяем Node.js
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js не установлен. Установите с https://nodejs.org/
    pause
    exit /b 1
)

REM Проверяем npm
npm --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm не установлен
    pause
    exit /b 1
)

echo ✅ Node.js версия:
node --version
echo ✅ npm версия:
npm --version

REM Устанавливаем зависимости
if not exist "node_modules" (
    echo 📦 Установка зависимостей...
    npm install
)

echo 🚀 Запуск сервера разработки...
echo 📝 Откройте http://localhost:3000 в браузере
echo 🛑 Для остановки нажмите Ctrl+C

REM Запуск сервера
npm run dev

pause