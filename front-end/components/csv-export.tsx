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
    <Button variant="outline" onClick={download} disabled={!rows.length}>
      <Download />
      Export CSV
    </Button>
  )
}
