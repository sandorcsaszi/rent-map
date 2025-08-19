// Supabase-kompatibilis Place típus
export interface Place {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  address?: string;
  lat: number;
  lng: number;
  rent_price?: number;
  deposit_price?: number;
  utilities_price?: number;
  total_price?: number;
  room_count?: number;
  property_type?: 'apartment' | 'house' | 'room' | 'other';
  is_public: boolean;
  created_at: string;
  updated_at: string;
  // Régi kompatibilitáshoz
  position?: [number, number];
  title?: string;
  price?: string;
  createdAt?: string;
  link?: string;
  images?: string[];
  // Régi szűrő mezők
  rentPrice?: number;
  utilityCost?: number;
  commonCost?: number;
  floor?: number;
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
