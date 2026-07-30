"use client"

import { LoaderCircle, RotateCcw } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import Cropper, { type Area, type Point } from "react-easy-crop"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"

const outputSize = 512

async function cropImage(source: string, crop: Area) {
  const image = new Image()
  image.src = source
  await image.decode()

  const canvas = document.createElement("canvas")
  canvas.width = outputSize
  canvas.height = outputSize
  const context = canvas.getContext("2d", { alpha: false })
  if (!context) throw new Error("Image editor is not available")

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = "high"
  context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, outputSize, outputSize)

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Unable to create cropped image"))),
      "image/webp",
      0.92,
    )
  })
}

export function ImageCropDialog({
  source,
  onCancel,
  onConfirm,
}: {
  source: string | null
  onCancel: () => void
  onConfirm: (image: Blob) => Promise<void>
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [position, setPosition] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [pixels, setPixels] = useState<Area | null>(null)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const dialog = dialogRef.current
    if (source && dialog && !dialog.open) dialog.showModal()
    if (!source && dialog?.open) dialog.close()
  }, [source])

  function reset() {
    setPosition({ x: 0, y: 0 })
    setZoom(1)
    setError("")
  }

  async function confirm() {
    if (!source || !pixels) return
    setProcessing(true)
    setError("")
    try {
      await onConfirm(await cropImage(source, pixels))
      reset()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to crop image")
    } finally {
      setProcessing(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault()
        if (!processing) onCancel()
      }}
      className="m-auto w-[min(94vw,42rem)] overflow-hidden rounded-[24px] border border-white/20 bg-white p-0 text-slate-800 shadow-2xl backdrop:bg-slate-950/65"
    >
      <div className="border-b border-slate-100 px-6 py-5">
        <h2 className="text-lg font-semibold">Crop profile picture</h2>
        <p className="mt-1 text-sm text-slate-400">
          Drag the image and zoom until the visible area looks right.
        </p>
      </div>

      <div className="relative h-[min(58vh,28rem)] bg-slate-950">
        {source && (
          <Cropper
            image={source}
            crop={position}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid
            onCropChange={setPosition}
            onZoomChange={setZoom}
            onCropComplete={(_area, areaPixels) => setPixels(areaPixels)}
          />
        )}
      </div>

      <div className="space-y-3 border-t border-slate-100 px-6 py-5">
        <div className="flex items-center gap-4">
          <Label htmlFor="crop-zoom" className="shrink-0">
            Zoom
          </Label>
          <input
            id="crop-zoom"
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="h-2 flex-1 cursor-pointer accent-violet-600"
          />
          <Button type="button" variant="ghost" size="icon" onClick={reset} aria-label="Reset crop">
            <RotateCcw />
          </Button>
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
        <Button type="button" variant="outline" disabled={processing} onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={processing || !pixels}
          className="bg-violet-600 hover:bg-violet-700"
          onClick={confirm}
        >
          {processing && <LoaderCircle className="animate-spin" />}
          Crop & upload
        </Button>
      </div>
    </dialog>
  )
}
