import React, { useState } from 'react';
import {
  FileText,
  Camera,
  Calendar,
  Layers,
  MapPin,
  Sliders,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { ExifMetadata } from '../types';

interface ExifInspectorProps {
  exif: ExifMetadata | null;
}

export const ExifInspector: React.FC<ExifInspectorProps> = ({ exif }) => {
  const [showRaw, setShowRaw] = useState(false);

  if (!exif) return null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Inspección Forense de Metadatos EXIF / XMP
          </h3>
        </div>

        {exif.hasGps ? (
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-950/80 px-2.5 py-1 text-xs font-semibold text-emerald-400 border border-emerald-800/60">
            <CheckCircle2 className="h-3.5 w-3.5" /> Metadatos GPS Integrados
          </span>
        ) : (
          <span className="flex items-center gap-1.5 rounded-full bg-amber-950/80 px-2.5 py-1 text-xs font-semibold text-amber-400 border border-amber-800/60">
            <AlertCircle className="h-3.5 w-3.5" /> Sin GPS EXIF (Scrubbed / Redes Sociales)
          </span>
        )}
      </div>

      {!exif.hasGps && (
        <div className="mb-4 rounded-xl border border-amber-800/40 bg-amber-950/20 p-3 text-xs text-amber-300/90 flex items-start gap-2.5">
          <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
          <p>
            Plataformas como WhatsApp, Twitter, Instagram y Facebook despojan deliberadamente las coordenadas GPS de las imágenes para proteger la privacidad. En estos casos, el motor OSINT de Gemini analiza exclusivamente las pistas visuales (señales, vegetación, sol y arquitectura).
          </p>
        </div>
      )}

      {/* Structured EXIF Grid */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Camera device */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
            <Camera className="h-3.5 w-3.5 text-slate-500" />
            <span>Dispositivo / Cámara</span>
          </div>
          <div className="mt-1 font-semibold text-slate-200 text-xs truncate">
            {exif.make || exif.model ? `${exif.make || ''} ${exif.model || ''}` : 'No especificado'}
          </div>
        </div>

        {/* Date and time */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
            <Calendar className="h-3.5 w-3.5 text-slate-500" />
            <span>Fecha de Captura</span>
          </div>
          <div className="mt-1 font-semibold text-slate-200 text-xs truncate">
            {exif.dateTime || 'No disponible'}
          </div>
        </div>

        {/* Software / Post-processing */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
            <Sliders className="h-3.5 w-3.5 text-slate-500" />
            <span>Software / Procesado</span>
          </div>
          <div className="mt-1 font-semibold text-slate-200 text-xs truncate">
            {exif.software || 'Cámara nativa (Sin edición)'}
          </div>
        </div>

        {/* Lens / Optics */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400">
            <Layers className="h-3.5 w-3.5 text-slate-500" />
            <span>Parámetros Ópticos</span>
          </div>
          <div className="mt-1 font-mono text-[11px] text-slate-200 truncate">
            {exif.focalLength ? `${exif.focalLength}mm` : ''} {exif.fNumber ? `f/${exif.fNumber}` : ''} {exif.iso ? `ISO ${exif.iso}` : ''}
            {!exif.focalLength && !exif.fNumber && !exif.iso && 'No registrados'}
          </div>
        </div>
      </div>

      {/* Raw tags toggle */}
      {exif.rawTags && Object.keys(exif.rawTags).length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setShowRaw(!showRaw)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
          >
            {showRaw ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            <span>{showRaw ? 'Ocultar volcado completo de etiquetas EXIF' : `Ver volcado técnico (${Object.keys(exif.rawTags).length} etiquetas)`}</span>
          </button>

          {showRaw && (
            <div className="mt-3 max-h-60 overflow-auto rounded-xl border border-slate-800 bg-slate-950 p-3 font-mono text-[11px] text-slate-300">
              <pre className="whitespace-pre-wrap">{JSON.stringify(exif.rawTags, null, 2)}</pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
