"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircle, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"

export function EndAllocation({ id, type }: { id: string; type: "hostel" | "transport" }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  async function end() {
    if (!confirm(`End this ${type} allocation?`)) return
    setLoading(true)
    const response = await fetch(`/api/backend/facilities/${type}-allocations/${id}/end`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endsAt: new Date().toISOString() }),
    })
    setLoading(false)
    if (response.ok) router.refresh()
  }
  return <Button size="sm" variant="outline" disabled={loading} onClick={end}>{loading ? <LoaderCircle className="animate-spin" /> : <LogOut />}End</Button>
}
