import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Layers,
  Download,
  ShieldAlert,
  Sliders,
  Move,
  Eye,
  Info,
} from 'lucide-react';

interface ImageForensicsModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  imageName?: string;
  sha256Hash?: string;
}

type FilterMode = 'normal' | 'ela' | 'shadow_boost' | 'negative' | 'sobel' | 'grayscale';

export const ImageForensicsModal: React.FC<ImageForensicsModalProps> = ({
  isOpen,
  onClose,
  imageSrc,
  imageName = 'evidencia_fotografica',
  sha256Hash,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [filterMode, setFilterMode] = useState<FilterMode>('normal');
  const [elaMultiplier, setElaMultiplier] = useState<number>(15);
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);

  // Load and cache original image
  useEffect(() => {
    if (!isOpen || !imageSrc) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      originalImageRef.current = img;
      applyFilter('normal');
    };
    img.src = imageSrc;
  }, [isOpen, imageSrc]);

  // Apply selected filter to canvas
  const applyFilter = (mode: FilterMode, mult = elaMultiplier) => {
    const img = originalImageRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    setIsProcessing(true);

    // Draw base image
    ctx.drawImage(img, 0, 0);

    if (mode === 'normal') {
      setIsProcessing(false);
      return;
    }

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    if (mode === 'grayscale') {
      for (let i = 0; i < data.length; i += 4) {
        const avg = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = avg;
        data[i + 1] = avg;
        data[i + 2] = avg;
      }
      ctx.putImageData(imgData, 0, 0);
      setIsProcessing(false);
    } else if (mode === 'negative') {
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 255 - data[i];
        data[i + 1] = 255 - data[i + 1];
        data[i + 2] = 255 - data[i + 2];
      }
      ctx.putImageData(imgData, 0, 0);
      setIsProcessing(false);
    } else if (mode === 'shadow_boost') {
      // Gamma / shadow curve enhancement
      for (let i = 0; i < data.length; i += 4) {
        // Boost dark shadows while preserving highlights
        data[i] = Math.min(255, Math.pow(data[i] / 255, 0.5) * 255 * 1.2);
        data[i + 1] = Math.min(255, Math.pow(data[i + 1] / 255, 0.5) * 255 * 1.2);
        data[i + 2] = Math.min(255, Math.pow(data[i + 2] / 255, 0.5) * 255 * 1.2);
      }
      ctx.putImageData(imgData, 0, 0);
      setIsProcessing(false);
    } else if (mode === 'sobel') {
      // Sobel Edge Detection
      const w = canvas.width;
      const h = canvas.height;
      const grayscale = new Float32Array(w * h);

      for (let i = 0, j = 0; i < data.length; i += 4, j++) {
        grayscale[j] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      }

      const output = ctx.createImageData(w, h);
      const outData = output.data;

      for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
          const idx = y * w + x;
          const gx =
            -grayscale[idx - w - 1] +
            grayscale[idx - w + 1] -
            2 * grayscale[idx - 1] +
            2 * grayscale[idx + 1] -
            grayscale[idx + w - 1] +
            grayscale[idx + w + 1];

          const gy =
            -grayscale[idx - w - 1] -
            2 * grayscale[idx - w] -
            grayscale[idx - w + 1] +
            grayscale[idx + w - 1] +
            2 * grayscale[idx + w] +
            grayscale[idx + w + 1];

          const mag = Math.min(255, Math.sqrt(gx * gx + gy * gy) * 1.8);
          const outIdx = (y * w + x) * 4;
          outData[outIdx] = mag;
          outData[outIdx + 1] = mag;
          outData[outIdx + 2] = mag;
          outData[outIdx + 3] = 255;
        }
      }
      ctx.putImageData(output, 0, 0);
      setIsProcessing(false);
    } else if (mode === 'ela') {
      // Error Level Analysis (ELA)
      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
      const compImg = new Image();
      compImg.onload = () => {
        const compCanvas = document.createElement('canvas');
        compCanvas.width = canvas.width;
        compCanvas.height = canvas.height;
        const compCtx = compCanvas.getContext('2d');
        if (!compCtx) {
          setIsProcessing(false);
          return;
        }
        compCtx.drawImage(compImg, 0, 0);
        const compData = compCtx.getImageData(0, 0, canvas.width, canvas.height).data;

        for (let i = 0; i < data.length; i += 4) {
          const diffR = Math.abs(data[i] - compData[i]) * mult;
          const diffG = Math.abs(data[i + 1] - compData[i + 1]) * mult;
          const diffB = Math.abs(data[i + 2] - compData[i + 2]) * mult;

          data[i] = Math.min(255, diffR);
          data[i + 1] = Math.min(255, diffG);
          data[i + 2] = Math.min(255, diffB);
        }
        ctx.putImageData(imgData, 0, 0);
        setIsProcessing(false);
      };
      compImg.src = compressedDataUrl;
    }
  };

  const handleFilterChange = (mode: FilterMode) => {
    setFilterMode(mode);
    applyFilter(mode);
  };

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(8, Math.max(0.5, Number((prev + delta).toFixed(2)))));
  };

  const handleReset = () => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
    setFilterMode('normal');
    applyFilter('normal');
  };

  // Pan / drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanPosition({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDownloadSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `forense_${filterMode}_${imageName}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="relative flex flex-col h-full max-h-[92vh] w-full max-w-6xl rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 px-5 py-3.5 bg-slate-900/80 gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-950/80 text-purple-400 border border-purple-800/80">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Laboratorio Forense de Imagen (ELA & Lupa Óptica)
                </h3>
                <span className="rounded bg-purple-950 px-2 py-0.5 text-[10px] font-mono text-purple-300 border border-purple-800">
                  {Math.round(zoomLevel * 100)}% ZOOM
                </span>
              </div>
              {sha256Hash && (
                <p className="text-[10px] font-mono text-slate-400 truncate max-w-md">
                  SHA-256: <span className="text-slate-300">{sha256Hash}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadSnapshot}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 transition-all"
              title="Descargar imagen procesada con el filtro actual"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Exportar Captura</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Filter buttons & Zoom Controls */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-800 bg-slate-900/40 px-5 py-2.5 gap-3">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] uppercase font-mono text-slate-400 mr-1 hidden sm:inline">Filtro:</span>
            <button
              type="button"
              onClick={() => handleFilterChange('normal')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                filterMode === 'normal'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              Original
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange('ela')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                filterMode === 'ela'
                  ? 'bg-rose-600 text-white font-bold shadow-md shadow-rose-950'
                  : 'bg-slate-900 text-rose-300 hover:text-rose-100 border border-slate-800'
              }`}
              title="Error Level Analysis: detecta zonas manipuladas o añadidas por compresión"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>ELA (Antimanipulación)</span>
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange('shadow_boost')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                filterMode === 'shadow_boost'
                  ? 'bg-amber-600 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
              title="Aclara sombras profundas sin quemar las zonas iluminadas"
            >
              Realce de Sombras
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange('sobel')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                filterMode === 'sobel'
                  ? 'bg-purple-600 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
              title="Detección de bordes arquitectónicos y tipografía vial"
            >
              Bordes Sobel
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange('negative')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                filterMode === 'negative'
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
              title="Inversión cromática para leer textos de bajo contraste"
            >
              Inversión
            </button>

            <button
              type="button"
              onClick={() => handleFilterChange('grayscale')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                filterMode === 'grayscale'
                  ? 'bg-slate-600 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              B/N
            </button>
          </div>

          {/* Zoom & Pan tools */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleZoom(-0.5)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Alejar"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="font-mono text-xs text-slate-300 w-12 text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => handleZoom(0.5)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Acercar"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors ml-1"
              title="Restablecer posición y zoom"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ELA sensitivity slider (if ELA active) */}
        {filterMode === 'ela' && (
          <div className="flex items-center justify-between bg-rose-950/40 border-b border-rose-900/60 px-5 py-2 text-xs text-rose-200">
            <span className="flex items-center gap-1.5 font-bold">
              <Info className="h-3.5 w-3.5 text-rose-400" />
              Sensibilidad ELA (Multiplicador de Diferencia):
            </span>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min="5"
                max="40"
                value={elaMultiplier}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setElaMultiplier(val);
                  applyFilter('ela', val);
                }}
                className="w-32 accent-rose-500 cursor-pointer"
              />
              <span className="font-mono font-bold w-8 text-right">{elaMultiplier}x</span>
            </div>
          </div>
        )}

        {/* Canvas Interactive Viewport */}
        <div
          ref={containerRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className="relative flex-1 overflow-hidden bg-slate-950 flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
        >
          <canvas
            ref={canvasRef}
            style={{
              transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomLevel})`,
              transformOrigin: 'center center',
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
              maxWidth: '90%',
              maxHeight: '80vh',
              objectFit: 'contain',
              imageRendering: zoomLevel > 2 ? 'pixelated' : 'auto',
            }}
            className="shadow-2xl rounded border border-slate-800"
          />

          {/* Hint overlay */}
          <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm border border-slate-800 px-3 py-1.5 rounded-lg text-[11px] text-slate-400 flex items-center gap-2 pointer-events-none">
            <Move className="h-3 w-3 text-slate-400" />
            <span>Haz clic y arrastra para moverte | Usa los controles de zoom para ampliar hasta 800%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
