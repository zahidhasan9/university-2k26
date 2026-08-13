"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"

import { Button } from "@/components/ui/button"
import { API_ENDPOINTS } from "@/lib/api-endpoints"
import { apiResponseRequest } from "@/lib/http-client"

export function ApplicantSignOut() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  return <Button variant="outline" disabled={loading} onClick={async () => { setLoading(true); await apiResponseRequest(API_ENDPOINTS.auth.proxyLogout, { method: "POST" }); router.replace("/login"); router.refresh() }}><LogOut /> Sign out</Button>
}
