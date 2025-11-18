'use client'

import { useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card } from '../../types'
import { Card as CardUI, CardContent } from '../../components/ui/card'
import CardDetailsDialog from './card-details-dialog'

interface CardItemProps {
  card: Card
  isDragging?: boolean
}

export default function CardItem({ card, isDragging = false }: CardItemProps) {
  const [showDetails, setShowDetails] = useState(false)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: 'card',
      card,
    },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  }

  if (isDragging) {
    return (
      <CardUI className="bg-white shadow-lg cursor-grab active:cursor-grabbing">
        <CardContent className="p-3">
          <p className="text-sm">{card.title}</p>
        </CardContent>
      </CardUI>
    )
  }

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={() => setShowDetails(true)}
        className="cursor-pointer"
      >
        <CardUI className="bg-white hover:bg-gray-50 transition-colors">
          <CardContent className="p-3">
            <p className="text-sm">{card.title}</p>
            {card.description && (
              <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                {card.description}
              </p>
            )}
          </CardContent>
        </CardUI>
      </div>

      <CardDetailsDialog
        card={card}
        open={showDetails}
        onOpenChange={setShowDetails}
      />
    </>
  )
}