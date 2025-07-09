'use client'

import { Provider } from 'react-redux'
import { simpleStore } from '@/store/simple'

export function ProvidersTest({ children }: { children: React.ReactNode }) {
  return <Provider store={simpleStore}>{children}</Provider>
}