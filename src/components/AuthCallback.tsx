import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("Processing auth callback...");

        // Hash fragment kezelése OAuth callback után
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth callback hiba:", error);
          // Vissza a főoldalra hiba esetén
          navigate("/", { replace: true });
          return;
        }

        if (data.session) {
          console.log("Session found, user authenticated");
          // Kis késleltetés, hogy az auth context frissülhessen
          setTimeout(() => {
            navigate("/", { replace: true });
          }, 1000);
        } else {
          console.log("No session found");
          navigate("/", { replace: true });
        }
      } catch (error) {
        console.error("Hiba az auth callback során:", error);
        navigate("/", { replace: true });
      }
    };

    handleAuthCallback();
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
