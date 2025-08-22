'use client'

import { useState, useEffect, useRef, useCallback } from 'react'


export default function useBoard(boardId) {
  const [board, setBoard] = useState(null)
  const [lists, setLists] = useState([])
  const [labels, setLabels] = useState([])
  const [activities, setActivities] = useState([])
  const [userRole, setUserRole] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const abortControllerRef = useRef(null)
  const eventSourceRef = useRef(null)

  const applyOptimisticUpdate = useCallback((updater) => {
    setLists(updater)
  }, [])

  const fetchBoard = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    abortControllerRef.current = new AbortController()
    
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/boards/${boardId}`, {
        signal: abortControllerRef.current.signal
      })
      
      if (!response.ok) throw new Error('Failed to fetch board')
      
      const data = await response.json()
      setBoard(data.board)
      setLists(data.lists)
      setLabels(data.labels)
      setActivities(data.activities)
      setUserRole(data.userRole)
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message)
      console.error('Error fetching board:', err)
      }
    } finally {
      setLoading(false)
    }
  }, [boardId])

  const createList = useCallback(async (title) => {
    try {
      const response = await fetch(`/api/boards/${boardId}/lists`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() }),
      })

      if (!response.ok) throw new Error('Failed to create list')

      const createdList = await response.json()
      
      applyOptimisticUpdate(prevLists => [...prevLists, createdList])
      
      if (board && board.visibility === 'workspace') {
        fetch(`/api/boards/${boardId}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            type: 'list_created',
            list: createdList
          })
        }).catch(err => console.error('Broadcast error:', err))
      }
      
      if (board && board.visibility === 'private') {
        setActivities(prev => [{
          id: `temp_${Date.now()}`,
          type: 'list.created',
          data: {
            list_title: createdList.title
          },
          actor: { display_name: 'You' },
          created_at: new Date().toISOString()
        }, ...prev.slice(0, 19)])
      }
      
      return createdList
    } catch (err) {
      console.error('Error creating list:', err)
      throw err
    }
  }, [boardId, applyOptimisticUpdate, board?.visibility])

  const updateList = useCallback(async (listId, updates) => {
    const originalLists = lists
    applyOptimisticUpdate(prevLists => 
      prevLists.map(list => 
        list.id === listId ? { ...list, ...updates, updated_at: new Date().toISOString() } : list
      )
    )

    try {
      const response = await fetch(`/api/boards/${boardId}/lists/${listId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) throw new Error('Failed to update list')

      const updatedList = await response.json()
      
      applyOptimisticUpdate(prevLists => 
        prevLists.map(list => list.id === listId ? { ...list, ...updatedList } : list)
      )
      
      if (board && board.visibility === 'workspace') {
        fetch(`/api/boards/${boardId}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            type: 'list_updated',
            listId: listId,
            updates: updates,
            updatedList: updatedList
          })
        }).catch(err => console.error('Broadcast error:', err))
      }
      
      return updatedList
    } catch (err) {
      setLists(originalLists)
      console.error('Error updating list:', err)
      throw err
    }
  }, [boardId, lists, applyOptimisticUpdate, board?.visibility])

  const deleteList = useCallback(async (listId) => {
    const originalLists = lists
    applyOptimisticUpdate(prevLists => 
      prevLists.filter(list => list.id !== listId)
    )

    try {
      const response = await fetch(`/api/boards/${boardId}/lists/${listId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete list')
      
      if (board && board.visibility === 'workspace') {
        fetch(`/api/boards/${boardId}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            type: 'list_deleted',
            listId: listId
          })
        }).catch(err => console.error('Broadcast error:', err))
      }
    } catch (err) {
      setLists(originalLists)
      console.error('Error deleting list:', err)
      throw err
    }
  }, [boardId, lists, applyOptimisticUpdate, board?.visibility])

  const createCard = useCallback(async (listId, title) => {
    try {
      const response = await fetch(`/api/boards/${boardId}/cards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ list_id: listId, title: title.trim() }),
      })

      if (!response.ok) throw new Error('Failed to create card')

      const createdCard = await response.json()
      
            applyOptimisticUpdate(prevLists => 
        prevLists.map(list => 
           list.id === listId 
             ? { ...list, cards: [...(list.cards || []), createdCard] }
             : list
         )
       )
      
      if (board && board.visibility === 'workspace') {
        fetch(`/api/boards/${boardId}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            type: 'card_created',
            card: createdCard,
            listId: listId
          })
        }).catch(err => console.error('Broadcast error:', err))
      }
      
      if (board && board.visibility === 'private') {
        setActivities(prev => [{
          id: `temp_${Date.now()}`,
          type: 'card.created',
          data: {
            card_title: createdCard.title,
            list_title: lists.find(l => l.id === listId)?.title || 'Unknown List'
          },
          actor: { display_name: 'You' },
          created_at: new Date().toISOString()
        }, ...prev.slice(0, 19)])
      }
      
      return createdCard
    } catch (err) {
      console.error('Error creating card:', err)
      throw err
    }
  }, [boardId, lists, applyOptimisticUpdate, board?.visibility])

  const updateCard = useCallback(async (cardId, updates) => {
    const originalLists = lists
    applyOptimisticUpdate(prevLists => 
      prevLists.map(list => ({
        ...list,
        cards: list.cards.map(card => 
          card.id === cardId ? { ...card, ...updates, updated_at: new Date().toISOString() } : card
        )
      }))
    )

    try {
      const response = await fetch(`/api/boards/${boardId}/cards/${cardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) throw new Error('Failed to update card')

      const updatedCard = await response.json()
      
      applyOptimisticUpdate(prevLists => 
        prevLists.map(list => ({
        ...list,
        cards: list.cards.map(card => 
          card.id === cardId ? { ...card, ...updatedCard } : card
        )
        }))
      )
      
      if (board && board.visibility === 'workspace') {
        fetch(`/api/boards/${boardId}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            type: 'card_updated',
            cardId: cardId,
            updates: updates,
            updatedCard: updatedCard
          })
        }).catch(err => console.error('Broadcast error:', err))
      }
      
      return updatedCard
    } catch (err) {
      setLists(originalLists)
      console.error('Error updating card:', err)
      throw err
    }
  }, [boardId, lists, applyOptimisticUpdate, board?.visibility])

  const deleteCard = useCallback(async (listId, cardId) => {
    const originalLists = lists
    applyOptimisticUpdate(prevLists => 
      prevLists.map(list => 
        list.id === listId 
          ? { ...list, cards: list.cards.filter(card => card.id !== cardId) }
          : list
      )
    )

    try {
      const response = await fetch(`/api/boards/${boardId}/cards/${cardId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete card')
      
      if (board && board.visibility === 'workspace') {
        fetch(`/api/boards/${boardId}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            type: 'card_deleted',
            cardId: cardId,
            listId: listId
          })
        }).catch(err => console.error('Broadcast error:', err))
      }
    } catch (err) {
      setLists(originalLists)
      console.error('Error deleting card:', err)
      throw err
    }
  }, [boardId, lists, applyOptimisticUpdate, board?.visibility])

  const updateListsOrder = useCallback(async (newLists) => {
    const originalLists = lists
    setLists(newLists)

    try {
      const response = await fetch(`/api/boards/${boardId}/lists`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lists: newLists }),
      })

      if (!response.ok) throw new Error('Failed to update lists order')
      
      if (board && board.visibility === 'workspace') {
        fetch(`/api/boards/${boardId}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            type: 'lists_reordered',
            newLists: newLists
          })
        }).catch(err => console.error('Broadcast error:', err))
      }
    } catch (err) {
      setLists(originalLists)
      console.error('Error updating lists order:', err)
    }
  }, [boardId, lists, board?.visibility])

  const updateCardsOrder = useCallback(async (newLists) => {
    const originalLists = lists
    setLists(newLists)

    try {
      const cardsToUpdate = newLists
        .filter(list => list && list.id && !list.id.startsWith('temp_'))
        .flatMap(list => 
          (list.cards || [])
            .filter(card => card && card.id && !card.id.startsWith('temp_') && !card.id.startsWith('real_'))
            .map(card => ({
              id: card.id,
              list_id: list.id,
              position: card.position,
              title: card.title,
              description: card.description || '',
              due_date: card.due_date
            }))
        )
      
      const response = await fetch(`/api/boards/${boardId}/cards`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: cardsToUpdate }),
      })

      if (!response.ok) throw new Error('Failed to update cards order')
      
      if (board && board.visibility === 'workspace') {
        fetch(`/api/boards/${boardId}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            type: 'cards_reordered',
            newLists: newLists
          })
        }).catch(err => console.error('Broadcast error:', err))
      }
    } catch (err) {
      setLists(originalLists)
      console.error('Error updating cards order:', err)
    }
  }, [boardId, lists, board?.visibility])

  const moveCard = useCallback(async (fromListId, toListId, cardId, newPosition) => {
    const originalLists = lists
    
    const movedCard = originalLists
      .find(l => l.id === fromListId)
      ?.cards?.find(c => c.id === cardId)

    if (!movedCard) {
      return
    }

    if (movedCard.id.startsWith('temp_') || movedCard.id.startsWith('real_')) {
      return
    }

    const updatedLists = lists.map(list => {
      const cards = list.cards || []
      
      if (list.id === fromListId) {
        return { ...list, cards: cards.filter(card => card.id !== cardId) }
      }
      if (list.id === toListId) {
        const newCards = [...cards]
        newCards.splice(newPosition, 0, { ...movedCard, list_id: toListId })
        const updatedCards = newCards.map((c, index) => ({
          ...c,
          position: (index + 1) * 1000
        }))
        return { ...list, cards: updatedCards }
      }
      return list
    })

    setLists(updatedLists)

    try {
      const cardsToUpdate = updatedLists
        .filter(list => list && list.id && !list.id.startsWith('temp_'))
        .flatMap(list => 
          (list.cards || [])
            .filter(card => card && card.id && !card.id.startsWith('temp_') && !card.id.startsWith('real_'))
            .map(card => ({
              id: card.id,
              list_id: list.id,
              position: card.position,
              title: card.title,
              description: card.description || '',
              due_date: card.due_date,
              moved: card.id === cardId,
              previous_list_id: fromListId
            }))
        )



      const response = await fetch(`/api/boards/${boardId}/cards`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cards: cardsToUpdate }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`Failed to move card: ${errorData.error || response.statusText}`)
      }

      if (board && board.visibility === 'workspace') {
        fetch(`/api/boards/${boardId}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            type: 'card_moved',
            cardId: cardId,
            fromListId: fromListId,
            toListId: toListId,
            newPosition: newPosition,
            movedCard: movedCard
          })
        }).catch(err => console.error('Broadcast error:', err))
      }
    } catch (err) {
      setLists(originalLists)
      console.error('Error moving card:', err)
      throw err
    }
  }, [boardId, lists, board?.visibility])

  const updateBoard = useCallback(async (updates) => {
    try {
      const response = await fetch(`/api/boards/${boardId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) throw new Error('Failed to update board')

      const updatedBoard = await response.json()
      setBoard(prev => ({ ...prev, ...updatedBoard }))
      
      if (board && board.visibility === 'workspace') {
        fetch(`/api/boards/${boardId}/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            type: 'board_updated',
            updates: updates,
            updatedBoard: updatedBoard
          })
        }).catch(err => console.error('Broadcast error:', err))
      }
      
      return updatedBoard
    } catch (err) {
      console.error('Error updating board:', err)
      throw err
    }
  }, [boardId, board?.visibility])

  const refetch = useCallback(() => {
    fetchBoard()
  }, [fetchBoard])

  useEffect(() => {
    fetchBoard()
    
    if (board && board.visibility === 'workspace') {
      const eventSource = new EventSource(`/api/boards/${boardId}/events`)
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          
          if (data.type === 'card_moved') {
            if (data.cardId && data.fromListId && data.toListId) {
              setLists(prevLists => {
                const updatedLists = prevLists.map(list => {
                  if (list.id === data.fromListId) {
                    const cards = list.cards || []
                    return { ...list, cards: cards.filter(card => card.id !== data.cardId) }
                  }
                  if (list.id === data.toListId && data.movedCard) {
                    const cards = list.cards || []
                    const existingCard = cards.find(card => card.id === data.cardId)
                    if (existingCard) return list
                    
                    const newCards = [...cards]
                    newCards.splice(data.newPosition || 0, 0, data.movedCard)
                    const updatedCards = newCards.map((c, index) => ({
                      ...c,
                      position: (index + 1) * 1000
                    }))
                    return { ...list, cards: updatedCards }
                  }
                  return list
                })
                return updatedLists
              })
            }
          } else if (data.type === 'card_created' && data.card) {
            setLists(prevLists => {
              const updatedLists = prevLists.map(list => {
                if (list.id === data.listId) {
                  const cards = list.cards || []
                  const existingCard = cards.find(card => card.id === data.card.id)
                  if (existingCard) return list
                  return { ...list, cards: [...cards, data.card] }
                }
                return list
              })
              return updatedLists
            })
          } else if (data.type === 'list_created' && data.list) {
            setLists(prevLists => {
              const existingList = prevLists.find(list => list.id === data.list.id)
              if (existingList) return prevLists
              return [...prevLists, { ...data.list, cards: [] }]
            })
          } else if (data.type === 'card_moved' && data.newLists) {
            setLists(data.newLists)
          } else if (data.type === 'card_updated' && data.cardId && data.updatedCard) {
            setLists(prevLists => {
              const updatedLists = prevLists.map(list => ({
                ...list,
                cards: (list.cards || []).map(card => 
                  card.id === data.cardId ? { ...card, ...data.updatedCard } : card
                )
              }))
              return updatedLists
            })
          } else if (data.type === 'card_deleted' && data.cardId && data.listId) {
            setLists(prevLists => {
              const updatedLists = prevLists.map(list => {
                if (list.id === data.listId) {
                  return { ...list, cards: (list.cards || []).filter(card => card.id !== data.cardId) }
                }
                return list
              })
              return updatedLists
            })
          } else if (data.type === 'list_updated' && data.listId && data.updatedList) {
            setLists(prevLists => {
              const updatedLists = prevLists.map(list => 
                list.id === data.listId ? { ...list, ...data.updatedList } : list
              )
              return updatedLists
            })
          } else if (data.type === 'list_deleted' && data.listId) {
            setLists(prevLists => prevLists.filter(list => list.id !== data.listId))
          } else if (data.type === 'lists_reordered' && data.newLists) {
            setLists(data.newLists)
          } else if (data.type === 'cards_reordered' && data.newLists) {
            setLists(data.newLists)
          } else if (data.type === 'card_label_added' && data.cardId && data.label) {
            setLists(prevLists => {
              const updatedLists = prevLists.map(list => ({
                ...list,
                cards: (list.cards || []).map(card => {
                  if (card.id === data.cardId) {
                    const existingLabel = (card.labels || []).find(label => label.id === data.label.id)
                    if (existingLabel) {
                      return card
                    }
                    return { ...card, labels: [...(card.labels || []), data.label] }
                  }
                  return card
                })
              }))
              return updatedLists
            })
          } else if (data.type === 'card_label_removed' && data.cardId && data.labelId) {
            setLists(prevLists => {
              const updatedLists = prevLists.map(list => ({
                ...list,
                cards: (list.cards || []).map(card => {
                  if (card.id === data.cardId) {
                    return { ...card, labels: (card.labels || []).filter(label => label.id !== data.labelId) }
                  }
                  return card
                })
              }))
              return updatedLists
            })
          } else if (data.type === 'card_assignee_added' && data.cardId && data.userId) {
            setLists(prevLists => {
              const updatedLists = prevLists.map(list => ({
                ...list,
                cards: (list.cards || []).map(card => {
                  if (card.id === data.cardId) {
                    const existingAssignee = (card.assignees || []).find(assignee => assignee.id === data.userId)
                    if (existingAssignee) {
                      return card
                    }
                    return { ...card, assignees: [...(card.assignees || []), { id: data.userId }] }
                  }
                  return card
                })
              }))
              return updatedLists
            })
          } else if (data.type === 'card_assignee_removed' && data.cardId && data.userId) {
            setLists(prevLists => {
              const updatedLists = prevLists.map(list => ({
                ...list,
                cards: (list.cards || []).map(card => {
                  if (card.id === data.cardId) {
                    return { ...card, assignees: (card.assignees || []).filter(assignee => assignee.id !== data.userId) }
                  }
                  return card
                })
              }))
              return updatedLists
            })
          } else if (data.type === 'board_updated' && data.updatedBoard) {
            setBoard(prev => ({ ...prev, ...data.updatedBoard }))
          } else if (data.type === 'comment_added' && data.cardId && data.comment) {
            setLists(prevLists => {
              const updatedLists = prevLists.map(list => ({
                ...list,
                cards: (list.cards || []).map(card => {
                  if (card.id === data.cardId) {
                    return { 
                      ...card, 
                      comments: [...(card.comments || []), data.comment]
                    }
                  }
                  return card
                })
              }))
              return updatedLists
            })
          } else if (data.type === 'member_added' || data.type === 'member_removed') {
            refetch()
          } else if (data.type === 'activity_added' && data.activity) {
            setActivities(prev => [data.activity, ...prev.slice(0, 19)])
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error)
        }
      }
      
      eventSource.onerror = (error) => {
        console.error('SSE connection error:', error)
        eventSource.close()
      }
      
      eventSourceRef.current = eventSource
      
      return () => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
        }
        if (eventSourceRef.current) {
          eventSourceRef.current.close()
        }
      }
    }
  }, [fetchBoard, boardId, board?.visibility])

  return {
    board,
    lists,
    labels,
    activities,
    userRole,
    loading,
    error,
    refetch,
    createList,
    updateList,
    deleteList,
    createCard,
    updateCard,
    deleteCard,
    updateListsOrder,
    updateCardsOrder,
    moveCard,
    updateBoard,
    addBoardLabel: (newLabel) => {
      setLabels(prev => [...prev, newLabel])
    },
    getCardComments: async (cardId) => {
      try {
        const response = await fetch(`/api/boards/${boardId}/cards/${cardId}/comments`)
        if (!response.ok) throw new Error('Failed to fetch comments')
        return await response.json()
      } catch (err) {
        console.error('Error fetching comments:', err)
        return []
      }
    },
    addCardComment: async (cardId, body) => {
      try {
        const response = await fetch(`/api/boards/${boardId}/cards/${cardId}/comments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: body }),
        })
        if (!response.ok) throw new Error('Failed to add comment')
        const comment = await response.json()
        
        if (board && board.visibility === 'workspace') {
          fetch(`/api/boards/${boardId}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              type: 'comment_added',
              cardId: cardId,
              comment: comment
            })
          }).catch(err => console.error('Broadcast error:', err))
        }
        
        return comment
      } catch (err) {
        console.error('Error adding comment:', err)
        throw err
      }
    },
    getCardLabels: async (cardId) => {
      try {
        const response = await fetch(`/api/boards/${boardId}/cards/${cardId}/labels`)
        if (!response.ok) throw new Error('Failed to fetch card labels')
        return await response.json()
      } catch (err) {
        console.error('Error fetching card labels:', err)
        return []
      }
    },
    addCardLabel: async (cardId, labelId) => {
      try {
        const response = await fetch(`/api/boards/${boardId}/cards/${cardId}/labels`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label_id: labelId }),
        })
        if (!response.ok) throw new Error('Failed to add label')
        const result = await response.json()
        
        if (board && board.visibility === 'workspace') {
          fetch(`/api/boards/${boardId}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              type: 'card_label_added',
              cardId: cardId,
              labelId: labelId,
              label: result
            })
          }).catch(err => console.error('Broadcast error:', err))
        }
        
        if (board && board.visibility === 'private') {
          setActivities(prev => [{
            id: `temp_${Date.now()}`,
            type: 'card.labeled',
            data: {
              card_id: cardId,
              card_title: lists.flatMap(l => l.cards || []).find(c => c.id === cardId)?.title || 'Unknown Card',
              label_id: labelId,
              label_name: result.name
            },
            actor: { display_name: 'You' },
            created_at: new Date().toISOString()
          }, ...prev.slice(0, 19)])
        }
        
        return result
      } catch (err) {
        console.error('Error adding label:', err)
        throw err
      }
    },
    removeCardLabel: async (cardId, labelId) => {
      try {
        const response = await fetch(`/api/boards/${boardId}/cards/${cardId}/labels?label_id=${labelId}`, {
          method: 'DELETE',
        })
        if (!response.ok) throw new Error('Failed to remove label')
        const result = await response.json()
        
        if (board && board.visibility === 'workspace') {
          fetch(`/api/boards/${boardId}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              type: 'card_label_removed',
              cardId: cardId,
              labelId: labelId
            })
          }).catch(err => console.error('Broadcast error:', err))
        }
        
        if (board && board.visibility === 'private') {
          setActivities(prev => [{
            id: `temp_${Date.now()}`,
            type: 'card.unlabeled',
            data: {
              card_id: cardId,
              card_title: lists.flatMap(l => l.cards || []).find(c => c.id === cardId)?.title || 'Unknown Card',
              label_id: labelId
            },
            actor: { display_name: 'You' },
            created_at: new Date().toISOString()
          }, ...prev.slice(0, 19)])
        }
        
        return result
      } catch (err) {
        console.error('Error removing label:', err)
        throw err
      }
    },
    getCardAssignees: async (cardId) => {
      try {
        const response = await fetch(`/api/boards/${boardId}/cards/${cardId}/assignees`)
        if (!response.ok) throw new Error('Failed to fetch card assignees')
        return await response.json()
      } catch (err) {
        console.error('Error fetching card assignees:', err)
        return []
      }
    },
    addCardAssignee: async (cardId, userId) => {
      try {
        const response = await fetch(`/api/boards/${boardId}/cards/${cardId}/assignees`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId }),
        })
        if (!response.ok) throw new Error('Failed to add assignee')
        const result = await response.json()
        
        if (board && board.visibility === 'workspace') {
          fetch(`/api/boards/${boardId}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              type: 'card_assignee_added',
              cardId: cardId,
              userId: userId
            })
          }).catch(err => console.error('Broadcast error:', err))
        }
        
        return result
      } catch (err) {
        console.error('Error adding assignee:', err)
        throw err
      }
    },
    removeCardAssignee: async (cardId, userId) => {
      try {
        const response = await fetch(`/api/boards/${boardId}/cards/${cardId}/assignees?user_id=${userId}`, {
          method: 'DELETE',
        })
        if (!response.ok) throw new Error('Failed to remove assignee')
        const result = await response.json()
        
        if (board && board.visibility === 'workspace') {
          fetch(`/api/boards/${boardId}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              type: 'card_assignee_removed',
              cardId: cardId,
              userId: userId
            })
          }).catch(err => console.error('Broadcast error:', err))
        }
        
        return result
      } catch (err) {
        console.error('Error removing assignee:', err)
        throw err
      }
    },
    getBoardMembers: useCallback(async () => {
      try {
        const response = await fetch(`/api/boards/${boardId}/members`)
        if (!response.ok) throw new Error('Failed to fetch board members')
        return await response.json()
      } catch (err) {
        console.error('Error fetching board members:', err)
        return []
      }
    }, [boardId]),
    inviteBoardMember: async (email) => {
      try {
        const response = await fetch(`/api/boards/${boardId}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        if (!response.ok) throw new Error('Failed to invite member')
        return await response.json()
      } catch (err) {
        console.error('Error inviting member:', err)
        throw err
      }
    },
    removeBoardMember: async (memberId) => {
      try {
        const response = await fetch(`/api/boards/${boardId}/members?member_id=${memberId}`, {
          method: 'DELETE',
        })
        if (!response.ok) throw new Error('Failed to remove member')
        return await response.json()
      } catch (err) {
        console.error('Error removing member:', err)
        throw err
      }
    },

  }
}
