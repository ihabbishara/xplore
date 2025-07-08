'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAppSelector } from '@/lib/hooks/redux'

export default function OnboardingPage() {
  const router = useRouter()
  const user = useAppSelector((state) => state.auth.user)

  useEffect(() => {
    if (!user) {
      router.push('/auth/login')
    }
  }, [user, router])

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {user.firstName}!</h1>
          <p className="mt-2 text-sm text-gray-600">
            Thank you for creating your account. Let's set up your profile.
          </p>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Profile Setup</h2>
          <p className="text-sm text-gray-600 mb-4">
            Complete your profile to get the most out of Xplore.
          </p>
          
          <button
            onClick={() => router.push('/locations')}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Continue to Explore
          </button>
        </div>
      </div>
    </div>
  )
}