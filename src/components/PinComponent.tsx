import { Marker, Popup, Tooltip } from "react-leaflet";
import type { Place } from "../types/Place";

interface PinComponentProps {
  place: Place;
  onClick: () => void;
  showPopup?: boolean;
}

export default function PinComponent({
  place,
  onClick,
  showPopup = false,
}: PinComponentProps) {
  // Költségek kiszámítása
  const getTotalCost = (): string => {
    const rent = place.rentPrice || 0;
    const utility = place.utilityCost || 0;
    const common = place.commonCost || 0;
    const total = rent + utility + common;

    if (total > 0) {
      return `${(total / 1000).toFixed(0)} ezer Ft/hó`;
    }
    return place.price || "Ár nincs megadva";
  };

  return (
    <Marker
      position={place.position}
      eventHandlers={{
        click: onClick,
      }}
    >
      {showPopup ? (
        <Tooltip permanent direction="top" className="custom-tooltip">
          <div className="text-center">
            <h3 className="font-bold text-base">{place.title}</h3>
            <p className="text-blue-600 font-semibold text-sm">
              {getTotalCost()}
            </p>
            {place.floor !== undefined && (
              <p className="text-gray-600 text-xs">🏢 {place.floor}. emelet</p>
            )}
            {place.hasElevator !== undefined && (
              <p className="text-gray-600 text-xs">
                🛗 {place.hasElevator ? "Van lift" : "Nincs lift"}
              </p>
            )}
          </div>
        </Tooltip>
      ) : (
        <Popup>
          <div className="text-center">
            <h3 className="font-bold text-lg">{place.title}</h3>
            <p className="text-blue-600 font-semibold">{getTotalCost()}</p>
            {place.floor !== undefined && (
              <p className="text-gray-600 text-sm">🏢 {place.floor}. emelet</p>
            )}
            {place.hasElevator !== undefined && (
              <p className="text-gray-600 text-sm">
                🛗 {place.hasElevator ? "Van lift" : "Nincs lift"}
              </p>
            )}
            <p className="text-gray-600 text-sm">{place.description}</p>
          </div>
        </Popup>
      )}
    </Marker>
  );
}
