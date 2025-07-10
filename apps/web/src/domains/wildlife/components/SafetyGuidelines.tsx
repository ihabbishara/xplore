'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  AlertTriangle,
  Heart,
  Phone,
  MapPin,
  Info,
  ChevronRight,
  CheckCircle,
  XCircle,
  Activity,
  Eye,
  Zap,
  Volume2,
  Timer,
  Navigation,
  Siren,
  ShieldOff,
  Users,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Tabs } from '@/components/ui/Tabs';
import { Progress } from '@/components/ui/Progress';
import { Modal } from '@/components/ui/Modal';
import {
  WildlifeSpecies,
  DangerLevel,
  BehaviorType,
  WarningSigns,
  SafetyProtocol,
  EmergencyContact,
} from '../types/wildlife';
import { useWildlifeStore } from '../hooks/useWildlifeStore';
import { useAppDispatch } from '@/store/hooks';
import { toggleSOS } from '@/domains/emergency/store/emergencySlice';

interface SafetyGuidelinesProps {
  species: WildlifeSpecies;
  currentLocation?: { lat: number; lng: number };
  onEmergencyActivate?: () => void;
  className?: string;
}

interface SafetySection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

const dangerLevelInfo = {
  harmless: {
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    icon: <Shield className="h-5 w-5" />,
    label: 'Harmless',
    description: 'No threat to humans',
  },
  caution: {
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    icon: <AlertTriangle className="h-5 w-5" />,
    label: 'Caution Advised',
    description: 'May be defensive if threatened',
  },
  dangerous: {
    color: 'text-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    icon: <AlertTriangle className="h-5 w-5" />,
    label: 'Dangerous',
    description: 'Can cause serious injury',
  },
  lethal: {
    color: 'text-red-500',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    icon: <Siren className="h-5 w-5" />,
    label: 'Extremely Dangerous',
    description: 'Can be fatal - extreme caution required',
  },
};

export const SafetyGuidelines: React.FC<SafetyGuidelinesProps> = ({
  species,
  currentLocation,
  onEmergencyActivate,
  className = '',
}) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'behavior' | 'encounter' | 'emergency'>('overview');
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  
  const { getSafetyProtocol, getEmergencyContacts } = useWildlifeStore();
  const dispatch = useAppDispatch();
  
  const safetyProtocol = getSafetyProtocol(species.id);
  const emergencyContacts = getEmergencyContacts(currentLocation);

  React.useEffect(() => {
    // Load emergency protocols if needed
  }, []);

  const safetySections = useMemo<SafetySection[]>(() => {
    const sections: SafetySection[] = [];

    // Critical Information
    if (species.dangerLevel === 'lethal' || species.dangerLevel === 'dangerous') {
      sections.push({
        id: 'critical-warning',
        title: 'Critical Safety Warning',
        icon: <Siren className="h-5 w-5" />,
        priority: 'critical',
        content: (
          <div className="space-y-3">
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <Text className="font-medium text-red-700 dark:text-red-300">
                {species.commonName} is classified as {species.dangerLevel}
              </Text>
              <Text className="text-sm text-red-600 dark:text-red-400 mt-1">
                {safetyProtocol?.criticalInfo || 'Extreme caution required. Do not approach.'}
              </Text>
            </div>
            <div className="flex gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowEmergencyModal(true)}
                className="gap-2"
              >
                <Phone className="h-4 w-4" />
                Emergency Contacts
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={onEmergencyActivate}
                className="gap-2"
              >
                <Siren className="h-4 w-4" />
                Activate SOS
              </Button>
            </div>
          </div>
        ),
      });
    }

    // Safe Distance
    sections.push({
      id: 'safe-distance',
      title: 'Minimum Safe Distance',
      icon: <Ruler className="h-5 w-5" />,
      priority: species.dangerLevel === 'harmless' ? 'low' : 'high',
      content: (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <div>
              <Text className="font-medium text-lg">
                {safetyProtocol?.minimumDistance || species.photographyTips.recommendedDistance} meters
              </Text>
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                Never approach closer than this distance
              </Text>
            </div>
            <Navigation className="h-8 w-8 text-blue-500" />
          </div>
          {safetyProtocol?.distanceNotes && (
            <Text className="text-sm text-gray-600 dark:text-gray-400">
              {safetyProtocol.distanceNotes}
            </Text>
          )}
        </div>
      ),
    });

    // Warning Signs
    if (species.warningSigns && species.warningSigns.length > 0) {
      sections.push({
        id: 'warning-signs',
        title: 'Warning Signs & Aggressive Behavior',
        icon: <Eye className="h-5 w-5" />,
        priority: 'high',
        content: (
          <div className="space-y-2">
            {species.warningSigns.map((sign, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <Text className="font-medium text-sm">{sign.behavior}</Text>
                  <Text className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {sign.meaning}
                  </Text>
                  {sign.action && (
                    <Badge variant="outline" size="sm" className="mt-2">
                      Action: {sign.action}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        ),
      });
    }

    // Do's and Don'ts
    sections.push({
      id: 'dos-donts',
      title: 'Do\'s and Don\'ts',
      icon: <CheckCircle className="h-5 w-5" />,
      priority: 'medium',
      content: (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h5 className="font-medium text-green-700 dark:text-green-300 mb-3">Do\'s</h5>
            <ul className="space-y-2">
              {safetyProtocol?.dos.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <Text className="text-sm">{item}</Text>
                </li>
              )) || (
                <>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <Text className="text-sm">Keep calm and quiet</Text>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <Text className="text-sm">Back away slowly</Text>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                    <Text className="text-sm">Make yourself appear larger</Text>
                  </li>
                </>
              )}
            </ul>
          </div>
          
          <div>
            <h5 className="font-medium text-red-700 dark:text-red-300 mb-3">Don\'ts</h5>
            <ul className="space-y-2">
              {safetyProtocol?.donts.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                  <Text className="text-sm">{item}</Text>
                </li>
              )) || (
                <>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    <Text className="text-sm">Never run or turn your back</Text>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    <Text className="text-sm">Don\'t make direct eye contact</Text>
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                    <Text className="text-sm">Avoid sudden movements</Text>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      ),
    });

    // First Aid
    if (species.dangerLevel !== 'harmless' && safetyProtocol?.firstAid) {
      sections.push({
        id: 'first-aid',
        title: 'First Aid Procedures',
        icon: <Heart className="h-5 w-5" />,
        priority: 'high',
        content: (
          <div className="space-y-3">
            <Card className="p-3 bg-red-50 dark:bg-red-900/20">
              <Text className="font-medium text-red-700 dark:text-red-300 mb-2">
                In Case of Attack or Injury:
              </Text>
              <ol className="space-y-2 text-sm">
                {safetyProtocol.firstAid.map((step, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span className="font-medium text-red-600">{idx + 1}.</span>
                    <Text>{step}</Text>
                  </li>
                ))}
              </ol>
            </Card>
            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={() => {
                dispatch(toggleSOS(true));
                onEmergencyActivate?.();
              }}
            >
              <Siren className="h-4 w-4" />
              Activate Emergency Protocol
            </Button>
          </div>
        ),
      });
    }

    return sections;
  }, [species, safetyProtocol, dispatch, onEmergencyActivate]);

  const renderOverviewTab = () => {
    const dangerInfo = dangerLevelInfo[species.dangerLevel];
    
    return (
      <div className="space-y-4">
        {/* Danger Level Card */}
        <Card className={`p-4 ${dangerInfo.bgColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={dangerInfo.color}>
                {dangerInfo.icon}
              </div>
              <div>
                <Text className="font-semibold text-lg">
                  {dangerInfo.label}
                </Text>
                <Text className="text-sm text-gray-600 dark:text-gray-400">
                  {dangerInfo.description}
                </Text>
              </div>
            </div>
            <Badge
              variant={species.dangerLevel === 'harmless' ? 'secondary' : 
                      species.dangerLevel === 'caution' ? 'outline' : 'destructive'}
              size="lg"
            >
              {species.dangerLevel.toUpperCase()}
            </Badge>
          </div>
        </Card>

        {/* Quick Safety Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="p-3 text-center">
            <Navigation className="h-6 w-6 text-blue-500 mx-auto mb-1" />
            <Text className="text-lg font-bold">
              {safetyProtocol?.minimumDistance || species.photographyTips.recommendedDistance}m
            </Text>
            <Text className="text-xs text-gray-500">Min Distance</Text>
          </Card>
          
          <Card className="p-3 text-center">
            <Timer className="h-6 w-6 text-orange-500 mx-auto mb-1" />
            <Text className="text-lg font-bold">
              {safetyProtocol?.responseTime || '5-10'}s
            </Text>
            <Text className="text-xs text-gray-500">Response Time</Text>
          </Card>
          
          <Card className="p-3 text-center">
            <Volume2 className="h-6 w-6 text-purple-500 mx-auto mb-1" />
            <Text className="text-lg font-bold">
              {safetyProtocol?.noiseLevel || 'Low'}
            </Text>
            <Text className="text-xs text-gray-500">Noise Level</Text>
          </Card>
          
          <Card className="p-3 text-center">
            <Users className="h-6 w-6 text-green-500 mx-auto mb-1" />
            <Text className="text-lg font-bold">
              {safetyProtocol?.groupSafety ? 'Safer' : 'Same'}
            </Text>
            <Text className="text-xs text-gray-500">In Groups</Text>
          </Card>
        </div>

        {/* Safety Sections */}
        <div className="space-y-3">
          {safetySections
            .filter(section => section.priority === 'critical' || section.priority === 'high')
            .map(section => (
              <Card key={section.id} className="overflow-hidden">
                <button
                  onClick={() => setExpandedSection(
                    expandedSection === section.id ? null : section.id
                  )}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {section.icon}
                    <Text className="font-medium">{section.title}</Text>
                    {section.priority === 'critical' && (
                      <Badge variant="destructive" size="sm">Critical</Badge>
                    )}
                  </div>
                  <ChevronRight className={`h-5 w-5 transition-transform ${
                    expandedSection === section.id ? 'rotate-90' : ''
                  }`} />
                </button>
                
                <AnimatePresence>
                  {expandedSection === section.id && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 pt-0">
                        {section.content}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            ))}
        </div>
      </div>
    );
  };

  const renderBehaviorTab = () => {
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <h4 className="font-medium mb-3">Understanding {species.commonName} Behavior</h4>
          
          {/* Activity Patterns */}
          <div className="mb-4">
            <Text className="text-sm font-medium mb-2">Most Active During:</Text>
            <div className="flex flex-wrap gap-2">
              {species.activityPeriods.map(period => (
                <Badge key={period} variant="outline">
                  <Clock className="h-3 w-3 mr-1" />
                  {period.replace('_', ' ')}
                </Badge>
              ))}
            </div>
          </div>

          {/* Common Behaviors */}
          <div className="mb-4">
            <Text className="text-sm font-medium mb-2">Common Behaviors:</Text>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {species.behaviors?.map((behavior, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <Activity className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <Text className="text-sm font-medium">{behavior.type}</Text>
                    <Text className="text-xs text-gray-500">{behavior.description}</Text>
                  </div>
                </div>
              )) || (
                <Text className="text-sm text-gray-500">
                  Behavior patterns vary by season and location
                </Text>
              )}
            </div>
          </div>

          {/* Warning Signs Detail */}
          {species.warningSigns && species.warningSigns.length > 0 && (
            <Card className="p-3 bg-yellow-50 dark:bg-yellow-900/20">
              <h5 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                Recognize These Warning Signs:
              </h5>
              <div className="space-y-2">
                {species.warningSigns.map((sign, idx) => (
                  <div key={idx} className="text-sm">
                    <Text className="font-medium">{sign.behavior}:</Text>
                    <Text className="text-gray-600 dark:text-gray-400">
                      {sign.meaning} → {sign.action}
                    </Text>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </Card>

        {/* Seasonal Behavior */}
        <Card className="p-4">
          <h4 className="font-medium mb-3">Seasonal Behavior Changes</h4>
          <div className="space-y-3">
            {species.seasonalBehavior.map((seasonal, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <Badge variant="outline">{seasonal.season}</Badge>
                <div className="flex-1">
                  <Text className="text-sm">{seasonal.behavior.join(', ')}</Text>
                  {seasonal.safetyNotes && (
                    <Text className="text-xs text-gray-500 mt-1">
                      Safety: {seasonal.safetyNotes}
                    </Text>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  };

  const renderEncounterTab = () => {
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            If You Encounter a {species.commonName}
          </h4>
          
          <div className="space-y-4">
            {/* Immediate Actions */}
            <div>
              <Text className="font-medium text-sm mb-2">Immediate Actions:</Text>
              <ol className="space-y-2">
                {safetyProtocol?.encounterSteps?.immediate.map((step, idx) => (
                  <li key={idx} className="flex gap-2 text-sm">
                    <span className="font-medium text-blue-600">{idx + 1}.</span>
                    <Text>{step}</Text>
                  </li>
                )) || (
                  <>
                    <li className="flex gap-2 text-sm">
                      <span className="font-medium text-blue-600">1.</span>
                      <Text>Stop and remain calm</Text>
                    </li>
                    <li className="flex gap-2 text-sm">
                      <span className="font-medium text-blue-600">2.</span>
                      <Text>Do not run or make sudden movements</Text>
                    </li>
                    <li className="flex gap-2 text-sm">
                      <span className="font-medium text-blue-600">3.</span>
                      <Text>Slowly back away while facing the animal</Text>
                    </li>
                  </>
                )}
              </ol>
            </div>

            {/* If Approached */}
            <div>
              <Text className="font-medium text-sm mb-2">If the Animal Approaches:</Text>
              <ol className="space-y-2">
                {safetyProtocol?.encounterSteps?.ifApproached.map((step, idx) => (
                  <li key={idx} className="flex gap-2 text-sm">
                    <span className="font-medium text-orange-600">{idx + 1}.</span>
                    <Text>{step}</Text>
                  </li>
                )) || (
                  <>
                    <li className="flex gap-2 text-sm">
                      <span className="font-medium text-orange-600">1.</span>
                      <Text>Make yourself appear larger</Text>
                    </li>
                    <li className="flex gap-2 text-sm">
                      <span className="font-medium text-orange-600">2.</span>
                      <Text>Make noise - shout or clap</Text>
                    </li>
                    <li className="flex gap-2 text-sm">
                      <span className="font-medium text-orange-600">3.</span>
                      <Text>Use deterrents if available</Text>
                    </li>
                  </>
                )}
              </ol>
            </div>

            {/* If Attacked */}
            {species.dangerLevel !== 'harmless' && (
              <Card className="p-3 bg-red-50 dark:bg-red-900/20">
                <Text className="font-medium text-sm text-red-700 dark:text-red-300 mb-2">
                  If Attacked:
                </Text>
                <ol className="space-y-2">
                  {safetyProtocol?.encounterSteps?.ifAttacked.map((step, idx) => (
                    <li key={idx} className="flex gap-2 text-sm">
                      <span className="font-medium text-red-600">{idx + 1}.</span>
                      <Text>{step}</Text>
                    </li>
                  )) || (
                    <>
                      <li className="flex gap-2 text-sm">
                        <span className="font-medium text-red-600">1.</span>
                        <Text>Fight back with everything available</Text>
                      </li>
                      <li className="flex gap-2 text-sm">
                        <span className="font-medium text-red-600">2.</span>
                        <Text>Target eyes and nose</Text>
                      </li>
                      <li className="flex gap-2 text-sm">
                        <span className="font-medium text-red-600">3.</span>
                        <Text>Get medical help immediately</Text>
                      </li>
                    </>
                  )}
                </ol>
              </Card>
            )}
          </div>
        </Card>

        {/* Deterrent Methods */}
        <Card className="p-4">
          <h4 className="font-medium mb-3">Deterrent Methods</h4>
          <div className="space-y-2">
            {safetyProtocol?.deterrents?.map((deterrent, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <Text className="text-sm">{deterrent.method}</Text>
                <Badge variant={deterrent.effectiveness === 'high' ? 'secondary' : 'outline'} size="sm">
                  {deterrent.effectiveness} effectiveness
                </Badge>
              </div>
            )) || (
              <Text className="text-sm text-gray-500">
                Noise, bright lights, and bear spray may be effective
              </Text>
            )}
          </div>
        </Card>
      </div>
    );
  };

  const renderEmergencyTab = () => {
    return (
      <div className="space-y-4">
        {/* Emergency Actions */}
        <Card className="p-4 bg-red-50 dark:bg-red-900/20">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Siren className="h-4 w-4" />
            Emergency Actions
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant="destructive"
              size="lg"
              onClick={() => {
                dispatch(toggleSOS(true));
                onEmergencyActivate?.();
              }}
              className="gap-2"
            >
              <Siren className="h-5 w-5" />
              Activate SOS
            </Button>
            
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setShowEmergencyModal(true)}
              className="gap-2"
            >
              <Phone className="h-5 w-5" />
              Emergency Contacts
            </Button>
          </div>
        </Card>

        {/* Local Emergency Contacts */}
        <Card className="p-4">
          <h4 className="font-medium mb-3">Emergency Contacts</h4>
          <div className="space-y-3">
            {emergencyContacts.map((contact, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
                <div>
                  <Text className="font-medium">{contact.name}</Text>
                  <Text className="text-sm text-gray-500">{contact.type}</Text>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = `tel:${contact.number}`}
                  className="gap-2"
                >
                  <Phone className="h-4 w-4" />
                  {contact.number}
                </Button>
              </div>
            ))}
          </div>
        </Card>

        {/* Reporting Information */}
        <Card className="p-4">
          <h4 className="font-medium mb-3">Information to Report</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <Text className="text-sm">Your exact location (GPS coordinates if possible)</Text>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-gray-400" />
              <Text className="text-sm">Species and number of animals</Text>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-gray-400" />
              <Text className="text-sm">Animal behavior and direction of movement</Text>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-400" />
              <Text className="text-sm">Number of people in your group</Text>
            </div>
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-gray-400" />
              <Text className="text-sm">Any injuries or immediate medical needs</Text>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <Shield className="h-4 w-4" /> },
    { id: 'behavior', label: 'Behavior', icon: <Eye className="h-4 w-4" /> },
    { id: 'encounter', label: 'If Encountered', icon: <AlertTriangle className="h-4 w-4" /> },
    { id: 'emergency', label: 'Emergency', icon: <Siren className="h-4 w-4" /> },
  ];

  return (
    <div className={className}>
      <Card className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Safety Guidelines
            </h3>
            <Text className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {species.commonName} safety information
            </Text>
          </div>

          {/* Quick Actions */}
          {species.dangerLevel !== 'harmless' && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowEmergencyModal(true)}
              className="gap-2"
            >
              <Phone className="h-4 w-4" />
              Emergency
            </Button>
          )}
        </div>

        {/* Tabs */}
        <Tabs
          value={selectedTab}
          onValueChange={(value) => setSelectedTab(value as any)}
          className="mb-6"
        >
          <div className="flex gap-2 border-b">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-2 ${
                  selectedTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </Tabs>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {selectedTab === 'overview' && renderOverviewTab()}
            {selectedTab === 'behavior' && renderBehaviorTab()}
            {selectedTab === 'encounter' && renderEncounterTab()}
            {selectedTab === 'emergency' && renderEmergencyTab()}
          </motion.div>
        </AnimatePresence>

        {/* Download Button */}
        <div className="mt-6 pt-6 border-t">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => {
              // Download safety guide functionality
            }}
          >
            <FileText className="h-4 w-4" />
            Download Safety Guide (PDF)
          </Button>
        </div>
      </Card>

      {/* Emergency Contacts Modal */}
      <Modal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        title="Emergency Contacts"
        className="max-w-md"
      >
        <div className="space-y-3">
          <Card className="p-3 bg-red-50 dark:bg-red-900/20">
            <Text className="text-sm font-medium text-red-700 dark:text-red-300">
              For immediate emergencies, call local emergency services
            </Text>
          </Card>
          
          {emergencyContacts.map((contact, idx) => (
            <Card key={idx} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Text className="font-medium">{contact.name}</Text>
                  <Text className="text-sm text-gray-500">{contact.type}</Text>
                  {contact.available24h && (
                    <Badge variant="secondary" size="sm" className="mt-1">
                      24/7
                    </Badge>
                  )}
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => window.location.href = `tel:${contact.number}`}
                  className="gap-2"
                >
                  <Phone className="h-4 w-4" />
                  Call
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Modal>
    </div>
  );
};