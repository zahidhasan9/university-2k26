export type ApiFeedback = { type: "success" | "error"; message: string }
export const API_FEEDBACK_EVENT = "unisphere:api-feedback"
export function emitApiFeedback(feedback: ApiFeedback) {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent<ApiFeedback>(API_FEEDBACK_EVENT, { detail: feedback }))
}
