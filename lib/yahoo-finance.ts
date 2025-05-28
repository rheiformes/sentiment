
export interface StockData {
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap: number
  eps: number
  high52Week: number
  low52Week: number
}

export interface PriceHistory {
  date: string
  price: number
  volume: number
  open: number
  high: number
  low: number
  close: number
}

export async function getStockData(ticker: string): Promise<StockData | null> {
  try {
    //TODO: come back and figure out why yfc keeps rate limiting/ip blocking
    const endpoints = [
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${ticker}`,
      `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${ticker}`,
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`,
    ]

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`)

        const response = await fetch(endpoint, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.9",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        })

        if (!response.ok) {
          console.log(`Endpoint failed with status: ${response.status}`)
          continue
        }

        const data = await response.json()
        console.log("API Response structure:", Object.keys(data))

        
        if (data.quoteResponse && data.quoteResponse.result && data.quoteResponse.result.length > 0) {
          const quote = data.quoteResponse.result[0]
          console.log("Quote data:", quote)

          return {
            price: quote.regularMarketPrice || quote.ask || quote.bid || 0,
            change: quote.regularMarketChange || 0,
            changePercent: quote.regularMarketChangePercent || 0,
            volume: Number.parseInt(quote.regularMarketVolume || quote.volume || 0),
            marketCap: Number.parseInt(quote.marketCap || 0),
            eps: Number.parseFloat(quote.epsTrailingTwelveMonths || 0),
            high52Week: Number.parseFloat(quote.fiftyTwoWeekHigh || 0),
            low52Week: Number.parseFloat(quote.fiftyTwoWeekLow || 0),
          }
        }

        
        if (data.chart && data.chart.result && data.chart.result.length > 0) {
          const result = data.chart.result[0]
          const meta = result.meta
          console.log("Chart meta data:", meta)

          if (meta) {
            return {
              price: meta.regularMarketPrice || meta.previousClose || 0,
              change: (meta.regularMarketPrice || 0) - (meta.previousClose || 0),
              changePercent:
                meta.regularMarketPrice && meta.previousClose
                  ? ((meta.regularMarketPrice - meta.previousClose) / meta.previousClose) * 100
                  : 0,
              volume: Number.parseInt(meta.regularMarketVolume || 0),
              marketCap: Number.parseInt(meta.marketCap || 0),
              eps: Number.parseFloat(meta.epsTrailingTwelveMonths || 0),
              high52Week: Number.parseFloat(meta.fiftyTwoWeekHigh || 0),
              low52Week: Number.parseFloat(meta.fiftyTwoWeekLow || 0),
            }
          }
        }
      } catch (endpointError) {
        console.error(`Error with endpoint ${endpoint}:`, endpointError)
        continue
      }
    }

    console.error("All Yahoo Finance endpoints failed")
    return null
  } catch (error) {
    console.error("Error in getStockData:", error)
    return null
  }
}

export async function getStockHistory(ticker: string, days = 30): Promise<PriceHistory[]> {
  try {
    const period1 = Math.floor((Date.now() - days * 24 *360 * 1000)/1000)
    const period2 = Math.floor(Date.now() / 1000)

    const endpoints = [
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${period1}&period2=${period2}&interval=1d`,
      `https://query2.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${period1}&period2=${period2}&interval=1d`,
    ]

    for (const endpoint of endpoints) {
      try {
        console.log(`Trying history endpoint: ${endpoint}`)

        const response = await fetch(endpoint, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            Accept: "application/json, text/plain, */*",
            "Accept-Language": "en-US,en;q=0.9",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
        })

        if (!response.ok) {
          console.log(`History endpoint failed with status: ${response.status}`)
          continue
        }

        const data = await response.json()
        const result = data.chart?.result?.[0]

        if (result && result.timestamp && result.indicators?.quote?.[0]) {
          const timestamps = result.timestamp
          const quotes = result.indicators.quote[0]

          const historyData = timestamps
            .map((timestamp: number, index: number) => ({
              date: new Date(timestamp * 1000).toISOString().split("T")[0],
              price: Number.parseFloat((quotes.close?.[index] || 0).toFixed(2)),
              volume: quotes.volume?.[index] || 0,
              open: Number.parseFloat((quotes.open?.[index] || 0).toFixed(2)),
              high: Number.parseFloat((quotes.high?.[index] || 0).toFixed(2)),
              low: Number.parseFloat((quotes.low?.[index] || 0).toFixed(2)),
              close: Number.parseFloat((quotes.close?.[index] || 0).toFixed(2)),
            }))
            .filter((item) => item.price > 0)

          console.log(`Retrieved ${historyData.length} historical data points`)
          return historyData
        }
      } catch (endpointError) {
        console.error(`History endpoint error:`, endpointError)
        continue
      }
    }

    console.error("All history endpoints failed")
    return []
  } catch (error) {
    console.error("Error fetching stock history:", error)
    return []
  }
}

//alt if yfc fails
export async function getStockDataAlphaVantage(ticker: string): Promise<StockData | null> {
  try {
    const API_KEY = process.env.ALPHA_VANTAGE_API_KEY

    if (!API_KEY) {
      console.log("Alpha Vantage API key not found")
      return null
    }

    
    const quoteResponse = await fetch(
      `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${API_KEY}`,
    )

    if (!quoteResponse.ok) {
      throw new Error("Alpha Vantage API request failed")
    }

    const quoteData = await quoteResponse.json()
    const quote = quoteData["Global Quote"]

    if (!quote) {
      throw new Error("No quote data from Alpha Vantage")
    }

    
    const overviewResponse = await fetch(
      `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${API_KEY}`,
    )

    let marketCap = 0
    let eps = 0

    if (overviewResponse.ok) {
      const overviewData = await overviewResponse.json()

      if (overviewData && !overviewData.Note) {
        //api limit stuff
        marketCap = Number.parseFloat(overviewData.MarketCapitalization || 0)
        eps = Number.parseFloat(overviewData.EPS || 0)
      }
    }

    return {
      price: Number.parseFloat(quote["05. price"]) || 0,
      change: Number.parseFloat(quote["09. change"]) || 0,
      changePercent: Number.parseFloat(quote["10. change percent"].replace("%", "")) || 0,
      volume: Number.parseInt(quote["06. volume"]) || 0,
      marketCap: marketCap,
      eps: eps,
      high52Week: Number.parseFloat(quote["03. high"]) || 0,
      low52Week: Number.parseFloat(quote["04. low"]) || 0,
    }
  } catch (error) {
    console.error("Error with Alpha Vantage API:", error)
    return null
  }
}
