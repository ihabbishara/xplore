'use client';

import React, { useState } from 'react';
import { SavedLocation, LocationSearchResult } from '@xplore/shared';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { saveLocation, removeLocation, toggleFavorite } from '../store/locationSlice';

interface LocationCardProps {
  location: LocationSearchResult | SavedLocation;
  isSaved?: boolean;
  onSave?: (location: LocationSearchResult) => void;
  onRemove?: (locationId: string) => void;
  onViewDetails?: () => void;
}

export const LocationCard: React.FC<LocationCardProps> = ({
  location,
  isSaved = false,
  onSave,
  onRemove,
  onViewDetails,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [isLoading, setIsLoading] = useState(false);

  // Determine if this is a saved location or search result
  const isSavedLocation = 'savedAt' in location;
  const savedLocation = isSavedLocation ? location as SavedLocation : null;
  const locationData = savedLocation ? savedLocation.location : location as LocationSearchResult;

  const handleToggleSave = async () => {
    setIsLoading(true);
    try {
      if (isSaved && savedLocation) {
        await dispatch(removeLocation(locationData.id)).unwrap();
        onRemove?.(locationData.id);
      } else {
        const saveData = {
          placeId: locationData.placeId,
          name: locationData.name,
          country: locationData.country,
          city: locationData.city,
          region: locationData.region,
          address: locationData.address,
          latitude: locationData.coordinates.lat,
          longitude: locationData.coordinates.lng,
          placeType: locationData.type,
          metadata: locationData.metadata,
        };
        await dispatch(saveLocation(saveData)).unwrap();
        onSave?.(locationData);
      }
    } catch (error) {
      console.error('Failed to toggle save:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = () => {
    if (savedLocation) {
      dispatch(toggleFavorite(savedLocation.id));
    }
  };

  const renderRating = () => {
    if (!savedLocation?.rating) return null;
    
    return (
      <div className="flex items-center mt-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${
              star <= savedLocation.rating! ? 'text-yellow-400' : 'text-gray-300'
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200">
      {/* Image placeholder */}
      <div className="relative h-48 bg-gray-200 rounded-t-lg">
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        
        {/* Save button */}
        <button
          onClick={handleToggleSave}
          disabled={isLoading}
          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
        >
          {isLoading ? (
            <div className="w-5 h-5 border-t-2 border-primary-500 rounded-full animate-spin" />
          ) : (
            <svg
              className={`w-5 h-5 ${
                isSaved ? 'text-red-500 fill-current' : 'text-gray-600'
              }`}
              fill={isSaved ? 'currentColor' : 'none'}
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
              />
            </svg>
          )}
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">{locationData.name}</h3>
            <p className="text-sm text-gray-500 mt-1">
              {[locationData.city, locationData.region, locationData.country]
                .filter(Boolean)
                .join(', ')}
            </p>
            {renderRating()}
          </div>
          
          {savedLocation && (
            <button
              onClick={handleToggleFavorite}
              className="ml-2 text-yellow-500"
            >
              <svg
                className={`w-6 h-6 ${
                  savedLocation.isFavorite ? 'fill-current' : ''
                }`}
                fill={savedLocation.isFavorite ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                />
              </svg>
            </button>
          )}
        </div>

        {savedLocation?.customTags && savedLocation.customTags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {savedLocation.customTags.map((tag, index) => (
              <span
                key={index}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {savedLocation?.personalNotes && (
          <p className="mt-3 text-sm text-gray-600 line-clamp-2">
            {savedLocation.personalNotes}
          </p>
        )}

        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="mt-4 w-full px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
          >
            View Details
          </button>
        )}
      </div>
    </div>
  );
};