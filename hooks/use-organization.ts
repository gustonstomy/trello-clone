import { useQuery } from "@tanstack/react-query";
import { createClient } from "../lib/supabase/client";
import { useAuth } from "./use-auth";
import { Organization, Board, OrganizationMember } from "../types";

export function useOrganization(slug: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["organization", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) throw error;
      return data as Organization;
    },
    enabled: !!slug,
  });
}

export function useOrganizationBoards(organizationId: string | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["organization-boards", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const { data, error } = await supabase
        .from("boards")
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Board[];
    },
    enabled: !!organizationId,
  });
}

export function useOrganizationMembers(organizationId: string | undefined) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["organization-members", organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const { data, error } = await supabase
        .from("organization_members")
        .select("*, profiles(*)")
        .eq("organization_id", organizationId);

      if (error) throw error;
      return data as OrganizationMember[];
    },
    enabled: !!organizationId,
  });
}

export function useUserRole(organizationId: string | undefined) {
  const { user } = useAuth();
  const supabase = createClient();

  return useQuery({
    queryKey: ["organization-role", organizationId, user?.id],
    queryFn: async () => {
      if (!organizationId || !user) return null;

      const { data, error } = await supabase
        .from("organization_members")
        .select("role")
        .eq("organization_id", organizationId)
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error; // PGRST116 is "The result contains 0 rows"
      return data?.role || null;
    },
    enabled: !!organizationId && !!user,
  });
}
