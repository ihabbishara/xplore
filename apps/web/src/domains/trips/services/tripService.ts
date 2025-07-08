import { apiClient } from '@/lib/api/client'
import { 
  Trip, 
  TripCreateInput, 
  TripUpdateInput, 
  TripDestinationInput,
  RouteSegmentInput,
  OptimizationOptions,
  TripFilters 
} from '../types/trip.types'

export class TripService {
  static async createTrip(input: TripCreateInput): Promise<Trip> {
    const response = await apiClient.post('/trips', input)
    return response.data.data
  }

  static async updateTrip(tripId: string, input: TripUpdateInput): Promise<Trip> {
    const response = await apiClient.put(`/trips/${tripId}`, input)
    return response.data.data
  }

  static async deleteTrip(tripId: string): Promise<void> {
    await apiClient.delete(`/trips/${tripId}`)
  }

  static async getTrip(tripId: string): Promise<Trip> {
    const response = await apiClient.get(`/trips/${tripId}`)
    return response.data.data
  }

  static async listTrips(filters?: TripFilters): Promise<Trip[]> {
    const response = await apiClient.get('/trips', { params: filters })
    return response.data.data
  }

  static async addDestination(
    tripId: string, 
    input: TripDestinationInput
  ): Promise<Trip> {
    const response = await apiClient.post(`/trips/${tripId}/destinations`, input)
    return response.data.data
  }

  static async updateDestination(
    destinationId: string,
    input: Partial<TripDestinationInput>
  ): Promise<Trip> {
    const response = await apiClient.put(`/trips/destinations/${destinationId}`, input)
    return response.data.data
  }

  static async removeDestination(destinationId: string): Promise<void> {
    await apiClient.delete(`/trips/destinations/${destinationId}`)
  }

  static async createRoute(
    tripId: string,
    input: RouteSegmentInput
  ): Promise<Trip> {
    const response = await apiClient.post(`/trips/${tripId}/routes`, input)
    return response.data.data
  }

  static async optimizeRoute(
    tripId: string,
    options: OptimizationOptions
  ): Promise<Trip> {
    const response = await apiClient.post(`/trips/${tripId}/optimize`, options)
    return response.data.data
  }

  static async addCollaborator(
    tripId: string,
    userId: string,
    role: 'owner' | 'editor' | 'viewer'
  ): Promise<void> {
    await apiClient.post(`/trips/${tripId}/collaborators`, { userId, role })
  }

  static async exportTrip(
    tripId: string,
    format: 'pdf' | 'excel' | 'json' | 'ical'
  ): Promise<Blob> {
    const response = await apiClient.get(`/trips/${tripId}/export`, {
      params: { format },
      responseType: 'blob'
    })
    return response.data
  }
}