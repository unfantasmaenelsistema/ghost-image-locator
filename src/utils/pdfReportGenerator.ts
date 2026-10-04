import { jsPDF } from 'jspdf';
import { GeolocationAnalysisResult, ExifMetadata } from '../types';

export interface GeneratePdfParams {
  imageSrc?: string | null;
  result: GeolocationAnalysisResult;
  exif: ExifMetadata | null;
  websiteUrl?: string;
  sha256Hash?: string;
  caseId?: string;
}

/**
 * Ensures an image source is formatted as a Base64 dataURL compatible with jsPDF.
 */
async function toBase64DataUrl(src: string): Promise<{ dataUrl: string; format: 'JPEG' | 'PNG' }> {
  if (src.startsWith('data:image/png')) {
    return { dataUrl: src, format: 'PNG' };
  }
  if (src.startsWith('data:image/jpeg') || src.startsWith('data:image/jpg')) {
    return { dataUrl: src, format: 'JPEG' };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context no disponible'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      resolve({ dataUrl, format: 'JPEG' });
    };
    img.onerror = () => reject(new Error('Error cargando imagen para el reporte PDF'));
    img.src = src;
  });
}

export async function generateOsintPdfReport({
  imageSrc,
  result,
  exif,
  websiteUrl = 'https://unfantasmaenelsistema.com',
  sha256Hash,
  caseId: customCaseId,
}: GeneratePdfParams): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const caseId = customCaseId || `GEO-${Date.now().toString().slice(-6)}-${result.countryCode || 'INT'}`;
  const dateStr = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Helper for adding footer to all pages at the end
  const addPageFooters = () => {
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      // Bottom separator
      doc.setDrawColor(30, 41, 59);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);

      // Footer texts
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(
        'Un Fantasma en el Sistema | Inteligencia GEOINT & OSINT Forense | unfantasmaenelsistema.com',
        margin,
        pageHeight - 7,
      );
      doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
    }
  };

  // Helper to ensure vertical room or create new page
  const checkPageBreak = (neededHeight: number) => {
    if (y + neededHeight > pageHeight - 16) {
      doc.addPage();
      y = margin + 4;
    }
  };

  // ==========================================
  // 1. BRANDING HEADER
  // ==========================================
  doc.setFillColor(15, 23, 42); // slate-900
  doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'F');

  // Accent emerald border on the left
  doc.setFillColor(16, 185, 129); // emerald-500
  doc.rect(margin, y, 3, 22, 'F');

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(248, 250, 252);
  doc.text('UN FANTASMA EN EL SISTEMA - DOSSIER PERICIAL OSINT & GEOINT', margin + 6, y + 8);

  // Subtitle / Reference info
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(`Caso: ${caseId}  |  Fecha de Emisión: ${dateStr}  |  Motor: GeoSpecter Multimodal Forensics`, margin + 6, y + 16);

  // Classification Badge on top right
  doc.setFillColor(6, 78, 59); // emerald-900
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.2);
  doc.roundedRect(pageWidth - margin - 38, y + 4, 34, 14, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(110, 231, 183);
  doc.text('TRIANGULACIÓN', pageWidth - margin - 21, y + 9.5, { align: 'center' });
  doc.text(`${result.confidencePercent}% CERTEZA`, pageWidth - margin - 21, y + 14.5, { align: 'center' });

  y += 26;

  // ==========================================
  // 2. DICTAMEN DE GEOLOCALIZACIÓN WGS84
  // ==========================================
  doc.setFillColor(241, 245, 249); // slate-100
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setLineWidth(0.2);
  doc.roundedRect(margin, y, contentWidth, 28, 1.5, 1.5, 'FD');

  // Title of section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('1. DICTAMEN DE GEOLOCALIZACIÓN Y TRIANGULACIÓN (WGS84)', margin + 4, y + 5.5);

  // Location info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(16, 185, 129);
  const locationLabel = [result.city, result.region, result.country].filter(Boolean).join(', ') || result.approximateAddress;
  doc.text(locationLabel, margin + 4, y + 12);

  // Coordinates and Address
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  doc.text(`Coordenadas WGS84: ${result.latitude.toFixed(6)}°,  ${result.longitude.toFixed(6)}°`, margin + 4, y + 18);
  doc.text(`Dirección aproximada: ${result.approximateAddress}`, margin + 4, y + 23);

  // Right column: Radius, Level, Driving side
  doc.text(`Radio incertidumbre: ±${result.confidenceRadiusKm} km (${result.confidenceLevel})`, pageWidth - margin - 4, y + 18, { align: 'right' });
  doc.text(`Sentido de marcha: ${result.drivingSide === 'right' ? 'Derecha' : result.drivingSide === 'left' ? 'Izquierda' : 'Desconocido'} | Bioma: ${result.climateBiome || 'N/D'}`, pageWidth - margin - 4, y + 23, { align: 'right' });

  y += 32;

  // ==========================================
  // 3. EVIDENCIA FOTOGRÁFICA, EXIF & CADENA DE CUSTODIA (Two columns)
  // ==========================================
  const colWidth = (contentWidth - 6) / 2;
  const photoHeight = 56;

  // Photo column (Left)
  doc.setDrawColor(203, 213, 225);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, colWidth, photoHeight, 1.5, 1.5, 'FD');

  if (imageSrc) {
    try {
      const { dataUrl, format } = await toBase64DataUrl(imageSrc);
      doc.addImage(dataUrl, format, margin + 2, y + 2, colWidth - 4, photoHeight - 4, undefined, 'FAST');
    } catch (e) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(100, 116, 139);
      doc.text('Fotografía analizada adjunta al expediente', margin + colWidth / 2, y + photoHeight / 2, { align: 'center' });
    }
  }

  // EXIF & Cadena de Custodia column (Right)
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin + colWidth + 6, y, colWidth, photoHeight, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. METADATOS EXIF & CADENA DE CUSTODIA', margin + colWidth + 10, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  let exifY = y + 11.5;

  if (sha256Hash) {
    doc.setFont('courier', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(30, 41, 59);
    doc.text(`SHA-256: ${sha256Hash.slice(0, 32)}...`, margin + colWidth + 10, exifY);
    exifY += 4.5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
  }

  const hasGpsExif = Boolean(exif?.hasGps && exif.latitude && exif.longitude);
  doc.text(`• GPS en metadatos: ${hasGpsExif ? 'SÍ (Nativo)' : 'NO (Metadatos despojados/ausentes)'}`, margin + colWidth + 10, exifY);
  exifY += 4.5;

  if (hasGpsExif) {
    doc.text(`• Lat/Lng nativa: ${exif?.latitude?.toFixed(5)}, ${exif?.longitude?.toFixed(5)}`, margin + colWidth + 10, exifY);
    exifY += 4.5;
  }

  doc.text(`• Dispositivo/Cámara: ${[exif?.make, exif?.model].filter(Boolean).join(' ') || 'No especificado en cabecera'}`, margin + colWidth + 10, exifY);
  exifY += 4.5;

  doc.text(`• Fecha de captura: ${exif?.dateTime || 'No registrada en EXIF'}`, margin + colWidth + 10, exifY);
  exifY += 4.5;

  if (exif?.focalLength || exif?.iso) {
    doc.text(`• Óptica: Foco ${exif.focalLength || '-'}mm | ISO ${exif.iso || '-'} | f/${exif.fNumber || '-'}`, margin + colWidth + 10, exifY);
    exifY += 4.5;
  }

  if (exif?.software) {
    doc.text(`• Software de procesado: ${exif.software}`, margin + colWidth + 10, exifY);
    exifY += 4.5;
  }

  doc.text(`• Integridad de evidencia: Verificada por hash criptográfico`, margin + colWidth + 10, exifY);

  y += photoHeight + 7;

  // ==========================================
  // 4. CRONOLOCALIZACIÓN Y ESTIMACIONES TEMPORALES (Sombras & Fenología)
  // ==========================================
  if (result.chronoTimeline || result.chronolocation) {
    checkPageBreak(40);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text('3. ANÁLISIS TEMPORAL FORENSE: INCLINACIÓN DE SOMBRAS Y VEGETACIÓN', margin, y);
    y += 5;

    const textWidth = contentWidth - 8;
    const lineH = 3.6;

    if (result.chronoTimeline) {
      const ct = result.chronoTimeline;
      const ratioLines = doc.splitTextToSize(`Proporción de sombra: ${ct.shadowRatioDescription}`, textWidth);
      const vegLines = doc.splitTextToSize(`Especies y fenología: ${ct.vegetationSpecies} — ${ct.phenologicalStage}`, textWidth);
      const synLines = doc.splitTextToSize(`Dictamen temporal conjunto: ${ct.forensicSynthesis}`, textWidth);

      const timelineBoxHeight =
        6 + ratioLines.length * lineH + 3 +
        6 + vegLines.length * lineH + 3 +
        5 + synLines.length * lineH + 4;

      checkPageBreak(timelineBoxHeight + 6);

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, timelineBoxHeight, 1.5, 1.5, 'FD');

      let cy = y + 6;

      // Solar metrics line
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(180, 83, 9); // amber-700
      doc.text(`• Vector Solar: Hora ${ct.estimatedTimeWindow} | Inclinación: ${ct.shadowAngleDegrees}° | Azimut: ${ct.solarAzimuth}`, margin + 4, cy);
      cy += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(ratioLines, margin + 4, cy);
      cy += ratioLines.length * lineH + 3;

      // Botanical metrics line
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(5, 150, 105); // emerald-600
      doc.text(`• Vector Botánico: Ventana ${ct.estimatedDateWindow} (Mes cumbre: ${ct.peakMonth}) | Estación: ${ct.estimatedSeason}`, margin + 4, cy);
      cy += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(vegLines, margin + 4, cy);
      cy += vegLines.length * lineH + 3;

      // Forensic synthesis
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);
      doc.text(synLines, margin + 4, cy);

      y += timelineBoxHeight + 6;
    } else if (result.chronolocation) {
      const sunLines = doc.splitTextToSize(`Sombras/Azimut: ${result.chronolocation.sunPositionAnalysis}`, textWidth);
      const envLines = doc.splitTextToSize(`Pistas bioambientales: ${result.chronolocation.environmentalClues}`, textWidth);

      const boxHeight =
        6 + sunLines.length * lineH + 3 +
        6 + envLines.length * lineH + 4;

      checkPageBreak(boxHeight + 6);

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, boxHeight, 1.5, 1.5, 'FD');

      let cy = y + 6;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(180, 83, 9);
      doc.text(`• Hora solar estimada: ${result.chronolocation.estimatedTimeOfDay} (${result.chronolocation.timeConfidence})`, margin + 4, cy);
      cy += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(sunLines, margin + 4, cy);
      cy += sunLines.length * lineH + 3;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(5, 150, 105);
      doc.text(`• Estación y meses estimados: ${result.chronolocation.estimatedSeason} (${result.chronolocation.estimatedMonthRange})`, margin + 4, cy);
      cy += 5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text(envLines, margin + 4, cy);

      y += boxHeight + 6;
    }
  }

  // ==========================================
  // 5. PISTAS VISUALES FORENSES (OSINT)
  // ==========================================
  checkPageBreak(30);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('4. PISTAS VISUALES FORENSES Y RAZONAMIENTO INDUCTIVO', margin, y);
  y += 5;

  if (result.visualClues && result.visualClues.length > 0) {
    const clueTextWidth = contentWidth - 6;
    const clueLineH = 3.4;

    for (let i = 0; i < result.visualClues.length; i++) {
      const clue = result.visualClues[i];
      const obsLines = doc.splitTextToSize(`Observación: ${clue.observation}`, clueTextWidth);
      const dedLines = doc.splitTextToSize(`Deducción: ${clue.deduction}`, clueTextWidth);
      const clueBoxHeight = 7 + obsLines.length * clueLineH + 1.5 + dedLines.length * clueLineH + 2.5;

      checkPageBreak(clueBoxHeight + 3);

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(margin, y, contentWidth, clueBoxHeight, 1, 1, 'FD');

      // Category badge
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(16, 185, 129);
      doc.text(`[${clue.category.toUpperCase()}]`, margin + 3, y + 4.5);

      // Title & Impact
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text(clue.title, margin + 26, y + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(100, 116, 139);
      doc.text(`Impacto: ${clue.impact.toUpperCase()}`, pageWidth - margin - 4, y + 4.5, { align: 'right' });

      // Observation
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(71, 85, 105);
      let clueCy = y + 8.5;
      doc.text(obsLines, margin + 3, clueCy);
      clueCy += obsLines.length * clueLineH + 1.5;

      // Deduction
      doc.text(dedLines, margin + 3, clueCy);

      y += clueBoxHeight + 2.5;
    }
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('No se registraron pistas individuales estructuradas.', margin, y + 4);
    y += 8;
  }

  y += 3;

  // ==========================================
  // 6. PROTOCOLO Y RESULTADOS DE BÚSQUEDA INVERSA OSINT
  // ==========================================
  checkPageBreak(42);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('5. PROTOCOLO Y RESULTADOS DE BÚSQUEDA INVERSA OSINT MULTIMOTOR', margin, y);
  y += 5;

  // Suggested keywords line (computed first so the box can be sized to fit it)
  const terms = result.socialMediaSearchTerms && result.socialMediaSearchTerms.length > 0
    ? result.socialMediaSearchTerms.join(' | ')
    : `${result.city} ${result.country} ${result.approximateAddress}`;
  const termLines = doc.splitTextToSize(terms, contentWidth - 8);
  const reverseBoxHeight = 26 + termLines.length * 3.6 + 4;

  checkPageBreak(reverseBoxHeight + 6);

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, contentWidth, reverseBoxHeight, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(67, 56, 202); // indigo-700
  doc.text('• Motores de Reconocimiento Visual y Búsqueda Inversa Contrastados:', margin + 4, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(51, 65, 85);
  doc.text('1. Yandex Visual Search: Inspección de patrones arquitectónicos, paisajes y carreteras (Motor #1 GEOINT).', margin + 6, y + 11);
  doc.text('2. Google Lens: Reconocimiento de señalética comercial, marcas registradas y monumentos patrimoniales.', margin + 6, y + 15.5);
  doc.text('3. Bing Visual Search & TinEye: Verificación de primera indexación histórica en la red y trazabilidad de publicación.', margin + 6, y + 20);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('• Términos Clave Óptimos para Búsqueda Inversa y RRSS (X, Instagram, Reddit):', margin + 4, y + 26);

  doc.setFont('courier', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(termLines, margin + 4, y + 30.5);

  y += reverseBoxHeight + 6;

  // ==========================================
  // 7. CONCLUSIÓN INTEGRAL Y AUDITORÍA STREET VIEW
  // ==========================================
  checkPageBreak(42);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('6. CONCLUSIÓN PERICIAL INTEGRAL Y VERIFICACIÓN EN GOOGLE STREET VIEW', margin, y);
  y += 5;

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);

  const explanationLines = doc.splitTextToSize(result.overallExplanation || 'Sin explicación adicional.', contentWidth - 8);
  const boxHeight = Math.max(20, explanationLines.length * 3.8 + 14);
  checkPageBreak(boxHeight + 20);

  doc.roundedRect(margin, y, contentWidth, boxHeight, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text(explanationLines, margin + 4, y + 6);

  // Street view hint
  if (result.streetViewCoverageHint) {
    const hintY = y + boxHeight - 7;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(180, 83, 9);
    doc.text(`Pista Street View: ${result.streetViewCoverageHint}`, margin + 4, hintY);
  }

  y += boxHeight + 6;

  // Audit links
  checkPageBreak(20);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('ENLACES DIRECTOS PARA AUDITORÍA Y TRAZABILIDAD CARTOGRÁFICA', margin, y);
  y += 4.5;

  const mapsUrl = `https://www.google.com/maps?q=${result.latitude},${result.longitude}`;
  const streetViewUrl = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${result.latitude},${result.longitude}`;
  const osmUrl = `https://www.openstreetmap.org/?mlat=${result.latitude}&mlon=${result.longitude}#map=16/${result.latitude}/${result.longitude}`;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.2);
  doc.setTextColor(2, 132, 199); // sky-600

  doc.textWithLink(`• Google Maps: ${mapsUrl}`, margin + 3, y + 2, { url: mapsUrl });
  doc.textWithLink(`• Google Street View 360°: ${streetViewUrl}`, margin + 3, y + 6.5, { url: streetViewUrl });
  doc.textWithLink(`• OpenStreetMap: ${osmUrl}`, margin + 3, y + 11, { url: osmUrl });

  // Add all footers
  addPageFooters();

  // Trigger download
  const cleanCity = (result.city || result.country || 'Ubicacion').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `Reporte_OSINT_${cleanCity}_${caseId}.pdf`;
  doc.save(filename);
}
