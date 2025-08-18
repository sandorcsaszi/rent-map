import { useState, useEffect } from "react";
import type { Place, FilterCriteria } from "../types/Place";
import MapComponent from "../components/MapComponent";
import Sidebar from "../components/Sidebar";
import PlaceForm from "../components/PlaceForm";
import PlaceDetails from "../components/PlaceDetails";

export default function MapWithPlaces() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [addingPosition, setAddingPosition] = useState<[number, number] | null>(
    null
  );
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [idCounter, setIdCounter] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAllPopups, setShowAllPopups] = useState(false);
  const [filters, setFilters] = useState<FilterCriteria>({
    minPrice: undefined,
    maxPrice: undefined,
    minFloor: undefined,
    maxFloor: undefined,
    hasElevator: null,
  });

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedPlaces = localStorage.getItem("mapPlaces");
    const savedIdCounter = localStorage.getItem("mapIdCounter");

    if (savedPlaces) {
      try {
        const parsedPlaces = JSON.parse(savedPlaces);
        if (parsedPlaces.length > 0) {
          setPlaces(parsedPlaces);
        }
      } catch (error) {
        console.error("Error loading places from localStorage:", error);
      }
    }

    if (savedIdCounter) {
      const counter = parseInt(savedIdCounter);
      setIdCounter(counter);
    }
  }, []);

  // Save places to localStorage whenever places change
  useEffect(() => {
    // Only save if places array is not empty or if we're explicitly setting it to empty
    if (places.length > 0) {
      localStorage.setItem("mapPlaces", JSON.stringify(places));
    }
  }, [places]);

  // Save idCounter to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("mapIdCounter", idCounter.toString());
  }, [idCounter]);

  // Filter places based on search term
  useEffect(() => {
    // This effect can be used later for additional filtering logic if needed
  }, [places, searchTerm]);

  // Apply filters to places for map display
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

  // Filter places for both search and filters
  const searchFilteredPlaces = places.filter(
    (place) =>
      place.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (place.description &&
        place.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredPlaces = applyFilters(searchFilteredPlaces);

  // Add a new place
  const addPlace = (place: Omit<Place, "id" | "createdAt">) => {
    const newPlace: Place = {
      ...place,
      id: idCounter,
      createdAt: new Date().toLocaleString("hu-HU"),
    };
    const updatedPlaces = [...places, newPlace];
    setPlaces(updatedPlaces);
    setIdCounter(idCounter + 1);
    setAddingPosition(null);

    // Explicitly save to localStorage
    localStorage.setItem("mapPlaces", JSON.stringify(updatedPlaces));
    localStorage.setItem("mapIdCounter", (idCounter + 1).toString());
  };

  // Edit an existing place
  const editPlace = (
    id: number,
    updatedPlace: Omit<Place, "id" | "createdAt">
  ) => {
    const updatedPlaces = places.map((p) =>
      p.id === id ? { ...updatedPlace, id, createdAt: p.createdAt } : p
    );
    setPlaces(updatedPlaces);
    setEditingPlace(null);
    setSelectedPlace(null);

    // Explicitly save to localStorage
    localStorage.setItem("mapPlaces", JSON.stringify(updatedPlaces));
  };

  // Delete a place
  const deletePlace = (id: number) => {
    const updatedPlaces = places.filter((p) => p.id !== id);
    setPlaces(updatedPlaces);

    // Explicitly save to localStorage after deletion
    if (updatedPlaces.length === 0) {
      localStorage.removeItem("mapPlaces");
    } else {
      localStorage.setItem("mapPlaces", JSON.stringify(updatedPlaces));
    }

    if (selectedPlace && selectedPlace.id === id) setSelectedPlace(null);
    if (editingPlace && editingPlace.id === id) setEditingPlace(null);
  };

  // Handle map click
  const handleMapClick = (position: [number, number]) => {
    setAddingPosition(position);
    setSelectedPlace(null);
    setEditingPlace(null);
  };

  // Handle pin click
  const handlePinClick = (place: Place) => {
    setSelectedPlace(place);
    setAddingPosition(null);
    setEditingPlace(null);
  };

  // Handle place select from sidebar
  const handlePlaceSelect = (place: Place) => {
    setSelectedPlace(place);
  };

  // Handle search change
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  return (
    <div className="w-screen h-screen relative flex">
      <Sidebar
        places={places}
        selectedPlace={selectedPlace}
        onSelectPlace={handlePlaceSelect}
        onAddPlace={addPlace}
        onUpdatePlace={(place: Place) => editPlace(place.id, place)}
        onDeletePlace={deletePlace}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <MapComponent
        places={filteredPlaces}
        onMapClick={handleMapClick}
        onPinClick={handlePinClick}
        showAllPopups={showAllPopups}
        onTogglePopups={setShowAllPopups}
      />

      {/* Add Form (when clicking on map) */}
      {addingPosition && (
        <PlaceForm
          position={addingPosition}
          onSave={addPlace}
          onCancel={() => setAddingPosition(null)}
        />
      )}

      {/* Edit Form */}
      {editingPlace && (
        <PlaceForm
          place={editingPlace}
          onSave={(updatedPlace) => editPlace(editingPlace.id, updatedPlace)}
          onCancel={() => setEditingPlace(null)}
          isEditing={true}
        />
      )}

      {/* Selected Place Details */}
      {selectedPlace && !editingPlace && (
        <PlaceDetails
          place={selectedPlace}
          onClose={() => setSelectedPlace(null)}
          onEdit={() => {
            setEditingPlace(selectedPlace);
            setSelectedPlace(null);
          }}
          onDelete={() => {
            deletePlace(selectedPlace.id);
            setSelectedPlace(null);
          }}
        />
      )}
    </div>
  );
}
