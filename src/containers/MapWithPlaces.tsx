import { useState, useEffect } from "react";
import type { Place, FilterCriteria } from "../types/Place";
import MapComponent from "../components/MapComponent";
import Sidebar from "../components/Sidebar";
import PlaceForm from "../components/PlaceForm";
import PlaceDetails from "../components/PlaceDetails";
import LoginModal from "../components/LoginModal";
import { useAuth } from "../contexts/AuthContext";
import { usePlaces } from "../services/placesService";

export default function MapWithPlaces() {
  const { user, loading: authLoading } = useAuth();
  const { places, createPlace, updatePlace, deletePlace } = usePlaces();

  const [addingPosition, setAddingPosition] = useState<[number, number] | null>(
    null
  );
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAllPopups, setShowAllPopups] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Ha nincs user, akkor becsukott; ha van user, akkor nyitott
    return !user;
  });

  // Handle user authentication changes
  useEffect(() => {
    // Ha bejelentkezik a user, nyissuk ki a sidebar-t
    if (user) {
      setSidebarCollapsed(false);
    } else {
      setSidebarCollapsed(true);
    }
  }, [user]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // Ha nagyon kicsi a képernyő, automatikusan becsukjuk
      if (window.innerWidth < 480) {
        setSidebarCollapsed(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  const [filters, setFilters] = useState<FilterCriteria>({
    minPrice: undefined,
    maxPrice: undefined,
    minFloor: undefined,
    maxFloor: undefined,
    hasElevator: null,
  });

  // Helyek konvertálása a régi formátumhoz kompatibilitás érdekében
  const convertedPlaces: Place[] = places.map((place) => ({
    ...place,
    position: [place.lat, place.lng] as [number, number],
    title: place.name,
    price: place.rent_price
      ? `${place.rent_price.toLocaleString()} Ft`
      : `${(place.rent_price || 0).toLocaleString()} Ft`,
    createdAt: place.created_at,
    rentPrice: place.rent_price,
    utilityCost: place.utility_cost,
    commonCost: place.common_cost,
  }));

  const handleMapClick = (position: [number, number]) => {
    console.log("Map clicked at position:", position);
    if (!user) {
      console.log("User not authenticated, ignoring map click");
      return;
    }

    try {
      setAddingPosition(position);
      setSelectedPlace(null);
      setEditingPlace(null);
      console.log("Adding position set:", position);
    } catch (error) {
      console.error("Error in handleMapClick:", error);
    }
  };

  const handlePinClick = (place: Place) => {
    setSelectedPlace(place);
    setAddingPosition(null);
    setEditingPlace(null);
  };

  const handleCloseForm = () => {
    setAddingPosition(null);
    setEditingPlace(null);
  };

  const handleSavePlace = async (placeData: any) => {
    console.log("Saving place with data:", placeData);
    if (!user || !addingPosition) {
      console.error("Missing user or position for saving place");
      return;
    }

    try {
      const newPlace = {
        name: placeData.title || placeData.name || "Új hely",
        title: placeData.title || placeData.name || "Új hely",
        description: placeData.description || "",
        address: placeData.address || "",
        lat: addingPosition[0],
        lng: addingPosition[1],
        rent_price: placeData.rentPrice || 0,
        common_cost: placeData.commonCost || 0,
        utility_cost: placeData.utilityCost || 0,
      };

      console.log("Creating place:", newPlace);
      await createPlace(newPlace);
      console.log("Place created successfully");
      setAddingPosition(null);
    } catch (error) {
      console.error("Hiba a hely mentésekor:", error);
      alert("Hiba történt a hely mentésekor!");
      // Ne töröljem az addingPosition-t hiba esetén, hogy a user újrapróbálhassa
    }
  };

  const handleUpdatePlace = async (updatedData: any) => {
    if (!editingPlace) return;

    try {
      const updates = {
        name: updatedData.title || updatedData.name || "Új hely",
        title: updatedData.title || updatedData.name || "Új hely",
        description: updatedData.description || "",
        address: updatedData.address || "",
        rent_price: updatedData.rentPrice || 0,
        common_cost: updatedData.commonCost || 0,
        utility_cost: updatedData.utilityCost || 0,
      };

      await updatePlace(editingPlace.id, updates);
      setEditingPlace(null);
    } catch (error) {
      console.error("Hiba a hely frissítésekor:", error);
      alert("Hiba történt a hely frissítésekor!");
    }
  };

  const handleDeletePlace = async (placeId: string) => {
    if (!confirm("Biztosan törölni szeretnéd ezt a helyet?")) return;

    try {
      await deletePlace(placeId);
      setSelectedPlace(null);
    } catch (error) {
      console.error("Hiba a hely törlésekor:", error);
      alert("Hiba történt a hely törlésekor!");
    }
  };

  const handleEditPlace = (place: Place) => {
    setEditingPlace(place);
    setSelectedPlace(null);
    setAddingPosition(null);
  };

  const handleCloseDetails = () => {
    setSelectedPlace(null);
  };

  const handleAddPlaceFromSidebar = async (placeData: Omit<Place, "id">) => {
    if (!user) return;

    try {
      const newPlace = {
        user_id: user.id,
        name: placeData.name || placeData.title || "",
        title: placeData.title || placeData.name || "",
        description: placeData.description || "",
        address: placeData.address || "",
        lat: placeData.lat,
        lng: placeData.lng,
        rent_price: placeData.rent_price || placeData.rentPrice || 0,
        common_cost: placeData.common_cost || placeData.commonCost || 0,
        utility_cost: placeData.utility_cost || placeData.utilityCost || 0,
        floor: placeData.floor,
        has_elevator: placeData.hasElevator,
        link: placeData.link,
      };

      await createPlace(newPlace);
    } catch (error) {
      console.error("Hiba a hely mentésekor:", error);
      alert("Hiba történt a hely mentésekor!");
    }
  };

  const handleUpdatePlaceFromSidebar = async (placeData: Place) => {
    if (!user) return;

    try {
      const updates = {
        name: placeData.name || placeData.title || "",
        title: placeData.title || placeData.name || "",
        description: placeData.description || "",
        address: placeData.address || "",
        rent_price: placeData.rent_price || placeData.rentPrice || 0,
        common_cost: placeData.common_cost || placeData.commonCost || 0,
        utility_cost: placeData.utility_cost || placeData.utilityCost || 0,
        floor: placeData.floor,
        has_elevator: placeData.hasElevator,
        link: placeData.link,
      };

      await updatePlace(placeData.id, updates);
    } catch (error) {
      console.error("Hiba a hely frissítésekor:", error);
      alert("Hiba történt a hely frissítésekor!");
    }
  };

  const handleDeletePlaceFromSidebar = async (id: string | number) => {
    if (!user) return;

    try {
      // Convert to string if needed
      const placeId = typeof id === "string" ? id : id.toString();
      await deletePlace(placeId);
    } catch (error) {
      console.error("Hiba a hely törlésekor:", error);
      alert("Hiba történt a hely törlésekor!");
    }
  };

  // Szűrt helyek számítása
  const filteredPlaces = convertedPlaces.filter((place) => {
    const matchesSearch =
      place.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      place.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      place.address?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMinPrice =
      !filters.minPrice ||
      (place.rentPrice && place.rentPrice >= filters.minPrice);
    const matchesMaxPrice =
      !filters.maxPrice ||
      (place.rentPrice && place.rentPrice <= filters.maxPrice);
    const matchesMinFloor =
      !filters.minFloor || (place.floor && place.floor >= filters.minFloor);
    const matchesMaxFloor =
      !filters.maxFloor || (place.floor && place.floor <= filters.maxFloor);
    const matchesElevator =
      filters.hasElevator === null || place.hasElevator === filters.hasElevator;

    return (
      matchesSearch &&
      matchesMinPrice &&
      matchesMaxPrice &&
      matchesMinFloor &&
      matchesMaxFloor &&
      matchesElevator
    );
  });

  // Loading állapot - animált betöltés
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center space-y-6">
          {/* Pulzáló logo/ikon */}
          <div className="relative">
            <div className="w-16 h-16 bg-blue-500 rounded-full animate-pulse mx-auto"></div>
            <div className="absolute inset-0 w-16 h-16 bg-blue-300 rounded-full animate-ping mx-auto"></div>
          </div>

          {/* Forgó betöltő */}
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          </div>

          {/* Betöltési szöveg animációval */}
          <div className="space-y-2">
            <p className="text-xl font-semibold text-gray-700 animate-pulse">
              Bejelentkezés...
            </p>
            <div className="flex justify-center space-x-1">
              <div
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              ></div>
              <div
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100 relative">
      {/* Blur effect ha nincs bejelentkezve */}
      <div
        className={`flex h-screen w-full ${
          !user ? "blur-sm pointer-events-none" : ""
        }`}
      >
        <Sidebar
          places={filteredPlaces}
          selectedPlace={selectedPlace}
          onSelectPlace={handlePinClick}
          onAddPlace={handleAddPlaceFromSidebar}
          onUpdatePlace={handleUpdatePlaceFromSidebar}
          onDeletePlace={handleDeletePlaceFromSidebar}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filters={filters}
          onFiltersChange={setFilters}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        <div className="flex-1 relative transition-all duration-300">
          {/* Burger Menu Button - csak bejelentkezés után és ha sidebar becsukva */}
          {user && sidebarCollapsed && (
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="fixed top-4 right-4 z-50 w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-110"
              style={{
                borderRadius: "4px", // Szögletes sarkok
                boxShadow: "0 8px 32px rgba(59, 130, 246, 0.4)",
                border: "2px solid rgba(255, 255, 255, 0.2)",
              }}
              title="Oldalsáv megnyitása"
            >
              {/* Hamburger icon */}
              <div className="flex flex-col items-center justify-center space-y-1">
                <div className="w-5 h-0.5 bg-white rounded-full transition-all duration-300"></div>
                <div className="w-5 h-0.5 bg-white rounded-full transition-all duration-300"></div>
                <div className="w-5 h-0.5 bg-white rounded-full transition-all duration-300"></div>
              </div>
            </button>
          )}

          <MapComponent
            places={filteredPlaces}
            onMapClick={handleMapClick}
            onPinClick={handlePinClick}
            showAllPopups={showAllPopups}
            onTogglePopups={setShowAllPopups}
          />
        </div>
      </div>

      {/* Ha nincs bejelentkezve, mutassuk a login modalt - KÍVÜL a blur-ös konténertől */}
      {!user && <LoginModal />}

      {/* Form modals - csak bejelentkezett felhasználóknak */}
      {user && addingPosition && (
        <PlaceForm
          position={addingPosition}
          onSave={handleSavePlace}
          onCancel={handleCloseForm}
        />
      )}

      {user && editingPlace && (
        <PlaceForm
          place={editingPlace}
          position={[editingPlace.lat, editingPlace.lng]}
          onSave={handleUpdatePlace}
          onCancel={handleCloseForm}
          isEditing={true}
        />
      )}

      {selectedPlace && (
        <PlaceDetails
          place={selectedPlace}
          onClose={handleCloseDetails}
          onEdit={
            user?.id === selectedPlace.user_id
              ? () => handleEditPlace(selectedPlace)
              : () => {}
          }
          onDelete={
            user?.id === selectedPlace.user_id
              ? () => handleDeletePlace(selectedPlace.id)
              : () => {}
          }
        />
      )}

      {/* Footer komponens - mindig bal alul, bejelentkezés után is */}
      <footer
        style={{
          position: "fixed",
          bottom: "16px",
          left: "16px",
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(8px)",
          borderRadius: "12px",
          padding: "12px 16px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          border: "1px solid rgba(255,255,255,0.2)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          fontSize: "14px",
          color: "#6b7280",
          zIndex: 999,
          transition: "all 0.3s ease",
        }}
      >
        <span style={{ fontWeight: "500", color: "#374151" }}>
          Készítette: Császi Sándor
        </span>

        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <a
            href="https://www.linkedin.com/in/sandorcsaszi/"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #0077b5 0%, #005582 100%)",
              color: "white",
              textDecoration: "none",
              transition: "all 0.2s",
              fontSize: "16px",
            }}
            title="LinkedIn profil"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>

          <a
            href="https://github.com/sandorcsaszi"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "linear-gradient(135deg, #24292e 0%, #1a1e22 100%)",
              color: "white",
              textDecoration: "none",
              transition: "all 0.2s",
              fontSize: "16px",
            }}
            title="GitHub profil"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
            </svg>
          </a>
        </div>
      </footer>
    </div>
  );
}
