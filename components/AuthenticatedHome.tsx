'use client'

interface AuthenticatedHomeProps {
  onGoToNotes: () => void
  onLogout: () => void
}

export default function AuthenticatedHome({ onGoToNotes, onLogout }: AuthenticatedHomeProps) {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Image - Aurora Borealis inspired */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-green-900 to-black">
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-md mx-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-8 bg-yellow-400 text-black font-bold text-sm tracking-wider mb-6">
            MYNOTES
          </div>
        </div>

        {/* Welcome Card */}
        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-8 shadow-2xl border border-gray-700">
          <h2 className="text-white text-2xl font-light mb-2 text-center">
            Welcome back!
          </h2>
          
          <p className="text-gray-300 text-sm text-center mb-8">
            You're already signed in. Ready to continue with your notes?
          </p>

          <div className="space-y-4">
            <button
              onClick={onGoToNotes}
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-3 px-4 rounded-lg transition-colors duration-200 text-sm tracking-wide"
            >
              Go to Your Notes
            </button>
            
            <button
              onClick={onLogout}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200 text-sm"
            >
              Sign Out
            </button>
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
      </div>
    </div>
  )
}
