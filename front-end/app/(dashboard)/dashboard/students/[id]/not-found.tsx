import Link from "next/link"
import { UserRoundX } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function StudentNotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center text-center">
      <div>
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-muted">
          <UserRoundX className="size-7 text-muted-foreground" />
        </span>
        <h1 className="mt-5 text-2xl font-bold">Student not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">This profile may have been removed or the link is invalid.</p>
        <Button className="mt-6" render={<Link href="/dashboard/students" />}>Return to students</Button>
      </div>
    </div>
  )
}
