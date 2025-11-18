/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useRouter } from 'next/navigation'
import { Button } from '../../components/ui/button'
import { ArrowLeft, Star } from 'lucide-react'

interface BoardHeaderProps {
  board: any
}

export default function BoardHeader({ board }: BoardHeaderProps) {
  const router = useRouter()

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="text-white hover:bg-white/20"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-white">{board.name}</h1>
        {board.description && (
          <p className="text-white/80 text-sm">{board.description}</p>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20">
          <Star className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}