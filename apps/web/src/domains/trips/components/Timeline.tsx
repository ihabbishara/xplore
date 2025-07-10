'use client';

import React from 'react';
import { motion } from 'framer-motion';

// Workaround for React version compatibility
const MotionDiv = motion.div as any;

export interface TripDay {
  id: string;
  date: Date;
  destinations: string[];
  activities: string[];
}

interface TimelineProps {
  days: TripDay[];
  selectedDay?: string | null;
  onDayClick?: (dayId: string) => void;
  onAddDay?: () => void;
  onAddActivity?: (dayId: string, activity: string) => void;
  onRemoveActivity?: (dayId: string, activityIndex: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({
  days,
  selectedDay,
  onDayClick,
  onAddDay,
  onAddActivity,
  onRemoveActivity
}) => {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleAddActivity = (dayId: string) => {
    const activity = prompt('Enter activity name:');
    if (activity && onAddActivity) {
      onAddActivity(dayId, activity);
    }
  };

  return (
    <div className="p-6">
      {days.map((day, index) => (
        <MotionDiv
          key={day.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
          className={`mb-6 cursor-pointer transition-all duration-200 ${
            selectedDay === day.id ? 'transform scale-105' : ''
          }`}
          onClick={() => onDayClick?.(day.id)}
        >
          {/* Day Header */}
          <div className="flex items-center mb-4">
            <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-200 ${
              selectedDay === day.id 
                ? 'bg-primary-500 text-white' 
                : 'bg-primary-100 text-primary-700'
            }`}>
              <span className="font-semibold">
                {index + 1}
              </span>
            </div>
            <div className="ml-4 flex-1">
              <h3 className="font-semibold text-gray-900">
                {formatDate(day.date)}
              </h3>
              <p className="text-sm text-gray-600">
                {day.destinations.length} destination{day.destinations.length !== 1 ? 's' : ''}
                {day.activities.length > 0 && ` • ${day.activities.length} activities`}
              </p>
            </div>
            
            {/* Day Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddActivity(day.id);
                }}
                className="p-1 text-gray-400 hover:text-primary-500 transition-colors"
                title="Add activity"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          {/* Activities */}
          <div className="ml-16 space-y-2">
            {day.activities.map((activity, activityIndex) => (
              <MotionDiv
                key={activityIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: (index * 0.1) + (activityIndex * 0.05) }}
                className="group flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="w-2 h-2 bg-primary-400 rounded-full mr-3 flex-shrink-0" />
                <span className="text-sm text-gray-700 flex-1">{activity}</span>
                
                {/* Activity Actions */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveActivity?.(day.id, activityIndex);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-all"
                  title="Remove activity"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </MotionDiv>
            ))}
            
            {/* Add Activity Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAddActivity(day.id);
              }}
              className="w-full p-2 text-sm text-gray-400 hover:text-primary-500 border border-dashed border-gray-300 hover:border-primary-300 rounded-lg transition-colors"
            >
              + Add activity
            </button>
          </div>

          {/* Connector Line */}
          {index < days.length - 1 && (
            <div className="ml-6 mt-4 h-8 w-px bg-gray-200" />
          )}
        </MotionDiv>
      ))}

      {/* Add Day Button */}
      {onAddDay && (
        <MotionDiv
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: days.length * 0.1 }}
        >
          <button
            onClick={onAddDay}
            className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-primary-300 hover:text-primary-600 transition-colors duration-200"
          >
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Day
            </div>
          </button>
        </MotionDiv>
      )}
    </div>
  );
};