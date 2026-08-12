"use client"
import { useEffect, useRef, useState } from "react"
import { CheckCircle2, X, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { API_FEEDBACK_EVENT, type ApiFeedback } from "@/lib/feedback-events"

export function GlobalFeedback() {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [feedback, setFeedback] = useState<ApiFeedback | null>(null)
  function close() { if (timerRef.current) clearTimeout(timerRef.current); timerRef.current = null; dialogRef.current?.close(); setFeedback(null) }
  useEffect(() => { const receive = (event: Event) => { const next = (event as CustomEvent<ApiFeedback>).detail; if (timerRef.current) clearTimeout(timerRef.current); setFeedback(next); requestAnimationFrame(() => { const dialog = dialogRef.current; if (dialog && !dialog.open) dialog.showModal() }); if (next.type === "success") timerRef.current = setTimeout(close, 2200) }; window.addEventListener(API_FEEDBACK_EVENT, receive); return () => { window.removeEventListener(API_FEEDBACK_EVENT, receive); if (timerRef.current) clearTimeout(timerRef.current) } }, [])
  return <dialog ref={dialogRef} onCancel={(event) => { event.preventDefault(); close() }} className="m-auto w-[min(90vw,25rem)] rounded-2xl border bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/35">
    {feedback && <div className="p-6 text-center"><button type="button" onClick={close} className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted" aria-label="Close notification"><X className="size-4" /></button><span className={`mx-auto grid size-14 place-items-center rounded-full ${feedback.type === "success" ? "bg-emerald-100 text-emerald-700" : "bg-destructive/10 text-destructive"}`}>{feedback.type === "success" ? <CheckCircle2 className="size-7" /> : <XCircle className="size-7" />}</span><h2 className="mt-4 text-lg font-bold">{feedback.type === "success" ? "Successful" : "Action failed"}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{feedback.message}</p>{feedback.type === "error" && <Button type="button" className="mt-5 w-full" onClick={close}>Close</Button>}</div>}
  </dialog>
}
