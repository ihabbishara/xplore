import { Trip, TripDestination, Location } from '@prisma/client'
import axios from 'axios'
import { OptimizationOptions } from '../types/trip.types'
import { prisma } from '../../../lib/prisma'

interface RouteDetails {
  distance: number
  duration: number
  polyline?: string
  waypoints?: any[]
}

interface OptimizedRoute {
  destinations: Array<{ id: string; dayOrder: number }>
  segments: Array<{
    fromDestinationId: string
    toDestinationId: string
    transportMode: string
    distance: number
    duration: number
    cost?: number
    polyline?: string
    waypoints?: any[]
  }>
  totalDistance: number
  totalDuration: number
  totalCost?: number
}

interface MapboxDirectionsResponse {
  routes: Array<{
    distance: number
    duration: number
    geometry: string
    legs: Array<{
      distance: number
      duration: number
      steps: any[]
    }>
  }>
  waypoints: any[]
}

export class RouteOptimizationService {
  private mapboxToken: string
  private mapboxProfiles: Record<string, string> = {
    car: 'driving',
    bike: 'cycling',
    walk: 'walking',
    train: 'driving', // Fallback to driving for train
    bus: 'driving',   // Fallback to driving for bus
    flight: 'driving' // Fallback to driving for flight
  }

  constructor() {
    this.mapboxToken = process.env.MAPBOX_ACCESS_TOKEN || ''
    if (!this.mapboxToken) {
      console.warn('Mapbox access token not configured')
    }
  }

  async calculateRoute(
    fromDestinationId: string,
    toDestinationId: string,
    transportMode: string
  ): Promise<RouteDetails> {
    try {
      // Fetch destinations with locations
      const [fromDest, toDest] = await Promise.all([
        prisma.tripDestination.findUnique({
          where: { id: fromDestinationId },
          include: { location: true }
        }),
        prisma.tripDestination.findUnique({
          where: { id: toDestinationId },
          include: { location: true }
        })
      ])

      if (!fromDest?.location || !toDest?.location) {
        throw new Error('Destinations not found')
      }

      // Use Mapbox if token is available
      if (this.mapboxToken) {
        const profile = this.mapboxProfiles[transportMode] || 'driving'
        const coordinates = [
          [fromDest.location.longitude, fromDest.location.latitude],
          [toDest.location.longitude, toDest.location.latitude]
        ]

        const routeData = await this.getMapboxRoute(coordinates as [number, number][], profile)
        if (routeData.routes.length > 0) {
          const route = routeData.routes[0]
          return {
            distance: route.distance / 1000, // Convert to km
            duration: route.duration / 60,   // Convert to minutes
            polyline: route.geometry,
            waypoints: routeData.waypoints
          }
        }
      }

      // Fallback to Haversine distance calculation
      const distance = this.calculateHaversineDistance(
        fromDest.location.latitude,
        fromDest.location.longitude,
        toDest.location.latitude,
        toDest.location.longitude
      )

      // Estimate duration based on transport mode
      const speedKmh: Record<string, number> = {
        car: 80,
        train: 120,
        flight: 500,
        bus: 60,
        walk: 5,
        bike: 15
      }

      const speed = speedKmh[transportMode] || 60
      const duration = (distance / speed) * 60 // Convert to minutes

      return {
        distance,
        duration,
        polyline: undefined,
        waypoints: []
      }
    } catch (error) {
      console.error('Route calculation error:', error)
      // Return reasonable defaults
      return {
        distance: 100,
        duration: 120,
        polyline: undefined,
        waypoints: []
      }
    }
  }

  async optimizeTrip(
    trip: any,
    options: OptimizationOptions
  ): Promise<OptimizedRoute> {
    const destinations = trip.destinations as Array<TripDestination & { location: Location }>
    
    if (destinations.length < 2) {
      return {
        destinations: destinations.map((d, i) => ({ id: d.id, dayOrder: i + 1 })),
        segments: [],
        totalDistance: 0,
        totalDuration: 0
      }
    }

    // Optimize the order of destinations
    const optimizedIndices = await this.solveOptimizationProblem(destinations, options)
    const optimizedDestinations = optimizedIndices.map((idx, order) => ({
      id: destinations[idx].id,
      dayOrder: order + 1
    }))

    // Create segments between consecutive destinations
    const segments = []
    let totalDistance = 0
    let totalDuration = 0
    let totalCost = 0

    for (let i = 0; i < optimizedIndices.length - 1; i++) {
      const fromIdx = optimizedIndices[i]
      const toIdx = optimizedIndices[i + 1]
      const fromDest = destinations[fromIdx]
      const toDest = destinations[toIdx]
      
      const transportMode = this.selectOptimalTransportMode(
        fromDest,
        toDest,
        options
      )
      
      const routeDetails = await this.calculateRoute(
        fromDest.id,
        toDest.id,
        transportMode
      )

      const segment = {
        fromDestinationId: fromDest.id,
        toDestinationId: toDest.id,
        transportMode,
        distance: routeDetails.distance,
        duration: routeDetails.duration,
        cost: this.estimateCost(routeDetails.distance, transportMode),
        polyline: routeDetails.polyline,
        waypoints: routeDetails.waypoints
      }

      segments.push(segment)
      totalDistance += segment.distance
      totalDuration += segment.duration
      totalCost += segment.cost || 0
    }

    // Add return segment if it's a round trip
    if (options.includeReturn !== false && optimizedIndices.length > 1) {
      const lastIdx = optimizedIndices[optimizedIndices.length - 1]
      const firstIdx = optimizedIndices[0]
      const lastDest = destinations[lastIdx]
      const firstDest = destinations[firstIdx]
      
      const returnMode = this.selectOptimalTransportMode(
        lastDest,
        firstDest,
        options
      )
      
      const returnRoute = await this.calculateRoute(
        lastDest.id,
        firstDest.id,
        returnMode
      )

      const returnSegment = {
        fromDestinationId: lastDest.id,
        toDestinationId: firstDest.id,
        transportMode: returnMode,
        distance: returnRoute.distance,
        duration: returnRoute.duration,
        cost: this.estimateCost(returnRoute.distance, returnMode),
        polyline: returnRoute.polyline,
        waypoints: returnRoute.waypoints
      }

      segments.push(returnSegment)
      totalDistance += returnSegment.distance
      totalDuration += returnSegment.duration
      totalCost += returnSegment.cost || 0
    }

    return {
      destinations: optimizedDestinations,
      segments,
      totalDistance,
      totalDuration,
      totalCost
    }
  }

  private selectOptimalTransportMode(
    from: TripDestination,
    to: TripDestination,
    options: OptimizationOptions
  ): string {
    // Simple logic for transport mode selection
    // In reality, this would consider distance, available routes, user preferences, etc.
    
    const distance = this.estimateDistance(from, to)
    
    if (options.preferredTransportModes?.length) {
      return options.preferredTransportModes[0]
    }

    if (distance < 5) return 'walk'
    if (distance < 30) return 'bike'
    if (distance < 200) return 'car'
    if (distance < 500) return 'train'
    return 'flight'
  }

  private estimateDistance(from: TripDestination, to: TripDestination): number {
    // Mock distance calculation
    // In reality, would use Haversine formula or actual route distance
    return Math.random() * 500 + 50
  }

  private estimateCost(distance: number, transportMode: string): number {
    // Mock cost estimation
    const costPerKm: Record<string, number> = {
      car: 0.5,
      train: 0.3,
      flight: 0.8,
      bus: 0.2,
      walk: 0,
      bike: 0.05
    }

    return distance * (costPerKm[transportMode] || 0.3)
  }

  async getMapboxRoute(
    coordinates: Array<[number, number]>,
    profile: string = 'driving'
  ): Promise<MapboxDirectionsResponse> {
    if (!this.mapboxToken) {
      throw new Error('Mapbox token not configured')
    }

    const coordinatesString = coordinates
      .map(coord => coord.join(','))
      .join(';')

    try {
      const response = await axios.get<MapboxDirectionsResponse>(
        `https://api.mapbox.com/directions/v5/mapbox/${profile}/${coordinatesString}`,
        {
          params: {
            access_token: this.mapboxToken,
            geometries: 'polyline',
            overview: 'full',
            steps: true,
            waypoints: true
          }
        }
      )

      return response.data
    } catch (error) {
      console.error('Mapbox route calculation failed:', error)
      throw new Error('Failed to calculate route')
    }
  }

  private calculateHaversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1)
    const dLon = this.toRadians(lon2 - lon1)
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * 
      Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  private async solveOptimizationProblem(
    destinations: Array<TripDestination & { location: Location }>,
    options: OptimizationOptions
  ): Promise<number[]> {
    const n = destinations.length
    
    // For small numbers of destinations, use brute force
    if (n <= 8) {
      return this.bruteForceTSP(destinations, options)
    }
    
    // For larger sets, use nearest neighbor heuristic
    return this.nearestNeighborTSP(destinations, options)
  }

  private async bruteForceTSP(
    destinations: Array<TripDestination & { location: Location }>,
    options: OptimizationOptions
  ): Promise<number[]> {
    const n = destinations.length
    const indices = Array.from({ length: n }, (_, i) => i)
    let bestRoute = [...indices]
    let bestCost = Infinity

    // Generate all permutations
    const permute = (arr: number[], start: number): void => {
      if (start === arr.length - 1) {
        const cost = this.calculateRouteCost(arr, destinations, options)
        if (cost < bestCost) {
          bestCost = cost
          bestRoute = [...arr]
        }
        return
      }

      for (let i = start; i < arr.length; i++) {
        const temp = arr[start];
        arr[start] = arr[i];
        arr[i] = temp;
        permute(arr, start + 1);
        const temp2 = arr[start];
        arr[start] = arr[i];
        arr[i] = temp2;
      }
    }

    permute(indices, 0)
    return bestRoute
  }

  private nearestNeighborTSP(
    destinations: Array<TripDestination & { location: Location }>,
    options: OptimizationOptions
  ): number[] {
    const n = destinations.length
    const visited = new Array(n).fill(false)
    const route: number[] = [0] // Start from first destination
    visited[0] = true

    for (let i = 1; i < n; i++) {
      let nearest = -1
      let minDistance = Infinity

      for (let j = 0; j < n; j++) {
        if (!visited[j]) {
          const lastIdx = route[route.length - 1]
          const distance = this.calculateHaversineDistance(
            destinations[lastIdx].location.latitude,
            destinations[lastIdx].location.longitude,
            destinations[j].location.latitude,
            destinations[j].location.longitude
          )

          if (distance < minDistance) {
            minDistance = distance
            nearest = j
          }
        }
      }

      if (nearest !== -1) {
        route.push(nearest)
        visited[nearest] = true
      }
    }

    return route
  }

  private calculateRouteCost(
    route: number[],
    destinations: Array<TripDestination & { location: Location }>,
    options: OptimizationOptions
  ): number {
    let cost = 0

    for (let i = 0; i < route.length - 1; i++) {
      const from = destinations[route[i]].location
      const to = destinations[route[i + 1]].location
      const distance = this.calculateHaversineDistance(
        from.latitude,
        from.longitude,
        to.latitude,
        to.longitude
      )

      switch (options.optimizeFor) {
        case 'distance':
          cost += distance
          break
        case 'time':
          cost += distance / 80 // Assume average speed
          break
        case 'cost':
          cost += distance * 0.5 // Assume cost per km
          break
        case 'scenic':
          // In a real implementation, this would consider scenic routes
          cost += distance * 0.8
          break
      }
    }

    return cost
  }
}