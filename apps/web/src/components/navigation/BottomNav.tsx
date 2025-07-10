'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Map, Compass, BookOpen, BarChart3 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: <Home className="h-5 w-5" />
  },
  {
    href: '/locations',
    label: 'Explore',
    icon: <Map className="h-5 w-5" />
  },
  {
    href: '/wildlife',
    label: 'Wildlife',
    icon: <Compass className="h-5 w-5" />
  },
  {
    href: '/journal',
    label: 'Journal',
    icon: <BookOpen className="h-5 w-5" />
  },
  {
    href: '/analytics',
    label: 'Stats',
    icon: <BarChart3 className="h-5 w-5" />
  }
]

export function BottomNav() {
  const pathname = usePathname()
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 md:hidden">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
                          (item.href !== '/dashboard' && pathname.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs transition-colors",
                isActive
                  ? "text-primary-600 dark:text-primary-400"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              )}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}