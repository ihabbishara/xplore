'use client'

import { useEffect } from 'react'

export default function DebugPage() {
  useEffect(() => {
    console.log('Debug page mounted')
    console.log('Environment:', {
      apiUrl: process.env.NEXT_PUBLIC_API_URL,
      mapboxToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN,
    })
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Page</h1>
      <div className="space-y-2">
        <p>API URL: {process.env.NEXT_PUBLIC_API_URL}</p>
        <p>Mapbox Token: {process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'Not set'}</p>
        <p>Node Environment: {process.env.NODE_ENV}</p>
      </div>
    </div>
  )
}