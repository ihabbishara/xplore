'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Upload,
  AlertTriangle,
  CheckCircle,
  Leaf,
  Info,
  X,
  Search,
  Loader,
  AlertCircle,
  Heart,
  Droplets,
  Sun,
  Eye,
  Users,
  MapPin,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Tabs } from '@/components/ui/Tabs';
import { useEmergencyStore } from '../hooks/useEmergencyStore';
import { EmergencyService } from '../services/emergencyService';
import { PlantHazard, HazardLevel } from '../types/emergency';

interface PlantIdentificationProps {
  onIdentify?: (plant: PlantHazard | null) => void;
  showHistory?: boolean;
  className?: string;
}

interface IdentificationResult {
  plant: PlantHazard | null;
  confidence: number;
  timestamp: Date;
  image: string;
}

const hazardLevelColors: Record<HazardLevel, string> = {
  [HazardLevel.CRITICAL]: 'bg-red-500 text-white',
  [HazardLevel.EXTREME]: 'bg-orange-500 text-white',
  [HazardLevel.HIGH]: 'bg-yellow-500 text-white',
  [HazardLevel.MODERATE]: 'bg-blue-500 text-white',
  [HazardLevel.LOW]: 'bg-green-500 text-white',
};

const hazardIcons: Record<HazardLevel, React.ReactElement> = {
  [HazardLevel.CRITICAL]: <AlertTriangle className="h-5 w-5" />,
  [HazardLevel.EXTREME]: <AlertCircle className="h-5 w-5" />,
  [HazardLevel.HIGH]: <AlertCircle className="h-4 w-4" />,
  [HazardLevel.MODERATE]: <Info className="h-4 w-4" />,
  [HazardLevel.LOW]: <CheckCircle className="h-4 w-4" />,
};

export const PlantIdentification: React.FC<PlantIdentificationProps> = ({
  onIdentify,
  showHistory = true,
  className = '',
}) => {
  const { plantHazards, loadPlantHazards } = useEmergencyStore();
  
  const [isCapturing, setIsCapturing] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [identificationResult, setIdentificationResult] = useState<IdentificationResult | null>(null);
  const [identificationHistory, setIdentificationHistory] = useState<IdentificationResult[]>([]);
  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState('identification');
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCapturing(true);
    } catch (error) {
      console.error('Failed to start camera:', error);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCapturing(false);
  };

  // Capture photo
  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg');
        setCapturedImage(imageData);
        stopCamera();
        analyzeImage(imageData);
      }
    }
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        setCapturedImage(imageData);
        analyzeImage(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  // Analyze image
  const analyzeImage = async (imageData: string) => {
    setIsAnalyzing(true);
    try {
      const result = await EmergencyService.identifyPlant(imageData);
      
      const identificationResult: IdentificationResult = {
        plant: result,
        confidence: result ? 0.85 : 0, // Simulated confidence
        timestamp: new Date(),
        image: imageData,
      };
      
      setIdentificationResult(identificationResult);
      setIdentificationHistory(prev => [identificationResult, ...prev]);
      setShowResultModal(true);
      
      if (onIdentify) {
        onIdentify(result);
      }
    } catch (error) {
      console.error('Failed to identify plant:', error);
      setIdentificationResult({
        plant: null,
        confidence: 0,
        timestamp: new Date(),
        image: imageData,
      });
      setShowResultModal(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Reset capture
  const resetCapture = () => {
    setCapturedImage(null);
    setIdentificationResult(null);
    stopCamera();
  };

  const renderPlantDetails = (plant: PlantHazard) => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-bold">{plant.name}</h3>
          <Text className="text-gray-600 dark:text-gray-400 italic">
            {plant.scientificName}
          </Text>
          {plant.commonNames.length > 0 && (
            <Text className="text-sm text-gray-500 dark:text-gray-500 mt-1">
              Also known as: {plant.commonNames.join(', ')}
            </Text>
          )}
        </div>
        <Badge
          className={`${hazardLevelColors[plant.toxicityLevel]} flex items-center gap-1`}
        >
          {hazardIcons[plant.toxicityLevel]}
          {plant.toxicityLevel}
        </Badge>
      </div>

      {/* Poison Type */}
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-red-500" />
        <Text className="font-medium">
          Poison Type: <span className="capitalize">{plant.poisonType.replace('_', ' ')}</span>
        </Text>
      </div>

      {/* Identification Features */}
      <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Eye className="h-4 w-4" />
          Identification Features
        </h4>
        <div className="grid grid-cols-2 gap-3 text-sm">
          {plant.identificationFeatures.leaves && (
            <div>
              <Text className="font-medium text-gray-600 dark:text-gray-400">Leaves:</Text>
              <Text>{plant.identificationFeatures.leaves}</Text>
            </div>
          )}
          {plant.identificationFeatures.flowers && (
            <div>
              <Text className="font-medium text-gray-600 dark:text-gray-400">Flowers:</Text>
              <Text>{plant.identificationFeatures.flowers}</Text>
            </div>
          )}
          {plant.identificationFeatures.fruits && (
            <div>
              <Text className="font-medium text-gray-600 dark:text-gray-400">Fruits:</Text>
              <Text>{plant.identificationFeatures.fruits}</Text>
            </div>
          )}
          {plant.identificationFeatures.height && (
            <div>
              <Text className="font-medium text-gray-600 dark:text-gray-400">Height:</Text>
              <Text>{plant.identificationFeatures.height}</Text>
            </div>
          )}
        </div>
      </Card>

      {/* Symptoms */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Heart className="h-4 w-4 text-red-500" />
          Symptoms by Exposure Type
        </h4>
        <div className="space-y-3">
          {plant.symptoms.contact && (
            <div>
              <Badge variant="outline" className="mb-2">Contact</Badge>
              <ul className="list-disc list-inside text-sm space-y-1">
                {plant.symptoms.contact.map((symptom, idx) => (
                  <li key={idx}>{symptom}</li>
                ))}
              </ul>
            </div>
          )}
          {plant.symptoms.ingestion && (
            <div>
              <Badge variant="outline" className="mb-2">Ingestion</Badge>
              <ul className="list-disc list-inside text-sm space-y-1">
                {plant.symptoms.ingestion.map((symptom, idx) => (
                  <li key={idx}>{symptom}</li>
                ))}
              </ul>
            </div>
          )}
          {plant.symptoms.inhalation && (
            <div>
              <Badge variant="outline" className="mb-2">Inhalation</Badge>
              <ul className="list-disc list-inside text-sm space-y-1">
                {plant.symptoms.inhalation.map((symptom, idx) => (
                  <li key={idx}>{symptom}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Treatment */}
      <Card className="p-4 bg-red-50 dark:bg-red-900/20">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-600" />
          Emergency Treatment
        </h4>
        
        <div className="space-y-3">
          <div>
            <Text className="font-medium text-red-800 dark:text-red-200 mb-2">
              Immediate Actions:
            </Text>
            <ol className="list-decimal list-inside text-sm space-y-1">
              {plant.treatment.immediate.map((action, idx) => (
                <li key={idx}>{action}</li>
              ))}
            </ol>
          </div>
          
          {plant.treatment.doNotDo.length > 0 && (
            <div>
              <Text className="font-medium text-red-800 dark:text-red-200 mb-2">
                DO NOT:
              </Text>
              <ul className="list-disc list-inside text-sm space-y-1">
                {plant.treatment.doNotDo.map((action, idx) => (
                  <li key={idx} className="text-red-700 dark:text-red-300">
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {plant.treatment.hospitalRequired && (
            <Badge variant="destructive" className="mt-2">
              Hospital Treatment Required
            </Badge>
          )}
        </div>
      </Card>

      {/* Look-alikes */}
      {plant.lookAlikes && plant.lookAlikes.length > 0 && (
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Users className="h-4 w-4" />
            Similar Looking Plants
          </h4>
          <div className="space-y-2">
            {plant.lookAlikes.map((lookAlike, idx) => (
              <Card key={idx} className="p-3">
                <div className="flex items-start justify-between">
                  <div>
                    <Text className="font-medium">{lookAlike.name}</Text>
                    <Text className="text-sm text-gray-600 dark:text-gray-400">
                      {lookAlike.difference}
                    </Text>
                  </div>
                  <Badge variant={lookAlike.safe ? 'secondary' : 'destructive'}>
                    {lookAlike.safe ? 'Safe' : 'Also Toxic'}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Habitat */}
      <div>
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          Where It Grows
        </h4>
        <div className="flex flex-wrap gap-2">
          {plant.habitat.map((habitat, idx) => (
            <Badge key={idx} variant="outline">
              {habitat}
            </Badge>
          ))}
        </div>
      </div>

      {/* Additional Info */}
      {(plant.medicalUses || plant.edibleParts) && (
        <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Info className="h-4 w-4" />
            Additional Information
          </h4>
          {plant.medicalUses && plant.medicalUses.length > 0 && (
            <div className="mb-3">
              <Text className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                Traditional Medical Uses:
              </Text>
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                {plant.medicalUses.join(', ')}
              </Text>
              <Text className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                ⚠️ Do not attempt without proper medical guidance
              </Text>
            </div>
          )}
          {plant.edibleParts && plant.edibleParts.length > 0 && (
            <div>
              <Text className="font-medium text-gray-700 dark:text-gray-300 mb-1">
                Edible Parts (when properly prepared):
              </Text>
              <Text className="text-sm text-gray-600 dark:text-gray-400">
                {plant.edibleParts.join(', ')}
              </Text>
            </div>
          )}
        </Card>
      )}
    </div>
  );

  return (
    <div className={className}>
      {/* Main Interface */}
      <Card className="p-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full mb-4">
            <Leaf className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Plant Identification</h2>
          <Text className="text-gray-600 dark:text-gray-400">
            Take a photo or upload an image to identify potentially dangerous plants
          </Text>
        </div>

        {/* Camera/Upload Interface */}
        {!capturedImage && !isCapturing && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={startCamera}
                className="h-32 flex-col gap-3"
              >
                <Camera className="h-8 w-8" />
                <span>Take Photo</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => fileInputRef.current?.click()}
                className="h-32 flex-col gap-3"
              >
                <Upload className="h-8 w-8" />
                <span>Upload Image</span>
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}

        {/* Camera View */}
        {isCapturing && (
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Camera Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 border-2 border-white/30 rounded-lg"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="w-48 h-48 border-2 border-white rounded-lg"></div>
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-white"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-white"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-white"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-white"></div>
              </div>
            </div>
            
            {/* Camera Controls */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-4">
              <Button
                variant="secondary"
                size="lg"
                onClick={stopCamera}
                className="bg-white/90 hover:bg-white"
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="lg"
                onClick={capturePhoto}
                className="bg-green-600 hover:bg-green-700"
              >
                <Camera className="h-5 w-5" />
                Capture
              </Button>
            </div>
          </div>
        )}

        {/* Captured Image Preview */}
        {capturedImage && !isAnalyzing && (
          <div className="relative">
            <img
              src={capturedImage}
              alt="Captured plant"
              className="w-full rounded-lg"
            />
            <div className="absolute top-2 right-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetCapture}
                className="bg-white/90 hover:bg-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Analyzing State */}
        {isAnalyzing && (
          <div className="text-center py-12">
            <Loader className="h-12 w-12 animate-spin text-green-600 mx-auto mb-4" />
            <Text className="text-lg font-medium mb-2">Analyzing Plant...</Text>
            <Text className="text-gray-600 dark:text-gray-400">
              Using AI to identify species and check for toxicity
            </Text>
          </div>
        )}

        {/* Safety Tips */}
        <Card className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <Text className="font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                Plant Safety Tips:
              </Text>
              <ul className="list-disc list-inside space-y-1 text-yellow-700 dark:text-yellow-300">
                <li>Never eat unknown plants or berries</li>
                <li>Wear gloves when handling unfamiliar plants</li>
                <li>Keep children and pets away from unknown plants</li>
                <li>If exposed to a toxic plant, seek medical help immediately</li>
              </ul>
            </div>
          </div>
        </Card>
      </Card>

      {/* History */}
      {showHistory && identificationHistory.length > 0 && (
        <Card className="mt-6 p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Identifications</h3>
          <div className="space-y-3">
            {identificationHistory.slice(0, 5).map((result, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                onClick={() => {
                  setIdentificationResult(result);
                  setShowResultModal(true);
                }}
              >
                <img
                  src={result.image}
                  alt="Plant"
                  className="w-16 h-16 rounded object-cover"
                />
                <div className="flex-1">
                  <Text className="font-medium">
                    {result.plant?.name || 'Unknown Plant'}
                  </Text>
                  <div className="flex items-center gap-2 mt-1">
                    {result.plant && (
                      <Badge
                        variant="secondary"
                        size="sm"
                        className={hazardLevelColors[result.plant.toxicityLevel]}
                      >
                        {result.plant.toxicityLevel}
                      </Badge>
                    )}
                    <Text className="text-xs text-gray-500">
                      {new Date(result.timestamp).toLocaleString()}
                    </Text>
                  </div>
                </div>
                <Text className="text-sm text-gray-500">
                  {Math.round(result.confidence * 100)}% match
                </Text>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Result Modal */}
      <Modal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        title="Plant Identification Result"
        className="max-w-3xl"
      >
        {identificationResult && (
          <div>
            {identificationResult.plant ? (
              <>
                {/* Success Header */}
                <Card className={`mb-6 p-4 ${
                  identificationResult.plant.toxicityLevel === HazardLevel.CRITICAL ||
                  identificationResult.plant.toxicityLevel === HazardLevel.EXTREME
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : identificationResult.plant.toxicityLevel === HazardLevel.HIGH
                    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                    : 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                }`}>
                  <div className="flex items-center gap-3">
                    {hazardIcons[identificationResult.plant.toxicityLevel]}
                    <div>
                      <Text className="font-semibold">
                        Plant Identified with {Math.round(identificationResult.confidence * 100)}% confidence
                      </Text>
                      <Text className="text-sm mt-1">
                        Toxicity Level: {identificationResult.plant.toxicityLevel}
                      </Text>
                    </div>
                  </div>
                </Card>

                {/* Plant Details */}
                {renderPlantDetails(identificationResult.plant)}
              </>
            ) : (
              /* No Match Found */
              <Card className="p-6 text-center">
                <HelpCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <Text className="text-lg font-medium mb-2">
                  Plant Not Identified
                </Text>
                <Text className="text-gray-600 dark:text-gray-400 mb-4">
                  Could not identify this plant with confidence. Please try again with a clearer image.
                </Text>
                <div className="space-y-2 text-sm text-left max-w-md mx-auto">
                  <Text className="font-medium">Tips for better results:</Text>
                  <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                    <li>Ensure good lighting</li>
                    <li>Focus on distinctive features (leaves, flowers, fruits)</li>
                    <li>Include multiple angles if possible</li>
                    <li>Avoid blurry or distant shots</li>
                  </ul>
                </div>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setShowResultModal(false);
                  resetCapture();
                }}
              >
                Identify Another
              </Button>
              <Button
                variant="default"
                onClick={() => setShowResultModal(false)}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};