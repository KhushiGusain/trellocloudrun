import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request, { params }) {
  try {
    const cookieStore = await cookies()
    const { id: workspaceId } = await params
    
    const customToken = cookieStore.get('sb-auth-token')?.value
    if (!customToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    try {
      const tokenParts = customToken.split('.')
      if (tokenParts.length !== 3) {
        return NextResponse.json({ error: 'Invalid token format' }, { status: 401 })
      }
      
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString())
      
      const now = Math.floor(Date.now() / 1000)
      if (payload.exp && payload.exp < now) {
        return NextResponse.json({ error: 'Token expired' }, { status: 401 })
      }
      
      const userId = payload.sub
      
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          cookies: {
            get(name) {
              return cookieStore.get(name)?.value
            },
            set(name, value, options) {
              cookieStore.set({ name, value, ...options })
            },
            remove(name, options) {
              cookieStore.set({ name, value: '', ...options })
            },
          },
        }
      )
      

      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .select('id, created_by, created_at')
        .eq('id', workspaceId)
        .single()
      
      if (workspaceError || !workspace) {
        return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
      }
      
      // check workspace access
      let hasAccess = workspace.created_by === userId
      

      if (!hasAccess) {
        const { data: memberWorkspace, error: memberError } = await supabase
          .from('workspace_members')
          .select('id')
          .eq('workspace_id', workspaceId)
          .eq('user_id', userId)
          .single()
          
        hasAccess = !!memberWorkspace
      }
      
      if (!hasAccess) {
        return NextResponse.json({ error: 'Workspace not found or access denied' }, { status: 403 })
      }
      

      const { data: ownerData, error: ownerError } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .eq('id', workspace.created_by)
        .single()

      if (ownerError) {
        console.error('Error fetching workspace owner:', ownerError)
        return NextResponse.json({ error: 'Failed to fetch workspace owner' }, { status: 500 })
      }

      // Get workspace members
      const { data: members, error: membersError } = await supabase
        .from('workspace_members')
        .select(`
          id,
          role,
          joined_at,
          user:profiles(id, display_name, email)
        `)
        .eq('workspace_id', workspaceId)
        .order('joined_at', { ascending: true })

      let allMembers = []

      // include workspace owner first
      allMembers.push({
        id: `owner-${workspace.created_by}`,
        role: 'owner',
        joined_at: workspace.created_at,
        user: ownerData
      })


      if (membersError) {
        // table doesn't exist yet, just return owner
        if (membersError.code === '42P01' || membersError.code === '42703') {
          console.log('workspace_members table not found, returning only owner')
          return NextResponse.json(allMembers)
        }
        console.error('Error fetching workspace members:', membersError)
        return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
      }

      // avoid owner duplicates
      const filteredMembers = (members || []).filter(member => member.user?.id !== workspace.created_by)
      allMembers = [...allMembers, ...filteredMembers]

      return NextResponse.json(allMembers)
      
    } catch (decodeError) {
      console.error('Error decoding token:', decodeError)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    
  } catch (error) {
    console.error('Error in workspace members GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const cookieStore = await cookies()
    const { id: workspaceId } = await params
    
    const customToken = cookieStore.get('sb-auth-token')?.value
    if (!customToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    try {
      const tokenParts = customToken.split('.')
      if (tokenParts.length !== 3) {
        return NextResponse.json({ error: 'Invalid token format' }, { status: 401 })
      }
      
      const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString())
      
      const now = Math.floor(Date.now() / 1000)
      if (payload.exp && payload.exp < now) {
        return NextResponse.json({ error: 'Token expired' }, { status: 401 })
      }
      
      const userId = payload.sub
      const { email, role = 'member' } = await request.json()
      
      if (!email || !email.trim()) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 })
      }
      
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
          cookies: {
            get(name) {
              return cookieStore.get(name)?.value
            },
            set(name, value, options) {
              cookieStore.set({ name, value, ...options })
            },
            remove(name, options) {
              cookieStore.set({ name, value: '', ...options })
            },
          },
        }
      )
      

      const { data: workspace, error: workspaceError } = await supabase
        .from('workspaces')
        .select('id')
        .eq('id', workspaceId)
        .eq('created_by', userId)
        .single()
        
      if (workspaceError || !workspace) {
        return NextResponse.json({ error: 'Workspace not found or access denied' }, { status: 403 })
      }
      

      console.log('Looking for user with email:', email.trim().toLowerCase())
      const { data: userProfile, error: userError } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .eq('email', email.trim().toLowerCase())
        .single()
        
      if (userError) {
        console.error('Error finding user:', userError)
        return NextResponse.json({ 
          error: `User not found: ${userError.message}. Make sure the user has signed up first.` 
        }, { status: 404 })
      }
      
      if (!userProfile) {
        return NextResponse.json({ 
          error: 'User not found. Make sure the user has signed up and has a profile.' 
        }, { status: 404 })
      }
      
      console.log('Found user:', userProfile)
      

      const { data: existingMember, error: memberCheckError } = await supabase
        .from('workspace_members')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('user_id', userProfile.id)
        .single()
        
      // If there's an error checking for existing member (but not "not found"), handle it
      if (memberCheckError && memberCheckError.code !== 'PGRST116') {
        console.error('Error checking existing member:', memberCheckError)
        // If table doesn't exist, continue anyway
        if (memberCheckError.code !== '42P01' && memberCheckError.code !== '42703') {
          return NextResponse.json({ 
            error: 'Error checking existing membership' 
          }, { status: 500 })
        }
      }
      
      if (existingMember) {
        return NextResponse.json({ error: 'User is already a member of this workspace' }, { status: 409 })
      }
      

      const { data: newMember, error: addError } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspaceId,
          user_id: userProfile.id,
          role: role
        })
        .select(`
          id,
          role,
          joined_at,
          user:profiles(id, display_name, email)
        `)
        .single()

      if (addError) {
        // If table doesn't exist yet, return helpful error
        if (addError.code === '42P01' || addError.code === '42703') {
          return NextResponse.json({ 
            error: 'Members feature requires database setup. Please create the workspace_members table first.' 
          }, { status: 503 })
        }
        
        // More detailed error logging
        console.error('Error adding workspace member:', {
          error: addError,
          code: addError.code,
          message: addError.message,
          details: addError.details,
          hint: addError.hint,
          workspaceId,
          userId: userProfile.id,
          role
        })
        
        // Return more specific error messages
        if (addError.code === '23503') {
          return NextResponse.json({ 
            error: 'Database constraint error. Please check if the workspace and user exist properly.' 
          }, { status: 400 })
        }
        
        return NextResponse.json({ 
          error: `Failed to add member: ${addError.message}`,
          code: addError.code 
        }, { status: 500 })
      }

      return NextResponse.json(newMember)
      
    } catch (decodeError) {
      console.error('Error decoding token:', decodeError)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    
  } catch (error) {
    console.error('Error in workspace members POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
