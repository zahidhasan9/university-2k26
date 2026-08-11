import { describe, expect, it } from "vitest"
import { CACHE_POLICY, QUERY_KEYS } from "@/lib/query-policy"

describe("query policy", () => {
  it("uses stable hierarchical keys", () => {
    expect(QUERY_KEYS.students({ page: 2 })).toEqual(["students", { page: 2 }])
    expect(QUERY_KEYS.lms("offering-1")).toEqual(["lms", "workspace", "offering-1"])
  })

  it("keeps reference data longer than operational data", () => {
    expect(CACHE_POLICY.reference.staleTime).toBeGreaterThan(CACHE_POLICY.operational.staleTime)
  })
})
