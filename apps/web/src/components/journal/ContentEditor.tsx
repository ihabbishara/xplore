'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Type, Smile, Palette, Sticker, Download, RotateCcw } from 'lucide-react';
import { Media } from './MediaSelector';

interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontWeight: 'normal' | 'bold';
  textAlign: 'left' | 'center' | 'right';
}

interface StickerOverlay {
  id: string;
  emoji: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
}

export interface JournalContent {
  text: string;
  textOverlays: TextOverlay[];
  stickers: StickerOverlay[];
  filter?: string;
}

interface ContentEditorProps {
  media: Media[];
  onNext: (content: JournalContent) => void;
  onBack: () => void;
}

const FILTERS = [
  { name: 'None', value: '', style: '' },
  { name: 'Sepia', value: 'sepia', style: 'sepia(1)' },
  { name: 'Grayscale', value: 'grayscale', style: 'grayscale(1)' },
  { name: 'Invert', value: 'invert', style: 'invert(1)' },
  { name: 'Blur', value: 'blur', style: 'blur(2px)' },
  { name: 'Bright', value: 'bright', style: 'brightness(1.5)' },
  { name: 'Contrast', value: 'contrast', style: 'contrast(1.5)' },
  { name: 'Vintage', value: 'vintage', style: 'sepia(0.5) contrast(1.2) brightness(1.1)' },
];

const POPULAR_EMOJIS = [
  '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
  '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
  '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
  '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
  '✨', '⭐', '🌟', '💫', '⚡', '🔥', '💥', '☄️', '🌈', '☀️',
  '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🎯', '🎪', '🎭', '🎨',
];

export const ContentEditor = ({ media, onNext, onBack }: ContentEditorProps) => {
  const [content, setContent] = useState<JournalContent>({
    text: '',
    textOverlays: [],
    stickers: [],
  });
  const [selectedFilter, setSelectedFilter] = useState('');
  const [activeMode, setActiveMode] = useState<'text' | 'sticker' | 'filter' | null>(null);
  const [newTextOverlay, setNewTextOverlay] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textSize, setTextSize] = useState(24);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleAddTextOverlay = () => {
    if (newTextOverlay.trim()) {
      const newOverlay: TextOverlay = {
        id: Math.random().toString(36).substr(2, 9),
        text: newTextOverlay,
        x: 50,
        y: 50,
        fontSize: textSize,
        color: textColor,
        fontWeight: 'normal',
        textAlign: 'center',
      };
      setContent(prev => ({
        ...prev,
        textOverlays: [...prev.textOverlays, newOverlay]
      }));
      setNewTextOverlay('');
      setActiveMode(null);
    }
  };

  const handleAddSticker = (emoji: string) => {
    const newSticker: StickerOverlay = {
      id: Math.random().toString(36).substr(2, 9),
      emoji,
      x: Math.random() * 60 + 20,
      y: Math.random() * 60 + 20,
      size: 40,
      rotation: 0,
    };
    setContent(prev => ({
      ...prev,
      stickers: [...prev.stickers, newSticker]
    }));
  };

  const handleNext = () => {
    onNext({
      ...content,
      filter: selectedFilter,
    });
  };

  const currentMedia = media[0];

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
        <h2 className="text-white text-lg font-semibold">Edit Story</h2>
        <button
          onClick={handleNext}
          className="text-blue-400 hover:text-blue-300 transition-colors font-semibold"
        >
          Next
        </button>
      </div>

      {/* Media Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <div 
          ref={canvasRef}
          className="relative w-full h-full flex items-center justify-center"
        >
          {currentMedia && (
            <div className="relative max-w-full max-h-full">
              <img 
                src={currentMedia.url}
                alt="Selected media"
                className="w-full h-full object-contain rounded-lg"
                style={{ 
                  filter: selectedFilter ? FILTERS.find(f => f.value === selectedFilter)?.style || '' : '' 
                }}
              />
              
              {/* Text Overlays */}
              {content.textOverlays.map((overlay) => (
                <div
                  key={overlay.id}
                  className="absolute cursor-move select-none"
                  style={{
                    left: `${overlay.x}%`,
                    top: `${overlay.y}%`,
                    fontSize: `${overlay.fontSize}px`,
                    color: overlay.color,
                    fontWeight: overlay.fontWeight,
                    textAlign: overlay.textAlign,
                    textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  {overlay.text}
                </div>
              ))}

              {/* Sticker Overlays */}
              {content.stickers.map((sticker) => (
                <div
                  key={sticker.id}
                  className="absolute cursor-move select-none"
                  style={{
                    left: `${sticker.x}%`,
                    top: `${sticker.y}%`,
                    fontSize: `${sticker.size}px`,
                    transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg)`,
                  }}
                >
                  {sticker.emoji}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Caption Input */}
      <div className="flex-shrink-0 p-4 bg-gray-900 bg-opacity-50 backdrop-blur-sm">
        <textarea
          value={content.text}
          onChange={(e) => setContent({ ...content, text: e.target.value })}
          placeholder="Write a caption..."
          className="w-full bg-transparent text-white placeholder-gray-400 resize-none outline-none text-base"
          rows={2}
        />
      </div>

      {/* Editing Tools */}
      <div className="flex-shrink-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm">
        {/* Tool Bar */}
        <div className="flex justify-center items-center p-4 border-b border-gray-800">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveMode(activeMode === 'text' ? null : 'text')}
              className={`p-3 rounded-full transition-all ${
                activeMode === 'text' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Type className="w-6 h-6" />
            </button>
            <button
              onClick={() => setActiveMode(activeMode === 'sticker' ? null : 'sticker')}
              className={`p-3 rounded-full transition-all ${
                activeMode === 'sticker' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Smile className="w-6 h-6" />
            </button>
            <button
              onClick={() => setActiveMode(activeMode === 'filter' ? null : 'filter')}
              className={`p-3 rounded-full transition-all ${
                activeMode === 'filter' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <Palette className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tool Panels */}
        <div className="max-h-48 overflow-y-auto">
          {/* Text Tool */}
          {activeMode === 'text' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 space-y-4"
            >
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newTextOverlay}
                  onChange={(e) => setNewTextOverlay(e.target.value)}
                  placeholder="Enter text..."
                  className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleAddTextOverlay}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add
                </button>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400 text-sm">Size:</span>
                  <input
                    type="range"
                    min="16"
                    max="48"
                    value={textSize}
                    onChange={(e) => setTextSize(parseInt(e.target.value))}
                    className="w-20"
                  />
                  <span className="text-white text-sm">{textSize}px</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-400 text-sm">Color:</span>
                  <input
                    type="color"
                    value={textColor}
                    onChange={(e) => setTextColor(e.target.value)}
                    className="w-8 h-8 rounded border-0 cursor-pointer"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Sticker Tool */}
          {activeMode === 'sticker' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4"
            >
              <div className="grid grid-cols-10 gap-2">
                {POPULAR_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleAddSticker(emoji)}
                    className="text-2xl p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Filter Tool */}
          {activeMode === 'filter' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4"
            >
              <div className="flex space-x-2 overflow-x-auto">
                {FILTERS.map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setSelectedFilter(filter.value)}
                    className={`flex-shrink-0 text-center ${
                      selectedFilter === filter.value 
                        ? 'text-blue-400' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <div className="w-16 h-16 mb-1 rounded-lg overflow-hidden">
                      <img 
                        src={currentMedia?.url || ''}
                        alt={filter.name}
                        className="w-full h-full object-cover"
                        style={{ filter: filter.style }}
                      />
                    </div>
                    <span className="text-xs">{filter.name}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};