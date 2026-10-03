import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  Sun,
  Sunrise,
  Sunset,
  Leaf,
  Compass,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  Info,
  ChevronRight,
  Flame,
  TreeDeciduous,
} from 'lucide-react';
import { ShadowVegetationChronology } from '../types';

interface ChronoTimelineVisualizerProps {
  timeline?: ShadowVegetationChronology;
}

export const ChronoTimelineVisualizer: React.FC<ChronoTimelineVisualizerProps> = ({ timeline }) => {
  const [activeTab, setActiveTab] = useState<'daily' | 'annual'>('daily');

  if (!timeline) return null;

  const {
    estimatedTimeWindow,
    shadowAngleDegrees,
    shadowRatioDescription,
    solarAzimuth,
    solarElevationCategory,
    vegetationSpecies,
    phenologicalStage,
    botanicalDeduction,
    estimatedSeason,
    estimatedDateWindow,
    peakMonth,
    dailyTimeline = [],
    annualTimeline = [],
    forensicSynthesis,
  } = timeline;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'peak':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500 shadow-md shadow-emerald-950/50 font-black scale-105';
      case 'likely':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-700/80 font-bold';
      case 'possible':
        return 'bg-slate-900 text-slate-300 border-slate-700';
      case 'excluded':
      default:
        return 'bg-slate-950/40 text-slate-600 border-slate-900 line-through opacity-50';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'peak':
        return 'Mes Clave';
      case 'likely':
        return 'Probable';
      case 'possible':
        return 'Posible';
      case 'excluded':
      default:
        return 'Descartado';
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950 p-5 shadow-2xl sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-950/80 text-amber-400 border border-amber-800/80 shadow-inner">
            <TrendingUp className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-white tracking-wide">
                Línea de Tiempo Estimada: Sombras & Vegetación
              </h3>
              <span className="rounded-md bg-amber-950/80 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300 border border-amber-800/60">
                CRONOLOCALIZACIÓN
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Correlación astronómica de inclinación solar y fenología botánica sin necesidad de metadatos EXIF
            </p>
          </div>
        </div>

        {/* Tab switch between Daily vs Annual timeline */}
        <div className="flex items-center rounded-xl bg-slate-950 p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab('daily')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'daily'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>Línea Diaria (Sombras)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('annual')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'annual'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            <span>Línea Anual (Vegetación)</span>
          </button>
        </div>
      </div>

      {/* Main Timeline Visual Section */}
      {activeTab === 'daily' ? (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Daily Solar Time Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 space-y-1">
              <span className="text-[10px] font-mono uppercase text-amber-400">Hora de Captura Estimada</span>
              <div className="text-lg font-black text-amber-200 flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-400" />
                <span>{estimatedTimeWindow}</span>
              </div>
              <span className="text-[11px] text-slate-300">{solarElevationCategory || 'Sol de tarde'}</span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Inclinación Solar (Ángulo)</span>
              <div className="text-lg font-black text-white flex items-center gap-2">
                <Sun className="h-4 w-4 text-amber-400" />
                <span>{shadowAngleDegrees}° sobre el horizonte</span>
              </div>
              <span className="text-[11px] text-slate-400">{shadowRatioDescription}</span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Azimut / Rumbo Solar</span>
              <div className="text-lg font-black text-cyan-300 flex items-center gap-2">
                <Compass className="h-4 w-4 text-cyan-400" />
                <span>{solarAzimuth}</span>
              </div>
              <span className="text-[11px] text-slate-400">Orientación proyectada de sombras</span>
            </div>
          </div>

          {/* Interactive Visual Timeline Track */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-5 space-y-4">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              <span className="flex items-center gap-1.5">
                <Sunrise className="h-4 w-4 text-amber-400" /> Amanecer
              </span>
              <span className="flex items-center gap-1.5">
                <Sun className="h-4 w-4 text-yellow-400" /> Mediodía Solar
              </span>
              <span className="flex items-center gap-1.5">
                <Sunset className="h-4 w-4 text-orange-400" /> Ocaso
              </span>
            </div>

            {/* Visual Milestones */}
            <div className="relative pt-6 pb-2">
              {/* Timeline baseline */}
              <div className="absolute top-10 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 via-yellow-400 to-orange-600 rounded-full opacity-60" />

              <div className="relative flex justify-between items-center gap-2">
                {dailyTimeline.length > 0 ? (
                  dailyTimeline.map((point, idx) => (
                    <div
                      key={idx}
                      className={`flex flex-col items-center text-center transition-all ${
                        point.isCaptureWindow ? 'scale-110 -translate-y-2' : ''
                      }`}
                    >
                      {/* Badge if capture */}
                      {point.isCaptureWindow && (
                        <span className="mb-2 rounded-full bg-amber-500 text-black px-2 py-0.5 text-[9px] font-black tracking-wider uppercase shadow-lg shadow-amber-500/50 animate-bounce">
                          FOTO
                        </span>
                      )}

                      {/* Node circle */}
                      <div
                        className={`h-7 w-7 rounded-full flex items-center justify-center border-2 z-10 transition-transform ${
                          point.isCaptureWindow
                            ? 'bg-amber-400 border-white text-slate-950 shadow-xl shadow-amber-400/50 ring-4 ring-amber-500/30'
                            : 'bg-slate-900 border-slate-700 text-slate-400'
                        }`}
                      >
                        <Sun className={`h-3.5 w-3.5 ${point.isCaptureWindow ? 'text-slate-950' : 'text-slate-400'}`} />
                      </div>

                      {/* Time & Label */}
                      <span
                        className={`mt-2 font-mono text-xs ${
                          point.isCaptureWindow ? 'font-black text-amber-300' : 'text-slate-300'
                        }`}
                      >
                        {point.timeLabel}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {point.stageName}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500">
                        {point.solarAngleDeg}° elev.
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 text-center w-full py-4">
                    Intervalo estimado: {estimatedTimeWindow} ({shadowAngleDegrees}° de elevación)
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-5 animate-in fade-in duration-300">
          {/* Annual Timeline Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3.5 space-y-1">
              <span className="text-[10px] font-mono uppercase text-emerald-400">Ventana de Fechas Estimada</span>
              <div className="text-lg font-black text-emerald-200 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-emerald-400" />
                <span>{estimatedDateWindow}</span>
              </div>
              <span className="text-[11px] text-slate-300">Estación: {estimatedSeason}</span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Especies Botánicas</span>
              <div className="text-sm font-bold text-white flex items-center gap-2 truncate">
                <TreeDeciduous className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="truncate">{vegetationSpecies}</span>
              </div>
              <span className="text-[11px] text-slate-400 truncate block">{phenologicalStage}</span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1">
              <span className="text-[10px] font-mono uppercase text-slate-400">Mes de Máxima Probabilidad</span>
              <div className="text-lg font-black text-amber-300 flex items-center gap-2">
                <Flame className="h-4 w-4 text-amber-400" />
                <span>{peakMonth}</span>
              </div>
              <span className="text-[11px] text-slate-400">Por estado fenológico y ciclicidad</span>
            </div>
          </div>

          {/* 12 Months Grid */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Distribución de Probabilidad Anual (12 Meses):
            </span>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-12 gap-2">
              {annualTimeline.length > 0 ? (
                annualTimeline.map((item, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col items-center justify-between rounded-xl border p-2 text-center transition-all ${getStatusColor(
                      item.status,
                    )}`}
                    title={item.phenologyState || item.monthName}
                  >
                    <span className="text-xs font-mono">{item.monthName}</span>
                    <span className="text-[8px] uppercase tracking-tighter mt-1">
                      {getStatusLabel(item.status)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="col-span-12 text-center text-xs text-slate-400">
                  Mes más probable: {peakMonth} ({estimatedDateWindow})
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 gap-2">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" /> Mes clave / probable
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-600" /> Mes posible
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-slate-900 border border-slate-800" /> Descartado por botánica/sombras
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Forensic Cross-Synthesis Box */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-4 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>Dictamen Pericial de Correlación Sombras-Vegetación</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-sans">
          {forensicSynthesis || botanicalDeduction}
        </p>
      </div>
    </div>
  );
};
