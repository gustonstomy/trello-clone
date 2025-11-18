/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '../../hooks/use-toast'
import { Loader2, Trash2 } from 'lucide-react'
import { Organization } from '../../types'
import { createClient } from '../../lib/supabase/client'

interface ManageMembersDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organization: Organization
  members: any[]
  userRole: string | null
  onMembersChanged: () => void
}

export default function ManageMembersDialog({
  open,
  onOpenChange,
  organization,
  members,
  userRole,
  onMembersChanged,
}: ManageMembersDialogProps) {
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [memberToRemove, setMemberToRemove] = useState<any>(null)
  const { toast } = useToast()
  const supabase = createClient()

  const canManage = userRole === 'owner' || userRole === 'admin'

  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!canManage) return

    setIsUpdating(memberId)

    try {
      const { error } = await supabase
        .from('organization_members')
        .update({ role: newRole as 'admin' | 'member' | 'owner' })
        .eq('id', memberId)

      if (error) throw error

      toast({
        title: 'Role updated',
        description: 'Member role has been updated successfully',
      })

      onMembersChanged()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update role',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(null)
    }
  }

  const handleRemoveMember = async () => {
    if (!memberToRemove || !canManage) return

    try {
      const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberToRemove.id)

      if (error) throw error

      toast({
        title: 'Member removed',
        description: 'Member has been removed from the organization',
      })

      onMembersChanged()
      setMemberToRemove(null)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove member',
        variant: 'destructive',
      })
    }
  }

  const getInitials = (name: string | null, email: string) => {
    if (!name) return email.charAt(0).toUpperCase()
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Manage Members</DialogTitle>
            <DialogDescription>
              Manage roles and remove members from {organization.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {members.map((member: any) => {
              const isOwner = member.role === 'owner'
              const canModify = canManage && !isOwner && userRole === 'owner'

              return (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage
                        src={member.profiles?.avatar_url || ''}
                        alt={member.profiles?.full_name || ''}
                      />
                      <AvatarFallback>
                        {getInitials(
                          member.profiles?.full_name,
                          member.profiles?.email
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">
                        {member.profiles?.full_name || 'Unknown User'}
                      </p>
                      <p className="text-sm text-gray-500">
                        {member.profiles?.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {canModify ? (
                      <Select
                        value={member.role}
                        onValueChange={(value) => handleRoleChange(member.id, value)}
                        disabled={isUpdating === member.id}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full capitalize">
                        {member.role}
                      </span>
                    )}

                    {canModify && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMemberToRemove(member)}
                        disabled={isUpdating === member.id}
                      >
                        {isUpdating === member.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-600" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!memberToRemove}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{' '}
              {memberToRemove?.profiles?.full_name || 'this member'} from the
              organization? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}