import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("Processing auth callback...");
        console.log("Current URL:", window.location.href);

        // Check for OAuth errors in URL first
        const urlParams = new URLSearchParams(window.location.search);
        const urlHash = new URLSearchParams(window.location.hash.substring(1));
        const error = urlParams.get("error") || urlHash.get("error");
        const errorDescription =
          urlParams.get("error_description") ||
          urlHash.get("error_description");

        if (error) {
          console.error("OAuth error in callback:", error, errorDescription);
          // Redirect back to home page on error
          navigate("/", { replace: true });
          return;
        }

        // Try to get the session
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          console.error("Session error in callback:", sessionError);
          navigate("/", { replace: true });
          return;
        }

        if (sessionData.session && sessionData.session.user) {
          console.log(
            "Session found, user authenticated:",
            sessionData.session.user.id
          );

          // Wait for the auth context to update
          setTimeout(() => {
            navigate("/", { replace: true });
          }, 1000);
        } else {
          console.log("No session found in callback, redirecting to home");
          navigate("/", { replace: true });
        }
      } catch (error) {
        console.error("Exception in auth callback:", error);
        navigate("/", { replace: true });
      }
    };

    // Process callback after a short delay
    const timer = setTimeout(handleAuthCallback, 800);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Bejelentkezés feldolgozása...</p>
      </div>
    </div>
  );
}
