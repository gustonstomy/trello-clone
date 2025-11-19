import { create } from "zustand";
import { Profile } from "../types";

interface AuthState {
  user: Profile | null;
  setUser: (user: Profile | null) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  isLoading: true,
  setIsLoading: (isLoading) => set({ isLoading }),
}));
