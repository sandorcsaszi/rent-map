import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase URL és ANON KEY szükséges! Ellenőrizd a .env fájlt.'
  )
}

// Custom storage that automatically clears on auth errors
const createCustomStorage = () => {
  return {
    getItem: (key: string) => {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (key: string, value: string) => {
      try {
        localStorage.setItem(key, value);
      } catch {
        // Ignore storage errors
      }
    },
    removeItem: (key: string) => {
      try {
        localStorage.removeItem(key);
      } catch {
        // Ignore storage errors
      }
    },
  };
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Custom storage a jobb session kezeléshez
    storage: createCustomStorage(),
    // Debug mód fejlesztéshez
    debug: false,
    // Flow type beállítása
    flowType: 'pkce',
    // Storage key egyedi legyen
    storageKey: 'sb-auth-token',
  },
  // Globális beállítások
  global: {
    headers: {
      'x-application-name': 'rent-map',
    },
  },
})

// Típusok az adatbázis táblákhoz
export interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}
