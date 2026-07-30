"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiRequest } from "@/lib/http-client"

type Field = {
  name: string
  label: string
  type?: string
  placeholder?: string
  required?: boolean
}

export function OperationsForm({
  endpoint,
  fields,
  transform,
  submitLabel = "Save record",
}: {
  endpoint: string
  fields: Field[]
  transform?: (values: Record<string, string>) => Record<string, unknown>
  submitLabel?: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError("")
    const values = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<
      string,
      string
    >
    try {
      await apiRequest(endpoint, {
        method: "POST",
        data: transform ? transform(values) : values,
      })
    } catch (cause) {
      setLoading(false)
      return setError(
        cause instanceof Error ? cause.message : "The operation could not be completed",
      )
    }
    setLoading(false)
    router.push(endpoint.startsWith("inventory") ? "/dashboard/inventory" : "/dashboard/facilities")
    router.refresh()
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              name={field.name}
              type={field.type}
              placeholder={field.placeholder}
              required={field.required !== false}
            />
          </div>
        ))}
      </div>
      {error && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      )}
      <Button disabled={loading} type="submit">
        {loading && <LoaderCircle className="animate-spin" />}
        {submitLabel}
      </Button>
    </form>
  )
}
