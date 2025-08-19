import { supabase } from '../lib/supabase'
import type { Place } from '../types/Place'

export class PlacesService {
  // Felhasználó saját helyeinek lekérése (nincs többé nyilvános hely)
  static async getUserPlaces(userId: string): Promise<Place[]> {
    const { data, error } = await supabase
      .from('places')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Hiba a felhasználó helyeinek lekérésekor:', error)
      throw error
    }

    return data || []
  }

  // Új hely létrehozása (mindig privát)
  static async createPlace(place: Omit<Place, 'id' | 'created_at' | 'updated_at'>): Promise<Place> {
    const { data, error } = await supabase
      .from('places')
      .insert([place])
      .select()
      .single()

    if (error) {
      console.error('Hiba a hely létrehozásakor:', error)
      throw error
    }

    return data
  }

  // Hely frissítése
  static async updatePlace(id: string, updates: Partial<Place>): Promise<Place> {
    const { data, error } = await supabase
      .from('places')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Hiba a hely frissítésekor:', error)
      throw error
    }

    return data
  }

  // Hely törlése
  static async deletePlace(id: string): Promise<void> {
    const { error } = await supabase
      .from('places')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Hiba a hely törlésekor:', error)
      throw error
    }
  }

  // Real-time subscription a felhasználó helyeire
  static subscribeToUserPlaces(userId: string, callback: (places: Place[]) => void) {
    const subscription = supabase
      .channel('user_places_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'places',
          filter: `user_id=eq.${userId}`
        },
        async () => {
          // Amikor változás történik, újra lekérjük az adatokat
          try {
            const places = await this.getUserPlaces(userId)
            callback(places)
          } catch (error) {
            console.error('Hiba a real-time frissítéskor:', error)
          }
        }
      )
      .subscribe()

    return subscription
  }
}

// Hook a helyek kezeléséhez
import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

export function usePlaces() {
  const { user } = useAuth()
  const [userPlaces, setUserPlaces] = useState<Place[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Felhasználó helyeinek betöltése
  useEffect(() => {
    const loadUserPlaces = async () => {
      if (!user) {
        setUserPlaces([])
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const places = await PlacesService.getUserPlaces(user.id)
        setUserPlaces(places)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Hiba történt a helyek betöltésekor')
        console.error('Hiba a felhasználó helyeinek betöltésekor:', err)
      } finally {
        setLoading(false)
      }
    }

    loadUserPlaces()

    // Real-time subscription csak ha van bejelentkezett felhasználó
    let subscription: any = null
    if (user) {
      subscription = PlacesService.subscribeToUserPlaces(user.id, setUserPlaces)
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [user])

  const createPlace = async (placeData: Omit<Place, 'id' | 'created_at' | 'updated_at' | 'total_price' | 'user_id'>) => {
    if (!user) throw new Error('Bejelentkezés szükséges')

    try {
      const newPlace = await PlacesService.createPlace({
        ...placeData,
        user_id: user.id
      })
      
      // Helyi state frissítése - minden hely privát
      setUserPlaces(prev => [newPlace, ...prev])
      
      return newPlace
    } catch (err) {
      console.error('Hiba a hely létrehozásakor:', err)
      throw err
    }
  }

  const updatePlace = async (id: string, updates: Partial<Place>) => {
    try {
      const updatedPlace = await PlacesService.updatePlace(id, updates)
      
      // Helyi state frissítése
      setUserPlaces(prev => prev.map(p => p.id === id ? updatedPlace : p))
      
      return updatedPlace
    } catch (err) {
      console.error('Hiba a hely frissítésekor:', err)
      throw err
    }
  }

  const deletePlace = async (id: string) => {
    try {
      await PlacesService.deletePlace(id)
      
      // Helyi state frissítése
      setUserPlaces(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      console.error('Hiba a hely törlésekor:', err)
      throw err
    }
  }

  return {
    places: userPlaces, // Az egyetlen helylista mostantól a felhasználó helyei
    userPlaces,
    loading,
    error,
    createPlace,
    updatePlace,
    deletePlace,
  }
}
