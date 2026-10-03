import React from 'react';
import { X, MapPin, Sparkles, Compass } from 'lucide-react';
import { SAMPLE_IMAGES } from '../data/samples';
import { SampleImage } from '../types';

interface SamplesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSample: (sample: SampleImage) => void;
}

export const SamplesModal: React.FC<SamplesModalProps> = ({ isOpen, onClose, onSelectSample }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 p-5 bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-800/60">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Galería de Fotografías de Muestra
              </h3>
              <p className="text-xs text-slate-400">
                Selecciona cualquier caso para probar la capacidad del motor OSINT y Gemini Vision
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

        {/* Content list */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SAMPLE_IMAGES.map((sample) => (
              <div
                key={sample.id}
                onClick={() => {
                  onSelectSample(sample);
                  onClose();
                }}
                className="group relative cursor-pointer overflow-hidden rounded-xl border border-slate-800 bg-slate-950/70 transition-all hover:border-emerald-500/50 hover:bg-slate-950 hover:shadow-xl"
              >
                {/* Photo thumbnail */}
                <div className="relative h-40 w-full overflow-hidden bg-slate-900">
                  <img
                    src={sample.url}
                    alt={sample.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-2 left-2 rounded bg-black/60 backdrop-blur-md px-2 py-0.5 text-[10px] font-mono text-emerald-300 border border-emerald-500/30">
                    {sample.category}
                  </div>
                </div>

                {/* Details */}
                <div className="p-3.5 space-y-2">
                  <h4 className="text-xs font-bold text-slate-100 group-hover:text-emerald-400 transition-colors">
                    {sample.name}
                  </h4>
                  <div className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                    <MapPin className="h-3 w-3 text-emerald-400 shrink-0" />
                    <span>{sample.expectedLocation}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                    {sample.description}
                  </p>

                  {/* Hint badges */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {sample.hints.slice(0, 3).map((hint, idx) => (
                      <span
                        key={idx}
                        className="rounded bg-slate-900 px-1.5 py-0.5 text-[9px] text-slate-400 border border-slate-800"
                      >
                        {hint}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="w-full mt-2 rounded-lg bg-slate-800/90 py-1.5 text-xs font-semibold text-slate-200 group-hover:bg-emerald-600 group-hover:text-white transition-colors"
                  >
                    Probar esta foto
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
