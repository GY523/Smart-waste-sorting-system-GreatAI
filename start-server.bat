@echo off
echo Starting Smart Waste Kiosk Server...
echo.
echo Installing dependencies...
npm install
echo.
echo Starting server...
echo Server will be available at: http://localhost:3000
echo.
node server.js
pause