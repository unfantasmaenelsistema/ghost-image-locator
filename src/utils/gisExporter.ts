import { GeolocationAnalysisResult } from '../types';

/**
 * Generates circle coordinates around a center point for KML/GeoJSON polygons.
 */
function generateCirclePoints(centerLat: number, centerLng: number, radiusKm: number, numPoints = 64): [number, number][] {
  const points: [number, number][] = [];
  const earthRadiusKm = 6371;

  for (let i = 0; i <= numPoints; i++) {
    const angle = (i * 360) / numPoints;
    const rad = (angle * Math.PI) / 180;
    const dByR = radiusKm / earthRadiusKm;

    const latRad = (centerLat * Math.PI) / 180;
    const lngRad = (centerLng * Math.PI) / 180;

    const pointLatRad = Math.asin(
      Math.sin(latRad) * Math.cos(dByR) + Math.cos(latRad) * Math.sin(dByR) * Math.cos(rad)
    );
    const pointLngRad =
      lngRad +
      Math.atan2(
        Math.sin(rad) * Math.sin(dByR) * Math.cos(latRad),
        Math.cos(dByR) - Math.sin(latRad) * Math.sin(pointLatRad)
      );

    points.push([(pointLatRad * 180) / Math.PI, (pointLngRad * 180) / Math.PI]);
  }
  return points;
}

/**
 * Exports analysis result to standard KML 2.2 format for Google Earth Pro 3D.
 */
export function exportToKml(result: GeolocationAnalysisResult, caseTitle = 'Investigacion_OSINT'): void {
  const { latitude, longitude, city, country, confidenceRadiusKm, confidencePercent, confidenceLevel, approximateAddress } = result;

  const circlePoints = generateCirclePoints(latitude, longitude, confidenceRadiusKm || 1);
  const polygonCoordinates = circlePoints.map(([lat, lng]) => `${lng},${lat},0`).join(' ');

  const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latitude},${longitude}`;
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;

  const kmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>GeoSpecter OSINT - ${city}, ${country}</name>
    <description><![CDATA[
      <h2>Dictamen Pericial de Geolocalización OSINT</h2>
      <p><b>Ubicación:</b> ${approximateAddress || city}, ${country}</p>
      <p><b>Coordenadas:</b> ${latitude.toFixed(6)}, ${longitude.toFixed(6)}</p>
      <p><b>Certeza:</b> ${confidencePercent}% (${confidenceLevel})</p>
      <p><b>Radio de Incertidumbre:</b> ±${confidenceRadiusKm} km</p>
      <p><a href="${mapsUrl}">Abrir en Google Maps</a> | <a href="${streetViewUrl}">Ver en Google Street View 360°</a></p>
    ]]></description>

    <!-- Custom Styles -->
    <Style id="targetPin">
      <IconStyle>
        <color>ff0055ff</color>
        <scale>1.3</scale>
        <Icon>
          <href>http://maps.google.com/mapfiles/kml/pushpin/red-pushpin.png</href>
        </Icon>
      </IconStyle>
    </Style>

    <Style id="uncertaintyPolygon">
      <LineStyle>
        <color>ff00aaee</color>
        <width>2.5</width>
      </LineStyle>
      <PolyStyle>
        <color>4000aaee</color>
      </PolyStyle>
    </Style>

    <!-- Main Target Placemark -->
    <Placemark>
      <name>🎯 Objetivo: ${city}, ${country}</name>
      <styleUrl>#targetPin</styleUrl>
      <Point>
        <coordinates>${longitude},${latitude},0</coordinates>
      </Point>
    </Placemark>

    <!-- Uncertainty Radius Polygon -->
    <Placemark>
      <name>⭕ Radio de Incertidumbre (±${confidenceRadiusKm} km)</name>
      <styleUrl>#uncertaintyPolygon</styleUrl>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              ${polygonCoordinates}
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>
  </Document>
</kml>`;

  const blob = new Blob([kmlContent], { type: 'application/vnd.google-earth.kml+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${caseTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_google_earth.kml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports analysis result to standard GeoJSON format for QGIS, ArcGIS and PostGIS.
 */
export function exportToGeoJson(result: GeolocationAnalysisResult, caseTitle = 'Investigacion_OSINT'): void {
  const { latitude, longitude, city, country, confidenceRadiusKm, confidencePercent, confidenceLevel, approximateAddress, climateBiome, drivingSide, chronolocation, chronoTimeline } = result;

  const circlePoints = generateCirclePoints(latitude, longitude, confidenceRadiusKm || 1);
  const polygonCoords = circlePoints.map(([lat, lng]) => [lng, lat]);

  const geoJsonData = {
    type: 'FeatureCollection',
    metadata: {
      generatedBy: 'GeoSpecter OSINT Geointelligence Engine',
      timestamp: new Date().toISOString(),
      caseTitle,
    },
    features: [
      {
        type: 'Feature',
        properties: {
          name: `${city}, ${country}`,
          role: 'Target Location Point',
          approximateAddress,
          city,
          country,
          confidencePercent,
          confidenceLevel,
          confidenceRadiusKm,
          climateBiome,
          drivingSide,
          solarTimeWindow: chronoTimeline?.estimatedTimeWindow || chronolocation?.estimatedTimeOfDay,
          estimatedDateWindow: chronoTimeline?.estimatedDateWindow || chronolocation?.estimatedMonthRange,
          shadowAngleDegrees: chronoTimeline?.shadowAngleDegrees,
          googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`,
        },
        geometry: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
      },
      {
        type: 'Feature',
        properties: {
          name: `Uncertainty Buffer (±${confidenceRadiusKm} km)`,
          role: 'Uncertainty Zone',
          confidenceRadiusKm,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [polygonCoords],
        },
      },
    ],
  };

  const blob = new Blob([JSON.stringify(geoJsonData, null, 2)], { type: 'application/geo+json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${caseTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}_qgis_arcgis.geojson`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
