export async function broadcastBoardEvent(boardId, event) {
  try {
    const response = await fetch(`/api/boards/${boardId}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(event),
    })
    
    if (!response.ok) {
      console.error('Failed to broadcast event:', response.statusText)
    }
  } catch (error) {
    console.error('Error broadcasting event:', error)
  }
}

export function createSSEConnection(boardId, onMessage) {
  const eventSource = new EventSource(`/api/boards/${boardId}/events`)
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      onMessage(data)
    } catch (error) {
      console.error('Error parsing SSE message:', error)
    }
  }
  
  eventSource.onerror = (error) => {
    console.error('SSE connection error:', error)
    eventSource.close()
  }
  
  return eventSource
}
