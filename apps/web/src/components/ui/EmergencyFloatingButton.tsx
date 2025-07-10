'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, AlertTriangle, X, Shield, MapPin, Info } from 'lucide-react'
import { Button } from './Button'
import { Card } from './Card'
import { Text } from './Text'
import { Badge } from './Badge'
import { Modal } from './Modal'
import { useRouter } from 'next/navigation'
import { useAppDispatch } from '@/store/hooks'
import { toggleSOS, setActiveProtocol } from '@/domains/emergency/store/emergencySlice'

// Workaround for React version compatibility
const MotionDiv = motion.div as any

interface EmergencyFloatingButtonProps {
  showOnPages?: string[]
  className?: string
}

export function EmergencyFloatingButton({ 
  showOnPages = ['/wildlife', '/trips', '/locations'],
  className = '' 
}: EmergencyFloatingButtonProps) {
  const [showEmergencyModal, setShowEmergencyModal] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const router = useRouter()
  const dispatch = useAppDispatch()
  
  // Check if we should show the button on current page
  const pathname = typeof window !== 'undefined' ? window.location.pathname : ''
  const shouldShow = showOnPages.some(page => pathname.startsWith(page))
  
  if (!shouldShow) return null
  
  const emergencyOptions = [
    {
      id: 'wildlife_encounter',
      label: 'Wildlife Encounter',
      icon: <Shield className="h-5 w-5" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
    {
      id: 'medical_emergency',
      label: 'Medical Emergency',
      icon: <Phone className="h-5 w-5" />,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      id: 'lost_or_stranded',
      label: 'Lost or Stranded',
      icon: <MapPin className="h-5 w-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      id: 'general_emergency',
      label: 'General Emergency',
      icon: <AlertTriangle className="h-5 w-5" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
  ]
  
  const handleEmergencySelect = (type: string) => {
    dispatch(toggleSOS(true))
    setShowEmergencyModal(false)
    setIsExpanded(false)
    // Navigate to emergency page
    router.push(`/emergency?type=${type}`)
  }
  
  return (
    <>
      {/* Floating Button */}
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <AnimatePresence>
          {isExpanded && (
            <MotionDiv
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="absolute bottom-16 right-0 w-64"
            >
              <Card className="p-4 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <Text className="font-medium">Emergency Options</Text>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  {emergencyOptions.map(option => (
                    <button
                      key={option.id}
                      onClick={() => handleEmergencySelect(option.id)}
                      className="w-full p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-3"
                    >
                      <div className={`p-2 rounded-lg ${option.bgColor}`}>
                        <div className={option.color}>{option.icon}</div>
                      </div>
                      <Text className="text-sm font-medium">{option.label}</Text>
                    </button>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <button
                    onClick={() => {
                      setIsExpanded(false)
                      setShowEmergencyModal(true)
                    }}
                    className="w-full flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <Info className="h-4 w-4" />
                    <Text className="text-sm">Emergency Guidelines</Text>
                  </button>
                </div>
              </Card>
            </MotionDiv>
          )}
        </AnimatePresence>
        
        <MotionDiv
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`
              relative w-14 h-14 rounded-full shadow-lg
              bg-red-600 hover:bg-red-700 text-white
              flex items-center justify-center
              transition-all duration-200
              ${isExpanded ? 'ring-4 ring-red-200' : ''}
            `}
          >
            <AlertTriangle className="h-6 w-6" />
            
            {/* Pulse animation */}
            {!isExpanded && (
              <div className="absolute inset-0 rounded-full bg-red-600 animate-ping opacity-20" />
            )}
          </button>
        </MotionDiv>
        
        {/* SOS Text */}
        <div className="text-center mt-2">
          <Text className="text-xs font-medium text-red-600">SOS</Text>
        </div>
      </div>
      
      {/* Emergency Guidelines Modal */}
      <Modal
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        title="Emergency Guidelines"
        className="max-w-lg"
      >
        <div className="space-y-4">
          <Card className="p-4 bg-red-50 dark:bg-red-900/20">
            <Text className="font-medium mb-2">When to Use Emergency SOS</Text>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>• Life-threatening situations</li>
              <li>• Dangerous wildlife encounters</li>
              <li>• Medical emergencies requiring immediate help</li>
              <li>• Lost in wilderness with no cell signal</li>
              <li>• Natural disasters or severe weather</li>
            </ul>
          </Card>
          
          <div className="space-y-3">
            <Text className="font-medium">Emergency Contacts</Text>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <Text className="font-medium">Emergency Services</Text>
                  <Text className="text-sm text-gray-500">Police, Fire, Medical</Text>
                </div>
                <Badge variant="destructive">911</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <Text className="font-medium">Park Rangers</Text>
                  <Text className="text-sm text-gray-500">Wildlife & wilderness help</Text>
                </div>
                <Badge variant="secondary">1-888-PARK</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <Text className="font-medium">Poison Control</Text>
                  <Text className="text-sm text-gray-500">Bites, stings, plants</Text>
                </div>
                <Badge variant="secondary">1-800-222-1222</Badge>
              </div>
            </div>
          </div>
          
          <Card className="p-4 bg-blue-50 dark:bg-blue-900/20">
            <Text className="text-sm">
              <strong>Tip:</strong> Save emergency numbers in your phone before traveling. 
              Download offline maps and emergency guides for areas with no signal.
            </Text>
          </Card>
          
          <Button
            variant="default"
            onClick={() => setShowEmergencyModal(false)}
            className="w-full"
          >
            Close
          </Button>
        </div>
      </Modal>
    </>
  )
}