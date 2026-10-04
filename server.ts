import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { rateLimit } from 'express-rate-limit';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// PORT/HOST se leen de .env / entorno. Por defecto el servidor solo escucha
// en 127.0.0.1 (localhost): hace falta fijar HOST=0.0.0.0 explícitamente
// para exponerlo a otros equipos de la red.
const DEFAULT_PORT = 3000;
const parsedPort = Number(process.env.PORT);
const PORT = Number.isInteger(parsedPort) && parsedPort > 0 && parsedPort < 65536 ? parsedPort : DEFAULT_PORT;
const HOST = process.env.HOST?.trim() || '127.0.0.1';

// Límite de body generoso (fotos en base64 de alta resolución), pero
// configurable y con límite al fin y al cabo: antes no había ninguno
// más allá de este fijo.
const MAX_BODY_SIZE = process.env.MAX_BODY_SIZE?.trim() || '60mb';
app.use(express.json({ limit: MAX_BODY_SIZE }));
app.use(express.urlencoded({ extended: true, limit: MAX_BODY_SIZE }));

app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err?.type === 'entity.too.large') {
    return res.status(413).json({ error: 'El cuerpo de la petición supera el límite permitido.' });
  }
  if (err?.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    return res.status(400).json({ error: 'JSON de la petición no válido.' });
  }
  return next(err);
});

// Rate limiting básico por IP para las rutas que consumen la API de Gemini,
// pensado para disuadir abuso/rafagas accidentales en un uso local, no para
// soportar tráfico adversarial a gran escala.
const aiRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones. Espera un minuto antes de volver a intentarlo.' },
});

// Serve static files from public
app.use(express.static(path.resolve(__dirname, 'public')));

// Gemini SDK client initialization
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export interface GeolocationAnalysisResult {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  approximateAddress: string;
  latitude: number;
  longitude: number;
  confidenceRadiusKm: number;
  confidencePercent: number;
  confidenceLevel: 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW';
  visualClues: Array<{
    category: 'flora' | 'architecture' | 'infrastructure' | 'signage' | 'sun_angle' | 'license_plates' | 'terrain' | 'streetview' | 'other';
    title: string;
    observation: string;
    deduction: string;
    impact: 'critical' | 'strong' | 'supporting';
  }>;
  overallExplanation: string;
  climateBiome: string;
  drivingSide: 'right' | 'left' | 'unknown';
  alternativeCandidates: Array<{
    locationName: string;
    latitude: number;
    longitude: number;
    reason: string;
  }>;
  googleMapsSearchQuery: string;
  streetViewCoverageHint: string;
}

// --- Input validation helpers for the AI-backed routes ---
// Everything here is attacker-controlled (any visitor to the local
// server), so every field is type- and length-checked before it is
// spliced into a Gemini prompt or proxied to a third-party API.
const VALID_IMAGE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']);
const MAX_TEXT_QUERY = 300;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidCoordinate(value: unknown, min: number, max: number): boolean {
  if (value === undefined || value === null || value === '') return true; // opcional
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n >= min && n <= max;
}

// OSINT Geolocation analysis endpoint with model fallback
app.post('/api/geolocate', aiRateLimiter, async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', clientExif } = req.body || {};

    if (!isNonEmptyString(imageBase64)) {
      return res.status(400).json({ error: 'No se ha proporcionado imagen en base64' });
    }
    if (typeof mimeType !== 'string' || !VALID_IMAGE_MIME_TYPES.has(mimeType)) {
      return res.status(400).json({ error: 'Tipo de imagen no soportado' });
    }
    if (clientExif !== undefined && (typeof clientExif !== 'object' || clientExif === null)) {
      return res.status(400).json({ error: 'clientExif debe ser un objeto' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: 'GEMINI_API_KEY no configurada en el servidor. Revisa el archivo .env o los Secretos en AI Studio.',
      });
    }

    // Clean base64 if it has data prefix
    const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

    const promptText = `
Eres un analista de inteligencia geoespacial (GEOINT / OSINT) de élite y campeón mundial de Geoguessr.
Tu misión es inspeccionar minuciosamente esta fotografía y deducir con la máxima precisión posible sus coordenadas geográficas en el planeta Tierra (Latitud y Longitud en grados decimales WGS84) para ubicarla en Google Maps y Google Street View.

${clientExif ? `Datos técnicos EXIF preliminares detectados en el archivo: ${JSON.stringify(clientExif)}` : 'IMPORTANTE: La imagen NO contiene coordenadas GPS en los metadatos EXIF (fueron eliminadas o nunca existieron). Debes basarte 100% en el análisis forense visual, deduciendo pistas como un investigador de Street View.'}

Analiza metódicamente cada uno de estos elementos visuales:
1. SEÑALÉTICA, COMERCIOS Y TEXTO: Idioma, alfabeto (latino, cirílico, hangul, kanji, árabe, etc.), nombres de comercios, marcas locales, letreros de calles, prefijos telefónicos, dominios web (.es, .fr, .jp, .br, etc.), fuentes tipográficas, colores y formas de señales viales (ej. señales de advertencia amarillas vs blancas/rojas).
2. ELEMENTOS DE GOOGLE STREET VIEW / COBERTURA: Si la imagen proviene o coincide con carreteras cubiertas por Street View, identifica marcas de coche de Google (barras de techo, color del capó), calidad de cámara (Gen 2 vs Gen 3 vs Gen 4), o si es un entorno típicamente mapeado.
3. INFRAESTRUCTURA VIAL: Tipos de bolardos/delimitadores viales (son únicos por país), color de las líneas de la carretera (ej. líneas centrales amarillas en América/países nórdicos vs blancas en Europa), material del asfalto, bordillos, diseño de alcantarillas, postes eléctricos y aisladores de cableado.
4. VEHÍCULOS: Sentido de la marcha (conducción por la derecha o por la izquierda), formato de matrícula (banda azul de la UE a la izquierda, placas amarillas en UK/Países Bajos/Israel, placas pequeñas cuadradas, etc.).
5. ARQUITECTURA: Estilo constructivo (mediterráneo, barroco, nórdico de madera, soviético panelák, colonial, ladrillo visto británico/flamenco, etc.), forma de tejados, chimeneas, persianas, rejas, balcones.
6. FLORA Y BIOMA: Especies arbóreas y vegetales (eucaliptos, pinos nórdicos, olivos, palmeras, vegetación árida/desértica), color de la tierra/roca (rojo ferroso, calizo, etc.), relieve montañoso.
7. ASTRONOMÍA / SOMBRAS: Posición e inclinación del sol respecto a las sombras para estimar hemisferio (Norte vs Sur) y latitud aproximada.
9. MONUMENTOS O HITOS: Si hay un edificio, monumento o skyline identificable, identifícalo con precisión milimétrica.
10. CRONOLOCALIZACIÓN FORENSE (HORA SOLAR APROXIMADA, ESTACIÓN Y FECHA ESTIMADA AÚN SIN METADATOS):
- HORA SOLAR ESTIMADA: Analiza la longitud, dureza e inclinación de las sombras respecto a edificios, postes y personas. Sombras muy largas indican primeras horas tras el amanecer (07:30-09:30) o atardecer (18:00-20:30, luz dorada). Sombras cortas o cenitales indican mediodía solar (12:30-14:30). Luz difusa sin sombras proyectadas indica cielo encapotado, niebla o crepúsculo. Estima el rango horario más probable.
- ANÁLISIS DE LA POSICIÓN SOLAR Y AZIMUT: Describe el ángulo aparente y orientación relativa de las fuentes de luz o sombras.
- ESTACIÓN DEL AÑO Y RANGO DE MESES ESTIMADOS: Analiza el estado fenológico de la vegetación (árboles caducifolios frondosos = primavera tardía/verano; hojas amarillas, rojizas o en el suelo = otoño; ramas totalmente desnudas o escarcha = invierno; flores tempranas = inicio de primavera), la vestimenta de transeúntes (abrigos térmicos, guantes vs mangas cortas y ropa estival), la nubosidad y el ángulo cenital solar para la latitud deducida.

Devuelve OBLIGATORIAMENTE tu respuesta en español, con un objeto JSON válido con este esquema estricto:
- country: Nombre del país (ej. "España", "Japón", "Chile")
- countryCode: Código ISO de 2 letras (ej. "ES", "JP", "CL")
- region: Región, estado o comunidad autónoma (ej. "Andalucía", "Kanto", "Valparaíso")
- city: Ciudad o municipio más probable
- approximateAddress: Calle, plaza, hito o área aproximada
- latitude: Número decimal flotante entre -90 y 90 (ej. 40.4168)
- longitude: Número decimal flotante entre -180 y 180 (ej. -3.7038)
- confidenceRadiusKm: Radio de incertidumbre en kilómetros (ej. 0.05 para un edificio exacto, 5 para una ciudad, 50 para una región, 300 si solo se identifica el país)
- confidencePercent: Número entero entre 1 y 99
- confidenceLevel: "VERY_HIGH" (si hay hito inequívoco), "HIGH" (ciudad o carretera confirmada), "MEDIUM" (región o país confirmado), "LOW" (solo estimación continental/bioma)
- climateBiome: Descripción corta del clima/bioma (ej. "Mediterráneo templado", "Bosque boreal templado", "Subtropical húmedo")
- drivingSide: "right", "left" o "unknown"
- streetViewCoverageHint: Breve indicación de cómo verificar esta ubicación en Google Street View o Google Maps (ej. "Buscar en Street View a lo largo de la carretera N-340 o cruce con calle X")
- chronolocation: Objeto con la estimación cronológica:
    * estimatedTimeOfDay: Rango horario estimado (ej. "16:30 - 18:00 (Media tarde / Golden Hour)")
    * timeConfidence: "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW"
    * sunPositionAnalysis: Explicación de sombras y posición solar (ej. "Sombras alargadas proyectadas hacia el este a unos 40 grados, sol bajo en el cuadrante suroeste...")
    * estimatedSeason: "Primavera" | "Verano" | "Otoño" | "Invierno" | "Transición"
    * estimatedMonthRange: Rango de meses (ej. "Octubre - Noviembre" o "Junio - Julio")
    * seasonConfidence: "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW"
    * environmentalClues: Pistas fenológicas, follaje y vestimenta (ej. "Arces con hojas ocres caídas, personas con chaquetas intermedias...")
    * lightingConditions: Condiciones de iluminación (ej. "Luz solar directa dorada", "Luz difusa por cielo cubierto", "Crepúsculo vespertino")
- chronoTimeline: Análisis específico cruzado de inclinación de sombras y fenología botánica estructurado para generar una LÍNEA DE TIEMPO (Timeline):
    * estimatedTimeWindow: Intervalo horario estimado (ej. "16:15 - 17:30")
    * shadowAngleDegrees: Ángulo de inclinación/elevación solar estimado en grados (número entre 0 y 90, ej. 26)
    * shadowRatioDescription: Relación de longitud de sombra respecto al objeto (ej. "Sombras alargadas de aprox. 1.8x la altura de postes y transeúntes")
    * solarAzimuth: Dirección del sol (ej. "Suroeste (~235°)")
    * solarElevationCategory: "Sol bajo / Amanecer" | "Sol matutino" | "Sol cenital / Mediodía" | "Sol bajo vespertino" | "Ocaso / Golden Hour"
    * vegetationSpecies: Especies o tipo de vegetación identificada (ej. "Platanus occidentalis y tilos caducifolios")
    * phenologicalStage: Estado del follaje (ej. "Follaje ocre y defoliación moderada")
    * botanicalDeduction: Deducción temporal basada en el ciclo botánico para la latitud calculada
    * estimatedSeason: Estación ("Primavera", "Verano", "Otoño", "Invierno")
    * estimatedDateWindow: Ventana de fechas estimada (ej. "20 de Octubre - 10 de Noviembre")
    * peakMonth: Mes de máxima probabilidad (ej. "Octubre")
    * dailyTimeline: Array de 4 a 5 hitos diarios ordenados, cada uno con { timeLabel: string, stageName: string, solarAngleDeg: number, isCaptureWindow: boolean } (el hito correspondiente a la captura debe tener isCaptureWindow: true)
    * annualTimeline: Array de los 12 meses (Ene, Feb, Mar, Abr, May, Jun, Jul, Ago, Sep, Oct, Nov, Dic) con { monthName: string, status: "excluded" | "possible" | "likely" | "peak", phenologyState: string }
    * forensicSynthesis: Síntesis pericial en 2 frases de cómo el ángulo de sombra y el estado botánico fechan la toma.
- visualClues: Lista de pistas encontradas, donde cada una tiene:
    * category: "flora" | "architecture" | "infrastructure" | "signage" | "sun_angle" | "license_plates" | "terrain" | "streetview" | "other"
    * title: Título corto de la pista (ej. "Bolardo vial tipo C1", "Matrícula con banda UE")
    * observation: Qué se observa exactamente en la imagen
    * deduction: Qué conclusión geográfica aporta
    * impact: "critical" | "strong" | "supporting"
- overallExplanation: Explicación detallada en español (2 o 3 párrafos claros y profesionales) de cómo se ha realizado la deducción paso a paso.
- socialMediaSearchTerms: Lista de 2 a 5 términos o palabras clave ideales para buscar esta foto en Redes Sociales (Instagram, Twitter/X, TikTok, Reddit) para encontrar quién la publicó o el evento/lugar (ej. ["Restaurante La Campana Madrid", "Plaza Mayor", "@lacampanabar"]).
- alternativeCandidates: Lista de 1 o 2 ubicaciones secundarias en caso de ambigüedad con { locationName, latitude, longitude, reason }
- googleMapsSearchQuery: Término de búsqueda óptimo y exacto para encontrar la ubicación en Google Maps y Street View (ej. "Catedral de Burgos Plaza de Santa María")
`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        country: { type: Type.STRING },
        countryCode: { type: Type.STRING },
        region: { type: Type.STRING },
        city: { type: Type.STRING },
        approximateAddress: { type: Type.STRING },
        latitude: { type: Type.NUMBER },
        longitude: { type: Type.NUMBER },
        confidenceRadiusKm: { type: Type.NUMBER },
        confidencePercent: { type: Type.INTEGER },
        confidenceLevel: { type: Type.STRING },
        climateBiome: { type: Type.STRING },
        drivingSide: { type: Type.STRING },
        streetViewCoverageHint: { type: Type.STRING },
        chronolocation: {
          type: Type.OBJECT,
          properties: {
            estimatedTimeOfDay: { type: Type.STRING },
            timeConfidence: { type: Type.STRING },
            sunPositionAnalysis: { type: Type.STRING },
            estimatedSeason: { type: Type.STRING },
            estimatedMonthRange: { type: Type.STRING },
            seasonConfidence: { type: Type.STRING },
            environmentalClues: { type: Type.STRING },
            lightingConditions: { type: Type.STRING },
          },
          required: [
            'estimatedTimeOfDay',
            'timeConfidence',
            'sunPositionAnalysis',
            'estimatedSeason',
            'estimatedMonthRange',
            'seasonConfidence',
            'environmentalClues',
          ],
        },
        chronoTimeline: {
          type: Type.OBJECT,
          properties: {
            estimatedTimeWindow: { type: Type.STRING },
            shadowAngleDegrees: { type: Type.NUMBER },
            shadowRatioDescription: { type: Type.STRING },
            solarAzimuth: { type: Type.STRING },
            solarElevationCategory: { type: Type.STRING },
            vegetationSpecies: { type: Type.STRING },
            phenologicalStage: { type: Type.STRING },
            botanicalDeduction: { type: Type.STRING },
            estimatedSeason: { type: Type.STRING },
            estimatedDateWindow: { type: Type.STRING },
            peakMonth: { type: Type.STRING },
            dailyTimeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  timeLabel: { type: Type.STRING },
                  stageName: { type: Type.STRING },
                  solarAngleDeg: { type: Type.NUMBER },
                  isCaptureWindow: { type: Type.BOOLEAN },
                },
                required: ['timeLabel', 'stageName', 'solarAngleDeg'],
              },
            },
            annualTimeline: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  monthName: { type: Type.STRING },
                  status: { type: Type.STRING },
                  phenologyState: { type: Type.STRING },
                },
                required: ['monthName', 'status'],
              },
            },
            forensicSynthesis: { type: Type.STRING },
          },
          required: [
            'estimatedTimeWindow',
            'shadowAngleDegrees',
            'shadowRatioDescription',
            'solarAzimuth',
            'vegetationSpecies',
            'phenologicalStage',
            'botanicalDeduction',
            'estimatedDateWindow',
            'peakMonth',
            'dailyTimeline',
            'annualTimeline',
            'forensicSynthesis',
          ],
        },
        visualClues: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              title: { type: Type.STRING },
              observation: { type: Type.STRING },
              deduction: { type: Type.STRING },
              impact: { type: Type.STRING },
            },
            required: ['category', 'title', 'observation', 'deduction', 'impact'],
          },
        },
        overallExplanation: { type: Type.STRING },
        socialMediaSearchTerms: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        alternativeCandidates: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              locationName: { type: Type.STRING },
              latitude: { type: Type.NUMBER },
              longitude: { type: Type.NUMBER },
              reason: { type: Type.STRING },
            },
            required: ['locationName', 'latitude', 'longitude', 'reason'],
          },
        },
        googleMapsSearchQuery: { type: Type.STRING },
      },
      required: [
        'country',
        'countryCode',
        'region',
        'city',
        'approximateAddress',
        'latitude',
        'longitude',
        'confidenceRadiusKm',
        'confidencePercent',
        'confidenceLevel',
        'visualClues',
        'overallExplanation',
        'googleMapsSearchQuery',
      ],
    };

    // Resilient fallback order: Try gemini-2.5-flash first (fastest and most stable), then gemini-flash-latest, then gemini-3.8-flash
    const candidateModels = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-3.8-flash'];
    let lastError: any = null;
    let textOutput: string | undefined;

    for (const modelName of candidateModels) {
      try {
        console.log(`[GeoSpecter OSINT] Analizando imagen con modelo: ${modelName}...`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [
              {
                inlineData: {
                  data: cleanBase64,
                  mimeType,
                },
              },
              {
                text: promptText,
              },
            ],
          },
          config: {
            responseMimeType: 'application/json',
            responseSchema,
          },
        });

        textOutput = response.text;
        if (textOutput) {
          console.log(`[GeoSpecter OSINT] Análisis completado con éxito mediante ${modelName}`);
          break;
        }
      } catch (err: any) {
        console.warn(`[GeoSpecter OSINT] Fallo con ${modelName}:`, err.message || err);
        lastError = err;
      }
    }

    if (!textOutput) {
      throw lastError || new Error('No se pudo obtener respuesta de los modelos de visión de Google.');
    }

    const parsedResult = JSON.parse(textOutput) as GeolocationAnalysisResult;
    return res.json(parsedResult);
  } catch (error: any) {
    console.error('Error en geolocalización:', error);
    return res.status(500).json({
      error: error.message || 'Error procesando la geolocalización de la imagen.',
    });
  }
});

// Location Search endpoint (Geocoding via Nominatim to search streets, landmarks, businesses)
app.get('/api/search-location', aiRateLimiter, async (req, res) => {
  try {
    const query = req.query.q;
    if (!isNonEmptyString(query)) {
      return res.status(400).json({ error: 'Parámetro q requerido' });
    }
    if (query.length > MAX_TEXT_QUERY) {
      return res.status(400).json({ error: `El parámetro q admite como máximo ${MAX_TEXT_QUERY} caracteres.` });
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GeoSpecterOSINT/1.0 (unfantasmaenelsistema.com)',
        'Accept-Language': 'es,en',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim error: ${response.status}`);
    }

    const results = await response.json();
    return res.json(results);
  } catch (err: any) {
    console.error('Error en búsqueda de ubicación:', err);
    return res.status(500).json({ error: 'Error buscando coordenadas para la consulta' });
  }
});

// Live Social Media & Web OSINT Search endpoint using Google Search Grounding
app.post('/api/social-search-live', aiRateLimiter, async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', query = '' } = req.body || {};

    if (imageBase64 !== undefined && !isNonEmptyString(imageBase64)) {
      return res.status(400).json({ error: 'imageBase64 debe ser una cadena no vacía' });
    }
    if (imageBase64 !== undefined && (typeof mimeType !== 'string' || !VALID_IMAGE_MIME_TYPES.has(mimeType))) {
      return res.status(400).json({ error: 'Tipo de imagen no soportado' });
    }
    if (query !== undefined && typeof query !== 'string') {
      return res.status(400).json({ error: 'query debe ser una cadena de texto' });
    }
    if (typeof query === 'string' && query.length > MAX_TEXT_QUERY) {
      return res.status(400).json({ error: `query admite como máximo ${MAX_TEXT_QUERY} caracteres.` });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY no configurada' });
    }

    const promptText = `
Eres un analista de ciberinteligencia y OSINT en redes sociales.
Tu misión es investigar y contrastar en tiempo real con Google Search y redes sociales (Instagram, Twitter / X, TikTok, Reddit, Facebook, Flickr, foros) si esta fotografía o lugar ("${query || 'la imagen proporcionada'}") aparece documentado en publicaciones públicas, posts virales, eventos, geolocalizaciones o hilos de discusión.

Devuelve un reporte conciso y profesional en español estructurado en:
1. PRESENCIA EN REDES SOCIALES: ¿Aparece este lugar o imagen en publicaciones de Instagram, posts de Twitter/X, hilos de Reddit o TikTok? ¿En qué contexto se comparte habitualmente?
2. CUENTAS, HASHTAGS O COMUNIDADES ASOCIADAS: Qué perfiles, hashtags o grupos suelen publicar sobre esto.
3. CONCLUSIÓN OSINT: ¿Se considera una foto viral/pública o parece un archivo privado/inédito?
`;

    const parts: any[] = [];
    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
      parts.push({
        inlineData: {
          data: cleanBase64,
          mimeType,
        },
      });
    }
    parts.push({ text: promptText });

    const candidateModels = ['gemini-2.5-flash', 'gemini-flash-latest'];
    let response: any = null;

    for (const modelName of candidateModels) {
      try {
        response = await ai.models.generateContent({
          model: modelName,
          contents: parts.length === 1 ? parts[0].text : { parts },
          config: {
            tools: [{ googleSearch: {} }],
          },
        });
        if (response?.text) break;
      } catch (err: any) {
        console.warn(`[SocialScan] Error con ${modelName}:`, err.message);
      }
    }

    if (!response || !response.text) {
      throw new Error('No se pudo completar el rastreo en redes sociales.');
    }

    const groundingMetadata = response.candidates?.[0]?.groundingMetadata || {};
    const rawChunks = groundingMetadata.groundingChunks || [];
    const searchQueries: string[] = groundingMetadata.webSearchQueries || [];

    // Parse and categorize sources by social platform
    const sources = rawChunks
      .filter((chunk: any) => chunk.web && chunk.web.uri)
      .map((chunk: any) => {
        const uri = chunk.web.uri as string;
        const title = (chunk.web.title as string) || '';
        const lowerUri = uri.toLowerCase();
        const lowerTitle = title.toLowerCase();

        let platform = 'Web';
        if (lowerUri.includes('instagram.com') || lowerTitle.includes('instagram')) {
          platform = 'Instagram';
        } else if (lowerUri.includes('twitter.com') || lowerUri.includes('x.com') || lowerTitle.includes('twitter') || lowerTitle.includes(' x ')) {
          platform = 'X / Twitter';
        } else if (lowerUri.includes('reddit.com') || lowerTitle.includes('reddit')) {
          platform = 'Reddit';
        } else if (lowerUri.includes('tiktok.com') || lowerTitle.includes('tiktok')) {
          platform = 'TikTok';
        } else if (lowerUri.includes('facebook.com') || lowerTitle.includes('facebook')) {
          platform = 'Facebook';
        } else if (lowerUri.includes('youtube.com') || lowerTitle.includes('youtube')) {
          platform = 'YouTube';
        } else if (lowerUri.includes('pinterest.com') || lowerTitle.includes('pinterest')) {
          platform = 'Pinterest';
        } else if (lowerUri.includes('flickr.com') || lowerTitle.includes('flickr')) {
          platform = 'Flickr';
        } else if (lowerUri.includes('wikipedia.org') || lowerTitle.includes('wikipedia')) {
          platform = 'Wikipedia';
        }

        return {
          title: title || 'Publicación / Recurso',
          uri,
          platform,
        };
      });

    return res.json({
      summary: response.text,
      sources,
      searchQueries,
    });
  } catch (err: any) {
    console.error('Error en social-search-live:', err);
    return res.status(500).json({ error: err.message || 'Error en el escaneo de redes sociales' });
  }
});

// Grounding with Google Maps Data endpoint
app.post('/api/verify-google-maps', aiRateLimiter, async (req, res) => {
  try {
    const { query, latitude, longitude, locationName } = req.body || {};

    if (query !== undefined && typeof query !== 'string') {
      return res.status(400).json({ error: 'query debe ser una cadena de texto' });
    }
    if (locationName !== undefined && typeof locationName !== 'string') {
      return res.status(400).json({ error: 'locationName debe ser una cadena de texto' });
    }
    if ((typeof query === 'string' && query.length > MAX_TEXT_QUERY) || (typeof locationName === 'string' && locationName.length > MAX_TEXT_QUERY)) {
      return res.status(400).json({ error: `query/locationName admiten como máximo ${MAX_TEXT_QUERY} caracteres.` });
    }
    if (!isValidCoordinate(latitude, -90, 90) || !isValidCoordinate(longitude, -180, 180)) {
      return res.status(400).json({ error: 'Coordenadas inválidas' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY no configurada' });
    }

    if (!query && !locationName) {
      return res.status(400).json({ error: 'Se requiere una consulta o nombre de lugar' });
    }

    const searchQuery = query || locationName;
    const prompt = `Actúa como perito en geolocalización e inteligencia geográfica.
Consulta la base de datos oficial de Google Maps para verificar y contrastar la siguiente ubicación o establecimiento:
Lugar / Búsqueda: "${searchQuery}"
${latitude && longitude ? `Coordenadas aproximadas WGS84: ${latitude}, ${longitude}` : ''}
${locationName ? `Contexto de localidad: ${locationName}` : ''}

Proporciona un reporte en español claro y conciso estructurado en:
1. IDENTIFICACIÓN OFICIAL EN GOOGLE MAPS: Nombre exacto registrado, dirección postal completa y categoría del lugar.
2. VERIFICACIÓN GEOGRÁFICA: Si las coordenadas o dirección coinciden con el lugar real o si existen establecimientos homónimos.
3. CONTEXTO PARA INVESTIGACIÓN OSINT: Entorno urbano, accesos viales, puntos de referencia inmediatos y recomendaciones para contrastar en Google Street View.`;

    // Resilient fallback order with Google Maps Grounding
    const candidateModels = ['gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-flash-latest'];
    let response: any = null;

    for (const modelName of candidateModels) {
      try {
        console.log(`[GoogleMaps Grounding] Consultando Google Maps con modelo: ${modelName}...`);
        response = await ai.models.generateContent({
          model: modelName,
          contents: prompt,
          config: {
            tools: [{ googleMaps: {} }],
          },
        });
        if (response?.text) break;
      } catch (err: any) {
        console.warn(`[GoogleMaps Grounding] Fallo con ${modelName}:`, err.message);
      }
    }

    if (!response || !response.text) {
      throw new Error('No se pudo obtener respuesta de Google Maps data.');
    }

    const groundingMetadata = response.candidates?.[0]?.groundingMetadata || {};
    const rawChunks = groundingMetadata.groundingChunks || [];

    // Extract official Google Maps places returned by Grounding
    const places = rawChunks
      .filter((chunk: any) => chunk.maps && (chunk.maps.uri || chunk.maps.title))
      .map((chunk: any) => ({
        title: chunk.maps.title || 'Lugar en Google Maps',
        uri: chunk.maps.uri || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(searchQuery)}`,
        placeId: chunk.maps.placeId || '',
      }));

    return res.json({
      summary: response.text,
      places,
      groundingMetadata,
      searchQuery,
    });
  } catch (err: any) {
    console.error('Error en /api/verify-google-maps:', err);
    return res.status(500).json({ error: err.message || 'Error verificando lugar con Google Maps data' });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'GeoSpecter OSINT Geolocation Engine',
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    time: new Date().toISOString(),
  });
});

// Development vs Production serving
async function setupServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    // In dev mode, use Vite middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, HOST, () => {
    console.log(`[GeoSpecter OSINT] Servidor activo en http://${HOST}:${PORT}`);
    if (HOST === '0.0.0.0' || HOST === '::') {
      console.warn('[AVISO] El servidor escucha en todas las interfaces de red. Úsalo solo si sabes lo que haces.');
    }
  });
}

setupServer();
