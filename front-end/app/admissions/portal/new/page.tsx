import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { AdmissionApplicationForm } from "@/components/admission-application-form"
import { Button } from "@/components/ui/button"
import type { AdmissionOptions } from "@/lib/admission-types"
import { API_ENDPOINTS } from "@/lib/api-endpoints"
import { authenticatedRequest } from "@/lib/auth"

export const metadata: Metadata = { title: "New admission application" }

export default async function NewAdmissionApplicationPage() {
  const options = (await authenticatedRequest<AdmissionOptions>(API_ENDPOINTS.admissions.options)).data
  return <main className="mx-auto max-w-5xl space-y-7 px-5 py-10"><div><Button variant="ghost" className="mb-4" render={<Link href="/admissions/portal" />}><ArrowLeft /> My applications</Button><h1 className="text-3xl font-bold tracking-tight">New application</h1><p className="mt-2 text-muted-foreground">Complete the required information, then save it as a draft before submission.</p></div><AdmissionApplicationForm options={options} /></main>
}
