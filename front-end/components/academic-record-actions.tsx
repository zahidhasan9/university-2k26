"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Archive, LoaderCircle, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AcademicEntity } from "@/lib/academic-types";

export function AcademicRecordActions({
  entity,
  id,
  archived,
}: {
  entity: AcademicEntity;
  id: string;
  archived: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function archive() {
    if (
      !window.confirm(
        "Archive this record? Existing historical references will be preserved.",
      )
    )
      return;
    setLoading(true);
    const response = await fetch(`/api/backend/${entity}/${id}`, {
      method: "DELETE",
    });
    setLoading(false);
    if (response.ok) router.refresh();
  }

  return (
    <div className="flex justify-end gap-1">
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label="Edit record"
        render={<Link href={`/dashboard/academics/${entity}/${id}/edit`} />}
      >
        <Pencil />
      </Button>
      {entity !== "semesters" && !archived && (
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Archive record"
          disabled={loading}
          onClick={archive}
        >
          {loading ? <LoaderCircle className="animate-spin" /> : <Archive />}
        </Button>
      )}
    </div>
  );
}
