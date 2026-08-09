"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Filter, RotateCcw, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { AcademicItem } from "@/lib/academic-types"

type Props = {
  departments: AcademicItem[]
  programs: AcademicItem[]
  batches: string[]
  initialSearch: string
  initialDepartmentId: string
  initialProgramId: string
  initialBatch: string
  initialStatus: string
}

export function StudentDirectoryFilters({
  departments,
  programs,
  batches,
  initialSearch,
  initialDepartmentId,
  initialProgramId,
  initialBatch,
  initialStatus,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(initialSearch)
  const [departmentId, setDepartmentId] = useState(initialDepartmentId)

  const visiblePrograms = useMemo(
    () =>
      departmentId
        ? programs.filter((program) => program.department?._id === departmentId)
        : programs,
    [departmentId, programs],
  )

  const navigate = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      Object.entries(updates).forEach(([key, value]) => {
        if (value) params.set(key, value)
        else params.delete(key)
      })
      params.delete("page")
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname)
    },
    [pathname, router, searchParams],
  )

  useEffect(() => {
    if (search === (searchParams.get("search") ?? "")) return
    const timer = window.setTimeout(() => navigate({ search }), 350)
    return () => window.clearTimeout(timer)
  }, [navigate, search, searchParams])

  function reset() {
    setSearch("")
    setDepartmentId("")
    router.replace(pathname)
  }

  return (
    <div className="grid w-full gap-2 md:grid-cols-2 xl:grid-cols-7">
      <div className="relative xl:col-span-2">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="pl-9"
          placeholder="Search ID, name, or email..."
          aria-label="Search students"
        />
      </div>
      <select
        value={departmentId}
        onChange={(event) => {
          const value = event.target.value
          setDepartmentId(value)
          navigate({ departmentId: value, programId: "" })
        }}
        className="h-8 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
        aria-label="Filter by department"
      >
        <option value="">All departments</option>
        {departments.map((department) => (
          <option key={department._id} value={department._id}>
            {department.code} - {department.name}
          </option>
        ))}
      </select>
      <select
        defaultValue={initialProgramId}
        onChange={(event) => navigate({ programId: event.target.value })}
        className="h-8 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
        aria-label="Filter by program"
      >
        <option value="">All programs</option>
        {visiblePrograms.map((program) => (
          <option key={program._id} value={program._id}>
            {program.code} - {program.name}
          </option>
        ))}
      </select>
      <select
        defaultValue={initialBatch}
        onChange={(event) => navigate({ batch: event.target.value })}
        className="h-8 w-full rounded-lg border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring/40"
        aria-label="Filter by batch"
      >
        <option value="">All batches</option>
        {batches.map((batch) => (
          <option key={batch} value={batch}>
            Batch {batch}
          </option>
        ))}
      </select>
      <div className="relative">
        <Filter className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <select
          defaultValue={initialStatus}
          onChange={(event) => navigate({ status: event.target.value })}
          className="h-8 w-full rounded-lg border bg-background pl-9 pr-8 text-sm outline-none focus:ring-2 focus:ring-ring/40"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="graduated">Graduated</option>
          <option value="suspended">Suspended</option>
          <option value="withdrawn">Withdrawn</option>
          <option value="archived">Archived</option>
        </select>
      </div>
      <Button type="button" variant="secondary" onClick={reset}>
        <RotateCcw /> Reset
      </Button>
    </div>
  )
}
