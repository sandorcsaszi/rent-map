// Supabase-kompatibilis Place típus - pontosan az adatbázis sémának megfelelően
export interface Place {
  id: string;
  user_id: string;
  name: string;
  title?: string;
  description?: string;
  address?: string;
  lat: number;
  lng: number;
  rent_price?: number;
  utility_cost?: number;
  common_cost?: number;
  floor?: number;
  has_elevator?: boolean;
  link?: string;
  created_at: string;
  updated_at: string;
  // Régi kompatibilitáshoz a UI számára
  position?: [number, number];
  price?: string;
  createdAt?: string;
  rentPrice?: number;
  utilityCost?: number;
  commonCost?: number;
  hasElevator?: boolean;
}

export interface PlaceFormData {
  name: string;
  title?: string;
  description?: string;
  address?: string;
  rent_price?: number;
  utility_cost?: number;
  common_cost?: number;
  floor?: number;
  has_elevator?: boolean;
  link?: string;
  // Kompatibilitás a régi UI-val
  price?: string;
  rentPrice?: number;
  utilityCost?: number;
  commonCost?: number;
  hasElevator?: boolean;
}

export interface FilterCriteria {
  minPrice?: number;
  maxPrice?: number;
  minFloor?: number;
  maxFloor?: number;
  hasElevator?: boolean | null;
}
