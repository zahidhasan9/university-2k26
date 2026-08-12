import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  BookOpenCheck,
  Building2,
  CalendarRange,
  ChevronRight,
  CircleCheck,
  GraduationCap,
  Landmark,
  Network,
  Plus,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { academicEntities, type AcademicList } from "@/lib/academic-types"
import { authenticatedRequest } from "@/lib/auth"
import { API_ENDPOINTS, withQuery } from "@/lib/api-endpoints"

export const metadata: Metadata = { title: "Academic administration" }

const entityPresentation = {
  universities: { icon: Landmark, tone: "bg-blue-50 text-blue-700 ring-blue-100" },
  faculties: { icon: Building2, tone: "bg-cyan-50 text-cyan-700 ring-cyan-100" },
  departments: { icon: Network, tone: "bg-violet-50 text-violet-700 ring-violet-100" },
  programs: { icon: GraduationCap, tone: "bg-emerald-50 text-emerald-700 ring-emerald-100" },
  courses: { icon: BookOpenCheck, tone: "bg-amber-50 text-amber-700 ring-amber-100" },
  semesters: { icon: CalendarRange, tone: "bg-rose-50 text-rose-700 ring-rose-100" },
}

function displayCount(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : value.toLocaleString()
}

export default async function AcademicsPage() {
  const counts = await Promise.all(
    academicEntities.map(async (entity) => {
      try {
        const response = await authenticatedRequest<AcademicList>(
          withQuery(API_ENDPOINTS.academics[entity.key], { limit: 1 }),
        )
        return [entity.key, response.data.pagination.total] as const
      } catch {
        return [entity.key, null] as const
      }
    }),
  )
  const totalByEntity = Object.fromEntries(counts) as Record<string, number | null>

  return (
    <main className="mx-auto max-w-[1440px] space-y-6">
      <section className="overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-white via-blue-50/70 to-cyan-50 shadow-sm">
        <div className="flex flex-col gap-6 px-6 py-7 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10 lg:py-9">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-blue-700">
              <span className="grid size-8 place-items-center rounded-lg bg-blue-100">
                <GraduationCap className="size-4" />
              </span>
              Academic administration
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Manage your academic structure
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
              Organise departments, programmes, courses and semesters from one clear workspace.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" className="bg-white" render={<Link href="/dashboard/results" />}>
              Results workspace
            </Button>
            <Button render={<Link href="/dashboard/academics/courses" />}>
              Curriculum manager <ArrowRight />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-3 border-t border-blue-100 bg-white/70 px-6 py-4 text-sm sm:px-8 lg:px-10">
          {["University", "Faculty", "Department", "Programme", "Curriculum"].map(
            (item, index, items) => (
              <div key={item} className="flex items-center gap-2">
                <span className="rounded-md bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm ring-1 ring-slate-200">
                  {item}
                </span>
                {index < items.length - 1 && <ChevronRight className="size-4 text-slate-400" />}
              </div>
            ),
          )}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Faculties", value: totalByEntity.faculties, icon: Building2, tone: "text-blue-700 bg-blue-50" },
          { label: "Departments", value: totalByEntity.departments, icon: Network, tone: "text-violet-700 bg-violet-50" },
          { label: "Programmes", value: totalByEntity.programs, icon: GraduationCap, tone: "text-emerald-700 bg-emerald-50" },
          { label: "Courses", value: totalByEntity.courses, icon: BookOpenCheck, tone: "text-amber-700 bg-amber-50" },
        ].map((item) => {
          const Icon = item.icon
          return (
            <div key={item.label} className="flex items-center gap-4 rounded-xl border bg-white p-5 shadow-sm">
              <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${item.tone}`}>
                <Icon className="size-5" />
              </span>
              <div>
                <p className="text-2xl font-bold text-slate-950">{displayCount(item.value)}</p>
                <p className="text-sm text-slate-500">{item.label}</p>
              </div>
            </div>
          )
        })}
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-col gap-3 border-b pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-950">Academic management</h2>
            <p className="mt-1 text-sm text-slate-500">Select an area to view and manage its records.</p>
          </div>
          <Button variant="outline" size="sm" render={<Link href="/dashboard/academics/universities/new" />}>
            <Plus /> Add university
          </Button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {academicEntities.map((entity) => {
            const presentation = entityPresentation[entity.key]
            const Icon = presentation.icon
            return (
              <Link
                key={entity.key}
                href={`/dashboard/academics/${entity.key}`}
                className="group rounded-xl border border-slate-200 p-5 transition hover:-translate-y-0.5 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className={`grid size-11 place-items-center rounded-xl ring-1 ${presentation.tone}`}>
                    <Icon className="size-5" />
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
                    {displayCount(totalByEntity[entity.key])}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-bold text-slate-900">{entity.label}</h3>
                <p className="mt-1 min-h-10 text-sm leading-5 text-slate-500">{entity.description}</p>
                <span className="mt-5 flex items-center gap-2 text-sm font-semibold text-blue-700">
                  Manage records
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Link
          href="/dashboard/academics/courses"
          className="group flex items-center gap-4 rounded-xl border border-blue-100 bg-blue-50/70 p-5 transition hover:border-blue-200 hover:bg-blue-50"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-blue-600 text-white">
            <BookOpenCheck className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold text-slate-900">Curriculum workspace</span>
            <span className="mt-1 block text-sm text-slate-600">Department → batch → semester courses</span>
          </span>
          <ArrowRight className="size-5 text-blue-700 transition-transform group-hover:translate-x-1" />
        </Link>
        <Link
          href="/dashboard/academics/semesters"
          className="group flex items-center gap-4 rounded-xl border border-emerald-100 bg-emerald-50/70 p-5 transition hover:border-emerald-200 hover:bg-emerald-50"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white">
            <CalendarRange className="size-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold text-slate-900">Academic terms</span>
            <span className="mt-1 block text-sm text-slate-600">
              {displayCount(totalByEntity.semesters)} teaching terms configured
            </span>
          </span>
          <CircleCheck className="size-5 text-emerald-700" />
        </Link>
      </section>
    </main>
  )
}
