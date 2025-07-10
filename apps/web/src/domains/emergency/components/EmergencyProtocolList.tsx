'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertTriangle,
  ChevronRight,
  Search,
  Filter,
  Download,
  Clock,
  Shield,
  AlertCircle,
  Heart,
  Flame,
  Cloud,
  Bug,
  Car,
  Users,
  Zap,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { useEmergencyStore } from '../hooks/useEmergencyStore';
import { EmergencyProtocol, EmergencyType, EmergencyFilters } from '../types/emergency';

interface EmergencyProtocolListProps {
  onSelectProtocol?: (protocol: EmergencyProtocol) => void;
  showFilters?: boolean;
  offlineOnly?: boolean;
  className?: string;
}

const emergencyIcons: Record<EmergencyType, React.ReactElement> = {
  [EmergencyType.MEDICAL]: <Heart className="h-5 w-5" />,
  [EmergencyType.NATURAL_DISASTER]: <Cloud className="h-5 w-5" />,
  [EmergencyType.CRIME]: <Shield className="h-5 w-5" />,
  [EmergencyType.ACCIDENT]: <Car className="h-5 w-5" />,
  [EmergencyType.WILDLIFE]: <Bug className="h-5 w-5" />,
  [EmergencyType.WEATHER]: <Cloud className="h-5 w-5" />,
  [EmergencyType.WATER]: <AlertCircle className="h-5 w-5" />,
  [EmergencyType.FIRE]: <Flame className="h-5 w-5" />,
  [EmergencyType.TECHNICAL]: <Zap className="h-5 w-5" />,
  [EmergencyType.GENERAL]: <Info className="h-5 w-5" />,
};

const severityColors = {
  critical: 'bg-red-500 text-white',
  urgent: 'bg-orange-500 text-white',
  moderate: 'bg-yellow-500 text-white',
};

export const EmergencyProtocolList: React.FC<EmergencyProtocolListProps> = ({
  onSelectProtocol,
  showFilters = true,
  offlineOnly = false,
  className = '',
}) => {
  const {
    protocols,
    loading,
    error,
    offlineMode,
    activeFilters,
    loadProtocols,
    setFilters,
    selectProtocol,
    getProtocolsByType,
  } = useEmergencyStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<EmergencyType | null>(null);
  const [selectedSeverity, setSelectedSeverity] = useState<'critical' | 'urgent' | 'moderate' | null>(null);
  const [showOfflineOnly, setShowOfflineOnly] = useState(offlineOnly);

  useEffect(() => {
    const filters: EmergencyFilters = {
      offlineOnly: showOfflineOnly,
    };
    
    if (selectedType) {
      filters.types = [selectedType];
    }
    
    if (selectedSeverity) {
      filters.severity = [selectedSeverity];
    }
    
    loadProtocols(filters);
  }, [loadProtocols, selectedType, selectedSeverity, showOfflineOnly]);

  const filteredProtocols = protocols.filter(protocol => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        protocol.name.toLowerCase().includes(query) ||
        protocol.symptoms?.some(symptom => symptom.toLowerCase().includes(query)) ||
        protocol.triggers?.some(trigger => trigger.toLowerCase().includes(query))
      );
    }
    return true;
  });

  const handleSelectProtocol = (protocol: EmergencyProtocol) => {
    selectProtocol(protocol);
    if (onSelectProtocol) {
      onSelectProtocol(protocol);
    }
  };

  const downloadOfflineProtocols = async () => {
    try {
      // In a real app, this would trigger a download of offline protocol data
      console.log('Downloading offline protocols...');
    } catch (error) {
      console.error('Failed to download offline protocols:', error);
    }
  };

  return (
    <div className={`${className}`}>
      {/* Search and Filters */}
      {showFilters && (
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search symptoms, conditions, or situations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Controls */}
          <div className="flex flex-wrap gap-2">
            {/* Type Filter */}
            <div className="flex gap-1">
              {Object.values(EmergencyType).map((type) => (
                <Button
                  key={type}
                  variant={selectedType === type ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedType(selectedType === type ? null : type)}
                  className="gap-1"
                >
                  {emergencyIcons[type]}
                  <span className="capitalize">{type.replace('_', ' ')}</span>
                </Button>
              ))}
            </div>

            {/* Severity Filter */}
            <div className="flex gap-1">
              {(['critical', 'urgent', 'moderate'] as const).map((severity) => (
                <Button
                  key={severity}
                  variant={selectedSeverity === severity ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedSeverity(selectedSeverity === severity ? null : severity)}
                  className="capitalize"
                >
                  {severity}
                </Button>
              ))}
            </div>

            {/* Offline Toggle */}
            <Button
              variant={showOfflineOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowOfflineOnly(!showOfflineOnly)}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Offline Only
            </Button>
          </div>
        </div>
      )}

      {/* Offline Mode Banner */}
      {offlineMode && (
        <Card className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <Text className="text-yellow-800 dark:text-yellow-200">
                You are in offline mode. Showing downloaded protocols only.
              </Text>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadOfflineProtocols}
              className="text-yellow-700 dark:text-yellow-300"
            >
              Update Offline Data
            </Button>
          </div>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
            <Text className="text-red-800 dark:text-red-200">{error}</Text>
          </div>
        </Card>
      )}

      {/* Protocol List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredProtocols.map((protocol, index) => (
            <motion.div
              key={protocol.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card
                className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => handleSelectProtocol(protocol)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`p-2 rounded-lg ${severityColors[protocol.severity]} bg-opacity-20`}>
                        {emergencyIcons[protocol.type]}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{protocol.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant="secondary"
                            className={severityColors[protocol.severity]}
                          >
                            {protocol.severity}
                          </Badge>
                          {protocol.offlineAvailable && (
                            <Badge variant="outline" className="gap-1">
                              <Download className="h-3 w-3" />
                              Offline
                            </Badge>
                          )}
                          {protocol.timeframe && (
                            <Badge variant="ghost" className="gap-1">
                              <Clock className="h-3 w-3" />
                              {protocol.timeframe}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Symptoms/Triggers Preview */}
                    {(protocol.symptoms || protocol.triggers) && (
                      <div className="mt-3">
                        {protocol.symptoms && protocol.symptoms.length > 0 && (
                          <div className="mb-2">
                            <Text className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Symptoms:
                            </Text>
                            <div className="flex flex-wrap gap-1">
                              {protocol.symptoms.slice(0, 3).map((symptom, idx) => (
                                <Badge key={idx} variant="ghost" size="sm">
                                  {symptom}
                                </Badge>
                              ))}
                              {protocol.symptoms.length > 3 && (
                                <Badge variant="ghost" size="sm">
                                  +{protocol.symptoms.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {protocol.triggers && protocol.triggers.length > 0 && (
                          <div>
                            <Text className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                              Triggers:
                            </Text>
                            <div className="flex flex-wrap gap-1">
                              {protocol.triggers.slice(0, 3).map((trigger, idx) => (
                                <Badge key={idx} variant="ghost" size="sm">
                                  {trigger}
                                </Badge>
                              ))}
                              {protocol.triggers.length > 3 && (
                                <Badge variant="ghost" size="sm">
                                  +{protocol.triggers.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Quick Actions Preview */}
                    {protocol.immediateActions && protocol.immediateActions.length > 0 && (
                      <div className="mt-3">
                        <Text className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Immediate Actions:
                        </Text>
                        <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400">
                          {protocol.immediateActions.slice(0, 2).map((action, idx) => (
                            <li key={idx} className={action.critical ? 'font-semibold text-red-600 dark:text-red-400' : ''}>
                              {action.action}
                            </li>
                          ))}
                          {protocol.immediateActions.length > 2 && (
                            <li className="text-gray-500">
                              +{protocol.immediateActions.length - 2} more steps...
                            </li>
                          )}
                        </ol>
                      </div>
                    )}
                  </div>

                  {/* Arrow Icon */}
                  <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-4" />
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Empty State */}
      {filteredProtocols.length === 0 && !loading && (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <Text className="text-gray-600 dark:text-gray-400">
            No emergency protocols found matching your criteria.
          </Text>
          {showOfflineOnly && (
            <Text className="text-sm text-gray-500 dark:text-gray-500 mt-2">
              Try downloading more protocols for offline use.
            </Text>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
};