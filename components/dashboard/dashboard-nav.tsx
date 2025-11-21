"use client";

import { useState } from "react";
import Link from "next/link";

import { useAuth } from "../../hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Home, LogOut } from "lucide-react";
import { Profile } from "../../types";
import CreateOrganizationDialog from "../../components/dashboard/create-organization-dialog";

export default function DashboardNav({ user }: { user: Profile | null }) {
  const { signOut } = useAuth();

  const [showCreateOrg, setShowCreateOrg] = useState(false);

  const getInitials = (name: string | null) => {
    if (!name) return user?.email.charAt(0).toUpperCase();
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 px-6 py-4 border-b border-[#0085FF]/20 backdrop-blur-sm bg-[#003465]/50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-linear-to-br from-[#0085FF] to-[#003465] rounded-lg"></div>
              <span className="text-white font-bold text-xl">Trello Pro</span>
            </Link>
            <div className="hidden md:flex ml-8">
              <Link
                href="/dashboard"
                className="px-3 py-2 rounded-md text-sm font-medium text-blue-200 hover:text-white hover:bg-[#0085FF]/20 transition-all flex items-center"
              >
                <Home className="inline-block mr-2 h-4 w-4" />
                Dashboard
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setShowCreateOrg(true)}
              size="sm"
              className="bg-[#0085FF]/10 hover:shadow-lg hover:shadow-[#0085FF]/50 text-white border border-[#0085FF]/50 transition-all"
            >
              Create Organization
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-10 w-10 rounded-full hover:bg-[#0085FF]/20"
                >
                  <Avatar className="border border-[#0085FF]/30">
                    <AvatarImage
                      src={user?.avatar_url || ""}
                      alt={user?.full_name || ""}
                    />
                    <AvatarFallback className="bg-[#003465] text-white">
                      {getInitials(user?.full_name || "User")}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-[#001f3f] border border-[#0085FF]/30 text-white backdrop-blur-xl"
              >
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {user?.full_name || "User"}
                    </span>
                    <span className="text-xs text-blue-300">{user?.email}</span>
                  </div>
                </DropdownMenuLabel>

                <DropdownMenuSeparator className="bg-[#0085FF]/20" />
                <DropdownMenuItem
                  onClick={signOut}
                  className="text-blue-200 focus:text-white focus:bg-[#0085FF]/20 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </nav>

      <CreateOrganizationDialog
        open={showCreateOrg}
        onOpenChange={setShowCreateOrg}
      />
    </>
  );
}
