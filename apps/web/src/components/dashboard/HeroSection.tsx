'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Text, Input } from '@/components/ui'
import { cn } from '@/lib/utils'

// Workaround for React version compatibility
const MotionDiv = motion.div as any
const MotionButton = motion.button as any
const MotionSvg = motion.svg as any

function getTimeBasedGreeting() {
  const hour = new Date().getHours()
  
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function getSeasonalBackground() {
  const month = new Date().getMonth()
  
  // Spring (Mar-May)
  if (month >= 2 && month <= 4) {
    return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&h=1080&fit=crop&crop=center'
  }
  // Summer (Jun-Aug)
  if (month >= 5 && month <= 7) {
    return 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?w=1920&h=1080&fit=crop&crop=center'
  }
  // Fall (Sep-Nov)
  if (month >= 8 && month <= 10) {
    return 'https://images.unsplash.com/photo-1476231682828-37e571bc172f?w=1920&h=1080&fit=crop&crop=center'
  }
  // Winter (Dec-Feb)
  return 'https://images.unsplash.com/photo-1517906418606-91f03aee4b52?w=1920&h=1080&fit=crop&crop=center'
}

export function HeroSection() {
  const [greeting, setGreeting] = useState('')
  const [backgroundImage, setBackgroundImage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    setGreeting(getTimeBasedGreeting())
    setBackgroundImage(getSeasonalBackground())
    
    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Mock user name - replace with actual auth context
  const userName = 'Alex'

  return (
    <section className="relative h-[90vh] md:h-[70vh] overflow-hidden">
      {/* Parallax Background */}
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-100"
        style={{
          backgroundImage: `url(${backgroundImage})`,
          transform: `translateY(${scrollY * 0.5}px)`,
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-40" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Greeting */}
          <MotionDiv 
            className="mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Text
                variant="caption"
                className="text-white/80 uppercase tracking-wider font-medium mb-2"
              >
                {greeting}
              </Text>
            </MotionDiv>
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <Text
                variant="h1"
                className="text-white mb-4 drop-shadow-lg text-3xl sm:text-4xl md:text-5xl lg:text-6xl"
                as="h1"
              >
                Where to next, {userName}?
              </Text>
            </MotionDiv>
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <Text
                variant="body-large"
                className="text-white/90 max-w-2xl mx-auto text-lg sm:text-xl px-4 sm:px-0"
              >
                Discover new destinations, plan amazing trips, and make informed relocation decisions with your AI-powered exploration companion.
              </Text>
            </MotionDiv>
          </MotionDiv>

          {/* Search Bar */}
          <MotionDiv 
            className="w-full max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 1.0 }}
          >
            <MotionDiv 
              className="relative"
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", damping: 20 }}
            >
              <Input
                placeholder="Search for destinations, cities, or countries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="lg"
                className="bg-white/95 backdrop-blur-sm border-0 shadow-lg text-base sm:text-lg pr-12"
                leftIcon={
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                }
              />
              <MotionButton 
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </MotionButton>
            </MotionDiv>
          </MotionDiv>

          {/* Quick Search Suggestions */}
          <MotionDiv 
            className="mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.2 }}
          >
            <Text variant="body-small" className="text-white/70 mb-3">
              Popular searches:
            </Text>
            <MotionDiv 
              className="flex flex-wrap justify-center gap-2 px-4 sm:px-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.4 }}
            >
              {['Paris, France', 'Tokyo, Japan', 'New York, USA', 'Bali, Indonesia'].map((suggestion, index) => (
                <MotionButton
                  key={suggestion}
                  className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm hover:bg-white/30 transition-colors"
                  onClick={() => setSearchQuery(suggestion)}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: 1.6 + index * 0.1,
                    type: "spring",
                    damping: 20
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {suggestion}
                </MotionButton>
              ))}
            </MotionDiv>
          </MotionDiv>
        </div>
      </div>

      {/* Scroll Indicator */}
      <MotionDiv 
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 2.0 }}
      >
        <MotionSvg
          className="w-6 h-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          animate={{ 
            y: [0, 10, 0],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </MotionSvg>
      </MotionDiv>
    </section>
  )
}