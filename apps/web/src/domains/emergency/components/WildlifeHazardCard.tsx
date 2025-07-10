'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Eye,
  Volume2,
  MapPin,
  Clock,
  Shield,
  Heart,
  ChevronRight,
  AlertCircle,
  Activity,
  Droplets,
  Bug,
  Info,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { WildlifeHazard, HazardLevel } from '../types/emergency';

interface WildlifeHazardCardProps {
  hazard: WildlifeHazard;
  onLearnMore?: () => void;
  expanded?: boolean;
  showActions?: boolean;
  className?: string;
}

const hazardLevelColors: Record<HazardLevel, string> = {
  [HazardLevel.CRITICAL]: 'bg-red-500 text-white',
  [HazardLevel.EXTREME]: 'bg-orange-500 text-white',
  [HazardLevel.HIGH]: 'bg-yellow-500 text-white',
  [HazardLevel.MODERATE]: 'bg-blue-500 text-white',
  [HazardLevel.LOW]: 'bg-green-500 text-white',
};

const hazardLevelBorders: Record<HazardLevel, string> = {
  [HazardLevel.CRITICAL]: 'border-red-200 dark:border-red-800',
  [HazardLevel.EXTREME]: 'border-orange-200 dark:border-orange-800',
  [HazardLevel.HIGH]: 'border-yellow-200 dark:border-yellow-800',
  [HazardLevel.MODERATE]: 'border-blue-200 dark:border-blue-800',
  [HazardLevel.LOW]: 'border-green-200 dark:border-green-800',
};

export const WildlifeHazardCard: React.FC<WildlifeHazardCardProps> = ({
  hazard,
  onLearnMore,
  expanded = false,
  showActions = true,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [playingSound, setPlayingSound] = useState(false);

  const playAnimalSound = async () => {
    if (hazard.sounds && hazard.sounds.length > 0) {
      setPlayingSound(true);
      // In a real app, this would play the actual sound file
      try {
        const audio = new Audio(hazard.sounds[0]);
        audio.play();
        audio.onended = () => setPlayingSound(false);
      } catch (error) {
        console.error('Failed to play sound:', error);
        setPlayingSound(false);
      }
    }
  };

  const getCurrentActivity = () => {
    const now = new Date();
    const currentHour = now.getHours();
    
    for (const period of hazard.activePeriods) {
      const [startHour] = period.start.split(':').map(Number);
      const [endHour] = period.end.split(':').map(Number);
      
      if (
        (startHour <= endHour && currentHour >= startHour && currentHour < endHour) ||
        (startHour > endHour && (currentHour >= startHour || currentHour < endHour))
      ) {
        return 'Active Now';
      }
    }
    
    return 'Inactive';
  };

  const isCurrentlyActive = getCurrentActivity() === 'Active Now';

  return (
    <>
      <Card
        className={`
          p-4 transition-all duration-200 hover:shadow-lg cursor-pointer
          ${hazardLevelBorders[hazard.dangerLevel]}
          ${className}
        `}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${hazardLevelColors[hazard.dangerLevel]} bg-opacity-20`}>
              <Bug className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{hazard.commonName}</h3>
              <Text className="text-sm text-gray-600 dark:text-gray-400 italic">
                {hazard.scientificName}
              </Text>
              <div className="flex items-center gap-2 mt-1">
                <Badge
                  variant="secondary"
                  className={hazardLevelColors[hazard.dangerLevel]}
                >
                  {hazard.dangerLevel} Risk
                </Badge>
                {isCurrentlyActive && (
                  <Badge variant="destructive" className="animate-pulse">
                    <Activity className="h-3 w-3 mr-1" />
                    Active Now
                  </Badge>
                )}
                {hazard.venomous && (
                  <Badge variant="outline" className="border-purple-500 text-purple-600">
                    <Droplets className="h-3 w-3 mr-1" />
                    Venomous
                  </Badge>
                )}
                {hazard.diseaseCarrier && (
                  <Badge variant="outline" className="border-red-500 text-red-600">
                    <Heart className="h-3 w-3 mr-1" />
                    Disease Carrier
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hazard.sounds && hazard.sounds.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  playAnimalSound();
                }}
                disabled={playingSound}
              >
                <Volume2 className={`h-4 w-4 ${playingSound ? 'animate-pulse' : ''}`} />
              </Button>
            )}
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </div>
        </div>

        {/* Quick Info */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-gray-400" />
            <Text className="text-gray-600 dark:text-gray-400">
              {hazard.habitats.slice(0, 2).join(', ')}
              {hazard.habitats.length > 2 && ' +more'}
            </Text>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-gray-400" />
            <Text className="text-gray-600 dark:text-gray-400">
              {hazard.activePeriods[0]?.start} - {hazard.activePeriods[0]?.end}
            </Text>
          </div>
        </div>

        {/* Warning Signs Preview */}
        <div className="mb-3">
          <Text className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            Warning Signs:
          </Text>
          <div className="flex flex-wrap gap-1">
            {hazard.warningsSigns.slice(0, 3).map((sign, idx) => (
              <Badge key={idx} variant="ghost" size="sm">
                {sign}
              </Badge>
            ))}
            {hazard.warningsSigns.length > 3 && (
              <Badge variant="ghost" size="sm">
                +{hazard.warningsSigns.length - 3} more
              </Badge>
            )}
          </div>
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
            {/* Encounter Protocol */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                If You Encounter This Animal
              </h4>
              <div className="space-y-3">
                <div>
                  <Text className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
                    Immediate Response:
                  </Text>
                  <ol className="list-decimal list-inside text-sm space-y-1">
                    {hazard.encounterProtocol.immediateResponse.slice(0, 3).map((response, idx) => (
                      <li key={idx}>{response}</li>
                    ))}
                  </ol>
                </div>
                
                <div>
                  <Text className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">
                    DO NOT:
                  </Text>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {hazard.encounterProtocol.doNotDo.slice(0, 3).map((action, idx) => (
                      <li key={idx} className="text-red-600 dark:text-red-400">
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Behavior Guidelines */}
                <div className="flex gap-4 text-sm">
                  {hazard.encounterProtocol.noiseResponse && (
                    <Badge variant="outline" className="gap-1">
                      <Volume2 className="h-3 w-3" />
                      {hazard.encounterProtocol.noiseResponse.replace('_', ' ')}
                    </Badge>
                  )}
                  {hazard.encounterProtocol.eyeContact && (
                    <Badge variant="outline" className="gap-1">
                      <Eye className="h-3 w-3" />
                      {hazard.encounterProtocol.eyeContact.replace('_', ' ')} eye contact
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Aggression Triggers */}
            {hazard.aggressionTriggers && hazard.aggressionTriggers.length > 0 && (
              <Card className="p-3 bg-red-50 dark:bg-red-900/20">
                <Text className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                  Aggression Triggers:
                </Text>
                <div className="flex flex-wrap gap-1">
                  {hazard.aggressionTriggers.map((trigger, idx) => (
                    <Badge key={idx} variant="destructive" size="sm">
                      {trigger}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}

            {/* Action Buttons */}
            {showActions && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDetailModal(true);
                  }}
                  className="flex-1"
                >
                  View Full Details
                </Button>
                {onLearnMore && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onLearnMore();
                    }}
                    className="flex-1"
                  >
                    Safety Protocol
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={hazard.commonName}
        className="max-w-3xl"
      >
        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-start justify-between">
            <div>
              <Text className="text-lg font-semibold">{hazard.species}</Text>
              <Text className="text-gray-600 dark:text-gray-400 italic">
                {hazard.scientificName}
              </Text>
            </div>
            <Badge
              variant="secondary"
              className={hazardLevelColors[hazard.dangerLevel]}
            >
              {hazard.dangerLevel} Risk
            </Badge>
          </div>

          {/* Habitat & Activity */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Habitat
              </h4>
              <div className="space-y-1 text-sm">
                {hazard.habitats.map((habitat, idx) => (
                  <Text key={idx} className="text-gray-600 dark:text-gray-400">
                    • {habitat}
                  </Text>
                ))}
              </div>
            </Card>
            
            <Card className="p-4">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Active Periods
              </h4>
              <div className="space-y-1 text-sm">
                {hazard.activePeriods.map((period, idx) => (
                  <Text key={idx} className="text-gray-600 dark:text-gray-400">
                    • {period.start} - {period.end}
                  </Text>
                ))}
              </div>
            </Card>
          </div>

          {/* Full Encounter Protocol */}
          <Card className="p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              Complete Encounter Protocol
            </h4>
            
            <div className="space-y-4">
              <div>
                <Text className="font-medium text-green-700 dark:text-green-300 mb-2">
                  Immediate Response:
                </Text>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  {hazard.encounterProtocol.immediateResponse.map((response, idx) => (
                    <li key={idx}>{response}</li>
                  ))}
                </ol>
              </div>
              
              <div>
                <Text className="font-medium text-red-700 dark:text-red-300 mb-2">
                  DO NOT:
                </Text>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {hazard.encounterProtocol.doNotDo.map((action, idx) => (
                    <li key={idx} className="text-red-600 dark:text-red-400">
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <Text className="font-medium mb-2">Escape Strategy:</Text>
                <Text className="text-sm text-gray-600 dark:text-gray-400">
                  {hazard.encounterProtocol.escapeStrategy}
                </Text>
              </div>
              
              <div>
                <Text className="font-medium mb-2">Defensive Positions:</Text>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  {hazard.encounterProtocol.defensivePositions.map((position, idx) => (
                    <li key={idx}>{position}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>

          {/* First Aid */}
          {hazard.attackFirstAid.length > 0 && (
            <Card className="p-4 bg-red-50 dark:bg-red-900/20">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Heart className="h-5 w-5 text-red-500" />
                First Aid for Attacks
              </h4>
              <ol className="list-decimal list-inside space-y-1 text-sm">
                {hazard.attackFirstAid.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ol>
              <Badge variant="destructive" className="mt-3">
                Seek Immediate Medical Attention
              </Badge>
            </Card>
          )}

          {/* Deterrents */}
          <Card className="p-4">
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Effective Deterrents
            </h4>
            <div className="flex flex-wrap gap-2">
              {hazard.deterrents.map((deterrent, idx) => (
                <Badge key={idx} variant="outline">
                  {deterrent}
                </Badge>
              ))}
            </div>
          </Card>

          {/* Tracking Tips */}
          {hazard.trackingTips && hazard.trackingTips.length > 0 && (
            <Card className="p-4">
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Info className="h-5 w-5" />
                Tracking & Identification
              </h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {hazard.trackingTips.map((tip, idx) => (
                  <li key={idx}>{tip}</li>
                ))}
              </ul>
            </Card>
          )}

          {/* Additional Warnings */}
          <div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <Text className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                Important Safety Notes:
              </Text>
              <ul className="list-disc list-inside space-y-1 text-yellow-700 dark:text-yellow-300">
                <li>Keep a safe distance at all times</li>
                <li>Never approach young animals - parents may be nearby</li>
                <li>Report sightings to local wildlife authorities</li>
                <li>Carry appropriate deterrents when in their habitat</li>
              </ul>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};