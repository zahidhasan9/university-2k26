"use client"

import { apiResponseRequest } from "@/lib/http-client"
import { API_ENDPOINTS } from "@/lib/api-endpoints"
import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircle, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
type Option = { _id: string; name: string; code?: string; academicYear?: string }
export function FeeStructureForm({
  programs,
  semesters,
}: {
  programs: Option[]
  semesters: Option[]
}) {
  const router = useRouter(),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("")
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const items = String(form.get("items") ?? "")
      .split("\n")
      .map((line) => {
        const [code, name, amount, mandatory = "yes"] = line.split("|").map((value) => value.trim())
        return code && name && amount
          ? {
              code,
              name,
              amountMinor: Math.round(Number(amount) * 100),
              mandatory: !["no", "false", "optional"].includes(mandatory.toLowerCase()),
            }
          : null
      })
      .filter(Boolean)
    setLoading(true)
    const response = await apiResponseRequest(API_ENDPOINTS.finance.structures, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        programId: form.get("programId"),
        semesterId: form.get("semesterId"),
        name: form.get("name"),
        currency: form.get("currency"),
        perCreditFeeMinor: Math.round(Number(form.get("perCreditFee")) * 100),
        items,
      }),
    })
    const body = await response.json()
    setLoading(false)
    if (!response.ok) return setError(body.message)
    router.push("/dashboard/finance")
    router.refresh()
  }
  const select = "h-9 w-full rounded-lg border bg-background px-3 text-sm"
  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <Label>Program</Label>
        <select name="programId" className={select} required defaultValue="">
          <option value="" disabled>
            Select program
          </option>
          {programs.map((item) => (
            <option key={item._id} value={item._id}>
              {item.code} · {item.name}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label>Academic term</Label>
        <select name="semesterId" className={select} required defaultValue="">
          <option value="" disabled>
            Select semester
          </option>
          {semesters.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name} · {item.academicYear}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label>Structure name</Label>
        <Input name="name" minLength={2} required />
      </div>
      <div className="space-y-2">
        <Label>Currency</Label>
        <Input name="currency" defaultValue="BDT" minLength={3} maxLength={3} required />
      </div>
      <div className="space-y-2">
        <Label>Fee per credit</Label>
        <Input name="perCreditFee" type="number" min={0} step={0.01} required placeholder="2500" />
        <p className="text-xs text-muted-foreground">Tuition is calculated from the student&apos;s registered credits.</p>
      </div>
      <div className="space-y-2">
        <Label>Fee items</Label>
        <textarea
          name="items"
          required
          className="min-h-40 w-full rounded-lg border p-3 font-mono text-sm"
          placeholder={
            "REGISTRATION | Registration fee | 3000 | yes\nLAB | Laboratory fee | 3000 | optional"
          }
        />
        <p className="text-xs text-muted-foreground">
          One per line: Code | Name | Amount | yes/optional
        </p>
      </div>
      {error && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      )}
      <Button type="submit" disabled={loading}>
        {loading ? <LoaderCircle className="animate-spin" /> : <Save />}Create fee structure
      </Button>
    </form>
  )
}
