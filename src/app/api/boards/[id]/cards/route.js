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

    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('id, title')
      .eq('id', body.list_id)
      .eq('board_id', boardId)
      .single()

    if (listError || !list) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    const { data: lastCard, error: positionError } = await supabase
      .from('cards')
      .select('position')
      .eq('list_id', body.list_id)
      .order('position', { ascending: false })
      .limit(1)
      .single()

    const newPosition = lastCard ? lastCard.position + 1000 : 1000

    const { data: newCard, error: createError } = await supabase
      .from('cards')
      .insert({
        board_id: boardId,
        list_id: body.list_id,
        title: body.title,
        description: body.description || '',
        position: newPosition,
        created_by: userId
      })
      .select('*')
      .single()

    if (createError) {
      console.error('Error creating card:', createError)
      return NextResponse.json({ error: 'Failed to create card' }, { status: 500 })
    }

    await supabase
      .from('activities')
      .insert({
        board_id: boardId,
        actor_id: userId,
        type: 'card.created',
        data: {
          card_id: newCard.id,
          card_title: newCard.title,
          list_id: body.list_id,
          list_title: list.title
        }
      })

    return NextResponse.json(newCard)
    
  } catch (error) {
    console.error('Error in POST /api/boards/[id]/cards:', error)
    if (error.message === 'Unauthorized' || error.message === 'Invalid token' || error.message === 'Token expired') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error.message === 'Board not found' || error.message === 'Access denied') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
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

    if (!body.cards || !Array.isArray(body.cards)) {
      console.error('Invalid cards data received:', body)
      return NextResponse.json({ error: 'Invalid cards data' }, { status: 400 })
    }

    const invalidCards = body.cards.filter(card => !card.list_id || !card.id)
    if (invalidCards.length > 0) {
      console.error('Invalid cards found:', invalidCards)
      return NextResponse.json({ error: 'Invalid card data - missing list_id or id' }, { status: 400 })
    }

    const cardIds = body.cards.map(card => card.id)
    
    const { data: existingCards, error: fetchError } = await supabase
      .from('cards')
      .select('id, created_by')
      .in('id', cardIds)
      .eq('board_id', boardId)

    if (fetchError) {
      console.error('Error fetching existing cards:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch existing cards' }, { status: 500 })
    }

    const existingCardMap = new Map(existingCards.map(card => [card.id, card]))

    const { error: updateError } = await supabase
      .from('cards')
      .upsert(body.cards.map((card, index) => ({
        id: card.id,
        board_id: boardId,
        list_id: card.list_id,
        title: card.title,
        description: card.description || '',
        position: card.position || (index + 1) * 1000,
        due_date: card.due_date,
        archived: card.archived || false,
        created_by: existingCardMap.get(card.id)?.created_by,
        updated_at: new Date().toISOString()
      })), {
        onConflict: 'id',
        ignoreDuplicates: false
      })

    if (updateError) {
      console.error('Error updating cards:', updateError)
      return NextResponse.json({ error: 'Failed to update cards' }, { status: 500 })
    }

    const movedCards = body.cards.filter(card => card.moved)
    for (const card of movedCards) {
      // grab list names for activity tracking
      const { data: fromList } = await supabase
        .from('lists')
        .select('title')
        .eq('id', card.previous_list_id)
        .single()
      
      const { data: toList } = await supabase
        .from('lists')
        .select('title')
        .eq('id', card.list_id)
        .single()

      await supabase
        .from('activities')
        .insert({
          board_id: boardId,
          actor_id: userId,
          type: 'card.moved',
          data: {
            card_id: card.id,
            card_title: card.title,
            from_list_id: card.previous_list_id,
            to_list_id: card.list_id,
            from_list_title: fromList?.title || 'Unknown List',
            to_list_title: toList?.title || 'Unknown List'
          }
        })
    }

    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error in PUT /api/boards/[id]/cards:', error)
    if (error.message === 'Unauthorized' || error.message === 'Invalid token' || error.message === 'Token expired') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error.message === 'Board not found' || error.message === 'Access denied') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
