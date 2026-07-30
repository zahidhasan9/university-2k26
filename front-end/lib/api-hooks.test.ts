import { describe, expect, it } from "vitest"

import { errorMessage } from "@/lib/api-hooks"

describe("errorMessage", () => {
  it("keeps actionable request errors", () => {
    expect(errorMessage(new Error("Permission denied"), "Action failed")).toBe("Permission denied")
  })

  it("uses a stable fallback for unknown errors", () => {
    expect(errorMessage({ reason: "unknown" }, "Action failed")).toBe("Action failed")
  })
})
