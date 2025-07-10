// Emergency System Type Definitions - PER-42

export enum EmergencyType {
  MEDICAL = 'medical',
  NATURAL_DISASTER = 'natural_disaster',
  CRIME = 'crime',
  ACCIDENT = 'accident',
  WILDLIFE = 'wildlife',
  WEATHER = 'weather',
  WATER = 'water',
  FIRE = 'fire',
  TECHNICAL = 'technical',
  GENERAL = 'general',
}

export enum HazardLevel {
  CRITICAL = 'critical',
  EXTREME = 'extreme',
  HIGH = 'high',
  MODERATE = 'moderate',
  LOW = 'low',
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Step {
  order: number;
  action: string;
  duration?: string;
  critical: boolean;
  visualAid?: string;
  warning?: string;
}

export interface Translation {
  help_phrase: string;
  emergency_explanation: string;
  key_words: string[];
}

export interface EmergencyProtocol {
  id: string;
  type: EmergencyType;
  name: string;
  severity: 'critical' | 'urgent' | 'moderate';
  symptoms?: string[];
  triggers?: string[];
  immediateActions: Step[];
  doNotDo: string[];
  whenToEvacuate: string[];
  suppliesNeeded: string[];
  timeframe?: string;
  offlineAvailable: boolean;
  translations: Record<string, Translation>;
  relatedProtocols?: string[];
  visualGuides?: string[];
  audioInstructions?: string[];
}

export interface EmergencyContact {
  id: string;
  name: string;
  number: string;
  type: 'police' | 'medical' | 'fire' | 'embassy' | 'local_authority' | 'personal';
  country: string;
  region?: string;
  available24h: boolean;
  languages: string[];
  alternativeNumbers?: string[];
  textSupport?: boolean;
  appSupport?: string[];
  coordinates?: Coordinates;
  distance?: number;
}

export interface Region {
  name: string;
  coordinates: Coordinates;
  radius: number; // km
  season?: 'all' | 'summer' | 'winter' | 'spring' | 'fall';
}

export interface TimePeriod {
  start: string; // HH:mm format
  end: string;
  timezone?: string;
  seasonal?: boolean;
}

export interface WildlifeHazard {
  id: string;
  species: string;
  commonName: string;
  scientificName?: string;
  dangerLevel: HazardLevel;
  regions: Region[];
  activePeriods: TimePeriod[];
  habitats: string[];
  warningsSigns: string[];
  encounterProtocol: {
    immediateResponse: string[];
    doNotDo: string[];
    escapeStrategy: string;
    defensivePositions: string[];
    noiseResponse?: 'make_noise' | 'stay_quiet' | 'specific_sound';
    eyeContact?: 'maintain' | 'avoid' | 'intermittent';
  };
  attackFirstAid: string[];
  deterrents: string[];
  trackingTips?: string[];
  photo?: string;
  sounds?: string[];
  venomous?: boolean;
  diseaseCarrier?: boolean;
  aggressionTriggers?: string[];
}

export interface PlantHazard {
  id: string;
  name: string;
  scientificName: string;
  commonNames: string[];
  toxicityLevel: HazardLevel;
  poisonType: 'contact' | 'ingestion' | 'inhalation' | 'multiple';
  regions: Region[];
  habitat: string[];
  identificationFeatures: {
    leaves?: string;
    flowers?: string;
    fruits?: string;
    stem?: string;
    roots?: string;
    smell?: string;
    height?: string;
    seasonalChanges?: Record<string, string>;
  };
  symptoms: {
    contact?: string[];
    ingestion?: string[];
    inhalation?: string[];
  };
  treatment: {
    immediate: string[];
    doNotDo: string[];
    antidotes?: string[];
    hospitalRequired: boolean;
  };
  lookAlikes?: {
    name: string;
    difference: string;
    safe: boolean;
  }[];
  photos: string[];
  medicalUses?: string[];
  edibleParts?: string[];
}

export interface WaterSource {
  id: string;
  type: 'river' | 'lake' | 'spring' | 'tap' | 'well' | 'rain' | 'ocean';
  coordinates: Coordinates;
  name?: string;
  quality: 'safe' | 'treat_required' | 'unsafe' | 'unknown';
  contaminants?: string[];
  treatmentMethods: string[];
  lastTested?: Date;
  seasonalVariation?: boolean;
  localWarnings?: string[];
  alternativeSources?: string[];
}

export interface WeatherHazard {
  id: string;
  type: 'storm' | 'flood' | 'drought' | 'extreme_heat' | 'extreme_cold' | 'tornado' | 'hurricane' | 'wildfire' | 'avalanche' | 'other';
  severity: HazardLevel;
  region: Region;
  timeframe: {
    start: Date;
    end?: Date;
    confidence: number; // 0-100
  };
  warnings: string[];
  preparations: string[];
  duringEvent: string[];
  afterEvent: string[];
  evacuationRoutes?: Coordinates[];
  shelters?: EmergencyContact[];
  supplies: string[];
  communicationTips: string[];
}

export interface SafetyScore {
  overall: number; // 0-100
  breakdown: {
    crime: number;
    health: number;
    natural: number;
    infrastructure: number;
    political: number;
  };
  factors: string[];
  lastUpdated: Date;
  source: string;
  recommendations: string[];
}

export interface EmergencyKit {
  id: string;
  name: string;
  type: 'basic' | 'advanced' | 'specialized';
  items: {
    name: string;
    quantity: number;
    purpose: string;
    expiry?: Date;
    alternatives?: string[];
    priority: 'essential' | 'recommended' | 'optional';
  }[];
  totalWeight?: number; // kg
  totalVolume?: number; // liters
  environment: string[];
  duration: string; // e.g., "3 days", "1 week"
  personCount: number;
}

export interface MedicationReminder {
  id: string;
  userId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  times: string[];
  startDate: Date;
  endDate?: Date;
  refillDate?: Date;
  instructions?: string;
  sideEffects?: string[];
  interactions?: string[];
  missedDoseInstructions?: string;
  emergencyContact?: string;
  prescribedBy?: string;
  localEquivalents?: Record<string, string>; // country -> local name
}

export interface HealthCondition {
  id: string;
  userId: string;
  condition: string;
  severity: 'mild' | 'moderate' | 'severe';
  diagnosis_date?: Date;
  medications: string[];
  restrictions: string[];
  emergencyProtocol: string[];
  triggers?: string[];
  symptoms: string[];
  doctorNotes?: string;
  emergencyTranslation: Record<string, string>; // language -> explanation
}

export interface SOSMessage {
  id: string;
  userId: string;
  timestamp: Date;
  location: Coordinates;
  accuracy: number; // meters
  message: string;
  emergencyType: EmergencyType;
  contacts: string[];
  status: 'sent' | 'delivered' | 'failed' | 'cancelled';
  batteryLevel?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  photos?: string[];
  audioMessage?: string;
  medicalInfo?: HealthCondition[];
}

export interface EnvironmentalAlert {
  id: string;
  type: 'air_quality' | 'water_quality' | 'radiation' | 'chemical' | 'biological' | 'noise' | 'other';
  level: HazardLevel;
  location: Coordinates;
  radius: number; // km
  description: string;
  healthEffects: string[];
  precautions: string[];
  source: string;
  timestamp: Date;
  duration?: string;
  evacuationRequired: boolean;
  indoorShelter: boolean;
  maskRequired?: 'N95' | 'surgical' | 'gas_mask' | 'none';
}

export interface TravelAdvisory {
  id: string;
  country: string;
  region?: string;
  level: 'safe' | 'exercise_caution' | 'reconsider_travel' | 'do_not_travel';
  categories: {
    crime: HazardLevel;
    terrorism: HazardLevel;
    civil_unrest: HazardLevel;
    health: HazardLevel;
    natural_disasters: HazardLevel;
  };
  summary: string;
  details: string[];
  lastUpdated: Date;
  source: string;
  entryRequirements?: string[];
  exitRequirements?: string[];
  localLaws?: string[];
  culturalNotes?: string[];
}

export interface RiskAssessment {
  id: string;
  location: Coordinates;
  radius: number;
  timestamp: Date;
  overallRisk: HazardLevel;
  factors: {
    environmental: HazardLevel;
    wildlife: HazardLevel;
    weather: HazardLevel;
    health: HazardLevel;
    crime: HazardLevel;
    infrastructure: HazardLevel;
  };
  activeAlerts: EnvironmentalAlert[];
  recommendations: string[];
  mitigations: string[];
  alternativeRoutes?: Coordinates[][];
  safeZones?: Coordinates[];
  updateFrequency: number; // minutes
}

// Filter and search options
export interface EmergencyFilters {
  types?: EmergencyType[];
  severity?: Array<'critical' | 'urgent' | 'moderate'>;
  location?: {
    center: Coordinates;
    radius: number;
  };
  language?: string;
  offlineOnly?: boolean;
}

export interface SafetyFilters {
  hazardTypes?: Array<'wildlife' | 'plant' | 'water' | 'weather' | 'environmental'>;
  hazardLevels?: HazardLevel[];
  regions?: string[];
  timeOfDay?: string;
  season?: string;
}

// Constants
export const EMERGENCY_CONSTANTS = {
  MAX_SOS_CONTACTS: 5,
  SOS_MESSAGE_INTERVAL: 300, // seconds
  OFFLINE_CACHE_SIZE: 100, // MB
  RISK_UPDATE_INTERVAL: 3600, // seconds
  MEDICATION_REMINDER_ADVANCE: 30, // minutes
  EMERGENCY_BATTERY_THRESHOLD: 20, // percent
  MAX_OFFLINE_PROTOCOLS: 50,
  SOS_SOUND_DURATION: 60, // seconds
  FLASH_PATTERN: [500, 500, 500, 1500], // SOS morse code
} as const;

// Default emergency translations
export const DEFAULT_EMERGENCY_PHRASES = {
  en: {
    help: 'Help!',
    emergency: 'Emergency!',
    medical: 'I need medical help',
    police: 'Call the police',
    fire: 'Fire!',
    accident: 'There has been an accident',
  },
  es: {
    help: '¡Ayuda!',
    emergency: '¡Emergencia!',
    medical: 'Necesito ayuda médica',
    police: 'Llamen a la policía',
    fire: '¡Fuego!',
    accident: 'Ha habido un accidente',
  },
  fr: {
    help: 'Au secours!',
    emergency: 'Urgence!',
    medical: "J'ai besoin d'aide médicale",
    police: 'Appelez la police',
    fire: 'Au feu!',
    accident: 'Il y a eu un accident',
  },
  // Add more languages as needed
} as const;