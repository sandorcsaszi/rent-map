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
  const [images, setImages] = useState<string[]>(place?.images || []);
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          newImages.push(result);
          if (newImages.length === files.length) {
            setImages((prev) => [...prev, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  return (
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
          onSave({
            position: position || place!.position,
            title,
            price: "", // Üresen hagyom a kompatibilitás miatt
            description,
            link: link || undefined,
            images: images.length > 0 ? images : undefined,
            rentPrice,
            utilityCost,
            commonCost,
            floor,
            hasElevator,
          });
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
              onChange={(e) => setFloor(parseInt(e.target.value) || undefined)}
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
            flexDirection: "column",
            gap: "min(8px, 1vh)",
          }}
        >
          <label
            style={{
              fontSize: "min(14px, 3.5vw)",
              fontWeight: "600",
              color: colors.secondary,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            📷 Képek feltöltése
          </label>

          <div
            style={{
              position: "relative",
              border: `2px dashed ${colors.lightGray}`,
              borderRadius: "12px",
              padding: "min(16px, 2vh)",
              textAlign: "center",
              background: `linear-gradient(135deg, ${colors.white} 0%, ${colors.background} 100%)`,
              transition: "all 0.2s",
              cursor: "pointer",
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = colors.primary;
              e.currentTarget.style.background = `${colors.primary}10`;
            }}
            onDragLeave={(e) => {
              e.currentTarget.style.borderColor = colors.lightGray;
              e.currentTarget.style.background = `linear-gradient(135deg, ${colors.white} 0%, ${colors.background} 100%)`;
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.style.borderColor = colors.lightGray;
              e.currentTarget.style.background = `linear-gradient(135deg, ${colors.white} 0%, ${colors.background} 100%)`;

              const files = e.dataTransfer.files;
              if (files.length > 0) {
                const event = { target: { files } } as any;
                handleImageUpload(event);
              }
            }}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              style={{
                position: "absolute",
                top: "0",
                left: "0",
                width: "100%",
                height: "100%",
                opacity: "0",
                cursor: "pointer",
              }}
            />
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "8px",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "20px",
                  color: colors.white,
                }}
              >
                📷
              </div>
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: colors.secondary,
                }}
              >
                Kattints vagy húzd ide a képeket
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: colors.gray,
                }}
              >
                Támogatott formátumok: JPG, PNG, GIF
              </div>
            </div>
          </div>

          {images.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
                gap: "12px",
                marginTop: "8px",
                padding: "12px",
                background: `${colors.background}50`,
                borderRadius: "12px",
                border: `1px solid ${colors.lightGray}`,
              }}
            >
              {images.map((image, index) => (
                <div
                  key={index}
                  style={{
                    position: "relative",
                    borderRadius: "8px",
                    overflow: "hidden",
                    boxShadow: `0 2px 8px ${colors.primary}15`,
                    transition: "transform 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  <img
                    src={image}
                    alt={`Kép ${index + 1}`}
                    style={{
                      width: "100%",
                      height: "90px",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    style={{
                      position: "absolute",
                      top: "4px",
                      right: "4px",
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: `${colors.danger}dd`,
                      color: colors.white,
                      border: "none",
                      fontSize: "12px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backdropFilter: "blur(4px)",
                      transition: "all 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      const target = e.target as HTMLButtonElement;
                      target.style.background = colors.danger;
                      target.style.transform = "scale(1.1)";
                    }}
                    onMouseLeave={(e) => {
                      const target = e.target as HTMLButtonElement;
                      target.style.background = `${colors.danger}dd`;
                      target.style.transform = "scale(1)";
                    }}
                  >
                    ✕
                  </button>
                  <div
                    style={{
                      position: "absolute",
                      bottom: "0",
                      left: "0",
                      right: "0",
                      background:
                        "linear-gradient(transparent, rgba(0,0,0,0.6))",
                      color: colors.white,
                      fontSize: "10px",
                      padding: "4px",
                      textAlign: "center",
                    }}
                  >
                    Kép {index + 1}
                  </div>
                </div>
              ))}
            </div>
          )}
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
  );
}
