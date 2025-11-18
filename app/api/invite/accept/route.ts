/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from 'next/server'
import { createClient } from '../../../../lib/supabase/client'



type AcceptInviteBody = {
  token: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as AcceptInviteBody | null

    if (!body || !body.token) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const supabase: any = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const nowIso = new Date().toISOString()

    const { data: invite, error: inviteError } = await supabase
      .from('organization_invites')
      .select('*')
      .eq('token', body.token)
      .eq('email', user.email)
      .is('accepted_at', null)
      .gt('expires_at', nowIso)
      .single()

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invite not found or expired' }, { status: 404 })
    }

    const { error: memberError } = await supabase.from('organization_members').insert([
      {
        organization_id: invite.organization_id,
        user_id: user.id,
        role: invite.role === 'admin' ? 'admin' : 'member',
      },
    ])

    if (memberError) {
      return NextResponse.json({ error: memberError.message }, { status: 500 })
    }

    const { error: updateError } = await supabase
      .from('organization_invites')
      .update({ accepted_at: nowIso })
      .eq('id', invite.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, organizationId: (invite as any).organization_id })
  } catch {
    return NextResponse.json({ error: 'Unexpected error accepting invite' }, { status: 500 })
  }
}