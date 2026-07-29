import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { StudentStatus } from "@/lib/student-types"

const styles: Record<StudentStatus, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-700",
  graduated: "border-blue-200 bg-blue-50 text-blue-700",
  suspended: "border-amber-200 bg-amber-50 text-amber-700",
  withdrawn: "border-rose-200 bg-rose-50 text-rose-700",
  archived: "border-slate-200 bg-slate-100 text-slate-600",
}

export function StudentStatusBadge({ status }: { status: StudentStatus }) {
  return (
    <Badge variant="outline" className={cn("capitalize", styles[status])}>
      {status.replaceAll("_", " ")}
    </Badge>
  )
}
