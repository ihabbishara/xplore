'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { format } from 'date-fns'
import { Calendar, X } from 'lucide-react'
import { TripCreateInput } from '../types/trip.types'
import { useTripActions } from '../hooks/useTrips'

const schema = yup.object({
  name: yup.string().required('Trip name is required'),
  description: yup.string(),
  startDate: yup.date().required('Start date is required'),
  endDate: yup.date()
    .required('End date is required')
    .min(yup.ref('startDate'), 'End date must be after start date'),
  tripType: yup.string(),
  estimatedBudget: yup.number().positive().nullable(),
  currency: yup.string().default('USD'),
  visibility: yup.string().oneOf(['private', 'shared', 'public']).default('private')
})

interface CreateTripModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (trip: any) => void
}

export function CreateTripModal({ isOpen, onClose, onSuccess }: CreateTripModalProps) {
  const { createTrip, isCreating } = useTripActions()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<TripCreateInput>({
    resolver: yupResolver(schema),
    defaultValues: {
      currency: 'USD',
      visibility: 'private'
    }
  })

  const onSubmit = async (data: TripCreateInput) => {
    try {
      const trip = await createTrip({
        ...data,
        startDate: format(new Date(data.startDate), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
        endDate: format(new Date(data.endDate), "yyyy-MM-dd'T'HH:mm:ss'Z'")
      })
      reset()
      onClose()
      onSuccess?.(trip)
    } catch (error) {
      // Error is handled in the hook
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />
        
        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Create New Trip</h3>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Trip Name *
                  </label>
                  <input
                    {...register('name')}
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="Summer vacation in Italy"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    placeholder="Exploring the beautiful cities of Rome, Florence, and Venice..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                      Start Date *
                    </label>
                    <div className="mt-1 relative">
                      <input
                        {...register('startDate')}
                        type="date"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                      <Calendar className="absolute right-2 top-2 h-5 w-5 text-gray-400 pointer-events-none" />
                    </div>
                    {errors.startDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                      End Date *
                    </label>
                    <div className="mt-1 relative">
                      <input
                        {...register('endDate')}
                        type="date"
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                      <Calendar className="absolute right-2 top-2 h-5 w-5 text-gray-400 pointer-events-none" />
                    </div>
                    {errors.endDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="tripType" className="block text-sm font-medium text-gray-700">
                      Trip Type
                    </label>
                    <select
                      {...register('tripType')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    >
                      <option value="">Select type</option>
                      <option value="relocation_exploration">Relocation Exploration</option>
                      <option value="vacation">Vacation</option>
                      <option value="business">Business</option>
                      <option value="adventure">Adventure</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="visibility" className="block text-sm font-medium text-gray-700">
                      Visibility
                    </label>
                    <select
                      {...register('visibility')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    >
                      <option value="private">Private</option>
                      <option value="shared">Shared with collaborators</option>
                      <option value="public">Public</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="estimatedBudget" className="block text-sm font-medium text-gray-700">
                      Estimated Budget
                    </label>
                    <input
                      {...register('estimatedBudget', { valueAsNumber: true })}
                      type="number"
                      min="0"
                      step="0.01"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder="5000"
                    />
                  </div>

                  <div>
                    <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                      Currency
                    </label>
                    <select
                      {...register('currency')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="GBP">GBP</option>
                      <option value="CAD">CAD</option>
                      <option value="AUD">AUD</option>
                      <option value="JPY">JPY</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
              <button
                type="submit"
                disabled={isCreating}
                className="inline-flex w-full justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Creating...' : 'Create Trip'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}