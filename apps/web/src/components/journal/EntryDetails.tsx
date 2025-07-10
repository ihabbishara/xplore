'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Globe, Users, Lock, MapPin, Hash, Send } from 'lucide-react';

export interface EntryDetails {
  location?: string;
  privacy: 'public' | 'private' | 'friends';
  tags: string[];
  mood?: string;
  weather?: string;
}

interface EntryDetailsProps {
  onPublish: (details: EntryDetails) => void;
  onBack: () => void;
}

const PRIVACY_OPTIONS = [
  { 
    value: 'public', 
    label: 'Public', 
    desc: 'Anyone can see this post',
    icon: <Globe className="w-5 h-5" />
  },
  { 
    value: 'friends', 
    label: 'Friends', 
    desc: 'Only your friends can see this',
    icon: <Users className="w-5 h-5" />
  },
  { 
    value: 'private', 
    label: 'Private', 
    desc: 'Only you can see this',
    icon: <Lock className="w-5 h-5" />
  }
];

const MOOD_OPTIONS = [
  '😊 Happy', '😍 Excited', '😌 Peaceful', '🤩 Amazed', '😎 Cool',
  '🥰 Loved', '😤 Determined', '🤗 Grateful', '😇 Blessed', '🤤 Satisfied',
  '🤔 Thoughtful', '😴 Tired', '😂 Funny', '🥳 Celebrating', '😋 Delicious'
];

const WEATHER_OPTIONS = [
  '☀️ Sunny', '⛅ Partly Cloudy', '☁️ Cloudy', '🌧️ Rainy', '⛈️ Stormy',
  '🌨️ Snowy', '🌫️ Foggy', '🌪️ Windy', '🌈 Rainbow', '❄️ Cold',
  '🔥 Hot', '🌸 Spring', '🍂 Autumn', '🌊 Breezy', '🌙 Night'
];

export const EntryDetails = ({ onPublish, onBack }: EntryDetailsProps) => {
  const [details, setDetails] = useState<EntryDetails>({
    privacy: 'public',
    tags: [],
  });
  const [tagInput, setTagInput] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const handleAddTag = () => {
    if (tagInput.trim() && !details.tags.includes(tagInput.trim())) {
      setDetails(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setDetails(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    // Simulate publishing delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    onPublish(details);
    setIsPublishing(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full bg-black"
    >
      {/* Header */}
      <div className="flex-shrink-0 p-4 flex items-center justify-between bg-black bg-opacity-50 backdrop-blur-sm">
        <button
          onClick={onBack}
          className="text-white hover:text-gray-300 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-white text-lg font-semibold">Share Story</h2>
        <button
          onClick={handlePublish}
          disabled={isPublishing}
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full font-semibold hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPublishing ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Sharing...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Send className="w-4 h-4" />
              <span>Share</span>
            </div>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Privacy Settings */}
        <div>
          <h3 className="text-white text-lg font-semibold mb-4 flex items-center">
            <Lock className="w-5 h-5 mr-2" />
            Privacy
          </h3>
          <div className="space-y-2">
            {PRIVACY_OPTIONS.map((option) => (
              <motion.button
                key={option.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setDetails({ ...details, privacy: option.value as any })}
                className={`w-full p-4 rounded-xl text-left transition-all ${
                  details.privacy === option.value 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                    : 'bg-gray-800 bg-opacity-50 text-gray-300 hover:bg-gray-700 hover:bg-opacity-70'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {option.icon}
                  <div>
                    <div className="font-medium">{option.label}</div>
                    <div className="text-sm opacity-75">{option.desc}</div>
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div>
          <h3 className="text-white text-lg font-semibold mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2" />
            Location
          </h3>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Add a location..."
              value={details.location || ''}
              onChange={(e) => setDetails({ ...details, location: e.target.value })}
              className="w-full pl-12 pr-4 py-3 bg-gray-800 bg-opacity-50 text-white rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-gray-800 transition-all"
            />
          </div>
        </div>

        {/* Mood */}
        <div>
          <h3 className="text-white text-lg font-semibold mb-4">Mood</h3>
          <div className="grid grid-cols-3 gap-2">
            {MOOD_OPTIONS.map((mood) => (
              <motion.button
                key={mood}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDetails({ ...details, mood })}
                className={`p-3 rounded-xl text-sm font-medium transition-all ${
                  details.mood === mood 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                    : 'bg-gray-800 bg-opacity-50 text-gray-300 hover:bg-gray-700 hover:bg-opacity-70'
                }`}
              >
                {mood}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Weather */}
        <div>
          <h3 className="text-white text-lg font-semibold mb-4">Weather</h3>
          <div className="grid grid-cols-3 gap-2">
            {WEATHER_OPTIONS.map((weather) => (
              <motion.button
                key={weather}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setDetails({ ...details, weather })}
                className={`p-3 rounded-xl text-sm font-medium transition-all ${
                  details.weather === weather 
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                    : 'bg-gray-800 bg-opacity-50 text-gray-300 hover:bg-gray-700 hover:bg-opacity-70'
                }`}
              >
                {weather}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <h3 className="text-white text-lg font-semibold mb-4 flex items-center">
            <Hash className="w-5 h-5 mr-2" />
            Tags
          </h3>
          <div className="space-y-3">
            <div className="flex space-x-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Add tags..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  className="w-full pl-12 pr-4 py-3 bg-gray-800 bg-opacity-50 text-white rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-gray-800 transition-all"
                />
              </div>
              <button
                onClick={handleAddTag}
                className="bg-blue-600 text-white px-4 py-3 rounded-xl hover:bg-blue-700 transition-colors"
              >
                Add
              </button>
            </div>
            
            {details.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {details.tags.map((tag) => (
                  <motion.span
                    key={tag}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gray-700 text-gray-300 px-3 py-1 rounded-full text-sm flex items-center space-x-2"
                  >
                    <span>#{tag}</span>
                    <button
                      onClick={() => handleRemoveTag(tag)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      ×
                    </button>
                  </motion.span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};