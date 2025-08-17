// Address suggestion interface
export interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  place_id: string;
}

// Simple geocoding using Nominatim API
export async function geocodeAddress(address: string): Promise<[number, number] | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (data && data.length > 0) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
    }
  } catch (error) {
    console.error('Geocoding error:', error);
  }
  return null;
}

// Search for address suggestions with AbortController support
export async function searchAddresses(query: string, signal?: AbortSignal): Promise<AddressSuggestion[]> {
  if (query.length < 2) return [];
  
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&countrycodes=hu&addressdetails=1&dedupe=1`;
    const res = await fetch(url, { 
      signal,
      headers: {
        'User-Agent': 'RentMapApp/1.0'
      }
    });
    
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    
    const data = await res.json();
    return data || [];
  } catch (error) {
    if (signal?.aborted) {
      throw new Error('AbortError');
    }
    console.error('Address search error:', error);
    return [];
  }
}
