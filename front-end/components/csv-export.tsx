"use client"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
export function CsvExport({
  filename,
  rows,
}: {
  filename: string
  rows: Record<string, unknown>[]
}) {
  function download() {
    if (!rows.length) return
    const columns = Object.keys(rows[0])
    const cell = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`
    const csv = [
      columns.map(cell).join(","),
      ...rows.map((r) => columns.map((c) => cell(r[c])).join(",")),
    ].join("\r\n")
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }))
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }
  return (
    <Button
      onClick={download}
      disabled={!rows.length}
      className="h-11 rounded-xl bg-violet-600 px-5 font-semibold text-white shadow-[0_8px_20px_rgba(124,58,237,0.22)] transition-all hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-[0_12px_24px_rgba(124,58,237,0.28)]"
    >
      <Download className="size-4" />
      Export CSV
    </Button>
  )
}
