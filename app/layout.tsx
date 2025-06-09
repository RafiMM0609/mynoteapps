import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MyNote App',
  description: 'A simple note-taking application with HTML support',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        {children}
      </body>
    </html>
  )
}
