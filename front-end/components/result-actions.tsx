"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Calculator, LoaderCircle, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
export function ResultActions({ offeringId, hasDraft }: { offeringId: string; hasDraft: boolean }) {
  const router = useRouter(), [loading, setLoading] = useState(""), [error, setError] = useState("")
  async function run(action: "calculate" | "publish") { setLoading(action); setError(""); const response = await fetch(`/api/backend/results/offerings/${offeringId}/${action}`, { method: "POST" }); const body = await response.json(); setLoading(""); if (!response.ok) return setError(body.message); router.refresh() }
  return <div><div className="flex flex-wrap gap-2"><Button variant="outline" disabled={Boolean(loading)} onClick={() => run("calculate")}>{loading === "calculate" ? <LoaderCircle className="animate-spin" /> : <Calculator />}Calculate results</Button><Button disabled={Boolean(loading) || !hasDraft} onClick={() => run("publish")}>{loading === "publish" ? <LoaderCircle className="animate-spin" /> : <Send />}Publish results</Button></div>{error && <p className="mt-3 text-sm text-destructive">{error}</p>}</div>
}
