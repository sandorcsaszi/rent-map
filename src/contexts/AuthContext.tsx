import { createContext, useContext, useEffect, useState } from "react";
import type { User, AuthError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthContextType {
  user: User | null;
  session: any | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signInWithGitHub: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Jelenlegi session lekérése
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Ha van felhasználó, ellenőrizzük, hogy létezik-e a profilban
      if (session?.user) {
        ensureUserProfile(session.user);
      }

      setLoading(false);
    });

    // Auth változások figyelése
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      // Ha van felhasználó, ellenőrizzük, hogy létezik-e a profilban
      if (session?.user) {
        await ensureUserProfile(session.user);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Profil létrehozása, ha nem létezik
  const ensureUserProfile = async (user: User) => {
    try {
      // Ellenőrizzük, hogy létezik-e már a profil
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .single();

      // Ha nem létezik, létrehozzuk
      if (!existingProfile) {
        const { error } = await supabase.from("profiles").insert([
          {
            id: user.id,
            email: user.email,
            full_name:
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split("@")[0],
            avatar_url:
              user.user_metadata?.avatar_url || user.user_metadata?.picture,
            updated_at: new Date().toISOString(),
          },
        ]);

        if (error) {
          console.error("Hiba a profil létrehozásakor:", error);
        } else {
          console.log("Profil sikeresen létrehozva:", user.id);
        }
      }
    } catch (error) {
      console.error("Hiba a profil ellenőrzésekor:", error);
    }
  };

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  };

  const signInWithGitHub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signInWithGoogle,
    signInWithGitHub,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth csak AuthProvider-en belül használható");
  }
  return context;
}
