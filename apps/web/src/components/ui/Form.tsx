import React from 'react'
import { cn } from '@/lib/utils'

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode
  spacing?: 'sm' | 'md' | 'lg'
}

export function Form({ 
  children, 
  spacing = 'md', 
  className, 
  ...props 
}: FormProps) {
  const spacingClasses = {
    sm: 'space-y-3',
    md: 'space-y-4',
    lg: 'space-y-6',
  }

  return (
    <form 
      className={cn('w-full', spacingClasses[spacing], className)} 
      noValidate
      {...props}
    >
      {children}
    </form>
  )
}

export interface FormSectionProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  children: React.ReactNode
}

export function FormSection({ 
  title, 
  description, 
  children, 
  className, 
  ...props 
}: FormSectionProps) {
  return (
    <div className={cn('space-y-4', className)} {...props}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-lg font-display font-medium text-foreground">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          )}
        </div>
      )}
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

export interface FormActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'left' | 'center' | 'right'
  children: React.ReactNode
}

export function FormActions({ 
  align = 'right', 
  children, 
  className, 
  ...props 
}: FormActionsProps) {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  }

  return (
    <div 
      className={cn(
        'flex items-center gap-3 pt-4 border-t border-border',
        alignClasses[align],
        className
      )} 
      {...props}
    >
      {children}
    </div>
  )
}