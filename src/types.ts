export interface ExifMetadata {
  hasGps: boolean;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  make?: string;
  model?: string;
  dateTime?: string;
  software?: string;
  focalLength?: number;
  fNumber?: number;
  iso?: number;
  exposureTime?: number;
  rawTags?: Record<string, any>;
}

export interface VisualClue {
  category: 'flora' | 'architecture' | 'infrastructure' | 'signage' | 'sun_angle' | 'license_plates' | 'terrain' | 'streetview' | 'other';
  title: string;
  observation: string;
  deduction: string;
  impact: 'critical' | 'strong' | 'supporting';
}

export interface AlternativeCandidate {
  locationName: string;
  latitude: number;
  longitude: number;
  reason: string;
}

export interface ChronolocationEstimate {
  estimatedTimeOfDay: string;
  timeConfidence: 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW';
  sunPositionAnalysis: string;
  estimatedSeason: 'Primavera' | 'Verano' | 'Otoño' | 'Invierno' | 'Transición';
  estimatedMonthRange: string;
  seasonConfidence: 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW';
  environmentalClues: string;
  lightingConditions?: string;
}

export interface ChronoTimelinePoint {
  timeLabel: string;
  stageName: string;
  solarAngleDeg: number;
  isCaptureWindow?: boolean;
}

export interface MonthTimelinePoint {
  monthName: string;
  status: 'excluded' | 'possible' | 'likely' | 'peak';
  phenologyState?: string;
}

export interface ShadowVegetationChronology {
  estimatedTimeWindow: string;
  shadowAngleDegrees: number;
  shadowRatioDescription: string;
  solarAzimuth: string;
  solarElevationCategory: string;
  vegetationSpecies: string;
  phenologicalStage: string;
  botanicalDeduction: string;
  estimatedSeason: string;
  estimatedDateWindow: string;
  peakMonth: string;
  dailyTimeline: ChronoTimelinePoint[];
  annualTimeline: MonthTimelinePoint[];
  forensicSynthesis: string;
}

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
  visualClues: VisualClue[];
  overallExplanation: string;
  climateBiome?: string;
  drivingSide?: 'right' | 'left' | 'unknown';
  streetViewCoverageHint?: string;
  socialMediaHints?: string[];
  socialMediaSearchTerms?: string[];
  alternativeCandidates?: AlternativeCandidate[];
  googleMapsSearchQuery: string;
  chronolocation?: ChronolocationEstimate;
  chronoTimeline?: ShadowVegetationChronology;
}

export interface SampleImage {
  id: string;
  name: string;
  category: string;
  description: string;
  url: string;
  expectedLocation: string;
  hints: string[];
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  imageSrc: string;
  thumbnailSrc: string;
  result: GeolocationAnalysisResult;
  exif: ExifMetadata | null;
  locationTitle: string;
  confidencePercent: number;
  confidenceLevel: 'VERY_HIGH' | 'HIGH' | 'MEDIUM' | 'LOW';
}
