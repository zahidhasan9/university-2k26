"use client"
import { Archive } from "lucide-react"
import { useRouter } from "next/navigation"
import { ConfirmAction } from "@/components/ui/confirm-action"
import { API_ENDPOINTS } from "@/lib/api-endpoints"
import { apiResponseRequest } from "@/lib/http-client"
export function BatchRemoveAction({ id, code, redirectHref }: { id: string; code: string; redirectHref: string }) { const router = useRouter(); async function archive() { const response = await apiResponseRequest(API_ENDPOINTS.academics.batchDetail(id), { method: "DELETE" }); const body = await response.json<{ message?: string }>(); if (!response.ok) throw new Error(body.message || "Batch could not be archived"); router.push(redirectHref); router.refresh() } return <ConfirmAction title={`Remove ${code}?`} description="The batch will be archived and hidden from active curriculum lists. Historical student references will be preserved." confirmLabel="Archive batch" triggerLabel="Remove batch" triggerIcon={<Archive />} onConfirm={archive} /> }
