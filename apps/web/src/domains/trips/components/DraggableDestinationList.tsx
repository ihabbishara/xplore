'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { LocationSearchResult } from '@xplore/shared';

// Workaround for React version compatibility
const MotionDiv = motion.div as any;

interface DraggableDestinationItemProps {
  destination: LocationSearchResult;
  index: number;
  isSelected?: boolean;
  onDestinationClick?: (destination: LocationSearchResult) => void;
  onRemoveDestination?: (destination: LocationSearchResult) => void;
}

const DraggableDestinationItem: React.FC<DraggableDestinationItemProps> = ({
  destination,
  index,
  isSelected,
  onDestinationClick,
  onRemoveDestination,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: destination.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isFirst = index === 0;
  const isLast = index === undefined; // Will be set properly by parent

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center p-4 bg-white rounded-lg shadow-sm border transition-all duration-200 ${
        isDragging ? 'opacity-50 shadow-lg scale-105' : ''
      } ${isSelected ? 'ring-2 ring-primary-200 bg-primary-50' : 'hover:shadow-md'}`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing mr-3"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      </div>

      {/* Destination Info */}
      <div
        className="flex-1 cursor-pointer"
        onClick={() => onDestinationClick?.(destination)}
      >
        <div className="flex items-center">
          {/* Order Badge */}
          <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${
            isFirst ? 'bg-green-500 text-white' :
            isLast ? 'bg-red-500 text-white' :
            'bg-primary-500 text-white'
          }`}>
            {index + 1}
          </div>

          {/* Location Details */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 truncate">
              {destination.name}
            </h4>
            <p className="text-sm text-gray-500 truncate">
              {destination.city && destination.city !== destination.name ? `${destination.city}, ` : ''}
              {destination.country}
            </p>
          </div>

          {/* Location Type Badge */}
          <div className="flex-shrink-0 ml-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              destination.type === 'city' ? 'bg-blue-100 text-blue-800' :
              destination.type === 'region' ? 'bg-green-100 text-green-800' :
              destination.type === 'poi' ? 'bg-purple-100 text-purple-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {destination.type}
            </span>
          </div>
        </div>
      </div>

      {/* Remove Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemoveDestination?.(destination);
        }}
        className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100 ml-2"
        title="Remove destination"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};

interface DraggableDestinationListProps {
  destinations: LocationSearchResult[];
  selectedDestination?: LocationSearchResult | null;
  onDestinationClick?: (destination: LocationSearchResult) => void;
  onDestinationReorder?: (destinations: LocationSearchResult[]) => void;
  onRemoveDestination?: (destination: LocationSearchResult) => void;
  className?: string;
}

export const DraggableDestinationList: React.FC<DraggableDestinationListProps> = ({
  destinations,
  selectedDestination,
  onDestinationClick,
  onDestinationReorder,
  onRemoveDestination,
  className = '',
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = destinations.findIndex((dest) => dest.id === active.id);
      const newIndex = destinations.findIndex((dest) => dest.id === over?.id);

      const reorderedDestinations = arrayMove(destinations, oldIndex, newIndex);
      onDestinationReorder?.(reorderedDestinations);
    }
  };

  if (destinations.length === 0) {
    return (
      <div className={`p-8 text-center ${className}`}>
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No destinations yet</h3>
        <p className="text-sm text-gray-500">
          Search for destinations above to start planning your trip
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={destinations.map(d => d.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {destinations.map((destination, index) => (
              <DraggableDestinationItem
                key={destination.id}
                destination={destination}
                index={index}
                isSelected={selectedDestination?.id === destination.id}
                onDestinationClick={onDestinationClick}
                onRemoveDestination={onRemoveDestination}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
};