"use client"

import { createContext, useCallback, useContext, useMemo } from "react"
import { API_ENDPOINTS } from "@/lib/api-endpoints"
import type { ApiResponse } from "@/lib/api"

type ApiOptions = Omit<RequestInit, "body"> & { body?: unknown }
type ApiContextValue = {
  endpoints: typeof API_ENDPOINTS
  request<T>(path: string, options?: ApiOptions): Promise<ApiResponse<T>>
}

const ApiContext = createContext<ApiContextValue | null>(null)

export function ApiProvider({ children }: { children: React.ReactNode }) {
  const request = useCallback(async <T,>(path: string, options: ApiOptions = {}) => {
    const { body, headers, ...init } = options
    const normalized = path.startsWith("/") ? path.slice(1) : path
    const response = await fetch(`/api/backend/${normalized}`, {
      ...init,
      headers: { ...(body !== undefined ? { "Content-Type": "application/json" } : {}), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const result = (await response.json().catch(() => null)) as ApiResponse<T> | null
    if (!response.ok) throw new Error(result?.message ?? "API request failed")
    if (!result) throw new Error("The API returned an invalid response")
    return result
  }, [])
  const value = useMemo(() => ({ endpoints: API_ENDPOINTS, request }), [request])
  return <ApiContext.Provider value={value}>{children}</ApiContext.Provider>
}

export function useApi() {
  const context = useContext(ApiContext)
  if (!context) throw new Error("useApi must be used inside ApiProvider")
  return context
}
