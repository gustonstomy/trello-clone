'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../../hooks/use-auth'
import { useBoardStore } from '../../../../store/board-store'
import { Button } from '../../../../components/ui/button'
import { Loader2,  Plus } from 'lucide-react'
import {  Card } from '../../../../types'
import BoardHeader from '../../../../components/board/board-header'
import BoardList from '../../../../components/board/board-list'
import CreateListDialog from '../../../../components/board/create-list-dialog'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core'
import { arrayMove, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import CardItem from '../../../../components/board/card-item'
import { createClient } from '../../../../lib/supabase/client'

export default function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const { user } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateList, setShowCreateList] = useState(false)
  const [activeCard, setActiveCard] = useState<Card | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const {
    currentBoard,
    lists,
    cards,
    setBoard,
    setLists,
    setCards,
  } = useBoardStore()

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  useEffect(() => {
    const fetchBoard = async () => {
      if (!user) return

      try {
        // Fetch board
        const { data: boardData, error: boardError } = await supabase
          .from('boards')
          .select('*, organizations(*)')
          .eq('id', resolvedParams.id)
          .single()

        if (boardError) throw boardError

        // Check if user has access
        const { data: memberData } = await supabase
          .from('organization_members')
          .select('*')
          .eq('organization_id', boardData.organization_id)
          .eq('user_id', user.id)
          .single()

        if (!memberData) {
          router.push('/dashboard')
          return
        }

        setBoard(boardData)

        // Fetch lists
        const { data: listsData, error: listsError } = await supabase
          .from('lists')
          .select('*')
          .eq('board_id', resolvedParams.id)
          .order('position', { ascending: true })

        if (listsError) throw listsError
        setLists(listsData || [])

        // Fetch cards for each list
        if (listsData) {
          for (const list of listsData) {
            const { data: cardsData, error: cardsError } = await supabase
              .from('cards')
              .select('*')
              .eq('list_id', list.id)
              .order('position', { ascending: true })

            if (!cardsError && cardsData) {
              setCards(list.id, cardsData)
            }
          }
        }
      } catch (error) {
        console.error('Error fetching board:', error)
        router.push('/dashboard')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBoard()

    // Subscribe to real-time changes
    const listsChannel = supabase
      .channel(`board-${resolvedParams.id}-lists`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lists',
          filter: `board_id=eq.${resolvedParams.id}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('lists')
              .select('*')
              .eq('id', payload.new.id)
              .single()
            if (data) useBoardStore.getState().addList(data)
          } else if (payload.eventType === 'UPDATE') {
            useBoardStore.getState().updateList(payload.new.id, payload.new)
          } else if (payload.eventType === 'DELETE') {
            useBoardStore.getState().deleteList(payload.old.id)
          }
        }
      )
      .subscribe()

    const cardsChannel = supabase
      .channel(`board-${resolvedParams.id}-cards`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cards',
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data } = await supabase
              .from('cards')
              .select('*')
              .eq('id', payload.new.id)
              .single()
            if (data) useBoardStore.getState().addCard(data.list_id, data)
          } else if (payload.eventType === 'UPDATE') {
            useBoardStore.getState().updateCard(payload.new.id, payload.new)
          } else if (payload.eventType === 'DELETE') {
            useBoardStore.getState().deleteCard(payload.old.id)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(listsChannel)
      supabase.removeChannel(cardsChannel)
    }
  }, [user, resolvedParams.id, router, supabase, setBoard, setLists, setCards])

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const activeId = active.id as string

    // Find the card being dragged
    let foundCard: Card | null = null
    Object.values(cards).forEach((listCards) => {
      const card = listCards.find((c) => c.id === activeId)
      if (card) foundCard = card
    })

    setActiveCard(foundCard)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    if (activeId === overId) return

    // Handle card reordering
    const activeList = Object.keys(cards).find((listId) =>
      cards[listId].some((card) => card.id === activeId)
    )
    const overList = Object.keys(cards).find((listId) =>
      cards[listId].some((card) => card.id === overId)
    )

    if (!activeList) return

    if (activeList === overList) {
      // Same list reordering
      const listCards = cards[activeList]
      const oldIndex = listCards.findIndex((card) => card.id === activeId)
      const newIndex = listCards.findIndex((card) => card.id === overId)

      const reorderedCards = arrayMove(listCards, oldIndex, newIndex)
      setCards(activeList, reorderedCards)
    } else if (overList) {
      // Moving to different list
      const activeListCards = [...cards[activeList]]
      const overListCards = [...cards[overList]]

      const activeCardIndex = activeListCards.findIndex((card) => card.id === activeId)
      const overCardIndex = overListCards.findIndex((card) => card.id === overId)

      const [movedCard] = activeListCards.splice(activeCardIndex, 1)
      movedCard.list_id = overList
      overListCards.splice(overCardIndex, 0, movedCard)

      setCards(activeList, activeListCards)
      setCards(overList, overListCards)
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveCard(null)

    if (!over) return

    const activeId = active.id as string
    const overId = over.id as string

    // Find the card and update position in database
    let sourceListId: string | null = null
    let destListId: string | null = null
    let newPosition = 0

    Object.entries(cards).forEach(([listId, listCards]) => {
      const cardIndex = listCards.findIndex((c) => c.id === activeId)
      if (cardIndex !== -1) {
        sourceListId = listId
      }
      const overIndex = listCards.findIndex((c) => c.id === overId)
      if (overIndex !== -1) {
        destListId = listId
        newPosition = overIndex
      }
    })

    if (!sourceListId) return

    try {
      // Check if it's a list being dragged (starts with 'list-')
      if (activeId.startsWith('list-')) {
        // List reordering
        const activeListId = activeId.replace('list-', '')
        const overListId = overId.replace('list-', '')

        const oldIndex = lists.findIndex((list) => list.id === activeListId)
        const newIndex = lists.findIndex((list) => list.id === overListId)

        if (oldIndex !== newIndex) {
          const reorderedLists = arrayMove(lists, oldIndex, newIndex)
          setLists(reorderedLists)

          // Update positions in database
          const updates = reorderedLists.map((list, index) => ({
            id: list.id,
            position: index,
          }))

          for (const update of updates) {
            await supabase
              .from('lists')
              .update({ position: update.position })
              .eq('id', update.id)
          }
        }
      } else {
        // Card movement
        const finalDestListId = destListId || sourceListId
        const destCards = cards[finalDestListId]

        await supabase
          .from('cards')
          .update({
            list_id: finalDestListId,
            position: newPosition,
          })
          .eq('id', activeId)

        // Update positions for all cards in destination list
        const updates = destCards.map((card, index) => ({
          id: card.id,
          position: index,
        }))

        for (const update of updates) {
          if (update.id !== activeId) {
            await supabase
              .from('cards')
              .update({ position: update.position })
              .eq('id', update.id)
          }
        }

        // Log activity
        if (sourceListId !== finalDestListId) {
          await supabase.from('card_activities').insert({
            card_id: activeId,
            user_id: user?.id,
            action: 'moved',
          
            details: {
              from_list_id: sourceListId,
              to_list_id: finalDestListId,
            },
          })
        }
      }
    } catch (error) {
      console.error('Error updating positions:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!currentBoard) {
    return <div>Board not found</div>
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: currentBoard.background_color }}
    >
      <div className="container mx-auto px-4 py-6">
        <BoardHeader board={currentBoard} />

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex space-x-4 overflow-x-auto pb-4">
            <SortableContext
              items={lists.map((list) => `list-${list.id}`)}
              strategy={horizontalListSortingStrategy}
            >
              {lists.map((list) => (
                <BoardList
                  key={list.id}
                  list={list}
                  cards={cards[list.id] || []}
                />
              ))}
            </SortableContext>

            <div className="shrink-0">
              <Button
                onClick={() => setShowCreateList(true)}
                variant="secondary"
                className="w-72 bg-white/20 hover:bg-white/30 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add a list
              </Button>
            </div>
          </div>

          <DragOverlay>
            {activeCard && (
              <div className="rotate-3">
                <CardItem card={activeCard} isDragging />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      <CreateListDialog
        open={showCreateList}
        onOpenChange={setShowCreateList}
        boardId={currentBoard.id}
      />
    </div>
  )
}