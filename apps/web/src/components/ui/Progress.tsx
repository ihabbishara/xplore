import React from 'react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const progressVariants = cva(
  'relative h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800',
  {
    variants: {
      size: {
        sm: 'h-1',
        md: 'h-2',
        lg: 'h-3',
        xl: 'h-4',
      },
      variant: {
        default: '',
        success: '',
        error: '',
        warning: '',
      },
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    },
  }
)

const progressBarVariants = cva(
  'h-full w-full flex-1 transition-all duration-300 ease-in-out',
  {
    variants: {
      variant: {
        default: 'bg-primary-500',
        success: 'bg-success-500',
        error: 'bg-error',
        warning: 'bg-warning',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

export interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants> {
  value?: number
  max?: number
  label?: string
  showValue?: boolean
  animated?: boolean
}

export function Progress({
  className,
  value = 0,
  max = 100,
  size,
  variant,
  label,
  showValue = false,
  animated = false,
  ...props
}: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className="w-full">
      {(label || showValue) && (
        <div className="mb-1 flex items-center justify-between text-sm">
          {label && <span className="text-foreground">{label}</span>}
          {showValue && (
            <span className="text-muted-foreground">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(progressVariants({ size, variant }), className)}
        {...props}
      >
        <div
          className={cn(
            progressBarVariants({ variant }),
            animated && 'animate-pulse'
          )}
          style={{
            transform: `translateX(-${100 - percentage}%)`,
          }}
        />
      </div>
    </div>
  )
}

// Circular Progress Component
export interface CircularProgressProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
  size?: number
  strokeWidth?: number
  variant?: 'default' | 'success' | 'error' | 'warning'
  showValue?: boolean
  animated?: boolean
}

export function CircularProgress({
  className,
  value = 0,
  max = 100,
  size = 40,
  strokeWidth = 2,
  variant = 'default',
  showValue = false,
  animated = false,
  ...props
}: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  const colorMap = {
    default: '#0EA5E9',
    success: '#10B981',
    error: '#EF4444',
    warning: '#F59E0B',
  }

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      {...props}
    >
      <svg
        className={cn('transform -rotate-90', animated && 'animate-spin')}
        width={size}
        height={size}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200 dark:text-gray-800"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colorMap[variant]}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-300 ease-in-out"
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-foreground">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
    </div>
  )
}