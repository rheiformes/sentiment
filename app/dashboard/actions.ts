"use server"

import { createClient } from "@/lib/supabase/server"
import { getStockData, getStockHistory, getStockDataAlphaVantage } from "@/lib/yahoo-finance"
import { getStockNews } from "@/lib/news-api"
import { analyzeSentiment, generateInvestmentThesis } from "@/lib/gemini-ai"

export async function searchTicker(formData: FormData) {
  const supabase = createClient()

  
  const { getCurrentUser } = await import("../auth/actions")
  const user = await getCurrentUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const ticker = (formData.get("ticker") as string).toUpperCase()

  if (!ticker) {
    return { error: "Ticker is required" }
  }

  try {
    console.log(`Fetching REAL data for ${ticker}...`)

    
    let stockData = await getStockData(ticker)

    if (!stockData) {
      console.log("Yahoo Finance failed, trying Alpha Vantage...")
      stockData = await getStockDataAlphaVantage(ticker)
    }

    if (!stockData) {
      return {
        error: `Unable to fetch real stock data for ${ticker}. This could be due to:
        • Invalid ticker symbol
        • API rate limits
        • Network connectivity issues
        
        Please verify the ticker symbol and try again.`,
      }
    }

    //validate
    if (stockData.price === 0) {
      return {
        error: `No valid price data found for ${ticker}. Please check if this is a valid publicly traded stock ticker.`,
      }
    }

    
    if (!stockData.marketCap || stockData.marketCap === 0) {
      
      if (stockData.price > 0) {
        const estimatedShares = 500000000  //todo come back change default to smth
        stockData.marketCap = stockData.price * estimatedShares
        console.log("Using estimated market cap:", stockData.marketCap)
      }
    }

    console.log("Real stock data retrieved:", stockData)

    
    const priceHistory = await getStockHistory(ticker, 30)

    if (priceHistory.length === 0) {
      return {
        error: `Unable to fetch price history for ${ticker}. The stock data may be incomplete.`,
      }
    }

    
    const news = await getStockNews(ticker)

    console.log(`Retrieved ${priceHistory.length} price points and ${news.length} news articles`)

    
    console.log(">>> Analyzing data...")
    const sentiment = await analyzeSentiment(ticker, stockData, news)
    const investmentThesis = await generateInvestmentThesis(ticker, stockData, sentiment, news)

    
    const priceData = priceHistory.map((item) => ({
      date: item.date,
      price: item.close,
      volume: item.volume,
      open: item.open,
      high: item.high,
      low: item.low,
    }))

    //save to database
    const { data, error } = await supabase
      .from("ticker_searches")
      .insert([
        {
          user_id: user.id,
          ticker,
          sentiment_score: sentiment.score,
          sentiment_label: sentiment.label,
          investment_thesis: investmentThesis.thesis,
          time_horizon: investmentThesis.timeHorizon,
          price_data: priceData,
          news_links: news,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      // dont't fail the entire request if database save fails
    }

    return {
      success: true,
      data: {
        ticker,
        companyName: `${ticker} Corporation`, 
        stockData,
        sentiment: {
          ...sentiment,
          confidence: sentiment.confidence,
        },
        news,
        priceData,
        thesis: investmentThesis.thesis,
        timeHorizon: investmentThesis.timeHorizon,
        riskLevel: investmentThesis.riskLevel,
        keyFactors: investmentThesis.keyFactors,
        priceTarget: investmentThesis.priceTarget,
      },
    }
  } catch (error) {
    console.error("Error in searchTicker:", error)
    return {
      error: `Failed to fetch real market data for ${ticker}. This appears to be a system error. Please try again later.`,
    }
  }
}

export async function getSearchHistory() {
  const supabase = createClient()

  const { getCurrentUser } = await import("../auth/actions")
  const user = await getCurrentUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("ticker_searches")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10)

  if (error) {
    return { error: "Failed to fetch search history" }
  }

  return { data }
}
