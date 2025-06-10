'use client'

import { useState } from 'react'
import Link from 'next/link'

interface RegisterFormProps {
  onRegisterSuccess: (token: string) => void
}

export default function RegisterForm({ onRegisterSuccess }: RegisterFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setError('Please enter your email')
      return
    }

    if (!password.trim()) {
      setError('Please enter your password')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)
    setError('')

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
        onRegisterSuccess(data.token)      } else {
        setError(data.error || 'Registration failed')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
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

      {/* Register Form Container */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-8 bg-yellow-400 text-black font-bold text-sm tracking-wider mb-6">
            Anton
          </div>
        </div>

        {/* Register Form */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-8 shadow-2xl border border-gray-700">
          <h2 className="text-white text-2xl font-light mb-2 text-center">
            Create your account
          </h2>
          
          <p className="text-gray-300 text-sm text-center mb-8">
            Join MyNotes and start organizing your thoughts today.
          </p>

          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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
                placeholder="Enter your password (min. 6 characters)"
                required
                minLength={6}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-white text-sm font-medium mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                placeholder="Confirm your password"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-yellow-400 hover:bg-yellow-500 disabled:bg-yellow-600 disabled:cursor-not-allowed text-black font-semibold py-3 px-4 rounded-lg transition-colors duration-200 text-sm tracking-wide"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <Link 
                href="/login" 
                className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors"
              >
                Sign in
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
            By creating an account, you agree to our terms of service and privacy policy.
          </p>
        </div>
      </div>
    </div>
  )
}
