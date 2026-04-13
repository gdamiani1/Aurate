import { create } from "zustand";
import { supabase } from "../lib/supabase";

interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  current_path: string;
  total_aura_points: number;
  peak_aura: number;
  current_streak: number;
  longest_streak: number;
  tier: string;
}

interface AuthState {
  user: any | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  setPath: (path: string) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  signUp: async (email, password, username) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) {
      await supabase.from("profiles").insert({ id: data.user.id, username, display_name: username });
      set({ user: data.user });
      await get().fetchProfile();
    }
  },

  signIn: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    set({ user: data.user });
    await get().fetchProfile();
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },

  fetchProfile: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
    set({ user, profile: data, loading: false });
  },

  setPath: (path) => {
    set((state) => ({ profile: state.profile ? { ...state.profile, current_path: path } : null }));
  },
}));
