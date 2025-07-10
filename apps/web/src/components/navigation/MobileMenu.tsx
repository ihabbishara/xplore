'use client'

import React, { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'

// Workaround for React version compatibility
const MotionDiv = motion.div as any

interface NavLink {
  href: string
  label: string
}

interface MobileMenuProps {
  isOpen: boolean
  onClose: () => void
  navLinks: NavLink[]
}

// Mock user - replace with actual auth context
const mockUser = {
  name: 'John Doe',
  email: 'john@example.com',
  avatar: undefined
}

export function MobileMenu({ isOpen, onClose, navLinks }: MobileMenuProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLinkClick = (href: string) => {
    router.push(href)
    onClose()
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const menuItems = [
    { href: '/profile', label: 'Profile', icon: '👤' },
    { href: '/settings', label: 'Settings', icon: '⚙️' },
    { href: '/help', label: 'Help & Support', icon: '❓' },
    { href: '/auth/logout', label: 'Sign Out', icon: '🚪' },
  ]

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <MotionDiv
        className="fixed inset-0 bg-black bg-opacity-50"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
      />
      
      {/* Menu Panel */}
      <MotionDiv 
        className="fixed right-0 top-0 h-full w-80 max-w-full bg-background shadow-xl"
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-display font-semibold text-foreground">Menu</h2>
            <button
              onClick={onClose}
              className="p-2 rounded-md hover:bg-muted transition-colors"
            >
              <svg
                className="w-6 h-6 text-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center space-x-3">
              <Avatar
                src={mockUser.avatar}
                fallback={mockUser.name}
                size="md"
              />
              <div>
                <p className="text-sm font-medium text-foreground">{mockUser.name}</p>
                <p className="text-xs text-muted-foreground">{mockUser.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 overflow-y-auto py-4">
            <nav className="space-y-1 px-4">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleLinkClick(link.href)}
                  className={cn(
                    'block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors',
                    pathname === link.href
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  )}
                >
                  {link.label}
                </button>
              ))}
            </nav>

            {/* Divider */}
            <div className="border-t border-border mx-4 my-4" />

            {/* Menu Items */}
            <nav className="space-y-1 px-4">
              {menuItems.map((item) => (
                <button
                  key={item.href}
                  onClick={() => handleLinkClick(item.href)}
                  className="flex items-center w-full text-left px-3 py-2 rounded-md text-base font-medium text-foreground hover:bg-muted transition-colors"
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </MotionDiv>
    </div>
  )
}