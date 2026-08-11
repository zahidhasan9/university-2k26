import "server-only"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { cache } from "react"

import { API_URL, type ApiResponse } from "@/lib/api"

export const ACCESS_COOKIE = "unisphere_access"
export const REFRESH_COOKIE = "unisphere_refresh_proxy"

export async function requireAccessToken() {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value
  if (!token) redirect("/login")
  return token
}

const requestWithToken = cache(async <T>(token: string, path: string): Promise<ApiResponse<T>> => {
  const response = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })
  if (response.status === 401) redirect("/login")
  const body = (await response.json()) as ApiResponse<T>
  if (!response.ok) throw new Error(body.message || "Backend request failed")
  return body
})

/** Authenticated server GET with request-scoped deduplication for identical paths. */
export async function authenticatedRequest<T>(path: string): Promise<ApiResponse<T>> {
  const token = await requireAccessToken()
  return requestWithToken<T>(token, path)
}
