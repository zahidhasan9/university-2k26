"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircle, Undo2 } from "lucide-react"
import { Button } from "@/components/ui/button"
export function ReturnBook({ id }: { id: string }) {
  const router = useRouter(), [loading, setLoading] = useState(false)
  async function returnBook() { const condition = prompt("Return condition: new, good, fair, or damaged", "good"); if (!condition || !["new", "good", "fair", "damaged"].includes(condition)) return; const note = prompt("Optional return note:"); if (note === null) return; setLoading(true); const response = await fetch(`/api/backend/library/transactions/${id}/return`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ condition, ...(note.trim() ? { note: note.trim() } : {}) }) }); setLoading(false); if (response.ok) router.refresh() }
  return <Button size="sm" variant="outline" disabled={loading} onClick={returnBook}>{loading ? <LoaderCircle className="animate-spin" /> : <Undo2 />}Return</Button>
}
