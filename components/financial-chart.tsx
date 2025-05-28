"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

interface PriceData {
  date: string
  price: number
  volume: number
  open: number
  high: number
  low: number
  close: number
}

interface FinancialChartProps {
  data: PriceData[]
  ticker: string
}

export function FinancialChart({ data, ticker }: FinancialChartProps) {
  //scaling stuff
  const prices = data.map((d) => d.price).filter((p) => p > 0)
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const padding = (maxPrice - minPrice) * 0.1

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h3 className="text-xl font-semibold text-white mb-4">{ticker} Price Chart (30 Days)</h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="date"
              stroke="#9CA3AF"
              tick={{ fill: "#9CA3AF", fontSize: 12 }}
              tickFormatter={(value) => {
                const date = new Date(value)
                return `${date.getMonth() + 1}/${date.getDate()}`
              }}
            />
            <YAxis
              stroke="#9CA3AF"
              tick={{ fill: "#9CA3AF", fontSize: 12 }}
              domain={[minPrice - padding, maxPrice + padding]}
              tickFormatter={(value) => `$${value.toFixed(2)}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1F2937",
                border: "1px solid #374151",
                borderRadius: "8px",
                color: "#F9FAFB",
              }}
              formatter={(value: number) => [`$${value.toFixed(2)}`, "Price"]}
              labelFormatter={(label) => {
                const date = new Date(label)
                return date.toLocaleDateString()
              }}
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#EF4444"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#EF4444" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <p className="text-gray-400">Current</p>
          <p className="text-white font-semibold">${data[data.length - 1]?.price?.toFixed(2) || "N/A"}</p>
        </div>
        <div>
          <p className="text-gray-400">High</p>
          <p className="text-white font-semibold">${maxPrice.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-400">Low</p>
          <p className="text-white font-semibold">${minPrice.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-400">Avg Volume</p>
          <p className="text-white font-semibold">
            {(data.reduce((sum, d) => sum + d.volume, 0) / data.length / 1000000).toFixed(1)}M
          </p>
        </div>
      </div>
    </div>
  )
}
