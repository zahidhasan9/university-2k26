import { API_ENDPOINTS, withQuery } from "@/lib/api-endpoints"
import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowLeft,
  BookOpen,
  ExternalLink,
  FileCheck2,
  GraduationCap,
  Mail,
  MessageSquareQuote,
  UserRound,
} from "lucide-react"
import { notFound } from "next/navigation"

import { AdmissionActions } from "@/components/admission-actions"
import { AdmissionStatusBadge } from "@/components/admission-status"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Admission } from "@/lib/admission-types"
import { authenticatedRequest } from "@/lib/auth"

export const metadata: Metadata = { title: "Admission application" }

export default async function AdmissionDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  let application: Admission
  try {
    application = (await authenticatedRequest<{ application: Admission }>(API_ENDPOINTS.admissions.detail(id))).data
      .application
  } catch (error) {
    if (error instanceof Error && error.message === "Admission application not found") notFound()
    throw error
  }
  const applicantName = `${application.applicant.firstName} ${application.applicant.lastName}`
  type BatchOption = { _id: string; code: string; name: string; curriculumVersion: string }
  const batches = application.status === "under_review"
    ? (await authenticatedRequest<{ items: BatchOption[] }>(withQuery(API_ENDPOINTS.academics.batches, {
        programId: application.program._id,
        status: "active",
        limit: 100,
      }))).data.items
    : []

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Button variant="ghost" render={<Link href="/dashboard/admissions" />}>
        <ArrowLeft /> Back to admissions
      </Button>
      <Card>
        <CardContent className="flex flex-col justify-between gap-5 p-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              <AvatarFallback className="bg-violet-100 font-bold text-violet-700">
                {application.applicant.firstName[0]}
                {application.applicant.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold">{applicantName}</h1>
                <AdmissionStatusBadge status={application.status} />
              </div>
              <p className="mt-1 font-mono text-xs text-muted-foreground">
                {application.applicationNumber}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary">{application.program.code}</Badge>
            <Badge variant="outline">
              {application.intakeSemester.name} {application.intakeSemester.academicYear}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="size-5 text-primary" /> Education history
              </CardTitle>
            </CardHeader>
            <CardContent>
              {application.previousEducation.length ? (
                <div className="space-y-3">
                  {application.previousEducation.map((education, index) => (
                    <div
                      key={`${education.institution}-${index}`}
                      className="grid gap-2 rounded-xl border p-4 sm:grid-cols-[1fr_auto]"
                    >
                      <div>
                        <p className="font-medium">{education.institution}</p>
                        <p className="text-sm text-muted-foreground">{education.level}</p>
                      </div>
                      <div className="sm:text-right">
                        <p className="text-sm font-medium">{education.result}</p>
                        <p className="text-xs text-muted-foreground">
                          Passed {education.passingYear}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No previous education information provided.
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquareQuote className="size-5 text-primary" /> Personal statement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-7">
                {application.statement || (
                  <span className="text-muted-foreground">No personal statement provided.</span>
                )}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck2 className="size-5 text-primary" /> Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {application.documents.length ? (
                <div className="grid gap-3 sm:grid-cols-2">
                  {application.documents.map((document) => (
                    <a
                      key={document._id}
                      href={document.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-xl border p-4 text-sm font-medium hover:bg-muted"
                    >
                      {document.type}
                      <ExternalLink className="size-4 text-muted-foreground" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No documents attached.</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Review decision</CardTitle>
            </CardHeader>
            <CardContent>
              <AdmissionActions id={application._id} status={application.status} batches={batches} />
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="size-5 text-primary" /> Applicant
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Full name</p>
                <p className="mt-1 text-sm font-medium">{applicantName}</p>
              </div>
              <div className="flex gap-2">
                <Mail className="mt-0.5 size-4 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="break-all text-sm font-medium">{application.applicant.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="size-5 text-primary" /> Application
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-xs text-muted-foreground">Program</p>
                <p className="mt-1 text-sm font-medium">{application.program.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Intake</p>
                <p className="mt-1 text-sm font-medium">
                  {application.intakeSemester.name} · {application.intakeSemester.academicYear}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="mt-1 text-sm font-medium">
                  {new Intl.DateTimeFormat("en-BD", { dateStyle: "medium" }).format(
                    new Date(application.createdAt),
                  )}
                </p>
              </div>
              {application.reviewedBy && (
                <div>
                  <p className="text-xs text-muted-foreground">Reviewed by</p>
                  <p className="mt-1 text-sm font-medium">
                    {application.reviewedBy.firstName} {application.reviewedBy.lastName}
                  </p>
                </div>
              )}
              {application.reviewNote && (
                <div>
                  <p className="text-xs text-muted-foreground">Review note</p>
                  <p className="mt-1 text-sm leading-6">{application.reviewNote}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
