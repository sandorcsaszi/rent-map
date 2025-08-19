import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Hash fragment alapú token kezelés
        if (window.location.hash) {
          const hashParams = new URLSearchParams(
            window.location.hash.substring(1)
          );
          const accessToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");

          if (accessToken) {
            // Supabase session beállítása a token-ekkel
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || "",
            });

            if (error) {
              console.error("❌ Session beállítási hiba:", error);
              navigate("/", { replace: true });
              return;
            }

            navigate("/", { replace: true });
            return;
          }
        }

        // Check for OAuth errors in URL first
        const urlParams = new URLSearchParams(window.location.search);
        const urlHash = new URLSearchParams(window.location.hash.substring(1));
        const error = urlParams.get("error") || urlHash.get("error");
        const errorDescription =
          urlParams.get("error_description") ||
          urlHash.get("error_description");

        if (error) {
          console.error("❌ OAuth error in callback:", error, errorDescription);
          // Redirect back to home page on error
          navigate("/", { replace: true });
          return;
        }

        // Fallback: Try to get the session
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          console.error("❌ Session error in callback:", sessionError);
          navigate("/", { replace: true });
          return;
        }

        if (sessionData.session && sessionData.session.user) {
          // Wait for the auth context to update
          setTimeout(() => {
            navigate("/", { replace: true });
          }, 1000);
        } else {
          navigate("/", { replace: true });
        }
      } catch (error) {
        console.error("❌ Exception in auth callback:", error);
        navigate("/", { replace: true });
      }
    };

    // Process callback after a short delay
    const timer = setTimeout(handleAuthCallback, 800);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600 text-lg">Bejelentkezés feldolgozása...</p>
        <p className="text-gray-400 text-sm mt-2">Kérjük várjon...</p>
      </div>
    </div>
  );
}
