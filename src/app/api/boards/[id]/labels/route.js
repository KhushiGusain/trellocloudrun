import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

async function getSupabaseClient() {
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
          cookieStore.set({ name, value, ...options })
        },
        remove(name, options) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

async function getCurrentUser() {
  const cookieStore = await cookies()
  const customToken = cookieStore.get('sb-auth-token')?.value
  
  if (!customToken) {
    throw new Error('Unauthorized')
  }
  
  try {
    const tokenParts = customToken.split('.')
    if (tokenParts.length !== 3) {
      throw new Error('Invalid token format')
    }
    
    const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString())
    
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp && payload.exp < now) {
      throw new Error('Token expired')
    }
    
    return payload.sub
  } catch (error) {
    throw new Error('Invalid token')
  }
}

async function checkBoardAccess(boardId, userId) {
  const supabase = await getSupabaseClient()
  
  const { data: board, error: boardError } = await supabase
    .from('boards')
    .select('created_by, visibility')
    .eq('id', boardId)
    .single()

  if (boardError) {
    console.error('Board access error:', boardError)
    return { error: 'Board not found', status: 404 }
  }

  const { data: boardMember } = await supabase
    .from('board_members')
    .select('role')
    .eq('board_id', boardId)
    .eq('user_id', userId)
    .single()

  if (board.visibility === 'private' && !boardMember && board.created_by !== userId) {
    return { error: 'Access denied', status: 403 }
  }

  return { board, boardMember, success: true }
}

export async function GET(request, { params }) {
  try {
    const userId = await getCurrentUser()
    const { id: boardId } = await params
    
    const supabase = await getSupabaseClient()
    
    const accessResult = await checkBoardAccess(boardId, userId)
    if (!accessResult.success) {
      return NextResponse.json({ error: accessResult.error }, { status: accessResult.status })
    }
    
    const { data: labels, error: labelsError } = await supabase
      .from('labels')
      .select('*')
      .eq('board_id', boardId)
      .order('name', { ascending: true })

    if (labelsError) {
      console.error('Error fetching labels:', labelsError)
      return NextResponse.json({ error: 'Failed to fetch labels' }, { status: 500 })
    }

    return NextResponse.json(labels)
    
  } catch (error) {
    console.error('Error in GET /api/boards/[id]/labels:', error)
    if (error.message === 'Unauthorized' || error.message === 'Invalid token' || error.message === 'Token expired') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error.message === 'Board not found' || error.message === 'Access denied') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const userId = await getCurrentUser()
    const { id: boardId } = await params
    const body = await request.json()
    
    const supabase = await getSupabaseClient()
    
    const { board, boardMember } = await checkBoardAccess(boardId, userId)
    
    const canEdit = board.created_by === userId || 
                   boardMember?.role === 'owner' || 
                   boardMember?.role === 'editor'

    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 })
    }

    if (!body.name || !body.color) {
      return NextResponse.json({ error: 'Name and color are required' }, { status: 400 })
    }

    const { data: existingLabel } = await supabase
      .from('labels')
      .select('*')
      .eq('board_id', boardId)
      .eq('name', body.name)
      .single()

    if (existingLabel) {
      return NextResponse.json(existingLabel)
    }

    const { data: newLabel, error: createError } = await supabase
      .from('labels')
      .insert({
        board_id: boardId,
        name: body.name,
        color_hex: body.color
      })
      .select('*')
      .single()

    if (createError) {
      console.error('Error creating label:', createError)
      return NextResponse.json({ error: 'Failed to create label' }, { status: 500 })
    }

    await supabase
      .from('activities')
      .insert({
        board_id: boardId,
        actor_id: userId,
        type: 'label.created',
        data: {
          label_id: newLabel.id,
          label_name: newLabel.name,
          label_color: newLabel.color_hex
        }
      })

    return NextResponse.json(newLabel)
    
  } catch (error) {
    console.error('Error in POST /api/boards/[id]/labels:', error)
    if (error.message === 'Unauthorized' || error.message === 'Invalid token' || error.message === 'Token expired') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error.message === 'Board not found' || error.message === 'Access denied') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
