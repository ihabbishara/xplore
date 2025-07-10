'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';

// Workaround for React version compatibility
const MotionDiv = motion.div as any;
const MotionAnimatePresence = AnimatePresence as any;

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  snapPoints?: number[]; // [0.2, 0.5, 0.9] - percentages of screen height
  defaultSnap?: number;
  className?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  open,
  onClose,
  children,
  snapPoints = [0.2, 0.5, 0.9],
  defaultSnap = 0.5,
  className = ''
}) => {
  const [currentSnap, setCurrentSnap] = useState(defaultSnap);
  const [isDragging, setIsDragging] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setCurrentSnap(defaultSnap);
    }
  }, [open, defaultSnap]);

  const handleDragEnd = (event: any, info: PanInfo) => {
    setIsDragging(false);
    
    const velocity = info.velocity.y;
    const offset = info.offset.y;
    
    // If dragging down with velocity or significant offset, close or snap to lower position
    if (velocity > 500 || offset > 200) {
      const currentIndex = snapPoints.indexOf(currentSnap);
      if (currentIndex === 0 || velocity > 1000) {
        onClose();
      } else {
        setCurrentSnap(snapPoints[currentIndex - 1]);
      }
    }
    // If dragging up, snap to higher position
    else if (velocity < -500 || offset < -200) {
      const currentIndex = snapPoints.indexOf(currentSnap);
      if (currentIndex < snapPoints.length - 1) {
        setCurrentSnap(snapPoints[currentIndex + 1]);
      }
    }
    // Otherwise, snap back to current position
  };

  const handleBackdropClick = () => {
    onClose();
  };

  const sheetHeight = `${currentSnap * 100}%`;

  return (
    <MotionAnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <MotionDiv
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
            onClick={handleBackdropClick}
          />

          {/* Bottom Sheet */}
          <MotionDiv
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: `${100 - (currentSnap * 100)}%` }}
            exit={{ y: '100%' }}
            transition={{ 
              type: "spring", 
              damping: 30, 
              stiffness: 300,
              duration: isDragging ? 0 : 0.4
            }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.1, bottom: 0.3 }}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={handleDragEnd}
            className={`fixed inset-x-0 bottom-0 z-50 ${className}`}
            style={{ height: '100vh' }}
          >
            <div className="relative h-full bg-white rounded-t-3xl shadow-2xl overflow-hidden">
              {/* Drag Handle */}
              <div className="absolute top-0 left-0 right-0 z-10 flex justify-center pt-3 pb-2">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </div>

              {/* Header with Snap Indicators */}
              <div className="absolute top-6 right-4 z-10 flex space-x-1">
                {snapPoints.map((point, index) => (
                  <button
                    key={point}
                    onClick={() => setCurrentSnap(point)}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      currentSnap === point ? 'bg-primary-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>

              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Content */}
              <div className="h-full pt-12 overflow-y-auto overscroll-contain">
                <div className="min-h-full">
                  {children}
                </div>
              </div>
            </div>
          </MotionDiv>
        </>
      )}
    </MotionAnimatePresence>
  );
};