import React from 'react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const avatarVariants = cva(
  'relative inline-flex shrink-0 overflow-hidden rounded-full ring-2 ring-transparent transition-all duration-200',
  {
    variants: {
      size: {
        xs: 'h-6 w-6 text-xs',
        sm: 'h-8 w-8 text-sm',
        md: 'h-10 w-10 text-base',
        lg: 'h-12 w-12 text-lg',
        xl: 'h-16 w-16 text-xl',
        '2xl': 'h-20 w-20 text-2xl',
      },
      status: {
        online: 'ring-success-500',
        offline: 'ring-gray-400',
        busy: 'ring-error',
        away: 'ring-warning',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
)

const statusDotVariants = cva(
  'absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-gray-950',
  {
    variants: {
      status: {
        online: 'bg-success-500',
        offline: 'bg-gray-400',
        busy: 'bg-error',
        away: 'bg-warning',
      },
      size: {
        xs: 'h-2 w-2 border',
        sm: 'h-2.5 w-2.5',
        md: 'h-3 w-3',
        lg: 'h-3.5 w-3.5',
        xl: 'h-4 w-4',
        '2xl': 'h-5 w-5',
      },
    },
  }
)

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  src?: string
  alt?: string
  fallback?: string
  showStatus?: boolean
}

export function Avatar({
  className,
  size,
  status,
  src,
  alt,
  fallback,
  showStatus = false,
  ...props
}: AvatarProps) {
  const initials = fallback
    ? fallback
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?'

  return (
    <div
      className={cn(
        avatarVariants({ size }),
        status && showStatus && avatarVariants({ status }),
        className
      )}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt || 'Avatar'}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-400 to-primary-600 font-medium text-white">
          {initials}
        </div>
      )}
      {showStatus && status && (
        <span className={statusDotVariants({ status, size })} />
      )}
    </div>
  )
}