import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { notFound } from "next/navigation"

import { AdmissionApplicationForm } from "@/components/admission-application-form"
import { Button } from "@/components/ui/button"
import type { Admission, AdmissionOptions } from "@/lib/admission-types"
import { API_ENDPOINTS } from "@/lib/api-endpoints"
import { authenticatedRequest } from "@/lib/auth"

export const metadata: Metadata = { title: "Edit admission application" }

export default async function EditAdmissionApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [detail, options] = await Promise.all([authenticatedRequest<{ application: Admission }>(API_ENDPOINTS.admissions.detail(id)), authenticatedRequest<AdmissionOptions>(API_ENDPOINTS.admissions.options)])
  if (detail.data.application.status !== "draft") notFound()
  return <main className="mx-auto max-w-5xl space-y-7 px-5 py-10"><div><Button variant="ghost" className="mb-4" render={<Link href={`/admissions/portal/${id}`} />}><ArrowLeft /> Application overview</Button><h1 className="text-3xl font-bold tracking-tight">Edit application draft</h1><p className="mt-2 text-muted-foreground">Update your information before submitting it for review.</p></div><AdmissionApplicationForm options={options.data} application={detail.data.application} /></main>
}
