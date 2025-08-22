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
    
    const { data: cardLabels, error: cardLabelsError } = await supabase
      .from('card_labels')
      .select(`
        *,
        label:labels(*)
      `)
      .eq('card_id', cardId)

    if (cardLabelsError) {
      console.error('Error fetching card labels:', cardLabelsError)
      return NextResponse.json({ error: 'Failed to fetch card labels' }, { status: 500 })
    }

    return NextResponse.json(cardLabels.map(cl => cl.label))
    
  } catch (error) {
    console.error('Error in GET /api/boards/[id]/cards/[cardId]/labels:', error)
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

    const { data: label, error: labelError } = await supabase
      .from('labels')
      .select('*')
      .eq('id', body.label_id)
      .eq('board_id', boardId)
      .single()

    if (labelError || !label) {
      return NextResponse.json({ error: 'Label not found' }, { status: 404 })
    }

    const { data: existingCardLabel } = await supabase
      .from('card_labels')
      .select('*')
      .eq('card_id', cardId)
      .eq('label_id', body.label_id)
      .single()

    if (existingCardLabel) {
      return NextResponse.json(label)
    }

    const { data: newCardLabel, error: createError } = await supabase
      .from('card_labels')
      .insert({
        card_id: cardId,
        label_id: body.label_id
      })
      .select(`
        *,
        label:labels(*)
      `)
      .single()

    if (createError) {
      console.error('Error adding label to card:', createError)
      return NextResponse.json({ error: 'Failed to add label to card' }, { status: 500 })
    }

    await supabase
      .from('activities')
      .insert({
        board_id: boardId,
        actor_id: userId,
        type: 'card.labeled',
        data: {
          card_id: cardId,
          card_title: card.title,
          label_id: body.label_id,
          label_name: label.name
        }
      })

    return NextResponse.json(newCardLabel.label)
    
  } catch (error) {
    console.error('Error in POST /api/boards/[id]/cards/[cardId]/labels:', error)
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
    const labelId = searchParams.get('label_id')
    
    if (!labelId) {
      return NextResponse.json({ error: 'Label ID is required' }, { status: 400 })
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

    const { data: existingCardLabel, error: checkError } = await supabase
      .from('card_labels')
      .select('*')
      .eq('card_id', cardId)
      .eq('label_id', labelId)
      .single()
    
    if (checkError) {
      console.error('Error checking existing card label:', checkError)
      return NextResponse.json({ error: 'Label not found on card' }, { status: 404 })
    }
    
    if (!existingCardLabel) {
      return NextResponse.json({ error: 'Label not found on card' }, { status: 404 })
    }

    const { error: deleteError } = await supabase
      .from('card_labels')
      .delete()
      .eq('card_id', cardId)
      .eq('label_id', labelId)

    if (deleteError) {
      console.error('Error removing label from card:', deleteError)
      return NextResponse.json({ error: 'Failed to remove label from card' }, { status: 500 })
    }

    await supabase
      .from('activities')
      .insert({
        board_id: boardId,
        actor_id: userId,
        type: 'card.unlabeled',
        data: {
          card_id: cardId,
          card_title: card.title,
          label_id: labelId
        }
      })

    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error in DELETE /api/boards/[id]/cards/[cardId]/labels:', error)
    if (error.message === 'Unauthorized' || error.message === 'Invalid token' || error.message === 'Token expired') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error.message === 'Board not found' || error.message === 'Access denied') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
