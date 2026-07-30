"use client"

import { apiResponseRequest } from "@/lib/http-client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircle } from "lucide-react"

import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

export function LogoutItem() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function logout() {
    setLoading(true)
    await apiResponseRequest("/api/auth/logout", { method: "POST" })
    router.replace("/login")
    router.refresh()
  }

  return (
    <DropdownMenuItem className="text-destructive" disabled={loading} onClick={logout}>
      {loading && <LoaderCircle className="animate-spin" />}
      Sign out
    </DropdownMenuItem>
  )
}
