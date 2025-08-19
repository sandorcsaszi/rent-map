import { useState, useEffect, useRef } from "react";
import { FaSignOutAlt, FaUser } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";
import type { Place, PlaceFormData, FilterCriteria } from "../types/Place";
import {
  geocodeAddress,
  searchAddresses,
  type AddressSuggestion,
} from "../utils/geocoding";

interface SidebarProps {
  places: Place[];
  selectedPlace: Place | null;
  onSelectPlace: (place: Place) => void;
  onAddPlace: (place: Omit<Place, "id">) => void;
  onUpdatePlace: (place: Place) => void;
  onDeletePlace: (id: number) => void;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  filters: FilterCriteria;
  onFiltersChange: (filters: FilterCriteria) => void;
}

// Blue-white theme colors
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

// Address Autocomplete Component
function AddressAutocomplete({
  value,
  onChange,
  onSelect,
}: {
  value: string;
  onChange: (value: string) => void;
  onSelect: (address: string) => void;
}) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cacheRef = useRef<Map<string, AddressSuggestion[]>>(new Map());
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Clear previous timeout and abort controller
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (value.length >= 2) {
      // Check cache first
      if (cacheRef.current.has(value)) {
        const cachedResults = cacheRef.current.get(value)!;
        setSuggestions(cachedResults);
        setShowSuggestions(true);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      timeoutRef.current = setTimeout(async () => {
        try {
          abortControllerRef.current = new AbortController();
          const results = await searchAddresses(
            value,
            abortControllerRef.current.signal
          );

          // Cache the results
          cacheRef.current.set(value, results);

          // Limit cache size to prevent memory issues
          if (cacheRef.current.size > 50) {
            const firstKey = cacheRef.current.keys().next().value;
            if (firstKey) {
              cacheRef.current.delete(firstKey);
            }
          }

          setSuggestions(results);
          setShowSuggestions(true);
        } catch (error) {
          if (error instanceof Error && error.message === "AbortError") {
            // Request was aborted, ignore
            return;
          }
          console.error("Address search failed:", error);
          setSuggestions([]);
        } finally {
          setIsLoading(false);
        }
      }, 150); // Reduced timeout for faster response
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setIsLoading(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [value]);

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    onSelect(suggestion.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
    setIsLoading(false);
  };

  const handleInputChange = (newValue: string) => {
    onChange(newValue);
    if (newValue.length < 2) {
      setShowSuggestions(false);
      setSuggestions([]);
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
      <input
        type="text"
        placeholder="Cím * - 2 betű után automatikus javaslat..."
        value={value}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={(e) => {
          e.target.style.borderColor = colors.primary;
          if (suggestions.length > 0) {
            setShowSuggestions(true);
          }
        }}
        onBlur={(e) => {
          e.target.style.borderColor = colors.lightGray;
          // Delay hiding suggestions to allow clicks
          setTimeout(() => setShowSuggestions(false), 150);
        }}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "12px",
          paddingRight: isLoading ? "40px" : "12px",
          border: `2px solid ${colors.lightGray}`,
          borderRadius: "8px",
          fontSize: "14px",
          outline: "none",
          background: colors.white,
          transition: "border-color 0.15s ease",
        }}
        required
      />

      {isLoading && (
        <div
          style={{
            position: "absolute",
            right: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            color: colors.primary,
            fontSize: "12px",
            fontWeight: "500",
            animation: "pulse 1.5s ease-in-out infinite",
          }}
        >
          🔄
        </div>
      )}

      {showSuggestions && suggestions.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            backgroundColor: colors.white,
            border: `2px solid ${colors.primary}`,
            borderTop: "none",
            borderRadius: "0 0 8px 8px",
            maxHeight: "180px",
            overflowY: "auto",
            zIndex: 1000,
            boxShadow: "0 4px 12px rgba(59, 130, 246, 0.15)",
          }}
        >
          {suggestions.slice(0, 6).map((suggestion, index) => (
            <div
              key={suggestion.place_id || index}
              onClick={() => handleSelectSuggestion(suggestion)}
              style={{
                padding: "10px 12px",
                cursor: "pointer",
                borderBottom:
                  index < Math.min(suggestions.length - 1, 5)
                    ? `1px solid ${colors.lightGray}`
                    : "none",
                fontSize: "13px",
                lineHeight: "1.4",
                transition: "all 0.15s ease",
                color: colors.secondary,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = colors.background;
                e.currentTarget.style.paddingLeft = "16px";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colors.white;
                e.currentTarget.style.paddingLeft = "12px";
              }}
            >
              📍 {suggestion.display_name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Search Component
function SearchBar({
  searchTerm,
  onSearchChange,
}: {
  searchTerm: string;
  onSearchChange: (term: string) => void;
}) {
  return (
    <div style={{ position: "relative", marginBottom: "20px" }}>
      <input
        type="text"
        placeholder="🔍 Keresés név vagy leírás alapján..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "12px 16px",
          border: `2px solid ${colors.lightGray}`,
          borderRadius: "12px",
          fontSize: "14px",
          outline: "none",
          background: colors.white,
          transition: "border-color 0.2s",
        }}
        onFocus={(e) => {
          e.target.style.borderColor = colors.primary;
        }}
        onBlur={(e) => {
          e.target.style.borderColor = colors.lightGray;
        }}
      />
    </div>
  );
}

// Filter Panel Component
function FilterPanel({
  filters,
  onFiltersChange,
}: {
  filters: FilterCriteria;
  onFiltersChange: (filters: FilterCriteria) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const updateFilter = (key: keyof FilterCriteria, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value === "" ? undefined : value,
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      minPrice: undefined,
      maxPrice: undefined,
      minFloor: undefined,
      maxFloor: undefined,
      hasElevator: null,
    });
  };

  const hasActiveFilters =
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    filters.minFloor !== undefined ||
    filters.maxFloor !== undefined ||
    filters.hasElevator !== null;

  return (
    <div style={{ marginBottom: "20px" }}>
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "12px 16px",
          backgroundColor: hasActiveFilters
            ? colors.primary
            : colors.background,
          color: hasActiveFilters ? colors.white : colors.secondary,
          borderRadius: "12px",
          cursor: "pointer",
          fontWeight: "600",
          fontSize: "14px",
          transition: "all 0.2s ease",
          border: `2px solid ${
            hasActiveFilters ? colors.primary : colors.lightGray
          }`,
        }}
      >
        <span>🔧 Szűrők {hasActiveFilters && "(aktív)"}</span>
        <span
          style={{
            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
          }}
        >
          ▼
        </span>
      </div>

      {isExpanded && (
        <div
          style={{
            marginTop: "8px",
            padding: "16px",
            backgroundColor: colors.white,
            borderRadius: "12px",
            border: `2px solid ${colors.lightGray}`,
          }}
        >
          {/* Bérleti díj szűrő */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontWeight: "600",
                color: colors.secondary,
                marginBottom: "8px",
                fontSize: "13px",
              }}
            >
              💰 Teljes költség (ezer Ft/hó)
            </label>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <input
                type="number"
                step="1"
                placeholder="Min (pl: 200)"
                value={
                  filters.minPrice ? Math.round(filters.minPrice / 1000) : ""
                }
                onChange={(e) => {
                  const value = e.target.value;
                  updateFilter(
                    "minPrice",
                    value ? parseInt(value) * 1000 : undefined
                  );
                }}
                style={{
                  width: "0",
                  flex: 1,
                  minWidth: "0",
                  padding: "6px 4px",
                  border: `1px solid ${colors.lightGray}`,
                  borderRadius: "6px",
                  fontSize: "11px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <span
                style={{
                  color: colors.gray,
                  fontSize: "12px",
                  flexShrink: 0,
                  width: "8px",
                  textAlign: "center",
                }}
              >
                -
              </span>
              <input
                type="number"
                step="1"
                placeholder="Max (pl: 400)"
                value={
                  filters.maxPrice ? Math.round(filters.maxPrice / 1000) : ""
                }
                onChange={(e) => {
                  const value = e.target.value;
                  updateFilter(
                    "maxPrice",
                    value ? parseInt(value) * 1000 : undefined
                  );
                }}
                style={{
                  width: "0",
                  flex: 1,
                  minWidth: "0",
                  padding: "6px 4px",
                  border: `1px solid ${colors.lightGray}`,
                  borderRadius: "6px",
                  fontSize: "11px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Emelet szűrő */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontWeight: "600",
                color: colors.secondary,
                marginBottom: "8px",
                fontSize: "13px",
              }}
            >
              🏢 Emelet
            </label>
            <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
              <input
                type="number"
                placeholder="Min"
                value={filters.minFloor || ""}
                onChange={(e) =>
                  updateFilter(
                    "minFloor",
                    parseInt(e.target.value) || undefined
                  )
                }
                style={{
                  width: "0",
                  flex: 1,
                  minWidth: "0",
                  padding: "6px 4px",
                  border: `1px solid ${colors.lightGray}`,
                  borderRadius: "6px",
                  fontSize: "11px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
              <span
                style={{
                  color: colors.gray,
                  fontSize: "12px",
                  flexShrink: 0,
                  width: "8px",
                  textAlign: "center",
                }}
              >
                -
              </span>
              <input
                type="number"
                placeholder="Max"
                value={filters.maxFloor || ""}
                onChange={(e) =>
                  updateFilter(
                    "maxFloor",
                    parseInt(e.target.value) || undefined
                  )
                }
                style={{
                  width: "0",
                  flex: 1,
                  minWidth: "0",
                  padding: "6px 4px",
                  border: `1px solid ${colors.lightGray}`,
                  borderRadius: "6px",
                  fontSize: "11px",
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Lift szűrő */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontWeight: "600",
                color: colors.secondary,
                marginBottom: "8px",
                fontSize: "13px",
              }}
            >
              🛗 Lift az épületben
            </label>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() => updateFilter("hasElevator", null)}
                style={{
                  flex: 1,
                  padding: "8px",
                  border: `2px solid ${
                    filters.hasElevator === null
                      ? colors.primary
                      : colors.lightGray
                  }`,
                  borderRadius: "6px",
                  fontSize: "12px",
                  backgroundColor:
                    filters.hasElevator === null
                      ? colors.primary
                      : colors.white,
                  color:
                    filters.hasElevator === null ? colors.white : colors.gray,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Mindegy
              </button>
              <button
                type="button"
                onClick={() => updateFilter("hasElevator", true)}
                style={{
                  flex: 1,
                  padding: "8px",
                  border: `2px solid ${
                    filters.hasElevator === true
                      ? colors.success
                      : colors.lightGray
                  }`,
                  borderRadius: "6px",
                  fontSize: "12px",
                  backgroundColor:
                    filters.hasElevator === true
                      ? colors.success
                      : colors.white,
                  color:
                    filters.hasElevator === true ? colors.white : colors.gray,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Van lift
              </button>
              <button
                type="button"
                onClick={() => updateFilter("hasElevator", false)}
                style={{
                  flex: 1,
                  padding: "8px",
                  border: `2px solid ${
                    filters.hasElevator === false
                      ? colors.danger
                      : colors.lightGray
                  }`,
                  borderRadius: "6px",
                  fontSize: "12px",
                  backgroundColor:
                    filters.hasElevator === false
                      ? colors.danger
                      : colors.white,
                  color:
                    filters.hasElevator === false ? colors.white : colors.gray,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Nincs lift
              </button>
            </div>
          </div>

          {/* Törlés gomb */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              style={{
                width: "100%",
                padding: "10px",
                backgroundColor: colors.danger,
                color: colors.white,
                border: "none",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "600",
                cursor: "pointer",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = "0.8";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = "1";
              }}
            >
              🗑️ Szűrők törlése
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Address Search Form for Sidebar
function SidebarAddForm({
  onAddByAddress,
}: {
  onAddByAddress: (place: Omit<Place, "id">) => void;
}) {
  const [newPlace, setNewPlace] = useState<PlaceFormData>({
    name: "",
    is_public: true,
    title: "",
    price: "",
    description: "",
    address: "",
    link: "",
    rentPrice: undefined,
    utilityCost: undefined,
    commonCost: undefined,
    floor: undefined,
    hasElevator: undefined,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlace.title || !newPlace.address) return;

    setIsLoading(true);
    try {
      const coordinates = await geocodeAddress(newPlace.address);
      if (coordinates) {
        onAddByAddress({
          user_id: "",
          name: newPlace.title || "",
          title: newPlace.title || "",
          description: newPlace.description || "",
          address: newPlace.address || "",
          lat: coordinates[0],
          lng: coordinates[1],
          rent_price: newPlace.rentPrice,
          utilities_price: newPlace.utilityCost,
          deposit_price: newPlace.commonCost,
          floor: newPlace.floor,
          hasElevator: newPlace.hasElevator,
          link: newPlace.link || undefined,
          is_public: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          // Kompatibilitási mezők
          position: coordinates,
          price: "",
          createdAt: new Date().toISOString(),
          rentPrice: newPlace.rentPrice,
          utilityCost: newPlace.utilityCost,
          commonCost: newPlace.commonCost,
        });
        setNewPlace({
          name: "",
          is_public: true,
          title: "",
          price: "",
          description: "",
          address: "",
          link: "",
          rentPrice: undefined,
          utilityCost: undefined,
          commonCost: undefined,
          floor: undefined,
          hasElevator: undefined,
        });
      } else {
        alert("Nem sikerült megtalálni a címet. Próbáld pontosabb címmel!");
      }
    } catch (error) {
      console.error("Geocoding failed:", error);
      alert("Nem sikerült megtalálni a címet. Próbáld pontosabb címmel!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: "24px" }}>
      <h3
        style={{
          fontSize: "18px",
          fontWeight: "600",
          color: colors.secondary,
          marginBottom: "16px",
          borderBottom: `2px solid ${colors.primary}`,
          paddingBottom: "8px",
        }}
      >
        ➕ Új hely hozzáadása
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <input
          type="text"
          placeholder="Hely neve *"
          value={newPlace.title}
          onChange={(e) =>
            setNewPlace((prev) => ({ ...prev, title: e.target.value }))
          }
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "12px",
            border: `2px solid ${colors.lightGray}`,
            borderRadius: "8px",
            fontSize: "14px",
            outline: "none",
            background: colors.white,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = colors.primary;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = colors.lightGray;
          }}
          required
        />

        <AddressAutocomplete
          value={newPlace.address || ""}
          onChange={(value) =>
            setNewPlace((prev) => ({ ...prev, address: value }))
          }
          onSelect={(address) => setNewPlace((prev) => ({ ...prev, address }))}
        />

        <textarea
          placeholder="Leírás"
          value={newPlace.description}
          onChange={(e) =>
            setNewPlace((prev) => ({ ...prev, description: e.target.value }))
          }
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "12px",
            border: `2px solid ${colors.lightGray}`,
            borderRadius: "8px",
            fontSize: "14px",
            outline: "none",
            background: colors.white,
            minHeight: "80px",
            resize: "vertical",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = colors.primary;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = colors.lightGray;
          }}
        />

        <input
          type="text"
          placeholder="🔗 Link (weboldal URL)"
          value={newPlace.link || ""}
          onChange={(e) =>
            setNewPlace((prev) => ({ ...prev, link: e.target.value }))
          }
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: "12px",
            border: `2px solid ${colors.lightGray}`,
            borderRadius: "8px",
            fontSize: "14px",
            outline: "none",
            background: colors.white,
          }}
          onFocus={(e) => {
            e.target.style.borderColor = colors.primary;
          }}
          onBlur={(e) => {
            e.target.style.borderColor = colors.lightGray;
          }}
        />

        {/* Részletes költségek */}
        <div
          style={{
            backgroundColor: colors.background,
            padding: "12px",
            borderRadius: "8px",
            border: `1px solid ${colors.lightGray}`,
          }}
        >
          <h4
            style={{
              margin: "0 0 12px 0",
              fontSize: "13px",
              fontWeight: "600",
              color: colors.secondary,
            }}
          >
            💰 Részletes költségek
          </h4>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <input
              type="number"
              placeholder="Bérleti díj (Ft/hó)"
              value={newPlace.rentPrice || ""}
              onChange={(e) =>
                setNewPlace((prev) => ({
                  ...prev,
                  rentPrice: parseInt(e.target.value) || undefined,
                }))
              }
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px",
                border: `1px solid ${colors.lightGray}`,
                borderRadius: "6px",
                fontSize: "13px",
                outline: "none",
                background: colors.white,
              }}
            />

            <input
              type="number"
              placeholder="Rezsi költség (Ft/hó)"
              value={newPlace.utilityCost || ""}
              onChange={(e) =>
                setNewPlace((prev) => ({
                  ...prev,
                  utilityCost: parseInt(e.target.value) || undefined,
                }))
              }
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px",
                border: `1px solid ${colors.lightGray}`,
                borderRadius: "6px",
                fontSize: "13px",
                outline: "none",
                background: colors.white,
              }}
            />

            <input
              type="number"
              placeholder="Közös költség (Ft/hó)"
              value={newPlace.commonCost || ""}
              onChange={(e) =>
                setNewPlace((prev) => ({
                  ...prev,
                  commonCost: parseInt(e.target.value) || undefined,
                }))
              }
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px",
                border: `1px solid ${colors.lightGray}`,
                borderRadius: "6px",
                fontSize: "13px",
                outline: "none",
                background: colors.white,
              }}
            />
          </div>
        </div>

        {/* Ingatlan részletek */}
        <div
          style={{
            backgroundColor: colors.background,
            padding: "12px",
            borderRadius: "8px",
            border: `1px solid ${colors.lightGray}`,
          }}
        >
          <h4
            style={{
              margin: "0 0 12px 0",
              fontSize: "13px",
              fontWeight: "600",
              color: colors.secondary,
            }}
          >
            🏢 Ingatlan részletek
          </h4>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <input
              type="number"
              placeholder="Emelet (pl: 3)"
              value={newPlace.floor || ""}
              onChange={(e) =>
                setNewPlace((prev) => ({
                  ...prev,
                  floor: parseInt(e.target.value) || undefined,
                }))
              }
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px",
                border: `1px solid ${colors.lightGray}`,
                borderRadius: "6px",
                fontSize: "13px",
                outline: "none",
                background: colors.white,
              }}
            />

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                onClick={() =>
                  setNewPlace((prev) => ({ ...prev, hasElevator: true }))
                }
                style={{
                  flex: 1,
                  padding: "10px",
                  border: `2px solid ${
                    newPlace.hasElevator === true
                      ? colors.success
                      : colors.lightGray
                  }`,
                  borderRadius: "6px",
                  fontSize: "12px",
                  backgroundColor:
                    newPlace.hasElevator === true
                      ? colors.success
                      : colors.white,
                  color:
                    newPlace.hasElevator === true ? colors.white : colors.gray,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                🛗 Van lift
              </button>
              <button
                type="button"
                onClick={() =>
                  setNewPlace((prev) => ({ ...prev, hasElevator: false }))
                }
                style={{
                  flex: 1,
                  padding: "10px",
                  border: `2px solid ${
                    newPlace.hasElevator === false
                      ? colors.danger
                      : colors.lightGray
                  }`,
                  borderRadius: "6px",
                  fontSize: "12px",
                  backgroundColor:
                    newPlace.hasElevator === false
                      ? colors.danger
                      : colors.white,
                  color:
                    newPlace.hasElevator === false ? colors.white : colors.gray,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                🚫 Nincs lift
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <label
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: colors.secondary,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            📷 Képek feltöltése
          </label>

          <div
            style={{
              position: "relative",
              border: `2px dashed ${colors.lightGray}`,
              borderRadius: "10px",
              padding: "16px",
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
              if (files && files.length > 0) {
                const newImages: string[] = [];
                for (let i = 0; i < files.length; i++) {
                  const file = files[i];
                  const reader = new FileReader();
                  reader.onload = (event) => {
                    const result = event.target?.result as string;
                    newImages.push(result);
                    if (newImages.length === files.length) {
                      setNewPlace((prev) => ({
                        ...prev,
                        images: [...(prev.images || []), ...newImages],
                      }));
                    }
                  };
                  reader.readAsDataURL(file);
                }
              }
            }}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
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
                        setNewPlace((prev) => ({
                          ...prev,
                          images: [...(prev.images || []), ...newImages],
                        }));
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }
              }}
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
                gap: "6px",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "14px",
                  color: colors.white,
                }}
              >
                📷
              </div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: colors.secondary,
                }}
              >
                Húzd ide vagy kattints
              </div>
            </div>
          </div>

          {newPlace.images && newPlace.images.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(70px, 1fr))",
                gap: "8px",
                marginTop: "8px",
                padding: "10px",
                background: `${colors.background}50`,
                borderRadius: "10px",
                border: `1px solid ${colors.lightGray}`,
              }}
            >
              {newPlace.images.map((image, index) => (
                <div
                  key={index}
                  style={{
                    position: "relative",
                    borderRadius: "6px",
                    overflow: "hidden",
                    boxShadow: `0 2px 6px ${colors.primary}15`,
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
                      height: "70px",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setNewPlace((prev) => ({
                        ...prev,
                        images:
                          prev.images?.filter((_, i) => i !== index) || [],
                      }));
                    }}
                    style={{
                      position: "absolute",
                      top: "2px",
                      right: "2px",
                      width: "18px",
                      height: "18px",
                      borderRadius: "50%",
                      background: `${colors.danger}dd`,
                      color: colors.white,
                      border: "none",
                      fontSize: "10px",
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
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || !newPlace.title || !newPlace.address}
          style={{
            padding: "12px 20px",
            background: isLoading ? colors.gray : colors.primary,
            color: colors.white,
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: isLoading ? "not-allowed" : "pointer",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => {
            if (!isLoading) {
              (e.target as HTMLButtonElement).style.backgroundColor =
                colors.secondary;
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading) {
              (e.target as HTMLButtonElement).style.backgroundColor =
                colors.primary;
            }
          }}
        >
          {isLoading ? "⏳ Hozzáadás..." : "✅ Hely hozzáadása"}
        </button>
      </div>
    </form>
  );
}

// Places List Component
function PlacesList({
  places,
  selectedPlace,
  onSelectPlace,
  onDeletePlace,
}: {
  places: Place[];
  selectedPlace: Place | null;
  onSelectPlace: (place: Place) => void;
  onDeletePlace: (id: number) => void;
}) {
  if (places.length === 0) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "40px 20px",
          color: colors.gray,
          fontSize: "14px",
        }}
      >
        📍 Még nincsenek helyek.
        <br />
        Adj hozzá egy címet fent!
      </div>
    );
  }

  return (
    <div>
      <h3
        style={{
          fontSize: "18px",
          fontWeight: "600",
          color: colors.secondary,
          marginBottom: "16px",
          borderBottom: `2px solid ${colors.primary}`,
          paddingBottom: "8px",
        }}
      >
        📍 Mentett helyek ({places.length})
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {places.map((place) => (
          <div
            key={place.id}
            style={{
              padding: "16px",
              background:
                selectedPlace?.id === place.id
                  ? `linear-gradient(135deg, ${colors.primary}15, ${colors.background})`
                  : colors.white,
              border:
                selectedPlace?.id === place.id
                  ? `2px solid ${colors.primary}`
                  : `1px solid ${colors.lightGray}`,
              borderRadius: "12px",
              cursor: "pointer",
              transition: "all 0.2s",
              position: "relative",
            }}
            onClick={() => onSelectPlace(place)}
            onMouseEnter={(e) => {
              if (selectedPlace?.id !== place.id) {
                e.currentTarget.style.borderColor = colors.primary;
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = `0 4px 12px ${colors.primary}20`;
              }
            }}
            onMouseLeave={(e) => {
              if (selectedPlace?.id !== place.id) {
                e.currentTarget.style.borderColor = colors.lightGray;
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: "8px",
              }}
            >
              <div style={{ flex: "1" }}>
                <h4
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: colors.secondary,
                    margin: "0 0 4px 0",
                  }}
                >
                  {place.title}
                </h4>
                {/* Teljes költség megjelenítése */}
                {(place.rentPrice || 0) +
                  (place.utilityCost || 0) +
                  (place.commonCost || 0) >
                  0 && (
                  <p
                    style={{
                      fontSize: "13px",
                      fontWeight: "600",
                      color: colors.success,
                      margin: "0",
                    }}
                  >
                    💰{" "}
                    {(
                      ((place.rentPrice || 0) +
                        (place.utilityCost || 0) +
                        (place.commonCost || 0)) /
                      1000
                    ).toFixed(0)}{" "}
                    ezer Ft/hó
                  </p>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeletePlace(parseInt(place.id) || 0);
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: colors.danger,
                  fontSize: "16px",
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "4px",
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => {
                  (
                    e.target as HTMLButtonElement
                  ).style.backgroundColor = `${colors.danger}15`;
                }}
                onMouseLeave={(e) => {
                  (e.target as HTMLButtonElement).style.backgroundColor =
                    "transparent";
                }}
                title="Törlés"
              >
                🗑️
              </button>
            </div>

            {/* Cím megjelenítése koordináta helyett */}
            {place.address ? (
              <p
                style={{
                  fontSize: "13px",
                  color: colors.gray,
                  margin: "0 0 8px 0",
                  lineHeight: "1.4",
                }}
              >
                📍 {place.address}
              </p>
            ) : (
              <p
                style={{
                  fontSize: "13px",
                  color: colors.gray,
                  margin: "0 0 8px 0",
                  lineHeight: "1.4",
                }}
              >
                📍 {(place.position?.[0] || place.lat).toFixed(4)},{" "}
                {(place.position?.[1] || place.lng).toFixed(4)}
              </p>
            )}

            {place.description && (
              <p
                style={{
                  fontSize: "13px",
                  color: colors.gray,
                  margin: "0 0 8px 0",
                  lineHeight: "1.4",
                }}
              >
                💬 {place.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Main Sidebar Component
export default function Sidebar({
  places,
  selectedPlace,
  onSelectPlace,
  onAddPlace,
  onDeletePlace,
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<"search" | "add">("search");
  const { user, signOut } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // ProfileBar komponens
  const ProfileBar = () => {
    if (!user) return null;

    return (
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
          borderTop: "1px solid rgba(59, 130, 246, 0.2)",
          padding: "12px 16px",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            cursor: "pointer",
            borderRadius: "12px",
            padding: "8px",
            transition: "all 0.2s",
            background: showProfileMenu
              ? "rgba(59, 130, 246, 0.1)"
              : "transparent",
          }}
          onClick={() => setShowProfileMenu(!showProfileMenu)}
        >
          {/* Avatar */}
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              background: user.user_metadata?.avatar_url
                ? `url(${user.user_metadata.avatar_url})`
                : "linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)",
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid rgba(59, 130, 246, 0.3)",
            }}
          >
            {!user.user_metadata?.avatar_url && (
              <FaUser style={{ color: "white", fontSize: "16px" }} />
            )}
          </div>

          {/* User info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: "#1f2937",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user.user_metadata?.full_name || user.email || "Felhasználó"}
            </div>
            <div
              style={{
                fontSize: "12px",
                color: "#6b7280",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {user.email}
            </div>
          </div>

          {/* Logout button vagy dropdown arrow */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              signOut();
            }}
            style={{
              background: "none",
              border: "none",
              color: "#6b7280",
              cursor: "pointer",
              padding: "8px",
              borderRadius: "8px",
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
              e.currentTarget.style.color = "#ef4444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "none";
              e.currentTarget.style.color = "#6b7280";
            }}
            title="Kijelentkezés"
          >
            <FaSignOutAlt style={{ fontSize: "16px" }} />
          </button>
        </div>
      </div>
    );
  };

  // Apply filters to places
  const applyFilters = (placesToFilter: Place[]): Place[] => {
    return placesToFilter.filter((place) => {
      // Price filter (total cost)
      const totalCost =
        (place.rentPrice || 0) +
        (place.utilityCost || 0) +
        (place.commonCost || 0);
      if (filters.minPrice !== undefined && totalCost < filters.minPrice)
        return false;
      if (filters.maxPrice !== undefined && totalCost > filters.maxPrice)
        return false;

      // Floor filter
      if (
        filters.minFloor !== undefined &&
        (place.floor === undefined || place.floor < filters.minFloor)
      )
        return false;
      if (
        filters.maxFloor !== undefined &&
        (place.floor === undefined || place.floor > filters.maxFloor)
      )
        return false;

      // Elevator filter
      if (
        filters.hasElevator !== null &&
        place.hasElevator !== filters.hasElevator
      )
        return false;

      return true;
    });
  };

  // Filter places based on search term first, then apply filters
  const searchFilteredPlaces = places.filter(
    (place) =>
      (place.title || place.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (place.description &&
        place.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredPlaces = applyFilters(searchFilteredPlaces);

  // Check if filters are active
  const hasActiveFilters =
    filters.minFloor !== undefined ||
    filters.maxFloor !== undefined ||
    filters.hasElevator !== null;

  return (
    <div
      style={{
        position: "fixed",
        top: "0",
        right: "0",
        width: "380px",
        height: "100vh",
        background: `linear-gradient(135deg, ${colors.background} 0%, ${colors.white} 100%)`,
        borderLeft: `3px solid ${colors.primary}`,
        boxShadow: `-4px 0 20px ${colors.primary}15`,
        zIndex: 1000,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "24px 20px 0px",
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
          color: colors.white,
        }}
      >
        <h2
          style={{
            fontSize: "24px",
            fontWeight: "700",
            margin: "0 0 16px 0",
          }}
        >
          🗺️ Térkép Helyek
        </h2>

        {/* Tab Navigation */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "0" }}>
          <button
            onClick={() => setActiveTab("search")}
            style={{
              flex: 1,
              padding: "12px 8px",
              backgroundColor:
                activeTab === "search" ? colors.white : "transparent",
              color: activeTab === "search" ? colors.primary : colors.white,
              border: "none",
              borderRadius: "8px 8px 0 0",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s",
              position: "relative",
            }}
          >
            🔍 Keresés
            {hasActiveFilters && (
              <span
                style={{
                  position: "absolute",
                  top: "6px",
                  right: "6px",
                  width: "8px",
                  height: "8px",
                  backgroundColor: colors.danger,
                  borderRadius: "50%",
                }}
              />
            )}
          </button>

          <button
            onClick={() => setActiveTab("add")}
            style={{
              flex: 1,
              padding: "12px 8px",
              backgroundColor:
                activeTab === "add" ? colors.white : "transparent",
              color: activeTab === "add" ? colors.primary : colors.white,
              border: "none",
              borderRadius: "8px 8px 0 0",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            ➕ Hozzáadás
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div
        style={{
          flex: "1",
          overflowY: "auto",
          padding: "20px",
          paddingBottom: user ? "80px" : "20px", // Extra padding ha van bejelentkezett user
          overflowX: "hidden",
          backgroundColor: colors.white,
        }}
      >
        {activeTab === "search" && (
          <div>
            <SearchBar
              searchTerm={searchTerm}
              onSearchChange={onSearchChange}
            />
            <FilterPanel filters={filters} onFiltersChange={onFiltersChange} />
            <PlacesList
              places={filteredPlaces}
              selectedPlace={selectedPlace}
              onSelectPlace={onSelectPlace}
              onDeletePlace={onDeletePlace}
            />
          </div>
        )}

        {activeTab === "add" && <SidebarAddForm onAddByAddress={onAddPlace} />}
      </div>

      {/* Profile Bar */}
      <ProfileBar />
    </div>
  );
}
