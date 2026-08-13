import type { Metadata } from "next"
import { BookOpenCheck, CheckCircle2, ShieldCheck } from "lucide-react"

import { ApplicantRegistrationForm } from "@/components/applicant-registration-form"
import { Brand } from "@/components/brand"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = { title: "Apply for admission" }

export default function AdmissionApplyPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white"><div className="mx-auto flex h-18 max-w-6xl items-center px-5"><Brand /></div></header>
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-10 lg:grid-cols-[1fr_480px] lg:items-center lg:py-16">
        <section>
          <p className="font-semibold text-primary">Online admissions</p>
          <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">Start your university application.</h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">Create a secure applicant account, save your application as a draft, and track every admission decision in one place.</p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[{ icon: BookOpenCheck, text: "Choose a program" }, { icon: CheckCircle2, text: "Save and submit" }, { icon: ShieldCheck, text: "Track securely" }].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 rounded-xl border bg-white p-4 text-sm font-medium"><Icon className="size-5 text-primary" />{text}</div>
            ))}
          </div>
        </section>
        <Card className="shadow-lg shadow-slate-200/60">
          <CardHeader><CardTitle className="text-xl">Create applicant account</CardTitle><CardDescription>Use an email address you check regularly.</CardDescription></CardHeader>
          <CardContent><ApplicantRegistrationForm /></CardContent>
        </Card>
      </div>
    </main>
  )
}
