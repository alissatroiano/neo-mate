import React, { useState } from 'react'
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle, Info, ArrowLeft } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

interface AuthFormProps {
  mode: 'signin' | 'signup'
  onToggleMode: () => void
  onSuccess?: () => void
}

export default function AuthForm({ mode, onToggleMode, onSuccess }: AuthFormProps) {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showEmailVerification, setShowEmailVerification] = useState(false)
  const [signUpSuccess, setSignUpSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      let result
      if (mode === 'signup') {
        result = await signUp(formData.email, formData.password, formData.fullName)
        if (!result.error) {
          // For now, show success message instead of email verification
          setSignUpSuccess(true)
          return
        }
      } else {
        result = await signIn(formData.email, formData.password)
      }

      if (result.error) {
        if (result.error.message.includes('Email not confirmed')) {
          setError('Please check your email and click the confirmation link before signing in.')
        } else if (result.error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials and try again.')
        } else if (result.error.message.includes('User already registered')) {
          setError('An account with this email already exists. Please sign in instead.')
        } else {
          setError(result.error.message)
        }
      } else if (mode === 'signin') {
        onSuccess?.()
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    // Clear error when user starts typing
    if (error) {
      setError(null)
    }
  }

  const handleBackToSignIn = () => {
    setShowEmailVerification(false)
    setSignUpSuccess(false)
    setFormData({ email: '', password: '', fullName: '' })
    setError(null)
    // Switch to sign-in mode if we're currently in signup mode
    if (mode === 'signup') {
      onToggleMode()
    }
  }

  const handleBackToLanding = () => {
    navigate('/')
  }

  const handleTrySignIn = () => {
    setSignUpSuccess(false)
    setFormData(prev => ({ ...prev, password: '' }))
    setError(null)
    if (mode === 'signup') {
      onToggleMode()
    }
  }

  if (signUpSuccess) {
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

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-xl w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Account Created Successfully!
              </h2>
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-6 mb-6">
                <CheckCircle className="h-12 w-12 text-teal-600 mx-auto mb-4" />
                <p className="text-gray-700 leading-relaxed">
                  Welcome to Neomate! Your account has been created successfully. 
                  You can now sign in and start your journey with our compassionate AI assistant.
                </p>
              </div>
              
              <div className="space-y-4">
                <button
                  onClick={handleTrySignIn}
                  className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white py-3 px-4 rounded-lg hover:from-teal-600 hover:to-cyan-700 transition-all duration-300 font-semibold"
                >
                  Sign In Now
                </button>
                
                <button
                  onClick={handleBackToLanding}
                  className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-all duration-300 font-semibold"
                >
                  Back to Home
                </button>
              </div>
            </div>
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

  if (showEmailVerification) {
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

        {/* Main Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-8">
            <div className="text-center">
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-3 rounded-xl w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Check Your Email
              </h2>
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-6 mb-6">
                <Mail className="h-12 w-12 text-teal-600 mx-auto mb-4" />
                <p className="text-gray-700 leading-relaxed">
                  We've sent a confirmation email to <strong>{formData.email}</strong>. 
                  Please click the link in the email to verify your account and complete your registration.
                </p>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="text-sm text-amber-800 font-medium mb-1">Important:</p>
                    <p className="text-sm text-amber-700">
                      After clicking the confirmation link, you'll be redirected back to Neomate where you can sign in with your new account.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleBackToSignIn}
                  className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white py-3 px-4 rounded-lg hover:from-teal-600 hover:to-cyan-700 transition-all duration-300 font-semibold"
                >
                  Back to Sign In
                </button>
                
                <p className="text-sm text-gray-500">
                  Didn't receive the email? Check your spam folder or{' '}
                  <button 
                    onClick={() => {
                      setShowEmailVerification(false)
                      setFormData(prev => ({ ...prev, password: '' }))
                    }}
                    className="text-teal-600 hover:text-teal-700 font-medium"
                  >
                    try signing up again
                  </button>
                </p>
              </div>
            </div>
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

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8">
          {/* Auth Form Header */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              {mode === 'signin' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="mt-2 text-gray-600">
              {mode === 'signin' 
                ? 'Sign in to continue your journey with compassionate AI support'
                : 'Join thousands of families finding comfort and guidance'
              }
            </p>
          </div>

          {/* Form */}
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                    placeholder="Enter your email"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
                {mode === 'signup' && (
                  <p className="mt-1 text-sm text-gray-500">
                    Password must be at least 6 characters long
                  </p>
                )}
              </div>
            </div>

            {mode === 'signup' && (
              <div className="bg-teal-50 border border-teal-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Info className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-teal-800">
                    <p className="font-medium mb-1">Quick Setup</p>
                    <p>Your account will be created instantly so you can start chatting with Neomate right away.</p>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 text-white py-3 px-4 rounded-lg hover:from-teal-600 hover:to-cyan-700 focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{mode === 'signin' ? 'Signing in...' : 'Creating account...'}</span>
                </div>
              ) : (
                mode === 'signin' ? 'Sign In' : 'Create Account'
              )}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={onToggleMode}
                className="text-teal-600 hover:text-teal-700 font-medium"
              >
                {mode === 'signin' 
                  ? "Don't have an account? Sign up" 
                  : 'Already have an account? Sign in'
                }
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-500">
            <p>By continuing, you agree to our Terms of Service and Privacy Policy</p>
            <p className="mt-1">🔒 HIPAA compliant and secure</p>
          </div>
        </div>
      </footer>
    </div>
  )
}