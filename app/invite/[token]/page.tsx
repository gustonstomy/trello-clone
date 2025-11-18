/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../../components/ui/card'
import { useToast } from '../../../hooks/use-toast'
import { Loader2 } from 'lucide-react'

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const resolvedParams = use(params)
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [invite, setInvite] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push(`/auth/login?redirect=/invite/${resolvedParams.token}`)
          return
        }

        const { data, error } = await supabase
          .from('organization_invites')
          .select('*, organizations(*)')
          .eq('token', resolvedParams.token)
          .is('accepted_at', null)
          .single()

        if (error || !data) {
          setError('This invite is invalid or has already been used.')
          return
        }

        if (new Date(data.expires_at) < new Date()) {
          setError('This invite has expired.')
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', user.id)
          .single()

        if (profile?.email !== data.email) {
          setError('This invite was sent to a different email address.')
          return
        }

        setInvite(data)
      } catch (err) {
        setError('Failed to load invite.')
      } finally {
        setIsLoading(false)
      }
    }

    fetchInvite()
  }, [resolvedParams.token, router, supabase])

  const handleAccept = async () => {
    setIsAccepting(true)

    try {
      const response = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resolvedParams.token }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept invite')
      }

      toast({
        title: 'Invite accepted!',
        description: `You've joined ${data.organization.name}`,
      })

      router.push('/dashboard')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setIsAccepting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Invalid Invite</CardTitle>
            <CardDescription className="text-center">{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => router.push('/dashboard')} className="w-full">
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Organization Invite</CardTitle>
          <CardDescription className="text-center">
            You've been invited to join an organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">{invite?.organizations?.name}</h3>
            {invite?.organizations?.description && (
              <p className="text-sm text-gray-600">{invite.organizations.description}</p>
            )}
            <p className="text-sm text-gray-500 mt-2">Role: {invite?.role}</p>
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            onClick={() => router.push('/dashboard')}
            variant="outline"
            className="flex-1"
            disabled={isAccepting}
          >
            Decline
          </Button>
          <Button onClick={handleAccept} className="flex-1" disabled={isAccepting}>
            {isAccepting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Accepting...
              </>
            ) : (
              'Accept Invite'
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}