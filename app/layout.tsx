import './globals.css'
import { inter } from './fonts'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'trinity by mafwbh',
  description: '1st part of the trinity playlist',
  icons: {
    icon: '/icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className}>
      <body>{children}</body>
    </html>
  )
}

