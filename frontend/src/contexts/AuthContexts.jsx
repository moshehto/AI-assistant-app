//authcontexts.jsx
import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { getCurrentUserProfile, getOrganizationFeatures } from '../lib/auth'

const AuthContext = createContext({})

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [features, setFeatures] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🔧 AuthProvider: useEffect starting...')
    
    let mounted = true // Prevent state updates if component unmounts
    
    // Get initial session
    const initializeAuth = async () => {
      try {
        console.log('🔧 AuthProvider: Getting initial session...')
        const { data: { session } } = await supabase.auth.getSession()
        console.log('🔧 AuthProvider: Initial session result:', session)
        
        if (mounted) {
          if (session) {
            console.log('🔧 AuthProvider: Found existing session, setting user...')
            setUser(session.user)
            await loadUserProfile(session.user.id)
          }
          setLoading(false)
        }
      } catch (error) {
        console.error('🔧 AuthProvider: Error getting initial session:', error)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    initializeAuth()

    // Listen for auth changes
    console.log('🔧 AuthProvider: Setting up auth state change listener...')
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔧 AuthProvider: Auth state changed:', { event, session })
        
        if (!mounted) return
        
        if (event === 'SIGNED_IN' && session) {
          console.log('🔧 AuthProvider: User signed in, setting user state...')
          setUser(session.user)
          await loadUserProfile(session.user.id)
        } else if (event === 'SIGNED_OUT') {
          console.log('🔧 AuthProvider: User signed out, clearing state...')
          setUser(null)
          setProfile(null)
          setFeatures({})
        }
        
        setLoading(false)
      }
    )

    return () => {
      console.log('🔧 AuthProvider: Cleaning up subscription...')
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])

  const loadUserProfile = async (userId) => {
    try {
      console.log('🔧 AuthProvider: Loading user profile for:', userId)
      
      // Get the user profile with organization info
      const userProfile = await getCurrentUserProfile()
      console.log('🔧 AuthProvider: Profile loaded:', userProfile)
      
      if (userProfile) {
        setProfile(userProfile)
        
        // Load organization features if profile has organization
        if (userProfile.organization_id) {
          console.log('🔧 AuthProvider: Loading organization features...')
          const orgFeatures = await getOrganizationFeatures(userProfile.organization_id)
          console.log('🔧 AuthProvider: Features loaded:', orgFeatures)
          setFeatures(orgFeatures)
        }
      } else {
        console.log('🔧 AuthProvider: No profile found for user')
        setProfile(null)
        setFeatures({})
      }
    } catch (error) {
      console.error('🔧 AuthProvider: Error loading profile:', error)
      setProfile(null)
      setFeatures({})
    }
  }

  const value = {
    user,
    profile,
    features,
    loading,
    isAuthenticated: !!user,
    isAdmin: profile?.role === 'admin',
    organizationId: profile?.organization_id,
    organizationName: profile?.organization?.name,
    refreshProfile: () => user?.id && loadUserProfile(user.id)
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Export the context for the custom hook
export { AuthContext }