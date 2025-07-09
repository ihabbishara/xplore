import React from 'react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import { ClimateData } from '../types/weather.types'

interface ClimateChartProps {
  climateData: ClimateData[]
  unit?: 'C' | 'F'
  chartType?: 'temperature' | 'precipitation' | 'comfort'
  className?: string
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const ClimateChart: React.FC<ClimateChartProps> = ({
  climateData,
  unit = 'C',
  chartType = 'temperature',
  className = ''
}) => {
  const chartData = climateData.map(data => ({
    month: monthNames[data.month - 1],
    avgTemp: unit === 'F' ? data.avgTemp * 9/5 + 32 : data.avgTemp,
    minTemp: unit === 'F' ? data.avgMinTemp * 9/5 + 32 : data.avgMinTemp,
    maxTemp: unit === 'F' ? data.avgMaxTemp * 9/5 + 32 : data.avgMaxTemp,
    precipitation: data.avgPrecipitation,
    rainyDays: data.avgRainyDays,
    sunnyDays: data.avgSunnyDays,
    comfortScore: data.comfortScore,
    humidity: data.avgHumidity
  }))

  const renderTemperatureChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip
          contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
          formatter={(value: number) => `${value.toFixed(1)}°${unit}`}
        />
        <Legend />
        <Area
          type="monotone"
          dataKey="maxTemp"
          stroke="#ef4444"
          fill="#fee2e2"
          name="Max Temp"
        />
        <Area
          type="monotone"
          dataKey="avgTemp"
          stroke="#f59e0b"
          fill="#fef3c7"
          name="Avg Temp"
        />
        <Area
          type="monotone"
          dataKey="minTemp"
          stroke="#3b82f6"
          fill="#dbeafe"
          name="Min Temp"
        />
      </AreaChart>
    </ResponsiveContainer>
  )

  const renderPrecipitationChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip
          contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
        />
        <Legend />
        <Bar dataKey="precipitation" fill="#3b82f6" name="Precipitation (mm)" />
        <Bar dataKey="rainyDays" fill="#60a5fa" name="Rainy Days" />
      </BarChart>
    </ResponsiveContainer>
  )

  const renderComfortChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" stroke="#6b7280" />
        <YAxis stroke="#6b7280" domain={[0, 100]} />
        <Tooltip
          contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb' }}
          formatter={(value: number) => `${value.toFixed(0)}%`}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="comfortScore"
          stroke="#10b981"
          strokeWidth={3}
          name="Comfort Score"
          dot={{ r: 4 }}
        />
        <Line
          type="monotone"
          dataKey="humidity"
          stroke="#6366f1"
          strokeWidth={2}
          name="Humidity"
          strokeDasharray="5 5"
        />
      </LineChart>
    </ResponsiveContainer>
  )

  const charts = {
    temperature: renderTemperatureChart,
    precipitation: renderPrecipitationChart,
    comfort: renderComfortChart
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm p-4 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {chartType === 'temperature' && 'Temperature Patterns'}
          {chartType === 'precipitation' && 'Precipitation & Rainy Days'}
          {chartType === 'comfort' && 'Comfort Score & Humidity'}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Historical monthly averages
        </p>
      </div>

      {charts[chartType]()}

      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div className="text-center">
          <div className="text-gray-500">Best Month</div>
          <div className="font-semibold">
            {monthNames[
              climateData.reduce((best, current) => 
                current.comfortScore > climateData[best].comfortScore 
                  ? current.month - 1 
                  : best, 
                0
              )
            ]}
          </div>
        </div>
        <div className="text-center">
          <div className="text-gray-500">Avg Comfort</div>
          <div className="font-semibold">
            {Math.round(
              climateData.reduce((sum, data) => sum + data.comfortScore, 0) / climateData.length
            )}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-gray-500">Yearly Rain</div>
          <div className="font-semibold">
            {Math.round(
              climateData.reduce((sum, data) => sum + data.avgPrecipitation, 0)
            )}mm
          </div>
        </div>
      </div>
    </div>
  )
}