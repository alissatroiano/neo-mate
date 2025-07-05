import React, { useEffect, useRef } from 'react'
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react'

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
  const agentId = import.meta.env.VITE_ELEVENLABS_AGENT_ID

  useEffect(() => {
    if (isOpen && agentId) {
      // Load the ElevenLabs widget script if not already loaded
      if (!document.querySelector('script[src*="convai-widget-embed"]')) {
        const script = document.createElement('script')
        script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed'
        script.async = true
        script.type = 'text/javascript'
        document.head.appendChild(script)
      }
    }
  }, [isOpen, agentId])

  if (!isOpen || !agentId) {
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
            <elevenlabs-convai agent-id={agentId} />
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