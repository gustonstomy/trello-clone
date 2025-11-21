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
      <nav className="bg-[#0085FF]  ">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="text-xl font-bold text-white">
                Trello Clone
              </Link>
              <div className="hidden md:flex space-x-4">
                <Link
                  href="/dashboard"
                  className="px-3 py-2 rounded-md text-sm font-medium  text-white flex items-center justify-center"
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
                className="bg-[#003465] text-white border border-[#1976D2]"
              >
                Create Organization
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full"
                  >
                    <Avatar>
                      <AvatarImage
                        src={user?.avatar_url || ""}
                        alt={user?.full_name || ""}
                      />
                      <AvatarFallback>
                        {getInitials(user?.full_name || "User")}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 bg-[#0085FF] text-white "
                >
                  <DropdownMenuLabel>
                    <div className="flex flex-col bg-[#0085FF] text-white">
                      <span className="font-medium">
                        {user?.full_name || "User"}
                      </span>
                      <span className="bg-[#0085FF] text-white">
                        {user?.email}
                      </span>
                    </div>
                  </DropdownMenuLabel>

                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={signOut}
                    className="text-white hover:text-black group"
                  >
                    <LogOut className="mr-2 h-4 w-4 text-white group-hover:text-black" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
