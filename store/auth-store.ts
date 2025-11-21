"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Profile } from "../types";

interface AuthState {
  user: Profile | null;
  setUser: (user: Profile | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      isLoading: true,
      setIsLoading: (isLoading) => set({ isLoading }),
      clearAuth: () => set({ user: null, isLoading: false }),
    }),
    {
      name: "auth-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);
