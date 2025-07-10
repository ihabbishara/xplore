import React, { forwardRef } from 'react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const textareaVariants = cva(
  'w-full rounded-lg border bg-background px-3 py-2 text-base ring-offset-background transition-all duration-200 resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-muted-foreground',
  {
    variants: {
      variant: {
        default: 'border-input hover:border-gray-400 dark:hover:border-gray-500',
        error: 'border-error focus-visible:ring-error',
        success: 'border-success-500 focus-visible:ring-success-500',
      },
      size: {
        sm: 'min-h-[80px] px-3 py-2 text-sm',
        md: 'min-h-[100px] px-3 py-2 text-base',
        lg: 'min-h-[120px] px-4 py-3 text-lg',
      },
      resize: {
        none: 'resize-none',
        vertical: 'resize-y',
        horizontal: 'resize-x',
        both: 'resize',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      resize: 'vertical',
    },
  }
)

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaVariants> {
  error?: boolean
  success?: boolean
  showCount?: boolean
  maxLength?: number
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      variant,
      size,
      resize,
      error,
      success,
      showCount,
      maxLength,
      value,
      ...props
    },
    ref
  ) => {
    const computedVariant = error ? 'error' : success ? 'success' : variant
    const currentLength = typeof value === 'string' ? value.length : 0

    return (
      <div className="relative">
        <textarea
          className={cn(
            textareaVariants({ variant: computedVariant, size, resize }),
            showCount && 'pb-6',
            className
          )}
          ref={ref}
          value={value}
          maxLength={maxLength}
          {...props}
        />
        {showCount && (
          <div className="absolute bottom-2 right-3 text-xs text-muted-foreground">
            {currentLength}
            {maxLength && `/${maxLength}`}
          </div>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'