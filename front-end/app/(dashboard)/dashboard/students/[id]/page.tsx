import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react"
import { notFound } from "next/navigation"

import { StudentStatusBadge } from "@/components/student-status"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { authenticatedRequest } from "@/lib/auth"
import type { Student } from "@/lib/student-types"

export const metadata: Metadata = { title: "Student profile" }

function value(item?: string | number) {
  return item || <span className="text-muted-foreground">Not provided</span>
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-medium">{children}</dd>
    </div>
  )
}

export default async function StudentDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let student: Student
  try {
    student = (await authenticatedRequest<{ student: Student }>(`/students/${id}`)).data.student
  } catch (error) {
    if (error instanceof Error && error.message === "Student not found") notFound()
    throw error
  }

  const name = `${student.user.firstName} ${student.user.lastName}`
  const address = [
    student.address?.line1,
    student.address?.line2,
    student.address?.city,
    student.address?.state,
    student.address?.postalCode,
    student.address?.country,
  ]
    .filter(Boolean)
    .join(", ")

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <Button variant="ghost" render={<Link href="/dashboard/students" />}>
          <ArrowLeft /> Back to students
        </Button>
        <Button variant="outline" render={<Link href={`/dashboard/students/${id}/edit`} />}>
          <Pencil /> Edit profile
        </Button>
      </div>

      <Card className="overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-slate-950 via-blue-950 to-blue-700" />
        <CardContent className="relative px-5 pb-6 sm:px-8">
          <Avatar className="-mt-12 size-24 border-4 border-card shadow-sm">
            <AvatarFallback className="bg-blue-100 text-2xl font-bold text-blue-700">
              {student.user.firstName[0]}
              {student.user.lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div className="mt-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight">{name}</h1>
                <StudentStatusBadge status={student.status} />
              </div>
              <p className="mt-1 font-mono text-sm text-muted-foreground">{student.studentId}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">{student.program.code}</Badge>
              <Badge variant="outline">Semester {student.currentSemesterNumber}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="size-5 text-primary" /> Academic information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-6 sm:grid-cols-2">
              <Info label="Program">
                {student.program.name} ({student.program.code})
              </Info>
              <Info label="Department">{value(student.program.department?.name)}</Info>
              <Info label="Admission semester">
                {student.admissionSemester.name} · {student.admissionSemester.academicYear}
              </Info>
              <Info label="Current semester">Semester {student.currentSemesterNumber}</Info>
              <Info label="Batch">{value(student.batch)}</Info>
              <Info label="Section">{value(student.section)}</Info>
              <Info label="Record created">
                {new Intl.DateTimeFormat("en-BD", { dateStyle: "medium" }).format(
                  new Date(student.createdAt),
                )}
              </Info>
              <Info label="Account status">
                <span className="capitalize">{student.user.status}</span>
              </Info>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="size-5 text-primary" /> Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Mail className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="break-all text-sm font-medium">
                  {student.user.email.endsWith("@pending.unisphere.local")
                    ? "Not added yet"
                    : student.user.email}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Phone className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">{value(student.phone)}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <CalendarDays className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Date of birth</p>
                <p className="text-sm font-medium">
                  {student.dateOfBirth
                    ? new Intl.DateTimeFormat("en-BD", { dateStyle: "medium" }).format(
                        new Date(student.dateOfBirth),
                      )
                    : value()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" /> Guardian
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5">
              <Info label="Name">{value(student.guardian?.name)}</Info>
              <Info label="Relationship">{value(student.guardian?.relationship)}</Info>
              <Info label="Phone">{value(student.guardian?.phone)}</Info>
              <Info label="Email">{value(student.guardian?.email)}</Info>
            </dl>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="size-5 text-primary" /> Address
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-6">{value(address)}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
