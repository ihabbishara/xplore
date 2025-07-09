'use client'

import { useAppSelector } from '@/lib/hooks/redux'

export default function TestReduxPage() {
  const authState = useAppSelector((state) => state?.auth)
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Redux State Test</h1>
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-semibold mb-2">Auth State:</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(authState, null, 2)}
        </pre>
      </div>
    </div>
  )
}
EOF < /dev/null