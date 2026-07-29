import Link from "next/link"
import { GraduationCap } from "lucide-react"

import { cn } from "@/lib/utils"

export function Brand({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link href="/dashboard" className={cn("flex items-center gap-3", className)}>
      <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <GraduationCap className="size-5" />
      </span>
      {!compact && (
        <span>
          <span className="block text-lg font-bold leading-5 tracking-tight">UniSphere</span>
          <span className="text-xs text-muted-foreground">University ERP</span>
        </span>
      )}
    </Link>
  )
}
