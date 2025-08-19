import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { error } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth callback hiba:", error);
          // Vissza a főoldalra hiba esetén
          navigate("/");
          return;
        }

        // Sikeres bejelentkezés után vissza a főoldalra
        navigate("/");
      } catch (error) {
        console.error("Hiba az auth callback során:", error);
        navigate("/");
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
