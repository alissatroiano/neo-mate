import React from 'react'
import { useAuth } from '../../contexts/AuthContext'
import AuthForm from './AuthForm'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, RefreshCw } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  const handleBackToLanding = () => {
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 flex flex-col">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-sm shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <button 
                onClick={handleBackToLanding}
                className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
              >
                <img 
                  src="/favicon.png" 
                  alt="Neomate" 
                  className="h-10 w-10"
                />
                <div className="flex flex-col">
                  <span className="text-2xl font-script text-teal-600">Neomate</span>
                  <span className="text-xs text-teal-500 uppercase tracking-wider font-light -mt-1">
                    Neonatal AI Assistant
                  </span>
                </div>
              </button>
              
              <button
                onClick={handleBackToLanding}
                className="flex items-center space-x-2 text-gray-600 hover:text-teal-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Home</span>
              </button>
            </div>
          </div>
        </header>

        {/* Loading Content */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-600">Loading your account...</p>
            <p className="text-sm text-gray-500">If this takes too long, please refresh the page</p>
            <button 
              onClick={() => window.location.reload()}
              className="text-teal-600 hover:text-teal-700 text-sm flex items-center space-x-1 mx-auto"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center text-sm text-gray-500">
              <p>© 2024 Neomate. All rights reserved. HIPAA compliant and secure.</p>
            </div>
          </div>
        </footer>
      </div>
    )
  }

  if (!user) {
    return <AuthPage />
  }

  return <>{children}</>
}

function AuthPage() {
  const [mode, setMode] = React.useState<'signin' | 'signup'>('signin')

  const handleSuccess = () => {
    // This will be handled by the auth context automatically
    console.log('Authentication successful')
  }

  return (
    <AuthForm
      mode={mode}
      onToggleMode={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
      onSuccess={handleSuccess}
    />
  )
}