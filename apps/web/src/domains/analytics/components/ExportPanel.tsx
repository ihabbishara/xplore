'use client'

import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppDispatch } from '@/store/store'
import { exportAnalyticsData, fetchExportHistory, selectExportHistory } from '../store/analyticsSlice'
import { ExportOptions } from '../types/analytics.types'
import { Button } from '@/components/ui/Button'
import { analyticsService } from '../services/analyticsService'
import { 
  Download,
  FileText,
  Table,
  FileSpreadsheet,
  Code,
  Calendar,
  Filter,
  History,
  Template,
  Settings,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink
} from 'lucide-react'

export function ExportPanel() {
  const dispatch = useDispatch<AppDispatch>()
  const exportHistory = useSelector(selectExportHistory)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [showTemplatesModal, setShowTemplatesModal] = useState(false)
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    sections: ['overview'],
    includeCharts: true,
    includeRawData: false
  })
  const [templates, setTemplates] = useState<any[]>([])
  const [isExporting, setIsExporting] = useState(false)

  useEffect(() => {
    dispatch(fetchExportHistory({ limit: 10 }))
    loadTemplates()
  }, [dispatch])

  const loadTemplates = async () => {
    try {
      const templatesData = await analyticsService.getExportTemplates()
      setTemplates(templatesData)
    } catch (error) {
      console.error('Error loading templates:', error)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await dispatch(exportAnalyticsData(exportOptions))
      setShowExportModal(false)
      dispatch(fetchExportHistory({ limit: 10 }))
    } catch (error) {
      console.error('Export error:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleTemplateExport = async (templateId: string) => {
    setIsExporting(true)
    try {
      await analyticsService.generateReportFromTemplate(templateId)
      setShowTemplatesModal(false)
      dispatch(fetchExportHistory({ limit: 10 }))
    } catch (error) {
      console.error('Template export error:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-500" />
      case 'excel':
        return <FileSpreadsheet className="w-5 h-5 text-green-500" />
      case 'csv':
        return <Table className="w-5 h-5 text-blue-500" />
      case 'json':
        return <Code className="w-5 h-5 text-purple-500" />
      default:
        return <FileText className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    )
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const availableSections = [
    { id: 'overview', label: 'Overview', description: 'Dashboard summary and key metrics' },
    { id: 'metrics', label: 'Location Metrics', description: 'Detailed location analytics' },
    { id: 'sentiment', label: 'Sentiment Analysis', description: 'Sentiment trends and analysis' },
    { id: 'cost_analysis', label: 'Cost Analysis', description: 'Cost trends and breakdowns' },
    { id: 'insights', label: 'Insights', description: 'AI-generated insights and recommendations' },
    { id: 'behavior', label: 'Behavior Patterns', description: 'Detected behavior patterns' },
    { id: 'comparisons', label: 'Comparisons', description: 'Location and decision comparisons' },
    { id: 'trends', label: 'Trends', description: 'Historical trends and patterns' }
  ]

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-500" />
            Export & Reports
          </h3>
          <p className="text-sm text-gray-600">
            Export your analytics data in various formats
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center gap-2"
          >
            <History className="w-4 h-4" />
            History
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowTemplatesModal(true)}
            className="flex items-center gap-2"
          >
            <Template className="w-4 h-4" />
            Templates
          </Button>
          
          <Button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Quick Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Button
          variant="outline"
          onClick={() => {
            setExportOptions({ format: 'pdf', sections: ['overview'], includeCharts: true, includeRawData: false })
            handleExport()
          }}
          className="flex flex-col items-center gap-2 h-auto py-4"
          disabled={isExporting}
        >
          <FileText className="w-6 h-6 text-red-500" />
          <span className="text-sm font-medium">Quick PDF</span>
          <span className="text-xs text-gray-500">Overview report</span>
        </Button>
        
        <Button
          variant="outline"
          onClick={() => {
            setExportOptions({ format: 'excel', sections: ['metrics', 'sentiment', 'cost_analysis'], includeCharts: true, includeRawData: true })
            handleExport()
          }}
          className="flex flex-col items-center gap-2 h-auto py-4"
          disabled={isExporting}
        >
          <FileSpreadsheet className="w-6 h-6 text-green-500" />
          <span className="text-sm font-medium">Excel Report</span>
          <span className="text-xs text-gray-500">Detailed analytics</span>
        </Button>
        
        <Button
          variant="outline"
          onClick={() => {
            setExportOptions({ format: 'csv', sections: ['metrics'], includeCharts: false, includeRawData: true })
            handleExport()
          }}
          className="flex flex-col items-center gap-2 h-auto py-4"
          disabled={isExporting}
        >
          <Table className="w-6 h-6 text-blue-500" />
          <span className="text-sm font-medium">CSV Data</span>
          <span className="text-xs text-gray-500">Raw data export</span>
        </Button>
        
        <Button
          variant="outline"
          onClick={() => {
            setExportOptions({ format: 'json', sections: ['overview', 'metrics', 'insights'], includeCharts: false, includeRawData: true })
            handleExport()
          }}
          className="flex flex-col items-center gap-2 h-auto py-4"
          disabled={isExporting}
        >
          <Code className="w-6 h-6 text-purple-500" />
          <span className="text-sm font-medium">JSON Export</span>
          <span className="text-xs text-gray-500">API format</span>
        </Button>
      </div>

      {/* Recent Exports */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Exports</h4>
        <div className="space-y-2">
          {exportHistory.slice(0, 5).map((export_, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center gap-3">
                {getFormatIcon((export_ as any).format || 'pdf')}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {export_.filename || 'Unknown file'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {export_.generatedAt ? new Date(export_.generatedAt).toLocaleString() : 'Unknown date'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {getStatusIcon(export_.success)}
                  <span className="text-xs text-gray-500">
                    {formatFileSize(0)} {/* Would be actual file size */}
                  </span>
                </div>
                {export_.downloadUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(export_.downloadUrl, '_blank')}
                    className="flex items-center gap-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Download
                  </Button>
                )}
              </div>
            </div>
          ))}
          
          {exportHistory.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Download className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No exports yet</p>
              <p className="text-sm">Create your first export to see it here</p>
            </div>
          )}
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Export Analytics Data</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowExportModal(false)}
                >
                  Close
                </Button>
              </div>

              <div className="space-y-6">
                {/* Format Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Export Format
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {['pdf', 'excel', 'csv', 'json'].map((format) => (
                      <button
                        key={format}
                        onClick={() => setExportOptions({ ...exportOptions, format: format as any })}
                        className={`p-3 border rounded-lg flex items-center gap-2 ${
                          exportOptions.format === format
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {getFormatIcon(format)}
                        <span className="text-sm font-medium capitalize">{format}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sections Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Sections to Include
                  </label>
                  <div className="space-y-2">
                    {availableSections.map((section) => (
                      <label
                        key={section.id}
                        className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={exportOptions.sections.includes(section.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setExportOptions({
                                ...exportOptions,
                                sections: [...exportOptions.sections, section.id]
                              })
                            } else {
                              setExportOptions({
                                ...exportOptions,
                                sections: exportOptions.sections.filter(s => s !== section.id)
                              })
                            }
                          }}
                          className="mt-1"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{section.label}</p>
                          <p className="text-xs text-gray-500">{section.description}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Options */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Export Options
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeCharts}
                        onChange={(e) => setExportOptions({
                          ...exportOptions,
                          includeCharts: e.target.checked
                        })}
                      />
                      <span className="text-sm text-gray-700">Include charts and visualizations</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={exportOptions.includeRawData}
                        onChange={(e) => setExportOptions({
                          ...exportOptions,
                          includeRawData: e.target.checked
                        })}
                      />
                      <span className="text-sm text-gray-700">Include raw data tables</span>
                    </label>
                  </div>
                </div>

                {/* Export Button */}
                <div className="flex justify-end">
                  <Button
                    onClick={handleExport}
                    disabled={isExporting || exportOptions.sections.length === 0}
                    className="flex items-center gap-2"
                  >
                    {isExporting ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Export
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplatesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Export Templates</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTemplatesModal(false)}
                >
                  Close
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((template) => (
                  <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{template.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                      </div>
                      {getFormatIcon(template.format)}
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-xs text-gray-500 mb-2">Includes:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.sections.map((section: string) => (
                          <span
                            key={section}
                            className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                          >
                            {section}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handleTemplateExport(template.id)}
                      disabled={isExporting}
                      className="w-full flex items-center gap-2"
                      size="sm"
                    >
                      <Download className="w-3 h-3" />
                      Use Template
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Export History</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowHistoryModal(false)}
                >
                  Close
                </Button>
              </div>

              <div className="space-y-3">
                {exportHistory.map((export_, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      {getFormatIcon((export_ as any).format || 'pdf')}
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {export_.filename || 'Unknown file'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {export_.generatedAt ? new Date(export_.generatedAt).toLocaleString() : 'Unknown date'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {getStatusIcon(export_.success)}
                      <span className="text-xs text-gray-500">
                        {formatFileSize(0)} {/* Would be actual file size */}
                      </span>
                      {export_.downloadUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(export_.downloadUrl, '_blank')}
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                
                {exportHistory.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <History className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>No export history</p>
                    <p className="text-sm">Your exports will appear here</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}