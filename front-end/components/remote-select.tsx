"use client"

import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { apiRequest } from "@/lib/http-client"
import { withQuery } from "@/lib/api-endpoints"
import { CACHE_POLICY } from "@/lib/query-policy"

type RemoteOption = { _id: string; label: string }

export function RemoteSelect({ name, endpoint, placeholder = "Search…", mapOption }: {
  name: string
  endpoint: string
  placeholder?: string
  mapOption: (item: Record<string, unknown>) => RemoteOption
}) {
  const [search, setSearch] = useState("")
  const [debounced, setDebounced] = useState("")
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<RemoteOption | null>(null)
  useEffect(() => {
    const timer = window.setTimeout(() => { setDebounced(search.trim()); setPage(1) }, 250)
    return () => window.clearTimeout(timer)
  }, [search])
  const { data, isFetching } = useQuery({
    queryKey: ["remote-options", endpoint, debounced, page],
    queryFn: () => apiRequest<{ items: Record<string, unknown>[]; pagination: { page: number; totalPages: number } }>(withQuery(endpoint, { search: debounced || undefined, status: "active", page, limit: 20 })),
    ...CACHE_POLICY.reference,
  })
  const options = (data?.data.items ?? []).map(mapOption)
  return <div className="space-y-2">
    <input type="hidden" name={name} value={selected?._id ?? ""} required />
    <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setSelected(null) }} placeholder={selected?.label ?? placeholder} className="pl-9" /></div>
    {!selected && <div className="max-h-52 overflow-auto rounded-lg border bg-background p-1">
      {options.map((option) => <button type="button" key={option._id} onClick={() => { setSelected(option); setSearch(option.label) }} className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted">{option.label}</button>)}
      {!options.length && <p className="p-3 text-sm text-muted-foreground">{isFetching ? "Loading…" : "No matching records"}</p>}
      {(data?.data.pagination.totalPages ?? 1) > 1 && <div className="flex items-center justify-between border-t p-2 text-xs"><button type="button" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded px-2 py-1 disabled:opacity-40">Previous</button><span>{page} / {data?.data.pagination.totalPages}</span><button type="button" disabled={page >= (data?.data.pagination.totalPages ?? 1)} onClick={() => setPage((value) => value + 1)} className="rounded px-2 py-1 disabled:opacity-40">Next</button></div>}
    </div>}
  </div>
}
