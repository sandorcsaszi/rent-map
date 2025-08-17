export interface Place {
  id: number;
  position: [number, number];
  title: string;
  price: string;
  description: string;
  createdAt: string;
  link?: string;
  images?: string[];
  address?: string; // Cím mező hozzáadása
  // Új szűrő mezők
  rentPrice?: number;
  utilityCost?: number;
  commonCost?: number;
  floor?: number;
  hasElevator?: boolean;
}

export interface PlaceFormData {
  title: string;
  price: string;
  description: string;
  address?: string;
  link?: string;
  images?: string[];
  // Új mezők
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
