'use client'

import { Provider } from 'react-redux'
import { simpleStore } from '@/store/simple'

export function ProvidersTest({ children }: { children: any }) {
  return <Provider store={simpleStore}>{children}</Provider>
}