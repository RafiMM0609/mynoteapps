'use client'

import { useState, useEffect } from 'react'
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/Toast'
import { PWAInstallPrompt, PWAStatus } from '../components/PWAInstallPrompt'
import LoginForm from '../components/LoginForm'
import RegisterForm from '../components/RegisterForm'
import AuthenticatedHome from '../components/AuthenticatedHome'
import type { AuthUser } from '../lib/auth'

export default function HomePage() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const [authLoading, setAuthLoading] = useState(false)
  const { toasts, showToast, removeToast } = useToast()

  // Check for existing auth token on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        if (token) {
          const response = await fetch('/api/auth/verify', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token }),
          })

          if (response.ok) {
            const userData = await response.json()
            setUser(userData.user)
          } else {
            localStorage.removeItem('auth_token')
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        localStorage.removeItem('auth_token')
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const handleLogin = async (email: string, password: string) => {
    setAuthLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('auth_token', data.token)
        setUser(data.user)
        showToast('Login successful!', 'success')
      } else {
        showToast(data.error || 'Login failed', 'error')
      }
    } catch (error) {
      showToast('Login failed. Please try again.', 'error')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleRegister = async (email: string, password: string) => {
    setAuthLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        localStorage.setItem('auth_token', data.token)
        setUser(data.user)
        showToast('Account created successfully!', 'success')
      } else {
        showToast(data.error || 'Registration failed', 'error')
      }
    } catch (error) {
      showToast('Registration failed. Please try again.', 'error')
    } finally {
      setAuthLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem('auth_token')
      if (token) {
        await fetch('/api/auth/verify', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('auth_token')
      setUser(null)
      showToast('Logged out successfully', 'info')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading...</span>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <>
        {authMode === 'login' ? (
          <LoginForm
            onLogin={handleLogin}
            onSwitchToRegister={() => setAuthMode('register')}
            isLoading={authLoading}
          />
        ) : (
          <RegisterForm
            onRegister={handleRegister}
            onSwitchToLogin={() => setAuthMode('login')}
            isLoading={authLoading}
          />
        )}
        <ToastContainer toasts={toasts} onRemove={removeToast} />
        <PWAInstallPrompt />
      </>
    )
  }

  return (
    <>
      <AuthenticatedHome user={user} onLogout={handleLogout} showToast={showToast} />
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <PWAInstallPrompt />
    </>
  )
}
