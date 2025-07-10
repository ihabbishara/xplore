import React, { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const tooltipVariants = cva(
  'absolute z-50 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-md shadow-sm transition-opacity duration-200 dark:bg-gray-700',
  {
    variants: {
      variant: {
        default: 'bg-gray-900 text-white dark:bg-gray-700',
        light: 'bg-white text-gray-900 border border-gray-200 shadow-lg dark:bg-gray-800 dark:text-gray-100 dark:border-gray-600',
        error: 'bg-red-600 text-white',
        warning: 'bg-amber-600 text-white',
        success: 'bg-green-600 text-white',
        info: 'bg-blue-600 text-white',
      },
      size: {
        sm: 'px-2 py-1 text-xs',
        md: 'px-3 py-2 text-sm',
        lg: 'px-4 py-3 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

type TooltipPosition = 'top' | 'bottom' | 'left' | 'right'

export interface TooltipProps
  extends VariantProps<typeof tooltipVariants> {
  content: React.ReactNode
  children: React.ReactNode
  position?: TooltipPosition
  disabled?: boolean
  delayShow?: number
  delayHide?: number
  className?: string
}

export function Tooltip({
  content,
  children,
  position = 'top',
  variant,
  size,
  disabled = false,
  delayShow = 500,
  delayHide = 0,
  className,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState<TooltipPosition>(position)
  const triggerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const showTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const showTooltip = () => {
    if (disabled) return
    
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current)
      hideTimeoutRef.current = null
    }
    
    showTimeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delayShow)
  }

  const hideTooltip = () => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current)
      showTimeoutRef.current = null
    }
    
    hideTimeoutRef.current = setTimeout(() => {
      setIsVisible(false)
    }, delayHide)
  }

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()
      const viewport = {
        width: window.innerWidth,
        height: window.innerHeight,
      }

      let newPosition = position

      switch (position) {
        case 'top':
          if (triggerRect.top - tooltipRect.height < 0) {
            newPosition = 'bottom'
          }
          break
        case 'bottom':
          if (triggerRect.bottom + tooltipRect.height > viewport.height) {
            newPosition = 'top'
          }
          break
        case 'left':
          if (triggerRect.left - tooltipRect.width < 0) {
            newPosition = 'right'
          }
          break
        case 'right':
          if (triggerRect.right + tooltipRect.width > viewport.width) {
            newPosition = 'left'
          }
          break
      }

      setTooltipPosition(newPosition)
    }
  }, [isVisible, position])

  const getTooltipStyle = (): React.CSSProperties => {
    if (!triggerRef.current) return {}

    const offset = 8

    switch (tooltipPosition) {
      case 'top':
        return {
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginBottom: `${offset}px`,
        }
      case 'bottom':
        return {
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          marginTop: `${offset}px`,
        }
      case 'left':
        return {
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginRight: `${offset}px`,
        }
      case 'right':
        return {
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          marginLeft: `${offset}px`,
        }
      default:
        return {}
    }
  }

  const getArrowStyle = (): React.CSSProperties => {
    const arrowSize = 6
    
    switch (tooltipPosition) {
      case 'top':
        return {
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid transparent`,
          borderTop: `${arrowSize}px solid currentColor`,
        }
      case 'bottom':
        return {
          bottom: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          borderLeft: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid currentColor`,
        }
      case 'left':
        return {
          left: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid transparent`,
          borderLeft: `${arrowSize}px solid currentColor`,
        }
      case 'right':
        return {
          right: '100%',
          top: '50%',
          transform: 'translateY(-50%)',
          borderTop: `${arrowSize}px solid transparent`,
          borderBottom: `${arrowSize}px solid transparent`,
          borderRight: `${arrowSize}px solid currentColor`,
        }
      default:
        return {}
    }
  }

  return (
    <div
      ref={triggerRef}
      className="relative inline-block"
      onMouseEnter={showTooltip}
      onMouseLeave={hideTooltip}
      onFocus={showTooltip}
      onBlur={hideTooltip}
    >
      {children}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={cn(
            tooltipVariants({ variant, size }),
            'animate-fade-in',
            className
          )}
          style={getTooltipStyle()}
          role="tooltip"
        >
          {content}
          <div
            className="absolute w-0 h-0"
            style={getArrowStyle()}
          />
        </div>
      )}
    </div>
  )
}