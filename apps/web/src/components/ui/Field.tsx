import React from 'react'
import { cn } from '@/lib/utils'

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string
  error?: string
  hint?: string
  required?: boolean
  children: React.ReactNode
  htmlFor?: string
}

export function Field({
  label,
  error,
  hint,
  required,
  children,
  htmlFor,
  className,
  ...props
}: FieldProps) {
  const fieldId = htmlFor || `field-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className={cn('space-y-2', className)} {...props}>
      {label && (
        <label
          htmlFor={fieldId}
          className={cn(
            'block text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
            error ? 'text-error' : 'text-foreground'
          )}
        >
          {label}
          {required && <span className="ml-1 text-error">*</span>}
        </label>
      )}
      
      <div className="relative">
        {React.isValidElement(children) &&
          React.cloneElement(children as React.ReactElement<any>, {
            id: fieldId,
            error: !!error,
            'aria-describedby': error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined,
            'aria-invalid': !!error,
            'aria-required': required,
          })}
      </div>
      
      {error && (
        <p
          id={`${fieldId}-error`}
          className="text-sm text-error flex items-center gap-1"
          role="alert"
          aria-live="polite"
        >
          <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          {error}
        </p>
      )}
      
      {hint && !error && (
        <p
          id={`${fieldId}-hint`}
          className="text-sm text-muted-foreground"
        >
          {hint}
        </p>
      )}
    </div>
  )
}