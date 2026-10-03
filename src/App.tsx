import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { ImageUploader } from './components/ImageUploader';
import { InteractiveMap } from './components/InteractiveMap';
import { OsintReport } from './components/OsintReport';
import { ExifInspector } from './components/ExifInspector';
import { StreetViewTools } from './components/StreetViewTools';
import { SocialOsintTracker } from './components/SocialOsintTracker';
import { AnalysisLoading } from './components/AnalysisLoading';
import { GithubDeployModal } from './components/GithubDeployModal';
import { SamplesModal } from './components/SamplesModal';
import { HistoryModal } from './components/HistoryModal';
import { QuickHistoryBar } from './components/QuickHistoryBar';
import { GoogleMapsGroundingVerifier } from './components/GoogleMapsGroundingVerifier';
import { AstronomicalSunCalculator } from './components/AstronomicalSunCalculator';
import { ReverseImageSearchShortcuts } from './components/ReverseImageSearchShortcuts';
import { GeolocationAnalysisResult, ExifMetadata, SampleImage, HistoryItem } from './types';
import { parseExifData } from './utils/exifParser';
import { computeImageSha256 } from './utils/cryptoHash';
import {
  getLocalHistory,
  addAnalysisToHistory,
  deleteHistoryItem,
  clearAllHistory,
} from './utils/historyStorage';
import { DEFAULT_SITE_CONFIG } from './config/siteConfig';
import {
  AlertCircle,
  Compass,
  Globe,
  ExternalLink,
  ShieldCheck,
  Terminal,
  Eye,
  Share2,
  HelpCircle,
  MapPin,
  Sun,
  Camera,
} from 'lucide-react';

export default function App() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [exif, setExif] = useState<ExifMetadata | null>(null);
  const [sha256Hash, setSha256Hash] = useState<string | null>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<GeolocationAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isGithubModalOpen, setIsGithubModalOpen] = useState(false);
  const [isSamplesModalOpen, setIsSamplesModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  // Persistent localStorage history state
  const [history, setHistory] = useState<HistoryItem[]>(() => getLocalHistory());
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  // Tab switcher for external investigative tools (Street View vs Maps Grounding vs SunCalc vs Reverse Search vs RRSS)
  const [activeToolTab, setActiveToolTab] = useState<
    'streetview' | 'maps_grounding' | 'suncalc' | 'reverse_search' | 'social'
  >('streetview');

  const websiteUrl = DEFAULT_SITE_CONFIG.websiteUrl;

  // Handle image selected from file input or drag-drop
  const handleImageSelected = async (dataUrl: string, file?: File) => {
    setImageSrc(dataUrl);
    setImageFile(file || null);
    setResult(null);
    setError(null);
    setSelectedHistoryId(null);

    // Compute cryptographic SHA-256 for chain of custody
    computeImageSha256(file || dataUrl).then(setSha256Hash);

    // Extract EXIF metadata
    try {
      if (file) {
        const metadata = await parseExifData(file);
        setExif(metadata);
      } else {
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        const metadata = await parseExifData(blob);
        setExif(metadata);
      }
    } catch (err) {
      console.warn('Error extrayendo EXIF:', err);
      setExif({ hasGps: false });
    }
  };

  // Convert remote sample URL to dataURL and select it
  const handleSelectSample = async (sample: SampleImage) => {
    try {
      setError(null);
      setResult(null);
      setSelectedHistoryId(null);
      const response = await fetch(sample.url);
      const blob = await response.blob();
      const fakeFile = new File([blob], `${sample.id}.jpg`, { type: blob.type || 'image/jpeg' });

      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;
        await handleImageSelected(dataUrl, fakeFile);
      };
      reader.readAsDataURL(blob);
    } catch (err: any) {
      console.error('Error cargando muestra:', err);
      setError('No se pudo cargar la imagen de muestra. Revisa tu conexión a internet.');
    }
  };

  // Trigger Geolocation analysis via server API
  const handleAnalyze = async () => {
    if (!imageSrc) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const response = await fetch('/api/geolocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageSrc,
          mimeType: imageFile?.type || 'image/jpeg',
          clientExif: exif?.hasGps
            ? {
                latitude: exif.latitude,
                longitude: exif.longitude,
                altitude: exif.altitude,
                camera: `${exif.make || ''} ${exif.model || ''}`.trim(),
                dateTime: exif.dateTime,
              }
            : null,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Error del servidor (${response.status})`);
      }

      const analysisData = (await response.json()) as GeolocationAnalysisResult;
      setResult(analysisData);

      // Save into persistent local history (last 5 items)
      try {
        const updatedHistory = await addAnalysisToHistory(imageSrc, analysisData, exif);
        setHistory(updatedHistory);
        setSelectedHistoryId(updatedHistory[0]?.id || null);
      } catch (histErr) {
        console.warn('Aviso: no se pudo guardar en el historial local:', histErr);
      }

      // Scroll smoothly to results
      setTimeout(() => {
        const resultsEl = document.getElementById('geolocation-results');
        if (resultsEl) {
          resultsEl.scrollIntoView({ behavior: 'smooth' });
        }
      }, 250);
    } catch (err: any) {
      console.error('Error en análisis:', err);
      setError(err.message || 'Ocurrió un error inesperado al triangular la ubicación.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Select an item from the history to restore its state
  const handleSelectHistoryItem = (item: HistoryItem) => {
    setImageSrc(item.imageSrc);
    setImageFile(null);
    setExif(item.exif);
    setResult(item.result);
    setSelectedHistoryId(item.id);
    setError(null);

    setTimeout(() => {
      const resultsEl = document.getElementById('geolocation-results');
      if (resultsEl) {
        resultsEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 200);
  };

  const handleDeleteHistoryItem = (id: string) => {
    const updated = deleteHistoryItem(id);
    setHistory(updated);
    if (selectedHistoryId === id) {
      setSelectedHistoryId(null);
    }
  };

  const handleClearHistory = () => {
    clearAllHistory();
    setHistory([]);
    setSelectedHistoryId(null);
  };

  const handleClear = () => {
    setImageSrc(null);
    setImageFile(null);
    setExif(null);
    setResult(null);
    setError(null);
    setSelectedHistoryId(null);
  };

  const handleManualCoordinateSelected = (lat: number, lng: number, address: string) => {
    if (result) {
      setResult({
        ...result,
        latitude: lat,
        longitude: lng,
        approximateAddress: address,
        confidenceRadiusKm: 0.5,
        confidencePercent: 95,
        confidenceLevel: 'HIGH',
      });
    } else {
      setResult({
        country: 'Ubicación Manual',
        countryCode: 'GEO',
        region: '',
        city: address.split(',')[0] || 'Lugar seleccionado',
        approximateAddress: address,
        latitude: lat,
        longitude: lng,
        confidenceRadiusKm: 0.5,
        confidencePercent: 95,
        confidenceLevel: 'HIGH',
        visualClues: [
          {
            category: 'streetview',
            title: 'Ubicación seleccionada en Street View / Maps',
            observation: `Punto localizado manualmente: ${address}`,
            deduction: 'Coordenadas WGS84 fijadas para inspección en Google Street View.',
            impact: 'critical',
          },
        ],
        overallExplanation: `Ubicación localizada a través de la búsqueda de Google Street View y OpenStreetMap para: ${address}`,
        googleMapsSearchQuery: address,
      });
    }

    setTimeout(() => {
      document.getElementById('geolocation-results')?.scrollIntoView({ behavior: 'smooth' });
    }, 200);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Navigation bar with authentic logo & website links */}
      <Navbar
        onOpenGithubModal={() => setIsGithubModalOpen(true)}
        onOpenSamplesModal={() => setIsSamplesModalOpen(true)}
        onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
        historyCount={history.length}
        hasResult={Boolean(result)}
        onReset={handleClear}
        websiteUrl={websiteUrl}
      />

      {/* Main content body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 sm:px-6 space-y-6">
        {/* Quick History Bar for recently analyzed photos (Last 5) */}
        <QuickHistoryBar
          history={history}
          currentSelectedId={selectedHistoryId}
          onSelectHistoryItem={handleSelectHistoryItem}
          onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
        />

        {/* Error notification banner */}
        {error && (
          <div className="rounded-xl border border-rose-800/60 bg-rose-950/40 p-4 text-rose-200 flex items-start gap-3 shadow-lg">
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <strong className="font-bold">Error en la triangulación:</strong> {error}
            </div>
            <button
              onClick={() => setError(null)}
              className="text-xs text-rose-400 hover:text-white underline"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Top Hero / Intro bar when no photo loaded */}
        {!imageSrc && !result && (
          <div className="rounded-2xl border border-slate-800 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-emerald-950/25 p-6 sm:p-8 backdrop-blur-md relative overflow-hidden">
            {/* Background Watermark Logo */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-15 hidden md:block pointer-events-none">
              <img src="/icono.png" alt="Watermark" className="h-56 w-56 object-contain" />
            </div>

            <div className="max-w-3xl relative z-10">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/40 hover:bg-slate-800 transition-colors shadow-sm"
                >
                  <img src="/icono.png" alt="Logo" className="h-4 w-4 object-contain" />
                  <span>UN FANTASMA EN EL SISTEMA</span>
                  <ExternalLink className="h-2.5 w-2.5 opacity-70" />
                </a>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/80 px-2.5 py-1 text-xs font-mono text-slate-300 border border-slate-800">
                  <Compass className="h-3 w-3 text-cyan-400" />
                  GEOINT & OSINT FORENSE
                </span>
              </div>

              <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                Ubica cualquier fotografía con{' '}
                <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                  Metadatos, Google Maps y Redes Sociales
                </span>
              </h1>
              <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
                Herramienta de geolocalización e investigación OSINT creada por <strong>Un Fantasma en el Sistema</strong>.
                Descargable desde GitHub para <strong>Windows y Linux</strong> (igual que NetPhantom CTF).
                ¿La foto no tiene metadatos EXIF? La IA deduce la ubicación analizando el entorno visual, mientras que los módulos de <strong>Google Street View 360°</strong> y <strong>Rastreo en Redes Sociales (RRSS)</strong> te permiten localizar dónde fue publicada originalmente en Instagram, Twitter/X, TikTok o foros.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300 underline underline-offset-4"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Visitar www.unfantasmaenelsistema.com
                  <ExternalLink className="h-3 w-3 opacity-70" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Upper Zone: Image Upload & Forensic Filters */}
        <section className="space-y-3">
          <ImageUploader
            imageSrc={imageSrc}
            imageFile={imageFile}
            exif={exif}
            onImageSelected={handleImageSelected}
            onClear={handleClear}
            onAnalyze={handleAnalyze}
            isAnalyzing={isAnalyzing}
            onOpenSamples={() => setIsSamplesModalOpen(true)}
          />

          {/* Cryptographic Chain of Custody Badge (SHA-256) */}
          {sha256Hash && imageSrc && (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-2.5 text-xs shadow-md">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                <span className="font-bold text-slate-200 shrink-0">Cadena de Custodia (SHA-256):</span>
                <code className="font-mono text-[11px] text-slate-400 truncate selection:bg-emerald-900 selection:text-white">
                  {sha256Hash}
                </code>
              </div>
              <span className="rounded bg-emerald-950/80 px-2 py-0.5 text-[9px] font-mono font-bold text-emerald-300 border border-emerald-800 shrink-0">
                INTEGRIDAD FORENSE INMUTABLE
              </span>
            </div>
          )}
        </section>

        {/* Loading Scanning Radar State */}
        {isAnalyzing && (
          <section className="animate-in fade-in duration-300">
            <AnalysisLoading />
          </section>
        )}

        {/* External Investigative Tools: 5 Multi-Source OSINT Tabs */}
        {imageSrc && (
          <section className="space-y-3">
            {/* Tool Selector Tabs */}
            <div className="flex flex-wrap border-b border-slate-800 bg-slate-900/50 p-1.5 rounded-xl gap-2">
              <button
                type="button"
                onClick={() => setActiveToolTab('streetview')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeToolTab === 'streetview'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="h-4 w-4" />
                <span>Street View 360°</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveToolTab('maps_grounding')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeToolTab === 'maps_grounding'
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MapPin className="h-4 w-4 text-blue-400" />
                <span>Google Maps Data Live</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveToolTab('suncalc')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeToolTab === 'suncalc'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sun className="h-4 w-4 text-amber-400" />
                <span>Efemérides Solares (SunCalc)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveToolTab('reverse_search')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeToolTab === 'reverse_search'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Camera className="h-4 w-4 text-indigo-400" />
                <span>Búsqueda Inversa OSINT</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveToolTab('social')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeToolTab === 'social'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Share2 className="h-4 w-4 text-purple-400" />
                <span>Rastreo RRSS</span>
              </button>
            </div>

            {/* Active Tool Content */}
            {activeToolTab === 'streetview' && (
              <StreetViewTools
                currentLat={result?.latitude}
                currentLng={result?.longitude}
                searchQueryHint={result?.googleMapsSearchQuery || ''}
                onSelectCoordinates={handleManualCoordinateSelected}
              />
            )}

            {activeToolTab === 'maps_grounding' && (
              <GoogleMapsGroundingVerifier
                initialQuery={result?.googleMapsSearchQuery || ''}
                locationName={`${result?.city || ''} ${result?.country || ''}`.trim()}
                latitude={result?.latitude}
                longitude={result?.longitude}
              />
            )}

            {activeToolTab === 'suncalc' && (
              <AstronomicalSunCalculator
                latitude={result?.latitude || exif?.latitude || 40.4168}
                longitude={result?.longitude || exif?.longitude || -3.7038}
                aiEstimatedAngle={result?.chronoTimeline?.shadowAngleDegrees}
                aiEstimatedTime={result?.chronoTimeline?.estimatedTimeWindow}
              />
            )}

            {activeToolTab === 'reverse_search' && (
              <ReverseImageSearchShortcuts
                imageSrc={imageSrc}
                searchTerms={result?.socialMediaSearchTerms}
                locationHint={result?.googleMapsSearchQuery}
              />
            )}

            {activeToolTab === 'social' && (
              <SocialOsintTracker
                imageSrc={imageSrc}
                suggestedTerms={result?.socialMediaSearchTerms || []}
                locationName={`${result?.city || ''} ${result?.country || ''}`.trim()}
              />
            )}
          </section>
        )}

        {/* Results Section (Interactive Map & OSINT Dossier) */}
        {result && (
          <section id="geolocation-results" className="space-y-6 animate-in fade-in duration-500">
            {/* Interactive Leaflet Map */}
            <InteractiveMap result={result} exif={exif} />

            {/* Structured OSINT Report & Visual Clues */}
            <OsintReport
              result={result}
              imageSrc={imageSrc}
              exif={exif}
              sha256Hash={sha256Hash || undefined}
            />
          </section>
        )}

        {/* Technical EXIF Drawer */}
        {exif && <ExifInspector exif={exif} />}
      </main>

      {/* Footer with Un Fantasma en el Sistema branding and website links */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/95 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <a
              href={websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 p-1 hover:border-emerald-500/50 transition-colors"
            >
              <img src="/icono.png" alt="Logo" className="h-7 w-7 object-contain" />
            </a>
            <div>
              <a
                href={websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="font-bold text-slate-200 hover:text-emerald-400 transition-colors flex items-center gap-1"
              >
                Un Fantasma en el Sistema
                <ExternalLink className="h-3 w-3 opacity-60" />
              </a>
              <p className="text-[11px] text-slate-500">
                Divulgación y herramientas de ciberseguridad, hacking ético y OSINT
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <a
              href={websiteUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
            >
              <Globe className="h-3.5 w-3.5" />
              <span>unfantasmaenelsistema.com</span>
            </a>
            <span className="text-slate-700">|</span>
            <button
              onClick={() => setIsGithubModalOpen(true)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              Lanzador Windows & Linux
            </button>
            <span className="text-slate-700">|</span>
            <button
              onClick={() => setIsSamplesModalOpen(true)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              Casos de Muestra
            </button>
          </div>
        </div>
      </footer>

      {/* GitHub Deployment Guide Modal */}
      <GithubDeployModal
        isOpen={isGithubModalOpen}
        onClose={() => setIsGithubModalOpen(false)}
      />

      {/* Samples Gallery Modal */}
      <SamplesModal
        isOpen={isSamplesModalOpen}
        onClose={() => setIsSamplesModalOpen(false)}
        onSelectSample={handleSelectSample}
      />

      {/* Persistent Local History Modal */}
      <HistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        history={history}
        onSelectHistoryItem={handleSelectHistoryItem}
        onDeleteItem={handleDeleteHistoryItem}
        onClearAll={handleClearHistory}
      />
    </div>
  );
}
