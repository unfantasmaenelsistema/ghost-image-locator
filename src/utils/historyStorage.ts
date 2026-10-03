import { HistoryItem, GeolocationAnalysisResult, ExifMetadata } from '../types';

const STORAGE_KEY = 'geospecter_history_v1';
const MAX_HISTORY_ITEMS = 5;

/**
 * Compresses an image dataUrl via HTML5 Canvas to keep base64 storage
 * well below the 5MB localStorage browser threshold.
 */
export async function createCompressedImage(
  dataUrl: string,
  maxDim: number = 800,
  quality: number = 0.75,
): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl || dataUrl.startsWith('data:image/svg+xml')) {
      resolve(dataUrl);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, width);
      canvas.height = Math.max(1, height);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      try {
        resolve(canvas.toDataURL('image/jpeg', quality));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/**
 * Loads up to 5 stored history items from localStorage.
 */
export function getLocalHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, MAX_HISTORY_ITEMS);
    }
  } catch (err) {
    console.warn('Error leyendo historial de localStorage:', err);
  }
  return [];
}

/**
 * Saves a new completed analysis to localStorage, capping at 5 items.
 */
export async function addAnalysisToHistory(
  imageSrc: string,
  result: GeolocationAnalysisResult,
  exif: ExifMetadata | null,
): Promise<HistoryItem[]> {
  try {
    const [compressedMain, thumbnail] = await Promise.all([
      createCompressedImage(imageSrc, 800, 0.75),
      createCompressedImage(imageSrc, 160, 0.7),
    ]);

    const locationTitle =
      [result.city, result.country].filter(Boolean).join(', ') ||
      result.approximateAddress ||
      'Ubicación identificada';

    const newItem: HistoryItem = {
      id: `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: Date.now(),
      imageSrc: compressedMain,
      thumbnailSrc: thumbnail,
      result,
      exif,
      locationTitle,
      confidencePercent: result.confidencePercent,
      confidenceLevel: result.confidenceLevel,
    };

    const currentHistory = getLocalHistory();
    // Exclude if identical coordinates
    const filtered = currentHistory.filter((item) => {
      const isSameCoords =
        Math.abs(item.result.latitude - result.latitude) < 0.0001 &&
        Math.abs(item.result.longitude - result.longitude) < 0.0001;
      return !isSameCoords;
    });

    const updated = [newItem, ...filtered].slice(0, MAX_HISTORY_ITEMS);

    // Safe write with fallback if storage limit exceeded
    let success = false;
    let itemsToSave = updated;

    while (!success && itemsToSave.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(itemsToSave));
        success = true;
      } catch {
        console.warn('Aviso: límite de almacenamiento alcanzado, podando historial...');
        itemsToSave = itemsToSave.slice(0, itemsToSave.length - 1);
      }
    }

    return itemsToSave;
  } catch (err) {
    console.error('Error guardando análisis en historial:', err);
    return getLocalHistory();
  }
}

/**
 * Removes a specific analysis by ID from localStorage.
 */
export function deleteHistoryItem(id: string): HistoryItem[] {
  try {
    const current = getLocalHistory();
    const updated = current.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Error eliminando elemento del historial:', err);
    return getLocalHistory();
  }
}

/**
 * Clears all history from localStorage.
 */
export function clearAllHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Error vaciando historial:', err);
  }
}
