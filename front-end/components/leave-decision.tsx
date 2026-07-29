"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, LoaderCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export function LeaveDecision({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState("")
  async function decide(decision: "approve" | "reject") {
    const note = window.prompt(decision === "approve" ? "Optional approval note:" : "Reason for rejection:")
    if (note === null) return
    setLoading(decision)
    const response = await fetch(`/api/backend/hr/leaves/${id}/decision`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, ...(note.trim() ? { note: note.trim() } : {}) }),
    })
    setLoading("")
    if (response.ok) router.refresh()
  }
  return <div className="flex justify-end gap-1"><Button size="icon-sm" variant="ghost" className="text-emerald-700" disabled={Boolean(loading)} onClick={() => decide("approve")}>{loading === "approve" ? <LoaderCircle className="animate-spin" /> : <Check />}</Button><Button size="icon-sm" variant="ghost" className="text-rose-700" disabled={Boolean(loading)} onClick={() => decide("reject")}>{loading === "reject" ? <LoaderCircle className="animate-spin" /> : <X />}</Button></div>
}
