import React, { useState } from 'react';
import {
  Compass,
  Search,
  Eye,
  Globe2,
  ExternalLink,
  MapPin,
  Camera,
  Layers,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import { getGoogleMapsUrl, getGoogleStreetViewUrl } from '../utils/geoUtils';

interface StreetViewToolsProps {
  currentLat?: number;
  currentLng?: number;
  searchQueryHint?: string;
  onSelectCoordinates?: (lat: number, lng: number, address: string) => void;
}

export const StreetViewTools: React.FC<StreetViewToolsProps> = ({
  currentLat,
  currentLng,
  searchQueryHint = '',
  onSelectCoordinates,
}) => {
  const [query, setQuery] = useState(searchQueryHint);
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);
  const [hasSearched, setHasSearched] = useState(false);

  // Update query when hint changes
  React.useEffect(() => {
    if (searchQueryHint) {
      setQuery(searchQueryHint);
    }
  }, [searchQueryHint]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/search-location?q=${encodeURIComponent(query.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error('Error buscando ubicación:', err);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePickResult = (r: { display_name: string; lat: string; lon: string }) => {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    if (!isNaN(lat) && !isNaN(lng) && onSelectCoordinates) {
      onSelectCoordinates(lat, lng, r.display_name);
    }
  };

  const openGoogleLens = () => {
    window.open('https://images.google.com/', '_blank');
  };

  const openGoogleMapsSearch = (term: string) => {
    window.open(`https://www.google.com/maps/search/${encodeURIComponent(term)}`, '_blank');
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-sm sm:p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-950/80 text-amber-400 border border-amber-800/60">
            <Eye className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Búsqueda y Verificación en Google Maps & Street View
            </h3>
            <p className="text-xs text-slate-400">
              Ideal para fotos sin GPS: contrasta carteles, comercios o vistas 360° en Street View
            </p>
          </div>
        </div>

        {/* Google Lens action */}
        <button
          type="button"
          onClick={openGoogleLens}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-emerald-500/50 hover:bg-slate-800 hover:text-emerald-300 transition-all shadow-sm"
          title="Buscar coincidencia visual directa en Google Imágenes / Google Lens"
        >
          <Camera className="h-3.5 w-3.5 text-emerald-400" />
          <span>Buscar con Google Lens</span>
          <ExternalLink className="h-3 w-3 opacity-70" />
        </button>
      </div>

      {/* Street View Query Input */}
      <div>
        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Escribe un cartel, comercio, calle, carretera o pueblo que veas en la foto..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSearching || !query.trim()}
            className="flex items-center gap-1.5 rounded-xl bg-slate-800 border border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors disabled:opacity-40"
          >
            <Search className="h-3.5 w-3.5" />
            <span>{isSearching ? 'Buscando...' : 'Localizar'}</span>
          </button>

          <button
            type="button"
            onClick={() => openGoogleMapsSearch(query || 'sitio de interés')}
            className="flex items-center gap-1.5 rounded-xl bg-blue-600/20 border border-blue-500/40 px-3.5 py-2.5 text-xs font-semibold text-blue-300 hover:bg-blue-600/30 transition-colors"
          >
            <Globe2 className="h-3.5 w-3.5" />
            <span>Buscar en Google Maps</span>
            <ExternalLink className="h-3 w-3 opacity-60" />
          </button>
        </form>

        {/* Results List */}
        {hasSearched && (
          <div className="mt-3 space-y-2">
            {results.length > 0 ? (
              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-slate-400">
                  Resultados encontrados (haz clic para fijar en el mapa y ver en Street View):
                </span>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  {results.map((r, i) => (
                    <div
                      key={i}
                      onClick={() => handlePickResult(r)}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800 bg-slate-950/70 hover:border-emerald-500/50 hover:bg-slate-950 cursor-pointer transition-all text-xs"
                    >
                      <div className="flex items-center gap-2 truncate pr-2">
                        <MapPin className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate text-slate-200">{r.display_name}</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="font-mono text-[10px] text-slate-400">
                          {parseFloat(r.lat).toFixed(4)}, {parseFloat(r.lon).toFixed(4)}
                        </span>
                        <a
                          href={getGoogleStreetViewUrl(parseFloat(r.lat), parseFloat(r.lon))}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 rounded bg-amber-500/20 border border-amber-500/40 px-2 py-0.5 text-[10px] text-amber-300 hover:bg-amber-500/30"
                          title="Abrir Street View en esta coordenada"
                        >
                          <Eye className="h-3 w-3" />
                          <span>Street View</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                No se encontraron resultados directos para "{query}". Prueba buscando en Google Maps con el botón azul.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Active Point Street View Direct Launchers */}
      {typeof currentLat === 'number' && typeof currentLng === 'number' && (
        <div className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-300">
              Coordenadas actuales fijadas:{' '}
              <strong className="font-mono text-slate-100">
                {currentLat.toFixed(5)}, {currentLng.toFixed(5)}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={getGoogleStreetViewUrl(currentLat, currentLng)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Abrir Street View 360°</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>

            <a
              href={getGoogleMapsUrl(currentLat, currentLng)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-blue-600/20 border border-blue-500/40 px-3 py-1.5 text-xs font-semibold text-blue-300 hover:bg-blue-600/30 transition-colors"
            >
              <Globe2 className="h-3.5 w-3.5" />
              <span>Abrir en Google Maps</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};
