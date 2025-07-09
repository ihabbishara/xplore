import axios from 'axios'
import * as cheerio from 'cheerio'
import { URL } from 'url'
import { prisma } from '../../../lib/prisma'
import { 
  PropertyCreateInput, 
  PropertyValidationResult, 
  ScrapingPlatformConfig,
  PropertyCoordinates,
  PropertyFeatures,
  PropertyPhoto,
  ScrapingError
} from '../types/property.types'
import { logger } from '../../../lib/logger'

export class PropertyScraper {
  private platforms: Map<string, ScrapingPlatformConfig> = new Map()
  private userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'

  constructor() {
    this.initializePlatforms()
  }

  /**
   * Initialize supported platforms with their configurations
   */
  private async initializePlatforms() {
    // Load platform configurations from database
    const platforms = await prisma.scrapingPlatform.findMany({
      where: { isActive: true }
    })

    // Set up default platforms if none exist
    if (platforms.length === 0) {
      await this.seedDefaultPlatforms()
      return this.initializePlatforms()
    }

    // Store platforms in memory for quick access
    platforms.forEach(platform => {
      this.platforms.set(platform.platformName, {
        platformName: platform.platformName,
        country: platform.country || undefined,
        baseDomain: platform.baseDomain || undefined,
        selectors: platform.selectors as any,
        headers: platform.headers as any,
        rateLimitMs: platform.rateLimitMs,
        isActive: platform.isActive
      })
    })

    logger.info(`Initialized ${platforms.length} scraping platforms`)
  }

  /**
   * Seed default platform configurations
   */
  private async seedDefaultPlatforms() {
    const defaultPlatforms: ScrapingPlatformConfig[] = [
      {
        platformName: 'seloger',
        country: 'FR',
        baseDomain: 'seloger.com',
        selectors: {
          title: 'h1.Title',
          description: '.Description-content',
          price: '.Price-displayedPrice',
          currency: '.Price-currency',
          size: '[data-test="surface"]',
          rooms: '[data-test="rooms"]',
          bedrooms: '[data-test="bedrooms"]',
          address: '.Address-address',
          photos: '.Slideshow-slide img',
          features: '.Features-feature',
          energyRating: '.Energy-dpeValue'
        },
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        },
        rateLimitMs: 2000
      },
      {
        platformName: 'leboncoin',
        country: 'FR',
        baseDomain: 'leboncoin.fr',
        selectors: {
          title: 'h1[data-test-id="ad-title"]',
          description: '[data-test-id="ad-description"]',
          price: '[data-test-id="price-amount"]',
          size: '[data-test-id="criteria"] [title*="Surface"]',
          rooms: '[data-test-id="criteria"] [title*="Pièces"]',
          address: '[data-test-id="ad-location"]',
          photos: '[data-test-id="slideshow"] img'
        },
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8'
        },
        rateLimitMs: 1500
      },
      {
        platformName: 'pap',
        country: 'FR',
        baseDomain: 'pap.fr',
        selectors: {
          title: 'h1.item-title',
          description: '.item-description',
          price: '.item-price',
          size: '.item-summary .size',
          rooms: '.item-summary .rooms',
          address: '.item-geoloc',
          photos: '.item-slider img'
        },
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        rateLimitMs: 1000
      },
      {
        platformName: 'rightmove',
        country: 'GB',
        baseDomain: 'rightmove.co.uk',
        selectors: {
          title: 'h1._2uQQ3SV0eMHL1P6t5ZDo2q',
          description: '.STw8udCxUaBUMfOOZu0iL',
          price: '._1gfnqJ3Vtd1z40MlC0MzXu span',
          size: '[data-test="floorArea"]',
          bedrooms: '[data-test="beds"]',
          bathrooms: '[data-test="baths"]',
          address: '.WJG_W5MfYB_cNcbKM6VFl',
          photos: '.gallery-image img'
        },
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-GB,en;q=0.9'
        },
        rateLimitMs: 2000
      }
    ]

    // Insert default platforms
    for (const platform of defaultPlatforms) {
      await prisma.scrapingPlatform.create({
        data: {
          platformName: platform.platformName,
          country: platform.country,
          baseDomain: platform.baseDomain,
          selectors: platform.selectors,
          headers: platform.headers,
          rateLimitMs: platform.rateLimitMs || 1000,
          isActive: true
        }
      })
    }

    logger.info('Seeded default scraping platforms')
  }

  /**
   * Validate if a URL is from a supported platform
   */
  async validateUrl(url: string): Promise<PropertyValidationResult> {
    try {
      const parsedUrl = new URL(url)
      const domain = parsedUrl.hostname.toLowerCase()
      
      // Find matching platform
      const platform = this.findPlatformByDomain(domain)
      
      if (!platform) {
        return {
          isValid: false,
          supportedPlatform: false,
          errors: [`Platform ${domain} is not supported`]
        }
      }

      // Check if URL format is valid for the platform
      const validationErrors = await this.validateUrlFormat(url, platform)
      
      return {
        isValid: validationErrors.length === 0,
        platform: platform.platformName,
        supportedPlatform: true,
        errors: validationErrors.length > 0 ? validationErrors : undefined
      }
    } catch (error) {
      return {
        isValid: false,
        supportedPlatform: false,
        errors: ['Invalid URL format']
      }
    }
  }

  /**
   * Find platform configuration by domain
   */
  private findPlatformByDomain(domain: string): ScrapingPlatformConfig | undefined {
    for (const [platformName, config] of this.platforms) {
      if (config.baseDomain && domain.includes(config.baseDomain)) {
        return config
      }
    }
    return undefined
  }

  /**
   * Validate URL format for specific platform
   */
  private async validateUrlFormat(url: string, platform: ScrapingPlatformConfig): Promise<string[]> {
    const errors: string[] = []
    
    // Platform-specific URL validation
    switch (platform.platformName) {
      case 'seloger':
        if (!url.includes('/annonces/')) {
          errors.push('Invalid SeLoger URL format - must contain /annonces/')
        }
        break
      case 'leboncoin':
        if (!url.includes('/ventes_immobilieres/') && !url.includes('/locations/')) {
          errors.push('Invalid LeBonCoin URL format - must be a real estate listing')
        }
        break
      case 'pap':
        if (!url.includes('/annonce/')) {
          errors.push('Invalid PAP URL format - must contain /annonce/')
        }
        break
      case 'rightmove':
        if (!url.includes('/properties/')) {
          errors.push('Invalid Rightmove URL format - must contain /properties/')
        }
        break
    }
    
    return errors
  }

  /**
   * Main scraping method
   */
  async scrapeProperty(url: string): Promise<PropertyCreateInput> {
    const validation = await this.validateUrl(url)
    
    if (!validation.isValid) {
      throw new Error(`URL validation failed: ${validation.errors?.join(', ')}`)
    }

    const platform = this.platforms.get(validation.platform!)
    if (!platform) {
      throw new Error(`Platform configuration not found for ${validation.platform}`)
    }

    logger.info(`Scraping property from ${platform.platformName}: ${url}`)

    try {
      // Add rate limiting
      await this.rateLimitDelay(platform.rateLimitMs)

      // Fetch page content
      const html = await this.fetchPageContent(url, platform)
      
      // Extract property data
      const propertyData = await this.extractPropertyData(html, platform, url)
      
      // Calculate data quality score
      const qualityScore = this.calculateDataQualityScore(propertyData)
      
      return {
        ...propertyData,
        sourceUrl: url,
        sourcePlatform: platform.platformName,
        dataQualityScore: qualityScore
      }
    } catch (error) {
      logger.error(`Scraping failed for ${url}:`, error)
      throw error
    }
  }

  /**
   * Fetch page content with proper headers
   */
  private async fetchPageContent(url: string, platform: ScrapingPlatformConfig): Promise<string> {
    const response = await axios.get(url, {
      headers: platform.headers || {
        'User-Agent': this.userAgent
      },
      timeout: 30000,
      maxRedirects: 5
    })

    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}: Failed to fetch ${url}`)
    }

    return response.data
  }

  /**
   * Extract property data using platform-specific selectors
   */
  private async extractPropertyData(
    html: string, 
    platform: ScrapingPlatformConfig, 
    url: string
  ): Promise<Partial<PropertyCreateInput>> {
    const $ = cheerio.load(html)
    const data: Partial<PropertyCreateInput> = {}
    const errors: ScrapingError[] = []

    try {
      // Extract basic information
      data.title = this.extractText($, platform.selectors.title)
      data.description = this.extractText($, platform.selectors.description)
      
      // Extract pricing
      const priceText = this.extractText($, platform.selectors.price)
      if (priceText) {
        data.price = this.parsePrice(priceText)
        data.currency = this.extractCurrency(priceText) || this.getDefaultCurrency(platform)
      }

      // Extract property details
      const sizeText = this.extractText($, platform.selectors.size)
      if (sizeText) {
        data.sizeSqm = this.parseSize(sizeText)
      }

      const roomsText = this.extractText($, platform.selectors.rooms)
      if (roomsText) {
        data.rooms = this.parseNumber(roomsText)
      }

      const bedroomsText = this.extractText($, platform.selectors.bedrooms)
      if (bedroomsText) {
        data.bedrooms = this.parseNumber(bedroomsText)
      }

      const bathroomsText = this.extractText($, platform.selectors.bathrooms)
      if (bathroomsText) {
        data.bathrooms = this.parseNumber(bathroomsText)
      }

      // Extract location
      data.address = this.extractText($, platform.selectors.address)
      if (data.address) {
        const locationData = await this.parseLocation(data.address, platform)
        Object.assign(data, locationData)
      }

      // Extract photos
      data.photos = this.extractPhotos($, platform.selectors.photos, url)

      // Extract features
      data.features = this.extractFeatures($, platform.selectors.features)

      // Extract energy rating
      data.energyRating = this.extractText($, platform.selectors.energyRating)

      // Extract agent information
      data.agentName = this.extractText($, platform.selectors.agent)

      // Platform-specific extraction
      await this.extractPlatformSpecificData($, platform, data)

    } catch (error) {
      errors.push({
        error: error instanceof Error ? error.message : 'Unknown extraction error',
        timestamp: new Date(),
        url,
        platform: platform.platformName,
        details: error
      })
    }

    if (errors.length > 0) {
      data.scrapingErrors = errors
    }

    return data
  }

  /**
   * Extract text content using CSS selector
   */
  private extractText($: cheerio.CheerioAPI, selector?: string): string | undefined {
    if (!selector) return undefined
    
    const element = $(selector).first()
    if (element.length === 0) return undefined
    
    return element.text().trim() || undefined
  }

  /**
   * Parse price from text
   */
  private parsePrice(priceText: string): number | undefined {
    // Remove all non-numeric characters except decimal points
    const cleanPrice = priceText.replace(/[^\d.,]/g, '')
    
    // Handle different decimal separators
    const normalizedPrice = cleanPrice.replace(',', '.')
    
    const price = parseFloat(normalizedPrice)
    return isNaN(price) ? undefined : price
  }

  /**
   * Extract currency from price text
   */
  private extractCurrency(priceText: string): string | undefined {
    const currencySymbols = {
      '€': 'EUR',
      '$': 'USD',
      '£': 'GBP',
      '¥': 'JPY'
    }

    for (const [symbol, code] of Object.entries(currencySymbols)) {
      if (priceText.includes(symbol)) {
        return code
      }
    }

    return undefined
  }

  /**
   * Get default currency for platform
   */
  private getDefaultCurrency(platform: ScrapingPlatformConfig): string {
    const currencyMap: { [key: string]: string } = {
      'FR': 'EUR',
      'GB': 'GBP',
      'US': 'USD',
      'DE': 'EUR',
      'ES': 'EUR',
      'IT': 'EUR'
    }

    return currencyMap[platform.country || ''] || 'EUR'
  }

  /**
   * Parse size from text
   */
  private parseSize(sizeText: string): number | undefined {
    const match = sizeText.match(/(\d+(?:[.,]\d+)?)\s*m²?/i)
    if (match) {
      return parseFloat(match[1].replace(',', '.'))
    }
    return undefined
  }

  /**
   * Parse number from text
   */
  private parseNumber(text: string): number | undefined {
    const match = text.match(/(\d+)/)
    return match ? parseInt(match[1]) : undefined
  }

  /**
   * Parse location information
   */
  private async parseLocation(address: string, platform: ScrapingPlatformConfig): Promise<Partial<PropertyCreateInput>> {
    const locationData: Partial<PropertyCreateInput> = {}
    
    // Simple address parsing - in production, you'd use a geocoding service
    const addressParts = address.split(',').map(part => part.trim())
    
    if (addressParts.length >= 2) {
      locationData.city = addressParts[addressParts.length - 2]
      locationData.country = this.getCountryFromPlatform(platform)
    }

    // Extract postal code
    const postalMatch = address.match(/\b(\d{5})\b/)
    if (postalMatch) {
      locationData.postalCode = postalMatch[1]
    }

    return locationData
  }

  /**
   * Get country from platform
   */
  private getCountryFromPlatform(platform: ScrapingPlatformConfig): string | undefined {
    const countryMap: { [key: string]: string } = {
      'FR': 'France',
      'GB': 'United Kingdom',
      'US': 'United States',
      'DE': 'Germany',
      'ES': 'Spain',
      'IT': 'Italy'
    }

    return countryMap[platform.country || '']
  }

  /**
   * Extract photos from page
   */
  private extractPhotos($: cheerio.CheerioAPI, selector?: string, baseUrl?: string): PropertyPhoto[] | undefined {
    if (!selector) return undefined
    
    const photos: PropertyPhoto[] = []
    
    $(selector).each((index, element) => {
      const src = $(element).attr('src') || $(element).attr('data-src')
      if (src) {
        let url = src
        
        // Handle relative URLs
        if (src.startsWith('//')) {
          url = 'https:' + src
        } else if (src.startsWith('/') && baseUrl) {
          const baseUrlObj = new URL(baseUrl)
          url = `${baseUrlObj.origin}${src}`
        }
        
        photos.push({
          url,
          order: index
        })
      }
    })
    
    return photos.length > 0 ? photos : undefined
  }

  /**
   * Extract property features
   */
  private extractFeatures($: cheerio.CheerioAPI, selector?: string): PropertyFeatures | undefined {
    if (!selector) return undefined
    
    const features: PropertyFeatures = {}
    
    $(selector).each((index, element) => {
      const text = $(element).text().toLowerCase()
      
      // Map common features
      if (text.includes('balcon')) features.balcony = true
      if (text.includes('parking') || text.includes('garage')) features.parking = true
      if (text.includes('ascenseur')) features.elevator = true
      if (text.includes('terrasse')) features.terrace = true
      if (text.includes('jardin')) features.garden = true
      if (text.includes('piscine')) features.pool = true
      if (text.includes('meublé')) features.furnished = true
      if (text.includes('climatisation')) features.airConditioning = true
      if (text.includes('chauffage')) features.heating = true
    })
    
    return Object.keys(features).length > 0 ? features : undefined
  }

  /**
   * Extract platform-specific data
   */
  private async extractPlatformSpecificData(
    $: cheerio.CheerioAPI, 
    platform: ScrapingPlatformConfig, 
    data: Partial<PropertyCreateInput>
  ): Promise<void> {
    switch (platform.platformName) {
      case 'seloger':
        // Extract DPE rating
        const dpeRating = this.extractText($, '[data-test="dpe-grade"]')
        if (dpeRating) {
          data.energyRating = dpeRating
        }
        
        // Extract floor information
        const floorText = this.extractText($, '[data-test="floor"]')
        if (floorText) {
          const floorMatch = floorText.match(/(\d+)/)
          if (floorMatch) {
            data.floorNumber = parseInt(floorMatch[1])
          }
        }
        break
        
      case 'leboncoin':
        // Extract transaction type
        const breadcrumb = this.extractText($, '.breadcrumb')
        if (breadcrumb?.includes('vente')) {
          data.transactionType = 'sale'
        } else if (breadcrumb?.includes('location')) {
          data.transactionType = 'rent'
        }
        break
        
      case 'rightmove':
        // Extract property type
        const propertyType = this.extractText($, '[data-test="property-type"]')
        if (propertyType) {
          data.propertyType = propertyType.toLowerCase()
        }
        break
    }
  }

  /**
   * Calculate data quality score based on completeness
   */
  private calculateDataQualityScore(data: Partial<PropertyCreateInput>): number {
    const requiredFields = ['title', 'price', 'address', 'sizeSqm']
    const optionalFields = ['description', 'rooms', 'bedrooms', 'photos', 'features']
    
    let score = 0
    let totalWeight = 0
    
    // Required fields (70% weight)
    requiredFields.forEach(field => {
      if (data[field as keyof PropertyCreateInput]) {
        score += 0.175 // 70% / 4 fields
      }
      totalWeight += 0.175
    })
    
    // Optional fields (30% weight)
    optionalFields.forEach(field => {
      if (data[field as keyof PropertyCreateInput]) {
        score += 0.06 // 30% / 5 fields
      }
      totalWeight += 0.06
    })
    
    return Math.round((score / totalWeight) * 100) / 100
  }

  /**
   * Rate limiting delay
   */
  private async rateLimitDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get supported platforms
   */
  async getSupportedPlatforms(): Promise<ScrapingPlatformConfig[]> {
    return Array.from(this.platforms.values())
  }

  /**
   * Detect platform from URL
   */
  detectPlatform(url: string): string | undefined {
    try {
      const parsedUrl = new URL(url)
      const domain = parsedUrl.hostname.toLowerCase()
      
      const platform = this.findPlatformByDomain(domain)
      return platform?.platformName
    } catch (error) {
      return undefined
    }
  }
}