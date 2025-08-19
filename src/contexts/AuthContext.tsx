import { createContext, useContext, useEffect, useState } from "react";
import type { User, AuthError } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signInWithGitHub: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Profil létrehozása, ha nem létezik
  const ensureUserProfile = async (user: User) => {
    try {
      console.log("Profil ellenőrzése felhasználónak:", user.id);

      // Ellenőrizzük, hogy létezik-e már a profil
      const { data: existingProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (existingProfile && !fetchError) {
        console.log("Profil már létezik:", existingProfile);
        return existingProfile;
      }

      // Ha nem létezik, létrehozzuk
      console.log("Új profil létrehozása:", user.id);

      const newProfile = {
        id: user.id,
        username: user.email?.split("@")[0] || "user",
        full_name:
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          user.email?.split("@")[0] ||
          "Névtelen felhasználó",
        avatar_url:
          user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
        updated_at: new Date().toISOString(),
      };

      const { data: createdProfile, error: createError } = await supabase
        .from("profiles")
        .insert([newProfile])
        .select()
        .single();

      if (createError) {
        console.error("Profil létrehozási hiba:", createError);
        return null;
      }

      console.log("Profil sikeresen létrehozva:", createdProfile);
      return createdProfile;
    } catch (error) {
      console.error("Profil kezelési hiba:", error);
      return null;
    }
  };

  useEffect(() => {
    // Jelenlegi session lekérése
    supabase.auth.getSession().then(({ data: { session } }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);

      // Ha van felhasználó, ellenőrizzük, hogy létezik-e a profilban
      if (currentUser) {
        ensureUserProfile(currentUser).then((userProfile) => {
          setProfile(userProfile);
          setLoading(false);
        });
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    // Auth változások figyelése
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event, session?.user?.id);

      const currentUser = session?.user ?? null;

      // SIGNED_OUT event esetén azonnal töröljük az állapotot
      if (event === "SIGNED_OUT") {
        console.log("User signed out, clearing state");
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setUser(currentUser);

      // Ha van felhasználó és bejelentkezett
      if (
        currentUser &&
        (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")
      ) {
        console.log("User signed in or token refreshed, ensuring profile");
        const userProfile = await ensureUserProfile(currentUser);
        setProfile(userProfile);
      } else if (!currentUser) {
        console.log("No user, clearing profile");
        setProfile(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          // Session kiterjesztése 1 hétre
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        setLoading(false);
        return { error };
      }

      return { error: null };
    } catch (err) {
      setLoading(false);
      console.error("Google bejelentkezési hiba:", err);
      return { error: err as AuthError };
    }
  };

  const signInWithGitHub = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          // Session kiterjesztése 1 hétre
          queryParams: {
            scope: "read:user user:email",
          },
        },
      });

      if (error) {
        setLoading(false);
        return { error };
      }

      return { error: null };
    } catch (err) {
      setLoading(false);
      console.error("GitHub bejelentkezési hiba:", err);
      return { error: err as AuthError };
    }
  };

  const signOut = async () => {
    console.log("Kijelentkezés kezdeményezése...");
    setLoading(true);

    try {
      // Clear local state immediately
      setUser(null);
      setProfile(null);

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("Supabase kijelentkezési hiba:", error);
      } else {
        console.log("Sikeres kijelentkezés");
      }

      // Clear any local storage data
      localStorage.removeItem("supabase.auth.token");
      sessionStorage.removeItem("supabase.auth.token");

      // Force reload to ensure clean state
      setTimeout(() => {
        window.location.reload();
      }, 100);

      return { error };
    } catch (err) {
      console.error("Kijelentkezési kivétel:", err);

      // Even if error, clear local state and reload
      setUser(null);
      setProfile(null);
      setTimeout(() => {
        window.location.reload();
      }, 100);

      return { error: err as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    profile,
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
