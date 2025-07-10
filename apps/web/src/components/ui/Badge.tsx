import React from 'react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:
          'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200',
        secondary:
          'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
        success:
          'bg-success-100 text-success-800 dark:bg-success-900 dark:text-success-200',
        warning:
          'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
        error:
          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
        outline:
          'border-2 border-current bg-transparent',
      },
      size: {
        sm: 'px-2 py-0.5 text-xs',
        md: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean
}

export function Badge({
  className,
  variant,
  size,
  dot,
  children,
  ...props
}: BadgeProps) {
  return (
    <div
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'mr-1.5 h-1.5 w-1.5 rounded-full bg-current',
            size === 'sm' && 'mr-1 h-1 w-1'
          )}
        />
      )}
      {children}
    </div>
  )
}