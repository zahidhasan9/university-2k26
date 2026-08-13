"use client"
import { FormEvent, useEffect, useState } from "react"
import { CheckCircle2, LoaderCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { API_ENDPOINTS } from "@/lib/api-endpoints"
import { apiResponseRequest } from "@/lib/http-client"
function getDeviceId() { const key = "unisphere_attendance_device"; let value = localStorage.getItem(key); if (!value) { value = crypto.randomUUID(); localStorage.setItem(key, value) } return value }
export function StudentAttendanceCheckIn() {
  const [device, setDevice] = useState(""); const [loading, setLoading] = useState(false); const [message, setMessage] = useState(""); const [error, setError] = useState("")
  useEffect(() => setDevice(getDeviceId()), [])
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const form = new FormData(event.currentTarget); setLoading(true); setError(""); setMessage(""); const response = await apiResponseRequest(API_ENDPOINTS.attendance.checkIn, { method: "POST", headers: { "Content-Type": "application/json", "X-Attendance-Device": device }, body: JSON.stringify({ sessionId: form.get("sessionId"), token: form.get("token") }) }); const body = await response.json(); setLoading(false); if (!response.ok) return setError(body.message); setMessage(body.message) }
  return <Card><CardHeader className="border-b"><CardTitle>Class self check-in</CardTitle><p className="text-sm text-muted-foreground">Enter the session ID and temporary token shown by your teacher.</p></CardHeader><CardContent><form onSubmit={submit} className="grid gap-4 md:grid-cols-[1fr_2fr_auto] md:items-end"><div className="space-y-2"><Label htmlFor="sessionId">Session ID</Label><Input id="sessionId" name="sessionId" required /></div><div className="space-y-2"><Label htmlFor="token">Attendance token</Label><Input id="token" name="token" required /></div><Button disabled={loading || !device}>{loading ? <LoaderCircle className="animate-spin" /> : <CheckCircle2 />} Check in</Button></form>{message && <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}{error && <p className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}</CardContent></Card>
}
