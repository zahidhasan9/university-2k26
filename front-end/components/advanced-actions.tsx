"use client"

import { CheckCircle2, LoaderCircle, ShieldCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import { type FormEvent, useState } from "react"

import { Button } from "@/components/ui/button"
import { ActionDialog } from "@/components/ui/action-dialog"
import { Input } from "@/components/ui/input"
import { errorMessage, useEndpointMutation } from "@/lib/api-hooks"
import { API_ENDPOINTS } from "@/lib/api-endpoints"

type ThesisActionName = "approve" | "reject" | "start" | "complete_revision"

export function AssignmentSubmit({ id }: { id: string }) {
  return (
    <InlinePost
      endpoint={API_ENDPOINTS.lms.submitAssignment(id)}
      field="text"
      placeholder="Submission text"
      label="Submit assignment"
      transform={(text) => ({ text, attachmentUrls: [] })}
    />
  )
}

export function GradeSubmission({ id }: { id: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")
  const mutation = useEndpointMutation(API_ENDPOINTS.lms.gradeSubmission(id), {
    method: "PATCH",
  })

  async function grade(values: Record<string, string>) {
    setError("")
    try {
      await mutation.mutateAsync({
        score: Number(values.score),
        feedback: values.feedback.trim() || undefined,
      })
      setOpen(false)
      router.refresh()
    } catch (cause) {
      setError(errorMessage(cause, "Grading failed"))
    }
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <CheckCircle2 />
        Grade
      </Button>
      <ActionDialog
        open={open}
        title="Grade submission"
        confirmLabel="Save grade"
        pending={mutation.isPending}
        error={error}
        fields={[
          { name: "score", label: "Score", required: true, placeholder: "Enter score" },
          { name: "feedback", label: "Feedback", placeholder: "Optional feedback" },
        ]}
        onClose={() => setOpen(false)}
        onConfirm={grade}
      />
    </>
  )
}

export function ThesisAction({ id, action }: { id: string; action: ThesisActionName }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")
  const mutation = useEndpointMutation(API_ENDPOINTS.research.thesisAction(id))

  async function run() {
    setError("")
    try {
      await mutation.mutateAsync({ action })
      setOpen(false)
      router.refresh()
    } catch (cause) {
      setError(errorMessage(cause, "Action failed"))
    }
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <ShieldCheck />
        {action.replace("_", " ")}
      </Button>
      <ActionDialog
        open={open}
        title={`${action.replace("_", " ")} this thesis?`}
        confirmLabel={action.replace("_", " ")}
        destructive={action === "reject"}
        pending={mutation.isPending}
        error={error}
        onClose={() => setOpen(false)}
        onConfirm={run}
      />
    </>
  )
}

export function ComplaintAction({ id, status }: { id: string; status: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [error, setError] = useState("")
  const mutation = useEndpointMutation(API_ENDPOINTS.engagement.complaintAction(id))

  async function run(values: Record<string, string>) {
    const action =
      status === "submitted" ? "start_review" : status === "under_review" ? "resolve" : "close"

    setError("")
    try {
      await mutation.mutateAsync({
        action,
        assignedToUserId: values.assignedToUserId || undefined,
        resolution: values.resolution || undefined,
      })
      setOpen(false)
      router.refresh()
    } catch (cause) {
      setError(errorMessage(cause, "Action failed"))
    }
  }

  const action =
    status === "submitted" ? "start_review" : status === "under_review" ? "resolve" : "close"
  const label = status === "submitted" ? "Review" : status === "under_review" ? "Resolve" : "Close"
  const fields =
    action === "start_review"
      ? [{ name: "assignedToUserId", label: "Assignee user ID", required: true }]
      : action === "resolve"
        ? [{ name: "resolution", label: "Resolution", required: true }]
        : []

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        disabled={status === "closed"}
        onClick={() => setOpen(true)}
      >
        <CheckCircle2 />
        {label}
      </Button>
      <ActionDialog
        open={open}
        title={`${label} this complaint?`}
        confirmLabel={label}
        destructive={action === "close"}
        pending={mutation.isPending}
        error={error}
        fields={fields}
        onClose={() => setOpen(false)}
        onConfirm={run}
      />
    </>
  )
}

export function AlumniVerify({ id, status }: { id: string; status: string }) {
  const router = useRouter()
  const [error, setError] = useState("")
  const mutation = useEndpointMutation<unknown, { status: string }>(
    API_ENDPOINTS.engagement.alumniStatus(id),
    { method: "PATCH" },
  )

  async function run() {
    setError("")
    try {
      await mutation.mutateAsync({
        status: status === "verified" ? "suspended" : "verified",
      })
      router.refresh()
    } catch (cause) {
      setError(errorMessage(cause, "Action failed"))
    }
  }

  return (
    <div>
      <Button size="sm" variant="outline" disabled={mutation.isPending} onClick={run}>
        {mutation.isPending ? <LoaderCircle className="animate-spin" /> : <ShieldCheck />}
        {status === "verified" ? "Suspend" : "Verify"}
      </Button>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
}

function InlinePost({
  endpoint,
  field,
  placeholder,
  label,
  transform,
}: {
  endpoint: string
  field: string
  placeholder: string
  label: string
  transform: (value: string) => unknown
}) {
  const router = useRouter()
  const mutation = useEndpointMutation(endpoint)
  const [error, setError] = useState("")

  async function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const value = new FormData(form).get(field)?.toString().trim()
    if (!value) return

    setError("")
    try {
      await mutation.mutateAsync(transform(value))
      form.reset()
      router.refresh()
    } catch (cause) {
      setError(errorMessage(cause, "Action failed"))
    }
  }

  return (
    <form onSubmit={send} className="space-y-2">
      <div className="flex gap-2">
        <Input name={field} placeholder={placeholder} />
        <Button disabled={mutation.isPending}>
          {mutation.isPending && <LoaderCircle className="animate-spin" />}
          {label}
        </Button>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </form>
  )
}
