'use client'

import { Provider } from 'react-redux'
import { store } from '@/store'
import { AuthProvider } from '@/lib/firebase/AuthContext'
import { OfflineIndicator } from '@/components/offline/OfflineIndicator'
import { ThemeProvider, ToastProvider, EmergencyFloatingButton } from '@/components/ui'
import { BottomNav } from '@/components/navigation/BottomNav'

export function Providers({ children }: { children: any }) {
  return (
    <Provider store={store}>
      <ThemeProvider defaultTheme="system" storageKey="xplore-theme">
        <ToastProvider>
          <AuthProvider>
            {children}
            <OfflineIndicator />
            <EmergencyFloatingButton />
            <BottomNav />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </Provider>
  )
}