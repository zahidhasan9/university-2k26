export const API_URL =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000/api"

export type ApiResponse<T> = {
  success: boolean
  message: string
  data: T
  details?: unknown
}
