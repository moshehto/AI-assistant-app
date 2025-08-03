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
    // Get initial session
    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          setUser(session.user)
          await loadUserProfile(session.user.id)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setFeatures({})
        }
        setLoading(false)
      }
    )

    return () => subscription?.unsubscribe()
  }, [])

  const getInitialSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        setUser(session.user)
        await loadUserProfile(session.user.id)
      }
    } catch (error) {
      console.error('Error getting initial session:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadUserProfile = async (userId) => {
    try {
      const userProfile = await getCurrentUserProfile()
      setProfile(userProfile)

      if (userProfile?.organization_id) {
        const orgFeatures = await getOrganizationFeatures(userProfile.organization_id)
        setFeatures(orgFeatures)
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
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
    refreshProfile: () => loadUserProfile(user?.id)
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Export the context for the custom hook
export { AuthContext }