import React, { useState } from 'react';
import {
  Search,
  ExternalLink,
  Copy,
  Check,
  Globe,
  Camera,
  Layers,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';

interface ReverseImageSearchShortcutsProps {
  imageSrc?: string | null;
  searchTerms?: string[];
  locationHint?: string;
}

export const ReverseImageSearchShortcuts: React.FC<ReverseImageSearchShortcutsProps> = ({
  imageSrc,
  searchTerms = [],
  locationHint = '',
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyImage = async () => {
    if (!imageSrc) return;
    try {
      const res = await fetch(imageSrc);
      const blob = await res.blob();
      // Ensure PNG blob for clipboard
      const pngBlob = blob.type === 'image/png' ? blob : await convertToPngBlob(blob);
      await navigator.clipboard.write([
        new ClipboardItem({
          'image/png': pngBlob,
        }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn('No se pudo copiar la imagen directa al portapapeles:', e);
      // Fallback: copy search term
      if (locationHint || searchTerms[0]) {
        navigator.clipboard.writeText(locationHint || searchTerms[0] || '');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const convertToPngBlob = (blob: Blob): Promise<Blob> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        canvas.toBlob((b) => resolve(b || blob), 'image/png');
      };
      img.src = URL.createObjectURL(blob);
    });
  };

  const searchEngines = [
    {
      name: 'Yandex Images',
      tag: 'El #1 para Arquitectura y Paisajes',
      badge: 'Recomendado GEOINT',
      color: 'border-amber-500/40 bg-amber-950/20 text-amber-300 hover:border-amber-500',
      url: 'https://yandex.com/images/search?rpt=imageview',
      description: 'El motor más potente del mundo identificando fachadas, hitos rurales y carreteras.',
    },
    {
      name: 'Google Lens',
      tag: 'Objetos y Letreros Comerciales',
      badge: 'Google Multimodal',
      color: 'border-blue-500/40 bg-blue-950/20 text-blue-300 hover:border-blue-500',
      url: 'https://lens.google.com/',
      description: 'Especialista en lectura de tipografías, logotipos comerciales y puntos turísticos.',
    },
    {
      name: 'Bing Visual Search',
      tag: 'Reconocimiento de Monumentos',
      badge: 'Microsoft AI',
      color: 'border-teal-500/40 bg-teal-950/20 text-teal-300 hover:border-teal-500',
      url: 'https://www.bing.com/visualsearch',
      description: 'Potente reconocimiento de estructuras arquitectónicas y patrones urbanos.',
    },
    {
      name: 'TinEye Reverse Search',
      tag: 'Fecha y Fuente Original',
      badge: 'Antigüedad Web',
      color: 'border-purple-500/40 bg-purple-950/20 text-purple-300 hover:border-purple-500',
      url: 'https://tineye.com/',
      description: 'Indexa la fecha exacta de publicación original de la imagen en internet.',
    },
  ];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-sm sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-950/80 text-indigo-400 border border-indigo-800/60 shadow-inner">
            <Camera className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">
                Búsqueda Inversa de Imágenes OSINT
              </h3>
              <span className="rounded bg-indigo-950 px-2 py-0.5 text-[10px] font-mono text-indigo-300 border border-indigo-800">
                4 Motores
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Contrasta la fotografía en los motores de reconocimiento visual más avanzados del mundo
            </p>
          </div>
        </div>

        {/* Copy Image Button */}
        {imageSrc && (
          <button
            type="button"
            onClick={handleCopyImage}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700 hover:text-white transition-all shadow-sm"
            title="Copia la imagen para pegarla directamente con Ctrl+V en el buscador"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-bold">¡Copiada al Portapapeles!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-400" />
                <span>Copiar Imagen para Pegar (Ctrl+V)</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Engines Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {searchEngines.map((engine, idx) => (
          <a
            key={idx}
            href={engine.url}
            target="_blank"
            rel="noreferrer"
            className={`rounded-xl border p-3.5 transition-all flex flex-col justify-between gap-2.5 group ${engine.color}`}
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-100 group-hover:text-white transition-colors">
                  {engine.name}
                </span>
                <span className="rounded px-1.5 py-0.5 text-[9px] font-mono border border-current opacity-80">
                  {engine.badge}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {engine.description}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs font-semibold pt-1 border-t border-slate-800/60">
              <span className="text-[11px] text-slate-400 font-normal">{engine.tag}</span>
              <span className="flex items-center gap-1 text-slate-300 group-hover:translate-x-0.5 transition-transform">
                <span>Abrir</span>
                <ExternalLink className="h-3 w-3" />
              </span>
            </div>
          </a>
        ))}
      </div>

      {/* Helpful instruction */}
      <div className="flex items-center gap-2 rounded-xl bg-slate-950/60 border border-slate-800/80 px-3.5 py-2.5 text-xs text-slate-400">
        <Sparkles className="h-4 w-4 text-indigo-400 shrink-0" />
        <span>
          <strong>Consejo Pericial:</strong> Haz clic en <em>"Copiar Imagen"</em>, abre <strong>Yandex</strong> o <strong>Google Lens</strong> y presiona <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-200">Ctrl + V</kbd> para buscarla directamente.
        </span>
      </div>
    </div>
  );
};
