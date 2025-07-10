'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Users,
  Star,
  TrendingUp,
  Clock,
  Camera,
  MapPin,
  Info,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  FileCheck,
  Award,
  Zap,
  Eye,
  Lock,
  Unlock,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Avatar } from '@/components/ui/Avatar';
import { Tabs } from '@/components/ui/Tabs';
import { Modal } from '@/components/ui/Modal';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Tooltip } from '@/components/ui/Tooltip';
import {
  WildlifeSighting,
  VerificationStatus,
  VerificationAction,
  VerificationHistory,
  ExpertProfile,
  VerificationCriteria,
  DisputeReason,
} from '../types/wildlife';
import { useWildlifeStore } from '../hooks/useWildlifeStore';
import { useCommunityStore } from '../hooks/useCommunityStore';

interface VerificationSystemProps {
  sighting?: WildlifeSighting;
  onVerificationComplete?: (status: VerificationStatus) => void;
  showStats?: boolean;
  className?: string;
}

interface VerificationStats {
  totalVerifications: number;
  expertVerifications: number;
  communityVerifications: number;
  disputeRate: number;
  averageTime: number;
  photoVerificationRate: number;
}

const statusInfo = {
  [VerificationStatus.PENDING]: {
    icon: <Clock className="h-5 w-5" />,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100 dark:bg-gray-800',
    label: 'Pending Verification',
  },
  [VerificationStatus.VERIFIED]: {
    icon: <CheckCircle className="h-5 w-5" />,
    color: 'text-green-500',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    label: 'Community Verified',
  },
  [VerificationStatus.EXPERT_VERIFIED]: {
    icon: <Shield className="h-5 w-5" />,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    label: 'Expert Verified',
  },
  [VerificationStatus.DISPUTED]: {
    icon: <AlertCircle className="h-5 w-5" />,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    label: 'Disputed',
  },
  [VerificationStatus.REJECTED]: {
    icon: <XCircle className="h-5 w-5" />,
    color: 'text-red-500',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    label: 'Rejected',
  },
};

const disputeReasons: { value: DisputeReason; label: string }[] = [
  { value: DisputeReason.MISIDENTIFICATION, label: 'Species Misidentification' },
  { value: DisputeReason.LOCATION_ERROR, label: 'Location Seems Incorrect' },
  { value: DisputeReason.DATE_TIME_ERROR, label: 'Date/Time Discrepancy' },
  { value: DisputeReason.BEHAVIOR_UNLIKELY, label: 'Behavior Seems Unlikely' },
  { value: DisputeReason.PHOTO_MANIPULATION, label: 'Photo Appears Manipulated' },
  { value: DisputeReason.DUPLICATE_REPORT, label: 'Duplicate Report' },
  { value: DisputeReason.INSUFFICIENT_EVIDENCE, label: 'Insufficient Evidence' },
  { value: DisputeReason.OTHER, label: 'Other Reason' },
];

export const VerificationSystem: React.FC<VerificationSystemProps> = ({
  sighting,
  onVerificationComplete,
  showStats = true,
  className = '',
}) => {
  const [selectedTab, setSelectedTab] = useState<'verify' | 'history' | 'experts' | 'guidelines'>('verify');
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState<DisputeReason>(DisputeReason.MISIDENTIFICATION);
  const [disputeNotes, setDisputeNotes] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');
  
  const {
    verifySightingReport,
    getVerificationHistory,
    getVerificationStats,
    loadExperts,
    experts,
  } = useWildlifeStore();
  
  const { getUserProfile, isExpert } = useCommunityStore();
  
  const verificationHistory = sighting ? getVerificationHistory(sighting.id) : [];
  const stats = getVerificationStats();
  const currentUserIsExpert = isExpert();

  useEffect(() => {
    loadExperts();
  }, [loadExperts]);

  const handleVerify = async (action: VerificationAction) => {
    if (!sighting) return;
    
    let status: VerificationStatus;
    switch (action) {
      case VerificationAction.APPROVE:
        status = currentUserIsExpert ? VerificationStatus.EXPERT_VERIFIED : VerificationStatus.VERIFIED;
        break;
      case VerificationAction.DISPUTE:
        status = VerificationStatus.DISPUTED;
        break;
      case VerificationAction.REJECT:
        status = VerificationStatus.REJECTED;
        break;
      default:
        return;
    }
    
    await verifySightingReport(sighting.id, status, {
      action,
      reason: action === VerificationAction.DISPUTE ? disputeReason : undefined,
      notes: verificationNotes || disputeNotes || undefined,
      isExpert: currentUserIsExpert,
    });
    
    if (onVerificationComplete) {
      onVerificationComplete(status);
    }
    
    setShowDisputeModal(false);
    setVerificationNotes('');
    setDisputeNotes('');
  };

  const getVerificationProgress = (): number => {
    if (!sighting) return 0;
    
    let score = 0;
    const criteria: VerificationCriteria = {
      hasPhoto: sighting.photos && sighting.photos.length > 0,
      hasLocation: !!sighting.location,
      hasDateTime: !!sighting.timestamp,
      hasBehavior: sighting.behavior.length > 0,
      hasWeather: !!sighting.weatherConditions,
      hasNotes: !!sighting.notes,
      multiplePhotos: sighting.photos && sighting.photos.length > 3,
      hasDistance: !!sighting.distance,
      hasDuration: !!sighting.duration,
      hasHabitat: !!sighting.habitatType,
    };
    
    // Calculate score based on criteria
    Object.values(criteria).forEach(met => {
      if (met) score += 10;
    });
    
    return Math.min(score, 100);
  };

  const renderVerifyTab = () => {
    if (!sighting) {
      return (
        <Card className="p-8 text-center">
          <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <Text className="text-gray-600 dark:text-gray-400">
            Select a sighting to verify
          </Text>
        </Card>
      );
    }

    const verificationProgress = getVerificationProgress();
    const canVerify = sighting.userId !== getUserProfile()?.id;

    return (
      <div className="space-y-4">
        {/* Current Status */}
        <Card className={`p-4 ${statusInfo[sighting.verificationStatus].bgColor}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={statusInfo[sighting.verificationStatus].color}>
                {statusInfo[sighting.verificationStatus].icon}
              </div>
              <div>
                <Text className="font-medium">
                  {statusInfo[sighting.verificationStatus].label}
                </Text>
                <Text className="text-sm text-gray-600 dark:text-gray-400">
                  {sighting.verificationCount || 0} verifications
                </Text>
              </div>
            </div>
            {sighting.verificationStatus === VerificationStatus.EXPERT_VERIFIED && (
              <Badge variant="secondary" className="gap-1">
                <Shield className="h-3 w-3" />
                Expert Verified
              </Badge>
            )}
          </div>
        </Card>

        {/* Evidence Quality */}
        <Card className="p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Evidence Quality
          </h4>
          
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Text className="text-sm">Verification Score</Text>
                <Text className="text-sm font-medium">{verificationProgress}%</Text>
              </div>
              <Progress value={verificationProgress} className="h-2" />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Camera className={`h-4 w-4 ${sighting.photos?.length ? 'text-green-500' : 'text-gray-400'}`} />
                <Text>Photos: {sighting.photos?.length || 0}</Text>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className={`h-4 w-4 ${sighting.location ? 'text-green-500' : 'text-gray-400'}`} />
                <Text>Location: {sighting.location ? 'Yes' : 'No'}</Text>
              </div>
              <div className="flex items-center gap-2">
                <Clock className={`h-4 w-4 ${sighting.duration ? 'text-green-500' : 'text-gray-400'}`} />
                <Text>Duration: {sighting.duration ? `${sighting.duration}min` : 'Not recorded'}</Text>
              </div>
              <div className="flex items-center gap-2">
                <Eye className={`h-4 w-4 ${sighting.distance ? 'text-green-500' : 'text-gray-400'}`} />
                <Text>Distance: {sighting.distance ? `${sighting.distance}m` : 'Not recorded'}</Text>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Verification Actions */}
        {canVerify && sighting.verificationStatus === VerificationStatus.PENDING && (
          <Card className="p-4">
            <h4 className="font-medium mb-3">Quick Verification</h4>
            
            <div className="space-y-3">
              <Textarea
                placeholder="Add verification notes (optional)..."
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                rows={2}
                className="mb-3"
              />
              
              <div className="flex gap-3">
                <Button
                  variant="default"
                  onClick={() => handleVerify(VerificationAction.APPROVE)}
                  className="flex-1 gap-2"
                >
                  <ThumbsUp className="h-4 w-4" />
                  Verify
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setShowDisputeModal(true)}
                  className="flex-1 gap-2"
                >
                  <AlertCircle className="h-4 w-4" />
                  Dispute
                </Button>
                {currentUserIsExpert && (
                  <Button
                    variant="destructive"
                    onClick={() => handleVerify(VerificationAction.REJECT)}
                    className="flex-1 gap-2"
                  >
                    <ThumbsDown className="h-4 w-4" />
                    Reject
                  </Button>
                )}
              </div>
            </div>

            {currentUserIsExpert && (
              <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <Text className="text-sm text-blue-700 dark:text-blue-300">
                    Your verification carries expert weight (3x community)
                  </Text>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Cannot Verify Own Sighting */}
        {!canVerify && (
          <Card className="p-4 bg-gray-50 dark:bg-gray-900/50">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-gray-400" />
              <Text className="text-gray-600 dark:text-gray-400">
                You cannot verify your own sighting
              </Text>
            </div>
          </Card>
        )}
      </div>
    );
  };

  const renderHistoryTab = () => {
    if (!sighting) return null;

    return (
      <div className="space-y-3">
        {verificationHistory.length === 0 ? (
          <Card className="p-8 text-center">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <Text className="text-gray-600 dark:text-gray-400">
              No verification history yet
            </Text>
          </Card>
        ) : (
          verificationHistory.map((entry, idx) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar
                    src={entry.verifierAvatar}
                    alt={entry.verifierName}
                    size="sm"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Text className="font-medium">{entry.verifierName}</Text>
                      {entry.isExpert && (
                        <Badge variant="secondary" size="sm">
                          <Shield className="h-3 w-3 mr-1" />
                          Expert
                        </Badge>
                      )}
                      <Text className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
                      </Text>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      {entry.action === VerificationAction.APPROVE && (
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Verified
                        </Badge>
                      )}
                      {entry.action === VerificationAction.DISPUTE && (
                        <Badge variant="outline" className="gap-1 border-yellow-500 text-yellow-700">
                          <AlertCircle className="h-3 w-3" />
                          Disputed
                        </Badge>
                      )}
                      {entry.action === VerificationAction.REJECT && (
                        <Badge variant="destructive" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Rejected
                        </Badge>
                      )}
                    </div>

                    {entry.reason && (
                      <Text className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Reason: {entry.reason.replace('_', ' ').toLowerCase()}
                      </Text>
                    )}
                    
                    {entry.notes && (
                      <Text className="text-sm text-gray-600 dark:text-gray-400">
                        "{entry.notes}"
                      </Text>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    );
  };

  const renderExpertsTab = () => {
    return (
      <div className="space-y-4">
        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Info className="h-4 w-4" />
            Expert Verification Program
          </h4>
          <Text className="text-sm text-gray-600 dark:text-gray-400">
            Experts are verified wildlife professionals, researchers, and experienced observers
            who help maintain data quality in our community.
          </Text>
        </Card>

        <div className="space-y-3">
          {experts.map((expert, idx) => (
            <motion.div
              key={expert.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar
                    src={expert.avatar}
                    alt={expert.name}
                    size="md"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Text className="font-medium">{expert.name}</Text>
                      <Badge variant="secondary" size="sm">
                        <Shield className="h-3 w-3 mr-1" />
                        Expert
                      </Badge>
                    </div>
                    
                    <Text className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {expert.credentials}
                    </Text>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {expert.specializations.map(spec => (
                        <Badge key={spec} variant="outline" size="sm">
                          {spec}
                        </Badge>
                      ))}
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <Text className="text-gray-500">Verifications</Text>
                        <Text className="font-medium">{expert.verificationCount}</Text>
                      </div>
                      <div>
                        <Text className="text-gray-500">Accuracy</Text>
                        <Text className="font-medium">{Math.round(expert.accuracyRate * 100)}%</Text>
                      </div>
                      <div>
                        <Text className="text-gray-500">Response Time</Text>
                        <Text className="font-medium">{expert.averageResponseTime}h</Text>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  const renderGuidelinesTab = () => {
    return (
      <div className="space-y-4">
        <Card className="p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Verification Guidelines
          </h4>
          
          <div className="space-y-3">
            <div>
              <Text className="font-medium text-sm mb-2">What to Check:</Text>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Species identification matches photos and description</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Location is within known range for the species</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Date and time align with species activity patterns</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Behavior described is typical for the species</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                  <span>Photos appear authentic and unmanipulated</span>
                </li>
              </ul>
            </div>

            <div>
              <Text className="font-medium text-sm mb-2">When to Dispute:</Text>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <span>Species appears to be misidentified</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <span>Location is outside known range</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <span>Evidence appears manipulated</span>
                </li>
                <li className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                  <span>Duplicate or stolen content</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Verification Thresholds
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-gray-500" />
                <Text className="text-sm">Community Verified</Text>
              </div>
              <Badge variant="secondary">3+ verifications</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                <Text className="text-sm">Expert Verified</Text>
              </div>
              <Badge variant="secondary">1 expert verification</Badge>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <Text className="text-sm">Under Review</Text>
              </div>
              <Badge variant="outline">2+ disputes</Badge>
            </div>
          </div>
        </Card>
      </div>
    );
  };

  const tabs = [
    { id: 'verify', label: 'Verify', icon: <CheckCircle className="h-4 w-4" /> },
    { id: 'history', label: 'History', icon: <Clock className="h-4 w-4" /> },
    { id: 'experts', label: 'Experts', icon: <Shield className="h-4 w-4" /> },
    { id: 'guidelines', label: 'Guidelines', icon: <Info className="h-4 w-4" /> },
  ];

  return (
    <div className={className}>
      <Card className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Verification System
            </h3>
            <Text className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Community-driven sighting verification
            </Text>
          </div>

          {showStats && (
            <div className="flex items-center gap-4 text-sm">
              <div className="text-center">
                <Text className="font-medium">{stats.totalVerifications}</Text>
                <Text className="text-xs text-gray-500">Total</Text>
              </div>
              <div className="text-center">
                <Text className="font-medium">{Math.round(stats.photoVerificationRate * 100)}%</Text>
                <Text className="text-xs text-gray-500">w/ Photos</Text>
              </div>
              <div className="text-center">
                <Text className="font-medium">{stats.averageTime}h</Text>
                <Text className="text-xs text-gray-500">Avg Time</Text>
              </div>
            </div>
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
            {selectedTab === 'verify' && renderVerifyTab()}
            {selectedTab === 'history' && renderHistoryTab()}
            {selectedTab === 'experts' && renderExpertsTab()}
            {selectedTab === 'guidelines' && renderGuidelinesTab()}
          </motion.div>
        </AnimatePresence>
      </Card>

      {/* Dispute Modal */}
      <Modal
        isOpen={showDisputeModal}
        onClose={() => {
          setShowDisputeModal(false);
          setDisputeReason(DisputeReason.MISIDENTIFICATION);
          setDisputeNotes('');
        }}
        title="Dispute Sighting"
        className="max-w-lg"
      >
        <div className="space-y-4">
          <div>
            <Text className="font-medium mb-2">Reason for Dispute</Text>
            <Select
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value as DisputeReason)}
              className="w-full"
            >
              {disputeReasons.map(reason => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Text className="font-medium mb-2">Additional Details</Text>
            <Textarea
              value={disputeNotes}
              onChange={(e) => setDisputeNotes(e.target.value)}
              placeholder="Please provide specific details about your dispute..."
              rows={4}
              className="w-full"
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowDisputeModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={() => handleVerify(VerificationAction.DISPUTE)}
              disabled={!disputeNotes.trim()}
              className="flex-1"
            >
              Submit Dispute
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};