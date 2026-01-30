// IoT Gateway és Sensor típusok

/**
 * Támogatott szenzor típusok
 */
export type SensorType = 
  | 'temperature'
  | 'humidity'
  | 'air_quality'
  | 'noise_level'
  | 'light_level'
  | 'motion'
  | 'door_window'
  | 'smoke'
  | 'co2'
  | 'pressure';

/**
 * Mértékegységek
 */
export type SensorUnit = 
  | 'celsius'
  | 'fahrenheit'
  | 'percent'
  | 'ppm'
  | 'aqi'
  | 'decibels'
  | 'lux'
  | 'boolean'
  | 'count'
  | 'hPa'
  | 'mbar';

/**
 * Egyedi szenzor leolvasás
 */
export interface SensorReading {
  sensor_id: string;
  sensor_type: SensorType;
  value: number;
  unit: SensorUnit;
  timestamp: string; // ISO 8601 formátum
}

/**
 * Gateway lokáció adatok
 */
export interface GatewayLocation {
  lat: number;
  lng: number;
}

/**
 * Gateway metaadatok
 */
export interface GatewayMetadata {
  firmware_version: string;
  battery_level?: number; // 0-100 százalék
  signal_strength?: number; // dBm
}

/**
 * IoT Gateway által küldött teljes adat payload
 */
export interface IoTSensorPayload {
  gateway_id: string;
  timestamp: string; // ISO 8601 formátum
  place_id: string; // Kapcsolódó Place UUID
  sensors: SensorReading[];
  location?: GatewayLocation;
  metadata?: GatewayMetadata;
}

/**
 * API válasz típus
 */
export interface IoTSensorResponse {
  success: boolean;
  message: string;
  data_id?: string;
  timestamp?: string;
  error?: string;
  details?: string;
}

/**
 * Szenzor adatok szűrési kritériumok
 */
export interface SensorDataFilter {
  gateway_id?: string;
  place_id?: string;
  sensor_type?: SensorType;
  start_date?: string;
  end_date?: string;
}

/**
 * Aggregált szenzor adatok (statisztika)
 */
export interface SensorStatistics {
  sensor_type: SensorType;
  min: number;
  max: number;
  avg: number;
  count: number;
  period: 'hour' | 'day' | 'week' | 'month';
}

/**
 * Gateway regisztráció típus
 */
export interface IoTGatewayRegistration {
  gateway_id: string;
  place_id: string;
  name: string;
  description?: string;
  location: GatewayLocation;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

/**
 * Helper funkció: Szenzor típus emberi olvasható név
 */
export const getSensorTypeName = (type: SensorType): string => {
  const names: Record<SensorType, string> = {
    temperature: 'Hőmérséklet',
    humidity: 'Páratartalom',
    air_quality: 'Levegő minőség',
    noise_level: 'Zajszint',
    light_level: 'Fényerő',
    motion: 'Mozgásérzékelő',
    door_window: 'Ajtó/Ablak',
    smoke: 'Füstérzékelő',
    co2: 'CO2 szint',
    pressure: 'Légnyomás'
  };
  return names[type] || type;
};

/**
 * Helper funkció: Mértékegység megjelenítése
 */
export const formatSensorUnit = (unit: SensorUnit): string => {
  const units: Record<SensorUnit, string> = {
    celsius: '°C',
    fahrenheit: '°F',
    percent: '%',
    ppm: 'ppm',
    aqi: 'AQI',
    decibels: 'dB',
    lux: 'lx',
    boolean: '',
    count: 'db',
    hPa: 'hPa',
    mbar: 'mbar'
  };
  return units[unit] || unit;
};

/**
 * Helper funkció: Szenzor értékek validálása
 */
export const validateSensorReading = (reading: SensorReading): boolean => {
  // Alapvető ellenőrzések
  if (!reading.sensor_id || !reading.sensor_type || reading.value === undefined) {
    return false;
  }

  // Típus specifikus validáció
  switch (reading.sensor_type) {
    case 'temperature':
      return reading.value >= -50 && reading.value <= 100;
    case 'humidity':
      return reading.value >= 0 && reading.value <= 100;
    case 'noise_level':
      return reading.value >= 0 && reading.value <= 150;
    case 'light_level':
      return reading.value >= 0;
    case 'motion':
    case 'door_window':
    case 'smoke':
      return reading.value === 0 || reading.value === 1;
    case 'co2':
      return reading.value >= 0 && reading.value <= 10000;
    case 'air_quality':
      return reading.value >= 0;
    case 'pressure':
      return reading.value >= 900 && reading.value <= 1100;
    default:
      return true;
  }
};
