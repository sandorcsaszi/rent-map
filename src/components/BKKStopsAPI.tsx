import { useEffect, useState, useCallback, useMemo } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import {
  bkkApiService,
  type BKKStop,
  type BKKRoute,
} from "../utils/bkkApiService";

// Define the props type for the BKKStopsAPI component
type BKKStopsAPIProps = {
  visible: boolean;
};

// Helper: returns icon HTML with optional selected class
function getStopIconHtml({
  color,
  selected,
}: {
  color: string;
  selected: boolean;
}) {
  return `
    <div class="bkk-stop-icon${
      selected ? " bkk-stop-icon--selected" : ""
    }" style="
      background-color: ${color};
      width: 32px;
      height: 32px;
      border-radius: 10px;
      border: 2px solid white;
      box-shadow: 0 2px 8px 0 rgba(56,189,248,0.18);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      transition: transform 0.18s cubic-bezier(.4,0,.2,1), box-shadow 0.18s;
    ">
      <span style="color: white;">🚌</span>
    </div>
  `;
}

export default function BKKStopsAPI({ visible }: BKKStopsAPIProps) {
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const map = useMap();
  const [stops, setStops] = useState<BKKStop[]>([]);
  const [markers, setMarkers] = useState<L.Marker[]>([]);
  const [lastCenter, setLastCenter] = useState<[number, number] | null>(null);
  const [lastZoom, setLastZoom] = useState<number | null>(null);

  // Debounced API call
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  const shouldUpdateStops = useCallback(
    (center: [number, number], zoom: number) => {
      if (!lastCenter || !lastZoom) return true;

      const distance = Math.sqrt(
        Math.pow(center[0] - lastCenter[0], 2) +
          Math.pow(center[1] - lastCenter[1], 2)
      );

      // Ha 500m-nél többet mozdult a térkép vagy változott a zoom
      return distance > 0.005 || Math.abs(zoom - lastZoom) > 0;
    },
    [lastCenter, lastZoom]
  );

  const loadStops = useCallback(async () => {
    if (!visible) {
      return;
    }

    const center = map.getCenter();
    const zoom = map.getZoom();
    const centerCoords: [number, number] = [center.lat, center.lng];

    if (!shouldUpdateStops(centerCoords, zoom)) {
      return;
    }

    try {
      const stopsData = await bkkApiService.getStopsAroundCenter(
        centerCoords[0],
        centerCoords[1]
      );
      setStops(stopsData);
      setLastCenter(centerCoords);
      setLastZoom(zoom);
    } catch (error) {
      console.error("Hiba a megállók betöltésekor:", error);
    }
  }, [map, visible, shouldUpdateStops]);

  const debouncedLoadStops = useCallback(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const timer = setTimeout(() => {
      loadStops();
    }, 300);

    setDebounceTimer(timer);
  }, [loadStops, debounceTimer]);

  // Markek létrehozása
  const createMarkers = useMemo(() => {
    if (!visible || stops.length === 0) return [];

    return stops.map((stop) => {
      // Szín meghatározása járműtípus alapján
      let color = "#3b82f6"; // default kék
      let vehicleType = "BUS";

      // HÉV detektálás
      if (
        stop.id?.includes("BKK_H") ||
        stop.name?.toLowerCase().includes("hév") ||
        stop.routes?.some((route: BKKRoute) => route.shortName?.startsWith("H"))
      ) {
        color = "#8b5cf6"; // lila
        vehicleType = "HÉV";
      }
      // Metró típusok
      else if (
        stop.routes?.some((route: BKKRoute) => route.shortName === "M1")
      ) {
        color = "#fbbf24"; // sárga
        vehicleType = "M1";
      } else if (
        stop.routes?.some((route: BKKRoute) => route.shortName === "M2")
      ) {
        color = "#ef4444"; // piros
        vehicleType = "M2";
      } else if (
        stop.routes?.some((route: BKKRoute) => route.shortName === "M3")
      ) {
        color = "#3b82f6"; // kék
        vehicleType = "M3";
      } else if (
        stop.routes?.some((route: BKKRoute) => route.shortName === "M4")
      ) {
        color = "#22c55e"; // zöld
        vehicleType = "M4";
      }
      // Villamos
      else if (
        stop.routes?.some((route: BKKRoute) => {
          const routeNum = parseInt(route.shortName || "");
          return (
            routeNum >= 1 && routeNum <= 69 && route.shortName?.length <= 2
          );
        })
      ) {
        color = "#fbbf24"; // sárga
        vehicleType = "TRAM";
      }
      // Busz (minden más)
      else {
        color = "#3b82f6"; // kék
        vehicleType = "BUS";
      }

      // Ikon létrehozása (nagyobb, szögletes, csak selected-re pulzál)
      const selected = stop.id === selectedStopId;
      const iconHtml = getStopIconHtml({ color, selected });
      const icon = L.divIcon({
        html: iconHtml,
        className: "",
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      });

      // Popup tartalom generálása
      let popupContent = `<div style="font-family: Arial, sans-serif;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: bold;">${stop.name}</h3>
        <p style="margin: 0 0 5px 0; font-size: 12px; color: #666;">Típus: ${vehicleType}</p>`;

      if (stop.routes && stop.routes.length > 0) {
        popupContent += `<div style="margin-top: 8px;">
          <p style="margin: 0 0 5px 0; font-size: 12px; font-weight: bold;">Járatok:</p>
          <div style="display: flex; flex-wrap: wrap; gap: 4px;">`;

        stop.routes.forEach((route: BKKRoute) => {
          let routeColor = "#666";

          // Metró színek
          if (route.shortName === "M1") routeColor = "#fbbf24";
          else if (route.shortName === "M2") routeColor = "#ef4444";
          else if (route.shortName === "M3") routeColor = "#3b82f6";
          else if (route.shortName === "M4") routeColor = "#22c55e";
          // HÉV
          else if (route.shortName?.startsWith("H")) routeColor = "#8b5cf6";
          // Villamos (1-69)
          else if (/^[1-6]?\d$/.test(route.shortName || "")) {
            const num = parseInt(route.shortName || "");
            if (num >= 1 && num <= 69) routeColor = "#f59e0b";
          }
          // Busz (minden más)
          else routeColor = "#3b82f6";

          popupContent += `
            <span style="
              background-color: ${routeColor};
              color: white;
              padding: 2px 6px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: bold;
              margin: 1px;
            ">${route.shortName}</span>`;
        });

        popupContent += `</div></div>`;
      }

      popupContent += `</div>`;

      // Marker létrehozása
      const marker = L.marker([stop.lat, stop.lon], { icon });
      marker.bindPopup(popupContent);
      marker.on("click", () => setSelectedStopId(stop.id));
      marker.on("mouseover", () => setSelectedStopId(stop.id));
      marker.on("mouseout", () => setSelectedStopId(null));
      return marker;
    });
  }, [visible, stops, selectedStopId]);

  // Markerek hozzáadása/eltávolítása a térképről
  useEffect(() => {
    // Régi markerek eltávolítása
    markers.forEach((marker) => {
      map.removeLayer(marker);
    });

    if (visible) {
      // Új markerek hozzáadása
      const newMarkers = createMarkers;
      newMarkers.forEach((marker) => {
        map.addLayer(marker);
      });
      setMarkers(newMarkers);
    } else {
      setMarkers([]);
    }

    return () => {
      // Cleanup: markerek eltávolítása
      markers.forEach((marker) => {
        if (map.hasLayer(marker)) {
          map.removeLayer(marker);
        }
      });
    };
  }, [visible, createMarkers, map]);

  // Térkép események kezelése
  useEffect(() => {
    if (!visible) {
      // Ha nem látható, töröljük a megállókat és markereket
      setStops([]);
      setLastCenter(null);
      setLastZoom(null);
      return;
    }

    const handleMoveEnd = () => {
      debouncedLoadStops();
    };

    const handleZoomEnd = () => {
      debouncedLoadStops();
    };

    map.on("moveend", handleMoveEnd);
    map.on("zoomend", handleZoomEnd);

    // Kezdeti betöltés
    loadStops();

    return () => {
      map.off("moveend", handleMoveEnd);
      map.off("zoomend", handleZoomEnd);
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [map, visible, debouncedLoadStops, loadStops, debounceTimer]);

  return null;
}
