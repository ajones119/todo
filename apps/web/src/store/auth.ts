import { create } from "zustand";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/api/root";

type AuthState = {
  user: User | null;
  loading: boolean;
  error: string | null;
  init: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, _get) => ({
  user: null,
  loading: false,
  error: null,

  init: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Supabase getUser error", error);
        set({ user: null, error: error.message });
        return;
      }
      set({ user: data.user ?? null, error: null });
      
      // Set up auth state listener to keep store in sync with Supabase
      // This handles token refresh, logout, etc.
      supabase.auth.onAuthStateChange((_event, session) => {
        set({ user: session?.user ?? null });
      });
    } finally {
      set({ loading: false });
    }
  },

  loginWithEmail: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        set({ error: error.message });
        return;
      }
      set({ user: data.user ?? null, error: null });
    } finally {
      set({ loading: false });
    }
  },

  signUpWithEmail: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) {
        set({ error: error.message });
        return;
      }
      set({ user: data.user ?? null, error: null });
    } finally {
      set({ loading: false });
    }
  },

  signInWithGoogle: async () => {
    set({ loading: true, error: null });
    try {
      const redirectTo = import.meta.env.VITE_CLIENT_URL as string | undefined;
      console.log("redirectTo", redirectTo);
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Google sign-in failed";
      set({ error: message });
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        set({ error: error.message });
        return;
      }
      set({ user: null, error: null });
    } finally {
      set({ loading: false });
    }
  },
}));


