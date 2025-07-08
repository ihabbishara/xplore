'use client'

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { format } from 'date-fns'
import { 
  Calendar,
  MapPin,
  Users,
  Eye,
  EyeOff,
  Globe,
  MoreVertical,
  Edit,
  Trash2,
  Share2
} from 'lucide-react'
import { Trip } from '../types/trip.types'
import { cn } from '@/lib/utils'

interface TripListProps {
  trips: Trip[]
  onEdit?: (trip: Trip) => void
  onDelete?: (tripId: string) => void
  onShare?: (trip: Trip) => void
}

export function TripList({ trips, onEdit, onDelete, onShare }: TripListProps) {
  if (trips.length === 0) {
    return (
      <div className="text-center py-12">
        <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No trips yet</h3>
        <p className="mt-2 text-sm text-gray-500">
          Start planning your next adventure!
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {trips.map((trip) => (
        <TripCard
          key={trip.id}
          trip={trip}
          onEdit={onEdit}
          onDelete={onDelete}
          onShare={onShare}
        />
      ))}
    </div>
  )
}

interface TripCardProps {
  trip: Trip
  onEdit?: (trip: Trip) => void
  onDelete?: (tripId: string) => void
  onShare?: (trip: Trip) => void
}

function TripCard({ trip, onEdit, onDelete, onShare }: TripCardProps) {
  const [showMenu, setShowMenu] = React.useState(false)
  
  const statusColors = {
    draft: 'bg-gray-100 text-gray-800',
    planned: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-green-100 text-green-800',
    completed: 'bg-purple-100 text-purple-800',
    cancelled: 'bg-red-100 text-red-800'
  }

  const visibilityIcons = {
    private: <EyeOff className="h-4 w-4" />,
    shared: <Users className="h-4 w-4" />,
    public: <Globe className="h-4 w-4" />
  }

  const destinationCount = trip._count?.destinations || 0
  const collaboratorCount = trip._count?.collaborators || 0

  return (
    <div className="relative bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
      <Link href={`/trips/${trip.id}`}>
        <div className="aspect-w-16 aspect-h-9 relative">
          {trip.coverImageUrl ? (
            <Image
              src={trip.coverImageUrl}
              alt={trip.name}
              fill
              className="object-cover rounded-t-lg"
            />
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-primary-400 to-primary-600 rounded-t-lg flex items-center justify-center">
              <MapPin className="h-16 w-16 text-white/50" />
            </div>
          )}
          <div className="absolute top-2 left-2">
            <span className={cn(
              'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
              statusColors[trip.status]
            )}>
              {trip.status.replace('_', ' ')}
            </span>
          </div>
          <div className="absolute top-2 right-2">
            {visibilityIcons[trip.visibility]}
          </div>
        </div>
      </Link>

      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Link href={`/trips/${trip.id}`}>
              <h3 className="text-lg font-semibold text-gray-900 hover:text-primary-600">
                {trip.name}
              </h3>
            </Link>
            {trip.description && (
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                {trip.description}
              </p>
            )}
          </div>
          
          <div className="relative ml-2">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <MoreVertical className="h-5 w-5 text-gray-400" />
            </button>
            
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
                  <div className="py-1">
                    {onEdit && (
                      <button
                        onClick={() => {
                          onEdit(trip)
                          setShowMenu(false)
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </button>
                    )}
                    {onShare && (
                      <button
                        onClick={() => {
                          onShare(trip)
                          setShowMenu(false)
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Share
                      </button>
                    )}
                    {onDelete && (
                      <button
                        onClick={() => {
                          onDelete(trip.id)
                          setShowMenu(false)
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center text-sm text-gray-500">
          <Calendar className="h-4 w-4 mr-1" />
          <span>
            {format(new Date(trip.startDate), 'MMM d')} - {format(new Date(trip.endDate), 'MMM d, yyyy')}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {destinationCount} {destinationCount === 1 ? 'destination' : 'destinations'}
            </span>
            {collaboratorCount > 0 && (
              <span className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {collaboratorCount}
              </span>
            )}
          </div>
          
          {trip.estimatedBudget && (
            <span className="text-sm font-medium text-gray-900">
              {trip.currency} {trip.estimatedBudget.toLocaleString()}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}