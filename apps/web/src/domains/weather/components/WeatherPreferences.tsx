import React, { useState } from 'react'
import { WeatherPreferences as WeatherPreferencesType } from '../types/weather.types'

interface WeatherPreferencesProps {
  preferences: WeatherPreferencesType | null
  onUpdate: (preferences: Partial<WeatherPreferencesType>) => Promise<void>
  loading?: boolean
  className?: string
}

export const WeatherPreferences: React.FC<WeatherPreferencesProps> = ({
  preferences,
  onUpdate,
  loading = false,
  className = ''
}) => {
  const [formData, setFormData] = useState<Partial<WeatherPreferencesType>>(
    preferences || {
      idealTempMin: 18,
      idealTempMax: 26,
      avoidRain: true,
      avoidSnow: true,
      avoidHighHumidity: false,
      avoidStrongWind: false,
      preferSunny: true,
      alertsEnabled: true,
      alertTypes: ['severe', 'extreme']
    }
  )

  const [isSaving, setIsSaving] = useState(false)

  const handleChange = (field: keyof WeatherPreferencesType, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onUpdate(formData)
    } catch (error) {
      console.error('Failed to save preferences:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const alertTypeOptions = [
    { value: 'minor', label: 'Minor' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'severe', label: 'Severe' },
    { value: 'extreme', label: 'Extreme' }
  ]

  return (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Weather Preferences</h3>

      <div className="space-y-6">
        {/* Temperature Range */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Ideal Temperature Range</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="tempMin" className="block text-sm text-gray-700 mb-1">
                Minimum (°C)
              </label>
              <input
                type="number"
                id="tempMin"
                value={formData.idealTempMin || 18}
                onChange={(e) => handleChange('idealTempMin', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="-50"
                max="50"
              />
            </div>
            <div>
              <label htmlFor="tempMax" className="block text-sm text-gray-700 mb-1">
                Maximum (°C)
              </label>
              <input
                type="number"
                id="tempMax"
                value={formData.idealTempMax || 26}
                onChange={(e) => handleChange('idealTempMax', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="-50"
                max="50"
              />
            </div>
          </div>
        </div>

        {/* Weather Conditions */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Weather Conditions</h4>
          <div className="space-y-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.avoidRain || false}
                onChange={(e) => handleChange('avoidRain', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Avoid rainy weather</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.avoidSnow || false}
                onChange={(e) => handleChange('avoidSnow', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Avoid snowy weather</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.avoidHighHumidity || false}
                onChange={(e) => handleChange('avoidHighHumidity', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Avoid high humidity (&gt;70%)</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.avoidStrongWind || false}
                onChange={(e) => handleChange('avoidStrongWind', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Avoid strong winds (&gt;20 km/h)</span>
            </label>
            
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.preferSunny || false}
                onChange={(e) => handleChange('preferSunny', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Prefer sunny days</span>
            </label>
          </div>
        </div>

        {/* Weather Alerts */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Weather Alerts</h4>
          <label className="flex items-center mb-3">
            <input
              type="checkbox"
              checked={formData.alertsEnabled || false}
              onChange={(e) => handleChange('alertsEnabled', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Enable weather alerts</span>
          </label>
          
          {formData.alertsEnabled && (
            <div className="ml-6 space-y-2">
              <div className="text-sm text-gray-700 mb-2">Alert severity levels:</div>
              {alertTypeOptions.map(option => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.alertTypes?.includes(option.value) || false}
                    onChange={(e) => {
                      const types = formData.alertTypes || []
                      if (e.target.checked) {
                        handleChange('alertTypes', [...types, option.value])
                      } else {
                        handleChange('alertTypes', types.filter(t => t !== option.value))
                      }
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-600">{option.label}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={loading || isSaving}
            className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
              loading || isSaving
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>
    </div>
  )
}