"use client"

import { API_ENDPOINTS } from "@/lib/api-endpoints"

import { apiResponseRequest } from "@/lib/http-client"
import { useState } from "react"
import { Copy, LoaderCircle, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"
export function QrAttendance({ sessionId, open }: { sessionId: string; open: boolean }) {
  const [loading, setLoading] = useState(false),
    [token, setToken] = useState(""),
    [expiresAt, setExpiresAt] = useState(""),
    [error, setError] = useState("")
  if (!open) return null
  async function generate() {
    setLoading(true)
    setError("")
    const response = await apiResponseRequest(API_ENDPOINTS.attendance.qr(sessionId), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ expiresInMinutes: 5 }),
    })
    const body = await response.json()
    setLoading(false)
    if (!response.ok) return setError(body.message)
    setToken(body.data.token)
    setExpiresAt(body.data.expiresAt)
  }
  return (
    <div className="rounded-xl border bg-blue-50/50 p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold">QR check-in token</p>
          <p className="text-xs text-muted-foreground">
            Generate a secure token valid for five minutes.
          </p>
        </div>
        <Button onClick={generate} disabled={loading}>
          {loading ? <LoaderCircle className="animate-spin" /> : <QrCode />}Generate
        </Button>
      </div>
      {token && (
        <div className="mt-4 rounded-lg bg-white p-3">
          <p className="break-all font-mono text-xs">{token}</p>
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Expires {new Date(expiresAt).toLocaleTimeString()}
            </p>
            <Button size="sm" variant="ghost" onClick={() => navigator.clipboard.writeText(token)}>
              <Copy /> Copy
            </Button>
          </div>
        </div>
      )}
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </div>
  )
}
