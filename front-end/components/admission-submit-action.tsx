"use client"

import { useRouter } from "next/navigation"
import { Send } from "lucide-react"

import { ConfirmAction } from "@/components/ui/confirm-action"
import { API_ENDPOINTS } from "@/lib/api-endpoints"
import { apiResponseRequest } from "@/lib/http-client"

export function AdmissionSubmitAction({ id }: { id: string }) {
  const router = useRouter()
  return <ConfirmAction title="Submit this application?" description="After submission, the draft can no longer be edited. The admissions team will begin its review." confirmLabel="Submit application" triggerLabel="Submit for review" triggerIcon={<Send />} variant="outline" onConfirm={async () => { const response = await apiResponseRequest(API_ENDPOINTS.admissions.action(id, "submit"), { method: "POST" }); const body = (await response.json()) as { message: string }; if (!response.ok) throw new Error(body.message); router.refresh() }} />
}
