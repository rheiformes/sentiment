"use client"

import { useState, useEffect } from "react"
import { searchTicker, getSearchHistory } from "./actions"
import { signOut } from "../auth/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { FinancialChart } from "@/components/financial-chart"
import {
  Search,
  LogOut,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  Clock,
  Newspaper,
  AlertTriangle,
} from "lucide-react"

interface SearchResult {
  ticker: string
  companyName: string
  stockData: {
    price: number
    change: number
    changePercent: number
    volume: number
    marketCap: number
    eps: number
    high52Week: number
    low52Week: number
  }
  sentiment: {
    score: number
    label: string
    confidence: number
    reasoning: string
  }
  news: Array<{
    title: string
    url: string
    source: string
    publishedAt: string
    description: string
    urlToImage?: string
  }>
  priceData: Array<{
    date: string
    price: number
    volume: number
    open: number
    high: number
    low: number
    close: number
  }>
  thesis: string
  timeHorizon: string
  riskLevel: string
  keyFactors: string[]
  priceTarget: number | null
}

interface HistoryItem {
  id: string
  ticker: string
  sentiment_label: string
  sentiment_score: number
  created_at: string
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<SearchResult | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])

  useEffect(() => {
    loadHistory()
  }, [])

  async function loadHistory() {
    const historyResult = await getSearchHistory()
    if (historyResult.data) {
      setHistory(historyResult.data)
    }
  }

  async function handleSearch(formData: FormData) {
    setLoading(true)
    setError(null)

    const searchResult = await searchTicker(formData)

    if (searchResult.error) {
      setError(searchResult.error)
    } else if (searchResult.data) {
      setResult(searchResult.data)
      loadHistory() // Refresh history
    }

    setLoading(false)
  }

  function getSentimentIcon(label: string) {
    switch (label) {
      case "Bullish":
        return <TrendingUp className="w-4 h-4" />
      case "Bearish":
        return <TrendingDown className="w-4 h-4" />
      default:
        return <Minus className="w-4 h-4" />
    }
  }

  function getSentimentColor(label: string) {
    switch (label) {
      case "Bullish":
        return "bg-green-600 hover:bg-green-700"
      case "Bearish":
        return "bg-red-600 hover:bg-red-700"
      default:
        return "bg-gray-600 hover:bg-gray-700"
    }
  }

  function formatMarketCap(marketCap: number): string {
    if (!marketCap || marketCap === 0) return "N/A"
    if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(1)}T`
    if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(1)}B`
    if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(1)}M`
    return `$${marketCap.toLocaleString()}`
  }

  function formatVolume(volume: number): string {
    if (volume === 0) return "N/A"
    if (volume >= 1e9) return `${(volume / 1e9).toFixed(1)}B`
    if (volume >= 1e6) return `${(volume / 1e6).toFixed(1)}M`
    if (volume >= 1e3) return `${(volume / 1e3).toFixed(1)}K`
    return volume.toString()
  }

  function getTimeAgo(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

    if (diffInHours < 1) return "Just now"
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Market Watcher</h1>
          <Button
            onClick={() => signOut()}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Search Section */}
          <div className="lg:col-span-3">
            <Card className="bg-gray-800 border-gray-700 mb-6">
              <CardHeader>
                <CardTitle className="text-white">Search Ticker</CardTitle>
                <CardDescription className="text-gray-400">
                  Enter a stock ticker to get comprehensive market analysis powered by real-time data and AI
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={handleSearch} className="flex gap-4">
                  <Input
                    name="ticker"
                    placeholder="Enter ticker (e.g., AAPL, TSLA, MSFT)"
                    className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                    required
                  />
                  <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={loading}>
                    <Search className="w-4 h-4 mr-2" />
                    {loading ? "Analyzing..." : "Search"}
                  </Button>
                </form>
                {error && (
                  <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded-lg flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-red-400 text-sm font-medium">Error</p>
                      <p className="text-red-300 text-sm">{error}</p>
                    </div>
                  </div>
                )}
                {loading && (
                  <div className="mt-4 text-gray-400 text-sm">
                    Fetching real-time data and generating AI analysis...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Results Section */}
            {result && (
              <div className="space-y-6">
                {/* Company Header */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold text-white">{result.ticker}</h2>
                        <p className="text-gray-400">{result.companyName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-bold text-white">${result.stockData.price.toFixed(2)}</p>
                        <p className={`text-lg ${result.stockData.change >= 0 ? "text-green-400" : "text-red-400"}`}>
                          {result.stockData.change >= 0 ? "+" : ""}
                          {result.stockData.change.toFixed(2)} ({result.stockData.changePercent.toFixed(2)}%)
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Sentiment Analysis */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      {getSentimentIcon(result.sentiment.label)}
                      AI Sentiment Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <Badge className={`${getSentimentColor(result.sentiment.label)} text-white`}>
                          {result.sentiment.label}
                        </Badge>
                        <span className="text-gray-300">
                          Score: {result.sentiment.score > 0 ? "+" : ""}
                          {result.sentiment.score.toFixed(2)}
                        </span>
                        <span className="text-gray-400 text-sm">
                          Confidence: {(result.sentiment.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm">{result.sentiment.reasoning}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Stock Data Overview */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">Key Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-gray-400 text-sm">Volume</p>
                        <p className="text-white text-lg font-semibold">{formatVolume(result.stockData.volume)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">Market Cap</p>
                        <p className="text-white text-lg font-semibold">
                          {formatMarketCap(result.stockData.marketCap)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-sm">52W Range</p>
                        <p className="text-white text-lg font-semibold">
                          ${result.stockData.low52Week.toFixed(2)} - ${result.stockData.high52Week.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Financial Chart */}
                <FinancialChart data={result.priceData} ticker={result.ticker} />

                {/* Investment Thesis */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      AI Investment Thesis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 mb-4">{result.thesis}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <Badge variant="outline" className="border-gray-600 text-gray-300">
                          Time Horizon: {result.timeHorizon}
                        </Badge>
                      </div>
                      <div>
                        <Badge variant="outline" className="border-gray-600 text-gray-300">
                          Risk Level: {result.riskLevel}
                        </Badge>
                      </div>
                      {result.priceTarget && (
                        <div>
                          <Badge variant="outline" className="border-gray-600 text-gray-300">
                            Price Target: ${result.priceTarget}
                          </Badge>
                        </div>
                      )}
                    </div>
                    {result.keyFactors && result.keyFactors.length > 0 && (
                      <div>
                        <h4 className="text-white font-medium mb-2">Key Investment Factors:</h4>
                        <ul className="list-disc list-inside text-gray-300 text-sm space-y-1">
                          {result.keyFactors.map((factor, index) => (
                            <li key={index}>{factor}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* News & Press Releases */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Newspaper className="w-5 h-5" />
                      Latest Financial News
                    </CardTitle>
                    <CardDescription className="text-gray-400">
                      Real-time news from Reuters, Bloomberg, MarketWatch, and other financial sources
                      {result.news.length === 0 && (
                        <span className="text-yellow-400 ml-2">• Loading news sources...</span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {result.news.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="text-gray-400 mb-2">No news articles found</div>
                        <div className="text-sm text-gray-500">
                          This could be due to API limits or network issues.
                          <br />
                          Try refreshing or check the financial news sites directly.
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {result.news.map((article, index) => (
                          <div key={index} className="border-b border-gray-700 pb-4 last:border-b-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h4
                                  className="text-white font-medium mb-1 hover:text-red-400 cursor-pointer transition-colors"
                                  onClick={() => window.open(article.url, "_blank")}
                                >
                                  {article.title}
                                </h4>
                                {article.description && (
                                  <p className="text-gray-400 text-sm mb-2 line-clamp-3">{article.description}</p>
                                )}
                                <div className="flex items-center gap-2 text-sm text-gray-400">
                                  <span className="font-medium text-blue-400">{article.source}</span>
                                  <span>•</span>
                                  <span>{getTimeAgo(article.publishedAt)}</span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:text-red-300 hover:bg-gray-700 flex-shrink-0"
                                onClick={() => window.open(article.url, "_blank")}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Search History Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Search History</CardTitle>
                <CardDescription className="text-gray-400">Your recent analyses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {history.length === 0 ? (
                    <p className="text-gray-400 text-sm">No searches yet</p>
                  ) : (
                    history.map((item) => (
                      <div key={item.id} className="bg-gray-700 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">{item.ticker}</span>
                          <Badge className={`${getSentimentColor(item.sentiment_label)} text-white text-xs`}>
                            {item.sentiment_label}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
