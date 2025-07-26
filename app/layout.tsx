import type React from "react"
import "./globals.css"
import { primaryFont } from "./fonts"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "MAFWBH Music Player",
  description: "A custom music player for your favorite tunes",
  icons: {
    icon: "/icon.png",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={primaryFont.className}>
      <body>{children}</body>
    </html>
  )
}
