import React, { useState } from 'react';
import {
  Share2,
  ExternalLink,
  Copy,
  Check,
  Search,
  Globe,
  Sparkles,
  Layers,
  HelpCircle,
  Hash,
  MessageSquare,
  Users,
  Loader2,
  Radio,
  FileText,
  AlertCircle,
  Eye,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface SocialOsintTrackerProps {
  imageSrc?: string | null;
  suggestedTerms?: string[];
  locationName?: string;
}

interface SocialSourceMatch {
  title: string;
  uri: string;
  platform: string;
}

interface SocialScanResponse {
  summary: string;
  sources: SocialSourceMatch[];
  searchQueries: string[];
}

export const SocialOsintTracker: React.FC<SocialOsintTrackerProps> = ({
  imageSrc,
  suggestedTerms = [],
  locationName = '',
}) => {
  const [searchTerm, setSearchTerm] = useState(() => {
    return suggestedTerms[0] || locationName || '';
  });
  const [copiedImage, setCopiedImage] = useState(false);

  // In-app live scan state
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<SocialScanResponse | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [platformFilter, setPlatformFilter] = useState<string>('all');

  // Update search term when suggested terms change
  React.useEffect(() => {
    if (suggestedTerms.length > 0 && !searchTerm) {
      setSearchTerm(suggestedTerms[0]);
    } else if (locationName && !searchTerm) {
      setSearchTerm(locationName);
    }
  }, [suggestedTerms, locationName]);

  const copyImageToClipboard = async () => {
    if (!imageSrc) return;
    try {
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      let clipboardBlob = blob;
      if (blob.type !== 'image/png') {
        const img = new Image();
        img.src = imageSrc;
        await new Promise((res) => (img.onload = res));
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0);
        clipboardBlob = await new Promise<Blob>((res) =>
          canvas.toBlob((b) => res(b || blob), 'image/png'),
        );
      }

      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': clipboardBlob }),
      ]);
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2500);
    } catch (err) {
      console.warn('Error copiando imagen al portapapeles:', err);
      navigator.clipboard.writeText(imageSrc);
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2500);
    }
  };

  const handleRunInAppScan = async () => {
    setIsScanning(true);
    setScanError(null);

    try {
      const response = await fetch('/api/social-search-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageSrc || undefined,
          query: searchTerm || locationName || '',
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Error del servidor (${response.status})`);
      }

      const data = (await response.json()) as SocialScanResponse;
      setScanResult(data);
    } catch (err: any) {
      console.error('Error escaneando redes sociales:', err);
      setScanError(err.message || 'No se pudo completar el rastreo en redes sociales.');
    } finally {
      setIsScanning(false);
    }
  };

  const openSearch = (platform: 'instagram' | 'twitter' | 'facebook' | 'tiktok' | 'reddit' | 'linkedin') => {
    const query = searchTerm.trim();
    if (!query) return;

    let dork = '';
    switch (platform) {
      case 'instagram':
        dork = `site:instagram.com "${query}"`;
        break;
      case 'twitter':
        dork = `(site:twitter.com OR site:x.com) "${query}"`;
        break;
      case 'facebook':
        dork = `site:facebook.com "${query}"`;
        break;
      case 'tiktok':
        dork = `site:tiktok.com "${query}"`;
        break;
      case 'reddit':
        dork = `(site:reddit.com/r/whereisthis OR site:reddit.com/r/geoguessr OR site:reddit.com) "${query}"`;
        break;
      case 'linkedin':
        dork = `site:linkedin.com "${query}"`;
        break;
    }

    window.open(`https://www.google.com/search?q=${encodeURIComponent(dork)}`, '_blank');
  };

  const engines = [
    {
      name: 'Yandex Images',
      desc: 'El motor más potente en OSINT para fotos de redes sociales, personas y sitios web rusos/europeos/asiáticos.',
      color: 'border-rose-500/40 bg-rose-950/20 text-rose-300 hover:bg-rose-950/40',
      badge: 'Top 1 OSINT',
      url: 'https://yandex.com/images/search?rpt=imageview',
    },
    {
      name: 'Google Lens / Images',
      desc: 'Compara contra miles de millones de fotos indexadas en redes, blogs y Google Maps.',
      color: 'border-blue-500/40 bg-blue-950/20 text-blue-300 hover:bg-blue-950/40',
      badge: 'Google Multi-Red',
      url: 'https://images.google.com/',
    },
    {
      name: 'TinEye Reverse Search',
      desc: 'Especialista en rastrear la fecha y enlace más antiguo donde se publicó por primera vez.',
      color: 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300 hover:bg-cyan-950/40',
      badge: 'Primer Origen',
      url: 'https://tineye.com/',
    },
    {
      name: 'Bing Visual Search',
      desc: 'Muy eficaz para publicaciones de Pinterest, Instagram y perfiles profesionales.',
      color: 'border-amber-500/40 bg-amber-950/20 text-amber-300 hover:bg-amber-950/40',
      badge: 'Indexación Bing',
      url: 'https://www.bing.com/visualsearch',
    },
  ];

  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case 'Instagram':
        return {
          bg: 'bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-amber-500/20 text-pink-300 border-pink-500/40',
          label: 'Instagram',
        };
      case 'X / Twitter':
        return {
          bg: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
          label: 'X / Twitter',
        };
      case 'Reddit':
        return {
          bg: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
          label: 'Reddit',
        };
      case 'TikTok':
        return {
          bg: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
          label: 'TikTok',
        };
      case 'Facebook':
        return {
          bg: 'bg-blue-600/20 text-blue-300 border-blue-500/40',
          label: 'Facebook',
        };
      case 'YouTube':
        return {
          bg: 'bg-red-500/20 text-red-300 border-red-500/40',
          label: 'YouTube',
        };
      case 'Pinterest':
        return {
          bg: 'bg-rose-600/20 text-rose-300 border-rose-500/40',
          label: 'Pinterest',
        };
      case 'Flickr':
        return {
          bg: 'bg-fuchsia-600/20 text-fuchsia-300 border-fuchsia-500/40',
          label: 'Flickr',
        };
      case 'Wikipedia':
        return {
          bg: 'bg-slate-700/40 text-slate-200 border-slate-600',
          label: 'Wikipedia',
        };
      default:
        return {
          bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          label: 'Web / Blog',
        };
    }
  };

  const platformsAvailable = scanResult
    ? Array.from(new Set(scanResult.sources.map((s) => s.platform)))
    : [];

  const filteredSources = scanResult
    ? platformFilter === 'all'
      ? scanResult.sources
      : scanResult.sources.filter((s) => s.platform === platformFilter)
    : [];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-sm sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-950/80 text-purple-400 border border-purple-800/60">
            <Share2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                Rastreador de Redes Sociales (RRSS) & Búsqueda Inversa
              </h3>
              <span className="rounded bg-purple-950 px-2 py-0.5 text-[10px] font-mono text-purple-300 border border-purple-800">
                OSINT Social en Vivo
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Rastrea si esta imagen, monumento o evento ha sido compartido en Instagram, Twitter/X, Reddit, TikTok, Facebook o blogs
            </p>
          </div>
        </div>

        {/* Copy Image Button for pasting into external engines */}
        {imageSrc && (
          <button
            type="button"
            onClick={copyImageToClipboard}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-emerald-500/50 hover:bg-slate-800 hover:text-emerald-300 transition-all shadow-sm"
            title="Copia la imagen para pegarla directamente (Ctrl+V) en Yandex o Google Lens"
          >
            {copiedImage ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400">¡Imagen Copiada!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-emerald-400" />
                <span>Copiar imagen para pegar (Ctrl+V)</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* SECCIÓN 1: ESCANEO EN VIVO DENTRO DE LA APLICACIÓN */}
      <div className="rounded-xl border border-purple-800/50 bg-purple-950/20 p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-purple-400 animate-pulse" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-purple-200">
              Escaneo en Vivo en la Aplicación (Google Grounding en Redes Sociales)
            </h4>
          </div>

          <button
            type="button"
            disabled={isScanning}
            onClick={handleRunInAppScan}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-purple-950/50 hover:from-purple-500 hover:to-indigo-500 transition-all disabled:opacity-50"
          >
            {isScanning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Rastreando Redes Sociales en vivo...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-purple-200" />
                <span>Rastrear Coincidencias en RRSS Ahora</span>
              </>
            )}
          </button>
        </div>

        <p className="text-xs text-slate-300">
          Consulta en tiempo real la base de datos indexada de Google, Instagram, X/Twitter, Reddit, TikTok y Flickr para mostrar las publicaciones directas y menciones encontradas en esta pantalla.
        </p>

        {/* Error notification */}
        {scanError && (
          <div className="flex items-center gap-2 rounded-lg border border-rose-800/60 bg-rose-950/30 p-3 text-xs text-rose-300">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{scanError}</span>
          </div>
        )}

        {/* Scan Results Display */}
        {scanResult && (
          <div className="space-y-4 pt-3 border-t border-purple-900/40">
            {/* Search Queries badge list */}
            {scanResult.searchQueries.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-semibold text-slate-400">Consultas ejecutadas:</span>
                {scanResult.searchQueries.map((q, idx) => (
                  <span
                    key={idx}
                    className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-mono text-purple-300 border border-slate-800"
                  >
                    "{q}"
                  </span>
                ))}
              </div>
            )}

            {/* OSINT Synthesis Report */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                <FileText className="h-3.5 w-3.5 text-purple-400" />
                <span>Informe de Presencia en Redes Sociales</span>
              </div>
              <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {scanResult.summary}
              </div>
            </div>

            {/* Filter buttons by platform */}
            {platformsAvailable.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Filter className="h-3 w-3" /> Filtrar por red:
                </span>
                <button
                  type="button"
                  onClick={() => setPlatformFilter('all')}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all border ${
                    platformFilter === 'all'
                      ? 'bg-purple-600 text-white border-purple-500'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  Todas ({scanResult.sources.length})
                </button>
                {platformsAvailable.map((plat) => {
                  const count = scanResult.sources.filter((s) => s.platform === plat).length;
                  return (
                    <button
                      key={plat}
                      type="button"
                      onClick={() => setPlatformFilter(plat)}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-all border ${
                        platformFilter === plat
                          ? 'bg-purple-600 text-white border-purple-500'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      {plat} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            {/* Matches list cards */}
            {filteredSources.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredSources.map((source, idx) => {
                  const badge = getPlatformBadge(source.platform);
                  return (
                    <div
                      key={idx}
                      className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 flex flex-col justify-between hover:border-purple-500/40 transition-all group"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border ${badge.bg}`}
                          >
                            {badge.label}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Coincidencia #{idx + 1}
                          </span>
                        </div>
                        <h5 className="text-xs font-semibold text-slate-200 line-clamp-2 mb-1 group-hover:text-purple-300 transition-colors">
                          {source.title}
                        </h5>
                      </div>

                      <div className="mt-3 pt-2 border-t border-slate-900 flex items-center justify-between">
                        <span className="text-[10px] text-slate-500 truncate max-w-[200px]">
                          {source.platform}
                        </span>
                        <a
                          href={source.uri}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-purple-400 hover:text-purple-300 underline underline-offset-2"
                        >
                          <span>Abrir publicación</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 text-center text-xs text-slate-400">
                No se encontraron publicaciones públicas idénticas indexadas para este filtro.
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECCIÓN 2: Dorks automáticos para redes sociales */}
      <div className="border-t border-slate-800 pt-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2 flex items-center gap-2">
          <Hash className="h-3.5 w-3.5 text-purple-400" />
          Búsqueda Manual con Dorks en Redes Sociales
        </h4>
        <p className="text-xs text-slate-400 mb-3">
          Filtra directamente en cada plataforma usando un término, nombre de local, calle o usuario:
        </p>

        <div className="flex flex-wrap items-center gap-2 mb-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Ej: nombre de bar, evento, calle, @usuario o hashtag..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Platform Dork Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          <button
            type="button"
            disabled={!searchTerm.trim()}
            onClick={() => openSearch('instagram')}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-pink-500/40 bg-pink-950/20 px-3 py-2 text-xs font-semibold text-pink-300 hover:bg-pink-900/30 transition-all disabled:opacity-40"
          >
            <span>Instagram</span>
            <ExternalLink className="h-3 w-3 opacity-70" />
          </button>

          <button
            type="button"
            disabled={!searchTerm.trim()}
            onClick={() => openSearch('twitter')}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-950/20 px-3 py-2 text-xs font-semibold text-sky-300 hover:bg-sky-900/30 transition-all disabled:opacity-40"
          >
            <span>X / Twitter</span>
            <ExternalLink className="h-3 w-3 opacity-70" />
          </button>

          <button
            type="button"
            disabled={!searchTerm.trim()}
            onClick={() => openSearch('facebook')}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-500/40 bg-blue-950/20 px-3 py-2 text-xs font-semibold text-blue-300 hover:bg-blue-900/30 transition-all disabled:opacity-40"
          >
            <span>Facebook</span>
            <ExternalLink className="h-3 w-3 opacity-70" />
          </button>

          <button
            type="button"
            disabled={!searchTerm.trim()}
            onClick={() => openSearch('tiktok')}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-teal-500/40 bg-teal-950/20 px-3 py-2 text-xs font-semibold text-teal-300 hover:bg-teal-900/30 transition-all disabled:opacity-40"
          >
            <span>TikTok</span>
            <ExternalLink className="h-3 w-3 opacity-70" />
          </button>

          <button
            type="button"
            disabled={!searchTerm.trim()}
            onClick={() => openSearch('reddit')}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-orange-500/40 bg-orange-950/20 px-3 py-2 text-xs font-semibold text-orange-300 hover:bg-orange-900/30 transition-all disabled:opacity-40"
            title="Buscar en comunidades OSINT de Reddit como r/whereisthis"
          >
            <span>Reddit</span>
            <ExternalLink className="h-3 w-3 opacity-70" />
          </button>

          <button
            type="button"
            disabled={!searchTerm.trim()}
            onClick={() => openSearch('linkedin')}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-indigo-500/40 bg-indigo-950/20 px-3 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-900/30 transition-all disabled:opacity-40"
          >
            <span>LinkedIn</span>
            <ExternalLink className="h-3 w-3 opacity-70" />
          </button>
        </div>

        {/* Suggestion tags if any */}
        {suggestedTerms.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Pistas detectadas:</span>
            {suggestedTerms.map((term, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setSearchTerm(term)}
                className="rounded-md bg-slate-800/80 px-2 py-0.5 text-[10px] font-mono text-purple-300 hover:bg-purple-900/40 hover:text-white border border-slate-700 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* SECCIÓN 3: Motores de Búsqueda Visual Especializados */}
      <div className="border-t border-slate-800 pt-4">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3 flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          Motores de Búsqueda Inversa para RRSS
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {engines.map((eng, idx) => (
            <a
              key={idx}
              href={eng.url}
              target="_blank"
              rel="noreferrer"
              className={`rounded-xl border p-3 flex flex-col justify-between transition-all group shadow-sm ${eng.color}`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold">{eng.name}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-black/40 border border-white/10 uppercase">
                    {eng.badge}
                  </span>
                </div>
                <p className="text-[11px] opacity-80 leading-relaxed">
                  {eng.desc}
                </p>
              </div>
              <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold underline underline-offset-2 opacity-90 group-hover:opacity-100">
                <span>Abrir y pegar imagen</span>
                <ExternalLink className="h-2.5 w-2.5" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};
