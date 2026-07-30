"use client"

import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios"

import type { ApiResponse } from "@/lib/api"

const sharedConfig: AxiosRequestConfig = {
  headers: { Accept: "application/json" },
  timeout: 30_000,
}

export const httpClient = axios.create({
  ...sharedConfig,
  baseURL: "/api/backend",
})

const appClient = axios.create(sharedConfig)
let refreshRequest: Promise<void> | null = null

function redirectOnUnauthorized(status?: number) {
  if (status === 401 && typeof window !== "undefined") {
    window.location.assign("/login")
  }
}

async function refreshSession() {
  const response = await axios.post("/api/auth/refresh", undefined, {
    timeout: 30_000,
    validateStatus: () => true,
  })
  if (response.status < 200 || response.status >= 300) {
    throw new Error("Authentication session expired")
  }
}

type RetryableConfig = InternalAxiosRequestConfig & {
  _sessionRetry?: boolean
}

async function normalizeAxiosError(error: AxiosError<ApiResponse<unknown>>) {
  const config = error.config as RetryableConfig | undefined

  if (error.response?.status === 401 && config && !config._sessionRetry) {
    config._sessionRetry = true
    refreshRequest ??= refreshSession().finally(() => {
      refreshRequest = null
    })

    try {
      await refreshRequest
      return httpClient.request(config)
    } catch {
      redirectOnUnauthorized(401)
    }
  }

  redirectOnUnauthorized(error.response?.status)
  const message =
    error.response?.data?.message ??
    (error.code === "ECONNABORTED" ? "The request timed out" : "API request failed")

  return Promise.reject(new Error(message))
}

httpClient.interceptors.response.use((response) => response, normalizeAxiosError)
appClient.interceptors.response.use((response) => {
  redirectOnUnauthorized(response.status)
  return response
}, normalizeAxiosError)

export async function apiRequest<T>(
  path: string,
  config: AxiosRequestConfig = {},
): Promise<ApiResponse<T>> {
  const normalized = path.startsWith("/") ? path : `/${path}`
  const response = await httpClient.request<ApiResponse<T>>({
    url: normalized,
    ...config,
  })
  return response.data
}

export type ApiFetchResponse = {
  ok: boolean
  status: number
  json<T = { message: string; data: Record<string, string> }>(): Promise<T>
}

/** Response-style adapter for forms that render backend validation errors inline. */
export async function apiResponseRequest(
  endpoint: string,
  init: RequestInit = {},
): Promise<ApiFetchResponse> {
  const url = endpoint.startsWith("/api/auth")
    ? endpoint
    : `/api/backend${endpoint.startsWith("/api/backend") ? endpoint.slice(12) : endpoint}`
  const response = await appClient.request({
    url,
    method: init.method ?? "GET",
    headers: init.headers as AxiosRequestConfig["headers"],
    data: init.body,
    signal: init.signal ?? undefined,
    validateStatus: () => true,
  })

  return {
    ok: response.status >= 200 && response.status < 300,
    status: response.status,
    async json<T>() {
      return response.data as T
    },
  }
}
