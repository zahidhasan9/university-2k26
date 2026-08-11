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
export function WaiverForm() {
  const router = useRouter(), [loading, setLoading] = useState(false), [error, setError] = useState("")
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget), type = String(form.get("type"))
    setLoading(true); setError("")
    const response = await apiResponseRequest(API_ENDPOINTS.finance.waivers, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId: form.get("studentId"), name: form.get("name"), type,
        value: type === "fixed" ? Math.round(Number(form.get("value")) * 100) : Number(form.get("value")),
        appliesTo: form.get("appliesTo"), reason: form.get("reason"),
        validFrom: form.get("validFrom"), validUntil: form.get("validUntil"),
      }),
    })
    const body = await response.json<{ message?: string }>(); setLoading(false)
    if (!response.ok) return setError(body.message || "Waiver could not be saved")
    router.push("/dashboard/finance"); router.refresh()
  }
  return <form onSubmit={submit} className="space-y-4">
    <div><Label>Student</Label><RemoteSelect name="studentId" endpoint={API_ENDPOINTS.students.list} placeholder="Search by ID, name, or email" mapOption={(item) => { const user = item.user as Student["user"]; return { _id: String(item._id), label: `${String(item.studentId)} · ${user.firstName} ${user.lastName}` } }} /></div>
    <div><Label>Name</Label><Input name="name" placeholder="Merit scholarship" required /></div>
    <div className="grid gap-4 sm:grid-cols-2"><div><Label>Waiver type</Label><select name="type" className={selectClass}><option value="percentage">Percentage</option><option value="fixed">Fixed amount</option></select></div><div><Label>Value</Label><Input name="value" type="number" min={0} step={0.01} required /></div></div>
    <div><Label>Applies to</Label><select name="appliesTo" className={selectClass}><option value="tuition">Tuition only</option><option value="all">Entire invoice</option></select></div>
    <div><Label>Reason</Label><Input name="reason" required /></div>
    <div className="grid gap-4 sm:grid-cols-2"><div><Label>Valid from</Label><Input name="validFrom" type="date" required /></div><div><Label>Valid until</Label><Input name="validUntil" type="date" required /></div></div>
    {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    <Button disabled={loading}>{loading ? <LoaderCircle className="animate-spin" /> : <Save />} Save waiver</Button>
  </form>
}
