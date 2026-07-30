"use client"

import { apiResponseRequest } from "@/lib/http-client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { Check, LoaderCircle, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function ReadNotification({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  async function markRead() {
    setLoading(true)
    const response = await apiResponseRequest(`/communication/notifications/${id}/read`, {
      method: "PATCH",
    })
    setLoading(false)
    if (response.ok) router.refresh()
  }
  return (
    <Button size="sm" variant="ghost" disabled={loading} onClick={markRead}>
      {loading ? <LoaderCircle className="animate-spin" /> : <Check />}Read
    </Button>
  )
}

export function MessageComposer({ conversationId }: { conversationId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const body = new FormData(form).get("body")?.toString().trim()
    if (!body) return
    setLoading(true)
    setError("")
    const response = await apiResponseRequest(
      `/communication/conversations/${conversationId}/messages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body, attachmentUrls: [] }),
      },
    )
    const result = (await response.json().catch(() => null)) as { message?: string } | null
    setLoading(false)
    if (!response.ok) return setError(result?.message ?? "Message could not be sent")
    form.reset()
    router.refresh()
  }
  return (
    <form onSubmit={send} className="space-y-2">
      <div className="flex gap-2">
        <Input name="body" placeholder="Write a message…" autoComplete="off" />
        <Button disabled={loading} type="submit">
          {loading ? <LoaderCircle className="animate-spin" /> : <Send />}Send
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  )
}
