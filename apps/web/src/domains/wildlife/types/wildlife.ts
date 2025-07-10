// Wildlife Tracking Type Definitions - PER-37

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface DateTimeRange {
  start: Date;
  end: Date;
}

export enum ConservationStatus {
  EXTINCT = 'extinct',
  EXTINCT_IN_WILD = 'extinct_in_wild',
  CRITICALLY_ENDANGERED = 'critically_endangered',
  ENDANGERED = 'endangered',
  VULNERABLE = 'vulnerable',
  NEAR_THREATENED = 'near_threatened',
  LEAST_CONCERN = 'least_concern',
  DATA_DEFICIENT = 'data_deficient',
}

export enum ActivityPeriod {
  DAWN = 'dawn',
  MORNING = 'morning',
  MIDDAY = 'midday',
  AFTERNOON = 'afternoon',
  DUSK = 'dusk',
  NIGHT = 'night',
  ALL_DAY = 'all_day',
}

export enum Season {
  SPRING = 'spring',
  SUMMER = 'summer',
  FALL = 'fall',
  WINTER = 'winter',
  YEAR_ROUND = 'year_round',
}

export enum HabitatType {
  FOREST = 'forest',
  GRASSLAND = 'grassland',
  WETLAND = 'wetland',
  MOUNTAIN = 'mountain',
  DESERT = 'desert',
  COASTAL = 'coastal',
  URBAN = 'urban',
  AGRICULTURAL = 'agricultural',
  FRESHWATER = 'freshwater',
  MARINE = 'marine',
}

export enum BehaviorType {
  FEEDING = 'feeding',
  RESTING = 'resting',
  HUNTING = 'hunting',
  MATING = 'mating',
  NESTING = 'nesting',
  MIGRATING = 'migrating',
  TERRITORIAL = 'territorial',
  SOCIAL = 'social',
  GROOMING = 'grooming',
  PLAYING = 'playing',
}

export enum VerificationStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  EXPERT_VERIFIED = 'expert_verified',
  DISPUTED = 'disputed',
  REJECTED = 'rejected',
}

export enum MigrationStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  DELAYED = 'delayed',
}

export enum DisputeReason {
  MISIDENTIFICATION = 'misidentification',
  LOCATION_ERROR = 'location_error',
  DATE_TIME_ERROR = 'date_time_error',
  BEHAVIOR_UNLIKELY = 'behavior_unlikely',
  PHOTO_QUALITY = 'photo_quality',
  OTHER = 'other',
}

export enum VerificationAction {
  VERIFY = 'verify',
  REJECT = 'reject',
  DISPUTE = 'dispute',
  REQUEST_MORE_INFO = 'request_more_info',
}

export interface WeatherConditions {
  temperature: number;
  conditions: string;
  visibility: number;
  windSpeed: number;
  cloudCover: number;
  precipitation: number;
}

// Main Wildlife Species Interface
export interface WildlifeSpecies {
  id: string;
  commonName: string;
  scientificName: string;
  family: string;
  order: string;
  description: string;
  conservationStatus: ConservationStatus;
  nativeRegions: string[];
  
  // Physical characteristics
  size: {
    length: { min: number; max: number; unit: string };
    weight: { min: number; max: number; unit: string };
    wingspan?: { min: number; max: number; unit: string };
  };
  
  // Identification
  identificationFeatures: string[];
  distinctiveMarks: string[];
  similarSpecies: string[];
  
  // Behavior
  activityPeriods: ActivityPeriod[];
  seasonalBehavior: {
    season: Season;
    behavior: string[];
    locations?: string[];
  }[];
  diet: string[];
  sounds?: string[];
  
  // Habitat
  preferredHabitats: HabitatType[];
  altitudeRange?: { min: number; max: number };
  territorySize?: number; // in km²
  
  // Photography
  photographyTips: {
    recommendedDistance: number; // meters
    bestTime: ActivityPeriod[];
    behavioralCues: string[];
    equipmentTips: string[];
    ethicalGuidelines: string[];
  };
  
  // Safety
  dangerLevel: 'harmless' | 'low' | 'moderate' | 'high' | 'extreme';
  safetyGuidelines: string[];
  warningBehaviors: string[];
  
  // Media
  photos: {
    thumbnail: string;
    gallery: string[];
    habitats: string[];
    behaviors: Record<BehaviorType, string[]>;
  };
  
  // Additional info
  interestingFacts: string[];
  culturalSignificance?: string;
  populationTrend: 'increasing' | 'stable' | 'decreasing' | 'unknown';
}

// Wildlife Sighting Interface
export interface WildlifeSighting {
  id: string;
  userId: string;
  userName?: string;
  userAvatar?: string;
  
  // Species info
  speciesId: string;
  species: string;
  scientificName?: string;
  
  // Location & time
  location: Coordinates;
  locationName?: string;
  timestamp: Date;
  
  // Sighting details
  count: number;
  behavior: BehaviorType[];
  habitatType: HabitatType;
  distance: number; // meters from observer
  duration: number; // minutes observed
  
  // Conditions
  weatherConditions: WeatherConditions;
  moonPhase?: number; // 0-1
  
  // Evidence
  photos?: string[];
  videos?: string[];
  audioRecordings?: string[];
  notes?: string;
  
  // Verification
  verificationStatus: VerificationStatus;
  verifiedBy?: string;
  verificationDate?: Date;
  verificationNotes?: string;
  
  // Community
  likes: number;
  comments: number;
  shares: number;
  isPublic: boolean;
  hidePreciseLocation: boolean; // for sensitive species
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  reportQuality: 'low' | 'medium' | 'high' | 'excellent';
}

// Migration Pattern Interface
export interface MigrationPattern {
  id: string;
  speciesId: string;
  name: string;
  description: string;
  
  // Route
  route: {
    waypoints: Coordinates[];
    corridorWidth: number; // km
    totalDistance: number; // km
  };
  
  // Timing
  timing: {
    springMigration?: DateTimeRange;
    fallMigration?: DateTimeRange;
    peakDates?: Date[];
  };
  
  // Stops
  majorStops: {
    location: Coordinates;
    name: string;
    stayDuration: number; // average days
    habitat: HabitatType[];
    importance: 'critical' | 'major' | 'minor';
  }[];
  
  // Population
  populationEstimate?: {
    min: number;
    max: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  };
  
  // Factors
  influencingFactors: string[];
  threats: string[];
  conservationEfforts: string[];
}

// Wildlife Activity Pattern
export interface ActivityPattern {
  speciesId: string;
  period: ActivityPeriod;
  probability: number; // 0-1
  seasonalVariation: Record<Season, number>;
  weatherImpact: {
    factor: string;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
  }[];
  moonPhaseImpact?: {
    newMoon: number;
    fullMoon: number;
    description: string;
  };
}

// Photography Hide/Blind
export interface WildlifeHide {
  id: string;
  name: string;
  location: Coordinates;
  type: 'permanent' | 'portable' | 'natural' | 'vehicle';
  
  // Access
  accessInfo: {
    difficulty: 'easy' | 'moderate' | 'difficult';
    walkingDistance: number; // meters
    requiresBooking: boolean;
    bookingInfo?: string;
    fees?: number;
    openHours?: string;
  };
  
  // Facilities
  facilities: {
    capacity: number;
    wheelchairAccessible: boolean;
    amenities: string[];
    photographyWindows: number;
    viewingAngles: string[];
  };
  
  // Wildlife
  commonSpecies: string[];
  bestSeasons: Season[];
  bestTimes: ActivityPeriod[];
  recentSightings?: WildlifeSighting[];
  
  // Reviews
  rating: number;
  reviewCount: number;
  photos: string[];
}

// Sighting Statistics
export interface SightingStatistics {
  speciesId: string;
  location?: Coordinates;
  radius?: number; // km
  timeRange: DateTimeRange;
  
  totalSightings: number;
  uniqueObservers: number;
  averageCount: number;
  
  // Temporal patterns
  sightingsByHour: Record<number, number>;
  sightingsByMonth: Record<number, number>;
  sightingsBySeason: Record<Season, number>;
  
  // Behavioral observations
  behaviorFrequency: Record<BehaviorType, number>;
  
  // Environmental correlations
  weatherCorrelations: {
    temperature: { optimal: number; range: [number, number] };
    conditions: Record<string, number>;
  };
  
  // Hotspots
  hotspots: {
    location: Coordinates;
    sightingCount: number;
    lastSeen: Date;
  }[];
}

// Community Features
export interface SightingComment {
  id: string;
  sightingId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  timestamp: Date;
  likes: number;
  isExpert: boolean;
}

export interface SightingVerification {
  sightingId: string;
  verifierId: string;
  verifierName: string;
  isExpert: boolean;
  status: VerificationStatus;
  confidence: number; // 0-1
  notes?: string;
  timestamp: Date;
}

// Equipment Recommendation
export interface EquipmentRecommendation {
  category: 'optics' | 'camera' | 'clothing' | 'safety' | 'other';
  items: {
    name: string;
    description: string;
    priceRange: string;
    recommended: boolean;
    notes?: string;
  }[];
}

// Filter Options
export interface WildlifeFilters {
  species?: string[];
  conservationStatus?: ConservationStatus[];
  habitats?: HabitatType[];
  activityPeriods?: ActivityPeriod[];
  seasons?: Season[];
  verificationStatus?: VerificationStatus[];
  dateRange?: DateTimeRange;
  location?: {
    center: Coordinates;
    radius: number;
  };
  behaviorTypes?: BehaviorType[];
  minimumCount?: number;
  hasPhotos?: boolean;
}

// Constants
export const WILDLIFE_CONSTANTS = {
  MIN_SAFE_DISTANCE: 50, // meters
  MAX_SIGHTING_PHOTOS: 10,
  VERIFICATION_THRESHOLD: 3, // number of verifications needed
  EXPERT_WEIGHT: 3, // expert verification weight
  SENSITIVE_SPECIES_BLUR_RADIUS: 5, // km
  ACTIVITY_PREDICTION_CONFIDENCE: 0.7,
  MIGRATION_CORRIDOR_WIDTH: 50, // km default
  CACHE_DURATION: 3600, // seconds
} as const;

// Conservation Status Colors
export const CONSERVATION_STATUS_COLORS: Record<ConservationStatus, string> = {
  [ConservationStatus.EXTINCT]: '#000000',
  [ConservationStatus.EXTINCT_IN_WILD]: '#3B0000',
  [ConservationStatus.CRITICALLY_ENDANGERED]: '#CC0000',
  [ConservationStatus.ENDANGERED]: '#FF6600',
  [ConservationStatus.VULNERABLE]: '#FFCC00',
  [ConservationStatus.NEAR_THREATENED]: '#99CC00',
  [ConservationStatus.LEAST_CONCERN]: '#006600',
  [ConservationStatus.DATA_DEFICIENT]: '#999999',
};

// Activity Period Times
export const ACTIVITY_PERIOD_TIMES = {
  [ActivityPeriod.DAWN]: { start: -60, end: 30 }, // minutes relative to sunrise
  [ActivityPeriod.MORNING]: { start: 30, end: 300 },
  [ActivityPeriod.MIDDAY]: { start: 300, end: 480 },
  [ActivityPeriod.AFTERNOON]: { start: 480, end: -90 }, // relative to sunset
  [ActivityPeriod.DUSK]: { start: -90, end: 30 },
  [ActivityPeriod.NIGHT]: { start: 30, end: -60 },
};

// Verification History Interface
export interface VerificationHistory {
  id: string;
  sightingId: string;
  action: VerificationAction;
  userId: string;
  userName: string;
  timestamp: Date;
  notes?: string;
  previousStatus: VerificationStatus;
  newStatus: VerificationStatus;
}

// Expert Profile Interface
export interface ExpertProfile {
  userId: string;
  name: string;
  avatar?: string;
  specializations: string[];
  verificationCount: number;
  accuracyRate: number;
  joinedDate: Date;
  badges: string[];
  bio?: string;
}

// Verification Criteria Interface
export interface VerificationCriteria {
  id: string;
  name: string;
  description: string;
  weight: number;
  required: boolean;
  type: 'photo_quality' | 'location_accuracy' | 'behavior_match' | 'time_plausibility' | 'species_identification';
}

// Safety Types
export enum DangerLevel {
  LOW = 'low',
  MODERATE = 'moderate',
  HIGH = 'high',
  EXTREME = 'extreme',
}

export interface WarningSigns {
  sign: string;
  description: string;
  dangerLevel: DangerLevel;
}

export interface SafetyProtocol {
  id: string;
  title: string;
  steps: string[];
  equipment?: string[];
  emergencyActions: string[];
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  type: 'ranger' | 'hospital' | 'poison_control' | 'wildlife_rescue';
  available24x7: boolean;
  location?: Coordinates;
}