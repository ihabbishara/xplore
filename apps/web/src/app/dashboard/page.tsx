'use client'

import React, { useState } from 'react'
import { HeroSection } from '@/components/dashboard/HeroSection'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { MainContent } from '@/components/dashboard/MainContent'
import { PullToRefresh } from '@/components/ui'
import { useToast } from '@/components/ui'

export default function DashboardPage() {
  const { toast } = useToast()
  
  const handleRefresh = async () => {
    // Simulate refresh - in real app, this would reload data
    await new Promise(resolve => setTimeout(resolve, 1500))
    toast({
      title: 'Dashboard refreshed',
      description: 'All data has been updated',
    })
  }
  
  return (
    <PullToRefresh onRefresh={handleRefresh} className="min-h-screen">
      <div className="min-h-screen">
        {/* Hero Section */}
        <HeroSection />
        
        {/* Quick Actions */}
        <section className="relative z-10 -mt-8 sm:-mt-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <QuickActions />
          </div>
        </section>
        
        {/* Main Content */}
        <section className="py-12 sm:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <MainContent />
          </div>
        </section>
      </div>
    </PullToRefresh>
  )
}