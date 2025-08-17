import "leaflet/dist/leaflet.css";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
} from "react-leaflet";
import { useState, useEffect, useRef } from "react";
import L from "leaflet";

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Simple geocoding using Nominatim API
async function geocodeAddress(
  address: string
): Promise<[number, number] | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      address
    )}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
  } catch (error) {
    console.error("Geocoding error:", error);
  }
  return null;
}

interface Place {
  id: number;
  position: [number, number];
  title: string;
  price: string;
  description: string;
  createdAt: string;
}

// Search Component
function SearchBar({
  searchTerm,
  setSearchTerm,
  onSearch,
}: {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onSearch: (term: string) => void;
}) {
  return (
    <div className="relative">
      <input
        type="text"
        placeholder="🔍 Keresés név vagy leírás alapján..."
        value={searchTerm}
        onChange={(e) => {
          setSearchTerm(e.target.value);
          onSearch(e.target.value);
        }}
        className="w-full rounded-xl bg-slate-700/80 border border-blue-400/30 px-4 py-3 text-white placeholder-white/70 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 transition backdrop-blur"
      />
    </div>
  );
}

// Add/Edit Place Form
function PlaceForm({
  place,
  position,
  onSave,
  onCancel,
  isEditing = false,
}: {
  place?: Place;
  position?: [number, number];
  onSave: (place: Omit<Place, "id" | "createdAt">) => void;
  onCancel: () => void;
  isEditing?: boolean;
}) {
  const [title, setTitle] = useState(place?.title || "");
  const [price, setPrice] = useState(place?.price || "");
  const [description, setDescription] = useState(place?.description || "");

  return (
    <div className="absolute left-1/2 top-8 z-50 w-96 -translate-x-1/2 rounded-2xl bg-white/95 p-6 shadow-2xl border border-blue-200 animate-fade-in">
      <h2 className="text-xl font-extrabold mb-4 text-blue-700">
        {isEditing ? "✏️ Hely szerkesztése" : "📍 Új hely hozzáadása"}
      </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            position: position || place!.position,
            title,
            price,
            description,
          });
        }}
        className="flex flex-col gap-3"
      >
        <input
          className="w-full rounded-xl bg-white border border-gray-200 px-4 py-3 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-200 text-base placeholder-gray-400 transition"
          placeholder="Név / címke"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <input
          className="w-full rounded-xl bg-white border border-gray-200 px-4 py-3 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-200 text-base placeholder-gray-400 transition"
          placeholder="Ár (Ft vagy €)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
        <textarea
          className="w-full rounded-xl bg-white border border-gray-200 px-4 py-3 shadow-sm focus:border-blue-400 focus:ring-2 focus:ring-blue-200 text-base placeholder-gray-400 transition min-h-[80px] resize-y"
          placeholder="Leírás"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div className="flex gap-3 mt-4">
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-400 hover:to-blue-500 transition shadow-lg flex-1"
          >
            {isEditing ? "💾 Mentés" : "✅ Hozzáadás"}
          </button>
          <button
            type="button"
            className="bg-gray-200 px-6 py-3 rounded-xl font-semibold hover:bg-gray-300 transition"
            onClick={onCancel}
          >
            ❌ Mégse
          </button>
        </div>
      </form>
    </div>
  );
}

// Address Search Form for Sidebar
function SidebarAddForm({
  onAddByAddress,
}: {
  onAddByAddress: (
    place: Omit<Place, "id" | "position" | "createdAt"> & { address: string }
  ) => void;
}) {
  const [address, setAddress] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (address.length < 3) {
      setSuggestions([]);
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          address
        )}`;
        const res = await fetch(url);
        const data = await res.json();
        setSuggestions(data.slice(0, 5)); // Limit to 5 suggestions
      } catch (error) {
        console.error("Search error:", error);
      }
    }, 400);
    return () => clearTimeout(timeout);
  }, [address]);

  const resetForm = () => {
    setAddress("");
    setTitle("");
    setPrice("");
    setDescription("");
    setError("");
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <form
      className="flex flex-col gap-4 bg-slate-800/90 backdrop-blur border border-blue-400/30 rounded-2xl p-6 shadow-lg relative"
      autoComplete="off"
      onSubmit={async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        try {
          await onAddByAddress({ address, title, price, description });
          resetForm();
        } catch (err) {
          setError("Hiba történt a hozzáadás során!");
        }
        setLoading(false);
      }}
    >
      <div className="relative">
        <input
          ref={inputRef}
          className="w-full rounded-xl bg-slate-700/80 border border-blue-400/30 px-4 py-3 text-white placeholder-white/70 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 transition backdrop-blur"
          placeholder="📍 Cím (pl. Budapest, Andrássy út 1.)"
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          required
        />
        {showSuggestions && suggestions.length > 0 && (
          <ul className="absolute left-0 right-0 mt-1 bg-white border border-blue-200 rounded-xl shadow-lg z-50 max-h-56 overflow-auto">
            {suggestions.map((s) => (
              <li
                key={s.place_id}
                className="px-4 py-3 cursor-pointer hover:bg-blue-50 text-sm border-b border-gray-100 last:border-0"
                onMouseDown={() => {
                  setAddress(s.display_name);
                  setShowSuggestions(false);
                  setSuggestions([]);
                  if (inputRef.current) inputRef.current.blur();
                }}
              >
                {s.display_name}
              </li>
            ))}
          </ul>
        )}
      </div>
      <input
        className="w-full rounded-xl bg-slate-700/80 border border-blue-400/30 px-4 py-3 text-white placeholder-white/70 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 transition backdrop-blur"
        placeholder="🏠 Név / címke"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <input
        className="w-full rounded-xl bg-slate-700/80 border border-blue-400/30 px-4 py-3 text-white placeholder-white/70 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 transition backdrop-blur"
        placeholder="💰 Ár (Ft vagy €)"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        required
      />
      <textarea
        className="w-full rounded-xl bg-slate-700/80 border border-blue-400/30 px-4 py-3 text-white placeholder-white/70 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 transition backdrop-blur min-h-[80px] resize-y"
        placeholder="📝 Leírás"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button
        type="submit"
        className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-cyan-500 hover:to-blue-500 transition mt-2 disabled:opacity-50 shadow-lg"
        disabled={loading}
      >
        {loading ? "⏳ Hozzáadás..." : "🚀 Hozzáadás cím alapján"}
      </button>
      {error && (
        <div className="text-red-200 text-sm font-semibold bg-red-600/80 p-3 rounded-xl border border-red-400/50 backdrop-blur">
          {error}
        </div>
      )}
    </form>
  );
}

// Main Map Component
function MapWithPlaces() {
  const [places, setPlaces] = useState<Place[]>([]);
  const [addingPosition, setAddingPosition] = useState<[number, number] | null>(
    null
  );
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [editingPlace, setEditingPlace] = useState<Place | null>(null);
  const [idCounter, setIdCounter] = useState(1);
  const [sidebarError, setSidebarError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredPlaces, setFilteredPlaces] = useState<Place[]>([]);

  // Filter places based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPlaces(places);
    } else {
      const filtered = places.filter(
        (place) =>
          place.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          place.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          place.price.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPlaces(filtered);
    }
  }, [places, searchTerm]);

  // Add a new place
  const addPlace = (place: Omit<Place, "id" | "createdAt">) => {
    const newPlace: Place = {
      ...place,
      id: idCounter,
      createdAt: new Date().toLocaleString("hu-HU"),
    };
    setPlaces((ps) => [...ps, newPlace]);
    setIdCounter(idCounter + 1);
    setAddingPosition(null);
  };

  // Edit an existing place
  const editPlace = (updatedPlace: Omit<Place, "id" | "createdAt">) => {
    if (!editingPlace) return;
    setPlaces((ps) =>
      ps.map((p) =>
        p.id === editingPlace.id
          ? {
              ...updatedPlace,
              id: editingPlace.id,
              createdAt: editingPlace.createdAt,
            }
          : p
      )
    );
    setEditingPlace(null);
    setSelectedPlace(null);
  };

  // Delete a place
  const deletePlace = (id: number) => {
    setPlaces((ps) => ps.filter((p) => p.id !== id));
    if (selectedPlace && selectedPlace.id === id) setSelectedPlace(null);
    if (editingPlace && editingPlace.id === id) setEditingPlace(null);
  };

  // Handle search
  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  function MapClickHandler() {
    useMapEvents({
      click(e) {
        setAddingPosition([e.latlng.lat, e.latlng.lng]);
        setSelectedPlace(null);
        setEditingPlace(null);
      },
    });
    return null;
  }

  return (
    <div className="w-screen h-screen relative flex">
      {/* Sidebar */}
      <aside className="absolute left-0 top-0 h-full w-80 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 shadow-2xl z-50 p-0 flex flex-col border-r border-blue-400/30">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-8 flex items-center gap-3 shadow-lg border-b border-blue-400/20">
          <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
            <path
              fill="#fff"
              d="M12 2C7.03 2 3 6.03 3 11c0 5.25 7.02 10.53 7.32 10.74.41.29.95.29 1.36 0C13.98 21.53 21 16.25 21 11c0-4.97-4.03-9-9-9Zm0 18.54C9.14 18.09 5 14.61 5 11c0-3.87 3.13-7 7-7s7 3.13 7 7c0 3.61-4.14 7.09-7 9.54Z"
            />
            <path
              fill="#fff"
              d="M12 6.5A4.5 4.5 0 1 0 12 15.5 4.5 4.5 0 1 0 12 6.5Z"
            />
          </svg>
          <span className="text-xl font-bold">🗺️ Térkép Kezelő</span>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
          {/* Add Form */}
          <SidebarAddForm
            onAddByAddress={async ({ address, title, price, description }) => {
              setSidebarError("");
              const pos = await geocodeAddress(address);
              if (!pos) {
                setSidebarError("❌ Nem található a cím!");
                return;
              }
              addPlace({ position: pos, title, price, description });
            }}
          />
          {sidebarError && (
            <div className="text-red-200 text-sm font-semibold bg-red-600/80 p-3 rounded-xl border border-red-400/50 backdrop-blur">
              {sidebarError}
            </div>
          )}{" "}
          {/* Search Bar */}
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            onSearch={handleSearch}
          />
          {/* Places List */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">
                📍 Helyek ({filteredPlaces.length})
              </h3>
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm("");
                    handleSearch("");
                  }}
                  className="text-cyan-300 hover:text-white text-sm bg-white/10 px-2 py-1 rounded"
                >
                  ✖️ Törlés
                </button>
              )}
            </div>

            {filteredPlaces.length === 0 && !searchTerm && (
              <div className="text-white/60 text-center py-8">
                📍 Nincs még hely hozzáadva.
              </div>
            )}

            {filteredPlaces.length === 0 && searchTerm && (
              <div className="text-white/60 text-center py-8">
                🔍 Nincs találat a keresésre.
              </div>
            )}

            {filteredPlaces.map((place) => (
              <div
                key={place.id}
                className="bg-slate-800/90 backdrop-blur border border-blue-400/30 rounded-2xl p-4 flex flex-col gap-2 hover:bg-slate-700/90 transition cursor-pointer group relative shadow-lg"
              >
                <div className="flex items-center justify-between">
                  <div
                    className="font-bold text-white text-lg truncate max-w-[180px]"
                    title={place.title}
                  >
                    {place.title}
                  </div>
                  <div className="flex gap-1">
                    <button
                      className="text-blue-200 hover:text-white text-sm font-bold px-2 py-1 rounded transition bg-blue-600/80 hover:bg-blue-500/90"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingPlace(place);
                      }}
                      title="Szerkesztés"
                    >
                      ✏️
                    </button>
                    <button
                      className="text-red-200 hover:text-white text-sm font-bold px-2 py-1 rounded transition bg-red-600/80 hover:bg-red-500/90"
                      onClick={(e) => {
                        e.stopPropagation();
                        deletePlace(place.id);
                      }}
                      title="Törlés"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="text-cyan-300 font-semibold text-lg">
                  {place.price}
                </div>
                <div
                  className="text-white/80 text-sm truncate max-w-[220px]"
                  title={place.description}
                >
                  {place.description}
                </div>
                <div className="text-blue-300/60 text-xs">
                  📅 {place.createdAt}
                </div>
                <div className="text-blue-300/60 text-xs">
                  📍 {place.position[0].toFixed(5)},{" "}
                  {place.position[1].toFixed(5)}
                </div>
                <button
                  className="absolute inset-0 w-full h-full opacity-0"
                  onClick={() => setSelectedPlace(place)}
                  aria-label="Részletek megtekintése"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="text-xs text-cyan-300/80 px-6 pb-4 pt-3 border-t border-blue-400/20 bg-slate-900/50">
          🌍 Cím alapján keresés: OpenStreetMap Nominatim
        </div>
      </aside>{" "}
      {/* Map */}
      <div className="flex-1 h-full relative">
        <MapContainer
          center={[47.4979, 19.0402]} // Budapest default
          zoom={13}
          className="w-full h-full z-0"
          style={{ height: "100vh", width: "100vw" }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <MapClickHandler />
          {places.map((place) => (
            <Marker
              key={place.id}
              position={place.position}
              eventHandlers={{
                click: () => setSelectedPlace(place),
              }}
            >
              <Popup>
                <div className="text-center">
                  <h3 className="font-bold text-lg">{place.title}</h3>
                  <p className="text-blue-600 font-semibold">{place.price}</p>
                  <p className="text-gray-600 text-sm">{place.description}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

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
            onSave={editPlace}
            onCancel={() => setEditingPlace(null)}
            isEditing={true}
          />
        )}

        {/* Selected Place Details */}
        {selectedPlace && !editingPlace && (
          <div className="absolute right-8 top-8 z-50 w-[420px] rounded-3xl bg-white/95 p-8 shadow-2xl border border-blue-200 animate-fade-in flex flex-col gap-2">
            <button
              className="absolute top-4 right-4 text-blue-400 hover:text-blue-700 text-2xl font-bold"
              onClick={() => setSelectedPlace(null)}
              aria-label="Bezárás"
            >
              ❌
            </button>
            <h2 className="text-3xl font-extrabold mb-2 text-blue-700">
              {selectedPlace.title}
            </h2>
            <div className="mb-1 text-blue-900 font-semibold text-xl">
              💰 {selectedPlace.price}
            </div>
            <div className="mb-3 text-gray-700 whitespace-pre-line text-base">
              {selectedPlace.description}
            </div>
            <div className="text-xs text-blue-400 mb-2">
              📅 Létrehozva: {selectedPlace.createdAt}
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="text-xs text-blue-400">
                📍 Koordináták: {selectedPlace.position[0].toFixed(5)},{" "}
                {selectedPlace.position[1].toFixed(5)}
              </div>
              <div className="ml-auto flex gap-2">
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold text-sm shadow transition"
                  onClick={() => {
                    setEditingPlace(selectedPlace);
                    setSelectedPlace(null);
                  }}
                >
                  ✏️ Szerkesztés
                </button>
                <button
                  className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold text-sm shadow transition"
                  onClick={() => {
                    deletePlace(selectedPlace.id);
                    setSelectedPlace(null);
                  }}
                >
                  🗑️ Törlés
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MapWithPlaces;
