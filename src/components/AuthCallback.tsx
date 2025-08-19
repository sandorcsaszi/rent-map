import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("Processing auth callback...");
        
        // Exchange the code for a session
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error("Auth callback hiba:", error);
          navigate("/", { replace: true });
          return;
        }

        if (data.user) {
          console.log("User authenticated successfully:", data.user.id);
          // Redirect to home page
          navigate("/", { replace: true });
        } else {
          console.log("No user found after callback");
          navigate("/", { replace: true });
        }
      } catch (error) {
        console.error("Hiba az auth callback során:", error);
        navigate("/", { replace: true });
      }
    };

    // Small delay to ensure URL parameters are processed
    const timer = setTimeout(handleAuthCallback, 500);
    
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
