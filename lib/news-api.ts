
export interface NewsArticle {
  title: string
  url: string
  source: string
  publishedAt: string
  description: string
  urlToImage?: string
}

export async function getStockNews(ticker: string): Promise<NewsArticle[]> {
  try {
    const NEWS_API_KEY = process.env.NEWS_API_KEY

    if (!NEWS_API_KEY) {
      console.log("NEWS_API_KEY not found, using fallback news sources")
      return getRealNewsLinks(ticker)
    }

    //TODO: come back and improe with better error handling
    try {
      const response = await fetch(
        `https://newsapi.org/v2/everything?` +
          new URLSearchParams({
            q: `${ticker} stock OR "${ticker}" earnings OR "${ticker}" financial`,
            domains:
              "reuters.com,bloomberg.com,marketwatch.com,cnbc.com,finance.yahoo.com,wsj.com,ft.com,seekingalpha.com",
            sortBy: "publishedAt",
            pageSize: "20",
            language: "en",
            from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // Last 7 days
            apiKey: NEWS_API_KEY,
          }),
        {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        },
      )

      if (response.ok) {
        const data = await response.json()
        console.log(`NewsAPI returned ${data.articles?.length || 0} articles`)

        if (data.articles && data.articles.length > 0) {
          
          const relevantArticles = data.articles
            .filter(
              (article: any) =>
                article.title &&
                article.url &&
                !article.title.toLowerCase().includes("[removed]") &&
                !article.title.toLowerCase().includes("removed") &&
                article.description &&
                article.description !== "[Removed]",
            )
            .slice(0, 10)  //best 10 articles

          if (relevantArticles.length > 0) {
            return relevantArticles.map((article: any) => ({
              title: article.title,
              url: article.url,
              source: article.source.name,
              publishedAt: article.publishedAt,
              description: article.description || "",
              urlToImage: article.urlToImage,
            }))
          }
        }
      } else {
        console.log(`NewsAPI failed with status: ${response.status}`)
        const errorText = await response.text()
        console.log("NewsAPI error:", errorText)
      }
    } catch (newsApiError) {
      console.error("NewsAPI request failed:", newsApiError)
    }

    
    console.log("Using fallback links")
    return getRealNewsLinks(ticker)
  } catch (error) {
    console.error(">>> Error in getStockNews:", error)
    return getRealNewsLinks(ticker)
  }
}

function getRealNewsLinks(ticker: string): NewsArticle[] {
  const now = new Date()

  // fallback accurate links if api fails on rate limit or other issues
  return [
    {
      title: `${ticker} Stock Quote & Financial Data - Yahoo Finance`,
      url: `https://finance.yahoo.com/quote/${ticker}/`,
      source: "Yahoo Finance",
      publishedAt: now.toISOString(),
      description: `Real-time stock quote, charts, financials, and news for ${ticker}. View detailed financial data including earnings, dividends, and analyst ratings.`,
    },
    {
      title: `${ticker} Stock Research & Market Analysis - MarketWatch`,
      url: `https://www.marketwatch.com/investing/stock/${ticker.toLowerCase()}`,
      source: "MarketWatch",
      publishedAt: new Date(now.getTime() - 3600000).toISOString(), 
      description: `Comprehensive stock analysis, earnings data, and market research for ${ticker}. Get the latest news, analyst opinions, and price targets.`,
    },
    {
      title: `${ticker} Company Profile & Latest News - Reuters`,
      url: `https://www.reuters.com/markets/companies/${ticker}/`,
      source: "Reuters",
      publishedAt: new Date(now.getTime() - 3600000).toISOString(), 
      description: `Latest financial news, earnings reports, and market updates for ${ticker}. Professional analysis and breaking news coverage.`,
    },
    {
      title: `${ticker} Stock Analysis & Analyst Ratings - CNBC`,
      url: `https://www.cnbc.com/quotes/${ticker}`,
      source: "CNBC",
      publishedAt: new Date(now.getTime() - 3600000).toISOString(), 
      description: `Professional analyst ratings, price targets, and investment recommendations for ${ticker}. Real-time market data and expert analysis.`,
    },
    {
      title: `${ticker} Financial Overview & Market Data - Bloomberg`,
      url: `https://www.bloomberg.com/quote/${ticker}:US`,
      source: "Bloomberg",
      publishedAt: new Date(now.getTime() - 3600000).toISOString(), 
      description: `Detailed company profile, financial statements, and institutional-grade market data for ${ticker}. Professional investment research and analysis.`,
    },
    {
      title: `${ticker} Stock Discussion & Analysis - Seeking Alpha`,
      url: `https://seekingalpha.com/symbol/${ticker}`,
      source: "Seeking Alpha",
      publishedAt: new Date(now.getTime() - 3600000).toISOString(), 
      description: `In-depth investment analysis, earnings coverage, and community discussions for ${ticker}. Expert opinions and detailed financial modeling.`,
    },
  ]
}


export async function getCompanyName(ticker: string): Promise<string> {
  try {
    const response = await fetch(`https://query1.finance.yahoo.com/v7/finance/quote?symbols=${ticker}`, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    })

    if (response.ok) {
      const data = await response.json()
      const quote = data.quoteResponse?.result?.[0]
      return quote?.longName || quote?.shortName || ticker
    }
  } catch (error) {
    console.error(">>> Error fetching company name:", error)
  }

  return ticker
}
