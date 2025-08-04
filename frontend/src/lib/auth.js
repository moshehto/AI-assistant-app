//auth.js
import { supabase } from './supabase'

// Sign up with organization code
export const signUpWithOrganization = async (email, password, organizationCode, fullName) => {
    try {
      console.log('🔄 Starting signup process...')
      
      // First, sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            organization_code: organizationCode
          }
        }
      })
  
      console.log('📧 Auth signup result:', { authData, authError })
  
      if (authError) throw authError
  
      if (authData.user) {
        // If email confirmation is required, we'll handle org joining after confirmation
        if (authData.user.email_confirmed_at) {
          console.log('👤 User email confirmed, joining organization...')
          // User is confirmed, join organization now
          return await joinUserToOrganization(email, organizationCode, fullName)
        } else {
          console.log('📧 Email confirmation required')
          // User needs to confirm email first
          return { 
            success: true, 
            user: authData.user, 
            requiresConfirmation: true,
            message: 'Account created successfully! Please check your email to confirm your account, then sign in.'
          }
        }
      }
    } catch (error) {
      console.error('❌ Registration error:', error)
      return { success: false, error: error.message }
    }
  }
  
  // Separate function for joining organization
  const joinUserToOrganization = async (email, organizationCode, fullName) => {
    try {
      const { data: orgData, error: orgError } = await supabase.rpc(
        'join_organization_with_code',
        {
          org_code: organizationCode,
          user_email: email,
          user_full_name: fullName
        }
      )
  
      console.log('🏢 Organization join result:', { orgData, orgError })
  
      if (orgError) throw orgError
  
      if (!orgData.success) {
        throw new Error(orgData.error)
      }
  
      console.log('✅ Registration successful!')
      return { success: true }
    } catch (error) {
      console.error('❌ Organization join error:', error)
      throw error
    }
  }

// Sign in
export const signIn = async (email, password) => {
    try {
      console.log('🔧 lib/auth: signIn called with:', { email })
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
  
      console.log('🔧 lib/auth: signInWithPassword result:', { data, error })
  
      if (error) {
        // Handle specific error cases
        if (error.message === 'Email not confirmed' || error.message.includes('Email not confirmed')) {
          return { 
            success: false, 
            error: 'Email not confirmed. Please check your inbox for the confirmation link.'
          }
        }
        throw error
      }
  
      if (data.user) {
        console.log('🔧 lib/auth: Login successful, checking if profile exists...')
        
        // Check if user already has a profile
        const { data: existingProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()
  
        console.log('🔧 lib/auth: Profile check result:', { existingProfile, profileError })
  
        if (!existingProfile && profileError?.code === 'PGRST116') {
          console.log('🔧 lib/auth: No profile found - checking for organization data in user metadata...')
          
          // User confirmed email but hasn't joined organization yet
          // Check if they have organization data in their metadata
          const organizationCode = data.user.user_metadata?.organization_code
          const fullName = data.user.user_metadata?.full_name
  
          console.log('🔧 lib/auth: User metadata:', { organizationCode, fullName })
  
          if (organizationCode) {
            console.log('🔧 lib/auth: Completing organization join...')
            
            // Complete the organization join now
            const { data: orgData, error: orgError } = await supabase.rpc(
              'join_organization_with_code',
              {
                org_code: organizationCode,
                user_email: email,
                user_full_name: fullName
              }
            )
  
            console.log('🔧 lib/auth: Organization join result:', { orgData, orgError })
  
            if (orgError) {
              console.error('🔧 lib/auth: Failed to join organization:', orgError)
              throw new Error(`Failed to join organization: ${orgError.message}`)
            }
  
            if (!orgData.success) {
              throw new Error(orgData.error)
            }
  
            console.log('🔧 lib/auth: Organization join completed successfully!')
          } else {
            // User has no organization code - they need to register properly
            await supabase.auth.signOut()
            throw new Error('Registration incomplete. Please register again with your organization code.')
          }
        }
  
        console.log('🔧 lib/auth: signIn successful!')
        return { success: true, user: data.user }
      }
    } catch (error) {
      console.error('🔧 lib/auth: signIn error:', error)
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
    console.log('🔧 lib/auth: getCurrentUserProfile called')
    
    const { data: user, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user.user) {
      console.log('🔧 lib/auth: No authenticated user')
      return null
    }

    console.log('🔧 lib/auth: Fetching user profile...')
    
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*, organization:organizations(*)')
      .eq('id', user.user.id)
      .maybeSingle() // Use maybeSingle instead of single to avoid errors if no row exists

    if (profileError) {
      console.log('🔧 lib/auth: Profile error:', profileError)
      return null // Return null instead of throwing
    }

    console.log('🔧 lib/auth: Profile result:', profile)
    return profile

  } catch (error) {
    console.error('🔧 lib/auth: Error in getCurrentUserProfile:', error)
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