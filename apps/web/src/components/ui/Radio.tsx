import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface RadioProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: boolean
}

export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const radioId = id || `radio-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className="flex items-center">
        <input
          type="radio"
          id={radioId}
          ref={ref}
          className={cn(
            'peer h-4 w-4 shrink-0 rounded-full border border-input bg-background ring-offset-background transition-all duration-200',
            'checked:border-primary-500 checked:bg-primary-500',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'hover:border-gray-400 dark:hover:border-gray-500',
            error && 'border-error focus-visible:ring-error',
            className
          )}
          {...props}
        />
        {label && (
          <label
            htmlFor={radioId}
            className={cn(
              'ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
              error && 'text-error'
            )}
          >
            {label}
          </label>
        )}
      </div>
    )
  }
)

Radio.displayName = 'Radio'