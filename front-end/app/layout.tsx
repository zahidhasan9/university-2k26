import type { Metadata } from "next";
import "./globals.css";
import { ApiProvider } from "@/components/api-provider";

export const metadata: Metadata = {
  title: {
    default: "UniSphere",
    template: "%s | UniSphere",
  },
  description: "A unified university management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body><ApiProvider>{children}</ApiProvider></body>
    </html>
  );
}
