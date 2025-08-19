import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { FaGoogle, FaGithub } from "react-icons/fa";

export default function LoginModal() {
  const { signInWithGoogle, signInWithGitHub } = useAuth();
  const [loading, setLoading] = useState<"google" | "github" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setLoading("google");
    setError(null);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError("Hiba történt a bejelentkezés során");
    } finally {
      setLoading(null);
    }
  };

  const handleGitHubSignIn = async () => {
    setLoading("github");
    setError(null);
    try {
      const { error } = await signInWithGitHub();
      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError("Hiba történt a bejelentkezés során");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
    >
      {/* Blur háttér */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      ></div>

      {/* Login modal */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "400px",
          padding: "32px",
          borderRadius: "24px",
          border: "1px solid rgba(255, 255, 255, 0.2)",
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.95) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        {/* Logo és cím */}
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-bold mb-3"
            style={{
              color: "#1e293b",
              background: "linear-gradient(135deg, #1e293b 0%, #475569 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Rent Map
          </h1>
          <p className="text-lg" style={{ color: "#64748b" }}>
            Jelentkezz be a folytatáshoz
          </p>
        </div>

        {/* Hiba üzenet */}
        {error && (
          <div
            className="mb-6 p-4 rounded-2xl border"
            style={{
              background:
                "linear-gradient(135deg, rgba(254, 242, 242, 0.9) 0%, rgba(255, 228, 230, 0.9) 100%)",
              borderColor: "rgba(248, 113, 113, 0.3)",
              backdropFilter: "blur(10px)",
            }}
          >
            <p
              style={{ color: "#dc2626", fontSize: "14px", fontWeight: "500" }}
            >
              {error}
            </p>
          </div>
        )}

        {/* Bejelentkezési gombok */}
        <div className="space-y-12 flex flex-col items-center">
          {/* Google bejelentkezés */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loading !== null}
            className="group relative w-64 flex items-center justify-center gap-4 font-semibold py-5 px-8 transition-all duration-150 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #ffffff 100%)",
              border: "2px solid transparent",
              borderRadius: "18px",
              color: "#1f2937",
              boxShadow:
                "0 4px 20px rgba(59, 130, 246, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)",
              backgroundImage:
                "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%), linear-gradient(135deg, #3b82f6, #8b5cf6)",
              backgroundOrigin: "border-box",
              backgroundClip: "padding-box, border-box",
              position: "relative",
              fontSize: "18px",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.boxShadow =
                  "0 8px 30px rgba(59, 130, 246, 0.25), 0 4px 8px rgba(0, 0, 0, 0.15)";
                e.currentTarget.style.transform =
                  "translateY(-2px) scale(1.02)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.boxShadow =
                  "0 4px 20px rgba(59, 130, 246, 0.15), 0 1px 3px rgba(0, 0, 0, 0.1)";
                e.currentTarget.style.transform = "translateY(0) scale(1)";
              }
            }}
          >
            <div className="relative flex items-center gap-4">
              {loading === "google" ? (
                <div
                  className="w-7 h-7 rounded-full animate-spin"
                  style={{
                    background:
                      "conic-gradient(from 0deg, #3b82f6, #8b5cf6, #3b82f6)",
                    padding: "2px",
                  }}
                >
                  <div
                    className="w-full h-full rounded-full"
                    style={{ background: "white" }}
                  ></div>
                </div>
              ) : (
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, #ea4335 0%, #fbbc04 25%, #34a853 50%, #4285f4 100%)",
                    padding: "1px",
                  }}
                >
                  <FaGoogle className="w-5 h-5 text-white" />
                </div>
              )}
              <span className="text-lg font-semibold">Google</span>
            </div>
          </button>

          {/* GitHub bejelentkezés */}
          <button
            onClick={handleGitHubSignIn}
            disabled={loading !== null}
            className="group relative w-64 flex items-center justify-center gap-4 font-semibold py-5 px-8 transition-all duration-150 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, #0f1419 0%, #1c2128 50%, #0f1419 100%)",
              border: "2px solid rgba(139, 92, 246, 0.3)",
              borderRadius: "18px",
              color: "white",
              boxShadow:
                "0 4px 20px rgba(139, 92, 246, 0.2), 0 1px 3px rgba(0, 0, 0, 0.3)",
              fontSize: "18px",
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.currentTarget.style.background =
                  "linear-gradient(135deg, #1c2128 0%, #2d333b 50%, #1c2128 100%)";
                e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.5)";
                e.currentTarget.style.boxShadow =
                  "0 8px 30px rgba(139, 92, 246, 0.3), 0 4px 8px rgba(0, 0, 0, 0.4)";
                e.currentTarget.style.transform =
                  "translateY(-2px) scale(1.02)";
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.currentTarget.style.background =
                  "linear-gradient(135deg, #0f1419 0%, #1c2128 50%, #0f1419 100%)";
                e.currentTarget.style.borderColor = "rgba(139, 92, 246, 0.3)";
                e.currentTarget.style.boxShadow =
                  "0 4px 20px rgba(139, 92, 246, 0.2), 0 1px 3px rgba(0, 0, 0, 0.3)";
                e.currentTarget.style.transform = "translateY(0) scale(1)";
              }
            }}
          >
            <div className="relative flex items-center gap-4">
              {loading === "github" ? (
                <div
                  className="w-7 h-7 rounded-full animate-spin"
                  style={{
                    background:
                      "conic-gradient(from 0deg, #8b5cf6, #3b82f6, #8b5cf6)",
                    padding: "2px",
                  }}
                >
                  <div
                    className="w-full h-full rounded-full"
                    style={{ background: "#1c2128" }}
                  ></div>
                </div>
              ) : (
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
                    padding: "1px",
                  }}
                >
                  <FaGithub className="w-5 h-5 text-white" />
                </div>
              )}
              <span className="text-lg font-semibold">GitHub</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
