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

async function checkBoardOwnerAccess(boardId, userId) {
  const supabase = await getSupabaseClient()
  
  const { data: board, error: boardError } = await supabase
    .from('boards')
    .select('created_by, visibility')
    .eq('id', boardId)
    .single()

  if (boardError) {
    throw new Error('Board not found')
  }

  if (board.created_by !== userId) {
    throw new Error('Only board owner can manage members')
  }

  if (board.visibility === 'private') {
    throw new Error('Cannot invite members to private boards')
  }

  return board
}

export async function GET(request, { params }) {
  try {
    const userId = await getCurrentUser()
    const { id: boardId } = await params
    
    const supabase = await getSupabaseClient()
    
    const { board, boardMember } = await checkBoardAccess(boardId, userId)
    
    const { data: boardMembers, error: membersError } = await supabase
      .from('board_members')
      .select(`
        role,
        profile:profiles(display_name, avatar_url, id, email)
      `)
      .eq('board_id', boardId)

    if (membersError) {
      console.error('Error fetching board members:', membersError)
      return NextResponse.json({ error: 'Failed to fetch board members' }, { status: 500 })
    }

    const { data: creator } = await supabase
      .from('profiles')
      .select('display_name, avatar_url, id, email')
      .eq('id', board.created_by)
      .single()

    const allMembers = boardMembers.map(bm => ({
      ...bm.profile,
      role: bm.role
    }))
    
    const creatorExists = allMembers.some(member => member.id === creator?.id)
    
    if (creator && !creatorExists) {
      allMembers.unshift({
        ...creator,
        role: 'owner'
      })
    }

    return NextResponse.json(allMembers)
    
  } catch (error) {
    console.error('Error in GET /api/boards/[id]/members:', error)
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
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }
    
    await checkBoardOwnerAccess(boardId, userId)
    
    const supabase = await getSupabaseClient()
    
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .eq('email', email)
      .single()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    
    if (user.id === userId) {
      return NextResponse.json({ error: 'Cannot invite yourself' }, { status: 400 })
    }
    
    const { data: existingMember, error: existingError } = await supabase
      .from('board_members')
      .select('id')
      .eq('board_id', boardId)
      .eq('user_id', user.id)
      .single()
    
    if (existingMember) {
      return NextResponse.json({ error: 'User is already a member' }, { status: 400 })
    }
    
    const { data: newMember, error: insertError } = await supabase
      .from('board_members')
      .insert({
        board_id: boardId,
        user_id: user.id,
        role: 'editor'
      })
      .select()
      .single()
    
    if (insertError) {
      console.error('Error adding board member:', insertError)
      return NextResponse.json({ error: 'Failed to add member' }, { status: 500 })
    }
    
    const memberData = {
      id: user.id,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      role: 'editor'
    }
    
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/boards/${boardId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'member_added',
          member: memberData
        })
      })
    } catch (error) {
      console.error('Error broadcasting member added event:', error)
    }
    
    return NextResponse.json({ 
      message: 'Member invited successfully',
      member: memberData
    })
    
  } catch (error) {
    console.error('Error in POST /api/boards/[id]/members:', error)
    if (error.message === 'Unauthorized' || error.message === 'Invalid token' || error.message === 'Token expired') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error.message === 'Board not found' || error.message === 'Only board owner can manage members') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



export async function DELETE(request, { params }) {
  try {
    const userId = await getCurrentUser()
    const { id: boardId } = await params
    const { searchParams } = new URL(request.url)
    const memberId = searchParams.get('member_id')
    
    if (!memberId) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
    }
    
    await checkBoardOwnerAccess(boardId, userId)
    
    if (memberId === userId) {
      return NextResponse.json({ error: 'Cannot remove yourself from the board' }, { status: 400 })
    }
    
    const supabase = await getSupabaseClient()
    
    const { data: member, error: memberError } = await supabase
      .from('board_members')
      .select('*')
      .eq('board_id', boardId)
      .eq('user_id', memberId)
      .single()
    
    if (memberError || !member) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 })
    }
    
    const { error: deleteError } = await supabase
      .from('board_members')
      .delete()
      .eq('board_id', boardId)
      .eq('user_id', memberId)
    
    if (deleteError) {
      console.error('Error removing board member:', deleteError)
      return NextResponse.json({ error: 'Failed to remove member' }, { status: 500 })
    }
    

    
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/boards/${boardId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'member_removed',
          memberId: memberId
        })
      })
    } catch (error) {
      console.error('Error broadcasting member removed event:', error)
    }
    
    return NextResponse.json({ message: 'Member removed successfully' })
    
  } catch (error) {
    console.error('Error in DELETE /api/boards/[id]/members:', error)
    if (error.message === 'Unauthorized' || error.message === 'Invalid token' || error.message === 'Token expired') {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error.message === 'Board not found' || error.message === 'Only board owner can manage members') {
      return NextResponse.json({ error: error.message }, { status: 403 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
