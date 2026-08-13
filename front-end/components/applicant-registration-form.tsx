"use client"

import { FormEvent, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { LoaderCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { API_ENDPOINTS } from "@/lib/api-endpoints"
import { apiResponseRequest } from "@/lib/http-client"

export function ApplicantRegistrationForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    setLoading(true)
    setError("")
    try {
      const response = await apiResponseRequest(API_ENDPOINTS.auth.proxyRegister, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      })
      const body = (await response.json()) as { message: string }
      if (!response.ok) throw new Error(body.message || "Account could not be created")
      router.push("/admissions/portal")
      router.refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Account could not be created")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="space-y-5" onSubmit={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="firstName">First name</Label><Input id="firstName" name="firstName" autoComplete="given-name" required /></div>
        <div className="space-y-2"><Label htmlFor="lastName">Last name</Label><Input id="lastName" name="lastName" autoComplete="family-name" required /></div>
      </div>
      <div className="space-y-2"><Label htmlFor="email">Email address</Label><Input id="email" name="email" type="email" autoComplete="email" required /></div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={12} required />
        <p className="text-xs text-muted-foreground">12+ characters with uppercase, lowercase, number and symbol.</p>
      </div>
      {error && <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}
      <Button className="h-11 w-full" size="lg" disabled={loading}>
        {loading && <LoaderCircle className="animate-spin" />} Create account and continue
      </Button>
      <p className="text-center text-sm text-muted-foreground">Already started? <Link className="font-medium text-primary hover:underline" href="/login">Sign in</Link></p>
    </form>
  )
}
