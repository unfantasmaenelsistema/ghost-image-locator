import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Layers,
  ExternalLink,
  Navigation,
  Crosshair,
  Copy,
  Check,
  Eye,
  Globe2,
  MapPin,
} from 'lucide-react';
import { GeolocationAnalysisResult, ExifMetadata } from '../types';
import {
  formatDMS,
  calculateDistanceKm,
  getGoogleMapsUrl,
  getGoogleStreetViewUrl,
  getGoogleEarthUrl,
  getOpenStreetMapUrl,
} from '../utils/geoUtils';

interface InteractiveMapProps {
  result: GeolocationAnalysisResult;
  exif: ExifMetadata | null;
}

type TileLayerType = 'dark' | 'satellite' | 'streets';

export const InteractiveMap: React.FC<InteractiveMapProps> = ({ result, exif }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const currentTileLayerRef = useRef<L.TileLayer | null>(null);

  const [activeTileType, setActiveTileType] = useState<TileLayerType>('dark');
  const [copiedCoords, setCopiedCoords] = useState(false);

  const hasExifGps = Boolean(exif?.hasGps && exif.latitude && exif.longitude);
  const distanceKm =
    hasExifGps && exif?.latitude && exif?.longitude
      ? calculateDistanceKm(result.latitude, result.longitude, exif.latitude, exif.longitude)
      : null;

  const dms = formatDMS(result.latitude, result.longitude);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [result.latitude, result.longitude],
        zoom: result.confidenceRadiusKm < 2 ? 14 : result.confidenceRadiusKm < 25 ? 11 : 7,
        zoomControl: true,
      });

      layerGroupRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (currentTileLayerRef.current) {
      map.removeLayer(currentTileLayerRef.current);
    }

    let tileUrl = '';
    let attribution = '';
    let maxZoom = 19;

    switch (activeTileType) {
      case 'satellite':
        tileUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
        attribution = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';
        maxZoom = 19;
        break;
      case 'streets':
        tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
        maxZoom = 19;
        break;
      case 'dark':
      default:
        tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
        attribution = '&copy; <a href="https://carto.com/">CARTO</a>';
        maxZoom = 19;
        break;
    }

    const newTileLayer = L.tileLayer(tileUrl, { attribution, maxZoom }).addTo(map);
    currentTileLayerRef.current = newTileLayer;
  }, [activeTileType]);

  // Update Markers and Shapes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // Custom DivIcon for AI Predicted Location
    const aiIcon = L.divIcon({
      className: 'custom-ai-pin',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="absolute h-10 w-10 rounded-full bg-emerald-400/20 animate-ping"></div>
          <div class="relative flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/50 border-2 border-slate-950 font-bold">
            <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
          </div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
      popupAnchor: [0, -18],
    });

    const aiMarker = L.marker([result.latitude, result.longitude], { icon: aiIcon })
      .bindPopup(
        `
        <div style="font-family: sans-serif; min-width: 200px; padding: 4px;">
          <strong style="color: #10b981; font-size: 13px;">📍 Predicción Visual OSINT</strong><br/>
          <div style="font-weight: 600; margin-top: 2px;">${result.city}, ${result.country}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${result.approximateAddress}</div>
          <div style="font-size: 11px; margin-top: 4px;"><strong>Certeza:</strong> ${result.confidencePercent}% (Radio: ±${result.confidenceRadiusKm} km)</div>
        </div>
      `,
      )
      .addTo(layerGroup);

    // Uncertainty Radius Circle
    const radiusMeters = Math.max(100, result.confidenceRadiusKm * 1000);
    L.circle([result.latitude, result.longitude], {
      radius: radiusMeters,
      color: '#10b981',
      weight: 1.5,
      dashArray: '4, 6',
      fillColor: '#10b981',
      fillOpacity: 0.12,
    }).addTo(layerGroup);

    // If EXIF GPS exists, add EXIF marker & comparison line
    if (hasExifGps && exif?.latitude && exif?.longitude) {
      const exifIcon = L.divIcon({
        className: 'custom-exif-pin',
        html: `
          <div class="relative flex items-center justify-center">
            <div class="relative flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/50 border-2 border-slate-950 font-bold">
              <svg class="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
            </div>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        popupAnchor: [0, -16],
      });

      L.marker([exif.latitude, exif.longitude], { icon: exifIcon })
        .bindPopup(
          `
          <div style="font-family: sans-serif; min-width: 200px; padding: 4px;">
            <strong style="color: #f59e0b; font-size: 13px;">🛰️ Coordenadas EXIF Reales</strong><br/>
            <div style="font-size: 11px; margin-top: 2px;">Cámara: ${exif.make || ''} ${exif.model || ''}</div>
            <div style="font-size: 11px; color: #64748b;">${exif.dateTime || 'Fecha no disponible'}</div>
          </div>
        `,
        )
        .addTo(layerGroup);

      // Line connecting both points
      L.polyline(
        [
          [result.latitude, result.longitude],
          [exif.latitude, exif.longitude],
        ],
        {
          color: '#f59e0b',
          weight: 2,
          dashArray: '6, 8',
          opacity: 0.8,
        },
      )
        .bindTooltip(`Discrepancia: ${distanceKm} km`, { permanent: true, direction: 'center', className: 'bg-slate-900 text-amber-300 font-mono text-[10px] px-1 py-0.5 rounded border border-amber-500/50' })
        .addTo(layerGroup);

      // Fit bounds to show both
      const bounds = L.latLngBounds(
        [result.latitude, result.longitude],
        [exif.latitude, exif.longitude],
      );
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else {
      map.setView([result.latitude, result.longitude], result.confidenceRadiusKm < 2 ? 14 : result.confidenceRadiusKm < 25 ? 11 : 7);
    }
  }, [result, exif]);

  const handleCopyCoords = () => {
    navigator.clipboard.writeText(`${result.latitude.toFixed(6)}, ${result.longitude.toFixed(6)}`);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  const handleCenterAI = () => {
    mapInstanceRef.current?.flyTo([result.latitude, result.longitude], 14, { duration: 1.2 });
  };

  const handleCenterExif = () => {
    if (exif?.latitude && exif?.longitude) {
      mapInstanceRef.current?.flyTo([exif.latitude, exif.longitude], 15, { duration: 1.2 });
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl">
      {/* Top Map Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-slate-900/90 px-4 py-2.5 backdrop-blur-md">
        {/* Layer selector */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <Layers className="h-3.5 w-3.5 text-slate-400 ml-1 mr-0.5" />
          <button
            type="button"
            onClick={() => setActiveTileType('dark')}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              activeTileType === 'dark'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Táctico
          </button>
          <button
            type="button"
            onClick={() => setActiveTileType('satellite')}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              activeTileType === 'satellite'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Satélite (Esri)
          </button>
          <button
            type="button"
            onClick={() => setActiveTileType('streets')}
            className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
              activeTileType === 'streets'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Calles (OSM)
          </button>
        </div>

        {/* Quick jump actions */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCenterAI}
            className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/80 px-2.5 py-1 text-xs font-medium text-emerald-400 hover:bg-slate-800 hover:text-emerald-300"
            title="Centrar en predicción visual"
          >
            <Crosshair className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Centrar</span> IA
          </button>

          {hasExifGps && (
            <button
              type="button"
              onClick={handleCenterExif}
              className="flex items-center gap-1 rounded-lg border border-amber-800/60 bg-amber-950/30 px-2.5 py-1 text-xs font-medium text-amber-300 hover:bg-amber-950/50"
              title="Centrar en coordenadas EXIF de la foto"
            >
              <MapPin className="h-3.5 w-3.5 text-amber-400" />
              <span className="hidden sm:inline">Centrar</span> EXIF
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyCoords}
            className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950/80 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white"
            title="Copiar coordenadas WGS84"
          >
            {copiedCoords ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{copiedCoords ? 'Copiadas' : 'Copiar'}</span>
          </button>
        </div>
      </div>

      {/* Map Canvas */}
      <div ref={mapContainerRef} className="h-[440px] w-full z-10" />

      {/* Bottom Floating Bar: Coordinates readout & External Google Links */}
      <div className="border-t border-slate-800 bg-slate-900/95 p-3 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Coordinates readout */}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-slate-100">
                {result.latitude.toFixed(6)}, {result.longitude.toFixed(6)}
              </span>
              <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                WGS84
              </span>
            </div>
            <p className="font-mono text-[11px] text-slate-400">
              {dms.fullDMS}
            </p>
          </div>

          {/* Direct Google & External Map Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={getGoogleMapsUrl(result.latitude, result.longitude)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-blue-600/20 border border-blue-500/40 px-3 py-1.5 text-xs font-semibold text-blue-300 hover:bg-blue-600/30 hover:text-blue-200 transition-colors"
            >
              <Globe2 className="h-3.5 w-3.5" />
              <span>Google Maps</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>

            <a
              href={getGoogleStreetViewUrl(result.latitude, result.longitude)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/30 hover:text-amber-200 transition-colors"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>Street View</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>

            <a
              href={getGoogleEarthUrl(result.latitude, result.longitude)}
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 px-3 py-1.5 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 hover:text-emerald-200 transition-colors"
            >
              <Navigation className="h-3.5 w-3.5" />
              <span>Google Earth 3D</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
