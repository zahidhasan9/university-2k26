"use client"

import { apiResponseRequest } from "@/lib/http-client"
import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircle, Play, WalletCards } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function PayrollCreate() {
  const router = useRouter(),
    [loading, setLoading] = useState(false)
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setLoading(true)
    const response = await apiResponseRequest("/hr/payroll-runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        year: Number(form.get("year")),
        month: Number(form.get("month")),
        currency: String(form.get("currency")),
      }),
    })
    setLoading(false)
    if (response.ok) router.refresh()
  }
  const now = new Date()
  return (
    <form onSubmit={submit} className="flex flex-wrap gap-2">
      <Input
        name="year"
        type="number"
        className="w-24"
        min={2000}
        max={2200}
        defaultValue={now.getFullYear()}
        required
      />
      <Input
        name="month"
        type="number"
        className="w-20"
        min={1}
        max={12}
        defaultValue={now.getMonth() + 1}
        required
      />
      <Input
        name="currency"
        className="w-20 uppercase"
        defaultValue="BDT"
        minLength={3}
        maxLength={3}
        required
      />
      <Button type="submit" disabled={loading}>
        {loading && <LoaderCircle className="animate-spin" />}New run
      </Button>
    </form>
  )
}

export function PayrollAction({ id, status }: { id: string; status: string }) {
  const router = useRouter(),
    [loading, setLoading] = useState(false)
  if (!["draft", "processed"].includes(status)) return null
  const action = status === "draft" ? "process" : "pay"
  async function run() {
    setLoading(true)
    const response = await apiResponseRequest(`/hr/payroll-runs/${id}/${action}`, {
      method: "POST",
    })
    setLoading(false)
    if (response.ok) router.refresh()
  }
  return (
    <Button
      size="sm"
      variant={action === "pay" ? "default" : "outline"}
      disabled={loading}
      onClick={run}
    >
      {loading ? (
        <LoaderCircle className="animate-spin" />
      ) : action === "pay" ? (
        <WalletCards />
      ) : (
        <Play />
      )}
      {action === "pay" ? "Mark paid" : "Process"}
    </Button>
  )
}
