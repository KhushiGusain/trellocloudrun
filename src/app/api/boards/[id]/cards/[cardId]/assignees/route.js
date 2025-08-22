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
    throw new Error('Board not found')
  }

  const { data: boardMember } = await supabase
    .from('board_members')
    .select('role')
    .eq('board_id', boardId)
    .eq('user_id', userId)
    .single()

  if (board.visibility === 'private' && !boardMember && board.created_by !== userId) {
    throw new Error('Access denied')
  }

  return { board, boardMember }
}

export async function GET(request, { params }) {
  try {
    const userId = await getCurrentUser()
    const { id: boardId, cardId } = await params
    
    const supabase = await getSupabaseClient()
    
    const { board, boardMember } = await checkBoardAccess(boardId, userId)
    
    const { data: cardAssignees, error: cardAssigneesError } = await supabase
      .from('card_assignees')
      .select(`
        *,
        profile:profiles(id, display_name, avatar_url)
      `)
      .eq('card_id', cardId)

    if (cardAssigneesError) {
      console.error('Error fetching card assignees:', cardAssigneesError)
      return NextResponse.json({ error: 'Failed to fetch card assignees' }, { status: 500 })
    }

    return NextResponse.json(cardAssignees.map(ca => ca.profile))
    
  } catch (error) {
    console.error('Error in GET /api/boards/[id]/cards/[cardId]/assignees:', error)
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
    const { id: boardId, cardId } = await params
    const body = await request.json()
    
    const supabase = await getSupabaseClient()
    
    const { board, boardMember } = await checkBoardAccess(boardId, userId)
    
    const canEdit = board.created_by === userId || 
                   boardMember?.role === 'owner' || 
                   boardMember?.role === 'editor'

    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 })
    }

    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select('*')
      .eq('id', cardId)
      .eq('board_id', boardId)
      .single()

    if (cardError || !card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    const { data: assignee, error: assigneeError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', body.user_id)
      .single()

    if (assigneeError || !assignee) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { data: newCardAssignee, error: createError } = await supabase
      .from('card_assignees')
      .insert({
        card_id: cardId,
        user_id: body.user_id
      })
      .select(`
        *,
        profile:profiles(id, display_name, avatar_url)
      `)
      .single()

    if (createError) {
      console.error('Error assigning user to card:', createError)
      return NextResponse.json({ error: 'Failed to assign user to card' }, { status: 500 })
    }

    await supabase
      .from('activities')
      .insert({
        board_id: boardId,
        actor_id: userId,
        type: 'card.assigned',
        data: {
          card_id: cardId,
          card_title: card.title,
          assignee_id: body.user_id,
          assignee_name: assignee.display_name
        }
      })

    return NextResponse.json(newCardAssignee.profile)
    
  } catch (error) {
    console.error('Error in POST /api/boards/[id]/cards/[cardId]/assignees:', error)
    if (error.message === 'Unauthorized' || error.message === 'Invalid token' || error.message === 'Token expired') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error.message === 'Board not found' || error.message === 'Access denied') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const userId = await getCurrentUser()
    const { id: boardId, cardId } = await params
    const { searchParams } = new URL(request.url)
    const assigneeId = searchParams.get('user_id')
    
    if (!assigneeId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    const supabase = await getSupabaseClient()
    
    const { board, boardMember } = await checkBoardAccess(boardId, userId)
    
    const canEdit = board.created_by === userId || 
                   boardMember?.role === 'owner' || 
                   boardMember?.role === 'editor'

    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 })
    }

    const { data: card, error: cardError } = await supabase
      .from('cards')
      .select('*')
      .eq('id', cardId)
      .eq('board_id', boardId)
      .single()

    if (cardError || !card) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    const { error: deleteError } = await supabase
      .from('card_assignees')
      .delete()
      .eq('card_id', cardId)
      .eq('user_id', assigneeId)

    if (deleteError) {
      console.error('Error removing assignee from card:', deleteError)
      return NextResponse.json({ error: 'Failed to remove assignee from card' }, { status: 500 })
    }

    await supabase
      .from('activities')
      .insert({
        board_id: boardId,
        actor_id: userId,
        type: 'card.unassigned',
        data: {
          card_id: cardId,
          card_title: card.title,
          assignee_id: assigneeId
        }
      })

    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error in DELETE /api/boards/[id]/cards/[cardId]/assignees:', error)
    if (error.message === 'Unauthorized' || error.message === 'Invalid token' || error.message === 'Token expired') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error.message === 'Board not found' || error.message === 'Access denied') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
