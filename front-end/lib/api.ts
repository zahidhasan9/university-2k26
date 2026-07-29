export const API_URL =
  process.env.API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:5000/api"

export type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
  details?: unknown
}

export async function apiRequest<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  })
  const body = (await response.json()) as ApiResponse<T>
  if (!response.ok) throw new Error(body.message || "Request failed")
  return body
}
