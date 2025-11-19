"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../lib/supabase/client";
import { useAuthStore } from "../store/auth-store";

export function useAuth() {
  const { user, setUser, isLoading, setIsLoading } = useAuthStore();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .single();

          setUser(profile);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Auth error:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        setUser(profile);
      } else {
        setUser(null);
      }

      router.refresh();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, setUser, setIsLoading, router]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push("/auth/login");
  };

  return {
    user,
    isLoading,
    signOut,
  };
}
