import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '✨ Kagita Notes - Magical Note-Taking Experience',
  description: 'A delightfully modern note-taking application that sparks joy and creativity - built with Next.js, TypeScript, and Supabase',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          {children}
        </div>
      </body>
    </html>
  )
}
