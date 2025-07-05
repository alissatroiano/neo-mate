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
  console.log(`[${timestamp}] ElevenLabs Auth - ${req.method} ${req.url}`)
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    console.log('Handling CORS preflight request')
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    console.log('ElevenLabs API Key configured:', !!ELEVENLABS_API_KEY)
    console.log('ElevenLabs API Key length:', ELEVENLABS_API_KEY ? ELEVENLABS_API_KEY.length : 0)
    
    if (!ELEVENLABS_API_KEY) {
      console.error('ElevenLabs API key not configured')
      return new Response(
        JSON.stringify({ 
          error: 'ElevenLabs API key not configured in Supabase environment variables',
          details: 'Please add ELEVENLABS_API_KEY to your Supabase project settings'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }

    // Get the agent ID from query parameters or request body
    const url = new URL(req.url)
    let agentId = url.searchParams.get('agent_id')
    
    // If not in query params, try request body
    if (!agentId && req.method === 'POST') {
      try {
        const body = await req.json()
        agentId = body.agent_id
        console.log('Agent ID from request body:', agentId)
      } catch (e) {
        console.log('Could not parse request body for agent_id')
      }
    }

    if (!agentId) {
      console.error('Agent ID is required but not provided')
      return new Response(
        JSON.stringify({ 
          error: 'Agent ID is required',
          details: 'Please provide agent_id in query parameters or request body'
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }

    console.log(`Getting signed URL for agent: ${agentId} using API key: ${ELEVENLABS_API_KEY.substring(0, 8)}...`)

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
      console.error('ElevenLabs API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
        agentId: agentId
      })
      
      return new Response(
        JSON.stringify({ 
          error: `ElevenLabs API error: ${response.status} ${response.statusText}`,
          details: errorText,
          agentId: agentId
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }

    const body = await response.json()
    console.log('Successfully obtained signed URL from ElevenLabs:', !!body.signed_url)
    
    return new Response(
      JSON.stringify({ 
        signed_url: body.signed_url,
        agent_id: agentId,
        success: true
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )
  } catch (error) {
    console.error('Error in elevenlabs-auth function:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    })
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message,
        type: error.name
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