'use client'

import { useState } from 'react'
import Link from 'next/link'

interface LoginFormProps {
  onLoginSuccess: (token: string) => void
}

export default function LoginForm({ onLoginSuccess }: LoginFormProps) {
  const [step, setStep] = useState<'email' | 'password'>('email')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Please enter your email')
      return
    }
    
    setError('')
    setStep('password')
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password.trim()) {
      setError('Please enter your password')
      return
    }

    setIsLoading(true)
    setError('')

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
        onLoginSuccess(data.token)
      } else {
        setError(data.error || 'Login failed')
        // If user doesn't exist, register them
        if (data.error === 'User not found') {
          await handleRegister()
        }
      }
    } catch (error) {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async () => {
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
        onLoginSuccess(data.token)
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch (error) {
      setError('Network error. Please try again.')
    }
  }

  const handleBack = () => {
    setStep('email')
    setPassword('')
    setError('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Image - Aurora Borealis inspired */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-green-900 to-black">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Login Form Container */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-8 bg-yellow-400 text-black font-bold text-sm tracking-wider mb-6">
            Anton
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-8 shadow-2xl border border-gray-700">
          <h2 className="text-white text-2xl font-light mb-2 text-center">
            {step === 'email' ? 'Enter your email' : 'Enter your password'}
          </h2>
          
          <p className="text-gray-300 text-sm text-center mb-8">
            {step === 'email' 
              ? "Log into your MyNotes account. If you don't have one, we'll help you create one."
              : `Welcome back! Please enter your password for ${email}`
            }
          </p>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-white text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                  placeholder="Enter your email address"
                  required
                />
              </div>
              
              <button
                type="submit"
                className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 px-4 rounded-lg transition-colors duration-200 text-sm tracking-wide"
              >
                Continue
              </button>
            </form>
          ) : (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-white text-sm font-medium mb-2">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  required
                  autoFocus
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 text-sm"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-yellow-400 hover:bg-yellow-500 disabled:bg-yellow-600 disabled:cursor-not-allowed text-black font-semibold py-3 px-4 rounded-lg transition-colors duration-200 text-sm tracking-wide"
                >
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </button>
              </div>
            </form>          )}          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <Link 
                href="/register" 
                className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
              >
                Create one
              </Link>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-700">
            <p className="text-gray-400 text-xs text-center">
              MyNotes is part of the productivity suite.
            </p>
            
            <div className="flex justify-center space-x-4 mt-4">
              <div className="flex items-center space-x-2 opacity-60">
                <div className="w-4 h-2 bg-gray-600 rounded"></div>
                <div className="w-4 h-2 bg-gray-600 rounded"></div>
                <div className="w-4 h-2 bg-gray-600 rounded"></div>
                <div className="w-4 h-2 bg-gray-600 rounded"></div>
                <div className="w-4 h-2 bg-gray-600 rounded"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom text */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-xs">
            If you've used your email with one of our services, please enter the same password you've used before.
          </p>
        </div>
      </div>
    </div>
  )
}
