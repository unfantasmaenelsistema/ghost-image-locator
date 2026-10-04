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

node_major="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
if [ "${node_major}" -lt 20 ]; then
    echo "[AVISO] Se detectó Node.js v${node_major}.x. Esta app requiere Node.js v20.19+ o v22.12+."
    echo ""
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
    if [ -f package-lock.json ]; then
        npm ci
    else
        npm install
    fi
fi

# Puerto configurado en .env (3000 por defecto si no hay línea PORT=)
port_value="$(grep -E '^PORT=' .env 2>/dev/null | tail -n1 | cut -d'=' -f2-)"
port_value="${port_value:-3000}"

echo "[OK] Iniciando GeoSpecter OSINT en http://localhost:${port_value}..."
echo "[INFO] El navegador se abrirá automáticamente en cuanto el servidor responda."

# Abre el navegador solo cuando el servidor realmente contesta peticiones
# HTTP (hasta 60s de margen), nunca "a ciegas" con un sleep fijo.
open_when_ready() {
    local url="http://127.0.0.1:${port_value}/"
    local i
    for i in $(seq 1 60); do
        if curl -fsS -o /dev/null "${url}" 2>/dev/null; then
            if command -v xdg-open &> /dev/null; then
                xdg-open "http://localhost:${port_value}" > /dev/null 2>&1 || true
            elif command -v open &> /dev/null; then
                open "http://localhost:${port_value}" > /dev/null 2>&1 || true
            fi
            return 0
        fi
        sleep 1
    done
}

if command -v curl &> /dev/null; then
    open_when_ready &
    bg_pid=$!
    trap '[ -n "${bg_pid:-}" ] && kill "${bg_pid}" 2>/dev/null || true' EXIT
else
    echo "[AVISO] 'curl' no está disponible: abre http://localhost:${port_value} manualmente."
fi

npm start
