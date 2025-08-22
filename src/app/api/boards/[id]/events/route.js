import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const clients = new Map()

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

export async function GET(request, { params }) {
  try {
    const userId = await getCurrentUser()
    const { id: boardId } = await params
    
    const supabase = await getSupabaseClient()
    
    const { data: board, error: boardError } = await supabase
      .from('boards')
      .select('created_by, visibility')
      .eq('id', boardId)
      .single()

    if (boardError) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 })
    }

    const { data: boardMember } = await supabase
      .from('board_members')
      .select('role')
      .eq('board_id', boardId)
      .eq('user_id', userId)
      .single()

    if (board.visibility === 'private' && !boardMember && board.created_by !== userId) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const response = new Response(
      new ReadableStream({
        start(controller) {
          const clientId = `${boardId}-${userId}-${Date.now()}`
          
                     console.log(`New SSE client connected: ${clientId} for board: ${boardId}`)
           clients.set(clientId, {
             controller,
             boardId,
             userId,
             timestamp: Date.now()
           })
           console.log(`Total clients: ${clients.size}`)

          const sendEvent = (data) => {
            const event = `data: ${JSON.stringify(data)}\n\n`
            controller.enqueue(new TextEncoder().encode(event))
          }

          sendEvent({ type: 'connected', message: 'Connected to board updates' })

          const cleanup = () => {
            clients.delete(clientId)
            controller.close()
          }

          request.signal.addEventListener('abort', cleanup)
        }
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Cache-Control'
        }
      }
    )

    return response
    
  } catch (error) {
    console.error('Error in SSE GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export function broadcastToBoard(boardId, event) {
  const boardClients = Array.from(clients.entries())
    .filter(([_, client]) => client.boardId === boardId)
    .map(([clientId, client]) => ({ clientId, client }))

  console.log(`Broadcasting to ${boardClients.length} clients for board ${boardId}`)

  boardClients.forEach(({ clientId, client }) => {
    try {
      const eventData = `data: ${JSON.stringify(event)}\n\n`
      client.controller.enqueue(new TextEncoder().encode(eventData))
      console.log(`Event sent to client: ${clientId}`)
    } catch (error) {
      console.error('Error broadcasting to client:', clientId, error)
      clients.delete(clientId)
    }
  })
}

export function cleanupClients() {
  const now = Date.now()
  const timeout = 5 * 60 * 1000 

  for (const [clientId, client] of clients.entries()) {
    if (now - client.timestamp > timeout) {
      clients.delete(clientId)
    }
  }
}

setInterval(cleanupClients, 60000) 

export async function POST(request, { params }) {
  try {
    const { id: boardId } = await params
    const event = await request.json()
    
    console.log('SSE POST received:', { boardId, event })
    console.log('Current clients:', clients.size)
    
    broadcastToBoard(boardId, event)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in SSE POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
