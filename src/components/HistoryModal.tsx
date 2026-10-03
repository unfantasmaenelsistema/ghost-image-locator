import React, { useState } from 'react';
import {
  History,
  X,
  Trash2,
  MapPin,
  ExternalLink,
  Camera,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Check,
  FileText,
  Loader2,
} from 'lucide-react';
import { HistoryItem } from '../types';
import { generateOsintPdfReport } from '../utils/pdfReportGenerator';

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryItem[];
  onSelectHistoryItem: (item: HistoryItem) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onSelectHistoryItem,
  onDeleteItem,
  onClearAll,
}) => {
  if (!isOpen) return null;

  const [generatingPdfId, setGeneratingPdfId] = useState<string | null>(null);

  const handleDownloadItemPdf = async (item: HistoryItem) => {
    setGeneratingPdfId(item.id);
    try {
      await generateOsintPdfReport({
        imageSrc: item.imageSrc,
        result: item.result,
        exif: item.exif,
        websiteUrl: 'https://unfantasmaenelsistema.com',
      });
    } catch (err) {
      console.error('Error generando PDF desde historial:', err);
    } finally {
      setGeneratingPdfId(null);
    }
  };

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Hace unos segundos';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours} h`;
    return `Hace ${days} día${days > 1 ? 's' : ''}`;
  };

  const getConfidenceBadge = (level: string, percent: number) => {
    switch (level) {
      case 'VERY_HIGH':
      case 'HIGH':
        return {
          bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80',
          label: `${percent}% Alta`,
        };
      case 'MEDIUM':
        return {
          bg: 'bg-amber-950/80 text-amber-300 border-amber-800/80',
          label: `${percent}% Media`,
        };
      default:
        return {
          bg: 'bg-rose-950/80 text-rose-300 border-rose-800/80',
          label: `${percent}% Baja`,
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-950/80 text-emerald-400 border border-emerald-800/60">
              <History className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">
                  Historial de Análisis OSINT
                </h3>
                <span className="rounded bg-emerald-950 px-2 py-0.5 text-[10px] font-mono text-emerald-300 border border-emerald-800">
                  {history.length} / 5 Guardados
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Almacenamiento persistente local en tu navegador (localStorage)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="flex items-center gap-1.5 rounded-lg border border-rose-900/60 bg-rose-950/30 px-2.5 py-1 text-xs text-rose-300 hover:bg-rose-900/40 hover:text-rose-200 transition-colors"
                title="Borrar todo el historial"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Vaciar</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          {history.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80 text-slate-500">
                <History className="h-6 w-6" />
              </div>
              <p className="text-sm font-medium text-slate-300">
                No hay análisis en el historial
              </p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Cada vez que analices una fotografía o elijas una muestra, se guardará automáticamente aquí para que puedas recuperarla al instante sin volver a gastar peticiones.
              </p>
            </div>
          ) : (
            history.map((item) => {
              const badge = getConfidenceBadge(item.confidenceLevel, item.confidencePercent);
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-800/90 bg-slate-950/60 p-3 sm:p-4 hover:border-emerald-500/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3.5 w-full sm:w-auto">
                    {/* Thumbnail preview */}
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-slate-800 bg-slate-900">
                      <img
                        src={item.thumbnailSrc || item.imageSrc}
                        alt={item.locationTitle}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>

                    {/* Metadata summary */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-200 truncate">
                          {item.locationTitle}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[9px] font-mono border ${badge.bg}`}
                        >
                          {badge.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <MapPin className="h-3 w-3 text-emerald-400 shrink-0" />
                        <span className="truncate max-w-[280px]">
                          {item.result.approximateAddress}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 font-mono">
                        <span>{formatTime(item.timestamp)}</span>
                        <span>•</span>
                        <span>{item.result.latitude.toFixed(4)}, {item.result.longitude.toFixed(4)}</span>
                        {item.exif?.make && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Camera className="h-2.5 w-2.5" />
                              {item.exif.make} {item.exif.model}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDownloadItemPdf(item)}
                      disabled={generatingPdfId === item.id}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-400 hover:bg-slate-900 transition-colors border border-transparent hover:border-slate-800"
                      title="Descargar reporte PDF de este análisis"
                    >
                      {generatingPdfId === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin text-emerald-400" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                      title="Eliminar del historial"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onSelectHistoryItem(item);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow-md shadow-emerald-950 transition-all"
                    >
                      <span>Cargar</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="border-t border-slate-800 px-6 py-3 bg-slate-950 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            Tus datos se guardan únicamente en la memoria local de tu navegador
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
