/**
 * Formats decimal degrees to Degrees Minutes Seconds (DMS) string
 * Example: 48.8584, 2.2945 => 48° 51' 30.2" N, 2° 17' 40.2" E
 */
export function formatDMS(lat: number, lng: number): { latDMS: string; lngDMS: string; fullDMS: string } {
  const formatCoord = (deg: number, isLat: boolean) => {
    const direction = isLat ? (deg >= 0 ? 'N' : 'S') : deg >= 0 ? 'E' : 'W';
    const absolute = Math.abs(deg);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = ((minutesNotTruncated - minutes) * 60).toFixed(1);
    return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
  };

  const latDMS = formatCoord(lat, true);
  const lngDMS = formatCoord(lng, false);

  return {
    latDMS,
    lngDMS,
    fullDMS: `${latDMS}, ${lngDMS}`,
  };
}

/**
 * Calculates Haversine distance between two coordinates in kilometers
 */
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

/**
 * Generates direct Google Maps URL
 */
export function getGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

/**
 * Generates direct Google Street View URL
 */
export function getGoogleStreetViewUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;
}

/**
 * Generates direct Google Earth Web URL
 */
export function getGoogleEarthUrl(lat: number, lng: number): string {
  return `https://earth.google.com/web/@${lat},${lng},100a,1000d,35y,0h,0t,0r`;
}

/**
 * Generates OpenStreetMap URL
 */
export function getOpenStreetMapUrl(lat: number, lng: number, zoom = 16): string {
  return `https://www.openstreetmap.org/#map=${zoom}/${lat}/${lng}`;
}
