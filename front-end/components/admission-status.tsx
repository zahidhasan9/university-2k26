import { Badge } from "@/components/ui/badge"
import type { AdmissionStatus } from "@/lib/admission-types"
import { cn } from "@/lib/utils"

const styles: Record<AdmissionStatus, string> = {
  draft: "border-slate-200 bg-slate-50 text-slate-700",
  submitted: "border-blue-200 bg-blue-50 text-blue-700",
  under_review: "border-amber-200 bg-amber-50 text-amber-700",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
  cancelled: "border-slate-200 bg-slate-100 text-slate-500",
}

export function AdmissionStatusBadge({ status }: { status: AdmissionStatus }) {
  return (
    <Badge variant="outline" className={cn("capitalize", styles[status])}>
      {status.replaceAll("_", " ")}
    </Badge>
  )
}
