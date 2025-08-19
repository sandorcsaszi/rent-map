import { useState } from "react";
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
        />

        <div className="flex-1 relative">
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
    </div>
  );
}
