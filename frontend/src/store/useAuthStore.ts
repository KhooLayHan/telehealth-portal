import { create } from "zustand";

interface UserProfile {
  email: string;
  firstName: string;
  publicId: string;
  role: string;
}

interface AuthState {
  isAuthenticated: boolean;
  logout: () => void;
  setAuth: (user: UserProfile) => void;
  user: UserProfile | null;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  setAuth: (user) => set({ isAuthenticated: true, user }),
  logout: () => set({ isAuthenticated: false, user: null }),
}));
