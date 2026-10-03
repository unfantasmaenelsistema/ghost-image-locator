import React from 'react';
import {
  Clock,
  Sun,
  Sunset,
  Sunrise,
  CloudSun,
  Calendar,
  Sparkles,
  Compass,
  ThermometerSun,
  Leaf,
  Wind,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { ChronolocationEstimate } from '../types';

interface ChronolocationCardProps {
  chronolocation?: ChronolocationEstimate;
}

export const ChronolocationCard: React.FC<ChronolocationCardProps> = ({ chronolocation }) => {
  if (!chronolocation) return null;

  const {
    estimatedTimeOfDay,
    timeConfidence,
    sunPositionAnalysis,
    estimatedSeason,
    estimatedMonthRange,
    seasonConfidence,
    environmentalClues,
    lightingConditions,
  } = chronolocation;

  // Determine season badge colors and icons
  const getSeasonConfig = (season: string) => {
    switch (season) {
      case 'Verano':
        return {
          icon: <Sun className="h-4 w-4 text-amber-400" />,
          badge: 'bg-amber-950/60 border-amber-500/40 text-amber-300',
          gradient: 'from-amber-950/30 to-orange-950/20',
        };
      case 'Otoño':
        return {
          icon: <Leaf className="h-4 w-4 text-orange-400" />,
          badge: 'bg-orange-950/60 border-orange-500/40 text-orange-300',
          gradient: 'from-orange-950/30 to-amber-950/20',
        };
      case 'Invierno':
        return {
          icon: <Wind className="h-4 w-4 text-cyan-400" />,
          badge: 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300',
          gradient: 'from-cyan-950/30 to-blue-950/20',
        };
      case 'Primavera':
        return {
          icon: <Sparkles className="h-4 w-4 text-emerald-400" />,
          badge: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300',
          gradient: 'from-emerald-950/30 to-teal-950/20',
        };
      default:
        return {
          icon: <CloudSun className="h-4 w-4 text-slate-400" />,
          badge: 'bg-slate-900 border-slate-700 text-slate-300',
          gradient: 'from-slate-900/40 to-slate-950/40',
        };
    }
  };

  const getConfidenceBadge = (conf: string) => {
    switch (conf) {
      case 'VERY_HIGH':
      case 'HIGH':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'MEDIUM':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const seasonCfg = getSeasonConfig(estimatedSeason);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-sm sm:p-6 space-y-4">
      {/* Header with OSINT Chronolocation badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-950/80 text-amber-400 border border-amber-800/60 shadow-inner">
            <Sun className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Cronolocalización Forense (Hora Solar y Fecha Estimada)
              </h3>
              <span className="rounded bg-amber-950 px-2 py-0.5 text-[10px] font-mono text-amber-300 border border-amber-800">
                Sin Metadatos EXIF
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Deducción temporal mediante geometría solar, longitud de sombras proyectadas y fenología botánica
            </p>
          </div>
        </div>

        {lightingConditions && (
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/70 px-2.5 py-1 text-xs text-slate-300">
            <ThermometerSun className="h-3.5 w-3.5 text-amber-400" />
            <span className="font-medium">{lightingConditions}</span>
          </div>
        )}
      </div>

      {/* Main Dual Estimates Grid (Hora Solar & Estación/Mes) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. ESTIMACIÓN DE HORA SOLAR */}
        <div className="rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-slate-950/80 to-slate-950 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-300">
              <Clock className="h-4 w-4 text-amber-400" />
              <span>Hora Solar Estimada</span>
            </div>
            <span
              className={`rounded px-1.5 py-0.2 text-[9px] font-mono border uppercase ${getConfidenceBadge(
                timeConfidence,
              )}`}
            >
              Certeza {timeConfidence}
            </span>
          </div>

          <div className="text-lg sm:text-xl font-black text-amber-200 tracking-tight">
            {estimatedTimeOfDay}
          </div>

          <div className="rounded-lg bg-black/40 border border-slate-800/80 p-3 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
              <Compass className="h-3 w-3 text-amber-400" /> Análisis de Sombras y Azimut:
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              {sunPositionAnalysis}
            </p>
          </div>
        </div>

        {/* 2. ESTIMACIÓN DE FECHA / ESTACIÓN */}
        <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900/60 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
              <Calendar className="h-4 w-4 text-emerald-400" />
              <span>Estación y Meses Estimados</span>
            </div>
            <span
              className={`rounded px-1.5 py-0.2 text-[9px] font-mono border uppercase ${getConfidenceBadge(
                seasonConfidence,
              )}`}
            >
              Certeza {seasonConfidence}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold ${seasonCfg.badge}`}>
              {seasonCfg.icon}
              <span>{estimatedSeason}</span>
            </div>
            <div className="text-base sm:text-lg font-black text-white">
              {estimatedMonthRange}
            </div>
          </div>

          <div className="rounded-lg bg-black/40 border border-slate-800/80 p-3 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400 flex items-center gap-1">
              <Leaf className="h-3 w-3 text-emerald-400" /> Pistas Fenológicas y Ambientales:
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              {environmentalClues}
            </p>
          </div>
        </div>
      </div>

      {/* Scientific OSINT note */}
      <div className="flex items-center gap-2 rounded-xl bg-slate-950/50 border border-slate-800/80 px-3 py-2 text-[11px] text-slate-400">
        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
        <span>
          Esta deducción se genera analizando la física de sombras, altitud angular del sol y ciclo biológico de la vegetación, sin necesidad de que la cámara haya guardado fecha o metadatos EXIF.
        </span>
      </div>
    </div>
  );
};
