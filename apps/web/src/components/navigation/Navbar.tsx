'use client'

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { ThemeToggle } from '@/components/ui'
import { UserMenu } from './UserMenu'
import { MobileMenu } from './MobileMenu'

// Workaround for React version compatibility
const MotionNav = motion.nav as any
const MotionAnimatePresence = AnimatePresence as any

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 20
      setScrolled(isScrolled)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/locations', label: 'Locations' },
    { href: '/wildlife', label: 'Wildlife' },
    { href: '/trips', label: 'Trips' },
    { href: '/journal', label: 'Journal' },
    { href: '/analytics', label: 'Analytics' },
  ]

  return (
    <>
      <MotionNav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 hidden md:block',
          scrolled
            ? 'bg-background/95 backdrop-blur-md border-b border-border shadow-sm'
            : 'bg-transparent'
        )}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", damping: 20, stiffness: 100 }}
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center space-x-2 font-display font-bold text-xl text-foreground hover:text-primary transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-ocean rounded-lg flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
              <span>Xplore</span>
            </button>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => router.push(link.href)}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-primary',
                    pathname === link.href
                      ? 'text-primary'
                      : scrolled
                      ? 'text-foreground'
                      : 'text-white hover:text-white/80'
                  )}
                >
                  {link.label}
                </button>
              ))}
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <div className="hidden md:block">
                <UserMenu />
              </div>
              
              {/* Mobile menu button */}
              <button
                className="md:hidden p-2 rounded-md hover:bg-muted transition-colors"
                onClick={() => setMobileMenuOpen(true)}
              >
                <svg
                  className={cn(
                    'w-6 h-6',
                    scrolled ? 'text-foreground' : 'text-white'
                  )}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </MotionNav>

      {/* Mobile Menu */}
      <MotionAnimatePresence>
        {mobileMenuOpen && (
          <MobileMenu
            isOpen={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
            navLinks={navLinks}
          />
        )}
      </MotionAnimatePresence>
    </>
  )
}