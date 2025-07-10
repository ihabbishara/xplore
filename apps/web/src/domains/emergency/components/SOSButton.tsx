'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Phone,
  MessageSquare,
  Volume2,
  Flashlight,
  MapPin,
  Users,
  Camera,
  Mic,
  StopCircle,
  AlertTriangle,
  X,
  CheckCircle,
  Loader,
  Battery,
  Signal,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useEmergencyStore } from '../hooks/useEmergencyStore';
import { EmergencyType, EmergencyContact, EMERGENCY_CONSTANTS } from '../types/emergency';

interface SOSButtonProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showQuickActions?: boolean;
}

interface SOSModalState {
  isOpen: boolean;
  message: string;
  type: EmergencyType;
  selectedContacts: string[];
  includedMedia: string[];
  includeLocation: boolean;
  includeHealthInfo: boolean;
}

export const SOSButton: React.FC<SOSButtonProps> = ({
  className = '',
  size = 'lg',
  showQuickActions = true,
}) => {
  const {
    sosActive,
    sosMessage,
    emergencyContacts,
    nearbyContacts,
    loading,
    activateSOS,
    deactivateSOS,
    loadNearbyContacts,
  } = useEmergencyStore();

  const [showSOSModal, setShowSOSModal] = useState(false);
  const [sosModalState, setSOSModalState] = useState<SOSModalState>({
    isOpen: false,
    message: '',
    type: EmergencyType.GENERAL,
    selectedContacts: [],
    includedMedia: [],
    includeLocation: true,
    includeHealthInfo: false,
  });

  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [alarmOn, setAlarmOn] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [signalStrength, setSignalStrength] = useState<number>(0);
  const [countdown, setCountdown] = useState<number | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const flashIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Get current location
  const getCurrentLocation = useCallback(() => {
    return new Promise<GeolocationPosition>((resolve, reject) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      } else {
        reject(new Error('Geolocation not supported'));
      }
    });
  }, []);

  // Load nearby contacts on mount
  useEffect(() => {
    getCurrentLocation()
      .then((position) => {
        loadNearbyContacts({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      })
      .catch(console.error);
  }, [getCurrentLocation, loadNearbyContacts]);

  // Monitor battery level
  useEffect(() => {
    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((battery: any) => {
        const updateBatteryLevel = () => {
          setBatteryLevel(Math.round(battery.level * 100));
        };
        updateBatteryLevel();
        battery.addEventListener('levelchange', updateBatteryLevel);
        
        return () => {
          battery.removeEventListener('levelchange', updateBatteryLevel);
        };
      });
    }
  }, []);

  // Monitor network connection
  useEffect(() => {
    const updateSignalStrength = () => {
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        // Simulate signal strength based on connection type
        const strengthMap: Record<string, number> = {
          '4g': 4,
          '3g': 3,
          '2g': 2,
          'slow-2g': 1,
          'wifi': 4,
          'ethernet': 4,
        };
        setSignalStrength(strengthMap[connection.effectiveType] || 0);
      }
    };

    updateSignalStrength();
    window.addEventListener('online', updateSignalStrength);
    window.addEventListener('offline', () => setSignalStrength(0));

    return () => {
      window.removeEventListener('online', updateSignalStrength);
      window.removeEventListener('offline', () => setSignalStrength(0));
    };
  }, []);

  // Start SOS countdown
  const startSOSCountdown = () => {
    setCountdown(5);
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
          }
          handleSendSOS();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Cancel countdown
  const cancelCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    setCountdown(null);
  };

  // Handle SOS activation
  const handleSendSOS = async () => {
    try {
      const position = await getCurrentLocation();
      
      const sosData = {
        location: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
        message: sosModalState.message || 'Emergency! Need immediate help!',
        type: sosModalState.type,
        contacts: sosModalState.selectedContacts,
        mediaFiles: sosModalState.includedMedia,
      };

      await activateSOS(sosData);
      
      // Start additional alert methods if enabled
      if (alarmOn) startAlarm();
      if (flashlightOn) startFlashlight();
      
      setShowSOSModal(false);
    } catch (error) {
      console.error('Failed to send SOS:', error);
    }
  };

  // Toggle flashlight (using device flashlight if available)
  const toggleFlashlight = () => {
    if (flashlightOn) {
      stopFlashlight();
    } else {
      startFlashlight();
    }
  };

  const startFlashlight = async () => {
    setFlashlightOn(true);
    
    // Try to use device flashlight
    if ('mediaDevices' in navigator) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        const track = stream.getVideoTracks()[0];
        if ('torch' in track.getCapabilities()) {
          await (track as any).applyConstraints({ torch: true });
        }
      } catch (error) {
        console.error('Flashlight not available:', error);
      }
    }

    // Morse code SOS pattern
    const pattern = EMERGENCY_CONSTANTS.FLASH_PATTERN;
    let index = 0;
    
    flashIntervalRef.current = setInterval(() => {
      // Toggle screen flash as fallback
      document.body.style.backgroundColor = index % 2 === 0 ? 'white' : '';
      index++;
    }, pattern[index % pattern.length]);
  };

  const stopFlashlight = () => {
    setFlashlightOn(false);
    if (flashIntervalRef.current) {
      clearInterval(flashIntervalRef.current);
    }
    document.body.style.backgroundColor = '';
  };

  // Toggle alarm sound
  const toggleAlarm = () => {
    if (alarmOn) {
      stopAlarm();
    } else {
      startAlarm();
    }
  };

  const startAlarm = () => {
    setAlarmOn(true);
    
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    const ctx = audioContextRef.current;
    oscillatorRef.current = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillatorRef.current.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    // Create siren effect
    oscillatorRef.current.type = 'sine';
    let frequency = 440;
    
    const sirenInterval = setInterval(() => {
      if (oscillatorRef.current) {
        frequency = frequency === 440 ? 880 : 440;
        oscillatorRef.current.frequency.setValueAtTime(frequency, ctx.currentTime);
      }
    }, 500);
    
    oscillatorRef.current.start();
    
    // Auto-stop after duration
    setTimeout(() => {
      stopAlarm();
      clearInterval(sirenInterval);
    }, EMERGENCY_CONSTANTS.SOS_SOUND_DURATION * 1000);
  };

  const stopAlarm = () => {
    setAlarmOn(false);
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current = null;
    }
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        chunks.push(e.data);
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        // Convert to base64 for storage
        const reader = new FileReader();
        reader.onloadend = () => {
          if (reader.result) {
            setSOSModalState(prev => ({
              ...prev,
              includedMedia: [...prev.includedMedia, reader.result as string],
            }));
          }
        };
        reader.readAsDataURL(blob);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Capture photo
  const capturePhoto = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.createElement('video');
      video.srcObject = stream;
      video.play();
      
      await new Promise(resolve => video.onloadedmetadata = resolve);
      
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      
      stream.getTracks().forEach(track => track.stop());
      
      canvas.toBlob((blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.onloadend = () => {
            if (reader.result) {
              setSOSModalState(prev => ({
                ...prev,
                includedMedia: [...prev.includedMedia, reader.result as string],
              }));
            }
          };
          reader.readAsDataURL(blob);
        }
      });
    } catch (error) {
      console.error('Failed to capture photo:', error);
    }
  };

  const sizeClasses = {
    sm: 'h-12 w-12 text-base',
    md: 'h-16 w-16 text-lg',
    lg: 'h-20 w-20 text-xl',
  };

  return (
    <>
      {/* Main SOS Button */}
      <div className={`relative ${className}`}>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowSOSModal(true)}
          className={`
            ${sizeClasses[size]}
            relative rounded-full bg-red-600 text-white shadow-lg
            hover:bg-red-700 transition-colors duration-200
            flex items-center justify-center font-bold
            ${sosActive ? 'animate-pulse' : ''}
          `}
        >
          {sosActive ? (
            <StopCircle className="h-2/3 w-2/3" />
          ) : (
            'SOS'
          )}
          
          {/* Battery indicator */}
          {batteryLevel !== null && batteryLevel < EMERGENCY_CONSTANTS.EMERGENCY_BATTERY_THRESHOLD && (
            <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
              <Battery className="h-3 w-3 text-white" />
            </div>
          )}
        </motion.button>

        {/* Quick Actions */}
        {showQuickActions && !sosActive && (
          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFlashlight}
              className={`rounded-full ${flashlightOn ? 'bg-yellow-100 dark:bg-yellow-900' : ''}`}
            >
              <Flashlight className={`h-4 w-4 ${flashlightOn ? 'text-yellow-600' : ''}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAlarm}
              className={`rounded-full ${alarmOn ? 'bg-red-100 dark:bg-red-900' : ''}`}
            >
              <Volume2 className={`h-4 w-4 ${alarmOn ? 'text-red-600' : ''}`} />
            </Button>
          </div>
        )}
      </div>

      {/* SOS Modal */}
      <Modal
        isOpen={showSOSModal}
        onClose={() => setShowSOSModal(false)}
        title="Send Emergency SOS"
        className="max-w-2xl"
      >
        <div className="space-y-6">
          {/* Status Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Signal Strength */}
              <div className="flex items-center gap-1">
                <Signal className="h-4 w-4 text-gray-600" />
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4].map((level) => (
                    <div
                      key={level}
                      className={`w-1 h-${level + 1} ${
                        level <= signalStrength ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              {/* Battery Level */}
              {batteryLevel !== null && (
                <div className="flex items-center gap-1">
                  <Battery className="h-4 w-4 text-gray-600" />
                  <Text className="text-sm">{batteryLevel}%</Text>
                </div>
              )}
            </div>

            {/* Countdown */}
            {countdown !== null && (
              <div className="flex items-center gap-2">
                <Loader className="h-4 w-4 animate-spin text-red-600" />
                <Text className="font-bold text-red-600">
                  Sending in {countdown}...
                </Text>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelCountdown}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {/* Emergency Type */}
          <div>
            <Text className="font-medium mb-2">Emergency Type</Text>
            <Select
              value={sosModalState.type}
              onChange={(e) => setSOSModalState(prev => ({ ...prev, type: e.target.value as EmergencyType }))}
            >
              {Object.values(EmergencyType).map((type) => (
                <option key={type} value={type}>
                  {type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1)}
                </option>
              ))}
            </Select>
          </div>

          {/* Message */}
          <div>
            <Text className="font-medium mb-2">Emergency Message</Text>
            <Textarea
              value={sosModalState.message}
              onChange={(e) => setSOSModalState(prev => ({ ...prev, message: e.target.value }))}
              placeholder="Describe your emergency..."
              rows={3}
            />
          </div>

          {/* Contact Selection */}
          <div>
            <Text className="font-medium mb-2">Notify Contacts</Text>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {[...emergencyContacts, ...nearbyContacts].map((contact) => (
                <label
                  key={contact.id}
                  className="flex items-center gap-3 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={sosModalState.selectedContacts.includes(contact.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSOSModalState(prev => ({
                          ...prev,
                          selectedContacts: [...prev.selectedContacts, contact.id],
                        }));
                      } else {
                        setSOSModalState(prev => ({
                          ...prev,
                          selectedContacts: prev.selectedContacts.filter(id => id !== contact.id),
                        }));
                      }
                    }}
                    className="rounded"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Text className="font-medium">{contact.name}</Text>
                      <Badge size="sm" variant="outline">
                        {contact.type}
                      </Badge>
                      {contact.available24h && (
                        <Badge size="sm" variant="secondary">
                          24/7
                        </Badge>
                      )}
                    </div>
                    <Text className="text-sm text-gray-600">{contact.number}</Text>
                  </div>
                  {contact.distance && (
                    <Text className="text-sm text-gray-500">
                      {contact.distance.toFixed(1)}km
                    </Text>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Media Capture */}
          <div>
            <Text className="font-medium mb-2">Attach Evidence</Text>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={isRecording ? stopRecording : startRecording}
                className="gap-2"
              >
                <Mic className={`h-4 w-4 ${isRecording ? 'text-red-600 animate-pulse' : ''}`} />
                {isRecording ? 'Stop Recording' : 'Record Audio'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={capturePhoto}
                className="gap-2"
              >
                <Camera className="h-4 w-4" />
                Take Photo
              </Button>
            </div>
            {sosModalState.includedMedia.length > 0 && (
              <div className="mt-2">
                <Badge variant="secondary">
                  {sosModalState.includedMedia.length} media attached
                </Badge>
              </div>
            )}
          </div>

          {/* Additional Options */}
          <div className="space-y-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={sosModalState.includeLocation}
                onChange={(e) => setSOSModalState(prev => ({ ...prev, includeLocation: e.target.checked }))}
                className="rounded"
              />
              <Text>Include my exact location</Text>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={sosModalState.includeHealthInfo}
                onChange={(e) => setSOSModalState(prev => ({ ...prev, includeHealthInfo: e.target.checked }))}
                className="rounded"
              />
              <Text>Include medical information</Text>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              variant="ghost"
              onClick={() => setShowSOSModal(false)}
            >
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setAlarmOn(!alarmOn);
                  if (!alarmOn) startAlarm();
                  else stopAlarm();
                }}
                className="gap-2"
              >
                <Volume2 className={`h-4 w-4 ${alarmOn ? 'text-red-600' : ''}`} />
                {alarmOn ? 'Stop' : 'Start'} Alarm
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setFlashlightOn(!flashlightOn);
                  if (!flashlightOn) startFlashlight();
                  else stopFlashlight();
                }}
                className="gap-2"
              >
                <Flashlight className={`h-4 w-4 ${flashlightOn ? 'text-yellow-600' : ''}`} />
                {flashlightOn ? 'Stop' : 'Start'} Flash
              </Button>
              <Button
                variant="destructive"
                onClick={startSOSCountdown}
                disabled={sosModalState.selectedContacts.length === 0 || loading}
                className="gap-2"
              >
                <AlertTriangle className="h-4 w-4" />
                Send SOS
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Active SOS Status */}
      <AnimatePresence>
        {sosActive && sosMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-20 left-4 right-4 z-50"
          >
            <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="animate-pulse">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                    </div>
                    <Text className="font-semibold text-red-800 dark:text-red-200">
                      SOS Active
                    </Text>
                    <Badge variant="destructive" size="sm">
                      {sosMessage.status}
                    </Badge>
                  </div>
                  <Text className="text-sm text-red-700 dark:text-red-300">
                    Emergency message sent to {sosMessage.contacts.length} contacts
                  </Text>
                  <div className="flex items-center gap-4 mt-2 text-xs text-red-600 dark:text-red-400">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      Location shared
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {sosMessage.contacts.length} notified
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={deactivateSOS}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};