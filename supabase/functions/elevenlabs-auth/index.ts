/*
  # ElevenLabs Authentication Function

  1. Purpose
    - Provides secure authentication for ElevenLabs voice chat
    - Generates signed URLs for conversation sessions
    - Keeps API keys secure on the server side

  2. Security
    - API key is stored securely in environment variables
    - Only authenticated users can access this endpoint
    - CORS headers configured for frontend access
*/

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-client-info, apikey",
  "Access-Control-Max-Age": "86400",
}

const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY")
console.log('ElevenLabs API Key configured:', !!ELEVENLABS_API_KEY);

serve(async (req: Request) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] ${req.method} ${req.url}`)
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log('Handling CORS preflight request')
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    if (!ELEVENLABS_API_KEY) {
      console.error('ElevenLabs API key not configured')
      return new Response(
        JSON.stringify({ error: 'ElevenLabs API key not configured' }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }

    // Get the agent ID from query parameters
    const url = new URL(req.url)
    const agentId = url.searchParams.get('agent_id')

    if (!agentId) {
      console.error('Agent ID is required')
      return new Response(
        JSON.stringify({ error: 'Agent ID is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }

    console.log(`Getting signed URL for agent: ${agentId}`)

    // Set up request headers with ElevenLabs API key
    const requestHeaders: HeadersInit = new Headers()
    requestHeaders.set("xi-api-key", ELEVENLABS_API_KEY)

    // Make request to ElevenLabs API for signed URL
    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id=${agentId}`,
      {
        method: "GET",
        headers: requestHeaders,
      }
    )

    console.log(`ElevenLabs API response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ElevenLabs API error:', response.status, response.statusText, errorText)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to get signed URL from ElevenLabs',
          details: errorText
        }),
        {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }

    const body = await response.json()
    console.log('Successfully obtained signed URL from ElevenLabs')
    
    return new Response(
      JSON.stringify({ signed_url: body.signed_url }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )
  } catch (error) {
    console.error('Error in elevenlabs-auth function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )
  }
})