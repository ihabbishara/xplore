'use client';

import React from 'react';
import { motion } from 'framer-motion';

// Workaround for React version compatibility
const MotionDiv = motion.div as any;

interface TripSummaryProps {
  duration: number;
  distance: number;
  budget: number;
  currency?: string;
}

export const TripSummary: React.FC<TripSummaryProps> = ({
  duration,
  distance,
  budget,
  currency = 'USD'
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const formatDistance = (km: number) => {
    return `${km.toLocaleString()} km`;
  };

  const summaryItems = [
    {
      label: 'Duration',
      value: `${duration} day${duration !== 1 ? 's' : ''}`,
      icon: (
        <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      label: 'Distance',
      value: formatDistance(distance),
      icon: (
        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
    {
      label: 'Budget',
      value: formatCurrency(budget),
      icon: (
        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      )
    }
  ];

  return (
    <div className="p-6 bg-gray-50 border-t border-gray-200">
      <MotionDiv
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Trip Summary</h3>
        
        <div className="space-y-4">
          {summaryItems.map((item, index) => (
            <MotionDiv
              key={item.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 + (index * 0.1) }}
              className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm"
            >
              <div className="flex items-center">
                {item.icon}
                <span className="ml-3 text-sm font-medium text-gray-700">{item.label}</span>
              </div>
              <span className="font-semibold text-gray-900">{item.value}</span>
            </MotionDiv>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-3">
          <button className="w-full py-3 px-4 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-colors">
            Save Trip
          </button>
          <button className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors">
            Share Trip
          </button>
        </div>
      </MotionDiv>
    </div>
  );
};