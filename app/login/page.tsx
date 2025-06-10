'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import LoginForm from '@/components/LoginForm'

export default function LoginPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      // Verify token is still valid
      fetch('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      .then(response => {
        if (response.ok) {
          setIsAuthenticated(true)
          router.push('/')
        } else {
          localStorage.removeItem('auth_token')
          setIsLoading(false)
        }
      })
      .catch(() => {
        localStorage.removeItem('auth_token')
        setIsLoading(false)
      })
    } else {
      setIsLoading(false)
    }
  }, [router])
  const handleLoginSuccess = (token: string) => {
    localStorage.setItem('auth_token', token)
    setIsAuthenticated(true)
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-green-900 to-black">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  if (isAuthenticated) {
    return null // Will redirect to home
  }

  return <LoginForm onLoginSuccess={handleLoginSuccess} />
}
