import { WeatherData, DailyWeather, WeatherRangeSummary } from '../types/weather.types'

export class WeatherUtils {
  /**
   * Convert temperature between units
   */
  static convertTemperature(temp: number, from: 'C' | 'F' | 'K', to: 'C' | 'F' | 'K'): number {
    if (from === to) return temp

    // Convert to Celsius first
    let celsius = temp
    if (from === 'F') {
      celsius = (temp - 32) * 5 / 9
    } else if (from === 'K') {
      celsius = temp - 273.15
    }

    // Convert from Celsius to target unit
    if (to === 'F') {
      return celsius * 9 / 5 + 32
    } else if (to === 'K') {
      return celsius + 273.15
    }

    return celsius
  }

  /**
   * Convert wind speed between units
   */
  static convertWindSpeed(speed: number, from: 'kmh' | 'mph' | 'ms', to: 'kmh' | 'mph' | 'ms'): number {
    if (from === to) return speed

    // Convert to km/h first
    let kmh = speed
    if (from === 'mph') {
      kmh = speed * 1.60934
    } else if (from === 'ms') {
      kmh = speed * 3.6
    }

    // Convert from km/h to target unit
    if (to === 'mph') {
      return kmh / 1.60934
    } else if (to === 'ms') {
      return kmh / 3.6
    }

    return kmh
  }

  /**
   * Calculate heat index (feels like temperature)
   */
  static calculateHeatIndex(temp: number, humidity: number): number {
    // Convert to Fahrenheit for calculation
    const tempF = this.convertTemperature(temp, 'C', 'F')
    
    if (tempF < 80) return temp

    const heatIndex = -42.379 + 
      2.04901523 * tempF + 
      10.14333127 * humidity - 
      0.22475541 * tempF * humidity - 
      0.00683783 * tempF * tempF - 
      0.05481717 * humidity * humidity + 
      0.00122874 * tempF * tempF * humidity + 
      0.00085282 * tempF * humidity * humidity - 
      0.00000199 * tempF * tempF * humidity * humidity

    // Convert back to Celsius
    return this.convertTemperature(heatIndex, 'F', 'C')
  }

  /**
   * Calculate wind chill
   */
  static calculateWindChill(temp: number, windSpeed: number): number {
    if (temp > 10 || windSpeed < 4.8) return temp

    const windKmh = windSpeed
    const windChill = 13.12 + 0.6215 * temp - 11.37 * Math.pow(windKmh, 0.16) + 
                      0.3965 * temp * Math.pow(windKmh, 0.16)

    return Math.round(windChill * 10) / 10
  }

  /**
   * Get weather condition category
   */
  static getWeatherCategory(condition: string): 'clear' | 'cloudy' | 'rain' | 'snow' | 'storm' | 'fog' {
    const conditionLower = condition.toLowerCase()
    
    if (conditionLower.includes('clear') || conditionLower.includes('sunny')) {
      return 'clear'
    } else if (conditionLower.includes('cloud') || conditionLower.includes('overcast')) {
      return 'cloudy'
    } else if (conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
      return 'rain'
    } else if (conditionLower.includes('snow') || conditionLower.includes('sleet')) {
      return 'snow'
    } else if (conditionLower.includes('storm') || conditionLower.includes('thunder')) {
      return 'storm'
    } else if (conditionLower.includes('fog') || conditionLower.includes('mist')) {
      return 'fog'
    }
    
    return 'cloudy'
  }

  /**
   * Get UV index category and recommendations
   */
  static getUVCategory(uvIndex: number): {
    level: string
    color: string
    protection: string
  } {
    if (uvIndex < 3) {
      return {
        level: 'Low',
        color: 'green',
        protection: 'No protection needed'
      }
    } else if (uvIndex < 6) {
      return {
        level: 'Moderate',
        color: 'yellow',
        protection: 'Seek shade during midday hours'
      }
    } else if (uvIndex < 8) {
      return {
        level: 'High',
        color: 'orange',
        protection: 'Wear sunscreen SPF 30+, hat and sunglasses'
      }
    } else if (uvIndex < 11) {
      return {
        level: 'Very High',
        color: 'red',
        protection: 'Take all precautions, avoid sun exposure 10am-4pm'
      }
    } else {
      return {
        level: 'Extreme',
        color: 'purple',
        protection: 'Avoid sun exposure, seek shade, wear protective clothing'
      }
    }
  }

  /**
   * Calculate visibility category
   */
  static getVisibilityCategory(visibility: number): string {
    const visKm = visibility / 1000
    
    if (visKm >= 10) return 'Excellent'
    else if (visKm >= 5) return 'Good'
    else if (visKm >= 2) return 'Moderate'
    else if (visKm >= 1) return 'Poor'
    else return 'Very Poor'
  }

  /**
   * Get precipitation intensity
   */
  static getPrecipitationIntensity(mmPerHour: number): string {
    if (mmPerHour === 0) return 'None'
    else if (mmPerHour < 2.5) return 'Light'
    else if (mmPerHour < 10) return 'Moderate'
    else if (mmPerHour < 50) return 'Heavy'
    else return 'Extreme'
  }

  /**
   * Calculate daily comfort score
   */
  static calculateDailyComfort(day: DailyWeather): number {
    let score = 100

    // Temperature factor (ideal: 20-25°C)
    const avgTemp = (day.temp.min + day.temp.max) / 2
    if (avgTemp < 15 || avgTemp > 30) {
      score -= Math.abs(avgTemp - 22.5) * 2
    }

    // Humidity factor (ideal: 40-60%)
    if (day.humidity < 30 || day.humidity > 70) {
      score -= Math.abs(day.humidity - 50) * 0.5
    }

    // Wind factor (penalize strong winds)
    if (day.windSpeed > 20) {
      score -= (day.windSpeed - 20) * 0.5
    }

    // Precipitation factor
    if (day.precipitation && day.precipitation > 0) {
      score -= Math.min(day.precipitation * 2, 30)
    }

    // UV factor (moderate UV is acceptable)
    if (day.uvIndex && day.uvIndex > 8) {
      score -= (day.uvIndex - 8) * 2
    }

    return Math.max(0, Math.min(100, score))
  }

  /**
   * Find best days in forecast
   */
  static findBestDays(forecast: WeatherRangeSummary, count: number = 3): DailyWeather[] {
    return forecast.daily
      .map(day => ({
        ...day,
        comfortScore: this.calculateDailyComfort(day)
      }))
      .sort((a, b) => (b as any).comfortScore - (a as any).comfortScore)
      .slice(0, count)
  }

  /**
   * Get weather icon URL
   */
  static getWeatherIconUrl(icon: string, size: '1x' | '2x' | '4x' = '2x'): string {
    // OpenWeatherMap icon format
    if (icon.match(/^\d{2}[dn]$/)) {
      return `https://openweathermap.org/img/wn/${icon}@${size}.png`
    }
    
    // WeatherAPI icon format
    if (icon.startsWith('//cdn.weatherapi.com')) {
      return `https:${icon}`
    }
    
    return icon
  }

  /**
   * Format weather description
   */
  static formatWeatherDescription(weather: WeatherData): string {
    const temp = Math.round(weather.temp)
    const feelsLike = Math.round(weather.feelsLike)
    
    let description = `${temp}°C`
    
    if (Math.abs(temp - feelsLike) > 2) {
      description += ` (feels like ${feelsLike}°C)`
    }
    
    description += `, ${weather.condition}`
    
    if (weather.precipitation && weather.precipitation > 0) {
      description += `, ${this.getPrecipitationIntensity(weather.precipitation)} rain`
    }
    
    return description
  }

  /**
   * Check if weather is suitable for outdoor activities
   */
  static isOutdoorWeatherSuitable(weather: WeatherData): {
    suitable: boolean
    reasons: string[]
  } {
    const reasons: string[] = []
    let suitable = true

    // Temperature check
    if (weather.temp < 5 || weather.temp > 35) {
      suitable = false
      reasons.push(`Temperature ${weather.temp}°C is outside comfortable range`)
    }

    // Precipitation check
    if (weather.precipitation && weather.precipitation > 5) {
      suitable = false
      reasons.push('Heavy precipitation expected')
    }

    // Wind check
    if (weather.windSpeed > 30) {
      suitable = false
      reasons.push('Strong winds make outdoor activities difficult')
    }

    // Visibility check
    if (weather.visibility < 1000) {
      suitable = false
      reasons.push('Poor visibility')
    }

    // UV check
    if (weather.uvIndex && weather.uvIndex > 10) {
      suitable = false
      reasons.push('Extreme UV levels')
    }

    if (suitable && reasons.length === 0) {
      reasons.push('Perfect conditions for outdoor activities')
    }

    return { suitable, reasons }
  }

  /**
   * Group forecast days by weather pattern
   */
  static groupByWeatherPattern(forecast: WeatherRangeSummary): Map<string, DailyWeather[]> {
    const groups = new Map<string, DailyWeather[]>()

    forecast.daily.forEach(day => {
      const category = this.getWeatherCategory(day.condition)
      if (!groups.has(category)) {
        groups.set(category, [])
      }
      groups.get(category)!.push(day)
    })

    return groups
  }

  /**
   * Calculate clothing recommendations
   */
  static getClothingRecommendations(weather: WeatherData): string[] {
    const recommendations: string[] = []
    const temp = weather.temp
    const windChill = this.calculateWindChill(temp, weather.windSpeed)

    // Temperature-based recommendations
    if (windChill < 0) {
      recommendations.push('Heavy winter coat', 'Gloves', 'Winter hat', 'Scarf')
    } else if (windChill < 10) {
      recommendations.push('Warm jacket', 'Long pants', 'Closed shoes')
    } else if (windChill < 20) {
      recommendations.push('Light jacket or sweater', 'Long pants or jeans')
    } else if (windChill < 30) {
      recommendations.push('T-shirt', 'Shorts or light pants', 'Comfortable shoes')
    } else {
      recommendations.push('Light clothing', 'Shorts', 'Sandals', 'Sun hat')
    }

    // Rain protection
    if (weather.precipitation && weather.precipitation > 0) {
      recommendations.push('Umbrella or raincoat', 'Waterproof shoes')
    }

    // Sun protection
    if (weather.uvIndex && weather.uvIndex > 3) {
      recommendations.push('Sunglasses', 'Sunscreen SPF 30+')
    }

    // Wind protection
    if (weather.windSpeed > 20) {
      recommendations.push('Windbreaker')
    }

    return [...new Set(recommendations)] // Remove duplicates
  }
}

export default WeatherUtils