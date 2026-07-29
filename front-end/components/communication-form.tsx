"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useApi } from "@/components/api-provider"

export function CommunicationForm({ kind }: { kind: "notice" | "conversation" | "notification" }) {
  const router = useRouter()
  const { request } = useApi()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<string, string>
    let endpoint = "communication/notices"
    let payload: Record<string, unknown> = {}
    if (kind === "notice") payload = { title: values.title, body: values.body, category: values.category, audienceRoleIds: values.audienceRoleIds ? values.audienceRoleIds.split(",").map(v => v.trim()).filter(Boolean) : [], attachmentUrls: [], publishAt: new Date(values.publishAt).toISOString(), ...(values.expiresAt ? { expiresAt: new Date(values.expiresAt).toISOString() } : {}), status: values.status }
    if (kind === "conversation") { endpoint = "communication/conversations"; payload = { subject: values.subject || undefined, type: values.type, participantUserIds: values.participantUserIds.split(",").map(v => v.trim()).filter(Boolean) } }
    if (kind === "notification") { endpoint = "communication/notifications/dispatch"; payload = { userId: values.userId, channel: values.channel, recipient: values.recipient || undefined, type: values.type, title: values.title, body: values.body } }
    setLoading(true); setError("")
    let conversationId: string | undefined
    try {
      const result = await request<{ conversation?: { _id?: string } }>(endpoint, { method: "POST", body: payload })
      conversationId = result.data.conversation?._id
    } catch (cause) {
      setLoading(false)
      return setError(cause instanceof Error ? cause.message : "The operation could not be completed")
    }
    setLoading(false)
    router.push(conversationId ? `/dashboard/communication/conversations/${conversationId}` : "/dashboard/communication")
    router.refresh()
  }
  return <form onSubmit={submit} className="space-y-5"><div className="grid gap-4 sm:grid-cols-2">{kind === "notice" && <><Field name="title" label="Title" /><Field name="category" label="Category" placeholder="general" /><Field name="publishAt" label="Publish at" type="datetime-local" /><Field name="expiresAt" label="Expires at (optional)" type="datetime-local" required={false} /><Field name="audienceRoleIds" label="Audience role IDs (comma separated)" required={false} /><Field name="status" label="Status (draft or published)" placeholder="draft" /><TextField name="body" label="Notice body" /></>}{kind === "conversation" && <><Field name="subject" label="Subject (optional)" required={false} /><Field name="type" label="Type (direct or group)" placeholder="direct" /><Field name="participantUserIds" label="Participant user IDs (comma separated)" /></>}{kind === "notification" && <><Field name="userId" label="User ID" /><Field name="channel" label="Channel (email or sms)" placeholder="email" /><Field name="recipient" label="Recipient (optional for email)" required={false} /><Field name="type" label="Notification type" placeholder="account.update" /><Field name="title" label="Title" /><TextField name="body" label="Message body" /></>}</div>{error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}<Button type="submit" disabled={loading}>{loading && <LoaderCircle className="animate-spin" />}{kind === "conversation" ? "Start conversation" : kind === "notice" ? "Save notice" : "Queue notification"}</Button></form>
}
function Field({ name, label, type, placeholder, required = true }: { name: string; label: string; type?: string; placeholder?: string; required?: boolean }) { return <div className="space-y-2"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} type={type} placeholder={placeholder} required={required} /></div> }
function TextField({ name, label }: { name: string; label: string }) { return <div className="space-y-2 sm:col-span-2"><Label htmlFor={name}>{label}</Label><textarea id={name} name={name} required className="min-h-32 w-full rounded-md border bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/50" /></div> }
