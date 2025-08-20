import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import type { Place } from "../types/Place";
import PinComponent from "./PinComponent";
import BKKStopsAPI from "./BKKStopsAPI";
import { useState, useEffect, memo } from "react";

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

interface MapComponentProps {
  places: Place[];
  onMapClick: (position: [number, number]) => void;
  onPinClick: (place: Place) => void;
  center?: [number, number];
  zoom?: number;
  showAllPopups?: boolean;
  onTogglePopups?: (show: boolean) => void;
}

function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (position: [number, number]) => void;
}) {
  useMapEvents({
    click(e) {
      onMapClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

// Komponens a térkép újrarajzolásához
function MapResizer() {
  const map = useMap();

  useEffect(() => {
    const resizeMap = () => {
      setTimeout(() => {
        map.invalidateSize();
      }, 100);
    };

    // Kezdeti újrarajzolás
    resizeMap();

    // Window resize listener
    window.addEventListener("resize", resizeMap);

    // Sidebar változásokra is figyelünk
    const observer = new MutationObserver(resizeMap);
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
    });

    return () => {
      window.removeEventListener("resize", resizeMap);
      observer.disconnect();
    };
  }, [map]);

  return null;
}

const MapComponent = memo(function MapComponent({
  places,
  onMapClick,
  onPinClick,
  center = [47.4979, 19.0402], // Budapest default
  zoom = 13,
  showAllPopups = false,
  onTogglePopups,
}: MapComponentProps) {
  const [showBKKStops, setShowBKKStops] = useState(false);

  return (
    <div className="flex-1 h-full relative">
      {/* Toggle gombok */}
      <button
        onClick={() => setShowBKKStops(!showBKKStops)}
        style={{
          position: "absolute",
          top: "50px",
          left: "50px",
          zIndex: 1000,
          padding: "8px 12px",
          backgroundColor: showBKKStops ? "#3b82f6" : "#ffffff",
          color: showBKKStops ? "#ffffff" : "#3b82f6",
          border: "2px solid #3b82f6",
          borderRadius: "8px",
          fontSize: "12px",
          fontWeight: "600",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          transition: "all 0.2s",
        }}
        title="Tömegközlekedési megállók megjelenítése"
      >
        {showBKKStops ? "🚌 Megállók elrejtése" : "🚌 Megállók mutatása"}
      </button>

      {/* Állandó popup toggle */}
      <button
        onClick={() => {
          if (onTogglePopups) {
            onTogglePopups(!showAllPopups);
          }
        }}
        style={{
          position: "absolute",
          top: "10px",
          left: "50px",
          zIndex: 1000,
          padding: "8px 12px",
          backgroundColor: showAllPopups ? "#3b82f6" : "#ffffff",
          color: showAllPopups ? "#ffffff" : "#3b82f6",
          border: "2px solid #3b82f6",
          borderRadius: "8px",
          fontSize: "12px",
          fontWeight: "600",
          cursor: "pointer",
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          transition: "all 0.2s",
        }}
      >
        {showAllPopups ? "📍 Címkék elrejtése" : "📍 Címkék megjelenítése"}
      </button>

      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full z-0"
        style={{ height: "100vh", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <MapClickHandler onMapClick={onMapClick} />
        <MapResizer />
        <BKKStopsAPI visible={showBKKStops} />
        {places.map((place) => (
          <PinComponent
            key={place.id}
            place={place}
            onClick={() => onPinClick(place)}
            showPopup={showAllPopups}
          />
        ))}
      </MapContainer>
    </div>
  );
});

// Display name for debugging
MapComponent.displayName = "MapComponent";

export default MapComponent;
