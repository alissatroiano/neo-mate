import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { supabase, Profile } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  profile: Profile | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout

    // Set a maximum loading time to prevent infinite loading
    const maxLoadingTime = 10000 // 10 seconds
    timeoutId = setTimeout(() => {
      if (mounted && loading) {
        console.warn('Auth loading timeout reached, setting loading to false')
        setLoading(false)
      }
    }, maxLoadingTime)

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('Getting initial session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (!mounted) return

        if (error) {
          console.error('Error getting session:', error)
          // Clear any stale session data if there's an error
          await supabase.auth.signOut()
          setSession(null)
          setUser(null)
          setProfile(null)
        } else if (!session) {
          console.log('No active session found')
          setSession(null)
          setUser(null)
          setProfile(null)
        } else {
          console.log('Active session found for user:', session.user.email)
          setSession(session)
          setUser(session.user)
          
          if (session.user) {
            await fetchProfile(session.user.id)
          }
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error)
        if (mounted) {
          // Clear any stale session data on unexpected errors
          await supabase.auth.signOut()
          setSession(null)
          setUser(null)
          setProfile(null)
        }
      } finally {
        if (mounted) {
          clearTimeout(timeoutId)
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return

      console.log('Auth state changed:', event, session?.user?.email)
      
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        await fetchProfile(session.user.id)
      } else {
        setProfile(null)
      }
      
      clearTimeout(timeoutId)
      setLoading(false)
    })

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [])

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching profile:', error)
        // If profile doesn't exist, that's okay - user might be newly created
        if (error.code === 'PGRST116') {
          console.log('Profile not found, user might be newly created')
        }
        return
      }

      console.log('Profile fetched successfully')
      setProfile(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
    }
  }

  const getRedirectUrl = () => {
    // Check if we're in production (Netlify deployment)
    const hostname = typeof window !== 'undefined' ? window.location.hostname : ''
    
    if (hostname.includes('netlify.app') || hostname === 'neomate.app') {
      return `https://${hostname}/dashboard`
    }
    
    // For development
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/dashboard`
    }
    
    return '/dashboard'
  }

  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      console.log('Attempting to sign up user:', email)
      
      // Sign up with email confirmation disabled for now
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          // Remove email redirect for now to test without email confirmation
        },
      })
      
      if (error) {
        console.error('Sign up error:', error)
        return { error }
      }

      console.log('Sign up response:', data)
      
      // Check if user needs email confirmation
      if (data.user && !data.session) {
        console.log('User created but needs email confirmation')
        return { error: null }
      }
      
      // If we get a session immediately, the user is confirmed
      if (data.session) {
        console.log('User signed up and confirmed immediately')
        return { error: null }
      }
      
      return { error: null }
    } catch (error) {
      console.error('Sign up exception:', error)
      return { error }
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Attempting to sign in user:', email)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) {
        console.error('Sign in error:', error)
        return { error }
      }

      console.log('Sign in successful')
      return { error: null }
    } catch (error) {
      console.error('Sign in exception:', error)
      return { error }
    }
  }

  const signOut = async () => {
    try {
      console.log('Signing out user')
      await supabase.auth.signOut()
      setSession(null)
      setUser(null)
      setProfile(null)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'No user logged in' }

    try {
      console.log('Updating profile for user:', user.id)
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

      if (!error) {
        setProfile(prev => prev ? { ...prev, ...updates } : null)
        console.log('Profile updated successfully')
      } else {
        console.error('Profile update error:', error)
      }

      return { error }
    } catch (error) {
      console.error('Profile update exception:', error)
      return { error }
    }
  }

  const value = {
    user,
    profile,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}