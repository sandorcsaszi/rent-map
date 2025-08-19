# BKK Megállók Funkció

## 🚌 Mit csinál

A **BKK Megállók** funkció a Budapest Közlekedési Központ (BKK) Futár API-ját használja, hogy valós idejű tömegközlekedési megálló adatokat jelenítsen meg a térképen.

## 🎨 Színkódolás

A megállók különböző színekkel vannak jelölve a járműtípusok szerint:

- **🚌 Kék**: Busz megállók
- **🚋 Sárga**: Villamos megállók  
- **Ⓜ️ Sárga**: M1 metró megállók
- **Ⓜ️ Piros**: M2 metró megállók
- **Ⓜ️ Kék**: M3 metró megállók
- **Ⓜ️ Zöld**: M4 metró megállók
- **🚊 Lila**: HÉV állomások

## 🔍 Működés

1. **1 km-es kör**: A térkép középpontjától 1 km-es körzetben kéri le a megállókat
2. **Dinamikus frissítés**: Térkép mozgatásakor automatikusan frissül
3. **Cache-elés**: 5 percig cache-eli az adatokat a teljesítmény érdekében
4. **Maximum 100 megálló**: Teljesítmény optimalizálás
5. **Intelligens típus felismerés**: 
   - HÉV megállók: ID alapján (`BKK_H`, `_H`) és név alapján
   - API type felülbírálás HÉV megállóknál (BUS → HÉV)

## 📍 Popup információk

Megállóra kattintva megjelenik:
- **Megálló neve**: Teljes név
- **Kód**: BKK megálló kódja
- **Járatok**: Lekerekített színes négyzetekben
  - Saját BKK színekkel
  - Járatszámok (pl: M4, 19, 107, stb.)

## 🛠️ Technikai részletek

### API végpont
```
https://futar.bkk.hu/api/query/v1/ws/otp/api/where/stops-for-location.json
```

### Paraméterek
- `key`: BKK API kulcs
- `lat`, `lon`: Térkép középpontja
- `radius`: 500 (méterben)
- `maxCount`: 100

### Válasz feldolgozás
- `data.list[]`: Megállók listája
- `data.references.routes[]`: Járat információk
- Automatikus típus felismerés

### Színkódok
```typescript
bus: '#2563eb'      // kék
tram: '#eab308'     // sárga  
metro1: '#eab308'   // sárga (M1)
metro2: '#ef4444'   // piros (M2)
metro3: '#2563eb'   // kék (M3)
metro4: '#22c55e'   // zöld (M4)
suburban: '#8b5cf6' // lila (HÉV)
```

## 📱 Használat

1. Nyisd meg a térképet
2. Kattints a **"🚌 Megállók mutatása"** gombra
3. Mozgasd a térképet - automatikusan frissül
4. Kattints egy megállóra a részletek megtekintéséhez

## ⚡ Optimalizálás

- **Cache**: 5 perces client-side cache
- **Limit**: Maximum 100 megálló egyszerre
- **Radius**: 1 km-es kör a teljesítmény érdekében
- **Hot reload**: Vite HMR támogatás fejlesztés során

## 🔧 Beállítás

A `.env` fájlban:
```env
VITE_BKK_API_KEY=your_api_key_here
```

API kulcs szerzése: https://opendata.bkk.hu/
