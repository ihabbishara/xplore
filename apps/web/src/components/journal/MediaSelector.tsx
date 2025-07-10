'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Camera, Image, X, Plus, Check } from 'lucide-react';

export interface Media {
  id: string;
  type: 'photo' | 'video';
  url: string;
  file?: File;
  thumbnail?: string;
}

interface MediaSelectorProps {
  onNext: (media: Media[]) => void;
  maxSelection?: number;
}

export const MediaSelector = ({ onNext, maxSelection = 10 }: MediaSelectorProps) => {
  const [selectedMedia, setSelectedMedia] = useState<Media[]>([]);
  const [currentView, setCurrentView] = useState<'camera' | 'gallery'>('gallery');
  const [isCapturing, setIsCapturing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach((file) => {
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newMedia: Media = {
            id: Math.random().toString(36).substr(2, 9),
            type: file.type.startsWith('video/') ? 'video' : 'photo',
            url: e.target?.result as string,
            file: file
          };
          setSelectedMedia(prev => [...prev, newMedia].slice(0, maxSelection));
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCapturing(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (context) {
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        
        const dataUrl = canvas.toDataURL('image/jpeg');
        const newMedia: Media = {
          id: Math.random().toString(36).substr(2, 9),
          type: 'photo',
          url: dataUrl
        };
        
        setSelectedMedia(prev => [...prev, newMedia].slice(0, maxSelection));
      }
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCapturing(false);
  };

  const removeMedia = (id: string) => {
    setSelectedMedia(prev => prev.filter(media => media.id !== id));
  };

  const handleNext = () => {
    if (selectedMedia.length > 0) {
      onNext(selectedMedia);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full bg-gray-900"
    >
      {/* View Toggle */}
      <div className="flex-shrink-0 p-4">
        <div className="flex bg-gray-800 rounded-full p-1 max-w-xs mx-auto">
          <button
            onClick={() => {
              setCurrentView('gallery');
              if (isCapturing) stopCamera();
            }}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              currentView === 'gallery' 
                ? 'bg-white text-black shadow-lg' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Image className="w-4 h-4" />
            <span>Gallery</span>
          </button>
          <button
            onClick={() => {
              setCurrentView('camera');
              if (!isCapturing) startCamera();
            }}
            className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
              currentView === 'camera' 
                ? 'bg-white text-black shadow-lg' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Camera</span>
          </button>
        </div>
      </div>

      {/* Selected Media Preview */}
      {selectedMedia.length > 0 && (
        <div className="flex-shrink-0 px-4 pb-4">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {selectedMedia.map((media) => (
              <div key={media.id} className="relative flex-shrink-0">
                <img 
                  src={media.url}
                  alt="Selected"
                  className="w-16 h-16 object-cover rounded-lg border-2 border-blue-500"
                />
                <button
                  onClick={() => removeMedia(media.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 px-4 overflow-hidden">
        {currentView === 'gallery' ? (
          <div className="h-full">
            {/* Upload Button */}
            <div className="mb-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-4 border-2 border-dashed border-gray-600 rounded-lg text-gray-400 hover:border-gray-500 hover:text-gray-300 transition-colors"
              >
                <Plus className="w-6 h-6 mx-auto mb-2" />
                <span className="text-sm">Upload photos or videos</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Mock Gallery Grid */}
            <div className="grid grid-cols-3 gap-1 overflow-y-auto h-full pb-20">
              {Array.from({ length: 20 }, (_, i) => (
                <div
                  key={i}
                  className="aspect-square bg-gray-800 rounded-lg cursor-pointer relative overflow-hidden group hover:scale-105 active:scale-95 transition-transform"
                  onClick={() => {
                    const mockMedia: Media = {
                      id: `mock-${i}`,
                      type: 'photo',
                      url: `https://picsum.photos/300/300?random=${i}`,
                    };
                    setSelectedMedia(prev => {
                      const isSelected = prev.some(m => m.id === mockMedia.id);
                      if (isSelected) {
                        return prev.filter(m => m.id !== mockMedia.id);
                      }
                      return [...prev, mockMedia].slice(0, maxSelection);
                    });
                  }}
                >
                  <img 
                    src={`https://picsum.photos/300/300?random=${i}`}
                    alt={`Gallery item ${i}`}
                    className="w-full h-full object-cover"
                  />
                  {selectedMedia.some(m => m.id === `mock-${i}`) && (
                    <div className="absolute inset-0 bg-blue-500 bg-opacity-50 flex items-center justify-center">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            {isCapturing ? (
              <div className="relative w-full max-w-md">
                <video
                  ref={videoRef}
                  className="w-full rounded-lg"
                  autoPlay
                  muted
                  playsInline
                />
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-4">
                  <button
                    onClick={capturePhoto}
                    className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
                  >
                    <Camera className="w-8 h-8 text-black" />
                  </button>
                  <button
                    onClick={stopCamera}
                    className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div
                  className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 cursor-pointer hover:scale-110 active:scale-90 transition-transform"
                  onClick={startCamera}
                >
                  <Camera className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-white text-lg font-semibold mb-2">Start Camera</h3>
                <p className="text-gray-400 text-sm">
                  Tap to access your camera and take photos
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Next Button */}
      {selectedMedia.length > 0 && (
        <div className="flex-shrink-0 p-4 bg-gradient-to-t from-gray-900 to-transparent">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <button
              onClick={handleNext}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
            >
              Next ({selectedMedia.length}/{maxSelection})
            </button>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};