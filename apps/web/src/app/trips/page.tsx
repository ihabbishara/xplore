'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Filter, Search } from 'lucide-react'
import { TripList } from '@/domains/trips/components/TripList'
import { CreateTripModal } from '@/domains/trips/components/CreateTripModal'
import { useTrips, useTripActions } from '@/domains/trips/hooks/useTrips'
import { Trip, TripFilters } from '@/domains/trips/types/trip.types'

export default function TripsPage() {
  const router = useRouter()
  const [filters, setFilters] = useState<TripFilters>({})
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  
  const { trips, isLoading } = useTrips(filters)
  const { deleteTrip } = useTripActions()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters({ ...filters, search: searchQuery })
  }

  const handleStatusFilter = (status: string) => {
    setFilters({ ...filters, status: status === 'all' ? undefined : status })
  }

  const handleEdit = (trip: Trip) => {
    router.push(`/trips/${trip.id}/edit`)
  }

  const handleDelete = async (tripId: string) => {
    try {
      await deleteTrip(tripId)
    } catch (error) {
      // Error handled in hook
    }
  }

  const handleShare = (trip: Trip) => {
    // TODO: Implement share functionality
    console.log('Share trip:', trip)
  }

  const handleTripCreated = (trip: Trip) => {
    router.push(`/trips/${trip.id}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Trips</h1>
              <p className="mt-1 text-sm text-gray-500">
                Plan and manage your adventures
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Trip
            </button>
          </div>
        </div>

        <div className="mb-6 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search trips..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Search
            </button>
          </form>

          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <div className="flex gap-2">
              <button
                onClick={() => handleStatusFilter('all')}
                className={`px-3 py-1 text-sm rounded-full ${
                  !filters.status
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => handleStatusFilter('draft')}
                className={`px-3 py-1 text-sm rounded-full ${
                  filters.status === 'draft'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Draft
              </button>
              <button
                onClick={() => handleStatusFilter('planned')}
                className={`px-3 py-1 text-sm rounded-full ${
                  filters.status === 'planned'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Planned
              </button>
              <button
                onClick={() => handleStatusFilter('in_progress')}
                className={`px-3 py-1 text-sm rounded-full ${
                  filters.status === 'in_progress'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                In Progress
              </button>
              <button
                onClick={() => handleStatusFilter('completed')}
                className={`px-3 py-1 text-sm rounded-full ${
                  filters.status === 'completed'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Completed
              </button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-primary-600 transition ease-in-out duration-150">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading trips...
            </div>
          </div>
        ) : (
          <TripList
            trips={trips || []}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onShare={handleShare}
          />
        )}

        <CreateTripModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleTripCreated}
        />
      </div>
    </div>
  )
}