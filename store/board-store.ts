import { create } from 'zustand'
import { Board, List, Card } from '../types'

interface BoardState {
  currentBoard: Board | null
  lists: List[]
  cards: Record<string, Card[]>
  setBoard: (board: Board | null) => void
  setLists: (lists: List[]) => void
  setCards: (listId: string, cards: Card[]) => void
  addList: (list: List) => void
  updateList: (listId: string, updates: Partial<List>) => void
  deleteList: (listId: string) => void
  addCard: (listId: string, card: Card) => void
  updateCard: (cardId: string, updates: Partial<Card>) => void
  deleteCard: (cardId: string) => void
  moveCard: (cardId: string, sourceListId: string, destListId: string, position: number) => void
}

export const useBoardStore = create<BoardState>((set) => ({
  currentBoard: null,
  lists: [],
  cards: {},
  setBoard: (board) => set({ currentBoard: board }),
  setLists: (lists) => set({ lists }),
  setCards: (listId, cards) => 
    set((state) => ({ 
      cards: { ...state.cards, [listId]: cards } 
    })),
  addList: (list) => 
    set((state) => ({ 
      lists: [...state.lists, list].sort((a, b) => a.position - b.position) 
    })),
  updateList: (listId, updates) =>
    set((state) => ({
      lists: state.lists.map((list) =>
        list.id === listId ? { ...list, ...updates } : list
      ),
    })),
  deleteList: (listId) =>
    set((state) => {
      const { [listId]: removed, ...remainingCards } = state.cards
      return {
        lists: state.lists.filter((list) => list.id !== listId),
        cards: remainingCards,
      }
    }),
  addCard: (listId, card) =>
    set((state) => ({
      cards: {
        ...state.cards,
        [listId]: [...(state.cards[listId] || []), card].sort(
          (a, b) => a.position - b.position
        ),
      },
    })),
  updateCard: (cardId, updates) =>
    set((state) => {
      const newCards = { ...state.cards }
      Object.keys(newCards).forEach((listId) => {
        newCards[listId] = newCards[listId].map((card) =>
          card.id === cardId ? { ...card, ...updates } : card
        )
      })
      return { cards: newCards }
    }),
  deleteCard: (cardId) =>
    set((state) => {
      const newCards = { ...state.cards }
      Object.keys(newCards).forEach((listId) => {
        newCards[listId] = newCards[listId].filter((card) => card.id !== cardId)
      })
      return { cards: newCards }
    }),
  moveCard: (cardId, sourceListId, destListId, position) =>
    set((state) => {
      const sourceCards = state.cards[sourceListId] || []
      const destCards = state.cards[destListId] || []
      
      const card = sourceCards.find((c) => c.id === cardId)
      if (!card) return state

      const newSourceCards = sourceCards.filter((c) => c.id !== cardId)
      const newDestCards = [...destCards]
      
      newDestCards.splice(position, 0, { ...card, list_id: destListId, position })
      
      return {
        cards: {
          ...state.cards,
          [sourceListId]: newSourceCards,
          [destListId]: newDestCards,
        },
      }
    }),
}))