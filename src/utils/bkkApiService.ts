export interface BKKRoute {
  id: string;
  shortName: string;
  description: string;
  type: 'BUS' | 'TRAM' | 'SUBWAY' | 'RAIL';
  color: string;
  textColor: string;
}

export interface BKKStop {
  id: string;
  name: string;
  lat: number;
  lon: number;
  code?: string;
  direction?: string;
  type?: string;
  routes?: BKKRoute[];
  stopType: 'bus' | 'tram' | 'metro1' | 'metro2' | 'metro3' | 'metro4' | 'suburban' | 'other';
}

export interface BKKApiResponse {
  status: string;
  currentTime: number;
  version: number;
  code: number;
  text: string;
  data: {
    list: Array<{
      id: string;
      name: string;
      lat: number;
      lon: number;
      code?: string;
      direction?: string;
      type: 'BUS' | 'SUBWAY' | 'TRAM' | 'RAIL';
      routeIds?: string[];
      stopColorType?: string;
      style?: any;
    }>;
    references: {
      routes: Record<string, {
        id: string;
        shortName: string;
        description: string;
        type: 'BUS' | 'TRAM' | 'SUBWAY' | 'RAIL';
        color: string;
        textColor: string;
      }>;
      stops: Record<string, any>;
    };
  };
}

class BKKApiService {
  private apiKey: string;
  private baseUrl: string;
  private cache = new Map<string, BKKStop[]>();
  private cacheTimestamp = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 perc cache

  constructor() {
    this.apiKey = import.meta.env.VITE_BKK_API_KEY || '';
    this.baseUrl = import.meta.env.VITE_BKK_API_URL || 'https://futar.bkk.hu/api/query/v1/ws/otp/api/where';
    
    if (!this.apiKey) {
      console.warn('BKK API kulcs nincs beállítva! Állítsd be a VITE_BKK_API_KEY environment változót.');
    }
  }

  private determineStopType(stop: any, routes: Record<string, BKKRoute>): 'bus' | 'tram' | 'metro1' | 'metro2' | 'metro3' | 'metro4' | 'suburban' | 'other' {
    // Először ellenőrizzük a megálló ID-jét - HÉV megállók (több variáció)
    if (stop.id) {
      const id = stop.id.toString().toUpperCase();
      if (id.includes('BKK_H') || 
          id.includes('_H') || 
          id.startsWith('H') ||
          id.includes('HEV') ||
          id.includes('HÉV')) {
        return 'suburban';
      }
    }

    // Név alapú HÉV azonosítás (még erősebb)
    const name = stop.name?.toLowerCase() || '';
    if (name.includes('hév') || 
        name.includes('vasútállomás') || 
        name.includes('h5') || name.includes('h6') || name.includes('h7') || name.includes('h8') || name.includes('h9') ||
        name.includes('szentendre') || 
        name.includes('csepel') || 
        name.includes('ráckeve') || 
        name.includes('gödöllő') ||
        name.includes('batthyány') && name.includes('hév') ||
        name.includes('margit híd') && name.includes('hév')) {
      return 'suburban';
    }

    // Járatok alapján HÉV azonosítás
    if (stop.routeIds && routes) {
      for (const routeId of stop.routeIds) {
        const route = routes[routeId];
        if (route && route.shortName) {
          const shortName = route.shortName.toLowerCase();
          if (shortName.startsWith('h') && /h[5-9]/.test(shortName)) {
            return 'suburban';
          }
        }
      }
    }

    // Ezután a stop típusa alapján
    if (stop.type === 'RAIL') {
      return 'suburban';
    }

    if (stop.type === 'SUBWAY') {
      // Nézzük meg a routeIds-ből melyik metró vonal
      if (stop.routeIds) {
        for (const routeId of stop.routeIds) {
          const route = routes[routeId];
          if (route && route.shortName) {
            const shortName = route.shortName.toLowerCase();
            if (shortName === 'm1' || shortName === '1') return 'metro1';
            if (shortName === 'm2' || shortName === '2') return 'metro2';
            if (shortName === 'm3' || shortName === '3') return 'metro3';
            if (shortName === 'm4' || shortName === '4') return 'metro4';
          }
        }
      }
      return 'metro1'; // alapértelmezett
    }

    if (stop.type === 'TRAM') {
      return 'tram';
    }

    if (stop.type === 'BUS') {
      return 'bus';
    }

    // Kézi HÉV megálló lista ismert problémás esetekre
    const knownHevStops = [
      'batthyány tér h',
      'margit híd h',
      'filatorigát h',
      'szépvölgyi út h',
      'rómaifürdő h',
      'aquincum h',
      'békásmegyer h',
      'pomáz h',
      'szentendre h'
    ];
    
    if (knownHevStops.some(hevStop => name.includes(hevStop))) {
      return 'suburban';
    }

    // Metró vonalak névben való keresése
    if (name.includes('m1') || name.includes('földalatti') || name.includes('millenniumi')) {
      return 'metro1';
    }
    if (name.includes('m2') || name.includes('déli pályaudvar') || name.includes('örs vezér')) {
      return 'metro2';
    }
    if (name.includes('m3') || name.includes('újpest') || name.includes('kőbánya-kispest')) {
      return 'metro3';
    }
    if (name.includes('m4') || name.includes('kelenföldi') || name.includes('keleti pályaudvar')) {
      return 'metro4';
    }

    return 'bus'; // Alapértelmezett
  }

  private async fetchStops(centerLat: number, centerLon: number): Promise<BKKStop[]> {
    if (!this.apiKey) {
      throw new Error('BKK API kulcs nincs beállítva');
    }

    try {
      // BKK Futár API: stops-for-location endpoint - 500m
      const response = await fetch(
        `${this.baseUrl}/stops-for-location.json?key=${this.apiKey}&lat=${centerLat}&lon=${centerLon}&radius=500&maxCount=100`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`BKK API hiba: ${response.status} ${response.statusText}`);
      }

      const data: BKKApiResponse = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(`BKK API válasz hiba: ${data.status}`);
      }

      const routes = data.data.references?.routes || {};
      
      // A list array-ből dolgozunk
      const stopsArray: BKKStop[] = data.data.list.map(stop => {
        // Járatok összegyűjtése
        const stopRoutes: BKKRoute[] = (stop.routeIds || []).map(routeId => {
          const route = routes[routeId];
          return route ? {
            id: route.id,
            shortName: route.shortName,
            description: route.description,
            type: route.type,
            color: route.color,
            textColor: route.textColor,
          } : null;
        }).filter(Boolean) as BKKRoute[];

        return {
          id: stop.id,
          name: stop.name,
          lat: stop.lat,
          lon: stop.lon,
          code: stop.code,
          direction: stop.direction,
          type: stop.type,
          routes: stopRoutes,
          stopType: this.determineStopType(stop, routes),
        };
      });

      return stopsArray;

    } catch (error) {
      console.error('BKK API hívás sikertelen:', error);
      throw error;
    }
  }

  async getStopsAroundCenter(centerLat: number, centerLon: number): Promise<BKKStop[]> {
    const now = Date.now();
    const cacheKey = `stops_${centerLat.toFixed(4)}_${centerLon.toFixed(4)}`;

    // Cache ellenőrzés
    if (this.cache.has(cacheKey) && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
      return this.cache.get(cacheKey)!;
    }

    try {
      const stops = await this.fetchStops(centerLat, centerLon);
      this.cache.set(cacheKey, stops);
      this.cacheTimestamp = now;
      return stops;
    } catch (error) {
      // Ha van cache-elt adat és az API hívás sikertelen, azt adjuk vissza
      if (this.cache.has(cacheKey)) {
        console.warn('BKK API hívás sikertelen, cache-elt adatok használata');
        return this.cache.get(cacheKey)!;
      }
      throw error;
    }
  }

  // Backward compatibility
  async getStops(): Promise<BKKStop[]> {
    return this.getStopsAroundCenter(47.4979, 19.0402); // Budapest központ
  }

  async getStopsInBounds(bounds: { north: number; south: number; east: number; west: number }): Promise<BKKStop[]> {
    // A bounds középpontját számoljuk ki
    const centerLat = (bounds.north + bounds.south) / 2;
    const centerLon = (bounds.east + bounds.west) / 2;
    
    const allStops = await this.getStopsAroundCenter(centerLat, centerLon);
    
    return allStops.filter(stop => 
      stop.lat >= bounds.south &&
      stop.lat <= bounds.north &&
      stop.lon >= bounds.west &&
      stop.lon <= bounds.east
    );
  }

  clearCache(): void {
    this.cache.clear();
    this.cacheTimestamp = 0;
  }
}

export const bkkApiService = new BKKApiService();
