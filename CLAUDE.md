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

```
src/
├── App.jsx                      ← router, layout-lar, auth guard-lar (hazırdır)
├── pages/
│   ├── Home/
│   │   └── IzigoHomepage.jsx    ← hazır dizayn (Hero, Search, Cities, Listings, Reviews)
│   ├── Villas/                  ← hələ yoxdur, tikilməlidir
│   ├── Cars/                    ← hələ yoxdur
│   ├── Experiences/             ← hələ yoxdur
│   ├── Events/                  ← hələ yoxdur
│   ├── Auth/                    ← Login, Register hələ placeholder
│   ├── Profile/                 ← hələ placeholder
│   ├── AddListing/              ← hələ placeholder
│   ├── MyListings/               ← hələ placeholder
│   └── Reviews/                 ← hələ placeholder
```

## App.jsx haqqında bilməli olduqların

- Router 4 layout istifadə edir: `MainLayout` (public səhifələr), `AuthLayout` (login/register),
  `AppLayout` (profil, elan əlavə etmə və s. — giriş tələb edir), `AdminLayout` (admin panel).
- Route guard-lar: `RequireAuth`, `RequireGuest`, `RequireAdmin` — bunlar hazırda `AuthContext`-dən
  mock (yaddaşda saxlanan) user obyekti oxuyur. Real Supabase auth qoşulanda bu hissə dəyişəcək.
- Bütün digər səhifələr `PagePlaceholder` komponenti ilə əvəz olunub — hər hansı bir səhifəni
  tikəndə, App.jsx-də həmin placeholder sətrini import ilə əvəz et.

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
