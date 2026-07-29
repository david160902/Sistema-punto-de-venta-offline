@echo off
echo Iniciando Sistema POS...
cd backend
start /B node server.js
timeout /t 3 >nul
start http://localhost:3000
