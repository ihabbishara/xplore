'use client'

import { useSelector, useDispatch } from 'react-redux'
import { RootState } from '@/store/store'

export default function TestReduxPage() {
  const count = useSelector((state: RootState) => state.counter.value)
  const dispatch = useDispatch()

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-3xl font-bold mb-8">Redux Test Page</h1>
      <div className="flex items-center gap-4">
        <button
          onClick={() => dispatch({ type: 'counter/decrement' })}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          -
        </button>
        <span className="text-2xl font-semibold">{count}</span>
        <button
          onClick={() => dispatch({ type: 'counter/increment' })}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          +
        </button>
      </div>
    </div>
  )
}