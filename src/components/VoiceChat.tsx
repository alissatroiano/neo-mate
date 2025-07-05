import React, { useEffect, useRef, useState } from 'react'
import { Mic, MicOff, Volume2, VolumeX, Loader, AlertCircle, Settings } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface VoiceChatProps {
  isOpen: boolean
  onClose: () => void
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': {
        'agent-id': string
        children?: React.ReactNode
      }
    }
  }
}

export default function VoiceChat({ isOpen, onClose }: VoiceChatProps) {
  const widgetRef = useRef<HTMLDivElement>(null)
  const [isWidgetLoaded, setIsWidgetLoaded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [signedUrl, setSignedUrl] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID || 'agent_01jz6bx45qfxvsxyrakxgvkqft'

  useEffect(() => {
    if (isOpen) {
      getSignedUrl()
    }
  }, [isOpen])

  const getSignedUrl = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log('Getting signed URL for ElevenLabs agent:', agentId)
      
      // Use Supabase client to call the edge function
      const { data, error: functionError } = await supabase.functions.invoke('elevenlabs-auth', {
        body: { agent_id: agentId }
      })

      console.log('Edge function response:', { data, error: functionError })
      setDebugInfo({ data, error: functionError, agentId })

      if (functionError) {
        console.error('Edge function error:', functionError)
        throw new Error(functionError.message || 'Failed to get authorization')
      }

      if (!data?.signed_url) {
        throw new Error('No signed URL received from authorization service')
      }

      console.log('Signed URL obtained successfully:', data.signed_url.substring(0, 50) + '...')
      setSignedUrl(data.signed_url)
      
      // Now load the widget
      await loadElevenLabsWidget()
      
    } catch (error) {
      console.error('Error getting signed URL:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to authorize voice chat'
      setError(errorMessage)
      setDebugInfo(prev => ({ ...prev, clientError: errorMessage }))
    } finally {
      setIsLoading(false)
    }
  }

  const loadElevenLabsWidget = async () => {
    try {
      // Check if the script is already loaded
      if (!document.querySelector('script[src*="convai-widget-embed"]')) {
        console.log('Loading ElevenLabs widget script...')
        
        const script = document.createElement('script')
        script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed'
        script.async = true
        script.type = 'text/javascript'
        
        // Wait for script to load
        await new Promise((resolve, reject) => {
          script.onload = () => {
            console.log('ElevenLabs script loaded successfully')
            resolve(true)
          }
          script.onerror = () => {
            console.error('Failed to load ElevenLabs script')
            reject(new Error('Failed to load ElevenLabs script'))
          }
          document.head.appendChild(script)
        })
      }

      // Wait a bit for the custom element to be defined
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Check if the custom element is defined
      if (customElements.get('elevenlabs-convai')) {
        console.log('ElevenLabs custom element is ready')
        setIsWidgetLoaded(true)
      } else {
        console.log('Waiting for ElevenLabs custom element to be defined...')
        // Wait for the custom element to be defined
        await customElements.whenDefined('elevenlabs-convai')
        console.log('ElevenLabs custom element is now defined')
        setIsWidgetLoaded(true)
      }
    } catch (error) {
      console.error('Error loading ElevenLabs widget:', error)
      setError('Failed to load voice chat widget')
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-cyan-600 p-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Mic className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">Voice Chat with Neomate</h3>
                <p className="text-sm text-teal-100">Speak naturally with your AI companion</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Widget Container */}
        <div className="p-6" ref={widgetRef}>
          {/* Debug Info (only show in development) */}
          {import.meta.env.DEV && debugInfo && (
            <details className="mb-4 text-xs">
              <summary className="cursor-pointer text-gray-500 hover:text-gray-700">
                Debug Info (Dev Only)
              </summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </details>
          )}

          {error ? (
            <div className="text-center py-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-center space-x-2 text-red-700">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Voice Chat Error</span>
                </div>
                <p className="text-xs text-red-600 mt-1">{error}</p>
                {(error.includes('API key') || error.includes('not configured')) && (
                  <div className="mt-3 p-3 bg-red-100 rounded text-xs text-red-700">
                    <p className="font-medium mb-1">Configuration Required:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Get your ElevenLabs API key from <a href="https://elevenlabs.io" target="_blank" className="underline">elevenlabs.io</a></li>
                      <li>Go to your <a href="https://supabase.com/dashboard/project/omkhwrtmdpfwsgktycli/settings/functions" target="_blank" className="underline">Supabase Dashboard</a></li>
                      <li>Navigate to Settings → Edge Functions</li>
                      <li>Add environment variable: <code className="bg-red-200 px-1 rounded">ELEVENLABS_API_KEY</code></li>
                      <li>Set the value to your ElevenLabs API key</li>
                    </ol>
                  </div>
                )}
                {error.includes('agent') && (
                  <p className="text-xs text-red-600 mt-2">
                    Agent ID: {agentId}. Make sure this agent exists in your ElevenLabs account.
                  </p>
                )}
              </div>
              <button
                onClick={getSignedUrl}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Authorizing voice chat...</p>
              <p className="text-xs text-gray-500 mt-1">Getting secure connection to ElevenLabs</p>
            </div>
          ) : !isWidgetLoaded ? (
            <div className="text-center py-8">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-center space-x-2 text-yellow-700">
                  <Loader className="h-5 w-5" />
                  <span className="text-sm font-medium">Setting up voice chat...</span>
                </div>
                <p className="text-xs text-yellow-600 mt-1">
                  Please wait while we initialize the voice interface
                </p>
              </div>
              <button
                onClick={getSignedUrl}
                className="bg-teal-500 text-white px-4 py-2 rounded-lg hover:bg-teal-600 transition-colors"
              >
                Retry Loading
              </button>
            </div>
          ) : (
            <>
              <div className="text-center mb-4">
                <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-center space-x-2 text-teal-700">
                    <Volume2 className="h-5 w-5" />
                    <span className="text-sm font-medium">Voice chat is ready</span>
                  </div>
                  <p className="text-xs text-teal-600 mt-1">
                    Click the microphone to start speaking with Neomate
                  </p>
                </div>
              </div>

              {/* ElevenLabs Widget */}
              <div className="flex justify-center">
                {signedUrl ? (
                  <elevenlabs-convai agent-id={agentId} />
                ) : (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-600">Preparing voice chat...</p>
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="mt-6 space-y-3 text-sm text-gray-600">
                <div className="flex items-start space-x-2">
                  <Mic className="h-4 w-4 text-teal-500 mt-0.5 flex-shrink-0" />
                  <p>Click the microphone button to start speaking</p>
                </div>
                <div className="flex items-start space-x-2">
                  <Volume2 className="h-4 w-4 text-teal-500 mt-0.5 flex-shrink-0" />
                  <p>Neomate will respond with voice and understanding</p>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-4 h-4 bg-teal-500 rounded-full mt-1 flex-shrink-0"></div>
                  <p>Speak naturally about your NICU concerns and questions</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Voice conversations are private and secure. Neomate provides support but is not a replacement for medical care.
          </p>
        </div>
      </div>
    </div>
  )
}