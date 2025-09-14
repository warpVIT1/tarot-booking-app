@echo off
echo 📦 Установка зависимостей для Tarot Booking App
echo ==============================================

echo 🔧 Установка локальных зависимостей...
npm install

echo 🌍 Установка глобальных инструментов...
echo ⏳ Это может занять несколько минут...

npm install -g live-server
if errorlevel 1 (
    echo ❌ Ошибка установки live-server
) else (
    echo ✅ live-server установлен
)

npm install -g serve
if errorlevel 1 (
    echo ❌ Ошибка установки serve
) else (
    echo ✅ serve установлен
)

npm install -g ngrok
if errorlevel 1 (
    echo ❌ Ошибка установки ngrok
) else (
    echo ✅ ngrok установлен
)

npm install -g netlify-cli
if errorlevel 1 (
    echo ❌ Ошибка установки netlify-cli
) else (
    echo ✅ netlify-cli установлен
)

echo.
echo 🎉 Установка завершена!
echo.
echo 🚀 Теперь можете запустить:
echo   npm run dev - для разработки
echo   npm run serve-https - для HTTPS
echo   npm run tunnel - для создания туннеля
echo.

pause