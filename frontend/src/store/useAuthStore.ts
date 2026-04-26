import { create } from "zustand";

interface UserProfile {
  email: string;
  firstName: string;
  publicId: string;
  role: string;
  avatarUrl: string | null;
}

interface AuthState {
  isAuthenticated: boolean;
  logout: () => void;
  setAuth: (user: UserProfile) => void;
  updateAvatarUrl: (url: string) => void;
  user: UserProfile | null;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  setAuth: (user) => set({ isAuthenticated: true, user }),
  updateAvatarUrl: (url) =>
    set((state) => ({
      user: state.user ? { ...state.user, avatarUrl: url } : null,
    })),
  logout: () => set({ isAuthenticated: false, user: null }),
}));
