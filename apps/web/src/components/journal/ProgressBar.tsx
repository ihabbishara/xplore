'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

interface ProgressBarProps {
  steps: string[];
  current: string;
  className?: string;
}

export const ProgressBar = ({ steps, current, className = '' }: ProgressBarProps) => {
  const currentIndex = steps.findIndex(step => step.toLowerCase() === current.toLowerCase());
  
  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      {steps.map((step, index) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
              index < currentIndex 
                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg' 
                : index === currentIndex
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg animate-pulse'
                : 'bg-gray-700 text-gray-400 border-2 border-gray-600'
            }`}
          >
            {index < currentIndex ? (
              <Check className="w-5 h-5" />
            ) : (
              <span>
                {index + 1}
              </span>
            )}
          </div>
          
          {index < steps.length - 1 && (
            <div
              className={`w-16 h-1 rounded-full mx-2 transition-all duration-300 ${
                index < currentIndex 
                  ? 'bg-gradient-to-r from-green-500 to-green-600' 
                  : 'bg-gray-700'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default ProgressBar;