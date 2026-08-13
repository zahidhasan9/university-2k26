import type { Metadata } from "next"
import { BookOpenCheck, ChartNoAxesCombined, ShieldCheck } from "lucide-react"

import { Brand } from "@/components/brand"
import { LoginForm } from "@/components/login-form"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export const metadata: Metadata = { title: "Sign in" }

const highlights = [
  { icon: BookOpenCheck, text: "Academic operations in one workspace" },
  { icon: ChartNoAxesCombined, text: "Live institutional insights" },
  { icon: ShieldCheck, text: "Role-based, secure access" },
]

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.08fr_.92fr]">
      <section className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col">
        <div className="absolute -right-28 -top-28 size-96 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute -bottom-32 left-10 size-96 rounded-full bg-cyan-400/10 blur-3xl" />
        <Brand className="relative z-10 [&_span_span:last-child]:text-slate-400" />
        <div className="relative z-10 my-auto max-w-xl">
          <Badge className="mb-6 border-blue-400/20 bg-blue-400/10 text-blue-200">
            Built for modern universities
          </Badge>
          <h1 className="text-balance text-5xl font-semibold leading-[1.08] tracking-tight">
            One campus. One platform. Every possibility.
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
            Connect academics, administration, finance, research, and student life through one
            intelligent university operating system.
          </p>
          <div className="mt-10 grid gap-4">
            {highlights.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-sm text-slate-200">
                <span className="grid size-9 place-items-center rounded-lg bg-white/10">
                  <Icon className="size-4 text-blue-300" />
                </span>
                {text}
              </div>
            ))}
          </div>
        </div>
        <p className="relative z-10 text-xs text-slate-500">© 2026 UniSphere ERP</p>
      </section>
      <section className="flex items-center justify-center p-5 sm:p-10">
        <div className="w-full max-w-md">
          <Brand className="mb-10 lg:hidden" />
          <Card className="border-0 bg-transparent shadow-none sm:border sm:bg-card sm:shadow-sm">
            <CardHeader className="px-0 sm:px-7">
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>Use your university account to continue.</CardDescription>
            </CardHeader>
            <CardContent className="px-0 sm:px-7">
              <LoginForm />
              <p className="mt-5 text-center text-sm text-muted-foreground">
                Applying for admission? <Link href="/admissions/apply" className="font-medium text-primary hover:underline">Create an applicant account</Link>
              </p>
              <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
                By continuing, you agree to the university&apos;s acceptable use and privacy
                policies.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}
