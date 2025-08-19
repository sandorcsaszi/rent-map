import { useState } from "react";
import type { Place } from "../types/Place";

interface PlaceFormProps {
  place?: Place;
  position?: [number, number];
  onSave: (place: Omit<Place, "id" | "createdAt">) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

// Blue-white theme colors - matching Sidebar
const colors = {
  primary: "#3b82f6",
  secondary: "#1e40af",
  background: "#f1f5f9",
  white: "#ffffff",
  gray: "#6b7280",
  lightGray: "#e5e7eb",
  success: "#10b981",
  danger: "#ef4444",
};

export default function PlaceForm({
  place,
  position,
  onSave,
  onCancel,
  isEditing = false,
}: PlaceFormProps) {
  const [title, setTitle] = useState(place?.title || "");
  const [description, setDescription] = useState(place?.description || "");
  const [link, setLink] = useState(place?.link || "");
  const [rentPrice, setRentPrice] = useState<number | undefined>(
    place?.rentPrice
  );
  const [utilityCost, setUtilityCost] = useState<number | undefined>(
    place?.utilityCost
  );
  const [commonCost, setCommonCost] = useState<number | undefined>(
    place?.commonCost
  );
  const [floor, setFloor] = useState<number | undefined>(place?.floor);
  const [hasElevator, setHasElevator] = useState<boolean | undefined>(
    place?.hasElevator
  );

  return (
    <>
      {/* Background overlay */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 1099,
          animation: "fadeIn 0.3s ease-out",
        }}
        onClick={onCancel}
        data-testid="place-form-overlay"
      />

      <div
        style={{
          position: "fixed",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 1100,
          width: "min(360px, calc(100vw - 40px))",
          maxHeight: "calc(100vh - 80px)",
          borderRadius: "16px",
          background: `linear-gradient(135deg, ${colors.white} 0%, ${colors.background} 50%, ${colors.white} 100%)`,
          padding: "min(24px, 3vh)",
          boxShadow: `0 20px 40px ${colors.primary}20, 0 8px 24px ${colors.primary}15`,
          border: `3px solid ${colors.primary}40`,
          animation: "fadeIn 0.3s ease-out",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            fontSize: "min(20px, 4.5vw)",
            fontWeight: "800",
            marginBottom: "min(16px, 2vh)",
            color: colors.secondary,
            textAlign: "center",
            borderBottom: `2px solid ${colors.primary}`,
            paddingBottom: "min(8px, 1vh)",
          }}
        >
          {isEditing ? "✏️ Hely szerkesztése" : "📍 Új hely hozzáadása"}
        </h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            console.log("Form submitted with data:", {
              title,
              description,
              rentPrice,
              utilityCost,
              commonCost,
              floor,
              hasElevator,
              link,
            });

            try {
              if (!title || title.trim() === "") {
                alert("A név/címke mező kitöltése kötelező!");
                return;
              }

              const pos = position ||
                place!.position || [place!.lat, place!.lng];
              const formData = {
                user_id: place?.user_id || "",
                name: title.trim(),
                title: title.trim(),
                description: description.trim(),
                address: place?.address || "",
                lat: pos[0],
                lng: pos[1],
                rent_price: rentPrice || 0,
                utility_cost: utilityCost || 0,
                common_cost: commonCost || 0,
                floor: floor,
                hasElevator: hasElevator,
                link: link?.trim() || undefined,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                // Kompatibilitási mezők
                position: pos,
                price: "",
                rentPrice: rentPrice || 0,
                utilityCost: utilityCost || 0,
                commonCost: commonCost || 0,
              };

              console.log("Calling onSave with:", formData);
              onSave(formData);
            } catch (error) {
              console.error("Error in form submission:", error);
            }
          }}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "min(12px, 1.5vh)",
          }}
        >
          <input
            style={{
              width: "100%",
              boxSizing: "border-box",
              borderRadius: "12px",
              background: `linear-gradient(135deg, ${colors.white} 0%, ${colors.background} 100%)`,
              border: `2px solid ${colors.lightGray}`,
              padding: "min(12px, 1.5vh) min(14px, 2vw)",
              fontSize: "min(16px, 4vw)",
              outline: "none",
              transition: "all 0.2s",
              color: colors.secondary,
            }}
            placeholder="Név / címke"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onFocus={(e) => {
              e.target.style.borderColor = colors.primary;
              e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = colors.lightGray;
              e.target.style.boxShadow = "none";
            }}
            required
          />

          <textarea
            style={{
              width: "100%",
              boxSizing: "border-box",
              borderRadius: "12px",
              background: `linear-gradient(135deg, ${colors.white} 0%, ${colors.background} 100%)`,
              border: `2px solid ${colors.lightGray}`,
              padding: "min(12px, 1.5vh) min(14px, 2vw)",
              fontSize: "min(16px, 4vw)",
              outline: "none",
              transition: "all 0.2s",
              color: colors.secondary,
              minHeight: "min(80px, 10vh)",
              resize: "none",
            }}
            placeholder="Leírás"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onFocus={(e) => {
              e.target.style.borderColor = colors.primary;
              e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = colors.lightGray;
              e.target.style.boxShadow = "none";
            }}
          />

          <input
            style={{
              width: "100%",
              boxSizing: "border-box",
              borderRadius: "12px",
              background: `linear-gradient(135deg, ${colors.white} 0%, ${colors.background} 100%)`,
              border: `2px solid ${colors.lightGray}`,
              padding: "min(12px, 1.5vh) min(14px, 2vw)",
              fontSize: "min(16px, 4vw)",
              outline: "none",
              transition: "all 0.2s",
              color: colors.secondary,
            }}
            placeholder="🔗 Link (weboldal URL)"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            onFocus={(e) => {
              e.target.style.borderColor = colors.primary;
              e.target.style.boxShadow = `0 0 0 3px ${colors.primary}20`;
            }}
            onBlur={(e) => {
              e.target.style.borderColor = colors.lightGray;
              e.target.style.boxShadow = "none";
            }}
          />

          {/* Részletes költségek */}
          <div
            style={{
              backgroundColor: colors.background,
              padding: "min(12px, 1.5vh)",
              borderRadius: "12px",
              border: `2px solid ${colors.lightGray}`,
            }}
          >
            <h4
              style={{
                margin: "0 0 min(12px, 1.5vh) 0",
                fontSize: "min(14px, 3.5vw)",
                fontWeight: "600",
                color: colors.secondary,
              }}
            >
              💰 Részletes költségek
            </h4>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "min(8px, 1vh)",
              }}
            >
              <input
                type="number"
                step="1"
                placeholder="Bérleti díj (Ft/hó)"
                value={rentPrice ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setRentPrice(value ? parseInt(value) : undefined);
                }}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  borderRadius: "8px",
                  background: colors.white,
                  border: `2px solid ${colors.lightGray}`,
                  padding: "min(8px, 1vh) min(10px, 1.5vw)",
                  fontSize: "min(14px, 3.5vw)",
                  outline: "none",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.lightGray;
                }}
              />

              <input
                type="number"
                step="1"
                placeholder="Rezsi költség (Ft/hó)"
                value={utilityCost ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setUtilityCost(value ? parseInt(value) : undefined);
                }}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  borderRadius: "8px",
                  background: colors.white,
                  border: `2px solid ${colors.lightGray}`,
                  padding: "min(8px, 1vh) min(10px, 1.5vw)",
                  fontSize: "min(14px, 3.5vw)",
                  outline: "none",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.lightGray;
                }}
              />

              <input
                type="number"
                step="1"
                placeholder="Közös költség (Ft/hó)"
                value={commonCost ?? ""}
                onChange={(e) => {
                  const value = e.target.value;
                  setCommonCost(value ? parseInt(value) : undefined);
                }}
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  borderRadius: "8px",
                  background: colors.white,
                  border: `2px solid ${colors.lightGray}`,
                  padding: "min(8px, 1vh) min(10px, 1.5vw)",
                  fontSize: "min(14px, 3.5vw)",
                  outline: "none",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.lightGray;
                }}
              />
            </div>
          </div>

          {/* Ingatlan részletek */}
          <div
            style={{
              backgroundColor: colors.background,
              padding: "min(12px, 1.5vh)",
              borderRadius: "12px",
              border: `2px solid ${colors.lightGray}`,
            }}
          >
            <h4
              style={{
                margin: "0 0 min(12px, 1.5vh) 0",
                fontSize: "min(14px, 3.5vw)",
                fontWeight: "600",
                color: colors.secondary,
              }}
            >
              🏢 Ingatlan részletek
            </h4>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "min(8px, 1vh)",
              }}
            >
              <input
                type="number"
                placeholder="Emelet (pl: 3)"
                value={floor || ""}
                onChange={(e) =>
                  setFloor(parseInt(e.target.value) || undefined)
                }
                style={{
                  width: "100%",
                  boxSizing: "border-box",
                  borderRadius: "8px",
                  background: colors.white,
                  border: `2px solid ${colors.lightGray}`,
                  padding: "min(8px, 1vh) min(10px, 1.5vw)",
                  fontSize: "min(14px, 3.5vw)",
                  outline: "none",
                  transition: "all 0.2s",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = colors.primary;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = colors.lightGray;
                }}
              />

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => setHasElevator(true)}
                  style={{
                    flex: 1,
                    padding: "min(8px, 1vh)",
                    border: `2px solid ${
                      hasElevator === true ? colors.success : colors.lightGray
                    }`,
                    borderRadius: "8px",
                    fontSize: "min(13px, 3vw)",
                    backgroundColor:
                      hasElevator === true ? colors.success : colors.white,
                    color: hasElevator === true ? colors.white : colors.gray,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    fontWeight: "600",
                  }}
                >
                  🛗 Van lift
                </button>
                <button
                  type="button"
                  onClick={() => setHasElevator(false)}
                  style={{
                    flex: 1,
                    padding: "min(8px, 1vh)",
                    border: `2px solid ${
                      hasElevator === false ? colors.danger : colors.lightGray
                    }`,
                    borderRadius: "8px",
                    fontSize: "min(13px, 3vw)",
                    backgroundColor:
                      hasElevator === false ? colors.danger : colors.white,
                    color: hasElevator === false ? colors.white : colors.gray,
                    cursor: "pointer",
                    transition: "all 0.2s",
                    fontWeight: "600",
                  }}
                >
                  🚫 Nincs lift
                </button>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "min(8px, 1vw)",
              marginTop: "min(8px, 1vh)",
            }}
          >
            <button
              type="submit"
              style={{
                flex: 1,
                background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                color: colors.white,
                padding: "min(10px, 1.5vh) min(16px, 2vw)",
                borderRadius: "12px",
                fontSize: "min(16px, 4vw)",
                fontWeight: "600",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
                boxShadow: `0 4px 12px ${colors.primary}30`,
              }}
              onMouseEnter={(e) => {
                const target = e.target as HTMLButtonElement;
                target.style.transform = "translateY(-2px)";
                target.style.boxShadow = `0 6px 20px ${colors.primary}40`;
              }}
              onMouseLeave={(e) => {
                const target = e.target as HTMLButtonElement;
                target.style.transform = "translateY(0)";
                target.style.boxShadow = `0 4px 12px ${colors.primary}30`;
              }}
            >
              {isEditing ? "💾 Mentés" : "✅ Hozzáadás"}
            </button>

            <button
              type="button"
              style={{
                background: `linear-gradient(135deg, ${colors.lightGray} 0%, #d1d5db 100%)`,
                color: colors.gray,
                padding: "min(10px, 1.5vh) min(16px, 2vw)",
                borderRadius: "12px",
                fontSize: "min(16px, 4vw)",
                fontWeight: "600",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onClick={onCancel}
              onMouseEnter={(e) => {
                const target = e.target as HTMLButtonElement;
                target.style.background = `linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)`;
                target.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                const target = e.target as HTMLButtonElement;
                target.style.background = `linear-gradient(135deg, ${colors.lightGray} 0%, #d1d5db 100%)`;
                target.style.transform = "translateY(0)";
              }}
            >
              ❌ Mégse
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
