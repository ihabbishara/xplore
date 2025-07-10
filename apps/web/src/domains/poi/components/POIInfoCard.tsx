'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  StarIcon, 
  MapPinIcon, 
  ClockIcon, 
  PhoneIcon, 
  GlobeAltIcon,
  HeartIcon,
  ShareIcon,
  DirectionsIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  EyeIcon,
  BookmarkIcon,
  CameraIcon,
} from '@heroicons/react/24/outline';
import { 
  StarIcon as StarIconSolid,
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid,
} from '@heroicons/react/24/solid';
import { POI, POIType, DEFAULT_POI_LAYERS } from '../types/poi';
import { useMapStore } from '../hooks/useMapStore';

interface POIInfoCardProps {
  poi: POI;
  onClose?: () => void;
  onDirections?: (poi: POI) => void;
  onAddToCollection?: (poi: POI) => void;
  onShare?: (poi: POI) => void;
  onViewDetails?: (poi: POI) => void;
  onToggleFavorite?: (poi: POI) => void;
  onToggleBookmark?: (poi: POI) => void;
  isFavorite?: boolean;
  isBookmarked?: boolean;
  className?: string;
  showCloseButton?: boolean;
  compact?: boolean;
}

export const POIInfoCard: React.FC<POIInfoCardProps> = ({
  poi,
  onClose,
  onDirections,
  onAddToCollection,
  onShare,
  onViewDetails,
  onToggleFavorite,
  onToggleBookmark,
  isFavorite = false,
  isBookmarked = false,
  className = '',
  showCloseButton = true,
  compact = false,
}) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const { setSelectedPOI } = useMapStore();

  const layerConfig = DEFAULT_POI_LAYERS[poi.type];

  const formatRating = (rating?: number) => {
    if (!rating) return 'No rating';
    return rating.toFixed(1);
  };

  const formatPriceRange = (priceRange?: string) => {
    const priceMap = {
      budget: '$',
      'mid-range': '$$',
      premium: '$$$',
    };
    return priceMap[priceRange as keyof typeof priceMap] || '';
  };

  const isOpenNow = () => {
    if (!poi.openingHours) return null;
    if (poi.openingHours.isOpen24Hours) return true;
    if (poi.openingHours.isClosed) return false;
    
    const now = new Date();
    const dayOfWeek = now.toLocaleLowerCase().substring(0, 3) as keyof typeof poi.openingHours;
    const currentTime = now.getHours() * 100 + now.getMinutes();
    
    const todayHours = poi.openingHours[dayOfWeek];
    if (!todayHours) return false;
    
    const openTime = parseInt(todayHours.open.replace(':', ''));
    const closeTime = parseInt(todayHours.close.replace(':', ''));
    
    return currentTime >= openTime && currentTime <= closeTime;
  };

  const openStatus = isOpenNow();

  const handlePhotoNavigation = (direction: 'prev' | 'next') => {
    if (!poi.photos || poi.photos.length <= 1) return;
    
    if (direction === 'prev') {
      setCurrentPhotoIndex((prev) => (prev - 1 + poi.photos!.length) % poi.photos!.length);
    } else {
      setCurrentPhotoIndex((prev) => (prev + 1) % poi.photos!.length);
    }
  };

  const visibleAmenities = showAllAmenities ? poi.amenities : poi.amenities?.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden ${
        compact ? 'max-w-sm' : 'max-w-md'
      } ${className}`}
    >
      {/* Header with photo/close button */}
      <div className="relative">
        {poi.photos && poi.photos.length > 0 ? (
          <div className="relative h-48 bg-gray-100">
            <img
              src={poi.photos[currentPhotoIndex]}
              alt={poi.name}
              className="w-full h-full object-cover"
            />
            
            {/* Photo navigation */}
            {poi.photos.length > 1 && (
              <>
                <button
                  onClick={() => handlePhotoNavigation('prev')}
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => handlePhotoNavigation('next')}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                >
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
                
                {/* Photo indicator */}
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                  {poi.photos.map((_, index) => (
                    <div
                      key={index}
                      className={`w-2 h-2 rounded-full ${
                        index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <div className="text-center">
              <CameraIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No photos available</p>
            </div>
          </div>
        )}
        
        {/* Close button */}
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        )}
        
        {/* POI Type Badge */}
        <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center space-x-1">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: layerConfig.color }}
          />
          <span className="text-xs font-medium text-gray-900">{layerConfig.name}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title and Rating */}
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 flex-1 mr-2">
            {poi.name}
          </h3>
          
          {poi.rating && (
            <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded-full">
              <StarIconSolid className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium text-gray-900">
                {formatRating(poi.rating)}
              </span>
              {poi.reviewCount && (
                <span className="text-xs text-gray-500">
                  ({poi.reviewCount.toLocaleString()})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Address and Distance */}
        {poi.address && (
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <MapPinIcon className="w-4 h-4 mr-1 flex-shrink-0" />
            <span className="truncate">{poi.address}</span>
          </div>
        )}

        {/* Opening Hours and Price */}
        <div className="flex items-center justify-between text-sm mb-3">
          {poi.openingHours && (
            <div className="flex items-center space-x-1">
              <ClockIcon className="w-4 h-4 text-gray-500" />
              <span className={`font-medium ${
                openStatus === true ? 'text-green-600' : 
                openStatus === false ? 'text-red-600' : 'text-gray-600'
              }`}>
                {openStatus === true ? 'Open now' : 
                 openStatus === false ? 'Closed' : 'Hours unknown'}
              </span>
            </div>
          )}
          
          {poi.priceRange && (
            <span className="text-gray-600 font-medium">
              {formatPriceRange(poi.priceRange)}
            </span>
          )}
        </div>

        {/* Description */}
        {poi.description && !compact && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {poi.description}
          </p>
        )}

        {/* Amenities */}
        {poi.amenities && poi.amenities.length > 0 && !compact && (
          <div className="mb-3">
            <div className="flex flex-wrap gap-1 mb-1">
              {visibleAmenities?.map((amenity, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full"
                >
                  {amenity}
                </span>
              ))}
            </div>
            
            {poi.amenities.length > 3 && (
              <button
                onClick={() => setShowAllAmenities(!showAllAmenities)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                {showAllAmenities ? 'Show less' : `+${poi.amenities.length - 3} more`}
              </button>
            )}
          </div>
        )}

        {/* Contact Information */}
        {(poi.phone || poi.website) && !compact && (
          <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
            {poi.phone && (
              <a
                href={`tel:${poi.phone}`}
                className="flex items-center hover:text-blue-600 transition-colors"
              >
                <PhoneIcon className="w-4 h-4 mr-1" />
                Call
              </a>
            )}
            
            {poi.website && (
              <a
                href={poi.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center hover:text-blue-600 transition-colors"
              >
                <GlobeAltIcon className="w-4 h-4 mr-1" />
                Website
              </a>
            )}
          </div>
        )}

        {/* Tags */}
        {poi.tags && poi.tags.length > 0 && !compact && (
          <div className="flex flex-wrap gap-1 mb-3">
            {poi.tags.slice(0, 4).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
              >
                #{tag}
              </span>
            ))}
            {poi.tags.length > 4 && (
              <span className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                +{poi.tags.length - 4}
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onDirections?.(poi)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <DirectionsIcon className="w-4 h-4" />
            <span>Directions</span>
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onToggleFavorite?.(poi)}
            className={`p-2 rounded-lg border-2 transition-colors ${
              isFavorite
                ? 'bg-red-50 border-red-200 text-red-600'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-red-50 hover:border-red-200 hover:text-red-600'
            }`}
          >
            {isFavorite ? (
              <HeartIconSolid className="w-5 h-5" />
            ) : (
              <HeartIcon className="w-5 h-5" />
            )}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onToggleBookmark?.(poi)}
            className={`p-2 rounded-lg border-2 transition-colors ${
              isBookmarked
                ? 'bg-blue-50 border-blue-200 text-blue-600'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600'
            }`}
          >
            {isBookmarked ? (
              <BookmarkIconSolid className="w-5 h-5" />
            ) : (
              <BookmarkIcon className="w-5 h-5" />
            )}
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onShare?.(poi)}
            className="p-2 rounded-lg border-2 border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <ShareIcon className="w-5 h-5" />
          </motion.button>
        </div>

        {/* View Details Button */}
        {!compact && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onViewDetails?.(poi)}
            className="w-full mt-3 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
          >
            <EyeIcon className="w-4 h-4" />
            <span>View Details</span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};