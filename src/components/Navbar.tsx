import React from 'react';
import { Github, Globe, Compass, ExternalLink, History } from 'lucide-react';
import { DEFAULT_SITE_CONFIG } from '../config/siteConfig';

interface NavbarProps {
  onOpenGithubModal: () => void;
  onOpenSamplesModal: () => void;
  onOpenHistoryModal: () => void;
  historyCount: number;
  hasResult: boolean;
  onReset: () => void;
  websiteUrl?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenGithubModal,
  onOpenSamplesModal,
  onOpenHistoryModal,
  historyCount,
  hasResult,
  onReset,
  websiteUrl = DEFAULT_SITE_CONFIG.websiteUrl,
}) => {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6">
        {/* Brand / Logo with Un Fantasma en el Sistema Identity */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={onReset}>
          <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 shadow-lg shadow-emerald-950/50 p-1 border border-slate-700/80 hover:border-emerald-500/50 transition-colors">
            <img
              src="/icono.png"
              alt="Un Fantasma en el Sistema"
              className="h-9 w-9 object-contain drop-shadow-md hover:scale-105 transition-transform"
            />
            <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-slate-950 bg-emerald-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-black tracking-wide text-slate-100">
                Un Fantasma en el Sistema
              </span>
              <span className="rounded bg-emerald-950/80 px-1.5 py-0.5 text-[10px] font-mono font-bold tracking-widest text-emerald-400 border border-emerald-800/60 uppercase">
                OSINT
              </span>
            </div>
            <p className="hidden text-xs text-slate-400 sm:block">
              Geolocalización visual y análisis forense EXIF con Google Gemini
            </p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* History button */}
          <button
            onClick={onOpenHistoryModal}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-all hover:border-emerald-500/60 hover:bg-slate-800 hover:text-white"
            title="Ver historial de los últimos 5 análisis guardados"
          >
            <History className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Historial</span>
            <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[10px] font-mono text-emerald-300 border border-slate-700">
              {historyCount}/5
            </span>
          </button>

          {/* Link to user's website */}
          <a
            href={websiteUrl}
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition-all hover:bg-emerald-900/50 hover:text-emerald-200 shadow-sm"
            title="Visitar unfantasmaenelsistema.com"
          >
            <Globe className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden md:inline">unfantasmaenelsistema.com</span>
            <span className="inline md:hidden">Mi Web</span>
            <ExternalLink className="h-3 w-3 opacity-70" />
          </a>

          {/* Samples button */}
          <button
            onClick={onOpenSamplesModal}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:border-emerald-500/60 hover:bg-slate-800 hover:text-white"
          >
            <Compass className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Muestras</span>
          </button>

          {/* GitHub / Windows-Linux Setup */}
          <button
            onClick={onOpenGithubModal}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-emerald-900/30 transition-all hover:from-emerald-500 hover:to-teal-500 hover:shadow-emerald-900/50"
          >
            <Github className="h-4 w-4" />
            <span className="hidden md:inline">GitHub / PC</span>
            <span className="rounded bg-black/30 px-1 py-0.2 text-[9px] font-mono uppercase">PC</span>
          </button>
        </div>
      </div>
    </header>
  );
};

