import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Xplore - Your Exploration Companion',
  description: 'Plan trips, discover locations, and make informed relocation decisions',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}