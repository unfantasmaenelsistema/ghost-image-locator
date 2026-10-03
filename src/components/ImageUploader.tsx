import React, { useRef, useState, useEffect } from 'react';
import {
  UploadCloud,
  Image as ImageIcon,
  Sparkles,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sliders,
  FileCheck,
  AlertCircle,
  Camera,
  ExternalLink,
  Eye,
  Info,
} from 'lucide-react';
import { ExifMetadata } from '../types';

interface ImageUploaderProps {
  imageSrc: string | null;
  imageFile: File | null;
  exif: ExifMetadata | null;
  onImageSelected: (dataUrl: string, file?: File) => void;
  onClear: () => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  onOpenSamples: () => void;
}

type FilterMode = 'normal' | 'contrast' | 'invert' | 'grayscale' | 'sharpen';

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  imageSrc,
  imageFile,
  exif,
  onImageSelected,
  onClear,
  onAnalyze,
  isAnalyzing,
  onOpenSamples,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>('normal');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imageMeta, setImageMeta] = useState<{ width: number; height: number } | null>(null);

  // Global clipboard paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isAnalyzing) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleFile(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isAnalyzing]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP, etc.)');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      onImageSelected(dataUrl, file);
      setZoomLevel(1);
      setFilterMode('normal');

      // Calculate dimensions
      const img = new Image();
      img.onload = () => {
        setImageMeta({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const getFilterStyle = (): React.CSSProperties => {
    switch (filterMode) {
      case 'contrast':
        return { filter: 'contrast(180%) brightness(110%)' };
      case 'invert':
        return { filter: 'invert(100%) hue-rotate(180deg)' };
      case 'grayscale':
        return { filter: 'grayscale(100%) contrast(150%)' };
      case 'sharpen':
        return { filter: 'contrast(160%) saturate(140%) brightness(105%)' };
      default:
        return {};
    }
  };

  const handleOpenGoogleLens = () => {
    window.open('https://images.google.com/', '_blank');
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-xl backdrop-blur-sm sm:p-5">
      {!imageSrc ? (
        /* Empty Upload State */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`group relative flex min-h-[320px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all ${
            isDragging
              ? 'border-emerald-400 bg-emerald-950/20 scale-[0.99]'
              : 'border-slate-700/80 bg-slate-950/40 hover:border-emerald-500/50 hover:bg-slate-900/50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />

          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-800/80 text-emerald-400 ring-1 ring-slate-700 group-hover:scale-110 group-hover:bg-emerald-950/50 group-hover:text-emerald-300 transition-all">
            <UploadCloud className="h-8 w-8" />
          </div>

          <h3 className="text-base font-semibold text-slate-200">
            Arrastra una fotografía aquí o haz clic para examinar
          </h3>
          <p className="mt-1.5 max-w-sm text-xs text-slate-400">
            Admite JPG, PNG, WEBP, HEIC o capturas de pantalla pegadas directamente con{' '}
            <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
              Ctrl+V
            </kbd>
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 border border-slate-700">
              <FileCheck className="h-3.5 w-3.5 text-emerald-400" /> Metadatos EXIF
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 border border-slate-700">
              <Sparkles className="h-3.5 w-3.5 text-cyan-400" /> Gemini Vision OSINT
            </span>
            <span className="inline-flex items-center gap-1 rounded-md bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-300 border border-slate-700">
              <Eye className="h-3.5 w-3.5 text-amber-400" /> Google Street View & Maps
            </span>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenSamples();
              }}
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-4"
            >
              ¿No tienes una foto a mano? Prueba con las fotos de muestra ➔
            </button>
          </div>
        </div>
      ) : (
        /* Image Loaded & Inspector View */
        <div className="space-y-4">
          {/* Top Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-medium text-slate-300 truncate max-w-[200px] sm:max-w-xs">
                {imageFile?.name || 'Fotografía seleccionada'}
              </span>
              {imageMeta && (
                <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                  {imageMeta.width} × {imageMeta.height} px
                </span>
              )}
            </div>

            {/* Forensic Inspection Filter Bar */}
            <div className="flex items-center gap-1.5 bg-slate-950/80 p-1 rounded-lg border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 uppercase px-1.5 hidden sm:inline">
                Filtro Forense:
              </span>
              {(['normal', 'contrast', 'invert', 'sharpen'] as FilterMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFilterMode(mode)}
                  className={`rounded px-2 py-1 text-[10px] font-medium uppercase transition-colors ${
                    filterMode === mode
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {mode === 'normal'
                    ? 'Original'
                    : mode === 'contrast'
                    ? 'Contraste'
                    : mode === 'invert'
                    ? 'Invertir'
                    : 'Realce'}
                </button>
              ))}

              <div className="h-4 w-px bg-slate-800 mx-1" />

              {/* Zoom controls */}
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(1, z - 0.5))}
                disabled={zoomLevel <= 1}
                className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                title="Reducir zoom"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <span className="text-[10px] font-mono text-slate-400 min-w-[28px] text-center">
                {zoomLevel}x
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(3, z + 0.5))}
                disabled={zoomLevel >= 3}
                className="p-1 text-slate-400 hover:text-white disabled:opacity-30"
                title="Aumentar zoom"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Image Display Area with Pan/Zoom & Filter */}
          <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-950 max-h-[460px] flex items-center justify-center">
            <div
              className="relative w-full h-full max-h-[460px] overflow-auto flex items-center justify-center p-2"
              style={{ cursor: zoomLevel > 1 ? 'grab' : 'default' }}
            >
              <img
                src={imageSrc}
                alt="Imagen para geolocalización"
                style={{
                  ...getFilterStyle(),
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                  transition: 'transform 0.15s ease-out, filter 0.2s ease',
                }}
                className="max-h-[440px] w-auto max-w-full rounded object-contain shadow-2xl"
              />
            </div>

            {/* Quick EXIF GPS indicator overlay */}
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-lg bg-slate-950/85 px-3 py-1.5 text-xs backdrop-blur-md border border-slate-800 shadow-md">
              {exif?.hasGps ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span className="font-mono text-emerald-400 text-[11px]">
                    EXIF GPS detectado: {exif.latitude?.toFixed(4)}, {exif.longitude?.toFixed(4)}
                  </span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-amber-400" />
                  <span className="text-[11px] text-amber-300">
                    Sin GPS en EXIF (se deducirá por visión con Gemini y Google Street View)
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-slate-600 hover:text-white"
              >
                Cambiar foto
              </button>

              <button
                type="button"
                onClick={handleOpenGoogleLens}
                className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-300 transition-colors hover:border-emerald-500/50 hover:text-emerald-300"
                title="Buscar esta foto en Google Lens / Imágenes para encontrar Street View"
              >
                <Camera className="h-3.5 w-3.5 text-emerald-400" />
                <span>Google Lens</span>
                <ExternalLink className="h-2.5 w-2.5 opacity-60" />
              </button>

              <button
                type="button"
                onClick={onClear}
                className="rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs font-medium text-rose-400 transition-colors hover:bg-rose-950/30 hover:border-rose-800/50"
              >
                Borrar
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFile(e.target.files[0]);
                  }
                }}
              />
            </div>

            {/* Main Geolocation CTA */}
            <button
              type="button"
              onClick={onAnalyze}
              disabled={isAnalyzing}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-950/50 transition-all hover:opacity-95 hover:shadow-emerald-900/80 active:scale-[0.98] disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4 fill-slate-950" />
              <span>{isAnalyzing ? 'Analizando con Gemini...' : 'Triangular Ubicación (OSINT)'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
