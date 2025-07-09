'use client'

import { Provider } from 'react-redux'
import { store } from '@/store'
import { AuthProvider } from '@/lib/firebase/AuthContext'
import { OfflineIndicator } from '@/components/offline/OfflineIndicator'

export function Providers({ children }: { children: any }) {
  return (
    <Provider store={store}>
      <AuthProvider>
        {children}
        <OfflineIndicator />
      </AuthProvider>
    </Provider>
  )
}