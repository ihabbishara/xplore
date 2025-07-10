'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'

interface User {
  name: string
  email: string
  avatar?: string
}

// Mock user - replace with actual auth context
const mockUser: User = {
  name: 'John Doe',
  email: 'john@example.com',
  avatar: undefined
}

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const menuItems = [
    { href: '/profile', label: 'Profile', icon: '👤' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
    { href: '/help', label: 'Help & Support', icon: '❓' },
    { divider: true },
    { href: '/auth/logout', label: 'Sign Out', icon: '🚪' },
  ]

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted transition-colors"
      >
        <Avatar
          src={mockUser.avatar}
          fallback={mockUser.name}
          size="sm"
        />
        <div className="hidden lg:block text-left">
          <p className="text-sm font-medium text-foreground">{mockUser.name}</p>
          <p className="text-xs text-muted-foreground">{mockUser.email}</p>
        </div>
        <svg
          className={cn(
            'w-4 h-4 text-muted-foreground transition-transform',
            isOpen && 'rotate-180'
          )}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-background border border-border rounded-lg shadow-lg py-1 animate-fade-in-down">
          {menuItems.map((item, index) => {
            if ('divider' in item) {
              return <div key={index} className="border-t border-border my-1" />
            }

            return (
              <button
                key={item.href}
                onClick={() => {
                  router.push(item.href)
                  setIsOpen(false)
                }}
                className="flex items-center w-full text-left px-4 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <span className="mr-3 text-base">{item.icon}</span>
                {item.label}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}