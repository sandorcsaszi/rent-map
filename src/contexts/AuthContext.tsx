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
      return (
        import.meta.env.VITE_LOCAL_CALLBACK_URL || "http://localhost:5173/"
      );
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
      console.log("🔍 Profil ellenőrzése felhasználónak:", user.id);

      // Ellenőrizzük, hogy létezik-e már a profil
      console.log("📡 Lekérdezés a profiles táblából...");
      const { data: existingProfile, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      console.log("📊 Profil lekérdezés eredménye:", { 
        hasProfile: !!existingProfile, 
        error: fetchError?.message,
        errorCode: fetchError?.code 
      });

      if (existingProfile && !fetchError) {
        console.log("✅ Profil már létezik:", existingProfile.username);
        return existingProfile;
      }

      // Ha nem létezik, létrehozzuk
      console.log("➕ Új profil létrehozása felhasználónak:", user.id);

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

      console.log("📝 Profil adatok:", newProfile);

      const { data: createdProfile, error: createError } = await supabase
        .from("profiles")
        .insert([newProfile])
        .select()
        .single();

      if (createError) {
        console.error("❌ Profil létrehozási hiba:", createError);
        return null;
      }

      console.log("✅ Profil sikeresen létrehozva:", createdProfile.username);
      return createdProfile;
    } catch (error) {
      console.error("💥 Profil kezelési kivétel:", error);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    // Automatikus session cleanup és inicializálás
    const initSession = async () => {
      try {
        console.log("🔄 InitSession started");

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

        console.log("📡 Getting session from Supabase...");
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        console.log("📊 Session result:", {
          session: !!session,
          error: sessionError,
        });

        if (!mounted) {
          console.log("❌ Component unmounted, aborting");
          return;
        }

        if (sessionError) {
          console.error("Session init error:", sessionError);
          // Ne töröljük automatikusan a session-t, hadd próbálja újra később
          console.log("⏹️ Setting loading false due to session error");
          setLoading(false);
          return;
        }

        const currentUser = session?.user ?? null;
        console.log("👤 Current user:", currentUser?.email || "None");
        setUser(currentUser);

        // Ha van felhasználó, ellenőrizzük, hogy létezik-e a profilban
        if (currentUser) {
          console.log("🔍 Ensuring user profile...");
          const userProfile = await ensureUserProfile(currentUser);
          console.log("📋 Profile result:", userProfile?.username || "Failed");
          if (mounted) {
            setProfile(userProfile);
          }
        } else {
          console.log("❌ No user, clearing profile");
          setProfile(null);
        }

        if (mounted) {
          console.log("✅ InitSession complete, setting loading false");
          setLoading(false);
        }
      } catch (error) {
        console.error("Session initialization error:", error);
        // Ne töröljük automatikusan a session-t, csak logoljuk a hibát
        if (mounted) {
          console.log("⏹️ Setting loading false due to init error");
          setLoading(false);
        }
      }
    };

    initSession();

    // Auth változások figyelése
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("🔄 Auth state change:", event, {
        hasSession: !!session,
        userId: session?.user?.id,
        userEmail: session?.user?.email
      });

      const currentUser = session?.user ?? null;

      // SIGNED_OUT event esetén azonnal töröljük az állapotot
      if (event === "SIGNED_OUT") {
        console.log("👋 User signed out, clearing state");
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      console.log("👤 Setting user:", currentUser?.email || "None");
      setUser(currentUser);

      // Ha van felhasználó és bejelentkezett
      if (
        currentUser &&
        (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")
      ) {
        console.log("✅ User signed in or token refreshed, ensuring profile");
        
        try {
          // Timeout hozzáadása a profil ellenőrzéshez
          const userProfile = await Promise.race([
            ensureUserProfile(currentUser),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error("Profile check timeout")), 10000)
            )
          ]);
          
          console.log("📋 Profile result:", userProfile ? "Success" : "Failed");
          setProfile(userProfile);
        } catch (error) {
          console.error("❌ Profile error:", error);
          setProfile(null);
        }
      } else if (!currentUser) {
        console.log("❌ No user, clearing profile");
        setProfile(null);
      }

      // Itt kell lennie a setLoading(false)-nak!
      console.log("⏹️ Auth state change complete, setting loading false");
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
  
  // Debug log minden useAuth hívásnál
  console.log("🔑 useAuth called:", {
    hasUser: !!context.user,
    userEmail: context.user?.email,
    loading: context.loading,
    hasProfile: !!context.profile
  });
  
  return context;
}
