"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"
import { ImageUp, LoaderCircle, Save } from "lucide-react"
import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ImageCropDialog } from "@/components/image-crop-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { API_ENDPOINTS } from "@/lib/api-endpoints"
import { apiRequest } from "@/lib/http-client"

type Address = {
  line1?: string
  line2?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
}

export type EditableProfile = {
  firstName: string
  lastName: string
  email?: string
  canSetEmail?: boolean
  phone?: string
  avatarUrl?: string
  address?: Address
}

export function ProfileEditForm({ user }: { user: EditableProfile }) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl ?? "")
  const [message, setMessage] = useState("")
  const [cropSource, setCropSource] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: (payload: {
      email?: string
      phone?: string
      avatarUrl?: string
      address: Address
    }) =>
      apiRequest<{ user: EditableProfile }>(API_ENDPOINTS.users.me, {
        method: "PATCH",
        data: payload,
      }),
    onSuccess: async () => {
      setMessage("Profile updated successfully.")
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] })
      router.refresh()
    },
    onError: (error) =>
      setMessage(error instanceof Error ? error.message : "Profile update failed"),
  })

  const imageMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData()
      formData.append("image", file)
      return apiRequest<{
        image: { url: string; storage: "local" | "cloudinary" }
        user: EditableProfile
      }>(API_ENDPOINTS.uploads.profileImage, {
        method: "POST",
        data: formData,
      })
    },
    onSuccess: async (response) => {
      setAvatarPreview(response.data.image.url)
      setMessage(`Profile picture uploaded to ${response.data.image.storage}.`)
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] })
      router.refresh()
    },
    onError: (error) =>
      setMessage(error instanceof Error ? error.message : "Profile picture upload failed"),
  })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage("")
    const values = Object.fromEntries(new FormData(event.currentTarget).entries()) as Record<
      string,
      string
    >
    const optional = (value: string) => value.trim() || undefined
    mutation.mutate({
      ...(user.canSetEmail ? { email: optional(values.email) } : {}),
      phone: optional(values.phone),
      avatarUrl: optional(values.avatarUrl),
      address: {
        line1: optional(values.line1),
        line2: optional(values.line2),
        city: optional(values.city),
        state: optional(values.state),
        country: optional(values.country),
        postalCode: optional(values.postalCode),
      },
    })
  }

  const initials = `${user.firstName[0] ?? ""}${user.lastName[0] ?? ""}`.toUpperCase()

  function closeCropper() {
    if (cropSource) URL.revokeObjectURL(cropSource)
    setCropSource(null)
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <ImageCropDialog
        source={cropSource}
        onCancel={closeCropper}
        onConfirm={async (blob) => {
          const file = new File([blob], "profile-picture.webp", { type: "image/webp" })
          await imageMutation.mutateAsync(file)
          closeCropper()
        }}
      />
      <div className="flex flex-col gap-5 rounded-2xl border border-violet-100 bg-violet-50/40 p-5 sm:flex-row sm:items-center">
        <Avatar className="size-28 rounded-2xl shadow-sm [&_[data-slot=avatar-fallback]]:rounded-2xl [&_[data-slot=avatar-image]]:rounded-2xl">
          {avatarPreview && <AvatarImage src={avatarPreview} alt="" />}
          <AvatarFallback className="bg-violet-600 text-xl font-semibold text-white">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor="profileImage">Profile picture</Label>
          <Input
            id="profileImage"
            name="profileImage"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={imageMutation.isPending}
            className="cursor-pointer bg-white file:mr-3 file:font-semibold file:text-violet-600"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) setCropSource(URL.createObjectURL(file))
              event.target.value = ""
            }}
          />
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {imageMutation.isPending ? (
              <LoaderCircle className="size-4 animate-spin text-violet-600" />
            ) : (
              <ImageUp className="size-4 text-violet-500" />
            )}
            {imageMutation.isPending
              ? "Uploading profile picture..."
              : "JPEG, PNG, WebP or GIF. Select, crop, then upload."}
          </div>
          <Label htmlFor="avatarUrl" className="pt-1 text-xs text-slate-500">
            Or use an image URL
          </Label>
          <Input
            id="avatarUrl"
            name="avatarUrl"
            type="url"
            value={avatarPreview}
            placeholder="https://example.com/profile.jpg"
            onChange={(event) => setAvatarPreview(event.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {user.canSetEmail && (
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="email">Email address</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required />
            <p className="text-xs text-amber-600">
              You can add your email once. After saving, only an administrator can change it.
            </p>
          </div>
        )}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            type="tel"
            defaultValue={user.phone}
            placeholder="+880 1XXX-XXXXXX"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="line1">Address line 1</Label>
          <Input id="line1" name="line1" defaultValue={user.address?.line1} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="line2">Address line 2</Label>
          <Input id="line2" name="line2" defaultValue={user.address?.line2} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input id="city" name="city" defaultValue={user.address?.city} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State / Division</Label>
          <Input id="state" name="state" defaultValue={user.address?.state} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input id="country" name="country" defaultValue={user.address?.country} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="postalCode">Postal code</Label>
          <Input id="postalCode" name="postalCode" defaultValue={user.address?.postalCode} />
        </div>
      </div>

      {message && (
        <p
          role="status"
          className={`rounded-xl px-4 py-3 text-sm ${
            mutation.isError || imageMutation.isError
              ? "bg-rose-50 text-rose-700"
              : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {message}
        </p>
      )}

      <Button
        type="submit"
        disabled={mutation.isPending}
        className="rounded-xl bg-violet-600 px-5 hover:bg-violet-700"
      >
        {mutation.isPending ? <LoaderCircle className="animate-spin" /> : <Save />}
        Save profile
      </Button>
    </form>
  )
}
