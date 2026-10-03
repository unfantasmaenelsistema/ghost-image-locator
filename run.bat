@echo off
title GeoSpecter OSINT - Lanzador Windows
echo ===================================================
echo     GeoSpecter OSINT - Sistema de Geolocalizacion
echo ===================================================
echo.

:: Comprobar si Node.js esta instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js no esta instalado en este equipo.
    echo Descargalo e instalalo desde: https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: Comprobar si existe archivo .env
if not exist .env (
    if exist .env.example (
        echo [AVISO] Creando archivo .env a partir de .env.example...
        copy .env.example .env
        echo Por favor, abre el archivo .env e introduce tu GEMINI_API_KEY.
        echo.
    )
)

:: Instalar dependencias si faltan
if not exist node_modules (
    echo [INFO] Instalando dependencias de Node.js...
    call npm install
)

echo [OK] Iniciando GeoSpecter OSINT en http://localhost:3000...
start "" "http://localhost:3000"
call npm start
pause
