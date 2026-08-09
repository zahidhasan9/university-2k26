import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Building2,
  CalendarRange,
  GraduationCap,
  Landmark,
  Network,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { academicEntities, type AcademicList } from "@/lib/academic-types"
import { authenticatedRequest } from "@/lib/auth"

export const metadata: Metadata = { title: "Academic structure" }

const icons = {
  universities: Landmark,
  faculties: Building2,
  departments: Network,
  programs: GraduationCap,
  courses: BookOpenCheck,
  semesters: CalendarRange,
}

export default async function AcademicsPage() {
  const counts = await Promise.all(
    academicEntities.map(async (entity) => {
      try {
        const response = await authenticatedRequest<AcademicList>(`/${entity.key}?limit=1`)
        return [entity.key, response.data.pagination.total] as const
      } catch {
        return [entity.key, null] as const
      }
    }),
  )

  const totalByEntity = Object.fromEntries(counts) as Record<string, number | null>
  const totalRecords = academicEntities.reduce(
    (sum, entity) => sum + (totalByEntity[entity.key] ?? 0),
    0,
  )
  const structureNodes =
    (totalByEntity.universities ?? 0) +
    (totalByEntity.faculties ?? 0) +
    (totalByEntity.departments ?? 0) +
    (totalByEntity.programs ?? 0) +
    (totalByEntity.courses ?? 0)

  return (
    <div className="mx-auto max-w-[1400px] space-y-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary">Academic administration</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Academic structure</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Manage the complete institutional hierarchy, curriculum, and academic calendar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" render={<Link href="/dashboard/results" />}>
            <BadgeCheck />
            Results workspace
          </Button>
          <Button render={<Link href="/dashboard/academics/universities/new" />}>
            Create university
          </Button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border-slate-200/80 shadow-sm">
          <CardContent className="p-5">
            <Landmark className="size-5 text-blue-700" />
            <p className="mt-4 text-2xl font-bold">{totalByEntity.universities ?? "—"}</p>
            <p className="text-sm text-muted-foreground">Universities</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 shadow-sm">
          <CardContent className="p-5">
            <Building2 className="size-5 text-emerald-700" />
            <p className="mt-4 text-2xl font-bold">{structureNodes || "—"}</p>
            <p className="text-sm text-muted-foreground">Structure nodes</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 shadow-sm">
          <CardContent className="p-5">
            <BookOpenCheck className="size-5 text-violet-700" />
            <p className="mt-4 text-2xl font-bold">{totalByEntity.courses ?? "—"}</p>
            <p className="text-sm text-muted-foreground">Courses in catalog</p>
          </CardContent>
        </Card>
        <Card className="border-slate-200/80 shadow-sm">
          <CardContent className="p-5">
            <CalendarRange className="size-5 text-amber-700" />
            <p className="mt-4 text-2xl font-bold">{totalByEntity.semesters ?? "—"}</p>
            <p className="text-sm text-muted-foreground">Semesters configured</p>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_.65fr]">
        <div className="rounded-2xl bg-gradient-to-r from-slate-950 via-blue-950 to-blue-800 p-6 text-white sm:p-8">
          <p className="text-sm font-medium text-blue-200">Structure map</p>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-sm font-semibold">
            {["University", "Faculty", "Department", "Program", "Course"].map((item, index) => (
              <div key={item} className="flex items-center gap-2">
                <span className="rounded-lg bg-white/10 px-3 py-2">{item}</span>
                {index < 4 && <ArrowRight className="size-4 text-blue-300" />}
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-2xl text-sm leading-6 text-slate-300">
            Each level inherits its institutional context, keeping programs and courses correctly
            scoped for enrollment, routines, results, and reporting.
          </p>
        </div>
        <Card className="border-slate-200/80 shadow-sm">
          <CardHeader>
            <CardTitle>Operational coverage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {academicEntities.map((entity) => (
              <div key={entity.key} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{entity.label}</p>
                  <p className="text-xs text-muted-foreground">{entity.description}</p>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-sm font-semibold">
                  {totalByEntity[entity.key] ?? "—"}
                </span>
              </div>
            ))}
            <p className="border-t pt-4 text-xs leading-5 text-muted-foreground">
              Tip: keep university, faculty, department, program, and course records aligned so
              downstream features like offerings, exams, and results stay accurate.
            </p>
          </CardContent>
        </Card>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {academicEntities.map((entity) => {
          const Icon = icons[entity.key]
          const count = totalByEntity[entity.key]
          return (
            <Card key={entity.key} className="transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <CardHeader className="flex-row items-start justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-700">
                  <Icon className="size-5" />
                </span>
                <span className="rounded-full bg-muted px-3 py-1 text-sm font-semibold">
                  #{entity.shortcut}
                </span>
              </CardHeader>
              <CardContent>
                <CardTitle>{entity.label}</CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">{entity.description}</p>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="text-2xl font-bold">{count ?? "—"}</span>
                  <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    records
                  </span>
                </div>
                <Button
                  variant="link"
                  className="mt-4 px-0"
                  render={<Link href={`/dashboard/academics/${entity.key}`} />}
                >
                  Manage {entity.label.toLowerCase()} <ArrowRight />
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </section>
      <p className="text-xs text-muted-foreground">
        Total records across structure: {totalRecords}
      </p>
    </div>
  )
}
