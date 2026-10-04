# 🌍 GeoSpecter OSINT - Visual & EXIF Photo Geolocation
### Creado por [Un Fantasma en el Sistema](https://www.unfantasmaenelsistema.com/)

Herramienta de geolocalización e inteligencia geoespacial (GEOINT / OSINT) multiplataforma (Windows y Linux). Permite cargar cualquier fotografía y deducir su ubicación en el mapa combinando **metadatos forenses EXIF** y el poder de **Google Gemini 3.8 Flash Multimodal Vision**.

Sitio Web Oficial: [www.unfantasmaenelsistema.com](https://www.unfantasmaenelsistema.com/)

---

## 🖼️ Capturas de Pantalla

<table>
  <tr>
    <td><img src="docs/screenshots/01-landing.png" alt="Pantalla de inicio: subir una fotografía para geolocalizarla"></td>
    <td><img src="docs/screenshots/02-samples.png" alt="Galería de fotos de muestra para probar el motor OSINT"></td>
  </tr>
  <tr>
    <td colspan="2"><img src="docs/screenshots/03-forensic-analysis.png" alt="Visor forense con filtros, cadena de custodia SHA-256 e inspección de metadatos EXIF"></td>
  </tr>
</table>

---

## ⚡ Características Principales

1. **Doble Motor de Detección:**
   - **Motor 1 (Forense EXIF/XMP):** Si la fotografía fue tomada con un móvil o cámara con GPS activado y no ha sido limpiada por redes sociales, extrae directamente las coordenadas de hardware WGS84, fecha y hora exacta, modelo de cámara y parámetros ópticos.
   - **Motor 2 (Inteligencia Visual Google Gemini):** Si la foto no tiene GPS o para contrastarla, Gemini 3.8 Flash analiza bolardos viales específicos de cada país, tipos de matrículas, arquitectura y tejados, flora y bioma climático, sentido de circulación (izquierda vs derecha), señalética, idioma y ángulo solar con sombras.
2. **Mapa Interactivo Multicapa (Leaflet):**
   - Modo Táctico Oscuro (CartoDB Dark).
   - Modo Satélite de Alta Resolución (Esri World Imagery) para examinar azoteas y carreteras reales.
   - Modo Calles y Carreteras (OpenStreetMap).
   - Visualización de radio de incertidumbre y línea de discrepancia entre EXIF e IA.
   - Acceso directo a **Google Maps**, **Google Street View** y **Google Earth 3D**.
3. **Visor de Imágenes con Filtros Forenses:**
   - Filtro de Alto Contraste (para leer letreros o matrículas lejanas).
   - Inversión de Color (para textos tenues o grafitis).
   - Realce de Bordes y zoom óptico hasta 3x.
4. **Dossier e Informes Exportables:**
   - Exportación de informe técnico en JSON e impresión en PDF.
5. **Listo para GitHub & Multiplataforma (Windows y Linux):**
   - Incluye lanzadores automáticos de 1 clic: `run.bat` para Windows y `run.sh` para Linux/macOS.

---

## 🚀 Instalación y Puesta en Marcha

### Prerrequisitos
- **Node.js** (v18 o superior) instalado en el equipo.
- Una clave API de Google Gemini (puedes obtenerla gratis en [Google AI Studio](https://aistudio.google.com/)).

---

### En Windows (1 Clic)
1. Clona el repositorio:
   ```cmd
   git clone https://github.com/TU_USUARIO/geospecter-osint.git
   cd geospecter-osint
   ```
2. Haz doble clic en el archivo **`run.bat`** (o ejecútalo desde CMD/PowerShell).
3. El script comprobará dependencias, creará el `.env` y abrirá la aplicación en tu navegador en `http://localhost:3000`.

---

### En Linux / macOS
1. Clona el repositorio:
   ```bash
   git clone https://github.com/TU_USUARIO/geospecter-osint.git
   cd geospecter-osint
   ```
2. Da permisos de ejecución al script y lánzalo:
   ```bash
   chmod +x run.sh
   ./run.sh
   ```
3. El script instalará las dependencias y abrirá la aplicación en `http://localhost:3000`.

---

### Configuración de la API Key (.env)
Crea o edita el archivo `.env` en la raíz del proyecto:
```env
GEMINI_API_KEY="AIzaSy..."
PORT=3000
```

---

## 🛠️ Tecnologías Empleadas
- **Frontend:** React 19, TypeScript, Tailwind CSS, Leaflet, Lucide Icons, Motion.
- **Backend:** Node.js, Express, tsx.
- **IA y Visión Espacial:** `@google/genai` (Gemini 3.8 Flash).
- **Filtros Forenses EXIF:** `exifr`.

---

## 📄 Licencia
Distribuido bajo licencia MIT. Desarrollado con fines de investigación OSINT, formativos y educativos.
