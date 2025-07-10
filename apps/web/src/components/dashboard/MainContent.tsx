'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { MapboxMapWidget } from './MapboxMapWidget'
import { ActivityFeed } from './ActivityFeed'
import { TripsCarousel } from './TripsCarousel'
import { WeatherWidget } from './WeatherWidget'
import { AnalyticsSummary } from './AnalyticsSummary'
import { WildlifeActivityWidget } from './WildlifeActivityWidget'

// Workaround for React version compatibility
const MotionDiv = motion.div as any

export function MainContent() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 120
      }
    }
  }

  return (
    <MotionDiv 
      className="space-y-8 lg:space-y-12"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* World Map and Activity Feed */}
      <MotionDiv 
        className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8"
        variants={itemVariants}
      >
        <MotionDiv 
          className="lg:col-span-2"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", damping: 20 }}
        >
          <MapboxMapWidget />
        </MotionDiv>
        <MotionDiv 
          className="lg:col-span-1"
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", damping: 20 }}
        >
          <ActivityFeed />
        </MotionDiv>
      </MotionDiv>

      {/* Upcoming Trips Carousel */}
      <MotionDiv variants={itemVariants}>
        <TripsCarousel />
      </MotionDiv>

      {/* Weather and Analytics */}
      <MotionDiv 
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8"
        variants={itemVariants}
      >
        <MotionDiv
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", damping: 20 }}
        >
          <WeatherWidget />
        </MotionDiv>
        <MotionDiv
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", damping: 20 }}
        >
          <AnalyticsSummary />
        </MotionDiv>
      </MotionDiv>

      {/* Wildlife Activity */}
      <MotionDiv 
        variants={itemVariants}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", damping: 20 }}
      >
        <WildlifeActivityWidget />
      </MotionDiv>
    </MotionDiv>
  )
}