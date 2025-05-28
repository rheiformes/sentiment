import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export interface SentimentAnalysis {
  score: number // -1 to 1
  label: "Bullish" | "Bearish" | "Neutral"
  confidence: number
  reasoning: string
}

export interface InvestmentThesis {
  thesis: string
  timeHorizon: string
  riskLevel: "Low" | "Medium" | "High"
  keyFactors: string[]
  priceTarget: number | null
}

export async function analyzeSentiment(ticker: string, stockData: any, news: any[]): Promise<SentimentAnalysis> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `
    Analyze the sentiment for stock ticker ${ticker} based on REAL market data:
    
    REAL Stock Data:
    - Current Price: $${stockData?.price || "N/A"}
    - Change: ${stockData?.change || "N/A"} (${stockData?.changePercent?.toFixed(2) || "N/A"}%)
    - Volume: ${stockData?.volume?.toLocaleString() || "N/A"}
    - Market Cap: $${stockData?.marketCap?.toLocaleString() || "N/A"}
    - 52-Week High: $${stockData?.high52Week || "N/A"}
    - 52-Week Low: $${stockData?.low52Week || "N/A"}
    
    REAL Recent News Headlines:
    ${news.map((article) => `- ${article.title} (${article.source})`).join("\n")}
    
    Based on this REAL market data, provide a sentiment analysis with:
    1. A sentiment score from -1 (very bearish) to 1 (very bullish)
    2. A label: Bullish, Bearish, or Neutral
    3. Confidence level (0-1)
    4. Brief reasoning based on the actual data provided
    
    Respond in JSON format:
    {
      "score": number,
      "label": "Bullish|Bearish|Neutral",
      "confidence": number,
      "reasoning": "string"
    }
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0])
      return {
        score: Math.max(-1, Math.min(1, analysis.score)),
        label: analysis.label,
        confidence: Math.max(0, Math.min(1, analysis.confidence)),
        reasoning: analysis.reasoning,
      }
    }

    throw new Error("Invalid AI response format")
  } catch (error) {
    console.error("Error analyzing sentiment with AI:", error)
    throw new Error("Failed to generate AI sentiment analysis")
  }
}

export async function generateInvestmentThesis(
  ticker: string,
  stockData: any,
  sentiment: SentimentAnalysis,
  news: any[],
): Promise<InvestmentThesis> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `
    Generate a comprehensive investment thesis for ${ticker} based on REAL market data:
    
    REAL Financial Metrics:
    - Current Price: $${stockData?.price || "N/A"}
    - Market Cap: $${stockData?.marketCap?.toLocaleString() || "N/A"}
    - EPS: $${stockData?.eps || "N/A"}
    - 52-Week Range: $${stockData?.low52Week || "N/A"} - $${stockData?.high52Week || "N/A"}
    - Daily Volume: ${stockData?.volume?.toLocaleString() || "N/A"}
    
    REAL Sentiment Analysis:
    - Score: ${sentiment.score}
    - Label: ${sentiment.label}
    - Reasoning: ${sentiment.reasoning}
    
    REAL News Context:
    ${news.map((article) => `- ${article.title}: ${article.description} (${article.source})`).join("\n")}
    
    Based on this REAL market data, provide an investment thesis including:
    1. Overall investment recommendation based on actual data
    2. Recommended time horizon
    3. Risk level assessment
    4. 3-4 key factors supporting the thesis
    5. Potential price target based on current metrics
    
    Respond in JSON format:
    {
      "thesis": "string",
      "timeHorizon": "string",
      "riskLevel": "Low|Medium|High",
      "keyFactors": ["factor1", "factor2", "factor3"],
      "priceTarget": number or null
    }
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    throw new Error("Invalid AI response format")
  } catch (error) {
    console.error("Error generating investment thesis with AI:", error)
    throw new Error("Failed to generate AI investment thesis")
  }
}
