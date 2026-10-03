import React, { useState, useEffect } from 'react';
import { Crosshair, Radar, Sparkles, ShieldAlert, Cpu } from 'lucide-react';

const ANALYSIS_STAGES = [
  'Extrayendo cabeceras EXIF, marcas de tiempo y geolocalización de hardware...',
  'Escaneando señalética vial, tipografía, alfabetos y dominios web visibles...',
  'Analizando estilo arquitectónico, tipo de tejados y métodos constructivos...',
  'Clasificando bioma, especies arbóreas, color del suelo y topografía...',
  'Examinando sentido de la marcha, matrículas y mobiliario urbano (bolardos/postes)...',
  'Calculando orientación de sombras y elevación solar para determinar hemisferio...',
  'Triangulando coordenadas geodésicas WGS84 con Google Gemini Vision...',
];

export const AnalysisLoading: React.FC = () => {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((prev) => (prev < ANALYSIS_STAGES.length - 1 ? prev + 1 : prev));
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-slate-950 p-8 text-center shadow-2xl">
      {/* Background cyber grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#064e3b15_1px,transparent_1px),linear-gradient(to_bottom,#064e3b15_1px,transparent_1px)] bg-[size:24px_24px]" />

      <div className="relative z-10 mx-auto flex max-w-md flex-col items-center">
        {/* Animated Radar Reticle */}
        <div className="relative mb-6 flex h-32 w-32 items-center justify-center">
          {/* Outer circle */}
          <div className="absolute h-full w-full rounded-full border border-emerald-500/30 animate-spin [animation-duration:8s]" />
          <div className="absolute h-24 w-24 rounded-full border border-emerald-400/40" />
          <div className="absolute h-16 w-16 rounded-full border border-teal-400/60" />

          {/* Sweeping Radar Scanner Line */}
          <div className="absolute h-full w-full rounded-full overflow-hidden">
            <div className="h-1/2 w-1/2 origin-bottom-right bg-gradient-to-br from-emerald-500/40 to-transparent animate-spin [animation-duration:2.5s]" />
          </div>

          {/* Center Target */}
          <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/50">
            <Crosshair className="h-5 w-5 animate-pulse" />
          </div>
        </div>

        {/* Status text */}
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-950/80 px-3 py-1 text-xs font-mono font-bold text-emerald-400 border border-emerald-800/80">
          <Cpu className="h-3.5 w-3.5 animate-spin" />
          <span>MOTOR OSINT ACTIVO</span>
        </div>

        <h3 className="mt-3 text-lg font-bold text-slate-100">
          Triangulando Geolocalización con Google Gemini
        </h3>

        {/* Dynamic stage step */}
        <div className="mt-3 min-h-[48px] flex items-center justify-center">
          <p className="font-mono text-xs text-slate-300 transition-all duration-300 animate-pulse">
            {ANALYSIS_STAGES[stageIndex]}
          </p>
        </div>

        {/* Stage progress bar */}
        <div className="mt-4 w-full max-w-xs overflow-hidden rounded-full bg-slate-900 border border-slate-800">
          <div
            className="h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-500"
            style={{ width: `${((stageIndex + 1) / ANALYSIS_STAGES.length) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
