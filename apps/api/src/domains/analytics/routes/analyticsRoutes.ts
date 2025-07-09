import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { AnalyticsController } from '../controllers/analyticsController'
import { authMiddleware } from '../../auth/middleware/authMiddleware'
import {
  validateLocationMetrics,
  validateLocationComparison,
  validateSentimentAnalysis,
  validateBatchSentimentAnalysis,
  validateCostComparison,
  validateCostPredictions,
  validateLivingCostIndex,
  validateBudgetRecommendations,
  validateEmotionAnalysis,
  validateSentimentTrends,
  validateSentimentByCategory,
  validateDecisionMatrix,
  validateLocationComparisonMatrix,
  validatePropertyComparisonMatrix,
  validateMatrixId,
  validateMatrixTemplates,
  validateExportOptions,
  validateTemplateId,
  validateScheduleExport,
  validateExportHistory,
  validateSummaryReport,
  validateCleanupExports
} from '../validation/analyticsValidation'

const router: Router = Router()
const prisma = new PrismaClient()
const analyticsController = new AnalyticsController(prisma)

// Location Analytics Routes
router.get(
  '/location/:locationId/metrics',
  authMiddleware,
  validateLocationMetrics,
  analyticsController.getLocationMetrics.bind(analyticsController)
)

router.post(
  '/locations/compare',
  authMiddleware,
  validateLocationComparison,
  analyticsController.compareLocations.bind(analyticsController)
)

router.get(
  '/location/:locationId/analysis',
  authMiddleware,
  validateLocationMetrics,
  analyticsController.getCompleteLocationAnalysis.bind(analyticsController)
)

// Sentiment Analysis Routes
router.post(
  '/sentiment/analyze',
  authMiddleware,
  validateSentimentAnalysis,
  analyticsController.analyzeSentiment.bind(analyticsController)
)

router.post(
  '/sentiment/batch',
  authMiddleware,
  validateBatchSentimentAnalysis,
  analyticsController.batchAnalyzeSentiment.bind(analyticsController)
)

router.get(
  '/sentiment/emotions',
  authMiddleware,
  validateEmotionAnalysis,
  analyticsController.analyzeEmotions.bind(analyticsController)
)

router.get(
  '/sentiment/trends',
  authMiddleware,
  validateSentimentTrends,
  analyticsController.getSentimentTrends.bind(analyticsController)
)

router.post(
  '/sentiment/category',
  authMiddleware,
  validateSentimentByCategory,
  analyticsController.analyzeSentimentByCategory.bind(analyticsController)
)

// Cost Intelligence Routes
router.get(
  '/location/:locationId/cost',
  authMiddleware,
  validateLocationMetrics,
  analyticsController.getLocationCostAnalysis.bind(analyticsController)
)

router.post(
  '/locations/cost/compare',
  authMiddleware,
  validateCostComparison,
  analyticsController.compareLocationCosts.bind(analyticsController)
)

router.get(
  '/location/:locationId/cost/trends',
  authMiddleware,
  validateLocationMetrics,
  analyticsController.getCostTrends.bind(analyticsController)
)

router.get(
  '/location/:locationId/cost/predictions',
  authMiddleware,
  validateCostPredictions,
  analyticsController.getCostPredictions.bind(analyticsController)
)

router.get(
  '/location/:locationId/cost/index',
  authMiddleware,
  validateLivingCostIndex,
  analyticsController.getLivingCostIndex.bind(analyticsController)
)

router.post(
  '/location/:locationId/budget',
  authMiddleware,
  validateBudgetRecommendations,
  analyticsController.getBudgetRecommendations.bind(analyticsController)
)

// Decision Matrix Routes
router.post(
  '/decision-matrix',
  authMiddleware,
  validateDecisionMatrix,
  analyticsController.createDecisionMatrix.bind(analyticsController)
)

router.get(
  '/decision-matrix/:matrixId',
  authMiddleware,
  validateMatrixId,
  analyticsController.getDecisionMatrix.bind(analyticsController)
)

router.get(
  '/decision-matrices',
  authMiddleware,
  analyticsController.listDecisionMatrices.bind(analyticsController)
)

router.put(
  '/decision-matrix/:matrixId',
  authMiddleware,
  validateMatrixId,
  analyticsController.updateDecisionMatrix.bind(analyticsController)
)

router.delete(
  '/decision-matrix/:matrixId',
  authMiddleware,
  validateMatrixId,
  analyticsController.deleteDecisionMatrix.bind(analyticsController)
)

router.post(
  '/decision-matrix/location-comparison',
  authMiddleware,
  validateLocationComparisonMatrix,
  analyticsController.createLocationComparisonMatrix.bind(analyticsController)
)

router.post(
  '/decision-matrix/property-comparison',
  authMiddleware,
  validatePropertyComparisonMatrix,
  analyticsController.createPropertyComparisonMatrix.bind(analyticsController)
)

router.get(
  '/decision-matrix/templates',
  authMiddleware,
  validateMatrixTemplates,
  analyticsController.getMatrixTemplates.bind(analyticsController)
)

// Dashboard Routes
router.get(
  '/dashboard/overview',
  authMiddleware,
  analyticsController.getDashboardOverview.bind(analyticsController)
)

router.get(
  '/dashboard/insights',
  authMiddleware,
  analyticsController.getDashboardInsights.bind(analyticsController)
)

router.get(
  '/dashboard/sentiment/trends',
  authMiddleware,
  analyticsController.getDashboardSentimentTrends.bind(analyticsController)
)

router.get(
  '/dashboard/cost/trends',
  authMiddleware,
  analyticsController.getDashboardCostTrends.bind(analyticsController)
)

router.post(
  '/dashboard/location/compare',
  authMiddleware,
  validateLocationComparison,
  analyticsController.getDashboardLocationComparison.bind(analyticsController)
)

router.post(
  '/dashboard/insights/generate',
  authMiddleware,
  analyticsController.generateDashboardInsights.bind(analyticsController)
)

router.post(
  '/dashboard/cache/refresh',
  authMiddleware,
  analyticsController.refreshDashboardCache.bind(analyticsController)
)

// Behavior Pattern Routes
router.post(
  '/behavior/analyze',
  authMiddleware,
  analyticsController.analyzeBehaviorPatterns.bind(analyticsController)
)

router.get(
  '/behavior/biases',
  authMiddleware,
  analyticsController.detectCognitiveBiases.bind(analyticsController)
)

router.get(
  '/behavior/insights',
  authMiddleware,
  analyticsController.getBehaviorInsights.bind(analyticsController)
)

router.post(
  '/behavior/predict',
  authMiddleware,
  analyticsController.predictBehavior.bind(analyticsController)
)

router.get(
  '/behavior/patterns',
  authMiddleware,
  analyticsController.listBehaviorPatterns.bind(analyticsController)
)

// Real-time Analytics Routes
router.post(
  '/realtime/queue-job',
  authMiddleware,
  analyticsController.queueRealtimeJob.bind(analyticsController)
)

router.get(
  '/realtime/job/:jobId',
  authMiddleware,
  analyticsController.getJobStatus.bind(analyticsController)
)

router.get(
  '/realtime/metrics',
  authMiddleware,
  analyticsController.getRealtimeMetrics.bind(analyticsController)
)

router.post(
  '/realtime/process-update',
  authMiddleware,
  analyticsController.processRealtimeUpdate.bind(analyticsController)
)

// Export and Reporting Routes
router.post(
  '/export',
  authMiddleware,
  validateExportOptions,
  analyticsController.exportAnalyticsData.bind(analyticsController)
)

router.get(
  '/export/templates',
  authMiddleware,
  analyticsController.getExportTemplates.bind(analyticsController)
)

router.post(
  '/export/template/:templateId',
  authMiddleware,
  validateTemplateId,
  analyticsController.generateReportFromTemplate.bind(analyticsController)
)

router.post(
  '/export/schedule',
  authMiddleware,
  validateScheduleExport,
  analyticsController.scheduleRecurringExport.bind(analyticsController)
)

router.get(
  '/export/history',
  authMiddleware,
  validateExportHistory,
  analyticsController.getExportHistory.bind(analyticsController)
)

router.get(
  '/export/summary',
  authMiddleware,
  validateSummaryReport,
  analyticsController.generateSummaryReport.bind(analyticsController)
)

router.delete(
  '/export/cleanup',
  authMiddleware,
  validateCleanupExports,
  analyticsController.cleanupOldExports.bind(analyticsController)
)

export default router