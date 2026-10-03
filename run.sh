#!/usr/bin/env bash
# GeoSpecter OSINT - Lanzador Linux / macOS
set -e

echo "==================================================="
echo "    GeoSpecter OSINT - Sistema de Geolocalización"
echo "==================================================="
echo ""

# Comprobar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js no está instalado en este sistema."
    echo "Instálalo mediante tu gestor de paquetes (ej: sudo apt install nodejs npm o brew install node)"
    exit 1
fi

# Comprobar archivo .env
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "[AVISO] Creando archivo .env desde .env.example..."
        cp .env.example .env
        echo "Por favor, añade tu GEMINI_API_KEY en el archivo .env"
    fi
fi

# Instalar dependencias si faltan
if [ ! -d "node_modules" ]; then
    echo "[INFO] Instalando dependencias de Node.js..."
    npm install
fi

echo "[OK] Iniciando GeoSpecter OSINT en http://localhost:3000..."

# Intentar abrir el navegador por defecto
if command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:3000" > /dev/null 2>&1 &
elif command -v open &> /dev/null; then
    open "http://localhost:3000" > /dev/null 2>&1 &
fi

npm start
