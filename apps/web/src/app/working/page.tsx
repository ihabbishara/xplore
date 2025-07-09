import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function WorkingPage() {
  return (
    <div className={inter.className}>
      <h1>Working Page</h1>
      <p>This page should work without any issues.</p>
    </div>
  )
}