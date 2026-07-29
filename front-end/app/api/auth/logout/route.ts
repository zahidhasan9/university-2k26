import { NextResponse } from "next/server"

import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth"
import { API_URL } from "@/lib/api"

export async function POST(request: Request) {
  const refreshToken = request.headers
    .get("cookie")
    ?.match(/(?:^|;\s*)unisphere_refresh_proxy=([^;]+)/)?.[1]
  if (refreshToken) {
    await fetch(`${API_URL}/auth/logout`, {
      method: "POST",
      headers: { Cookie: `unisphere_refresh=${refreshToken}` },
      cache: "no-store",
    }).catch(() => undefined)
  }
  const response = NextResponse.json({ success: true, message: "Signed out", data: null })
  response.cookies.delete(ACCESS_COOKIE)
  response.cookies.delete(REFRESH_COOKIE)
  return response
}
