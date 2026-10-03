import React from 'react';
import { History, MapPin, ArrowRight, Trash2, Clock } from 'lucide-react';
import { HistoryItem } from '../types';

interface QuickHistoryBarProps {
  history: HistoryItem[];
  currentSelectedId?: string | null;
  onSelectHistoryItem: (item: HistoryItem) => void;
  onOpenHistoryModal: () => void;
}

export const QuickHistoryBar: React.FC<QuickHistoryBarProps> = ({
  history,
  currentSelectedId,
  onSelectHistoryItem,
  onOpenHistoryModal,
}) => {
  if (history.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 sm:p-4 shadow-xl backdrop-blur-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
            <History className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Historial de Análisis Recientes
          </span>
          <span className="rounded bg-emerald-950 px-2 py-0.2 text-[10px] font-mono text-emerald-300 border border-emerald-800">
            {history.length} / 5
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenHistoryModal}
          className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition-colors"
        >
          <span>Ver todo</span>
          <ArrowRight className="h-3 w-3" />
        </button>
      </div>

      {/* Grid of up to 5 quick cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
        {history.map((item) => {
          const isSelected = currentSelectedId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectHistoryItem(item)}
              className={`rounded-xl border p-2 text-left transition-all flex flex-col justify-between group overflow-hidden ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-950/30 ring-1 ring-emerald-500/50'
                  : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-slate-900 mb-2 border border-slate-850">
                <img
                  src={item.thumbnailSrc || item.imageSrc}
                  alt={item.locationTitle}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute top-1 right-1 rounded bg-black/70 px-1.5 py-0.2 text-[9px] font-mono text-emerald-300 backdrop-blur-xs">
                  {item.confidencePercent}%
                </div>
              </div>

              <div className="w-full space-y-0.5">
                <p className="text-[11px] font-bold text-slate-200 truncate group-hover:text-emerald-300 transition-colors">
                  {item.locationTitle}
                </p>
                <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
                  <MapPin className="h-2.5 w-2.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{item.result.city || item.result.country}</span>
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
