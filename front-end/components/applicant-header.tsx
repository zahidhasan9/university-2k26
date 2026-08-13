import Link from "next/link"

import { Brand } from "@/components/brand"
import { ApplicantSignOut } from "@/components/applicant-sign-out"
import { Button } from "@/components/ui/button"

export function ApplicantHeader({ name }: { name: string }) {
  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-18 max-w-6xl items-center gap-5 px-5">
        <Link href="/admissions/portal"><Brand /></Link>
        <nav className="ml-auto flex items-center gap-2">
          <span className="hidden text-sm text-muted-foreground sm:inline">{name}</span>
          <Button variant="ghost" render={<Link href="/admissions/portal" />}>My applications</Button>
          <ApplicantSignOut />
        </nav>
      </div>
    </header>
  )
}
