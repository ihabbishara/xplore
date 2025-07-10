import Link from 'next/link'
import { redirect } from 'next/navigation'

export default function HomePage() {
  // TODO: Check if user is authenticated and redirect to dashboard
  // For now, we'll show the landing page, but in production this should check auth status
  
  // Temporary redirect to dashboard for development
  if (process.env.NODE_ENV === 'development') {
    redirect('/dashboard')
  }
  
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between text-sm">
        <h1 className="text-5xl font-bold text-center mb-8">
          Welcome to Xplore
        </h1>
        <p className="text-xl text-center text-gray-600 mb-12">
          Your comprehensive exploration companion for travelers, adventurers, and relocators
        </p>
        
        <div className="flex gap-4 justify-center">
          <Link
            href="/dashboard"
            className="rounded-lg bg-blue-500 px-6 py-3 text-white hover:bg-blue-600 transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/auth/login"
            className="rounded-lg border border-gray-300 px-6 py-3 hover:border-gray-400 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    </main>
  )
}