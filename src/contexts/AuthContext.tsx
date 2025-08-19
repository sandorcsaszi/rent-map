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

  // Dinamikus redirect URL detektálása környezeti változókból
  const getRedirectUrl = () => {
    const isLocalhost =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    if (isLocalhost) {
      // Local development - főoldal
      return import.meta.env.VITE_LOCAL_CALLBACK_URL || "http://localhost:5173/";
    } else {
      // Production - főoldal
      return (
        import.meta.env.VITE_PRODUCTION_CALLBACK_URL ||
        `${window.location.origin}/`
      );
    }
  };

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
    let mounted = true;

    // Automatikus session cleanup és inicializálás
    const initSession = async () => {
      try {
        // Check for URL parameters that indicate failed auth
        const urlParams = new URLSearchParams(window.location.search);
        const error = urlParams.get("error");
        const errorDescription = urlParams.get("error_description");

        if (error) {
          console.log("Auth error detected in URL:", error, errorDescription);

          // Ne töröljük a session-t URL hibák miatt, csak logoljuk
          console.log("Auth error in URL, but keeping existing session");

          // Clean URL regardless
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname
          );
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (sessionError) {
          console.error("Session init error:", sessionError);
          // Ne töröljük automatikusan a session-t, hadd próbálja újra később
          setLoading(false);
          return;
        }

        const currentUser = session?.user ?? null;
        setUser(currentUser);

        // Ha van felhasználó, ellenőrizzük, hogy létezik-e a profilban
        if (currentUser) {
          const userProfile = await ensureUserProfile(currentUser);
          if (mounted) {
            setProfile(userProfile);
          }
        } else {
          setProfile(null);
        }

        if (mounted) {
          setLoading(false);
        }
      } catch (error) {
        console.error("Session initialization error:", error);
        // Ne töröljük automatikusan a session-t, csak logoljuk a hibát
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initSession();

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

      // Itt kell lennie a setLoading(false)-nak!
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      console.log("Initiating Google sign in...");

      const redirectUrl = getRedirectUrl();
      console.log("Using redirect URL:", redirectUrl);

      // Force account selection and consent every time
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: "offline",
            prompt: "consent select_account", // Force account selection
            include_granted_scopes: "true",
          },
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        console.error("Google OAuth error:", error);
        return { error };
      }

      return { error: null };
    } catch (err) {
      console.error("Google bejelentkezési hiba:", err);
      return { error: err as AuthError };
    }
  };

  const signInWithGitHub = async () => {
    try {
      console.log("Initiating GitHub sign in...");

      const redirectUrl = getRedirectUrl();
      console.log("Using redirect URL:", redirectUrl);

      // GitHub sign in
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            scope: "read:user user:email",
            allow_signup: "true",
          },
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        console.error("GitHub OAuth error:", error);
        return { error };
      }

      return { error: null };
    } catch (err) {
      console.error("GitHub bejelentkezési hiba:", err);
      return { error: err as AuthError };
    }
  };

  const signOut = async () => {
    console.log("Kijelentkezés kezdeményezése...");

    try {
      // Clear local state first
      setUser(null);
      setProfile(null);
      setLoading(true);

      // Sign out from Supabase - csak Supabase session törlése
      const { error } = await supabase.auth.signOut({ scope: "local" });

      if (error) {
        console.error("Supabase kijelentkezési hiba:", error);
      } else {
        console.log("Sikeres kijelentkezés");
      }

      setLoading(false);
      return { error };
    } catch (err) {
      console.error("Kijelentkezési kivétel:", err);

      // Even if error, clear local state
      setUser(null);
      setProfile(null);
      setLoading(false);
      return { error: err as AuthError };
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
