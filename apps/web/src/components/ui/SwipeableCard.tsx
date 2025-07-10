'use client'

import React, { useRef, useState } from 'react'
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SwipeableCardProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  className?: string
  threshold?: number
}

export function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  className,
  threshold = 100
}: SwipeableCardProps) {
  const [exitX, setExitX] = useState(0)
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.5, 1, 1, 1, 0.5])
  
  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > threshold && onSwipeRight) {
      setExitX(300)
      onSwipeRight()
    } else if (info.offset.x < -threshold && onSwipeLeft) {
      setExitX(-300)
      onSwipeLeft()
    }
  }
  
  return (
    <motion.div
      style={{ x, rotate, opacity }}
      drag="x"
      dragElastic={0.5}
      dragConstraints={{ left: 0, right: 0 }}
      onDragEnd={handleDragEnd}
      animate={{ x: exitX }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn("cursor-grab active:cursor-grabbing", className)}
    >
      {children}
    </motion.div>
  )
}