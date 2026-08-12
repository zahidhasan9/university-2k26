"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircle, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiResponseRequest } from "@/lib/http-client"
import { API_ENDPOINTS } from "@/lib/api-endpoints"
import { RemoteSelect } from "@/components/remote-select"

type Student = { _id: string; studentId: string; user: { firstName: string; lastName: string } }
const selectClass = "h-9 w-full rounded-lg border bg-background px-3 text-sm"

export function WaiverForm({ initialStudent }: { initialStudent?: Student }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [waiverType, setWaiverType] = useState("percentage")
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = new FormData(event.currentTarget); const type = String(form.get("type")); setLoading(true); setError("")
    const response = await apiResponseRequest(API_ENDPOINTS.finance.waivers, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ studentId: form.get("studentId"), name: form.get("name"), type, value: type === "fixed" ? Math.round(Number(form.get("value")) * 100) : Number(form.get("value")), currency: form.get("currency"), appliesTo: form.get("appliesTo"), reason: form.get("reason"), validFrom: form.get("validFrom"), validUntil: form.get("validUntil") }) })
    const body = await response.json<{ message?: string }>(); setLoading(false)
    if (!response.ok) return setError(body.message || "Waiver could not be saved")
    router.push(initialStudent ? `/dashboard/students/${initialStudent._id}/edit` : "/dashboard/finance"); router.refresh()
  }
  return <form onSubmit={submit} className="space-y-4">
    <div><Label>Student</Label><RemoteSelect name="studentId" endpoint={API_ENDPOINTS.students.list} placeholder="Search by ID, name, or email" initialOption={initialStudent ? { _id: initialStudent._id, label: `${initialStudent.studentId} · ${initialStudent.user.firstName} ${initialStudent.user.lastName}` } : undefined} mapOption={(item) => { const user = item.user as Student["user"]; return { _id: String(item._id), label: `${String(item.studentId)} · ${user.firstName} ${user.lastName}` } }} /></div>
    <div><Label>Name</Label><Input name="name" placeholder="Merit scholarship" required /></div>
    <div className="grid gap-4 sm:grid-cols-2"><div><Label>Waiver type</Label><select name="type" className={selectClass} value={waiverType} onChange={(event) => setWaiverType(event.target.value)}><option value="percentage">Percentage</option><option value="fixed">Fixed amount</option></select></div><div><Label>{waiverType === "percentage" ? "Percentage" : "Amount"}</Label><Input name="value" type="number" min={0} max={waiverType === "percentage" ? 100 : undefined} step={0.01} required /></div></div>
    <div><Label>Currency</Label><select name="currency" className={selectClass} defaultValue="BDT" disabled={waiverType === "percentage"}><option value="BDT">BDT</option><option value="USD">USD</option><option value="GBP">GBP</option></select>{waiverType === "percentage" && <input type="hidden" name="currency" value="BDT" />}</div>
    <div><Label>Applies to</Label><select name="appliesTo" className={selectClass}><option value="tuition">Tuition only</option><option value="all">Entire invoice</option></select></div>
    <div><Label>Reason</Label><Input name="reason" required /></div>
    <div className="grid gap-4 sm:grid-cols-2"><div><Label>Valid from</Label><Input name="validFrom" type="date" required /></div><div><Label>Valid until</Label><Input name="validUntil" type="date" required /></div></div>
    {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    <Button type="submit" disabled={loading}>{loading ? <LoaderCircle className="animate-spin" /> : <Save />} Save waiver</Button>
  </form>
}
