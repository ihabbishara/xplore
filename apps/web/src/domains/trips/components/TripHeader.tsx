'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

// Workaround for React version compatibility
const MotionDiv = motion.div as any;

export interface Trip {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  destinations: any[];
}

interface TripHeaderProps {
  trip: Trip;
  onTripUpdate?: (trip: Trip) => void;
}

export const TripHeader: React.FC<TripHeaderProps> = ({
  trip,
  onTripUpdate
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(trip.title);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDayDuration = () => {
    if (!trip.startDate || !trip.endDate) return 0;
    const diffTime = Math.abs(trip.endDate.getTime() - trip.startDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handleTitleEdit = () => {
    if (isEditing) {
      // Save changes
      if (onTripUpdate) {
        onTripUpdate({
          ...trip,
          title: editedTitle
        });
      }
    }
    setIsEditing(!isEditing);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTitleEdit();
    } else if (e.key === 'Escape') {
      setEditedTitle(trip.title);
      setIsEditing(false);
    }
  };

  return (
    <div className="p-6 border-b border-gray-200">
      <MotionDiv
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-start justify-between mb-2">
          {isEditing ? (
            <input
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={handleTitleEdit}
              className="text-2xl font-bold text-gray-900 bg-transparent border-b-2 border-primary-500 outline-none flex-1 mr-2"
              autoFocus
            />
          ) : (
            <h1 
              className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-primary-600 transition-colors flex-1"
              onClick={handleTitleEdit}
            >
              {trip.title}
            </h1>
          )}
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleTitleEdit}
              className="p-2 text-gray-400 hover:text-primary-500 transition-colors"
              title={isEditing ? 'Save' : 'Edit trip name'}
            >
              {isEditing ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        <div className="space-y-1">
          <p className="text-sm text-gray-600">
            {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
          </p>
          <div className="flex items-center space-x-4 text-xs text-gray-500">
            <span>{getDayDuration()} days</span>
            <span>•</span>
            <span>{trip.destinations.length} destinations</span>
          </div>
        </div>
      </MotionDiv>
    </div>
  );
};