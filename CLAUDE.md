# IZIGO — Claude Code Layihə Təlimatları

Bu fayl Claude Code-un hər sessiyanın əvvəlində oxuduğu "layihə yaddaşı"dır.
Burada yazılanlar avtomatik nəzərə alınır — hər dəfə təkrar izah etməyə ehtiyac yoxdur.

## Layihə haqqında

IZIGO — Azərbaycan üçün turizm marketplace-i (Tap.az + Airbnb + Tripadvisor modeli).
Kateqoriyalar: Villas, Cars, Experiences, Events. Şəhərlər: Baku, Gabala, Guba.
Online ödəniş yoxdur — istifadəçilər host-larla birbaşa WhatsApp üzərindən əlaqə saxlayır.

## Texnoloji stack (MVP — sadə saxla, overengineer etmə)

- **Frontend:** React (Vite), React Router v6, lucide-react ikonlar
- **Backend/DB:** Supabase (Postgres + Auth + Storage) — ayrıca custom backend YOXDUR
- **Deploy:** Vercel
- **Stil:** CSS-in-file (`<style>` tag-lar komponent daxilində), CSS dəyişənləri (`--teal-900`, `--copper-600` və s.) — Tailwind istifadə OLUNMUR

## Hazırkı fayl strukturu

Bütün əsas səhifələr artıq tikilib və real Supabase data ilə işləyir — heç bir route
`PagePlaceholder`-ə bağlı deyil (o yalnız 404 üçün istifadə olunur).

```
src/
├── App.jsx                      ← router, layout-lar, auth guard-lar, real Supabase auth
├── lib/                         ← supabaseClient, listings.js, heroCampaigns.js və s. (data qatı)
├── pages/
│   ├── Home/                    ← IzigoHomepage.jsx (Hero, Search, Cities, Listings, Reviews)
│   ├── Villas/, Cars/, Transfers/, Experiences/, Events/, Deals/  ← siyahı + detal səhifələri
│   ├── Destinations/            ← şəhər bələdçiləri (CityGuide) + bütün şəhərlər siyahısı
│   ├── Host/                    ← host profili səhifəsi
│   ├── Auth/                    ← Login, Register (real Supabase auth)
│   ├── Profile/, MyListings/, AddListing/, Reviews/, Saved/       ← giriş tələb edən səhifələr
│   ├── PlanMyTrip/, Concierge/  ← "Plan My Trip" forması, local services (Bring)
│   └── Admin/                   ← Dashboard, Users, Listings, Pending approvals, Reviews,
│                                    Statistics, Hero campaigns (bax aşağıda)
```

## App.jsx haqqında bilməli olduqların

- Router 4 layout istifadə edir: `MainLayout` (public səhifələr), `AuthLayout` (login/register),
  `AppLayout` (profil, elan əlavə etmə və s. — giriş tələb edir), `AdminLayout` (admin panel).
- Route guard-lar: `RequireAuth`, `RequireGuest`, `RequireAdmin` — **real Supabase auth** istifadə edir
  (`supabase.auth.getSession()` / `onAuthStateChange`), mock user yoxdur.
- Admin rolu `profiles` cədvəlindəki `role = 'admin'` sahəsi ilə müəyyən olunur.
- Yeni bir səhifə/funksiya əlavə edəndə oxşar mövcud səhifəyə bax (məs. yeni kateqoriya üçün
  `src/pages/Villas/`-ın strukturuna bax) — hazır pattern var, sıfırdan İxtira etməyə ehtiyac yoxdur.

## Hero campaigns (homepage-in yuxarı hissəsi)

- Homepage hero-nun **layout-u həmişə eynidir**: fon şəkli + başlıq + subtitle + "Plan My Trip"
  düyməsi (əsas CTA, HEÇ vaxt kampaniya ilə əvəz olunmur) + search paneli (Villas/Cars/Transfers/Tours
  tab-ları ilə). Bunu mürəkkəbləşdirmə — admin yalnız şəkil və mətn dəyişə bilər, düymə/layout seçimi yoxdur.
- `src/lib/heroCampaigns.js`: `fetchActiveCampaign()` (ən son publish olunmuş aktiv kampaniya),
  `fetchSiteSettings()` / `updateDefaultHeroImages()` (kampaniya olmayanda göstərilən default şəkil).
- Admin idarəetməsi: `src/pages/Admin/HeroCampaignsPage.jsx` (`/admin/hero`) — kampaniya siyahısı
  + "Default hero image" bloku. Sahələr: ad, status (draft/scheduled/published/archived),
  başlıq/subtitle (EN/AZ), başlanğıc/bitmə tarixi, desktop/mobil şəkil.
- DB: `hero_campaigns` və `site_settings` cədvəlləri (`supabase/013_*.sql`, `supabase/014_*.sql`).
  `hero_campaigns`-da istifadə olunmayan köhnə sütunlar (`content_type`, `button_mode`,
  `button_pos_*` və s.) qalıb, zərərsizdirlər, sadəcə kod onları oxumur/yazmır.

## Dizayn dili (yeni səhifə/komponent tikəndə buna sadiq qal)

- Rənglər: dərin teal (`#0B3D3B`), mis/"od" rəngi (`#BA5B2E`), qum fonu (`#F6F3EC`)
- Fontlar: başlıqlar üçün 'Fraunces' (serif), mətn üçün 'Inter'
- Kartlar: `border-radius: 12-18px`, incə `border: 1px solid var(--border)`
- Bütün yeni komponentlər responsive olmalıdır (mobil-first, `@media (max-width: 860px)`)

## İş qaydaları (vacib)

- Hər dəyişiklikdən əvvəl mənə nə edəcəyini qısa izah et, sonra fayl dəyişikliyinə keç.
- Böyük, çox fayllı tapşırıqları kiçik addımlara böl — bir dəfəyə bir səhifə/funksiya.
- `localStorage`/`sessionStorage` istifadə etmə — auth state React Context/state-də saxlanılır.
- Yeni asılılıq (npm paketi) əlavə etməzdən əvvəl mənə de, niyə lazım olduğunu izah et.
- Kodu yazandan sonra, əgər mümkündürsə, layihəni işə sal (`npm run dev`) və xəta olub-olmadığını yoxla.
