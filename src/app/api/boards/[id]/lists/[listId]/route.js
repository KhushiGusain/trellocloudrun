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
    const { id: boardId, listId } = await params
    const body = await request.json()
    
    const supabase = await getSupabaseClient()
    
    const { board, boardMember } = await checkBoardAccess(boardId, userId)
    
    const canEdit = board.created_by === userId || 
                   boardMember?.role === 'owner' || 
                   boardMember?.role === 'editor'

    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden - insufficient permissions' }, { status: 403 })
    }

    // grab current title first
    const { data: currentList, error: fetchError } = await supabase
      .from('lists')
      .select('title')
      .eq('id', listId)
      .eq('board_id', boardId)
      .single()

    if (fetchError) {
      console.error('Error fetching current list:', fetchError)
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    const oldTitle = currentList.title
    const newTitle = body.title

    // skip if title isn't changing
    if (oldTitle === newTitle) {
      return NextResponse.json(currentList)
    }

    const { data: updatedList, error: updateError } = await supabase
      .from('lists')
      .update({
        title: newTitle,
        updated_at: new Date().toISOString()
      })
      .eq('id', listId)
      .eq('board_id', boardId)
      .select('*')
      .single()

    if (updateError) {
      console.error('Error updating list:', updateError)
      return NextResponse.json({ error: 'Failed to update list' }, { status: 500 })
    }

    await supabase
      .from('activities')
      .insert({
        board_id: boardId,
        actor_id: userId,
        type: 'list.renamed',
        data: {
          list_id: listId,
          list_title: newTitle,
          old_title: oldTitle,
          new_title: newTitle
        }
      })

    return NextResponse.json(updatedList)
    
  } catch (error) {
    console.error('Error in PUT /api/boards/[id]/lists/[listId]:', error)
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
    const { id: boardId, listId } = await params
    
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
      .select('title')
      .eq('id', listId)
      .eq('board_id', boardId)
      .single()

    if (listError) {
      return NextResponse.json({ error: 'List not found' }, { status: 404 })
    }

    const { error: deleteError } = await supabase
      .from('lists')
      .delete()
      .eq('id', listId)
      .eq('board_id', boardId)

    if (deleteError) {
      console.error('Error deleting list:', deleteError)
      return NextResponse.json({ error: 'Failed to delete list' }, { status: 500 })
    }

    await supabase
      .from('activities')
      .insert({
        board_id: boardId,
        actor_id: userId,
        type: 'list.deleted',
        data: {
          list_id: listId,
          list_title: list.title
        }
      })

    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error in DELETE /api/boards/[id]/lists/[listId]:', error)
    if (error.message === 'Unauthorized' || error.message === 'Invalid token' || error.message === 'Token expired') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error.message === 'Board not found' || error.message === 'Access denied') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
