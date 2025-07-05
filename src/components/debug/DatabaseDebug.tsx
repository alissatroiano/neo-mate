import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'
import { AlertCircle, CheckCircle, RefreshCw } from 'lucide-react'

interface DatabaseDebugProps {
  isOpen: boolean
  onClose: () => void
}

export default function DatabaseDebug({ isOpen, onClose }: DatabaseDebugProps) {
  const { user } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runDiagnostics = async () => {
    if (!user) return
    
    setLoading(true)
    const info: any = {
      user: null,
      profile: null,
      conversations: null,
      messages: null,
      errors: []
    }

    try {
      // Check user info
      info.user = {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata,
        created_at: user.created_at
      }

      // Check if profile exists
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          info.errors.push(`Profile error: ${profileError.message}`)
          info.profile = null
        } else {
          info.profile = profileData
        }
      } catch (error) {
        info.errors.push(`Profile fetch error: ${error}`)
      }

      // Check conversations
      try {
        const { data: conversationsData, error: conversationsError } = await supabase
          .from('conversations')
          .select('*')
          .limit(5)

        if (conversationsError) {
          info.errors.push(`Conversations error: ${conversationsError.message}`)
        } else {
          info.conversations = conversationsData
        }
      } catch (error) {
        info.errors.push(`Conversations fetch error: ${error}`)
      }

      // Check messages
      try {
        const { data: messagesData, error: messagesError } = await supabase
          .from('messages')
          .select('*')
          .limit(5)

        if (messagesError) {
          info.errors.push(`Messages error: ${messagesError.message}`)
        } else {
          info.messages = messagesData
        }
      } catch (error) {
        info.errors.push(`Messages fetch error: ${error}`)
      }

      // Try to create profile if it doesn't exist
      if (!info.profile && user) {
        try {
          console.log('Attempting to create missing profile for user:', user.id)
          console.log('User email:', user.email)
          console.log('User metadata:', user.user_metadata)
          
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single()

          if (createError) {
            console.error('Profile creation failed:', createError)
            info.errors.push(`Profile creation error: ${createError.message}`)
            
            // Try alternative approach - call the Supabase function
            try {
              console.log('Trying to call create_missing_profiles function...')
              const { data: functionResult, error: functionError } = await supabase
                .rpc('create_missing_profiles')
              
              if (functionError) {
                info.errors.push(`Function call error: ${functionError.message}`)
              } else {
                console.log('Function result:', functionResult)
                info.functionResult = functionResult
                
                // Try to fetch profile again
                const { data: retryProfile } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', user.id)
                  .single()
                
                if (retryProfile) {
                  info.profile = retryProfile
                  info.profileCreated = true
                }
              }
            } catch (funcError) {
              info.errors.push(`Function exception: ${funcError}`)
            }
          } else {
            console.log('Profile created successfully:', newProfile)
            info.profile = newProfile
            info.profileCreated = true
          }
        } catch (error) {
          console.error('Profile creation exception:', error)
          info.errors.push(`Profile creation exception: ${error}`)
        }
      }

    } catch (error) {
      info.errors.push(`General error: ${error}`)
    }

    setDebugInfo(info)
    setLoading(false)
  }

  useEffect(() => {
    if (isOpen && user) {
      runDiagnostics()
    }
  }, [isOpen, user])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Database Debug Info</h3>
            <div className="flex items-center space-x-2">
              <button
                onClick={runDiagnostics}
                disabled={loading}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {loading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-gray-600">Running diagnostics...</p>
            </div>
          ) : debugInfo ? (
            <div className="space-y-6">
              {/* Errors */}
              {debugInfo.errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <h4 className="font-medium text-red-900">Errors Found</h4>
                  </div>
                  <ul className="text-sm text-red-700 space-y-1">
                    {debugInfo.errors.map((error: string, index: number) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* User Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">User Information</h4>
                <pre className="text-xs text-blue-800 overflow-x-auto">
                  {JSON.stringify(debugInfo.user, null, 2)}
                </pre>
              </div>

              {/* Profile Info */}
              <div className={`border rounded-lg p-4 ${
                debugInfo.profile 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-center space-x-2 mb-2">
                  {debugInfo.profile ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  )}
                  <h4 className={`font-medium ${
                    debugInfo.profile ? 'text-green-900' : 'text-yellow-900'
                  }`}>
                    Profile {debugInfo.profile ? 'Found' : 'Missing'}
                    {debugInfo.profileCreated && ' (Just Created)'}
                  </h4>
                </div>
                {debugInfo.profile ? (
                  <pre className={`text-xs overflow-x-auto ${
                    debugInfo.profile ? 'text-green-800' : 'text-yellow-800'
                  }`}>
                    {JSON.stringify(debugInfo.profile, null, 2)}
                  </pre>
                ) : (
                  <p className="text-sm text-yellow-800">
                    No profile found in database. This might be why you're not seeing profiles in Supabase.
                  </p>
                )}
              </div>

              {/* Conversations */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  Conversations ({debugInfo.conversations?.length || 0})
                </h4>
                <pre className="text-xs text-gray-700 overflow-x-auto">
                  {JSON.stringify(debugInfo.conversations, null, 2)}
                </pre>
              </div>

              {/* Messages */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  Messages ({debugInfo.messages?.length || 0})
                </h4>
                <pre className="text-xs text-gray-700 overflow-x-auto">
                  {JSON.stringify(debugInfo.messages, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Click refresh to run diagnostics</p>
          )}
        </div>
      </div>
    </div>
  )
}