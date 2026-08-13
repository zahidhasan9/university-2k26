import { redirect } from "next/navigation"

import { API_ENDPOINTS } from "@/lib/api-endpoints"
import { authenticatedRequest } from "@/lib/auth"

type Batch = {
  code: string
  program: { _id: string }
  department: { _id: string }
}

export default async function BatchSectionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const batch = (
    await authenticatedRequest<{ batch: Batch }>(API_ENDPOINTS.academics.batchDetail(id))
  ).data.batch
  redirect(
    `/dashboard/academics/courses?${new URLSearchParams({
      departmentId: batch.department._id,
      batch: batch.code,
      programId: batch.program._id,
      tab: "sections",
    })}`,
  )
}
