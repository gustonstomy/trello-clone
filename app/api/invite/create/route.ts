/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

import { createClient } from '@/lib/supabase/server'

type CreateInviteBody = {
  organizationId: string
  email: string
  role?: 'admin' | 'member'
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as CreateInviteBody | null

    if (!body || !body.organizationId || !body.email) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { organizationId, email, role = 'member' } = body

    const supabase = (await createClient()) as any

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('organization_invites')
      .insert([
        {
          organization_id: organizationId,
          email,
          token,
          role,
          invited_by: user.id,
          expires_at: expiresAt,
        },
      ])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const inviteUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/invite/${token}`

    return NextResponse.json(
      {
        invite: data,
        inviteUrl,
      },
      { status: 201 }
    )
  } catch {
    return NextResponse.json({ error: 'Unexpected error creating invite' }, { status: 500 })
  }
}
