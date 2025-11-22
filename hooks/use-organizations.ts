/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from "@tanstack/react-query";
import { createClient } from "../lib/supabase/client";
import { useAuth } from "./use-auth";
import { OrganizationWithRole } from "../types";

export function useOrganizations() {
  const { user } = useAuth();
  const supabase = createClient();

  return useQuery({
    queryKey: ["organizations", user?.id],
    queryFn: async () => {
      if (!user) return [];

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

      // Optimize member count fetching
      const orgsWithCounts = await Promise.all(
        orgsWithRole.map(async (org: any) => {
          const { count } = await supabase
            .from("organization_members")
            .select("*", { count: "exact", head: true })
            .eq("organization_id", org.id);

          return { ...org, member_count: count || 0 };
        })
      );

      return orgsWithCounts as OrganizationWithRole[];
    },
    enabled: !!user,
  });
}
