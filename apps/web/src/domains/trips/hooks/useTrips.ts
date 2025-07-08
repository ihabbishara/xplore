import { useState, useCallback } from 'react'
import useSWR, { mutate } from 'swr'
import { TripService } from '../services/tripService'
import { Trip, TripFilters, TripCreateInput, TripUpdateInput } from '../types/trip.types'
import { toast } from 'sonner'

export function useTrips(filters?: TripFilters) {
  const { data: trips, error, isLoading } = useSWR(
    ['trips', filters],
    () => TripService.listTrips(filters),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  )

  return {
    trips,
    isLoading,
    error,
    mutate: () => mutate(['trips', filters])
  }
}

export function useTrip(tripId: string | null) {
  const { data: trip, error, isLoading } = useSWR(
    tripId ? ['trip', tripId] : null,
    () => TripService.getTrip(tripId!),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false
    }
  )

  return {
    trip,
    isLoading,
    error,
    mutate: () => mutate(['trip', tripId])
  }
}

export function useTripActions() {
  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const createTrip = useCallback(async (input: TripCreateInput) => {
    setIsCreating(true)
    try {
      const trip = await TripService.createTrip(input)
      await mutate(['trips'])
      toast.success('Trip created successfully!')
      return trip
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create trip')
      throw error
    } finally {
      setIsCreating(false)
    }
  }, [])

  const updateTrip = useCallback(async (tripId: string, input: TripUpdateInput) => {
    setIsUpdating(true)
    try {
      const trip = await TripService.updateTrip(tripId, input)
      await mutate(['trip', tripId])
      await mutate(['trips'])
      toast.success('Trip updated successfully!')
      return trip
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to update trip')
      throw error
    } finally {
      setIsUpdating(false)
    }
  }, [])

  const deleteTrip = useCallback(async (tripId: string) => {
    setIsDeleting(true)
    try {
      await TripService.deleteTrip(tripId)
      await mutate(['trips'])
      toast.success('Trip deleted successfully!')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete trip')
      throw error
    } finally {
      setIsDeleting(false)
    }
  }, [])

  return {
    createTrip,
    updateTrip,
    deleteTrip,
    isCreating,
    isUpdating,
    isDeleting
  }
}