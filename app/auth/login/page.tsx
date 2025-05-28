"use client"

import { useState } from "react"
import { signIn } from "../actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError(null)

    const result = await signIn(formData)

    if (result?.error) {
      setError(result.error)
    }

    setLoading(false)
  }

  async function handleDemoLogin() {
    setLoading(true)
    try {
      //redirect for demo
      document.cookie = "user_email=demo@example.com; path=/; max-age=604800"
      router.push("/dashboard")
    } catch (error) {
      setError("Demo login failed")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gray-800 border-gray-700">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-white">Market Watcher</CardTitle>
          <CardDescription className="text-gray-400">Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-3 bg-gray-700 rounded-lg border border-gray-600">
            <p className="text-sm text-gray-300 mb-2">Test Credentials:</p>
            <p className="text-xs text-gray-400">Email: demo@example.com</p>
            <p className="text-xs text-gray-400">Password: password123</p>
          </div>
          <form action={handleSubmit} className="space-y-4">
            <div>
              <Input
                type="email"
                name="email"
                placeholder="Email"
                required
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
            <div>
              <Input
                type="password"
                name="password"
                placeholder="Password"
                required
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
            {error && <div className="text-red-400 text-sm text-center">{error}</div>}
            <Button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-4">
            <Button
              onClick={handleDemoLogin}
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
              disabled={loading}
            >
              {loading ? "Loading..." : "Demo Login (Skip Authentication)"}
            </Button>
          </div>
          <div className="mt-4 text-center">
            <Link href="/auth/signup" className="text-red-400 hover:text-red-300 text-sm">
              Don't have an account? Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
