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

export async function PUT(request, { params }) {
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

    if (cardError) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    const updateData = {
      updated_at: new Date().toISOString()
    }

    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.due_date !== undefined) updateData.due_date = body.due_date
    if (body.position !== undefined) updateData.position = body.position
    if (body.list_id !== undefined) updateData.list_id = body.list_id

    const { data: updatedCard, error: updateError } = await supabase
      .from('cards')
      .update(updateData)
      .eq('id', cardId)
      .eq('board_id', boardId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating card:', updateError)
      return NextResponse.json({ error: 'Failed to update card' }, { status: 500 })
    }

    const activityType = body.title !== undefined ? 'card.renamed' : 
                        body.description !== undefined ? 'card.description_updated' :
                        body.due_date !== undefined ? 'card.due_date_updated' :
                        body.list_id !== undefined ? 'card.moved' : 'card.updated'

    let activityData = {
      card_id: cardId,
      card_title: updatedCard.title,
      list_id: updatedCard.list_id
    }

    // include list names when cards move
    if (body.list_id !== undefined) {
      const { data: fromList } = await supabase
        .from('lists')
        .select('title')
        .eq('id', card.list_id)
        .single()
      
      const { data: toList } = await supabase
        .from('lists')
        .select('title')
        .eq('id', body.list_id)
        .single()

      activityData = {
        ...activityData,
        from_list_id: card.list_id,
        to_list_id: body.list_id,
        from_list_title: fromList?.title || 'Unknown List',
        to_list_title: toList?.title || 'Unknown List'
      }
    }

    await supabase
      .from('activities')
      .insert({
        board_id: boardId,
        actor_id: userId,
        type: activityType,
        data: activityData
      })

    return NextResponse.json(updatedCard)
    
  } catch (error) {
    console.error('Error in PUT /api/boards/[id]/cards/[cardId]:', error)
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
      .select('title, list_id')
      .eq('id', cardId)
      .eq('board_id', boardId)
      .single()

    if (cardError) {
      return NextResponse.json({ error: 'Card not found' }, { status: 404 })
    }

    const { error: deleteError } = await supabase
      .from('cards')
      .delete()
      .eq('id', cardId)
      .eq('board_id', boardId)

    if (deleteError) {
      console.error('Error deleting card:', deleteError)
      return NextResponse.json({ error: 'Failed to delete card' }, { status: 500 })
    }

    await supabase
      .from('activities')
      .insert({
        board_id: boardId,
        actor_id: userId,
        type: 'card.deleted',
        data: {
          card_id: cardId,
          card_title: card.title,
          list_id: card.list_id
        }
      })

    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error in DELETE /api/boards/[id]/cards/[cardId]:', error)
    if (error.message === 'Unauthorized' || error.message === 'Invalid token' || error.message === 'Token expired') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error.message === 'Board not found' || error.message === 'Access denied') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
