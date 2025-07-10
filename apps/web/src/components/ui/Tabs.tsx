import React, { createContext, useContext, useState } from 'react'
import { cn } from '@/lib/utils'
import { cva, type VariantProps } from 'class-variance-authority'

const tabsListVariants = cva(
  'inline-flex items-center justify-center rounded-md p-1 text-muted-foreground',
  {
    variants: {
      variant: {
        default: 'bg-muted',
        outline: 'border border-border',
        underline: 'border-b border-border',
        pills: 'bg-transparent',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

const tabsTriggerVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'rounded-sm data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
        outline: 'rounded-md border border-transparent data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:shadow-sm',
        underline: 'rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary',
        pills: 'rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
  variant: 'default' | 'outline' | 'underline' | 'pills'
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined)

function useTabsContext() {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs component')
  }
  return context
}

export interface TabsProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tabsListVariants> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

export function Tabs({
  value,
  defaultValue,
  onValueChange,
  variant = 'default',
  children,
  className,
  ...props
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue || '')
  const isControlled = value !== undefined
  const currentValue = isControlled ? value : internalValue

  const handleValueChange = (newValue: string) => {
    if (!isControlled) {
      setInternalValue(newValue)
    }
    onValueChange?.(newValue)
  }

  return (
    <TabsContext.Provider
      value={{
        value: currentValue,
        onValueChange: handleValueChange,
        variant: variant || 'default',
      }}
    >
      <div className={cn('', className)} {...props}>
        {children}
      </div>
    </TabsContext.Provider>
  )
}

export interface TabsListProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function TabsList({
  className,
  children,
  ...props
}: TabsListProps) {
  const { variant } = useTabsContext()
  
  return (
    <div
      className={cn(
        tabsListVariants({ variant }),
        variant === 'underline' && 'bg-transparent p-0',
        variant === 'pills' && 'bg-gray-100 dark:bg-gray-800',
        className
      )}
      role="tablist"
      {...props}
    >
      {children}
    </div>
  )
}

export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
  children: React.ReactNode
}

export function TabsTrigger({
  value,
  className,
  children,
  ...props
}: TabsTriggerProps) {
  const { value: selectedValue, onValueChange, variant } = useTabsContext()
  const isSelected = selectedValue === value

  return (
    <button
      className={cn(
        tabsTriggerVariants({ variant }),
        className
      )}
      data-state={isSelected ? 'active' : 'inactive'}
      role="tab"
      aria-selected={isSelected}
      onClick={() => onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  )
}

export interface TabsContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  children: React.ReactNode
}

export function TabsContent({
  value,
  className,
  children,
  ...props
}: TabsContentProps) {
  const { value: selectedValue } = useTabsContext()
  const isSelected = selectedValue === value

  if (!isSelected) {
    return null
  }

  return (
    <div
      className={cn(
        'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 animate-fade-in',
        className
      )}
      role="tabpanel"
      {...props}
    >
      {children}
    </div>
  )
}