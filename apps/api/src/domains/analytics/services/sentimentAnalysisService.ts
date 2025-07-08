import axios from 'axios'
import { SentimentResult, SentimentAnalysisInput } from '../types/analytics.types'
import { logger } from '../../../lib/logger'

export class SentimentAnalysisService {
  private openaiApiKey: string
  private huggingFaceApiKey: string
  private azureApiKey: string
  private azureEndpoint: string

  constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || ''
    this.huggingFaceApiKey = process.env.HUGGINGFACE_API_KEY || ''
    this.azureApiKey = process.env.AZURE_TEXT_ANALYTICS_KEY || ''
    this.azureEndpoint = process.env.AZURE_TEXT_ANALYTICS_ENDPOINT || ''
  }

  /**
   * Analyze sentiment of text using the best available service
   */
  async analyzeSentiment(input: SentimentAnalysisInput): Promise<SentimentResult> {
    try {
      // Try OpenAI first for best results
      if (this.openaiApiKey) {
        return await this.analyzeSentimentWithOpenAI(input)
      }
      
      // Try Azure Text Analytics as fallback
      if (this.azureApiKey && this.azureEndpoint) {
        return await this.analyzeSentimentWithAzure(input)
      }
      
      // Try Hugging Face as another fallback
      if (this.huggingFaceApiKey) {
        return await this.analyzeSentimentWithHuggingFace(input)
      }
      
      // Fall back to local lexicon-based analysis
      return await this.analyzeSentimentLocal(input)
      
    } catch (error) {
      logger.error('Sentiment analysis failed:', error)
      
      // Return neutral sentiment with low confidence on error
      return {
        score: 0,
        label: 'neutral',
        confidence: 0.1,
        details: {
          positive: 0.33,
          negative: 0.33,
          neutral: 0.34
        }
      }
    }
  }

  /**
   * Analyze sentiment using OpenAI GPT
   */
  private async analyzeSentimentWithOpenAI(input: SentimentAnalysisInput): Promise<SentimentResult> {
    const prompt = `Analyze the sentiment of the following text and provide a detailed assessment:

Text: "${input.text}"

Please provide:
1. Overall sentiment score (-1 to 1, where -1 is very negative, 0 is neutral, 1 is very positive)
2. Confidence level (0 to 1)
3. Breakdown of positive, negative, and neutral elements
4. Brief reasoning

Format your response as JSON with the following structure:
{
  "score": <number>,
  "confidence": <number>,
  "breakdown": {
    "positive": <number>,
    "negative": <number>,
    "neutral": <number>
  },
  "reasoning": "<brief explanation>"
}`

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a sentiment analysis expert. Provide accurate sentiment scores and detailed breakdowns.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 300
      },
      {
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const result = JSON.parse(response.data.choices[0].message.content)
    
    return {
      score: result.score,
      label: result.score > 0.1 ? 'positive' : result.score < -0.1 ? 'negative' : 'neutral',
      confidence: result.confidence,
      details: result.breakdown
    }
  }

  /**
   * Analyze sentiment using Azure Text Analytics
   */
  private async analyzeSentimentWithAzure(input: SentimentAnalysisInput): Promise<SentimentResult> {
    const response = await axios.post(
      `${this.azureEndpoint}/text/analytics/v3.1/sentiment`,
      {
        documents: [
          {
            id: '1',
            language: input.language || 'en',
            text: input.text
          }
        ]
      },
      {
        headers: {
          'Ocp-Apim-Subscription-Key': this.azureApiKey,
          'Content-Type': 'application/json'
        }
      }
    )

    const document = response.data.documents[0]
    const sentiment = document.sentiment
    const scores = document.confidenceScores

    // Convert Azure sentiment to our format
    let score = 0
    if (sentiment === 'positive') score = scores.positive - scores.negative
    else if (sentiment === 'negative') score = scores.negative - scores.positive
    else score = 0

    return {
      score,
      label: sentiment,
      confidence: Math.max(scores.positive, scores.negative, scores.neutral),
      details: {
        positive: scores.positive,
        negative: scores.negative,
        neutral: scores.neutral
      }
    }
  }

  /**
   * Analyze sentiment using Hugging Face
   */
  private async analyzeSentimentWithHuggingFace(input: SentimentAnalysisInput): Promise<SentimentResult> {
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/cardiffnlp/twitter-roberta-base-sentiment-latest',
      {
        inputs: input.text
      },
      {
        headers: {
          'Authorization': `Bearer ${this.huggingFaceApiKey}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const results = response.data[0]
    
    // Find the sentiment with highest score
    const topSentiment = results.reduce((prev: any, current: any) => 
      current.score > prev.score ? current : prev
    )

    // Convert to our format
    let score = 0
    let label: 'positive' | 'negative' | 'neutral' = 'neutral'
    
    if (topSentiment.label === 'LABEL_2') { // Positive
      score = topSentiment.score
      label = 'positive'
    } else if (topSentiment.label === 'LABEL_0') { // Negative
      score = -topSentiment.score
      label = 'negative'
    } else { // Neutral
      score = 0
      label = 'neutral'
    }

    return {
      score,
      label,
      confidence: topSentiment.score,
      details: {
        positive: results.find((r: any) => r.label === 'LABEL_2')?.score || 0,
        negative: results.find((r: any) => r.label === 'LABEL_0')?.score || 0,
        neutral: results.find((r: any) => r.label === 'LABEL_1')?.score || 0
      }
    }
  }

  /**
   * Local lexicon-based sentiment analysis
   */
  private async analyzeSentimentLocal(input: SentimentAnalysisInput): Promise<SentimentResult> {
    const text = input.text.toLowerCase()
    
    // Simple positive/negative word lists
    const positiveWords = [
      'amazing', 'awesome', 'beautiful', 'excellent', 'fantastic', 'good', 'great', 'happy',
      'incredible', 'love', 'lovely', 'nice', 'perfect', 'pleasant', 'wonderful', 'enjoy',
      'relaxing', 'comfortable', 'convenient', 'affordable', 'friendly', 'clean', 'safe',
      'delicious', 'charming', 'stunning', 'breathtaking', 'peaceful', 'cozy', 'warm',
      'interesting', 'exciting', 'fun', 'remarkable', 'impressive', 'satisfying', 'helpful'
    ]

    const negativeWords = [
      'awful', 'bad', 'horrible', 'terrible', 'hate', 'disappointing', 'boring', 'expensive',
      'dirty', 'dangerous', 'unfriendly', 'uncomfortable', 'inconvenient', 'crowded', 'noisy',
      'cold', 'hot', 'humid', 'difficult', 'confusing', 'stressful', 'exhausting', 'annoying',
      'frustrating', 'overwhelming', 'scary', 'unpleasant', 'disgusting', 'overpriced', 'rude',
      'slow', 'poor', 'broken', 'complicated', 'chaotic', 'lonely', 'isolated'
    ]

    const words = text.split(/\s+/)
    let positiveCount = 0
    let negativeCount = 0
    
    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++
      if (negativeWords.includes(word)) negativeCount++
    })

    const totalSentimentWords = positiveCount + negativeCount
    if (totalSentimentWords === 0) {
      return {
        score: 0,
        label: 'neutral',
        confidence: 0.3,
        details: {
          positive: 0.33,
          negative: 0.33,
          neutral: 0.34
        }
      }
    }

    const positiveRatio = positiveCount / totalSentimentWords
    const negativeRatio = negativeCount / totalSentimentWords
    const score = positiveRatio - negativeRatio

    return {
      score,
      label: score > 0.1 ? 'positive' : score < -0.1 ? 'negative' : 'neutral',
      confidence: Math.abs(score),
      details: {
        positive: positiveRatio,
        negative: negativeRatio,
        neutral: 1 - (positiveRatio + negativeRatio)
      }
    }
  }

  /**
   * Analyze sentiment of multiple texts in batch
   */
  async batchAnalyzeSentiment(inputs: SentimentAnalysisInput[]): Promise<SentimentResult[]> {
    const results = await Promise.allSettled(
      inputs.map(input => this.analyzeSentiment(input))
    )

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        logger.error(`Batch sentiment analysis failed for input ${index}:`, result.reason)
        return {
          score: 0,
          label: 'neutral' as const,
          confidence: 0.1,
          details: {
            positive: 0.33,
            negative: 0.33,
            neutral: 0.34
          }
        }
      }
    })
  }

  /**
   * Get sentiment trend over time
   */
  async analyzeSentimentTrend(texts: Array<{ text: string; timestamp: Date }>): Promise<{
    trend: 'improving' | 'declining' | 'stable'
    overallSentiment: number
    timeSeriesData: Array<{
      timestamp: Date
      sentiment: number
      confidence: number
    }>
  }> {
    const results = await Promise.all(
      texts.map(async ({ text, timestamp }) => {
        const sentiment = await this.analyzeSentiment({ text })
        return {
          timestamp,
          sentiment: sentiment.score,
          confidence: sentiment.confidence
        }
      })
    )

    // Sort by timestamp
    results.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    // Calculate trend
    const recentSentiments = results.slice(-5).map(r => r.sentiment)
    const earlierSentiments = results.slice(0, 5).map(r => r.sentiment)
    
    const recentAvg = recentSentiments.reduce((sum, val) => sum + val, 0) / recentSentiments.length
    const earlierAvg = earlierSentiments.reduce((sum, val) => sum + val, 0) / earlierSentiments.length
    
    const difference = recentAvg - earlierAvg
    
    let trend: 'improving' | 'declining' | 'stable'
    if (difference > 0.1) trend = 'improving'
    else if (difference < -0.1) trend = 'declining'
    else trend = 'stable'

    const overallSentiment = results.reduce((sum, r) => sum + r.sentiment, 0) / results.length

    return {
      trend,
      overallSentiment,
      timeSeriesData: results
    }
  }

  /**
   * Analyze sentiment by categories
   */
  async analyzeSentimentByCategory(
    input: SentimentAnalysisInput,
    categories: string[]
  ): Promise<Record<string, SentimentResult>> {
    const results: Record<string, SentimentResult> = {}
    
    // Extract sentences/phrases related to each category
    const text = input.text.toLowerCase()
    
    for (const category of categories) {
      const categoryKeywords = this.getCategoryKeywords(category)
      const sentences = text.split(/[.!?]+/)
      
      // Find sentences that mention this category
      const relevantSentences = sentences.filter(sentence =>
        categoryKeywords.some(keyword => sentence.includes(keyword))
      )
      
      if (relevantSentences.length > 0) {
        const categoryText = relevantSentences.join('. ')
        results[category] = await this.analyzeSentiment({
          ...input,
          text: categoryText
        })
      } else {
        results[category] = {
          score: 0,
          label: 'neutral',
          confidence: 0.1,
          details: {
            positive: 0.33,
            negative: 0.33,
            neutral: 0.34
          }
        }
      }
    }
    
    return results
  }

  /**
   * Get keywords for different categories
   */
  private getCategoryKeywords(category: string): string[] {
    const keywordMap: Record<string, string[]> = {
      'food': ['food', 'restaurant', 'meal', 'eat', 'cuisine', 'dinner', 'lunch', 'breakfast', 'delicious', 'tasty'],
      'accommodation': ['hotel', 'stay', 'room', 'bed', 'sleep', 'accommodation', 'apartment', 'house'],
      'transport': ['transport', 'bus', 'train', 'metro', 'taxi', 'uber', 'walk', 'bike', 'car', 'flight'],
      'weather': ['weather', 'rain', 'sunny', 'cold', 'hot', 'temperature', 'climate', 'humid', 'wind'],
      'culture': ['culture', 'museum', 'art', 'history', 'local', 'tradition', 'people', 'language'],
      'nature': ['nature', 'park', 'beach', 'mountain', 'forest', 'lake', 'river', 'sea', 'landscape'],
      'cost': ['cost', 'price', 'expensive', 'cheap', 'money', 'budget', 'affordable', 'value'],
      'safety': ['safe', 'dangerous', 'crime', 'security', 'police', 'theft', 'risk']
    }
    
    return keywordMap[category.toLowerCase()] || []
  }

  /**
   * Get emotion analysis beyond basic sentiment
   */
  async analyzeEmotions(input: SentimentAnalysisInput): Promise<{
    emotions: Record<string, number>
    dominant: string
    confidence: number
  }> {
    // Simple emotion detection based on keywords
    const text = input.text.toLowerCase()
    const emotionKeywords = {
      joy: ['happy', 'joy', 'excited', 'thrilled', 'delighted', 'pleased', 'cheerful'],
      sadness: ['sad', 'disappointed', 'upset', 'depressed', 'melancholy', 'blue'],
      anger: ['angry', 'furious', 'irritated', 'annoyed', 'frustrated', 'mad'],
      fear: ['scared', 'afraid', 'worried', 'anxious', 'nervous', 'terrified'],
      surprise: ['surprised', 'amazed', 'astonished', 'shocked', 'unexpected'],
      disgust: ['disgusting', 'awful', 'gross', 'terrible', 'horrible', 'revolting'],
      trust: ['trust', 'reliable', 'confident', 'secure', 'comfortable', 'safe'],
      anticipation: ['excited', 'eager', 'hopeful', 'optimistic', 'looking forward']
    }

    const emotions: Record<string, number> = {}
    let totalMatches = 0

    for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
      const matches = keywords.filter(keyword => text.includes(keyword)).length
      emotions[emotion] = matches
      totalMatches += matches
    }

    // Normalize scores
    if (totalMatches > 0) {
      for (const emotion in emotions) {
        emotions[emotion] = emotions[emotion] / totalMatches
      }
    }

    // Find dominant emotion
    const dominant = Object.entries(emotions)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || 'neutral'

    const confidence = totalMatches > 0 ? emotions[dominant] : 0.1

    return {
      emotions,
      dominant,
      confidence
    }
  }
}