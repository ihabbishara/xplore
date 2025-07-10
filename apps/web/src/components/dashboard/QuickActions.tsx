'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Card, Text } from '@/components/ui'
import { cn } from '@/lib/utils'

// Workaround for React version compatibility
const MotionDiv = motion.div as any
const MotionSvg = motion.svg as any

interface QuickAction {
  title: string
  description: string
  icon: React.ReactNode
  href: string
  color: string
  bgColor: string
}

const quickActions: QuickAction[] = [
  {
    title: 'Plan Trip',
    description: 'Create multi-day routes and itineraries',
    icon: (
      <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
        />
      </svg>
    ),
    href: '/trips/new',
    color: 'text-primary-600',
    bgColor: 'bg-primary-100',
  },
  {
    title: 'Find Locations',
    description: 'Discover and save amazing places',
    icon: (
      <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
    href: '/locations',
    color: 'text-success-600',
    bgColor: 'bg-success-100',
  },
  {
    title: 'Wildlife',
    description: 'Track and discover wildlife',
    icon: (
      <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
        />
      </svg>
    ),
    href: '/wildlife',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  {
    title: 'Journal',
    description: 'Document your exploration journey',
    icon: (
      <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
    href: '/journal',
    color: 'text-accent-sunset',
    bgColor: 'bg-orange-100',
  },
  {
    title: 'Checklists',
    description: 'Organize tasks and preparations',
    icon: (
      <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
    href: '/checklists',
    color: 'text-accent-forest',
    bgColor: 'bg-green-100',
  },
]

export function QuickActions() {
  const router = useRouter()

  const handleActionClick = (href: string) => {
    router.push(href)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      scale: 0.9
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300
      }
    }
  }

  return (
    <MotionDiv 
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {quickActions.map((action, index) => (
        <MotionDiv key={action.title} variants={itemVariants}>
          <Card
            className={cn(
              'group cursor-pointer bg-white border-0 shadow-md overflow-hidden',
              'hover:shadow-xl transition-all duration-300'
            )}
            padding="lg"
            onClick={() => handleActionClick(action.href)}
          >
            <div className="text-center">
              {/* Icon */}
              <MotionDiv
                className={cn(
                  'inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl mb-4',
                  action.bgColor
                )}
                whileHover={{ 
                  scale: 1.1,
                  rotate: 5,
                  transition: { type: "spring", damping: 15 }
                }}
                whileTap={{ scale: 0.95 }}
              >
                <MotionDiv 
                  className={`${action.color} w-6 h-6 sm:w-8 sm:h-8`}
                  whileHover={{ scale: 1.1 }}
                  transition={{ type: "spring", damping: 20 }}
                >
                  {action.icon}
                </MotionDiv>
              </MotionDiv>

              {/* Content */}
              <Text
                variant="h5"
                className="mb-2 group-hover:text-primary transition-colors"
              >
                {action.title}
              </Text>
              <Text
                variant="body-small"
                color="secondary"
                className="leading-relaxed"
              >
                {action.description}
              </Text>

              {/* Arrow */}
              <MotionDiv 
                className="mt-4"
                initial={{ opacity: 0, y: 10 }}
                whileHover={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="inline-flex items-center text-primary text-sm font-medium">
                  Get started
                  <MotionSvg
                    className="ml-2 w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    whileHover={{ x: 4 }}
                    transition={{ type: "spring", damping: 20 }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </MotionSvg>
                </div>
              </MotionDiv>
            </div>
          </Card>
        </MotionDiv>
      ))}
    </MotionDiv>
  )
}