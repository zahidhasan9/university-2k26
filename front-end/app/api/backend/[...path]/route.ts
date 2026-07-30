import { cookies } from "next/headers"

import { ACCESS_COOKIE } from "@/lib/auth"
import { API_URL } from "@/lib/api"

async function forward(request: Request, context: { params: Promise<{ path: string[] }> }) {
  const token = (await cookies()).get(ACCESS_COOKIE)?.value
  if (!token) {
    return Response.json(
      { success: false, message: "Authentication required", data: null },
      { status: 401 },
    )
  }
  const { path } = await context.params
  const sourceUrl = new URL(request.url)
  const target = `${API_URL}/${path.join("/")}${sourceUrl.search}`
  const hasBody = !["GET", "HEAD"].includes(request.method)
  try {
    const upstream = await fetch(target, {
      method: request.method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(request.headers.get("content-type")
          ? { "Content-Type": request.headers.get("content-type") as string }
          : {}),
      },
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
    })
    return new Response(await upstream.text(), {
      status: upstream.status,
      headers: { "Content-Type": upstream.headers.get("content-type") ?? "application/json" },
    })
  } catch {
    return Response.json(
      { success: false, message: "The backend service is unavailable", data: null },
      { status: 503 },
    )
  }
}

export const GET = forward
export const POST = forward
export const PATCH = forward
export const PUT = forward
export const DELETE = forward
