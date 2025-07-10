import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const datePickerVariants = cva(
  'w-full rounded-lg border bg-background px-3 py-2 text-base ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'border-input hover:border-gray-400 dark:hover:border-gray-500',
        error: 'border-error focus-visible:ring-error',
        success: 'border-success-500 focus-visible:ring-success-500',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        md: 'h-10 px-3 text-base',
        lg: 'h-12 px-4 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
)

export interface DatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'>,
    VariantProps<typeof datePickerVariants> {
  error?: boolean
  success?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      className,
      variant,
      size,
      error,
      success,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const computedVariant = error ? 'error' : success ? 'success' : variant

    const defaultRightIcon = (
      <svg
        className="h-4 w-4 text-muted-foreground"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    )

    if (leftIcon || rightIcon) {
      return (
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          <input
            type="date"
            className={cn(
              datePickerVariants({ variant: computedVariant, size, className }),
              leftIcon && 'pl-10',
              (rightIcon || !leftIcon) && 'pr-10'
            )}
            ref={ref}
            {...props}
          />
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {rightIcon || defaultRightIcon}
          </div>
        </div>
      )
    }

    return (
      <div className="relative">
        <input
          type="date"
          className={cn(
            datePickerVariants({ variant: computedVariant, size, className }),
            'pr-10'
          )}
          ref={ref}
          {...props}
        />
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {defaultRightIcon}
        </div>
      </div>
    )
  }
)

DatePicker.displayName = 'DatePicker'

export interface TimePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'>,
    VariantProps<typeof datePickerVariants> {
  error?: boolean
  success?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const TimePicker = forwardRef<HTMLInputElement, TimePickerProps>(
  (
    {
      className,
      variant,
      size,
      error,
      success,
      leftIcon,
      rightIcon,
      ...props
    },
    ref
  ) => {
    const computedVariant = error ? 'error' : success ? 'success' : variant

    const defaultRightIcon = (
      <svg
        className="h-4 w-4 text-muted-foreground"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    )

    if (leftIcon || rightIcon) {
      return (
        <div className="relative">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </div>
          )}
          <input
            type="time"
            className={cn(
              datePickerVariants({ variant: computedVariant, size, className }),
              leftIcon && 'pl-10',
              (rightIcon || !leftIcon) && 'pr-10'
            )}
            ref={ref}
            {...props}
          />
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {rightIcon || defaultRightIcon}
          </div>
        </div>
      )
    }

    return (
      <div className="relative">
        <input
          type="time"
          className={cn(
            datePickerVariants({ variant: computedVariant, size, className }),
            'pr-10'
          )}
          ref={ref}
          {...props}
        />
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {defaultRightIcon}
        </div>
      </div>
    )
  }
)

TimePicker.displayName = 'TimePicker'