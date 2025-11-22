/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Link from "next/link";
import { useOrganizations } from "../../hooks/use-organizations";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Loader2, Users, FolderKanban } from "lucide-react";

export default function DashboardPage() {
  const { data: organizations = [], isLoading } = useOrganizations();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 h-[80vh]">
        <Loader2 className="h-16 w-16 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className=" w-full h-[80vh] overflow-y-auto rounded-2xl p-4 no-scrollbar ">
      <div className="mb-16">
        <h1 className="text-3xl font-bold text-white">Your Organizations</h1>
        <p className="text-blue-200 mt-2">
          Manage your organizations and access their boards
        </p>
      </div>

      {organizations.length === 0 ? (
        <Card className="bg-white/5 backdrop-blur-xl border border-[#0085FF]/20 border-dashed mt-36">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderKanban className="h-12 w-12 text-[#0085FF] mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-white">
              No organizations yet
            </h3>
            <p className="text-blue-200 text-center mb-6 max-w-md">
              Create your first organization to start collaborating with your
              team
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 ">
          {organizations.map((org) => (
            <Link key={org.id} href={`/dashboard/org/${org.slug}`}>
              <Card className="group bg-white/5 backdrop-blur-xl border border-[#0085FF]/20 hover:border-[#0085FF]/50 hover:bg-white/10 transition-all duration-300 hover:shadow-lg hover:shadow-[#0085FF]/10 cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl text-white group-hover:text-[#0085FF] transition-colors">
                      {org.name}
                    </CardTitle>
                    <span className="text-xs bg-[#0085FF]/20 text-[#0085FF] border border-[#0085FF]/20 px-2 py-1 rounded-full font-semibold">
                      {org.role}
                    </span>
                  </div>
                  <CardDescription className="line-clamp-2 text-blue-200">
                    {org.description || "No description"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-blue-200">
                    <Users className="h-4 w-4 mr-2 text-[#0085FF]" />
                    {org.member_count}{" "}
                    {org.member_count === 1 ? "member" : "members"}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
