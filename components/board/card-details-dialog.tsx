/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useEffect, useState } from 'react'

import { useAuth } from '../../hooks/use-auth'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Label } from '../ui/label'
import { useToast } from '../../hooks/use-toast'
import { Card } from '../../types'
import { Loader2, Trash2, Clock } from 'lucide-react'
import { useBoardStore } from '../../store/board-store'
import { format } from 'date-fns'
import { createClient } from '../../lib/supabase/client'

interface CardDetailsDialogProps {
  card: Card
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CardDetailsDialog({
  card,
  open,
  onOpenChange,
}: CardDetailsDialogProps) {
  const { user } = useAuth()
  const [title, setTitle] = useState(card.title)
  const [description, setDescription] = useState(card.description || '')
  const [activities, setActivities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()
  const { updateCard, deleteCard } = useBoardStore()

  useEffect(() => {
    if (open) {
      setTitle(card.title)
      setDescription(card.description || '')
      fetchActivities()
    }
  }, [open, card])

  const fetchActivities = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from('card_activities')
        .select('*, profiles(*)')
        .eq('card_id', card.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setActivities(data || [])
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!title.trim()) {
      toast({
        title: 'Error',
        description: 'Card title cannot be empty',
        variant: 'destructive',
      })
      return
    }

    setIsSaving(true)

    try {
      const updates: any = {}
      let hasChanges = false

      if (title !== card.title) {
        updates.title = title.trim()
        hasChanges = true
      }

      if (description !== (card.description || '')) {
        updates.description = description.trim() || null
        hasChanges = true
      }

      if (!hasChanges) {
        onOpenChange(false)
        return
      }

      const { error } = await supabase
        .from('cards')
        .update(updates)
        .eq('id', card.id)

      if (error) throw error

      // Log activity
      if (title !== card.title) {
        await supabase.from('card_activities').insert({
          card_id: card.id,
          user_id: user?.id,
          action: 'updated',
          details: { field: 'title', old: card.title, new: title },
        })
      }

      if (description !== (card.description || '')) {
        await supabase.from('card_activities').insert({
          card_id: card.id,
          user_id: user?.id,
          action: 'updated',
          details: { field: 'description' },
        })
      }

      updateCard(card.id, updates)
      toast({
        title: 'Card updated',
        description: 'Your changes have been saved',
      })

      fetchActivities()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update card',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this card?')) return

    try {
      const { error } = await supabase.from('cards').delete().eq('id', card.id)

      if (error) throw error

      deleteCard(card.id)
      toast({
        title: 'Card deleted',
        description: 'The card has been deleted successfully',
      })
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete card',
        variant: 'destructive',
      })
    }
  }

  const getActivityMessage = (activity: any) => {
    const userName = activity.profiles?.full_name || 'Someone'

    switch (activity.action) {
      case 'created':
        return `${userName} created this card`
      case 'updated':
        if (activity.details?.field === 'title') {
          return `${userName} changed the title`
        }
        if (activity.details?.field === 'description') {
          return `${userName} updated the description`
        }
        return `${userName} updated this card`
      case 'moved':
        return `${userName} moved this card`
      default:
        return `${userName} made changes`
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Card Details</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="card-title">Title</Label>
            <Input
              id="card-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Card title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="card-description">Description</Label>
            <Textarea
              id="card-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a more detailed description..."
              rows={5}
            />
          </div>

          <div className="flex space-x-2">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
            <Button
              onClick={handleDelete}
              variant="destructive"
              disabled={isSaving}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Card
            </Button>
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3 flex items-center">
              <Clock className="mr-2 h-4 w-4" />
              Activity
            </h3>

            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : activities.length === 0 ? (
              <p className="text-sm text-gray-500">No activity yet</p>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start space-x-3 text-sm"
                  >
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center shrink-0">
                      {activity.profiles?.full_name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900">{getActivityMessage(activity)}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(activity.created_at), 'MMM d, yyyy \'at\' h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}