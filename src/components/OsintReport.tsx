import React, { useState } from 'react';
import {
  MapPin,
  ShieldCheck,
  Compass,
  AlertTriangle,
  Trees,
  Building2,
  Signpost,
  SunMedium,
  Car,
  Mountain,
  Share2,
  FileDown,
  Printer,
  ChevronRight,
  Sparkles,
  Eye,
  ExternalLink,
  FileText,
  Loader2,
  Globe,
} from 'lucide-react';
import { GeolocationAnalysisResult, VisualClue, ExifMetadata } from '../types';
import { generateOsintPdfReport } from '../utils/pdfReportGenerator';
import { exportToKml, exportToGeoJson } from '../utils/gisExporter';
import { ChronolocationCard } from './ChronolocationCard';
import { ChronoTimelineVisualizer } from './ChronoTimelineVisualizer';
import { ImageForensicsModal } from './ImageForensicsModal';

interface OsintReportProps {
  result: GeolocationAnalysisResult;
  imageSrc?: string | null;
  exif?: ExifMetadata | null;
  sha256Hash?: string;
}

export const OsintReport: React.FC<OsintReportProps> = ({ result, imageSrc, exif, sha256Hash }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isForensicsModalOpen, setIsForensicsModalOpen] = useState(false);

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      await generateOsintPdfReport({
        imageSrc,
        result,
        exif: exif || null,
        websiteUrl: 'https://unfantasmaenelsistema.com',
        sha256Hash,
      });
    } catch (err) {
      console.error('Error generando reporte PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleExportKml = () => {
    exportToKml(result, `${result.city}_${result.country}`);
  };

  const handleExportGeoJson = () => {
    exportToGeoJson(result, `${result.city}_${result.country}`);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'flora':
        return <Trees className="h-4 w-4 text-emerald-400" />;
      case 'architecture':
        return <Building2 className="h-4 w-4 text-indigo-400" />;
      case 'signage':
        return <Signpost className="h-4 w-4 text-amber-400" />;
      case 'sun_angle':
        return <SunMedium className="h-4 w-4 text-orange-400" />;
      case 'license_plates':
      case 'infrastructure':
        return <Car className="h-4 w-4 text-cyan-400" />;
      case 'streetview':
        return <Eye className="h-4 w-4 text-amber-400" />;
      case 'terrain':
        return <Mountain className="h-4 w-4 text-teal-400" />;
      default:
        return <Compass className="h-4 w-4 text-slate-400" />;
    }
  };

  const getImpactBadge = (impact: string) => {
    switch (impact) {
      case 'critical':
        return (
          <span className="rounded bg-rose-950/80 px-2 py-0.5 text-[10px] font-semibold text-rose-300 border border-rose-800/60">
            Crítico
          </span>
        );
      case 'strong':
        return (
          <span className="rounded bg-emerald-950/80 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 border border-emerald-800/60">
            Fuerte
          </span>
        );
      default:
        return (
          <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400 border border-slate-700">
            Secundario
          </span>
        );
    }
  };

  const filteredClues =
    selectedCategory === 'all'
      ? result.visualClues
      : result.visualClues.filter((c) => c.category === selectedCategory);

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(result, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `geospecter_report_${result.countryCode}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Primary OSINT Summary Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-5 shadow-2xl sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-emerald-950/80 px-2.5 py-1 text-xs font-mono font-bold text-emerald-400 border border-emerald-800/60">
                {result.countryCode}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Ubicación Triangulada
              </span>
            </div>

            <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
              {result.city}, {result.country}
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-300">
              {result.approximateAddress} {result.region && `· ${result.region}`}
            </p>
          </div>

          {/* Confidence Score Pill */}
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 rounded-xl bg-slate-950/80 px-4 py-2 border border-slate-800">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              <div>
                <div className="text-xl font-black text-emerald-400">
                  {result.confidencePercent}%
                </div>
                <div className="text-[10px] font-mono text-slate-400 uppercase">
                  Certeza {result.confidenceLevel}
                </div>
              </div>
            </div>
            <span className="mt-1 text-[11px] text-slate-400">
              Radio estimado: <strong className="text-slate-200">±{result.confidenceRadiusKm} km</strong>
            </span>
          </div>
        </div>

        {/* Environmental & Traffic Badges */}
        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-800/80 pt-4 sm:grid-cols-4">
          <div className="rounded-xl bg-slate-950/50 p-2.5 border border-slate-800/60">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Sentido de Marcha</span>
            <div className="mt-1 flex items-center gap-1.5 font-semibold text-slate-200 text-xs">
              <Car className="h-3.5 w-3.5 text-cyan-400" />
              {result.drivingSide === 'left' ? 'Izquierda (UK/Japón/Aus)' : result.drivingSide === 'right' ? 'Derecha (Continental)' : 'Indeterminado'}
            </div>
          </div>

          <div className="rounded-xl bg-slate-950/50 p-2.5 border border-slate-800/60">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Bioma / Clima</span>
            <div className="mt-1 flex items-center gap-1.5 font-semibold text-slate-200 text-xs truncate">
              <Trees className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span className="truncate">{result.climateBiome || 'Templado'}</span>
            </div>
          </div>

          <div className="rounded-xl bg-slate-950/50 p-2.5 border border-slate-800/60">
            <span className="text-[10px] font-mono text-slate-400 uppercase">Búsqueda Sugerida</span>
            <div className="mt-1 font-mono text-[11px] text-slate-300 truncate">
              {result.googleMapsSearchQuery}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            {imageSrc && (
              <button
                type="button"
                onClick={() => setIsForensicsModalOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-purple-500/60 bg-purple-950/80 px-2.5 py-2 text-xs font-bold text-purple-300 hover:bg-purple-900/80 hover:text-white transition-all shadow-md shadow-purple-950/50"
                title="Abrir Laboratorio Forense con zoom hasta 800% y análisis ELA / realce"
              >
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                <span>Lab Forense (ELA)</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/60 bg-emerald-950/80 px-3 py-2 text-xs font-bold text-emerald-300 hover:bg-emerald-900/80 hover:text-white transition-all shadow-md shadow-emerald-950/50 disabled:opacity-50"
              title="Descargar reporte forense completo en formato PDF con fotografía y metadatos"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-300" />
                  <span>Generando PDF...</span>
                </>
              ) : (
                <>
                  <FileText className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Descargar Reporte PDF</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleExportKml}
              className="flex items-center gap-1.5 rounded-lg border border-blue-500/50 bg-blue-950/70 px-2.5 py-2 text-xs font-medium text-blue-300 hover:bg-blue-900/70 hover:text-white transition-colors"
              title="Exportar archivo KML para Google Earth Pro 3D"
            >
              <Globe className="h-3.5 w-3.5 text-blue-400" />
              <span className="hidden sm:inline">KML Earth 3D</span>
            </button>

            <button
              type="button"
              onClick={handleExportGeoJson}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
              title="Exportar a GeoJSON para QGIS o ArcGIS"
            >
              <FileDown className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline">GeoJSON</span>
            </button>

            <button
              type="button"
              onClick={handleExportJson}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
              title="Descargar informe en formato JSON"
            >
              <FileDown className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">JSON</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition-colors"
              title="Imprimir o guardar como PDF del navegador"
            >
              <Printer className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Chronological Timeline: Shadow Inclination & Vegetation Phenology */}
      {result.chronoTimeline && (
        <ChronoTimelineVisualizer timeline={result.chronoTimeline} />
      )}

      {/* Chronolocation Card (Solar Time, Shadow Analysis & Season Estimation fallback) */}
      {!result.chronoTimeline && result.chronolocation && (
        <ChronolocationCard chronolocation={result.chronolocation} />
      )}

      {/* Street View Verification Hint */}
      {result.streetViewCoverageHint && (
        <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/30 via-slate-900/60 to-slate-900/60 p-4 sm:p-5 shadow-lg flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-950 text-amber-400 border border-amber-800/60 shrink-0">
              <Eye className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Pista para Verificación en Google Street View
              </h4>
              <p className="mt-1 text-xs text-slate-300 leading-relaxed">
                {result.streetViewCoverageHint}
              </p>
            </div>
          </div>

          <a
            href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${result.latitude},${result.longitude}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-amber-500/20 border border-amber-500/50 px-4 py-2 text-xs font-bold text-amber-300 hover:bg-amber-500/30 transition-colors shadow-sm"
          >
            <Eye className="h-4 w-4" />
            <span>Ver panorama Street View 360°</span>
            <ExternalLink className="h-3 w-3 opacity-70" />
          </a>
        </div>
      )}

      {/* Forensic Reasoning Paragraph */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-sm sm:p-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
            Deducción Forense Geoespacial
          </h3>
        </div>
        <p className="text-sm leading-relaxed text-slate-300 whitespace-pre-line">
          {result.overallExplanation}
        </p>
      </div>

      {/* Visual Clues Evidence Wall */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Pistas Visuales Detectadas ({result.visualClues.length})
            </h3>
            <p className="text-xs text-slate-400">
              Evidencias encontradas en la imagen cruzadas con patrones mundiales
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {['all', 'flora', 'architecture', 'infrastructure', 'signage', 'sun_angle'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  selectedCategory === cat
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat === 'all'
                  ? 'Todas'
                  : cat === 'flora'
                  ? 'Flora'
                  : cat === 'architecture'
                  ? 'Arquitectura'
                  : cat === 'infrastructure'
                  ? 'Vial'
                  : cat === 'signage'
                  ? 'Señales'
                  : 'Sol'}
              </button>
            ))}
          </div>
        </div>

        {/* Clue Grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filteredClues.map((clue, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 transition-all hover:border-slate-700"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 border border-slate-800">
                    {getCategoryIcon(clue.category)}
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">{clue.title}</h4>
                </div>
                {getImpactBadge(clue.impact)}
              </div>

              <div className="mt-3 space-y-1.5 text-xs">
                <div>
                  <span className="font-semibold text-slate-400">Observación: </span>
                  <span className="text-slate-300">{clue.observation}</span>
                </div>
                <div>
                  <span className="font-semibold text-emerald-400">Conclusión OSINT: </span>
                  <span className="text-slate-300">{clue.deduction}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Alternative Candidates (if any) */}
      {result.alternativeCandidates && result.alternativeCandidates.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl sm:p-6">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
              Ubicaciones Candidatas Alternativas
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {result.alternativeCandidates.map((alt, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-3.5 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">{alt.locationName}</span>
                  <span className="font-mono text-[10px] text-slate-400">
                    {alt.latitude.toFixed(4)}, {alt.longitude.toFixed(4)}
                  </span>
                </div>
                <p className="text-slate-400">{alt.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Forensic Image Laboratory (ELA, Zoom & Enhancement Modal) */}
      {imageSrc && (
        <ImageForensicsModal
          isOpen={isForensicsModalOpen}
          onClose={() => setIsForensicsModalOpen(false)}
          imageSrc={imageSrc}
          imageName={`${result.city}_${result.country}`}
          sha256Hash={sha256Hash}
        />
      )}
    </div>
  );
};
