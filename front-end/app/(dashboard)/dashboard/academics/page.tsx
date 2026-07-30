import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
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

  return (
    <div className="mx-auto max-w-[1400px] space-y-7">
      <div>
        <p className="text-sm font-medium text-primary">Academic administration</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Academic structure</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          Manage the complete institutional hierarchy, curriculum, and academic calendar.
        </p>
      </div>
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
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {academicEntities.map((entity) => {
          const Icon = icons[entity.key]
          const count = totalByEntity[entity.key]
          return (
            <Card key={entity.key} className="transition-shadow hover:shadow-md">
              <CardHeader className="flex-row items-start justify-between">
                <span className="grid size-11 place-items-center rounded-xl bg-blue-50 text-blue-700">
                  <Icon className="size-5" />
                </span>
                <span className="text-2xl font-bold">{count ?? "—"}</span>
              </CardHeader>
              <CardContent>
                <CardTitle>{entity.label}</CardTitle>
                <p className="mt-2 text-sm text-muted-foreground">{entity.description}</p>
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
    </div>
  )
}
