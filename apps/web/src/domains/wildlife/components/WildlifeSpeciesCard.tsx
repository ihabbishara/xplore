'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Camera,
  MapPin,
  Clock,
  AlertCircle,
  Calendar,
  Volume2,
  Eye,
  ChevronRight,
  Shield,
  TrendingUp,
  TrendingDown,
  Heart,
  Share2,
  Info,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import {
  WildlifeSpecies,
  ConservationStatus,
  ActivityPeriod,
  Season,
  CONSERVATION_STATUS_COLORS,
} from '../types/wildlife';
import { useCommunityStore } from '../hooks/useCommunityStore';

interface WildlifeSpeciesCardProps {
  species: WildlifeSpecies;
  onSelect?: (species: WildlifeSpecies) => void;
  onSightingReport?: (species: WildlifeSpecies) => void;
  showActions?: boolean;
  expanded?: boolean;
  className?: string;
}

const activityPeriodIcons: Record<ActivityPeriod, React.ReactElement> = {
  [ActivityPeriod.DAWN]: <span className="text-orange-400">🌅</span>,
  [ActivityPeriod.MORNING]: <span className="text-yellow-400">🌤️</span>,
  [ActivityPeriod.MIDDAY]: <span className="text-yellow-500">☀️</span>,
  [ActivityPeriod.AFTERNOON]: <span className="text-orange-500">🌤️</span>,
  [ActivityPeriod.DUSK]: <span className="text-purple-500">🌆</span>,
  [ActivityPeriod.NIGHT]: <span className="text-indigo-600">🌙</span>,
  [ActivityPeriod.ALL_DAY]: <span className="text-blue-500">🕐</span>,
};

const populationTrendIcons = {
  increasing: <TrendingUp className="h-4 w-4 text-green-500" />,
  stable: <span className="text-blue-500">➡️</span>,
  decreasing: <TrendingDown className="h-4 w-4 text-red-500" />,
  unknown: <HelpCircle className="h-4 w-4 text-gray-500" />,
};

export const WildlifeSpeciesCard: React.FC<WildlifeSpeciesCardProps> = ({
  species,
  onSelect,
  onSightingReport,
  showActions = true,
  expanded = false,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [playingSound, setPlayingSound] = useState(false);
  
  const { toggleFollowSpecies, isFollowingSpecies } = useCommunityStore();
  const isFollowing = isFollowingSpecies(species.id);

  const handlePlaySound = async () => {
    if (species.sounds && species.sounds.length > 0) {
      setPlayingSound(true);
      try {
        const audio = new Audio(species.sounds[0]);
        audio.play();
        audio.onended = () => setPlayingSound(false);
      } catch (error) {
        console.error('Failed to play sound:', error);
        setPlayingSound(false);
      }
    }
  };

  const getCurrentSeason = (): Season => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return Season.SPRING;
    if (month >= 5 && month <= 7) return Season.SUMMER;
    if (month >= 8 && month <= 10) return Season.FALL;
    return Season.WINTER;
  };

  const getCurrentSeasonBehavior = () => {
    const currentSeason = getCurrentSeason();
    return species.seasonalBehavior.find(b => b.season === currentSeason);
  };

  const conservationBadgeStyle = {
    backgroundColor: CONSERVATION_STATUS_COLORS[species.conservationStatus] + '20',
    color: CONSERVATION_STATUS_COLORS[species.conservationStatus],
    borderColor: CONSERVATION_STATUS_COLORS[species.conservationStatus],
  };

  return (
    <>
      <Card
        className={`p-4 hover:shadow-lg transition-all duration-200 cursor-pointer ${className}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3 flex-1">
            {/* Thumbnail */}
            <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
              <img
                src={species.photos.thumbnail}
                alt={species.commonName}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{species.commonName}</h3>
              <Text className="text-sm text-gray-600 dark:text-gray-400 italic">
                {species.scientificName}
              </Text>
              
              {/* Conservation Status & Population Trend */}
              <div className="flex items-center gap-2 mt-2">
                <Badge
                  variant="outline"
                  style={conservationBadgeStyle}
                  className="border"
                >
                  {species.conservationStatus.replace('_', ' ')}
                </Badge>
                <div className="flex items-center gap-1">
                  {populationTrendIcons[species.populationTrend]}
                  <Text className="text-xs text-gray-500">
                    {species.populationTrend}
                  </Text>
                </div>
              </div>
            </div>
          </div>

          <ChevronRight
            className={`h-5 w-5 text-gray-400 transition-transform ${
              isExpanded ? 'rotate-90' : ''
            }`}
          />
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-gray-400" />
            <Text className="text-gray-600 dark:text-gray-400">
              {species.preferredHabitats.slice(0, 2).join(', ')}
              {species.preferredHabitats.length > 2 && ' +more'}
            </Text>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-gray-400" />
            <div className="flex gap-1">
              {species.activityPeriods.slice(0, 3).map(period => (
                <span key={period} title={period}>
                  {activityPeriodIcons[period]}
                </span>
              ))}
              {species.activityPeriods.length > 3 && (
                <Text className="text-gray-500">+{species.activityPeriods.length - 3}</Text>
              )}
            </div>
          </div>
        </div>

        {/* Size Info */}
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
          <Text>
            Size: {species.size.length.min}-{species.size.length.max}{species.size.length.unit} • 
            Weight: {species.size.weight.min}-{species.size.weight.max}{species.size.weight.unit}
          </Text>
        </div>

        {/* Expanded Content */}
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 pt-4 border-t space-y-4"
          >
            {/* Current Season Behavior */}
            {getCurrentSeasonBehavior() && (
              <Card className="p-3 bg-blue-50 dark:bg-blue-900/20">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  <Text className="font-medium text-blue-800 dark:text-blue-200">
                    Current Season Activity
                  </Text>
                </div>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {getCurrentSeasonBehavior()?.behavior.map((b, idx) => (
                    <li key={idx}>{b}</li>
                  ))}
                </ul>
              </Card>
            )}

            {/* Identification Features */}
            <div>
              <Text className="font-medium mb-2">Key Identification Features:</Text>
              <div className="flex flex-wrap gap-1">
                {species.identificationFeatures.map((feature, idx) => (
                  <Badge key={idx} variant="ghost" size="sm">
                    {feature}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Safety Info */}
            {species.dangerLevel !== 'harmless' && (
              <Card className="p-3 bg-yellow-50 dark:bg-yellow-900/20">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-yellow-600" />
                  <Text className="font-medium text-yellow-800 dark:text-yellow-200">
                    Safety: {species.dangerLevel} risk
                  </Text>
                </div>
                <Text className="text-sm text-yellow-700 dark:text-yellow-300">
                  {species.safetyGuidelines[0]}
                </Text>
              </Card>
            )}

            {/* Photography Tips */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Camera className="h-4 w-4 text-gray-600" />
                <Text className="font-medium">Photography Tips</Text>
              </div>
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                Best distance: {species.photographyTips.recommendedDistance}m • 
                Best time: {species.photographyTips.bestTime.join(', ')}
              </Text>
            </div>

            {/* Action Buttons */}
            {showActions && (
              <div className="flex gap-2 pt-2">
                {species.sounds && species.sounds.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlaySound();
                    }}
                    disabled={playingSound}
                  >
                    <Volume2 className={`h-4 w-4 ${playingSound ? 'animate-pulse' : ''}`} />
                  </Button>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFollowSpecies(species.id);
                  }}
                >
                  <Heart className={`h-4 w-4 ${isFollowing ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetailsModal(true);
                  }}
                >
                  <Info className="h-4 w-4" />
                </Button>
                
                {onSightingReport && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSightingReport(species);
                    }}
                    className="ml-auto"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Report Sighting
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </Card>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title={species.commonName}
        className="max-w-3xl"
      >
        <div className="space-y-6">
          {/* Gallery */}
          <div className="grid grid-cols-3 gap-2">
            {species.photos.gallery.slice(0, 6).map((photo, idx) => (
              <img
                key={idx}
                src={photo}
                alt={`${species.commonName} ${idx + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
            ))}
          </div>

          {/* Detailed Description */}
          <div>
            <h4 className="font-semibold mb-2">Description</h4>
            <Text className="text-gray-600 dark:text-gray-400">
              {species.description}
            </Text>
          </div>

          {/* Diet */}
          <div>
            <h4 className="font-semibold mb-2">Diet</h4>
            <div className="flex flex-wrap gap-2">
              {species.diet.map((food, idx) => (
                <Badge key={idx} variant="outline">
                  {food}
                </Badge>
              ))}
            </div>
          </div>

          {/* Habitats */}
          <div>
            <h4 className="font-semibold mb-2">Preferred Habitats</h4>
            <div className="flex flex-wrap gap-2">
              {species.preferredHabitats.map((habitat, idx) => (
                <Badge key={idx} variant="secondary">
                  {habitat}
                </Badge>
              ))}
            </div>
            {species.altitudeRange && (
              <Text className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Altitude range: {species.altitudeRange.min} - {species.altitudeRange.max}m
              </Text>
            )}
          </div>

          {/* Similar Species */}
          {species.similarSpecies.length > 0 && (
            <div>
              <h4 className="font-semibold mb-2">Similar Species</h4>
              <ul className="list-disc list-inside text-sm space-y-1">
                {species.similarSpecies.map((similar, idx) => (
                  <li key={idx}>{similar}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Interesting Facts */}
          <Card className="p-4 bg-green-50 dark:bg-green-900/20">
            <h4 className="font-semibold mb-2 text-green-800 dark:text-green-200">
              Interesting Facts
            </h4>
            <ul className="list-disc list-inside text-sm space-y-1">
              {species.interestingFacts.map((fact, idx) => (
                <li key={idx}>{fact}</li>
              ))}
            </ul>
          </Card>

          {/* Photography Guide */}
          <Card className="p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Photography Guide
            </h4>
            <div className="space-y-3">
              <div>
                <Text className="font-medium text-sm">Behavioral Cues to Watch:</Text>
                <ul className="list-disc list-inside text-sm space-y-1 mt-1">
                  {species.photographyTips.behavioralCues.map((cue, idx) => (
                    <li key={idx}>{cue}</li>
                  ))}
                </ul>
              </div>
              <div>
                <Text className="font-medium text-sm">Equipment Tips:</Text>
                <ul className="list-disc list-inside text-sm space-y-1 mt-1">
                  {species.photographyTips.equipmentTips.map((tip, idx) => (
                    <li key={idx}>{tip}</li>
                  ))}
                </ul>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                <Text className="font-medium text-sm text-blue-800 dark:text-blue-200">
                  Ethical Guidelines:
                </Text>
                <ul className="list-disc list-inside text-sm space-y-1 mt-1">
                  {species.photographyTips.ethicalGuidelines.map((guideline, idx) => (
                    <li key={idx}>{guideline}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          {/* Cultural Significance */}
          {species.culturalSignificance && (
            <div>
              <h4 className="font-semibold mb-2">Cultural Significance</h4>
              <Text className="text-gray-600 dark:text-gray-400">
                {species.culturalSignificance}
              </Text>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};