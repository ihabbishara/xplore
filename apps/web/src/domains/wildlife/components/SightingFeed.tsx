'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  Clock,
  Camera,
  MessageCircle,
  Heart,
  Share2,
  CheckCircle,
  AlertCircle,
  MoreVertical,
  Filter,
  RefreshCw,
  Eye,
  Users,
  Shield,
  TrendingUp,
  Image as ImageIcon,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import {
  WildlifeSighting,
  VerificationStatus,
  BehaviorType,
  HabitatType,
} from '../types/wildlife';
import { useWildlifeStore } from '../hooks/useWildlifeStore';
import { useCommunityStore } from '../hooks/useCommunityStore';

interface SightingFeedProps {
  sightings?: WildlifeSighting[];
  onSightingSelect?: (sighting: WildlifeSighting) => void;
  showFilters?: boolean;
  realtime?: boolean;
  className?: string;
}

const verificationIcons = {
  [VerificationStatus.PENDING]: <Clock className="h-4 w-4 text-gray-500" />,
  [VerificationStatus.VERIFIED]: <CheckCircle className="h-4 w-4 text-green-500" />,
  [VerificationStatus.EXPERT_VERIFIED]: <Shield className="h-4 w-4 text-blue-500" />,
  [VerificationStatus.DISPUTED]: <AlertCircle className="h-4 w-4 text-yellow-500" />,
  [VerificationStatus.REJECTED]: <AlertCircle className="h-4 w-4 text-red-500" />,
};

const behaviorEmojis: Record<BehaviorType, string> = {
  [BehaviorType.FEEDING]: '🍃',
  [BehaviorType.RESTING]: '😴',
  [BehaviorType.HUNTING]: '🎯',
  [BehaviorType.MATING]: '❤️',
  [BehaviorType.NESTING]: '🪺',
  [BehaviorType.MIGRATING]: '🦅',
  [BehaviorType.TERRITORIAL]: '⚔️',
  [BehaviorType.SOCIAL]: '👥',
  [BehaviorType.GROOMING]: '🧹',
  [BehaviorType.PLAYING]: '🎾',
};

export const SightingFeed: React.FC<SightingFeedProps> = ({
  sightings: propSightings,
  onSightingSelect,
  showFilters = true,
  realtime = false,
  className = '',
}) => {
  const {
    sightings: storeSightings,
    realtimeSightings,
    loading,
    loadSightings,
    selectSighting,
    verifySightingReport,
  } = useWildlifeStore();
  
  const {
    loadSightingComments,
    postComment,
    toggleLike,
    isLiked,
    getCommentsForSighting,
  } = useCommunityStore();

  const [selectedFilter, setSelectedFilter] = useState<'all' | 'verified' | 'nearby'>('all');
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedSightingId, setSelectedSightingId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [isAutoRefresh, setIsAutoRefresh] = useState(realtime);
  const refreshIntervalRef = useRef<NodeJS.Timeout>();

  const displaySightings = propSightings || (realtime ? realtimeSightings : storeSightings);

  useEffect(() => {
    if (!propSightings && !realtime) {
      loadSightings();
    }
  }, [propSightings, realtime, loadSightings]);

  useEffect(() => {
    if (isAutoRefresh && realtime) {
      refreshIntervalRef.current = setInterval(() => {
        loadSightings();
      }, 30000); // Refresh every 30 seconds

      return () => {
        if (refreshIntervalRef.current) {
          clearInterval(refreshIntervalRef.current);
        }
      };
    }
  }, [isAutoRefresh, realtime, loadSightings]);

  const handleSightingClick = (sighting: WildlifeSighting) => {
    selectSighting(sighting);
    if (onSightingSelect) {
      onSightingSelect(sighting);
    }
  };

  const handleShowComments = async (sightingId: string) => {
    setSelectedSightingId(sightingId);
    setShowCommentsModal(true);
    await loadSightingComments(sightingId);
  };

  const handlePostComment = async () => {
    if (selectedSightingId && commentText.trim()) {
      await postComment(selectedSightingId, commentText);
      setCommentText('');
    }
  };

  const handleVerify = async (sightingId: string, status: VerificationStatus) => {
    await verifySightingReport(sightingId, status);
  };

  const filteredSightings = displaySightings.filter(sighting => {
    if (selectedFilter === 'verified') {
      return sighting.verificationStatus === VerificationStatus.VERIFIED ||
             sighting.verificationStatus === VerificationStatus.EXPERT_VERIFIED;
    }
    // Add more filter logic as needed
    return true;
  });

  const renderSightingCard = (sighting: WildlifeSighting, index: number) => {
    const liked = isLiked(sighting.id);
    const comments = getCommentsForSighting(sighting.id);
    
    return (
      <motion.div
        key={sighting.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
      >
        <Card
          className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => handleSightingClick(sighting)}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <Avatar
                src={sighting.userAvatar}
                alt={sighting.userName || 'User'}
                size="sm"
              />
              <div>
                <Text className="font-medium">{sighting.userName || 'Anonymous'}</Text>
                <Text className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(sighting.timestamp), { addSuffix: true })}
                </Text>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {verificationIcons[sighting.verificationStatus]}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  // Show options menu
                }}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Species Info */}
          <div className="mb-3">
            <h4 className="font-semibold text-lg">{sighting.species}</h4>
            {sighting.scientificName && (
              <Text className="text-sm text-gray-600 dark:text-gray-400 italic">
                {sighting.scientificName}
              </Text>
            )}
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" size="sm">
                {sighting.count} individual{sighting.count > 1 ? 's' : ''}
              </Badge>
              {sighting.distance && (
                <Badge variant="outline" size="sm">
                  {sighting.distance}m away
                </Badge>
              )}
            </div>
          </div>

          {/* Location & Habitat */}
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <Text>{sighting.locationName || 'Location hidden'}</Text>
            </div>
            <Badge variant="ghost" size="sm">
              {sighting.habitatType}
            </Badge>
          </div>

          {/* Behaviors */}
          {sighting.behavior.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {sighting.behavior.map(behavior => (
                <Badge key={behavior} variant="outline" size="sm" className="gap-1">
                  <span>{behaviorEmojis[behavior]}</span>
                  {behavior}
                </Badge>
              ))}
            </div>
          )}

          {/* Photos */}
          {sighting.photos && sighting.photos.length > 0 && (
            <div className="mb-3">
              {sighting.photos.length === 1 ? (
                <img
                  src={sighting.photos[0]}
                  alt="Wildlife sighting"
                  className="w-full h-48 object-cover rounded-lg"
                />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {sighting.photos.slice(0, 4).map((photo, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={photo}
                        alt={`Sighting ${idx + 1}`}
                        className="w-full h-24 object-cover rounded"
                      />
                      {idx === 3 && sighting.photos!.length > 4 && (
                        <div className="absolute inset-0 bg-black/60 rounded flex items-center justify-center">
                          <Text className="text-white font-medium">
                            +{sighting.photos!.length - 4}
                          </Text>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          {sighting.notes && (
            <Text className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
              {sighting.notes}
            </Text>
          )}

          {/* Weather Conditions */}
          <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
            <span>🌡️ {sighting.weatherConditions.temperature}°C</span>
            <span>☁️ {sighting.weatherConditions.conditions}</span>
            <span>👁️ {sighting.weatherConditions.visibility}km visibility</span>
          </div>

          {/* Interaction Bar */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleLike(sighting.id);
                }}
                className="gap-1"
              >
                <Heart className={`h-4 w-4 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
                <span>{sighting.likes}</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleShowComments(sighting.id);
                }}
                className="gap-1"
              >
                <MessageCircle className="h-4 w-4" />
                <span>{comments.length}</span>
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  // Share functionality
                }}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Quick Verify */}
            {sighting.verificationStatus === VerificationStatus.PENDING && (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVerify(sighting.id, VerificationStatus.VERIFIED);
                  }}
                  className="text-green-600 hover:text-green-700"
                >
                  <CheckCircle className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleVerify(sighting.id, VerificationStatus.DISPUTED);
                  }}
                  className="text-yellow-600 hover:text-yellow-700"
                >
                  <AlertCircle className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className={className}>
      {/* Filters */}
      {showFilters && (
        <div className="mb-4 flex items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={selectedFilter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter('all')}
            >
              All Sightings
            </Button>
            <Button
              variant={selectedFilter === 'verified' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter('verified')}
              className="gap-1"
            >
              <CheckCircle className="h-4 w-4" />
              Verified
            </Button>
            <Button
              variant={selectedFilter === 'nearby' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter('nearby')}
              className="gap-1"
            >
              <MapPin className="h-4 w-4" />
              Nearby
            </Button>
          </div>

          {realtime && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAutoRefresh(!isAutoRefresh)}
              className={`gap-1 ${isAutoRefresh ? 'text-green-600' : ''}`}
            >
              <RefreshCw className={`h-4 w-4 ${isAutoRefresh ? 'animate-spin' : ''}`} />
              {isAutoRefresh ? 'Live' : 'Paused'}
            </Button>
          )}
        </div>
      )}

      {/* Realtime Indicator */}
      {realtime && isAutoRefresh && (
        <Card className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
            <Text className="text-sm text-green-700 dark:text-green-300">
              Live sightings feed - updates every 30 seconds
            </Text>
          </div>
        </Card>
      )}

      {/* Sightings List */}
      <div className="space-y-4">
        <AnimatePresence mode="popLayout">
          {filteredSightings.map((sighting, index) => renderSightingCard(sighting, index))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredSightings.length === 0 && !loading && (
        <Card className="p-8 text-center">
          <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <Text className="text-gray-600 dark:text-gray-400">
            No sightings to show
          </Text>
          <Text className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Be the first to report a wildlife sighting in this area!
          </Text>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Comments Modal */}
      <Modal
        isOpen={showCommentsModal}
        onClose={() => {
          setShowCommentsModal(false);
          setSelectedSightingId(null);
          setCommentText('');
        }}
        title="Comments"
        className="max-w-lg"
      >
        {selectedSightingId && (
          <div className="space-y-4">
            {/* Comments List */}
            <div className="max-h-96 overflow-y-auto space-y-3">
              {getCommentsForSighting(selectedSightingId).map(comment => (
                <div key={comment.id} className="flex gap-3">
                  <Avatar
                    src={comment.userAvatar}
                    alt={comment.userName}
                    size="sm"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Text className="font-medium text-sm">{comment.userName}</Text>
                      {comment.isExpert && (
                        <Badge variant="secondary" size="sm">
                          Expert
                        </Badge>
                      )}
                      <Text className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(comment.timestamp), { addSuffix: true })}
                      </Text>
                    </div>
                    <Text className="text-sm mt-1">{comment.text}</Text>
                  </div>
                </div>
              ))}
              
              {getCommentsForSighting(selectedSightingId).length === 0 && (
                <Text className="text-center text-gray-500 py-4">
                  No comments yet. Be the first to comment!
                </Text>
              )}
            </div>

            {/* Add Comment */}
            <div className="border-t pt-4">
              <Textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                rows={3}
                className="mb-2"
              />
              <Button
                variant="default"
                size="sm"
                onClick={handlePostComment}
                disabled={!commentText.trim()}
                className="w-full"
              >
                Post Comment
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};