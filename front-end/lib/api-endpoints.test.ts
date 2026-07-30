import { describe, expect, it } from "vitest"

import { API_ENDPOINTS } from "@/lib/api-endpoints"

describe("API_ENDPOINTS", () => {
  it("builds entity detail paths without duplicating the API prefix", () => {
    expect(API_ENDPOINTS.users.detail("user-1")).toBe("/users/user-1")
    expect(API_ENDPOINTS.students.detail("student-1")).toBe("/students/student-1")
    expect(API_ENDPOINTS.teachers.detail("teacher-1")).toBe("/teachers/teacher-1")
  })

  it("builds mutation paths with their resource identifiers", () => {
    expect(API_ENDPOINTS.attendance.records("session-1")).toBe("/attendance/session-1/records")
    expect(API_ENDPOINTS.lms.gradeSubmission("submission-1")).toBe(
      "/lms/submissions/submission-1/grade",
    )
    expect(API_ENDPOINTS.research.thesisAction("thesis-1")).toBe(
      "/research/theses/thesis-1/supervisor-action",
    )
  })
})
