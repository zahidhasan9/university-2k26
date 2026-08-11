"use client"

import { API_ENDPOINTS } from "@/lib/api-endpoints"

import { FormEvent, useState } from "react"
import { LoaderCircle, LockKeyhole } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { apiRequest, apiResponseRequest } from "@/lib/http-client"

export function ChangePasswordForm() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const newPassword = String(form.get("newPassword"))
    if (newPassword !== String(form.get("confirmPassword"))) {
      setMessage("New passwords do not match.")
      return
    }
    setSaving(true)
    setMessage("")
    try {
      await apiRequest(API_ENDPOINTS.auth.changePassword, {
        method: "POST",
        data: {
          currentPassword: String(form.get("currentPassword")),
          newPassword,
        },
      })
      await apiResponseRequest(API_ENDPOINTS.auth.proxyLogout, { method: "POST" })
      router.push("/login")
      router.refresh()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Password could not be changed")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-4">
      <div className="space-y-2">
        <Label htmlFor="currentPassword">Current password</Label>
        <Input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="newPassword">New password</Label>
          <Input
            id="newPassword"
            name="newPassword"
            type="password"
            minLength={12}
            autoComplete="new-password"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            minLength={12}
            autoComplete="new-password"
            required
          />
        </div>
      </div>
      <p className="text-xs text-slate-400">
        Use at least 12 characters with uppercase, lowercase, number, and special character.
      </p>
      {message && (
        <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{message}</p>
      )}
      <Button
        type="submit"
        disabled={saving}
        className="rounded-xl bg-violet-600 hover:bg-violet-700"
      >
        {saving ? <LoaderCircle className="animate-spin" /> : <LockKeyhole />}
        Change password
      </Button>
    </form>
  )
}
