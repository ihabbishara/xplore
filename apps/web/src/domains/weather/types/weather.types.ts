export interface WeatherData {
  temp: number
  feelsLike: number
  tempMin: number
  tempMax: number
  humidity: number
  windSpeed: number
  windDirection: number
  pressure: number
  visibility: number
  clouds: number
  condition: string
  conditionDescription: string
  icon: string
  uvIndex?: number
  precipitation?: number
  snow?: number
  timestamp?: Date
  provider?: string
}

export interface HourlyWeather extends WeatherData {
  hour: Date
  precipitationProbability?: number
}

export interface DailyWeather {
  date: Date
  sunrise: Date
  sunset: Date
  moonPhase?: number
  temp: {
    min: number
    max: number
    day: number
    night: number
    eve: number
    morn: number
  }
  feelsLike: {
    day: number
    night: number
    eve: number
    morn: number
  }
  humidity: number
  windSpeed: number
  windDirection: number
  pressure: number
  clouds: number
  precipitation?: number
  precipitationProbability?: number
  snow?: number
  uvIndex?: number
  condition: string
  conditionDescription: string
  icon: string
}

export interface WeatherAlert {
  id: string
  sender: string
  event: string
  start: Date
  end: Date
  description: string
  severity: 'minor' | 'moderate' | 'severe' | 'extreme'
}

export interface WeatherRangeSummary {
  summary: string
  averageTemp: number
  minTemp: number
  maxTemp: number
  rainProbability: number
  snowProbability: number
  humidity: number
  windSpeed: number
  uvIndex: number
  daily: DailyWeather[]
  hourly?: HourlyWeather[]
  alerts?: WeatherAlert[]
}

export interface ClimateData {
  locationId: string
  month: number
  avgTemp: number
  avgMinTemp: number
  avgMaxTemp: number
  avgPrecipitation: number
  avgHumidity: number
  avgWindSpeed: number
  avgSunnyDays: number
  avgRainyDays: number
  avgSnowyDays: number
  avgUvIndex: number
  comfortScore: number
}

export interface WeatherPreferences {
  userId: string
  idealTempMin: number
  idealTempMax: number
  avoidRain: boolean
  avoidSnow: boolean
  avoidHighHumidity: boolean
  avoidStrongWind: boolean
  preferSunny: boolean
  alertsEnabled: boolean
  alertTypes: string[]
}

export interface WeatherComparison {
  locationId: string
  locationName: string
  coordinates: {
    latitude: number
    longitude: number
  }
  currentWeather: WeatherData
  forecast: WeatherRangeSummary
  climateData?: ClimateData[]
  score: number
  pros: string[]
  cons: string[]
}

export interface WeatherActivityRecommendation {
  activity: string
  category: 'outdoor' | 'indoor' | 'travel' | 'sports' | 'leisure'
  suitability: number
  reason: string
  bestTime?: Date
  alternativeActivities?: string[]
}

export interface WeatherState {
  currentWeather: {
    [key: string]: WeatherData // Keyed by "lat,lon"
  }
  forecasts: {
    [key: string]: WeatherRangeSummary // Keyed by "lat,lon,days"
  }
  climateData: {
    [locationId: string]: ClimateData[]
  }
  comparisons: WeatherComparison[]
  preferences: WeatherPreferences | null
  loading: boolean
  error: string | null
}