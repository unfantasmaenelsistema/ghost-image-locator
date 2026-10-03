import React, { useState } from 'react';
import {
  MapPin,
  Search,
  ExternalLink,
  ShieldCheck,
  Building,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Navigation,
  Globe,
  Compass,
} from 'lucide-react';

interface GoogleMapsPlace {
  title: string;
  uri: string;
  placeId?: string;
}

interface GoogleMapsGroundingVerifierProps {
  initialQuery?: string;
  locationName?: string;
  latitude?: number;
  longitude?: number;
}

export const GoogleMapsGroundingVerifier: React.FC<GoogleMapsGroundingVerifierProps> = ({
  initialQuery = '',
  locationName = '',
  latitude,
  longitude,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialQuery || locationName || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [places, setPlaces] = useState<GoogleMapsPlace[]>([]);

  const handleVerify = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/verify-google-maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery.trim(),
          locationName,
          latitude,
          longitude,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Error del servidor (${response.status})`);
      }

      const data = await response.json();
      setSummary(data.summary || 'Verificación completada.');
      setPlaces(data.places || []);
    } catch (err: any) {
      console.error('Error verificando con Google Maps:', err);
      setError(err.message || 'No se pudo contrastar con la base de datos de Google Maps.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-sm sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-950/80 text-blue-400 border border-blue-800/60 shadow-inner">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">
                Grounding Oficial con Google Maps Data
              </h3>
              <span className="rounded bg-blue-950 px-2 py-0.5 text-[10px] font-mono text-blue-300 border border-blue-800">
                Live Maps DB
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Validación en tiempo real de comercios, monumentos y direcciones postales con la base oficial de Google Maps
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/70 px-2.5 py-1 text-xs text-slate-300">
          <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
          <span>+250M Lugares Verificados</span>
        </div>
      </div>

      {/* Query input and trigger form */}
      <form onSubmit={handleVerify} className="space-y-3">
        <label className="text-xs font-semibold text-slate-300 block">
          Lugar, comercio o punto de interés a contrastar:
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Ej. Puerta de Alcalá Madrid, Café Comercial Glorieta de Bilbao..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-9 pr-4 text-xs text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || !searchQuery.trim()}
            className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 px-5 py-2.5 text-xs font-bold text-white transition-all shadow-md shadow-blue-950 shrink-0"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>Consultando Google Maps...</span>
              </>
            ) : (
              <>
                <MapPin className="h-4 w-4" />
                <span>Validar con Google Maps</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-rose-800/60 bg-rose-950/40 p-3.5 text-xs text-rose-200 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Results display */}
      {summary && (
        <div className="space-y-4 pt-2 animate-in fade-in duration-300">
          {/* Places found via Google Maps Grounding */}
          {places.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-blue-400" />
                Lugares Oficiales Identificados en Google Maps:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {places.map((place, idx) => (
                  <a
                    key={idx}
                    href={place.uri}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between gap-3 rounded-xl border border-blue-900/60 bg-blue-950/20 p-3 hover:border-blue-500/60 hover:bg-blue-950/40 transition-all group"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-100 group-hover:text-blue-300 transition-colors truncate">
                        {place.title}
                      </p>
                      {place.placeId && (
                        <p className="text-[10px] font-mono text-slate-400 truncate mt-0.5">
                          Place ID: {place.placeId}
                        </p>
                      )}
                    </div>
                    <span className="rounded-lg bg-blue-900/40 p-2 text-blue-300 group-hover:bg-blue-600 group-hover:text-white transition-all shrink-0">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Detailed OSINT Verification summary */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Informe de Validación y Auditoría Geográfica</span>
            </div>
            <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-line font-sans">
              {summary}
            </div>
          </div>
        </div>
      )}

      {/* Value-add note */}
      <div className="flex items-start gap-2.5 rounded-xl bg-slate-950/40 border border-slate-800/80 p-3 text-[11px] text-slate-400 leading-relaxed">
        <ShieldCheck className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-200">¿Por qué es fundamental Google Maps Data?</strong>
          <br />
          A diferencia de un modelo LLM estándar que solo infiere direcciones a partir de su memoria estática (lo que puede causar alucinaciones), el <strong>Grounding con Google Maps</strong> consulta la base de datos geográfica viva de Google para validar números de calle, comercios reales, horarios de apertura y Place IDs oficiales.
        </div>
      </div>
    </div>
  );
};
