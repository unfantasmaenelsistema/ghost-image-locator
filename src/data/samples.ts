import { SampleImage } from '../types';

export const SAMPLE_IMAGES: SampleImage[] = [
  {
    id: 'tokyo-shinjuku',
    name: 'Callejón en Shinjuku / Akihabara',
    category: 'Asia Urbana',
    description: 'Comercios de electrónica y ramen con neones en kanji/katakana, cableado aéreo denso característico de Japón y circulación por la izquierda.',
    url: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
    expectedLocation: 'Tokio, Japón',
    hints: ['Caracteres Kanji/Kana', 'Transformadores en postes eléctricos', 'Conducción por la izquierda', 'Máquinas expendedoras'],
  },
  {
    id: 'paris-eiffel',
    name: 'Perspectiva del Río Sena y Torre Eiffel',
    category: 'Europa Occidental',
    description: 'Arquitectura clásica de piedra caliza haussmanniana, tejados de zinc parisinos, puente sobre el Sena y la Torre Eiffel en el fondo.',
    url: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
    expectedLocation: 'París, Francia',
    hints: ['Tejados de zinc gris', 'Estructura de hierro pudelado', 'Río Sena', 'Boulangerie / Señales en francés'],
  },
  {
    id: 'santorini-caldera',
    name: 'Cúpulas Azules de Oia en Santorini',
    category: 'Mediterráneo',
    description: 'Pueblo encalado en acantilado volcánico con cúpulas de azul cobalto, campanarios cicládicos y vista a la caldera del Mar Egeo.',
    url: 'https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1200&q=80',
    expectedLocation: 'Santorini, Cícladas, Grecia',
    hints: ['Arquitectura cicládica blanca', 'Cúpulas azul cobalto', 'Paredes de roca volcánica', 'Mar Egeo'],
  },
  {
    id: 'nyc-manhattan',
    name: 'Avenida de Manhattan y Taxis Amarillos',
    category: 'Norteamérica',
    description: 'Típicos taxis amarillos de Nueva York, rascacielos art déco y contemporáneos, señales de calle verdes rectangulares y bocas de incendios neoyorquinas.',
    url: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?auto=format&fit=crop&w=1200&q=80',
    expectedLocation: 'Nueva York, EE. UU.',
    hints: ['Yellow Cabs (Crown Victoria / Camry)', 'Semáforos con caja amarilla', 'Escaleras de incendios en fachadas', 'Tráfico cuadriculado'],
  },
  {
    id: 'madrid-granvia',
    name: 'Gran Vía y Edificio Metrópolis',
    category: 'Europa del Sur',
    description: 'Emblemático cruce de la Gran Vía y calle Alcalá en Madrid con cúpula de pizarra y pan de oro, semáforos españoles y letreros en castellano.',
    url: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1200&q=80',
    expectedLocation: 'Madrid, España',
    hints: ['Edificio Metrópolis', 'Cúpula con estatua de la Victoria alada', 'Matrículas con banda azul europea E', 'Idioma español'],
  },
];
