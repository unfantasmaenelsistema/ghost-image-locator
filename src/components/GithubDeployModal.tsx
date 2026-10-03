import React, { useState } from 'react';
import {
  X,
  Github,
  Terminal,
  Check,
  Copy,
  Download,
  Laptop,
  Layers,
  Cpu,
  ShieldCheck,
  FileCode,
} from 'lucide-react';

interface GithubDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GithubDeployModal: React.FC<GithubDeployModalProps> = ({ isOpen, onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'windows' | 'linux' | 'docker' | 'architecture'>('windows');

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const windowsRunScript = `@echo off
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
    pause
    exit /b 1
)

:: Comprobar si existe archivo .env
if not exist .env (
    if exist .env.example (
        echo [AVISO] Creando archivo .env a partir de .env.example...
        copy .env.example .env
        echo Por favor, abre el archivo .env e introduce tu GEMINI_API_KEY.
    )
)

:: Instalar dependencias si no existen
if not exist node_modules (
    echo [INFO] Instalando dependencias necesarias...
    call npm install
)

echo [OK] Iniciando GeoSpecter OSINT en http://localhost:3000...
start "" "http://localhost:3000"
call npm start
pause
`;

  const linuxRunScript = `#!/usr/bin/env bash
# GeoSpecter OSINT - Lanzador Linux / macOS
set -e

echo "==================================================="
echo "    GeoSpecter OSINT - Sistema de Geolocalización"
echo "==================================================="

# Comprobar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js no está instalado en este sistema."
    echo "Instálalo con: sudo apt install nodejs npm  (o el gestor de tu distro)"
    exit 1
fi

# Comprobar archivo .env
if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        echo "[AVISO] Creando archivo .env desde .env.example..."
        cp .env.example .env
        echo "Configura tu GEMINI_API_KEY en el archivo .env"
    fi
fi

# Instalar dependencias si faltan
if [ ! -d "node_modules" ]; then
    echo "[INFO] Instalando dependencias de Node.js..."
    npm install
fi

echo "[OK] Iniciando GeoSpecter OSINT en http://localhost:3000..."

# Intentar abrir navegador predeterminado
if command -v xdg-open &> /dev/null; then
    xdg-open "http://localhost:3000" &
elif command -v open &> /dev/null; then
    open "http://localhost:3000" &
fi

npm start
`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 border border-slate-700 p-1 shadow-lg shadow-emerald-950/50">
              <img src="/icono.png" alt="Un Fantasma en el Sistema" className="h-9 w-9 object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">
                  Guía de Publicación en GitHub & Ejecución Multiplataforma
                </h3>
                <span className="rounded bg-emerald-950 px-2 py-0.5 text-[10px] font-mono text-emerald-400 border border-emerald-800">
                  Windows / Linux / Mac
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Creado por <a href="https://www.unfantasmaenelsistema.com/" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">Un Fantasma en el Sistema</a> (mismo flujo multiplataforma que en NetPhantom CTF)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('windows')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
              activeTab === 'windows'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Laptop className="h-4 w-4" />
            <span>Windows (run.bat)</span>
          </button>

          <button
            onClick={() => setActiveTab('linux')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
              activeTab === 'linux'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="h-4 w-4" />
            <span>Linux / macOS (run.sh)</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-xs font-semibold transition-colors ${
              activeTab === 'architecture'
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Arquitectura Técnica</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {activeTab === 'windows' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <h4 className="text-sm font-bold text-slate-200 mb-2">
                  1. Clonar desde GitHub y Ejecución Rápida
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  Los usuarios de Windows solo necesitan tener instalado Node.js (versión 18 o superior). Para una experiencia de 1 solo clic idéntica a NetPhantom CTF, incluye el script <code className="text-emerald-400 font-mono">run.bat</code> en la raíz del repositorio.
                </p>
                <div className="relative rounded-lg bg-slate-950 p-3 font-mono text-xs text-slate-300 border border-slate-800">
                  <pre>
                    git clone https://github.com/TU_USUARIO/geospecter-osint.git{'\n'}
                    cd geospecter-osint{'\n'}
                    run.bat
                  </pre>
                  <button
                    onClick={() =>
                      handleCopy(
                        'git clone https://github.com/TU_USUARIO/geospecter-osint.git\ncd geospecter-osint\nrun.bat',
                        'win-cmd',
                      )
                    }
                    className="absolute top-2.5 right-2.5 rounded bg-slate-800 p-1.5 text-slate-400 hover:text-white"
                  >
                    {copiedKey === 'win-cmd' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-slate-200">
                    Contenido del archivo <code className="text-emerald-400 font-mono">run.bat</code>
                  </h4>
                  <button
                    onClick={() => handleCopy(windowsRunScript, 'run-bat')}
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
                  >
                    {copiedKey === 'run-bat' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>Copiar script</span>
                  </button>
                </div>
                <div className="max-h-52 overflow-auto rounded-lg bg-slate-950 p-3 font-mono text-[11px] text-slate-300 border border-slate-800">
                  <pre>{windowsRunScript}</pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'linux' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <h4 className="text-sm font-bold text-slate-200 mb-2">
                  1. Clonar y Lanzar en Linux / Debian / Ubuntu / Fedora / Arch
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  En entornos Linux, el usuario solo necesita clonar, darle permisos de ejecución al script <code className="text-emerald-400 font-mono">run.sh</code> y ejecutarlo en la terminal.
                </p>
                <div className="relative rounded-lg bg-slate-950 p-3 font-mono text-xs text-slate-300 border border-slate-800">
                  <pre>
                    git clone https://github.com/TU_USUARIO/geospecter-osint.git{'\n'}
                    cd geospecter-osint{'\n'}
                    chmod +x run.sh{'\n'}
                    ./run.sh
                  </pre>
                  <button
                    onClick={() =>
                      handleCopy(
                        'git clone https://github.com/TU_USUARIO/geospecter-osint.git\ncd geospecter-osint\nchmod +x run.sh\n./run.sh',
                        'linux-cmd',
                      )
                    }
                    className="absolute top-2.5 right-2.5 rounded bg-slate-800 p-1.5 text-slate-400 hover:text-white"
                  >
                    {copiedKey === 'linux-cmd' ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-slate-200">
                    Contenido del archivo <code className="text-emerald-400 font-mono">run.sh</code>
                  </h4>
                  <button
                    onClick={() => handleCopy(linuxRunScript, 'run-sh')}
                    className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
                  >
                    {copiedKey === 'run-sh' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>Copiar script</span>
                  </button>
                </div>
                <div className="max-h-52 overflow-auto rounded-lg bg-slate-950 p-3 font-mono text-[11px] text-slate-300 border border-slate-800">
                  <pre>{linuxRunScript}</pre>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Cpu className="h-4 w-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">
                      Capa 1: Análisis Forense EXIF
                    </h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Extrae datos de los cabezales del archivo fotográfico (TIFF, EXIF, XMP). Si la foto no pasó por redes sociales que la limpien, lee directamente las coordenadas GPS de la cámara o móvil (latitud, longitud, altitud, fecha exacta y modelo de sensor).
                  </p>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <ShieldCheck className="h-4 w-4" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">
                      Capa 2: Inteligencia Visual Google Gemini
                    </h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Si no hay EXIF o para contrastarlo, Gemini 3.8 Flash examina la imagen con visión espacial OSINT: bolardos viales específicos de cada país, marcas viales (líneas amarillas vs blancas), estilo arquitectónico, tipo de postes eléctricos, especies de flora y sentido de circulación.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <h4 className="text-xs font-bold text-slate-200 mb-2 uppercase tracking-wider">
                  ¿Cómo empaquetarlo como ejecutable .exe o binario nativo de escritorio?
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Si más adelante quieres que los usuarios no necesiten abrir la terminal, puedes envolver este mismo proyecto con <strong>Electron</strong> o <strong>Tauri</strong>. Con un comando como <code className="text-emerald-400 font-mono">npm run make</code> obtendrás un archivo <code className="text-slate-200 font-mono">.exe</code> para Windows y un <code className="text-slate-200 font-mono">.AppImage / .deb</code> para Linux.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
