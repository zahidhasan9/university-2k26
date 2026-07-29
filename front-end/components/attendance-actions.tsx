"use client"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, LoaderCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
export function AttendanceActions({ id, status }: { id: string; status: string }) {
  const router = useRouter(), [loading, setLoading] = useState(false)
  async function close() { if (!confirm("Close this session? Unmarked enrolled students will be recorded absent.")) return; setLoading(true); const response = await fetch(`/api/backend/attendance/${id}/close`, { method: "POST" }); setLoading(false); if (response.ok) router.refresh() }
  return <div className="flex justify-end gap-1"><Button variant="ghost" size="sm" render={<Link href={`/dashboard/attendance/${id}`} />}>Records</Button>{status === "open" && <Button variant="ghost" size="icon-sm" disabled={loading} onClick={close}>{loading ? <LoaderCircle className="animate-spin" /> : <CheckCircle2 />}</Button>}</div>
}
