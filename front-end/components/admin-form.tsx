"use client"

import { FormEvent, useState } from "react"
import { useRouter } from "next/navigation"
import { LoaderCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { API_ENDPOINTS } from "@/lib/api-endpoints"
import { apiRequest } from "@/lib/http-client"

export function AdminForm({ kind }: { kind: "user" | "role" }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const values = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<
      string,
      string
    >
    const csv = (value: string) =>
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    const payload =
      kind === "user"
        ? {
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            password: values.password,
            roleIds: csv(values.roleIds),
            status: values.status,
          }
        : {
            code: values.code,
            name: values.name,
            description: values.description || undefined,
            permissionIds: csv(values.permissionIds),
          }
    setLoading(true)
    setError("")
    try {
      const endpoint = kind === "user" ? API_ENDPOINTS.users.create : API_ENDPOINTS.roles.create
      await apiRequest(endpoint, { method: "POST", data: payload })
    } catch (cause) {
      setLoading(false)
      return setError(cause instanceof Error ? cause.message : "Record could not be created")
    }
    setLoading(false)
    router.push(kind === "user" ? "/dashboard/settings/users" : "/dashboard/settings/roles")
    router.refresh()
  }
  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {kind === "user" ? (
          <>
            <Field name="firstName" label="First name" />
            <Field name="lastName" label="Last name" />
            <Field name="email" label="Email" type="email" />
            <Field
              name="password"
              label="Temporary password"
              type="password"
              placeholder="12+ chars, mixed case, number, symbol"
            />
            <Field name="roleIds" label="Role IDs (comma separated)" required={false} />
            <Field name="status" label="Status" placeholder="active" />
          </>
        ) : (
          <>
            <Field name="code" label="Role code" placeholder="department_admin" />
            <Field name="name" label="Role name" />
            <Field name="description" label="Description" required={false} />
            <Field name="permissionIds" label="Permission IDs (comma separated)" required={false} />
          </>
        )}
      </div>
      {error && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>
      )}
      <Button disabled={loading} type="submit">
        {loading && <LoaderCircle className="animate-spin" />}Create {kind}
      </Button>
    </form>
  )
}
function Field({
  name,
  label,
  type,
  placeholder,
  required = true,
}: {
  name: string
  label: string
  type?: string
  placeholder?: string
  required?: boolean
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} type={type} placeholder={placeholder} required={required} />
    </div>
  )
}
