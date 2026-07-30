import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { MessageComposer } from "@/components/communication-actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { authenticatedRequest } from "@/lib/auth"

type Person = { _id: string; firstName: string; lastName: string; email: string }
type Conversation = { _id: string; subject?: string; type: string; participants: Person[] }
type Message = {
  _id: string
  sender: Person
  body: string
  attachmentUrls: string[]
  readBy: string[]
  createdAt: string
}
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let conversation: Conversation | undefined,
    messages: Message[] = [],
    error = ""
  try {
    const [conversations, history] = await Promise.all([
      authenticatedRequest<{ conversations: Conversation[] }>("/communication/conversations"),
      authenticatedRequest<{ items: Message[] }>(
        `/communication/conversations/${id}/messages?limit=100`,
      ),
    ])
    conversation = conversations.data.conversations.find((item) => item._id === id)
    messages = history.data.items.reverse()
  } catch (cause) {
    error = cause instanceof Error ? cause.message : "Conversation unavailable"
  }
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button variant="ghost" render={<Link href="/dashboard/communication" />}>
        <ArrowLeft />
        Communication
      </Button>
      <div>
        <h1 className="text-3xl font-bold">{conversation?.subject || "Conversation"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {conversation?.participants
            .map((person) => `${person.firstName} ${person.lastName}`)
            .join(", ")}
        </p>
      </div>
      {error && <p className="rounded-xl bg-destructive/10 p-4 text-destructive">{error}</p>}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Messages</CardTitle>
            <Badge variant="outline">{conversation?.type ?? "conversation"}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="max-h-[55vh] space-y-3 overflow-y-auto rounded-xl bg-muted/30 p-4">
            {messages.length === 0 && (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No messages yet. Start the conversation below.
              </p>
            )}
            {messages.map((message) => (
              <div key={message._id} className="max-w-[85%] rounded-xl border bg-background p-3">
                <div className="flex items-center justify-between gap-6">
                  <p className="text-xs font-semibold">
                    {message.sender?.firstName} {message.sender?.lastName}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(message.createdAt).toLocaleString()}
                  </p>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm">{message.body}</p>
              </div>
            ))}
          </div>
          <MessageComposer conversationId={id} />
        </CardContent>
      </Card>
    </div>
  )
}
