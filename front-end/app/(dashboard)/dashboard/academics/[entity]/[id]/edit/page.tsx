import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { AcademicForm } from "@/components/academic-form"
import { AcademicFormShell } from "@/components/academic-form-shell"
import { academicItem, academicOptions } from "@/lib/academic-data"
import { academicEntities } from "@/lib/academic-types"

export const metadata: Metadata = { title: "Edit academic record" }

export default async function EditAcademicRecordPage({ params }: { params: Promise<{ entity: string; id: string }> }) {
  const { entity: rawEntity, id } = await params
  const config = academicEntities.find((entry) => entry.key === rawEntity)
  if (!config) notFound()
  const [item, options] = await Promise.all([academicItem(config.key, id), academicOptions(config.key)])
  if (!item) notFound()
  return <AcademicFormShell title={`Edit ${item.name ?? item.title}`} description={`Update this ${config.singular.toLowerCase()} and its academic relationship.`} backHref={`/dashboard/academics/${config.key}`}><AcademicForm entity={config.key} item={item} options={options} /></AcademicFormShell>
}
