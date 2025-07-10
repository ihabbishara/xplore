import React from 'react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const textVariants = cva('', {
  variants: {
    variant: {
      h1: 'text-5xl font-display font-bold tracking-tight',
      h2: 'text-4xl font-display font-semibold tracking-tight',
      h3: 'text-3xl font-display font-semibold',
      h4: 'text-2xl font-display font-medium',
      h5: 'text-xl font-sans font-medium',
      h6: 'text-lg font-sans font-medium',
      'body-large': 'text-lg font-sans',
      body: 'text-base font-sans',
      'body-small': 'text-sm font-sans',
      caption: 'text-xs font-sans text-muted-foreground',
      code: 'font-mono text-sm bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded',
    },
    color: {
      default: 'text-foreground',
      primary: 'text-primary-500 dark:text-primary-400',
      secondary: 'text-gray-600 dark:text-gray-400',
      success: 'text-success-600 dark:text-success-400',
      error: 'text-error',
      warning: 'text-warning',
      muted: 'text-muted-foreground',
    },
    align: {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
      justify: 'text-justify',
    },
    weight: {
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
    gradient: {
      none: '',
      primary: 'bg-gradient-to-r from-primary-400 via-accent-ocean to-accent-forest bg-clip-text text-transparent',
      sunset: 'bg-gradient-to-r from-accent-sunset via-accent-coral to-accent-sand bg-clip-text text-transparent',
      ocean: 'bg-gradient-to-r from-accent-ocean via-primary-500 to-accent-forest bg-clip-text text-transparent',
    },
  },
  defaultVariants: {
    variant: 'body',
    color: 'default',
    align: 'left',
    gradient: 'none',
  },
})

type TextElement = 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'p' | 'span' | 'div' | 'code'

export interface TextProps
  extends Omit<React.HTMLAttributes<HTMLElement>, 'color'>,
    VariantProps<typeof textVariants> {
  as?: TextElement
  children: React.ReactNode
}

const variantElementMap: Record<NonNullable<TextProps['variant']>, TextElement> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  h5: 'h5',
  h6: 'h6',
  'body-large': 'p',
  body: 'p',
  'body-small': 'p',
  caption: 'span',
  code: 'code',
}

export function Text({
  className,
  variant = 'body',
  color,
  align,
  weight,
  gradient,
  as,
  children,
  ...props
}: TextProps) {
  const Component = as || variantElementMap[variant || 'body'] || 'p'

  return (
    <Component
      className={cn(
        textVariants({ variant, color, align, weight, gradient }),
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}