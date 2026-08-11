"use client"

import { API_ENDPOINTS } from "@/lib/api-endpoints"

import { apiResponseRequest } from "@/lib/http-client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, LoaderCircle, SearchCheck, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { AdmissionStatus } from "@/lib/admission-types"

export function AdmissionActions({ id, status }: { id: string; status: AdmissionStatus }) {
  const router = useRouter()
  const [loading, setLoading] = useState("")
  const [error, setError] = useState("")

  async function send(path: string, payload: object, action: string) {
    setLoading(action)
    setError("")
    try {
      const response = await apiResponseRequest(API_ENDPOINTS.admissions.action(id, path), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const body = (await response.json()) as { message: string }
      if (!response.ok) throw new Error(body.message || "Action could not be completed")
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Action could not be completed")
    } finally {
      setLoading("")
    }
  }

  function review(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const note = String(form.get("note") ?? "").trim()
    void send("review", note ? { note } : {}, "review")
  }

  function decide(event: FormEvent<HTMLFormElement>, decision: "approve" | "reject") {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const note = String(form.get(`${decision}Note`) ?? "").trim()
    const studentId = String(form.get("studentId") ?? "").trim()
    void send(
      "decision",
      decision === "approve"
        ? { decision, studentId, ...(note ? { note } : {}) }
        : { decision, note },
      decision,
    )
  }

  if (!["submitted", "under_review"].includes(status)) {
    return (
      <div className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
        This application has reached a final state. No review actions are available.
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {status === "submitted" && (
        <form onSubmit={review} className="space-y-3">
          <div>
            <Label htmlFor="review-note">Internal review note</Label>
            <textarea
              id="review-note"
              name="note"
              maxLength={2000}
              className="mt-2 min-h-24 w-full rounded-lg border bg-background p-3 text-sm outline-none focus:ring-3 focus:ring-ring/20"
              placeholder="Optional note for the admissions team..."
            />
          </div>
          <Button type="submit" className="w-full" disabled={Boolean(loading)}>
            {loading === "review" ? <LoaderCircle className="animate-spin" /> : <SearchCheck />}
            Start application review
          </Button>
        </form>
      )}
      {status === "under_review" && (
        <div className="grid gap-6 xl:grid-cols-2">
          <form
            onSubmit={(event) => decide(event, "approve")}
            className="space-y-3 rounded-xl border border-emerald-200 bg-emerald-50/50 p-4"
          >
            <div>
              <h3 className="font-semibold text-emerald-900">Approve application</h3>
              <p className="mt-1 text-xs text-emerald-800/70">
                This creates the applicant&apos;s student profile.
              </p>
            </div>
            <div>
              <Label htmlFor="studentId">New student ID</Label>
              <Input
                id="studentId"
                name="studentId"
                className="mt-2 bg-white"
                minLength={3}
                maxLength={40}
                pattern="[A-Za-z0-9_-]+"
                required
                placeholder="e.g. CSE-2026-001"
              />
            </div>
            <div>
              <Label htmlFor="approveNote">Approval note</Label>
              <textarea
                id="approveNote"
                name="approveNote"
                maxLength={2000}
                className="mt-2 min-h-20 w-full rounded-lg border bg-white p-3 text-sm outline-none focus:ring-3 focus:ring-ring/20"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-emerald-700 hover:bg-emerald-800"
              disabled={Boolean(loading)}
            >
              {loading === "approve" ? <LoaderCircle className="animate-spin" /> : <CheckCircle2 />}{" "}
              Approve & create student
            </Button>
          </form>
          <form
            onSubmit={(event) => decide(event, "reject")}
            className="space-y-3 rounded-xl border border-rose-200 bg-rose-50/50 p-4"
          >
            <div>
              <h3 className="font-semibold text-rose-900">Reject application</h3>
              <p className="mt-1 text-xs text-rose-800/70">
                A clear reason is required for audit history.
              </p>
            </div>
            <div>
              <Label htmlFor="rejectNote">Rejection reason</Label>
              <textarea
                id="rejectNote"
                name="rejectNote"
                maxLength={2000}
                required
                className="mt-2 min-h-[142px] w-full rounded-lg border bg-white p-3 text-sm outline-none focus:ring-3 focus:ring-ring/20"
                placeholder="Explain why this application is being rejected..."
              />
            </div>
            <Button
              type="submit"
              variant="destructive"
              className="w-full"
              disabled={Boolean(loading)}
            >
              {loading === "reject" ? <LoaderCircle className="animate-spin" /> : <XCircle />}{" "}
              Reject application
            </Button>
          </form>
        </div>
      )}
      {error && (
        <p role="alert" className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}
