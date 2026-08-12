import { describe, expect, it } from "vitest"
import { hasAnyPermission, primaryRole } from "@/lib/access-policy"

describe("access policy", () => {
  it("selects a deterministic primary role for multi-role users", () => {
    expect(primaryRole([{ code: "teacher" }, { code: "university_admin" }])).toBe("university_admin")
    expect(primaryRole([{ code: "student" }])).toBe("student")
  })

  it("shows an item when any accepted permission is assigned", () => {
    expect(hasAnyPermission(["academic.read"], ["structure.read", "academic.read"])).toBe(true)
    expect(hasAnyPermission(["library.read"], ["finance.read"])).toBe(false)
  })
})
