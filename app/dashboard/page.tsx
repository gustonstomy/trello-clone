/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase/client";
import { useAuth } from "../../hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Loader2, Users, FolderKanban } from "lucide-react";
import { OrganizationWithRole } from "../../types";

export default function DashboardPage() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<OrganizationWithRole[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchOrganizations = async () => {
      if (!user) return;

      const supabase = createClient();

      try {
        const { data, error } = await supabase
          .from("organization_members")
          .select(
            `
            role,
            organizations (
              id,
              name,
              slug,
              description,
              created_at,
              updated_at,
              created_by
            )
          `
          )
          .eq("user_id", user.id);

        if (error) throw error;

        const orgsWithRole = data.map((item: any) => ({
          ...item.organizations,
          role: item.role,
        }));

        const orgsWithCounts = await Promise.all(
          orgsWithRole.map(async (org: any) => {
            const { count } = await supabase
              .from("organization_members")
              .select("*", { count: "exact", head: true })
              .eq("organization_id", org.id);

            return { ...org, member_count: count || 0 };
          })
        );

        setOrganizations(orgsWithCounts);
      } catch (error) {
        console.error("Error fetching organizations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrganizations();

    const handleOrganizationCreated = () => {
      fetchOrganizations();
    };

    window.addEventListener("organization-created", handleOrganizationCreated);

    return () => {
      window.removeEventListener(
        "organization-created",
        handleOrganizationCreated
      );
    };
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 h-[80vh]">
        <Loader2 className="h-16 w-16 animate-spin text-white" />
      </div>
    );
  }

  return (
    <div className=" w-full h-[80vh] overflow-y-auto rounded-2xl p-4  ">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Your Organizations</h1>
        <p className="text-blue-200 mt-2">
          Manage your organizations and access their boards
        </p>
      </div>

      {organizations.length === 0 ? (
        <Card className="bg-white/5 backdrop-blur-xl border border-[#0085FF]/20 border-dashed">
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
