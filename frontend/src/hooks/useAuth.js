import { useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'
import { signIn, signOut, signUpWithOrganization, checkPermission } from '../lib/auth'

// Custom hook that combines context with auth actions
export const useAuth = () => {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  // Add auth actions to the context
  const authActions = {
    // Login function
    login: async (email, password) => {
      return await signIn(email, password)
    },

    // Logout function
    logout: async () => {
      return await signOut()
    },

    // Register with organization
    register: async (email, password, organizationCode, fullName) => {
      return await signUpWithOrganization(email, password, organizationCode, fullName)
    },

    // Check if user has specific permission
    hasPermission: (requiredRole) => {
      return checkPermission(context.profile, requiredRole)
    },

    // Check if user can access a feature
    hasFeature: (featureName) => {
      return context.features[featureName] === true
    },

    // Get user's display name
    getDisplayName: () => {
      return context.profile?.full_name || context.user?.email || 'User'
    }
  }

  return {
    ...context,
    ...authActions
  }
}