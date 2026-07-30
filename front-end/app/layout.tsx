import type { Metadata } from "next"
import "./globals.css"
import { AppProviders } from "@/components/app-providers"

export const metadata: Metadata = {
  title: {
    default: "UniSphere",
    template: "%s | UniSphere",
  },
  description: "A unified university management platform",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
