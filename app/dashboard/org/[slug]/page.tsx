"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../../../lib/supabase/client";
import { useAuth } from "../../../../hooks/use-auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Loader2, Plus, Settings, Users } from "lucide-react";
import { Organization, Board, OrganizationMember } from "../../../../types";
import CreateBoardDialog from "../../../../components/dashboard/create-board-dialog";
import InviteMemberDialog from "../../../../components/dashboard/invite-member-dialog";
import ManageMembersDialog from "../../../../components/dashboard/manage-members-dialog";

export default function OrganizationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const { user } = useAuth();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [boards, setBoards] = useState<Board[]>([]);
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [showInviteMember, setShowInviteMember] = useState(false);
  const [showManageMembers, setShowManageMembers] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const { data: orgData, error: orgError } = await supabase
          .from("organizations")
          .select("*")
          .eq("slug", resolvedParams.slug)
          .single();

        if (orgError) throw orgError;
        setOrganization(orgData);

        const { data: memberData } = await supabase
          .from("organization_members")
          .select("role")
          .eq("organization_id", orgData.id)
          .eq("user_id", user.id)
          .single();

        setUserRole(memberData?.role || null);

        const { data: boardsData, error: boardsError } = await supabase
          .from("boards")
          .select("*")
          .eq("organization_id", orgData.id)
          .order("created_at", { ascending: false });

        if (boardsError) throw boardsError;
        setBoards(boardsData || []);

        const { data: membersData, error: membersError } = await supabase
          .from("organization_members")
          .select("*, profiles(*)")
          .eq("organization_id", orgData.id);

        if (membersError) throw membersError;
        setMembers(membersData || []);
      } catch (error) {
        console.error("Error fetching organization data:", error);
        router.push("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, resolvedParams.slug, router, supabase]);

  const handleBoardCreated = (board: Board) => {
    setBoards([board, ...boards]);
  };

  const handleMemberInvited = () => {
    const fetchMembers = async () => {
      if (!organization) return;
      const { data } = await supabase
        .from("organization_members")
        .select("*, profiles(*)")
        .eq("organization_id", organization.id);
      if (data) setMembers(data);
    };
    fetchMembers();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 h-[80vh]">
        <Loader2 className="h-16 w-16 animate-spin text-white" />
      </div>
    );
  }

  if (!organization) {
    return <div>Organization not found</div>;
  }

  const canManage = userRole === "owner" || userRole === "admin";

  return (
    <>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              {organization.name}
            </h1>
            <p className="text-blue-200 mt-2">{organization.description}</p>
          </div>
          <div className="flex items-center space-x-2">
            {canManage && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowInviteMember(true)}
                  className="bg-transparent border-[#0085FF]/50 text-blue-200 hover:text-white hover:bg-[#0085FF]/20 hover:border-[#0085FF]"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Invite Members
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowManageMembers(true)}
                  className="bg-transparent border-[#0085FF]/50 text-blue-200 hover:text-white hover:bg-[#0085FF]/20 hover:border-[#0085FF]"
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Manage
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="bg-white/5 backdrop-blur-xl border border-[#0085FF]/20 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-200">
                Total Boards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{boards.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 backdrop-blur-xl border border-[#0085FF]/20 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-200">
                Members
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{members.length}</div>
            </CardContent>
          </Card>
          <Card className="bg-white/5 backdrop-blur-xl border border-[#0085FF]/20 text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-200">
                Your Role
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{userRole}</div>
            </CardContent>
          </Card>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white">Boards</h2>
            <Button
              onClick={() => setShowCreateBoard(true)}
              className="bg-[#0085FF]/10 hover:shadow-lg hover:shadow-[#0085FF]/50 text-white border border-[#0085FF]/50 font-bold py-6 transition-all"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Board
            </Button>
          </div>

          {boards.length === 0 ? (
            <Card className="bg-white/5 backdrop-blur-xl border border-[#0085FF]/20 border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Plus className="h-12 w-12 text-[#0085FF] mb-4" />
                <h3 className="text-lg font-semibold mb-2 text-white">
                  No boards yet
                </h3>
                <p className="text-blue-200 text-center mb-6">
                  Create your first board to start organizing tasks
                </p>
                <Button
                  onClick={() => setShowCreateBoard(true)}
                  className="bg-[#0085FF]/10 hover:bg-[#0085FF]/20 text-white border border-[#0085FF]/50"
                >
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
                    className="hover:shadow-lg transition-all duration-300 cursor-pointer h-32 border-0 hover:scale-105"
                    style={{ backgroundColor: board.background_color }}
                  >
                    <CardHeader>
                      <CardTitle className="text-white text-lg drop-shadow-md">
                        {board.name}
                      </CardTitle>
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
  );
}
