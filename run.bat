@echo off
chcp 65001 > nul
title GeoSpecter OSINT - Lanzador Windows
echo ===================================================
echo     GeoSpecter OSINT - Sistema de Geolocalizacion
echo ===================================================
echo.

:: Comprobar si Node.js esta instalado
where node >nul 2>nul
if errorlevel 1 (
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
        copy .env.example .env >nul
        echo Por favor, abre el archivo .env e introduce tu GEMINI_API_KEY.
        echo.
    )
)

:: Instalar dependencias si faltan
if not exist node_modules (
    echo [INFO] Instalando dependencias de Node.js...
    if exist package-lock.json (
        call npm ci
    ) else (
        call npm install
    )
    if errorlevel 1 (
        echo [ERROR] Fallo la instalacion de paquetes npm.
        pause
        exit /b 1
    )
)

:: Lee el puerto configurado en .env (3000 si no se encuentra la linea).
set "GEOSPECTER_PORT=3000"
for /f "usebackq tokens=2 delims==" %%P in (`findstr /b /i "PORT=" ".env" 2^>nul`) do set "GEOSPECTER_PORT=%%P"

echo [OK] Iniciando GeoSpecter OSINT en http://localhost:%GEOSPECTER_PORT% ...
echo [INFO] El navegador se abrira automaticamente en cuanto el servidor responda.

:: Proceso en segundo plano, oculto, que solo abre el navegador cuando el
:: servidor realmente contesta a peticiones HTTP (hasta 60s de margen).
:: Nunca se abre el navegador "a ciegas" antes de que el servidor responda.
start "GeoSpecter - esperando servidor" /min powershell -NoProfile -WindowStyle Hidden -Command ^
    "$port = $env:GEOSPECTER_PORT; $ok = $false; for ($i = 0; $i -lt 60; $i++) { try { Invoke-WebRequest -Uri ('http://127.0.0.1:' + $port + '/') -UseBasicParsing -TimeoutSec 1 | Out-Null; $ok = $true; break } catch { Start-Sleep -Seconds 1 } }; if ($ok) { Start-Process ('http://localhost:' + $port) }"

call npm start
pause
