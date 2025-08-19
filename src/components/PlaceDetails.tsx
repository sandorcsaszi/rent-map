import type { Place } from "../types/Place";

interface PlaceDetailsProps {
  place: Place;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

// Blue-white theme colors - matching Sidebar and PlaceForm
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

export default function PlaceDetails({
  place,
  onClose,
  onEdit,
  onDelete,
}: PlaceDetailsProps) {
  return (
    <div
      style={{
        position: "absolute",
        right: "420px",
        top: "32px",
        zIndex: 1100,
        width: "380px",
        maxWidth: "calc(100vw - 440px)",
        borderRadius: "20px",
        background: `linear-gradient(135deg, ${colors.white} 0%, ${colors.background} 50%, ${colors.white} 100%)`,
        padding: "32px",
        boxShadow: `0 20px 40px ${colors.primary}20, 0 8px 24px ${colors.primary}15`,
        border: `3px solid ${colors.primary}40`,
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <button
        style={{
          position: "absolute",
          top: "16px",
          right: "16px",
          background: "none",
          border: "none",
          color: colors.primary,
          fontSize: "20px",
          fontWeight: "bold",
          cursor: "pointer",
          padding: "4px",
          borderRadius: "8px",
          transition: "all 0.2s",
        }}
        onClick={onClose}
        onMouseEnter={(e) => {
          const target = e.target as HTMLButtonElement;
          target.style.color = colors.danger;
          target.style.backgroundColor = `${colors.danger}15`;
        }}
        onMouseLeave={(e) => {
          const target = e.target as HTMLButtonElement;
          target.style.color = colors.primary;
          target.style.backgroundColor = "transparent";
        }}
        aria-label="Bezárás"
      >
        ❌
      </button>

      <h2
        style={{
          fontSize: "28px",
          fontWeight: "800",
          marginBottom: "8px",
          color: colors.secondary,
          borderBottom: `2px solid ${colors.primary}`,
          paddingBottom: "8px",
        }}
      >
        {place.title}
      </h2>

      {/* Részletes költségek megjelenítése */}
      {(place.rentPrice || place.utilityCost || place.commonCost) && (
        <div
          style={{
            marginBottom: "12px",
            padding: "12px",
            backgroundColor: colors.background,
            borderRadius: "8px",
            border: `1px solid ${colors.lightGray}`,
          }}
        >
          <div
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: colors.secondary,
              marginBottom: "8px",
            }}
          >
            📊 Költségek részletesen:
          </div>
          <div style={{ fontSize: "13px", color: colors.gray }}>
            {place.rentPrice && (
              <div style={{ marginBottom: "2px" }}>
                🏠 Bérleti díj:{" "}
                <strong>
                  {(place.rentPrice / 1000).toFixed(1)} ezer Ft/hó
                </strong>
              </div>
            )}
            {place.utilityCost && (
              <div style={{ marginBottom: "2px" }}>
                ⚡ Rezsi:{" "}
                <strong>
                  {(place.utilityCost / 1000).toFixed(0)} ezer Ft/hó
                </strong>
              </div>
            )}
            {place.commonCost && (
              <div style={{ marginBottom: "2px" }}>
                🏢 Közös költség:{" "}
                <strong>
                  {(place.commonCost / 1000).toFixed(0)} ezer Ft/hó
                </strong>
              </div>
            )}
            <hr
              style={{
                margin: "6px 0",
                border: `1px solid ${colors.lightGray}`,
              }}
            />
            <div style={{ fontWeight: "600", color: colors.secondary }}>
              💰 Összesen:{" "}
              <strong>
                {(
                  ((place.rentPrice || 0) +
                    (place.utilityCost || 0) +
                    (place.commonCost || 0)) /
                  1000
                ).toFixed(0)}{" "}
                ezer Ft/hó
              </strong>
            </div>
          </div>
        </div>
      )}

      {/* Ingatlan részletek */}
      {(place.floor !== undefined || place.hasElevator !== undefined) && (
        <div
          style={{
            marginBottom: "12px",
            padding: "12px",
            backgroundColor: colors.background,
            borderRadius: "8px",
            border: `1px solid ${colors.lightGray}`,
          }}
        >
          <div
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: colors.secondary,
              marginBottom: "8px",
            }}
          >
            🏢 Ingatlan adatok:
          </div>
          <div style={{ fontSize: "13px", color: colors.gray }}>
            {place.floor !== undefined && (
              <div style={{ marginBottom: "2px" }}>
                📍 Emelet: <strong>{place.floor}. emelet</strong>
              </div>
            )}
            {place.hasElevator !== undefined && (
              <div style={{ marginBottom: "2px" }}>
                🛗 Lift:{" "}
                <strong
                  style={{
                    color: place.hasElevator ? colors.success : colors.danger,
                  }}
                >
                  {place.hasElevator
                    ? "Van lift az épületben"
                    : "Nincs lift az épületben"}
                </strong>
              </div>
            )}
          </div>
        </div>
      )}

      <div
        style={{
          marginBottom: "12px",
          color: colors.gray,
          whiteSpace: "pre-line",
          fontSize: "16px",
          lineHeight: "1.5",
        }}
      >
        {place.description}
      </div>

      {place.link && (
        <div style={{ marginBottom: "12px" }}>
          <a
            href={
              place.link.startsWith("http://") ||
              place.link.startsWith("https://")
                ? place.link
                : `https://${place.link}`
            }
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              color: colors.primary,
              textDecoration: "none",
              fontSize: "14px",
              fontWeight: "600",
              padding: "8px 12px",
              border: `2px solid ${colors.primary}`,
              borderRadius: "8px",
              background: `${colors.primary}10`,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              const target = e.target as HTMLAnchorElement;
              target.style.background = colors.primary;
              target.style.color = colors.white;
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLAnchorElement;
              target.style.background = `${colors.primary}10`;
              target.style.color = colors.primary;
            }}
          >
            🔗 Weboldal megtekintése
          </a>
        </div>
      )}

      {place.images && place.images.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <h4
            style={{
              fontSize: "14px",
              fontWeight: "600",
              color: colors.secondary,
              marginBottom: "8px",
              margin: "0 0 8px 0",
            }}
          >
            📷 Képek ({place.images.length})
          </h4>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
              gap: "8px",
            }}
          >
            {place.images.map((image, index) => (
              <img
                key={index}
                src={image}
                alt={`${place.title} - Kép ${index + 1}`}
                style={{
                  width: "100%",
                  height: "100px",
                  objectFit: "cover",
                  borderRadius: "8px",
                  border: `1px solid ${colors.lightGray}`,
                  cursor: "pointer",
                  transition: "transform 0.2s",
                }}
                onClick={() => {
                  // Kép nagyítás modal - egyszerű megoldás
                  const modal = window.open("", "_blank");
                  if (modal) {
                    modal.document.write(`
                      <html>
                        <head><title>${place.title} - Kép ${
                      index + 1
                    }</title></head>
                        <body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh;">
                          <img src="${image}" style="max-width:100%;max-height:100%;object-fit:contain;" />
                        </body>
                      </html>
                    `);
                  }
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div
        style={{
          fontSize: "12px",
          color: colors.gray,
          marginBottom: "8px",
        }}
      >
        📅 Létrehozva: {place.createdAt}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginTop: "8px",
        }}
      >
        <div
          style={{
            fontSize: "12px",
            color: colors.gray,
          }}
        >
          📍 Koordináták: {(place.position?.[0] || place.lat).toFixed(5)},{" "}
          {(place.position?.[1] || place.lng).toFixed(5)}
        </div>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: "8px",
          }}
        >
          <button
            style={{
              background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
              color: colors.white,
              padding: "10px 16px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: "600",
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: `0 4px 12px ${colors.primary}30`,
            }}
            onClick={onEdit}
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
            ✏️ Szerkesztés
          </button>

          <button
            style={{
              background: `linear-gradient(135deg, ${colors.danger} 0%, #dc2626 100%)`,
              color: colors.white,
              padding: "10px 16px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: "600",
              border: "none",
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: `0 4px 12px ${colors.danger}30`,
            }}
            onClick={onDelete}
            onMouseEnter={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.transform = "translateY(-2px)";
              target.style.boxShadow = `0 6px 20px ${colors.danger}40`;
            }}
            onMouseLeave={(e) => {
              const target = e.target as HTMLButtonElement;
              target.style.transform = "translateY(0)";
              target.style.boxShadow = `0 4px 12px ${colors.danger}30`;
            }}
          >
            🗑️ Törlés
          </button>
        </div>
      </div>
    </div>
  );
}
