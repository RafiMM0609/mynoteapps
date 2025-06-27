import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '✨ Kagita Notes - Magical Note-Taking Experience',
  description: 'A delightfully modern note-taking application that sparks joy and creativity - built with Next.js, TypeScript, and Supabase',
  viewport: 'width=device-width, initial-scale=1, viewport-fit=cover',
  manifest: '/manifest.json',
  themeColor: '#764ba2',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kagita Notes',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/icons/icon-192x192.png',
    shortcut: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Kagita Notes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#764ba2" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-500 to-red-500">
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          {children}
        </div>
      </body>
    </html>
  )
}
