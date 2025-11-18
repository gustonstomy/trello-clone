'use client'

import { useEffect, useState, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '../../../../lib/supabase/client'
import { useAuth } from '../../../../hooks/use-auth'
import { Card, CardContent,  CardHeader, CardTitle } from '../../../../components/ui/card'
import { Button } from '../../../../components/ui/button'
import { Loader2, Plus, Settings, Users } from 'lucide-react'
import { Organization, Board, OrganizationMember } from '../../../../types'
import CreateBoardDialog from '../../../../components/dashboard/create-board-dialog'
import InviteMemberDialog from '../../../../components/dashboard/invite-member-dialog'
import ManageMembersDialog from '../../../../components/dashboard/manage-members-dialog'

export default function OrganizationPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params)
  const { user } = useAuth()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [boards, setBoards] = useState<Board[]>([])
  const [members, setMembers] = useState<OrganizationMember[]>([])
  const [userRole, setUserRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateBoard, setShowCreateBoard] = useState(false)
  const [showInviteMember, setShowInviteMember] = useState(false)
  const [showManageMembers, setShowManageMembers] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        // Fetch organization
        const { data: orgData, error: orgError } = await supabase
          .from('organizations')
          .select('*')
          .eq('slug', resolvedParams.slug)
          .single()

        if (orgError) throw orgError
        setOrganization(orgData)

        // Fetch user's role
        const { data: memberData } = await supabase
          .from('organization_members')
          .select('role')
          .eq('organization_id', orgData.id)
          .eq('user_id', user.id)
          .single()

        setUserRole(memberData?.role || null)

        // Fetch boards
        const { data: boardsData, error: boardsError } = await supabase
          .from('boards')
          .select('*')
          .eq('organization_id', orgData.id)
          .order('created_at', { ascending: false })

        if (boardsError) throw boardsError
        setBoards(boardsData || [])

        // Fetch members
        const { data: membersData, error: membersError } = await supabase
          .from('organization_members')
          .select('*, profiles(*)')
          .eq('organization_id', orgData.id)

        if (membersError) throw membersError
        setMembers(membersData || [])
      } catch (error) {
        console.error('Error fetching organization data:', error)
        router.push('/dashboard')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, resolvedParams.slug, router, supabase])

  const handleBoardCreated = (board: Board) => {
    setBoards([board, ...boards])
  }

  const handleMemberInvited = () => {
    // Refresh members list
    const fetchMembers = async () => {
      if (!organization) return
      const { data } = await supabase
        .from('organization_members')
        .select('*, profiles(*)')
        .eq('organization_id', organization.id)
      if (data) setMembers(data)
    }
    fetchMembers()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (!organization) {
    return <div>Organization not found</div>
  }

  const canManage = userRole === 'owner' || userRole === 'admin'

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
            <p className="text-gray-600 mt-2">{organization.description}</p>
          </div>
          <div className="flex items-center space-x-2">
            {canManage && (
              <>
                <Button variant="outline" onClick={() => setShowInviteMember(true)}>
                  <Users className="mr-2 h-4 w-4" />
                  Invite Members
                </Button>
                <Button variant="outline" onClick={() => setShowManageMembers(true)}>
                  <Settings className="mr-2 h-4 w-4" />
                  Manage
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Boards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{boards.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{members.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Role</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{userRole}</div>
            </CardContent>
          </Card>
        </div>

        {/* Boards */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Boards</h2>
            <Button onClick={() => setShowCreateBoard(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Board
            </Button>
          </div>

          {boards.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Plus className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No boards yet</h3>
                <p className="text-gray-600 text-center mb-6">
                  Create your first board to start organizing tasks
                </p>
                <Button onClick={() => setShowCreateBoard(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Board
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {boards.map((board) => (
                <Link key={board.id} href={`/dashboard/board/${board.id}`}>
                  <Card 
                    className="hover:shadow-lg transition-shadow cursor-pointer h-32"
                    style={{ backgroundColor: board.background_color }}
                  >
                    <CardHeader>
                      <CardTitle className="text-white text-lg">{board.name}</CardTitle>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateBoardDialog
        open={showCreateBoard}
        onOpenChange={setShowCreateBoard}
        organizationId={organization.id}
        onBoardCreated={handleBoardCreated}
      />

      <InviteMemberDialog
        open={showInviteMember}
        onOpenChange={setShowInviteMember}
        organization={organization}
        onMemberInvited={handleMemberInvited}
      />

      <ManageMembersDialog
        open={showManageMembers}
        onOpenChange={setShowManageMembers}
        organization={organization}
        members={members}
        userRole={userRole}
        onMembersChanged={handleMemberInvited}
      />
    </>
  )
}