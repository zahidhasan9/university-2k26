import { NextResponse } from "next/server"

import { ACCESS_COOKIE, REFRESH_COOKIE } from "@/lib/auth"
import { API_URL, type ApiResponse } from "@/lib/api"

type LoginData = {
  accessToken: string
  user: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
}

export async function POST(request: Request) {
  try {
    const upstream = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
      cache: "no-store",
    })
    const body = (await upstream.json()) as ApiResponse<LoginData>
    if (!upstream.ok) return NextResponse.json(body, { status: upstream.status })

    const refreshToken = upstream.headers
      .get("set-cookie")
      ?.match(/(?:^|,\s*)unisphere_refresh=([^;]+)/)?.[1]
    if (!refreshToken) {
      return NextResponse.json(
        { success: false, message: "Authentication session could not be created", data: null },
        { status: 502 },
      )
    }

    const response = NextResponse.json({
      success: true,
      message: body.message,
      data: { user: body.data.user },
    })
    const secure = process.env.NODE_ENV === "production"
    response.cookies.set(ACCESS_COOKIE, body.data.accessToken, {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    })
    response.cookies.set(REFRESH_COOKIE, decodeURIComponent(refreshToken), {
      httpOnly: true,
      secure,
      sameSite: "lax",
      path: "/api/auth",
      maxAge: 7 * 24 * 60 * 60,
    })
    return response
  } catch {
    return NextResponse.json(
      { success: false, message: "The authentication service is unavailable", data: null },
      { status: 503 },
    )
  }
}
