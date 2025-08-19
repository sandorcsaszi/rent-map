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
        
        // First, try to get the session from the URL hash/query
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("Session error:", sessionError);
          navigate("/", { replace: true });
          return;
        }

        if (sessionData.session && sessionData.session.user) {
          console.log("Session found, user authenticated:", sessionData.session.user.id);
          console.log("Access token:", sessionData.session.access_token ? "Present" : "Missing");
          
          // Wait a bit longer for the auth context to update
          setTimeout(() => {
            navigate("/", { replace: true });
          }, 1500);
        } else {
          console.log("No session found in callback, checking for user directly...");
          
          // Fallback: try to get user directly
          const { data: userData, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.error("User fetch error:", userError);
            navigate("/", { replace: true });
            return;
          }
          
          if (userData.user) {
            console.log("User found directly:", userData.user.id);
            setTimeout(() => {
              navigate("/", { replace: true });
            }, 1500);
          } else {
            console.log("No user found, redirecting to home");
            navigate("/", { replace: true });
          }
        }
      } catch (error) {
        console.error("Hiba az auth callback során:", error);
        navigate("/", { replace: true });
      }
    };

    // Longer delay to ensure all auth processing is complete
    const timer = setTimeout(handleAuthCallback, 1000);

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
