import { describe, expect, it } from "vitest"

import { makeStore } from "@/store"
import { clearGlobalSearch, setGlobalSearch } from "@/store/ui-slice"

describe("ui slice", () => {
  it("stores and clears the shared dashboard search term", () => {
    const store = makeStore()

    store.dispatch(setGlobalSearch("computer science"))
    expect(store.getState().ui.globalSearch).toBe("computer science")

    store.dispatch(clearGlobalSearch())
    expect(store.getState().ui.globalSearch).toBe("")
  })
})
