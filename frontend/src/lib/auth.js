import { supabase } from './supabase'

// Sign up with organization code
export const signUpWithOrganization = async (email, password, organizationCode, fullName) => {
  try {
    // First, sign up the user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) throw authError

    if (authData.user) {
      // Join organization with code
      const { data: orgData, error: orgError } = await supabase.rpc(
        'join_organization_with_code',
        {
          org_code: organizationCode,
          user_email: email,
          user_full_name: fullName
        }
      )

      if (orgError) throw orgError

      if (!orgData.success) {
        throw new Error(orgData.error)
      }

      return { success: true, user: authData.user }
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Sign in
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    return { success: true, user: data.user }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Sign out
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Get current user profile with organization
export const getCurrentUserProfile = async () => {
  try {
    const { data: user, error: userError } = await supabase.auth.getUser()
    
    if (userError) throw userError
    if (!user.user) return null

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        *,
        organization:organizations(*)
      `)
      .eq('id', user.user.id)
      .single()

    if (profileError) throw profileError

    return profile
  } catch (error) {
    console.error('Error getting user profile:', error)
    return null
  }
}

// Check if user has permission
export const checkPermission = (userProfile, requiredRole) => {
  if (!userProfile) return false
  
  const roleHierarchy = { admin: 2, user: 1 }
  const userRoleLevel = roleHierarchy[userProfile.role] || 0
  const requiredRoleLevel = roleHierarchy[requiredRole] || 0
  
  return userRoleLevel >= requiredRoleLevel
}

// Get organization features
export const getOrganizationFeatures = async (organizationId) => {
  try {
    const { data, error } = await supabase
      .from('organization_features')
      .select('*')
      .eq('organization_id', organizationId)

    if (error) throw error

    // Convert to object for easier access
    const features = {}
    data.forEach(feature => {
      features[feature.feature_name] = feature.enabled
    })

    return features
  } catch (error) {
    console.error('Error getting organization features:', error)
    return {}
  }
}