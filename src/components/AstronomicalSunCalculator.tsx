import React, { useState, useMemo } from 'react';
import * as SunCalc from 'suncalc';
import {
  Sun,
  Compass,
  Clock,
  Calendar,
  Sunrise,
  Sunset,
  TrendingDown,
  Info,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';

interface AstronomicalSunCalculatorProps {
  latitude: number;
  longitude: number;
  initialDate?: Date;
  aiEstimatedAngle?: number;
  aiEstimatedTime?: string;
}

export const AstronomicalSunCalculator: React.FC<AstronomicalSunCalculatorProps> = ({
  latitude,
  longitude,
  initialDate = new Date(),
  aiEstimatedAngle,
  aiEstimatedTime,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return initialDate.toISOString().split('T')[0];
  });

  // Time slider in minutes from 00:00 (0 to 1439)
  // Default to 16:30 (990 mins) or midday (720 mins)
  const [selectedMinutes, setSelectedMinutes] = useState<number>(990);

  // Compute times & positions using SunCalc
  const dateObj = useMemo(() => {
    const [year, month, day] = selectedDate.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    d.setHours(Math.floor(selectedMinutes / 60), selectedMinutes % 60, 0, 0);
    return d;
  }, [selectedDate, selectedMinutes]);

  const times = useMemo(() => {
    try {
      return SunCalc.getTimes(dateObj, latitude, longitude);
    } catch (e) {
      return null;
    }
  }, [dateObj, latitude, longitude]);

  const solarPosition = useMemo(() => {
    try {
      const pos = SunCalc.getPosition(dateObj, latitude, longitude);
      const altitudeDeg = Number(((pos.altitude * 180) / Math.PI).toFixed(1));

      // SunCalc azimuth is measured from south towards west
      // Convert to standard compass azimuth (0° = North, 90° = East, 180° = South, 270° = West)
      let compassAzimuth = ((pos.azimuth * 180) / Math.PI) + 180;
      compassAzimuth = (compassAzimuth + 360) % 360;
      compassAzimuth = Number(compassAzimuth.toFixed(1));

      // Opposite direction is shadow projection direction
      const shadowDirection = (compassAzimuth + 180) % 360;

      // Shadow length ratio for a 1-meter object: 1 / tan(altitude)
      let shadowRatio = 0;
      if (pos.altitude > 0) {
        shadowRatio = Number((1 / Math.tan(pos.altitude)).toFixed(2));
      }

      return {
        altitudeDeg,
        azimuthDeg: compassAzimuth,
        shadowDirection: Number(shadowDirection.toFixed(1)),
        shadowRatio,
        isDaylight: pos.altitude > 0,
      };
    } catch (e) {
      return null;
    }
  }, [dateObj, latitude, longitude]);

  const formatHoursMinutes = (d?: Date | null) => {
    if (!d || isNaN(d.getTime())) return '--:--';
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  const getCardinalDirection = (deg: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const idx = Math.round(deg / 22.5) % 16;
    return directions[idx];
  };

  const currentHours = Math.floor(selectedMinutes / 60).toString().padStart(2, '0');
  const currentMins = (selectedMinutes % 60).toString().padStart(2, '0');

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-xl backdrop-blur-sm sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-950/80 text-amber-400 border border-amber-800/60 shadow-inner">
            <Sun className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100">
                Calculador de Efemérides Solares Astronómicas (SunCalc)
              </h3>
              <span className="rounded bg-amber-950 px-2 py-0.5 text-[10px] font-mono text-amber-300 border border-amber-800">
                ASTRONOMY DB
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Efemérides solares exactas calculadas para las coordenadas: {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </p>
          </div>
        </div>

        {/* Date Selector */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1 text-xs text-slate-200 focus:border-amber-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Astronomical Key Times (Amanecer, Mediodía, Ocaso, Hora Dorada) */}
      {times && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
            <span className="text-[10px] uppercase font-mono text-slate-400 flex items-center gap-1">
              <Sunrise className="h-3 w-3 text-amber-400" /> Amanecer
            </span>
            <p className="text-base font-bold text-slate-100 mt-1 font-mono">
              {formatHoursMinutes(times.sunrise)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
            <span className="text-[10px] uppercase font-mono text-slate-400 flex items-center gap-1">
              <Sun className="h-3 w-3 text-yellow-400" /> Mediodía Solar
            </span>
            <p className="text-base font-bold text-yellow-300 mt-1 font-mono">
              {formatHoursMinutes(times.solarNoon)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
            <span className="text-[10px] uppercase font-mono text-slate-400 flex items-center gap-1">
              <Sunset className="h-3 w-3 text-orange-400" /> Atardecer (Ocaso)
            </span>
            <p className="text-base font-bold text-orange-300 mt-1 font-mono">
              {formatHoursMinutes(times.sunset)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3">
            <span className="text-[10px] uppercase font-mono text-slate-400 flex items-center gap-1">
              <Clock className="h-3 w-3 text-amber-300" /> Golden Hour
            </span>
            <p className="text-base font-bold text-amber-200 mt-1 font-mono">
              {formatHoursMinutes(times.goldenHour)}
            </p>
          </div>
        </div>
      )}

      {/* Interactive Time Slider */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/90 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-200">Hora a Simular:</span>
            <span className="rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 font-mono text-sm font-bold">
              {currentHours}:{currentMins}
            </span>
          </div>

          {aiEstimatedTime && (
            <span className="text-[11px] text-slate-400">
              Captura estimada IA: <strong className="text-amber-300">{aiEstimatedTime}</strong>
            </span>
          )}
        </div>

        <input
          type="range"
          min="360" // 06:00
          max="1320" // 22:00
          step="5"
          value={selectedMinutes}
          onChange={(e) => setSelectedMinutes(Number(e.target.value))}
          className="w-full accent-amber-500 cursor-pointer"
        />

        <div className="flex justify-between text-[10px] font-mono text-slate-500">
          <span>06:00 (Mañana)</span>
          <span>12:00 (Mediodía)</span>
          <span>16:30 (Tarde)</span>
          <span>22:00 (Noche)</span>
        </div>
      </div>

      {/* Instant Astronomical Calculations for this specific minute */}
      {solarPosition && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-3.5 space-y-1">
            <span className="text-[10px] font-mono uppercase text-amber-400">Altitud Solar Real (Grados)</span>
            <div className="text-xl font-black text-amber-200 flex items-center gap-2">
              <Sun className="h-5 w-5 text-amber-400" />
              <span>{solarPosition.altitudeDeg}°</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {solarPosition.isDaylight ? 'Sol sobre el horizonte' : 'Noche / Bajo el horizonte'}
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400">Azimut y Rumbo Solar</span>
            <div className="text-xl font-black text-cyan-300 flex items-center gap-2">
              <Compass className="h-5 w-5 text-cyan-400" />
              <span>{solarPosition.azimuthDeg}° ({getCardinalDirection(solarPosition.azimuthDeg)})</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Sombra proyectada hacia: <strong className="text-slate-200">{solarPosition.shadowDirection}° ({getCardinalDirection(solarPosition.shadowDirection)})</strong>
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 space-y-1">
            <span className="text-[10px] font-mono uppercase text-slate-400">Proporción de Sombra Teórica</span>
            <div className="text-xl font-black text-emerald-300 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-emerald-400" />
              <span>{solarPosition.shadowRatio > 0 ? `${solarPosition.shadowRatio}x` : 'N/A'}</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {solarPosition.shadowRatio > 0
                ? `Un objeto de 1m proyecta una sombra de ${solarPosition.shadowRatio}m`
                : 'Sin sombra solar directa'}
            </p>
          </div>
        </div>
      )}

      {/* Forensic validation note */}
      <div className="flex items-center gap-2 rounded-xl bg-slate-950/40 border border-slate-800/80 p-3 text-[11px] text-slate-400">
        <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
        <span>
          <strong>Validación Cruzada:</strong> Compara la proporción de sombra y el ángulo calculados por SunCalc con las sombras visibles en la fotografía para confirmar el minuto exacto de la toma.
        </span>
      </div>
    </div>
  );
};
