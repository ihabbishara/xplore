'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon, 
  StarIcon, 
  MapPinIcon, 
  ClockIcon, 
  PhoneIcon, 
  GlobeAltIcon,
  HeartIcon,
  ShareIcon,
  DirectionsIcon,
  BookmarkIcon,
  CameraIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  TagIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  EyeIcon,
  PlusIcon,
  MinusIcon,
} from '@heroicons/react/24/outline';
import { 
  StarIcon as StarIconSolid,
  HeartIcon as HeartIconSolid,
  BookmarkIcon as BookmarkIconSolid,
} from '@heroicons/react/24/solid';
import { POI, POICollection, DEFAULT_POI_LAYERS } from '../types/poi';
import { usePoiStore } from '../hooks/usePoiStore';
import { useMapStore } from '../hooks/useMapStore';

interface POIDetailsPanelProps {
  poi: POI;
  isOpen: boolean;
  onClose: () => void;
  onDirections?: (poi: POI) => void;
  onAddToCollection?: (poi: POI, collection: POICollection) => void;
  onToggleFavorite?: (poi: POI) => void;
  onShare?: (poi: POI) => void;
  onEdit?: (poi: POI) => void;
  onDelete?: (poi: POI) => void;
  onReportIssue?: (poi: POI, issue: string) => void;
  isFavorite?: boolean;
  isBookmarked?: boolean;
  canEdit?: boolean;
  className?: string;
}

export const POIDetailsPanel: React.FC<POIDetailsPanelProps> = ({
  poi,
  isOpen,
  onClose,
  onDirections,
  onAddToCollection,
  onToggleFavorite,
  onShare,
  onEdit,
  onDelete,
  onReportIssue,
  isFavorite = false,
  isBookmarked = false,
  canEdit = false,
  className = '',
}) => {
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showAllAmenities, setShowAllAmenities] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [reportIssue, setReportIssue] = useState('');
  const [showCollectionSelector, setShowCollectionSelector] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<string>('');
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'reviews' | 'photos' | 'hours'>('details');

  const { collections } = usePoiStore();
  const { setSelectedPOI } = useMapStore();

  const layerConfig = DEFAULT_POI_LAYERS[poi.type];

  // Mock data for demonstration
  const mockReviews = [
    {
      id: '1',
      author: 'John Doe',
      rating: 5,
      comment: 'Amazing place! Highly recommend visiting.',
      date: '2024-01-15',
      helpful: 12,
    },
    {
      id: '2',
      author: 'Jane Smith',
      rating: 4,
      comment: 'Great atmosphere and good service.',
      date: '2024-01-10',
      helpful: 8,
    },
  ];

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

  const getOpeningHoursForDay = (day: string) => {
    if (!poi.openingHours) return null;
    
    const dayKey = day.toLowerCase().substring(0, 3) as keyof typeof poi.openingHours;
    const hours = poi.openingHours[dayKey];
    
    if (!hours) return 'Closed';
    if (poi.openingHours.isOpen24Hours) return '24 hours';
    if (poi.openingHours.isClosed) return 'Closed';
    
    return `${hours.open} - ${hours.close}`;
  };

  const isOpenNow = () => {
    if (!poi.openingHours) return null;
    if (poi.openingHours.isOpen24Hours) return true;
    if (poi.openingHours.isClosed) return false;
    
    const now = new Date();
    const dayOfWeek = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase().substring(0, 3);
    const currentTime = now.getHours() * 100 + now.getMinutes();
    
    const todayHours = poi.openingHours[dayOfWeek as keyof typeof poi.openingHours];
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

  const handleReportSubmit = () => {
    if (reportIssue.trim()) {
      onReportIssue?.(poi, reportIssue);
      setReportIssue('');
      setShowReportForm(false);
    }
  };

  const handleAddToCollection = () => {
    if (selectedCollection) {
      const collection = collections.find(c => c.id === selectedCollection);
      if (collection) {
        onAddToCollection?.(poi, collection);
        setShowCollectionSelector(false);
        setSelectedCollection('');
      }
    }
  };

  const visibleAmenities = showAllAmenities ? poi.amenities : poi.amenities?.slice(0, 6);
  const visibleTags = showAllTags ? poi.tags : poi.tags?.slice(0, 6);
  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Details Panel */}
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={`fixed top-0 right-0 h-full w-full max-w-2xl bg-white shadow-xl z-50 flex flex-col ${className}`}
          >
            {/* Header */}
            <div className="relative">
              {/* Photo Gallery */}
              {poi.photos && poi.photos.length > 0 ? (
                <div className="relative h-64 bg-gray-100">
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
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                      >
                        <ChevronLeftIcon className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={() => handlePhotoNavigation('next')}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
                      >
                        <ChevronRightIcon className="w-5 h-5" />
                      </button>
                      
                      {/* Photo indicator */}
                      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                        {poi.photos.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => setCurrentPhotoIndex(index)}
                            className={`w-3 h-3 rounded-full transition-colors ${
                              index === currentPhotoIndex ? 'bg-white' : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <CameraIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">No photos available</p>
                  </div>
                </div>
              )}
              
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
              
              {/* POI Type Badge */}
              <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: layerConfig.color }}
                />
                <span className="text-sm font-medium text-gray-900">{layerConfig.name}</span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {/* Title Section */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {poi.name}
                    </h1>
                    
                    {poi.address && (
                      <div className="flex items-center text-gray-600 mb-2">
                        <MapPinIcon className="w-4 h-4 mr-2" />
                        <span>{poi.address}</span>
                      </div>
                    )}
                    
                    {/* Rating and Status */}
                    <div className="flex items-center space-x-4">
                      {poi.rating && (
                        <div className="flex items-center space-x-1">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <StarIconSolid
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(poi.rating!)
                                    ? 'text-yellow-500'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {formatRating(poi.rating)}
                          </span>
                          {poi.reviewCount && (
                            <span className="text-sm text-gray-500">
                              ({poi.reviewCount.toLocaleString()} reviews)
                            </span>
                          )}
                        </div>
                      )}
                      
                      {poi.openingHours && (
                        <div className="flex items-center space-x-1">
                          <ClockIcon className="w-4 h-4 text-gray-500" />
                          <span className={`text-sm font-medium ${
                            openStatus === true ? 'text-green-600' : 
                            openStatus === false ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {openStatus === true ? 'Open now' : 
                             openStatus === false ? 'Closed' : 'Hours unknown'}
                          </span>
                        </div>
                      )}
                      
                      {poi.priceRange && (
                        <span className="text-sm text-gray-600 font-medium">
                          {formatPriceRange(poi.priceRange)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 ml-4">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onToggleFavorite?.(poi)}
                      className={`p-2 rounded-full transition-colors ${
                        isFavorite
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {isFavorite ? (
                        <HeartIconSolid className="w-5 h-5" />
                      ) : (
                        <HeartIcon className="w-5 h-5" />
                      )}
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowCollectionSelector(true)}
                      className={`p-2 rounded-full transition-colors ${
                        isBookmarked
                          ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {isBookmarked ? (
                        <BookmarkIconSolid className="w-5 h-5" />
                      ) : (
                        <BookmarkIcon className="w-5 h-5" />
                      )}
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => onShare?.(poi)}
                      className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                      <ShareIcon className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>
                
                {/* Primary Action */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onDirections?.(poi)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
                >
                  <DirectionsIcon className="w-5 h-5" />
                  <span>Get Directions</span>
                </motion.button>
              </div>

              {/* Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { id: 'details', label: 'Details', icon: InformationCircleIcon },
                    { id: 'reviews', label: 'Reviews', icon: StarIcon },
                    { id: 'photos', label: 'Photos', icon: CameraIcon },
                    { id: 'hours', label: 'Hours', icon: ClockIcon },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <tab.icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </div>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'details' && (
                  <div className="space-y-6">
                    {/* Description */}
                    {poi.description && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                        <p className={`text-gray-600 ${
                          !showFullDescription ? 'line-clamp-3' : ''
                        }`}>
                          {poi.description}
                        </p>
                        {poi.description.length > 200 && (
                          <button
                            onClick={() => setShowFullDescription(!showFullDescription)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                          >
                            {showFullDescription ? 'Show less' : 'Show more'}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Contact Information */}
                    {(poi.phone || poi.website) && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Contact</h3>
                        <div className="space-y-2">
                          {poi.phone && (
                            <a
                              href={`tel:${poi.phone}`}
                              className="flex items-center text-blue-600 hover:text-blue-800"
                            >
                              <PhoneIcon className="w-4 h-4 mr-2" />
                              {poi.phone}
                            </a>
                          )}
                          
                          {poi.website && (
                            <a
                              href={poi.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center text-blue-600 hover:text-blue-800"
                            >
                              <GlobeAltIcon className="w-4 h-4 mr-2" />
                              Visit Website
                            </a>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Amenities */}
                    {poi.amenities && poi.amenities.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Amenities</h3>
                        <div className="flex flex-wrap gap-2">
                          {visibleAmenities?.map((amenity, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full"
                            >
                              <CheckCircleIcon className="w-4 h-4 mr-1" />
                              {amenity}
                            </span>
                          ))}
                        </div>
                        
                        {poi.amenities.length > 6 && (
                          <button
                            onClick={() => setShowAllAmenities(!showAllAmenities)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                          >
                            {showAllAmenities ? 'Show less' : `+${poi.amenities.length - 6} more`}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Tags */}
                    {poi.tags && poi.tags.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Tags</h3>
                        <div className="flex flex-wrap gap-2">
                          {visibleTags?.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
                            >
                              <TagIcon className="w-4 h-4 mr-1" />
                              #{tag}
                            </span>
                          ))}
                        </div>
                        
                        {poi.tags.length > 6 && (
                          <button
                            onClick={() => setShowAllTags(!showAllTags)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                          >
                            {showAllTags ? 'Show less' : `+${poi.tags.length - 6} more`}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Source Information */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-3">Source</h3>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${
                          poi.source === 'google' ? 'bg-blue-500' :
                          poi.source === 'custom' ? 'bg-purple-500' :
                          poi.source === 'osm' ? 'bg-green-500' :
                          'bg-gray-500'
                        }`} />
                        <span className="text-sm text-gray-600 capitalize">
                          {poi.source === 'osm' ? 'OpenStreetMap' : poi.source}
                        </span>
                        {poi.isUserGenerated && (
                          <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            User Generated
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-4">
                    {mockReviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-200 pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-600">
                                {review.author.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{review.author}</div>
                              <div className="text-sm text-gray-500">{review.date}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <StarIconSolid
                                key={i}
                                className={`w-4 h-4 ${
                                  i < review.rating ? 'text-yellow-500' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mb-2">{review.comment}</p>
                        
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>{review.helpful} found this helpful</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'photos' && (
                  <div className="grid grid-cols-2 gap-4">
                    {poi.photos?.map((photo, index) => (
                      <div
                        key={index}
                        className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                        onClick={() => setCurrentPhotoIndex(index)}
                      >
                        <img
                          src={photo}
                          alt={`${poi.name} photo ${index + 1}`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'hours' && (
                  <div className="space-y-3">
                    {daysOfWeek.map((day) => (
                      <div key={day} className="flex items-center justify-between">
                        <span className="text-gray-900 font-medium">{day}</span>
                        <span className="text-gray-600">
                          {getOpeningHoursForDay(day)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer Actions */}
            <div className="border-t border-gray-200 p-6 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {canEdit && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onEdit?.(poi)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Edit
                    </motion.button>
                  )}
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowReportForm(true)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors flex items-center space-x-2"
                  >
                    <ExclamationTriangleIcon className="w-4 h-4" />
                    <span>Report Issue</span>
                  </motion.button>
                </div>
                
                <div className="text-sm text-gray-500">
                  {poi.createdAt && (
                    <span>Added {new Date(poi.createdAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Collection Selector Modal */}
          <AnimatePresence>
            {showCollectionSelector && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-60"
                onClick={() => setShowCollectionSelector(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Add to Collection
                  </h3>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {collections.map((collection) => (
                      <label
                        key={collection.id}
                        className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                      >
                        <input
                          type="radio"
                          name="collection"
                          value={collection.id}
                          checked={selectedCollection === collection.id}
                          onChange={(e) => setSelectedCollection(e.target.value)}
                          className="text-blue-600 focus:ring-blue-500"
                        />
                        <div>
                          <div className="font-medium text-gray-900">
                            {collection.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {collection.itemCount} items
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  
                  <div className="flex items-center space-x-3 mt-6">
                    <button
                      onClick={handleAddToCollection}
                      disabled={!selectedCollection}
                      className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Add to Collection
                    </button>
                    <button
                      onClick={() => setShowCollectionSelector(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Report Issue Modal */}
          <AnimatePresence>
            {showReportForm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 flex items-center justify-center z-60"
                onClick={() => setShowReportForm(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-lg p-6 max-w-md w-full mx-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Report an Issue
                  </h3>
                  
                  <textarea
                    value={reportIssue}
                    onChange={(e) => setReportIssue(e.target.value)}
                    placeholder="Describe the issue with this location..."
                    className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                  
                  <div className="flex items-center space-x-3 mt-4">
                    <button
                      onClick={handleReportSubmit}
                      className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                    >
                      Submit Report
                    </button>
                    <button
                      onClick={() => setShowReportForm(false)}
                      className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
};