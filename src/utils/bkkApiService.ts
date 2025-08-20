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
  private cacheTimestamps = new Map<string, number>();
  private pendingRequests = new Map<string, Promise<BKKStop[]>>();
  private readonly CACHE_DURATION = 20 * 60 * 1000; // 20 perc cache (növelve teljesítményért)
  private readonly MIN_DISTANCE_FOR_NEW_REQUEST = 300; // 300m minimum távolság (optimalizált)
  private readonly REQUEST_THROTTLE_MS = 800; // 800ms minimum két kérés között (gyorsabb)
  private lastRequestTime = 0;
  
  // Statisztikák
  private stats = {
    totalRequests: 0,
    cacheHits: 0,
    nearCacheHits: 0,
    apiCalls: 0
  };

  constructor() {
    this.apiKey = import.meta.env.VITE_BKK_API_KEY || '';
    this.baseUrl = import.meta.env.VITE_BKK_API_URL || 'https://futar.bkk.hu/api/query/v1/ws/otp/api/where';
    
    if (!this.apiKey) {
      console.warn('BKK API kulcs nincs beállítva! Állítsd be a VITE_BKK_API_KEY environment változót.');
    }
  }

  // Távolság számítás két koordináta között (Haversine formula)
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Föld sugara méterben
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  // Legközelebbi cache bejegyzés keresése
  private findNearestCacheEntry(lat: number, lon: number): { key: string; distance: number; data: BKKStop[] } | null {
    let nearest: { key: string; distance: number; data: BKKStop[] } | null = null;
    
    for (const [key, data] of this.cache.entries()) {
      const timestamp = this.cacheTimestamps.get(key);
      if (!timestamp || Date.now() - timestamp > this.CACHE_DURATION) continue;
      
      const [, latStr, lonStr] = key.split('_');
      const cachedLat = parseFloat(latStr);
      const cachedLon = parseFloat(lonStr);
      const distance = this.calculateDistance(lat, lon, cachedLat, cachedLon);
      
      if (!nearest || distance < nearest.distance) {
        nearest = { key, distance, data };
      }
    }
    
    return nearest;
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

    // Throttling: várunk, ha túl gyakran hívjuk az API-t
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.REQUEST_THROTTLE_MS) {
      await new Promise(resolve => setTimeout(resolve, this.REQUEST_THROTTLE_MS - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();

    try {
      // BKK Futár API: stops-for-location endpoint - 1000m
      const response = await fetch(
        `${this.baseUrl}/stops-for-location.json?key=${this.apiKey}&lat=${centerLat}&lon=${centerLon}&radius=1000&maxCount=100`,
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
    this.stats.totalRequests++;
    
    const now = Date.now();
    const cacheKey = `stops_${centerLat.toFixed(4)}_${centerLon.toFixed(4)}`;

    // 1. Pontos cache ellenőrzés
    const cacheTimestamp = this.cacheTimestamps.get(cacheKey);
    if (this.cache.has(cacheKey) && cacheTimestamp && (now - cacheTimestamp) < this.CACHE_DURATION) {
      this.stats.cacheHits++;
      return this.cache.get(cacheKey)!;
    }

    // 2. Közeli cache bejegyzés keresése
    const nearest = this.findNearestCacheEntry(centerLat, centerLon);
    if (nearest && nearest.distance < this.MIN_DISTANCE_FOR_NEW_REQUEST) {
      this.stats.nearCacheHits++;
      
      // Ha van elég közeli cache, azt használjuk és szűrjük a 1000m-es körre
      const filteredStops = nearest.data.filter(stop => {
        const distance = this.calculateDistance(centerLat, centerLon, stop.lat, stop.lon);
        return distance <= 1000; // 1000m radius
      });
      
      // Cache-eljük az új pozícióra is
      this.cache.set(cacheKey, filteredStops);
      this.cacheTimestamps.set(cacheKey, now);
      
      return filteredStops;
    }

    // 3. Ellenőrizzük, hogy már folyamatban van-e ez a kérés
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)!;
    }

    // 4. Új API kérés
    this.stats.apiCalls++;
    const requestPromise = this.fetchStops(centerLat, centerLon);
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const stops = await requestPromise;
      this.cache.set(cacheKey, stops);
      this.cacheTimestamps.set(cacheKey, now);
      this.pendingRequests.delete(cacheKey);
      return stops;
    } catch (error) {
      this.pendingRequests.delete(cacheKey);
      
      // Ha van cache-elt adat és az API hívás sikertelen, azt adjuk vissza
      if (this.cache.has(cacheKey)) {
        console.warn('BKK API hívás sikertelen, cache-elt adatok használata');
        return this.cache.get(cacheKey)!;
      }
      
      // Ha van közeli cache, azt használjuk fallback-ként
      if (nearest) {
        console.warn('BKK API hívás sikertelen, közeli cache használata');
        return nearest.data.filter(stop => {
          const distance = this.calculateDistance(centerLat, centerLon, stop.lat, stop.lon);
          return distance <= 1000;
        });
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
    this.cacheTimestamps.clear();
    this.pendingRequests.clear();
  }

  // Statisztikák lekérése és teljesítmény követés
  getStats() {
    const cacheEfficiency = this.stats.totalRequests > 0 
      ? ((this.stats.cacheHits + this.stats.nearCacheHits) / this.stats.totalRequests * 100).toFixed(1)
      : '0';
      
    return {
      ...this.stats,
      cacheEfficiency: `${cacheEfficiency}%`,
      cacheSize: this.cache.size
    };
  }

  resetStats(): void {
    this.stats = {
      totalRequests: 0,
      cacheHits: 0,
      nearCacheHits: 0,
      apiCalls: 0
    };
  }
}

export const bkkApiService = new BKKApiService();
