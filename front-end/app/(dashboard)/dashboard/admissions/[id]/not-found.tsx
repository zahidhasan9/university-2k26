import Link from "next/link"
import { ClipboardX } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AdmissionNotFound() {
  return (
    <div className="grid min-h-[60vh] place-items-center text-center">
      <div>
        <ClipboardX className="mx-auto size-12 text-muted-foreground" />
        <h1 className="mt-4 text-2xl font-bold">Application not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The application is unavailable or you do not have access.
        </p>
        <Button className="mt-6" render={<Link href="/dashboard/admissions" />}>
          Return to admissions
        </Button>
      </div>
    </div>
  )
}
