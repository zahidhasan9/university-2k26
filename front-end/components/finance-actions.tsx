"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, LoaderCircle, RotateCcw, WalletCards, X } from "lucide-react"
import { Button } from "@/components/ui/button"
export function RefundAction({ id }: { id: string }) {
  const router = useRouter(), [loading, setLoading] = useState(false)
  async function refund() { const reason = prompt("Refund reason:"); if (!reason?.trim()) return; setLoading(true); const response = await fetch(`/api/backend/finance/payments/${id}/refund`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ reason: reason.trim() }) }); setLoading(false); if (response.ok) router.refresh() }
  return <Button size="sm" variant="ghost" disabled={loading} onClick={refund}>{loading ? <LoaderCircle className="animate-spin" /> : <RotateCcw />}Refund</Button>
}
export function ExpenseAction({ id, status }: { id: string; status: string }) {
  const router = useRouter(), [loading, setLoading] = useState("")
  const actions = status === "draft" ? ["approve", "reject"] : status === "approved" ? ["mark_paid", "cancel"] : []
  async function run(action: string) { const note = prompt("Optional action note:"); if (note === null) return; setLoading(action); const response = await fetch(`/api/backend/finance/expenses/${id}/action`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, ...(note.trim() ? { note: note.trim() } : {}) }) }); setLoading(""); if (response.ok) router.refresh() }
  return <div className="flex justify-end gap-1">{actions.map((action) => <Button key={action} size="icon-sm" variant="ghost" aria-label={action} disabled={Boolean(loading)} onClick={() => run(action)}>{loading === action ? <LoaderCircle className="animate-spin" /> : action === "approve" ? <Check /> : action === "mark_paid" ? <WalletCards /> : <X />}</Button>)}</div>
}
