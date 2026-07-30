"use client"

import { apiResponseRequest } from "@/lib/http-client"
import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
type Kind =
  | "material"
  | "assignment"
  | "discussion"
  | "project"
  | "publication"
  | "thesis"
  | "complaint"
  | "alumni"
export function PortalForm({ kind }: { kind: Kind }) {
  const router = useRouter(),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("")
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const v = Object.fromEntries(new FormData(e.currentTarget).entries()) as Record<string, string>
    const csv = (x: string) =>
      x
        ?.split(",")
        .map((i) => i.trim())
        .filter(Boolean) ?? []
    let endpoint = "",
      p: Record<string, unknown> = {}
    if (kind === "material") {
      endpoint = "lms/materials"
      p = {
        offeringId: v.offeringId,
        title: v.title,
        description: v.description || undefined,
        type: v.type,
        url: v.url,
        order: Number(v.order),
        published: v.published === "true",
      }
    }
    if (kind === "assignment") {
      endpoint = "lms/assignments"
      p = {
        offeringId: v.offeringId,
        title: v.title,
        instructions: v.instructions,
        attachmentUrls: [],
        dueAt: new Date(v.dueAt).toISOString(),
        maxScore: Number(v.maxScore),
        published: v.published === "true",
      }
    }
    if (kind === "discussion") {
      endpoint = "lms/discussions"
      p = { offeringId: v.offeringId, title: v.title || undefined, body: v.body }
    }
    if (kind === "project") {
      endpoint = "research/projects"
      p = {
        code: v.code,
        title: v.title,
        abstract: v.abstract,
        leadResearcherId: v.leadResearcherId,
        memberUserIds: csv(v.memberUserIds),
        startsAt: new Date(v.startsAt).toISOString(),
        ...(v.endsAt ? { endsAt: new Date(v.endsAt).toISOString() } : {}),
        ...(v.fundingSource
          ? {
              funding: {
                source: v.fundingSource,
                amountMinor: Math.round(Number(v.fundingAmount) * 100),
                currency: v.currency || "BDT",
              },
            }
          : {}),
      }
    }
    if (kind === "publication") {
      endpoint = "research/publications"
      p = {
        title: v.title,
        type: v.type,
        authorTeacherIds: csv(v.authorTeacherIds),
        projectId: v.projectId || undefined,
        venue: v.venue || undefined,
        doi: v.doi || undefined,
        url: v.url || undefined,
        publishedAt: new Date(v.publishedAt).toISOString(),
        status: v.status,
      }
    }
    if (kind === "thesis") {
      endpoint = "research/theses/propose"
      p = {
        title: v.title,
        abstract: v.abstract,
        supervisorId: v.supervisorId,
        coSupervisorIds: csv(v.coSupervisorIds),
      }
    }
    if (kind === "complaint") {
      endpoint = "engagement/complaints"
      p = {
        category: v.category,
        subject: v.subject,
        description: v.description,
        attachmentUrls: [],
        priority: v.priority,
      }
    }
    if (kind === "alumni") {
      endpoint = "engagement/alumni/register"
      p = {
        graduationYear: Number(v.graduationYear),
        currentOrganization: v.currentOrganization || undefined,
        jobTitle: v.jobTitle || undefined,
        location: v.location || undefined,
        linkedInUrl: v.linkedInUrl || undefined,
        bio: v.bio || undefined,
        directoryVisible: v.directoryVisible === "true",
      }
    }
    setLoading(true)
    setError("")
    const r = await apiResponseRequest(`/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p),
    })
    const b = (await r.json().catch(() => null)) as { message?: string } | null
    setLoading(false)
    if (!r.ok) return setError(b?.message ?? "Operation failed")
    router.push(
      `/dashboard/${kind === "project" || kind === "publication" || kind === "thesis" ? "research" : kind === "complaint" || kind === "alumni" ? "engagement" : "lms"}`,
    )
    router.refresh()
  }
  const fs = fields[kind]
  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {fs.map((f) => (
          <div key={f.name} className={`space-y-2 ${f.long ? "sm:col-span-2" : ""}`}>
            <Label htmlFor={f.name}>{f.label}</Label>
            {f.long ? (
              <textarea
                id={f.name}
                name={f.name}
                required={f.required !== false}
                className="min-h-28 w-full rounded-md border bg-transparent px-3 py-2 text-sm"
              />
            ) : (
              <Input
                id={f.name}
                name={f.name}
                type={f.type}
                placeholder={f.placeholder}
                required={f.required !== false}
              />
            )}
          </div>
        ))}
      </div>
      {error && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      )}
      <Button disabled={loading}>
        {loading && <LoaderCircle className="animate-spin" />}Save record
      </Button>
    </form>
  )
}
type F = {
  name: string
  label: string
  type?: string
  placeholder?: string
  required?: boolean
  long?: boolean
}
const fields: Record<Kind, F[]> = {
  material: [
    { name: "offeringId", label: "Course offering ID" },
    { name: "title", label: "Title" },
    { name: "type", label: "Type", placeholder: "document" },
    { name: "url", label: "Resource URL", type: "url" },
    { name: "order", label: "Display order", type: "number" },
    { name: "published", label: "Published (true/false)", placeholder: "false" },
    { name: "description", label: "Description", required: false, long: true },
  ],
  assignment: [
    { name: "offeringId", label: "Course offering ID" },
    { name: "title", label: "Title" },
    { name: "dueAt", label: "Due at", type: "datetime-local" },
    { name: "maxScore", label: "Maximum score", type: "number" },
    { name: "published", label: "Published (true/false)", placeholder: "false" },
    { name: "instructions", label: "Instructions", long: true },
  ],
  discussion: [
    { name: "offeringId", label: "Course offering ID" },
    { name: "title", label: "Topic title", required: false },
    { name: "body", label: "Post", long: true },
  ],
  project: [
    { name: "code", label: "Project code" },
    { name: "title", label: "Title" },
    { name: "leadResearcherId", label: "Lead teacher ID" },
    { name: "memberUserIds", label: "Member user IDs", required: false },
    { name: "startsAt", label: "Start date", type: "date" },
    { name: "endsAt", label: "End date", type: "date", required: false },
    { name: "fundingSource", label: "Funding source", required: false },
    { name: "fundingAmount", label: "Funding amount (BDT)", type: "number", required: false },
    { name: "currency", label: "Currency", placeholder: "BDT", required: false },
    { name: "abstract", label: "Abstract", long: true },
  ],
  publication: [
    { name: "title", label: "Title" },
    { name: "type", label: "Type", placeholder: "journal" },
    { name: "authorTeacherIds", label: "Author teacher IDs" },
    { name: "projectId", label: "Project ID", required: false },
    { name: "venue", label: "Venue", required: false },
    { name: "doi", label: "DOI", required: false },
    { name: "url", label: "URL", type: "url", required: false },
    { name: "publishedAt", label: "Publication date", type: "date" },
    { name: "status", label: "Status", placeholder: "published" },
  ],
  thesis: [
    { name: "title", label: "Thesis title" },
    { name: "supervisorId", label: "Supervisor teacher ID" },
    { name: "coSupervisorIds", label: "Co-supervisor IDs", required: false },
    { name: "abstract", label: "Abstract", long: true },
  ],
  complaint: [
    { name: "category", label: "Category", placeholder: "academic" },
    { name: "subject", label: "Subject" },
    { name: "priority", label: "Priority", placeholder: "normal" },
    { name: "description", label: "Description", long: true },
  ],
  alumni: [
    { name: "graduationYear", label: "Graduation year", type: "number" },
    { name: "currentOrganization", label: "Organization", required: false },
    { name: "jobTitle", label: "Job title", required: false },
    { name: "location", label: "Location", required: false },
    { name: "linkedInUrl", label: "LinkedIn URL", type: "url", required: false },
    { name: "directoryVisible", label: "Directory visible (true/false)", placeholder: "false" },
    { name: "bio", label: "Bio", required: false, long: true },
  ],
}
