//useAuth.js
import { useContext } from 'react'
import { AuthContext } from '../contexts/AuthContexts'
import { signIn, signOut, signUpWithOrganization, checkPermission } from '../lib/auth'

export const useAuth = () => {
  console.log('🔧 useAuth: Hook called')
  
  const context = useContext(AuthContext)
  console.log('🔧 useAuth: Context value:', context)
  
  if (context === undefined) {
    console.error('🔧 useAuth: Context is undefined!')
    throw new Error('useAuth must be used within an AuthProvider')
  }

  const authActions = {
    login: async (email, password) => {
      console.log('🔧 useAuth: login called with:', { email })
      return await signIn(email, password)
    },

    logout: async () => {
      console.log('🔧 useAuth: logout called')
      return await signOut()
    },

    register: async (email, password, organizationCode, fullName) => {
      console.log('🔧 useAuth: register called with:', { email, organizationCode, fullName })
      return await signUpWithOrganization(email, password, organizationCode, fullName)
    },

    hasPermission: (requiredRole) => {
      return checkPermission(context.profile, requiredRole)
    },

    hasFeature: (featureName) => {
      return context.features[featureName] === true
    },

    getDisplayName: () => {
      return context.profile?.full_name || context.user?.email || 'User'
    }
  }

  console.log('🔧 useAuth: Returning combined context and actions')
  return {
    ...context,
    ...authActions
  }
}