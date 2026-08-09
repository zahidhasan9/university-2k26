"use client"

import { useMemo } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { CalendarDays, List, RotateCcw } from "lucide-react"

import { Button } from "@/components/ui/button"
import type { AcademicItem } from "@/lib/academic-types"

type Props = {
  semesters: AcademicItem[]
  departments: AcademicItem[]
  programs: AcademicItem[]
  batches: string[]
  sections: string[]
  rooms: string[]
  selected: Record<string, string>
}

export function RoutineFilters({
  semesters,
  departments,
  programs,
  batches,
  sections,
  rooms,
  selected,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const visiblePrograms = useMemo(
    () =>
      selected.departmentId
        ? programs.filter((program) => program.department?._id === selected.departmentId)
        : programs,
    [programs, selected.departmentId],
  )

  function navigate(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value)
      else params.delete(key)
    })
    params.delete("page")
    const query = params.toString()
    router.replace(query ? `${pathname}?${query}` : pathname)
  }

  const selectClass =
    "h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"

  return (
    <div className="space-y-3 rounded-xl border bg-card p-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <select
          value={selected.semesterId}
          onChange={(event) => navigate({ semesterId: event.target.value })}
          className={selectClass}
          aria-label="Filter by semester"
        >
          <option value="">All semesters</option>
          {semesters.map((item) => (
            <option key={item._id} value={item._id}>
              {item.code} - {item.name}
            </option>
          ))}
        </select>
        <select
          value={selected.departmentId}
          onChange={(event) => navigate({ departmentId: event.target.value, programId: "" })}
          className={selectClass}
          aria-label="Filter by department"
        >
          <option value="">All departments</option>
          {departments.map((item) => (
            <option key={item._id} value={item._id}>
              {item.code} - {item.name}
            </option>
          ))}
        </select>
        <select
          value={selected.programId}
          onChange={(event) => navigate({ programId: event.target.value })}
          className={selectClass}
          aria-label="Filter by program"
        >
          <option value="">All programs</option>
          {visiblePrograms.map((item) => (
            <option key={item._id} value={item._id}>
              {item.code} - {item.name}
            </option>
          ))}
        </select>
        <select
          value={selected.batch}
          onChange={(event) => navigate({ batch: event.target.value })}
          className={selectClass}
          aria-label="Filter by batch"
        >
          <option value="">All batches</option>
          {batches.map((item) => (
            <option key={item} value={item}>Batch {item}</option>
          ))}
        </select>
        <select
          value={selected.section}
          onChange={(event) => navigate({ section: event.target.value })}
          className={selectClass}
          aria-label="Filter by section"
        >
          <option value="">All sections</option>
          {sections.map((item) => (
            <option key={item} value={item}>Section {item}</option>
          ))}
        </select>
        <select
          value={selected.dayOfWeek}
          onChange={(event) => navigate({ dayOfWeek: event.target.value })}
          className={selectClass}
          aria-label="Filter by day"
        >
          <option value="">All days</option>
          {[
            "saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday",
          ].map((day) => (
            <option key={day} value={day}>{day[0].toUpperCase() + day.slice(1)}</option>
          ))}
        </select>
        <select
          value={selected.room}
          onChange={(event) => navigate({ room: event.target.value })}
          className={selectClass}
          aria-label="Filter by room"
        >
          <option value="">All rooms</option>
          {rooms.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Filters update the routine automatically.
        </p>
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={selected.view === "week" ? "secondary" : "ghost"}
            onClick={() => navigate({ view: "week" })}
          >
            <CalendarDays /> Week
          </Button>
          <Button
            type="button"
            size="sm"
            variant={selected.view === "list" ? "secondary" : "ghost"}
            onClick={() => navigate({ view: "list" })}
          >
            <List /> List
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => router.replace(pathname)}>
            <RotateCcw /> Reset
          </Button>
        </div>
      </div>
    </div>
  )
}
