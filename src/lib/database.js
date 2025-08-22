import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function getSupabaseClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            console.warn('Storage setItem failed:', error)
          }
        },
        remove(name, options) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            console.warn('Storage removeItem failed:', error)
          }
        },
      },
    }
  )
}

export async function getCurrentUser() {
  try {
    const supabase = await getSupabaseClient()
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      throw new Error('Unauthorized')
    }
    
    if (!session) {
      throw new Error('Unauthorized')
    }
    
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      throw new Error('Unauthorized')
    }
    
    if (!user) {
      throw new Error('Unauthorized')
    }
    
    return user
  } catch (error) {
    throw error
  }
}

export async function getUserProfile(userId) {
  const supabase = await getSupabaseClient()
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
    
  if (error) {
    return null
  }
  
  return profile
}

export async function getOrCreateDefaultWorkspace(userId) {
  const supabase = await getSupabaseClient()
  
  let { data: workspace, error: workspaceError } = await supabase
    .from('workspaces')
    .select('id, name')
    .eq('created_by', userId)
    .single()

  if (workspaceError && workspaceError.code === 'PGRST116') {
    const { data: newWorkspace, error: createWorkspaceError } = await supabase
      .from('workspaces')
      .insert({
        name: 'Personal Workspace',
        created_by: userId
      })
      .select('id, name')
      .single()

    if (createWorkspaceError) {
      throw new Error('Failed to create workspace')
    }

    workspace = newWorkspace
  } else if (workspaceError) {
    throw new Error('Failed to fetch workspace')
  }

  return workspace
}
