import { FC } from 'react'
import { clsx } from 'clsx'
import { AlertCircle } from 'lucide-react'

interface ErrorMessageProps {
  message: string
  variant?: 'error' | 'warning'
  className?: string
}

export const ErrorMessage: FC<ErrorMessageProps> = ({ 
  message, 
  variant = 'error', 
  className 
}) => {
  const variantClasses = {
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  }

  return (
    <div 
      className={clsx(
        'rounded-md border p-4 flex items-center gap-2',
        variantClasses[variant],
        className
      )}
    >
      <AlertCircle className="w-5 h-5 flex-shrink-0" />
      <p className="text-sm">{message}</p>
    </div>
  )
}