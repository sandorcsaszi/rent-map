# Rent Map - Supabase Beállítás

## 🚀 Supabase projekt létrehozása

### 1. Projekt létrehozása
1. Menj a [supabase.com](https://supabase.com) oldalra
2. Regisztrálj/jelentkezz be
3. Kattints a "New Project" gombra
4. **Project name**: `rent-map`
5. **Database Password**: Generálj egy erős jelszót (mentsd el!)
6. **Region**: Europe (Frankfurt)
7. **Pricing plan**: Free tier

### 2. Adatbázis sémák létrehozása

Menj a **SQL Editor** fülre és futtasd le ezeket a parancsokat:

#### Profiles tábla létrehozása:
```sql
-- Profiles tábla létrehozása
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS engedélyezése
alter table public.profiles enable row level security;

-- Policies létrehozása
create policy "Public profiles are viewable by everyone." 
  on profiles for select 
  using ( true );

create policy "Users can insert their own profile." 
  on profiles for insert 
  with check ( auth.uid() = id );

create policy "Users can update own profile." 
  on profiles for update 
  using ( auth.uid() = id );
```

#### Places tábla létrehozása:
```sql
-- Places tábla létrehozása
create table public.places (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  description text,
  address text,
  lat double precision not null,
  lng double precision not null,
  rent_price integer, -- forintban
  deposit_price integer, -- forintban
  utilities_price integer, -- forintban
  total_price integer generated always as (coalesce(rent_price, 0) + coalesce(deposit_price, 0) + coalesce(utilities_price, 0)) stored,
  room_count integer,
  property_type text check (property_type in ('apartment', 'house', 'room', 'other')),
  is_public boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS engedélyezése
alter table public.places enable row level security;

-- Policies létrehozása
create policy "Public places are viewable by everyone." 
  on places for select 
  using ( is_public = true );

create policy "Users can view own places." 
  on places for select 
  using ( auth.uid() = user_id );

create policy "Users can insert their own places." 
  on places for insert 
  with check ( auth.uid() = user_id );

create policy "Users can update own places." 
  on places for update 
  using ( auth.uid() = user_id );

create policy "Users can delete own places." 
  on places for delete 
  using ( auth.uid() = user_id );
```

#### Real-time engedélyezése:
```sql
-- Real-time subscriptions engedélyezése
alter publication supabase_realtime add table places;
alter publication supabase_realtime add table profiles;
```

### 3. Authentication beállítások

#### Menj az **Authentication → Settings** fülre:

1. **Site URL**: `http://localhost:5173`
2. **Redirect URLs**: `http://localhost:5173/auth/callback`

#### OAuth Providers beállítása:

##### Google OAuth:
1. **Authentication → Providers → Google**
2. **Enable**: ON
3. **Client ID** és **Client Secret**: 
   - Google Cloud Console-ban hozz létre OAuth 2.0 credentials-t
   - Authorized redirect URIs: `https://your-project.supabase.co/auth/v1/callback`

##### GitHub OAuth:
1. **Authentication → Providers → GitHub**  
2. **Enable**: ON
3. **Client ID** és **Client Secret**:
   - GitHub Settings → Developer settings → OAuth Apps → New OAuth App
   - Authorization callback URL: `https://your-project.supabase.co/auth/v1/callback`

### 4. Környezeti változók beállítása

Frissítsd a `.env` fájlt a projekt adataival:

```env
# BKK API
VITE_BKK_API_KEY=e15b7240-2098-4145-8f3e-0805b8b2a190
VITE_BKK_API_URL=https://futar.bkk.hu/api/query/v1/ws/otp/api/where

# Supabase
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 5. Projekt kulcsok lekérése

1. **Settings → API**
2. **Project URL**: Másold a `VITE_SUPABASE_URL`-be
3. **anon public key**: Másold a `VITE_SUPABASE_ANON_KEY`-be

### 6. Éles környezet beállítása

Amikor ki akarod tenni éles környezetbe:

1. **Authentication → Settings**
2. **Site URL**: `https://your-domain.com`
3. **Redirect URLs**: `https://your-domain.com/auth/callback`

### 7. Email konfirmáció (opcionális)

Ha be akarod kapcsolni az email megerősítést:

1. **Authentication → Settings**
2. **Enable email confirmations**: ON
3. **Email Templates**: Személyre szabhatod

## 🎯 Funkcionalitás

- ✅ Google/GitHub bejelentkezés
- ✅ Felhasználói profilok
- ✅ Albérletek/házak hozzáadása/szerkesztése/törlése
- ✅ Real-time frissítések
- ✅ Jogosultság alapú hozzáférés (RLS)
- ✅ BKK megállók megjelenítése
- ✅ Blur effekt bejelentkezés nélkül

## 🔧 Fejlesztői parancsok

```bash
# Fejlesztői szerver indítása
npm run dev

# Függőségek telepítése
npm install

# Build készítése
npm run build
```

## 📱 Használat

1. Az alkalmazás elindítása után megjelenik a login modal
2. Válassz Google vagy GitHub bejelentkezést
3. Sikeres bejelentkezés után használhatod az összes funkciót:
   - Térkép kattintással új helyek hozzáadása
   - Meglévő helyek szerkesztése/törlése (csak saját helyeknél)
   - BKK megállók megjelenítése
   - Valós idejű frissítések

## 🚨 Hibaelhárítás

### "Supabase URL és ANON KEY szükséges"
- Ellenőrizd, hogy a `.env` fájl helyesen van kitöltve
- Restart-old a dev szervert: `npm run dev`

### OAuth bejelentkezés nem működik
- Ellenőrizd a redirect URL-eket
- Győződj meg róla, hogy az OAuth provider-ek helyesen vannak beállítva

### Adatbázis hozzáférési hibák
- Ellenőrizd a RLS policies-t
- Győződj meg róla, hogy a felhasználó be van jelentkezve
