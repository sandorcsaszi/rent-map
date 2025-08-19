// Supabase-kompatibilis Place típus
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
  room_count?: number;
  property_type?: string;
  floor?: number;
  has_elevator?: boolean;
  link?: string;
  is_public: boolean; // Minden hely privát lesz
  created_at: string;
  updated_at: string;
  // Régi kompatibilitáshoz
  position?: [number, number];
  price?: string;
  createdAt?: string;
  // Régi szűrő mezők (kompatibilitás)
  rentPrice?: number;
  utilityCost?: number;
  commonCost?: number;
  hasElevator?: boolean;
}

export interface PlaceFormData {
  name: string;
  description?: string;
  address?: string;
  rent_price?: number;
  deposit_price?: number;
  utilities_price?: number;
  room_count?: number;
  property_type?: 'apartment' | 'house' | 'room' | 'other';
  is_public: boolean;
  // Kompatibilitás
  title?: string;
  price?: string;
  link?: string;
  images?: string[];
  rentPrice?: number;
  utilityCost?: number;
  commonCost?: number;
  floor?: number;
  hasElevator?: boolean;
}

export interface FilterCriteria {
  minPrice?: number;
  maxPrice?: number;
  minFloor?: number;
  maxFloor?: number;
  hasElevator?: boolean | null;
}
