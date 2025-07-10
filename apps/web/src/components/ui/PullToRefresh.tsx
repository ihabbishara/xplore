'use client'

import React, { useRef, useState, useCallback, useEffect } from 'react'
import { motion, useMotionValue, useTransform } from 'framer-motion'
import { RefreshCw } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh: () => Promise<void>
  className?: string
  threshold?: number
}

export function PullToRefresh({
  children,
  onRefresh,
  className,
  threshold = 60
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isPulling, setIsPulling] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const y = useMotionValue(0)
  const pullProgress = useTransform(y, [0, threshold], [0, 1])
  const pullOpacity = useTransform(y, [0, threshold / 2], [0, 1])
  const pullScale = useTransform(y, [0, threshold], [0.8, 1])
  
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      setIsPulling(true)
    }
  }, [])
  
  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isPulling || isRefreshing) return
    
    const touch = e.touches[0]
    const deltaY = touch.clientY - (window as any).pullStartY
    
    if (deltaY > 0 && containerRef.current?.scrollTop === 0) {
      e.preventDefault()
      y.set(Math.min(deltaY * 0.5, threshold * 1.5))
    }
  }, [isPulling, isRefreshing, y, threshold])
  
  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return
    
    setIsPulling(false)
    
    if (y.get() >= threshold && !isRefreshing) {
      setIsRefreshing(true)
      y.set(threshold)
      
      try {
        await onRefresh()
      } finally {
        setIsRefreshing(false)
        y.set(0)
      }
    } else {
      y.set(0)
    }
  }, [isPulling, y, threshold, isRefreshing, onRefresh])
  
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    
    const handleStart = (e: TouchEvent) => {
      (window as any).pullStartY = e.touches[0].clientY
      handleTouchStart(e)
    }
    
    container.addEventListener('touchstart', handleStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })
    
    return () => {
      container.removeEventListener('touchstart', handleStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleTouchStart, handleTouchMove, handleTouchEnd])
  
  return (
    <div className={cn("relative h-full overflow-hidden", className)}>
      <motion.div
        className="absolute top-0 left-0 right-0 flex items-center justify-center py-4 z-10"
        style={{ y, opacity: pullOpacity, scale: pullScale }}
      >
        <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
          <motion.div
            animate={{ rotate: isRefreshing ? 360 : 0 }}
            transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: "linear" }}
          >
            <RefreshCw className="h-5 w-5" />
          </motion.div>
          <span className="text-sm font-medium">
            {isRefreshing ? 'Refreshing...' : 'Pull to refresh'}
          </span>
        </div>
      </motion.div>
      
      <motion.div
        ref={containerRef}
        className="h-full overflow-auto"
        style={{ y }}
      >
        {children}
      </motion.div>
    </div>
  )
}