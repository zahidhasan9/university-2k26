"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircle, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"

export function UserStatusAction({ id, status }: { id: string; status: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  async function update() {
    const next = status === "active" ? "suspended" : "active"
    if (!confirm(`${next === "active" ? "Activate" : "Suspend"} this user? Active sessions may be revoked.`)) return
    setLoading(true)
    const response = await fetch(`/api/backend/users/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) })
    const result = await response.json().catch(() => null) as { message?: string } | null
    setLoading(false)
    if (!response.ok) return alert(result?.message ?? "Status update failed")
    router.refresh()
  }
  return <Button size="sm" variant="outline" disabled={loading} onClick={update}>{loading ? <LoaderCircle className="animate-spin" /> : <ShieldAlert />}{status === "active" ? "Suspend" : "Activate"}</Button>
}
