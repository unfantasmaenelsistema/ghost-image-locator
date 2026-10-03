import exifr from 'exifr';
import { ExifMetadata } from '../types';

export async function parseExifData(fileOrBlob: Blob | File | ArrayBuffer): Promise<ExifMetadata> {
  try {
    // Extract both full EXIF and dedicated GPS tags
    const [allTags, gps] = await Promise.all([
      exifr.parse(fileOrBlob, {
        tiff: true,
        xmp: true,
        exif: true,
        gps: true,
        translateKeys: true,
        translateValues: true,
        reviveValues: true,
      }),
      exifr.gps(fileOrBlob).catch(() => null),
    ]);

    if (!allTags && !gps) {
      return {
        hasGps: false,
      };
    }

    const latitude = gps?.latitude ?? allTags?.latitude ?? allTags?.GPSLatitude;
    const longitude = gps?.longitude ?? allTags?.longitude ?? allTags?.GPSLongitude;
    const altitude = allTags?.altitude ?? allTags?.GPSAltitude;

    const hasGps = typeof latitude === 'number' && typeof longitude === 'number' && !isNaN(latitude) && !isNaN(longitude);

    // Format date string safely
    let dateTimeFormatted: string | undefined;
    const dateRaw = allTags?.DateTimeOriginal || allTags?.CreateDate || allTags?.ModifyDate;
    if (dateRaw instanceof Date) {
      dateTimeFormatted = dateRaw.toLocaleString();
    } else if (typeof dateRaw === 'string') {
      dateTimeFormatted = dateRaw;
    }

    return {
      hasGps,
      latitude: hasGps ? latitude : undefined,
      longitude: hasGps ? longitude : undefined,
      altitude: typeof altitude === 'number' ? Math.round(altitude) : undefined,
      make: allTags?.Make,
      model: allTags?.Model,
      dateTime: dateTimeFormatted,
      software: allTags?.Software,
      focalLength: allTags?.FocalLength,
      fNumber: allTags?.FNumber,
      iso: allTags?.ISO,
      exposureTime: allTags?.ExposureTime,
      rawTags: allTags,
    };
  } catch (error) {
    console.warn('[ExifParser] No se pudieron extraer metadatos EXIF:', error);
    return {
      hasGps: false,
    };
  }
}
