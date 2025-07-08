import { useState, useCallback } from 'react'
import { mutate } from 'swr'
import { TripService } from '../services/tripService'
import { TripDestinationInput, RouteSegmentInput, OptimizationOptions } from '../types/trip.types'
import { toast } from 'sonner'

export function useTripDestinations(tripId: string | null) {
  const [isAddingDestination, setIsAddingDestination] = useState(false)
  const [isUpdatingDestination, setIsUpdatingDestination] = useState(false)
  const [isRemovingDestination, setIsRemovingDestination] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)

  const addDestination = useCallback(async (input: TripDestinationInput) => {
    if (!tripId) return
    
    setIsAddingDestination(true)
    try {
      await TripService.addDestination(tripId, input)
      await mutate(['trip', tripId])
      toast.success('Destination added successfully!')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to add destination')
      throw error
    } finally {
      setIsAddingDestination(false)
    }
  }, [tripId])

  const updateDestination = useCallback(async (
    destinationId: string, 
    input: Partial<TripDestinationInput>
  ) => {
    setIsUpdatingDestination(true)
    try {
      await TripService.updateDestination(destinationId, input)
      await mutate(['trip', tripId])
      toast.success('Destination updated successfully!')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update destination')
      throw error
    } finally {
      setIsUpdatingDestination(false)
    }
  }, [tripId])

  const removeDestination = useCallback(async (destinationId: string) => {
    if (!confirm('Are you sure you want to remove this destination?')) return
    
    setIsRemovingDestination(true)
    try {
      await TripService.removeDestination(destinationId)
      await mutate(['trip', tripId])
      toast.success('Destination removed successfully!')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to remove destination')
      throw error
    } finally {
      setIsRemovingDestination(false)
    }
  }, [tripId])

  const optimizeRoute = useCallback(async (options: OptimizationOptions) => {
    if (!tripId) return
    
    setIsOptimizing(true)
    try {
      await TripService.optimizeRoute(tripId, options)
      await mutate(['trip', tripId])
      toast.success('Route optimized successfully!')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to optimize route')
      throw error
    } finally {
      setIsOptimizing(false)
    }
  }, [tripId])

  const createRoute = useCallback(async (input: RouteSegmentInput) => {
    if (!tripId) return
    
    try {
      await TripService.createRoute(tripId, input)
      await mutate(['trip', tripId])
      toast.success('Route segment created!')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create route')
      throw error
    }
  }, [tripId])

  return {
    addDestination,
    updateDestination,
    removeDestination,
    optimizeRoute,
    createRoute,
    isAddingDestination,
    isUpdatingDestination,
    isRemovingDestination,
    isOptimizing
  }
}