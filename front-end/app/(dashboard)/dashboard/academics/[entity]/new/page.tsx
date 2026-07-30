import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { AcademicForm } from "@/components/academic-form"
import { AcademicFormShell } from "@/components/academic-form-shell"
import { academicOptions } from "@/lib/academic-data"
import { academicEntities } from "@/lib/academic-types"

export const metadata: Metadata = { title: "Create academic record" }

export default async function NewAcademicRecordPage({
  params,
}: {
  params: Promise<{ entity: string }>
}) {
  const { entity: rawEntity } = await params
  const config = academicEntities.find((item) => item.key === rawEntity)
  if (!config) notFound()
  const options = await academicOptions(config.key)
  return (
    <AcademicFormShell
      title={`Create ${config.singular.toLowerCase()}`}
      description={`Add a new ${config.singular.toLowerCase()} to the academic structure.`}
      backHref={`/dashboard/academics/${config.key}`}
    >
      <AcademicForm entity={config.key} options={options} />
    </AcademicFormShell>
  )
}
