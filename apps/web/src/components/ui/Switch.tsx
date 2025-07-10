import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface SwitchProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, label, size = 'md', id, ...props }, ref) => {
    const switchId = id || `switch-${Math.random().toString(36).substr(2, 9)}`

    const sizeClasses = {
      sm: {
        switch: 'h-4 w-8',
        thumb: 'h-3 w-3 translate-x-0 peer-checked:translate-x-4',
      },
      md: {
        switch: 'h-6 w-11',
        thumb: 'h-5 w-5 translate-x-0 peer-checked:translate-x-5',
      },
      lg: {
        switch: 'h-7 w-14',
        thumb: 'h-6 w-6 translate-x-0 peer-checked:translate-x-7',
      },
    }

    return (
      <div className="flex items-center">
        <label htmlFor={switchId} className="relative inline-block">
          <input
            type="checkbox"
            id={switchId}
            ref={ref}
            className="peer sr-only"
            {...props}
          />
          <div
            className={cn(
              'block rounded-full bg-gray-300 transition-colors duration-200',
              'peer-checked:bg-primary-500',
              'peer-disabled:cursor-not-allowed peer-disabled:opacity-50',
              'peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2',
              'dark:bg-gray-600',
              sizeClasses[size].switch,
              className
            )}
          />
          <div
            className={cn(
              'absolute left-0.5 top-0.5 rounded-full bg-white transition-transform duration-200',
              'shadow-sm',
              sizeClasses[size].thumb
            )}
          />
        </label>
        {label && (
          <span
            className={cn(
              'ml-3 text-sm font-medium leading-none',
              'peer-disabled:cursor-not-allowed peer-disabled:opacity-50'
            )}
          >
            {label}
          </span>
        )}
      </div>
    )
  }
)

Switch.displayName = 'Switch'