import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]',
  {
    variants: {
      variant: {
        primary:
          'bg-primary-500 text-white shadow-sm hover:bg-primary-600 hover:shadow-md focus-visible:ring-primary-500 dark:bg-primary-600 dark:hover:bg-primary-700',
        secondary:
          'bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200 hover:shadow-md focus-visible:ring-gray-500 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700',
        success:
          'bg-success-500 text-white shadow-sm hover:bg-success-600 hover:shadow-md focus-visible:ring-success-500',
        danger:
          'bg-error text-white shadow-sm hover:bg-red-600 hover:shadow-md focus-visible:ring-error',
        warning:
          'bg-warning text-white shadow-sm hover:bg-amber-600 hover:shadow-md focus-visible:ring-warning',
        ghost:
          'text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-500 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-gray-100',
        outline:
          'border-2 border-gray-300 bg-transparent text-gray-700 hover:border-gray-400 hover:bg-gray-50 focus-visible:ring-gray-500 dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-500 dark:hover:bg-gray-800',
        link:
          'text-primary-500 underline-offset-4 hover:underline focus-visible:ring-primary-500 dark:text-primary-400',
      },
      size: {
        xs: 'h-7 px-2.5 text-xs rounded-md gap-1',
        sm: 'h-8 px-3 text-sm rounded-md gap-1.5',
        md: 'h-10 px-4 text-base rounded-lg gap-2',
        lg: 'h-12 px-6 text-lg rounded-lg gap-2.5',
        xl: 'h-14 px-8 text-xl rounded-xl gap-3',
      },
      fullWidth: {
        true: 'w-full',
      },
      loading: {
        true: 'cursor-wait',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      loading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          buttonVariants({ variant, size, fullWidth, loading, className })
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="inline-flex">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="inline-flex">{rightIcon}</span>}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'