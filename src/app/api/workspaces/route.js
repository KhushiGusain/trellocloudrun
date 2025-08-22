import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const cookieStore = await cookies()
    
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
      
      // grab user's owned workspaces
      const { data: ownedWorkspaces, error: ownedError } = await supabase
        .from('workspaces')
        .select('id, name, created_at, created_by')
        .eq('created_by', userId)
        .order('created_at', { ascending: true })

      if (ownedError) {
        console.error('Error fetching owned workspaces:', ownedError)
        return NextResponse.json({ error: 'Failed to fetch workspaces' }, { status: 500 })
      }

      // find workspaces where user is a member
      const { data: memberWorkspaces, error: memberError } = await supabase
        .from('workspace_members')
        .select(`
          workspace:workspaces(id, name, created_at, created_by)
        `)
        .eq('user_id', userId)

      let memberWorkspaceData = []
      if (memberError) {
        // workspace_members table might not exist yet, that's ok
        if (memberError.code !== '42P01' && memberError.code !== '42703') {
          console.error('Error fetching member workspaces:', memberError)
        }
      } else {
        memberWorkspaceData = memberWorkspaces?.map(m => m.workspace).filter(Boolean) || []
      }

      // combine all workspaces and remove duplicates
      const ownedWorkspaceIds = new Set(ownedWorkspaces?.map(w => w.id) || [])
      const uniqueMemberWorkspaces = memberWorkspaceData.filter(w => !ownedWorkspaceIds.has(w.id))
      
      const allWorkspaces = [
        ...(ownedWorkspaces || []),
        ...uniqueMemberWorkspaces
      ]

      // sort by creation date
      allWorkspaces.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

      return NextResponse.json(allWorkspaces)
      
    } catch (decodeError) {
      console.error('Error decoding token:', decodeError)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    
  } catch (error) {
    console.error('Error in workspaces GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const cookieStore = await cookies()
    
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
      const { name } = await request.json()
      
      if (!name || !name.trim()) {
        return NextResponse.json({ error: 'Workspace name is required' }, { status: 400 })
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
      
      const { data: workspace, error } = await supabase
        .from('workspaces')
        .insert({
          name: name.trim(),
          created_by: userId
        })
        .select('id, name, created_at')
        .single()

      if (error) {
        console.error('Error creating workspace:', error)
        return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 })
      }

      return NextResponse.json(workspace)
      
    } catch (decodeError) {
      console.error('Error decoding token:', decodeError)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    
  } catch (error) {
    console.error('Error in workspaces POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
