import { NextResponse } from "next/server"

import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth"
import { API_URL, type ApiResponse } from "@/lib/api"

type RefreshData = {
  accessToken: string
}

const ACCESS_TOKEN_MAX_AGE = 15 * 60
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60

function readRefreshToken(request: Request) {
  return request.headers.get("cookie")?.match(/(?:^|;\s*)unisphere_refresh_proxy=([^;]+)/)?.[1]
}

function clearSession(response: NextResponse) {
  response.cookies.delete(ACCESS_COOKIE)
  response.cookies.delete(REFRESH_COOKIE)
  return response
}

export async function POST(request: Request) {
  const refreshToken = readRefreshToken(request)
  if (!refreshToken) {
    return clearSession(
      NextResponse.json(
        { success: false, message: "Authentication session expired", data: null },
        { status: 401 },
      ),
    )
  }

  try {
    const upstream = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { Cookie: `unisphere_refresh=${refreshToken}` },
      cache: "no-store",
    })
    const body = (await upstream.json()) as ApiResponse<RefreshData>

    if (!upstream.ok) {
      return clearSession(NextResponse.json(body, { status: upstream.status }))
    }

    const rotatedRefreshToken = upstream.headers
      .get("set-cookie")
      ?.match(/(?:^|,\s*)unisphere_refresh=([^;]+)/)?.[1]

    if (!rotatedRefreshToken) {
      return clearSession(
        NextResponse.json(
          { success: false, message: "Authentication session could not be renewed", data: null },
          { status: 502 },
        ),
      )
    }

    const secure = process.env.NODE_ENV === "production"
    const response = NextResponse.json({
      success: true,
      message: body.message,
      data: null,
    })

    response.cookies.set(ACCESS_COOKIE, body.data.accessToken, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: ACCESS_TOKEN_MAX_AGE,
    })
    response.cookies.set(REFRESH_COOKIE, decodeURIComponent(rotatedRefreshToken), {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/api/auth",
      maxAge: REFRESH_TOKEN_MAX_AGE,
    })

    return response
  } catch {
    return NextResponse.json(
      { success: false, message: "The authentication service is unavailable", data: null },
      { status: 503 },
    )
  }
}
