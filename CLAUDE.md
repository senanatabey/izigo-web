# IZIGO — Claude Code Layihə Təlimatları

Bu fayl Claude Code-un hər sessiyanın əvvəlində oxuduğu "layihə yaddaşı"dır.
Burada yazılanlar avtomatik nəzərə alınır — hər dəfə təkrar izah etməyə ehtiyac yoxdur.

## Layihə haqqında

IZIGO — Azərbaycan üçün turizm marketplace-i (Tap.az + Airbnb + Tripadvisor modeli).
Kateqoriyalar: Villas, Cars, Transfers (turlar da bura daxildir), Events + "Gətir"/Bring (yerli xidmətlər, `/concierge`).
`/experiences` ayrıca kateqoriya deyil — `/transfers`-ə yönləndirilir. Şəhərlər: Baku, Gabala, Guba, Sheki.
Online ödəniş yoxdur — istifadəçilər host-larla birbaşa WhatsApp üzərindən əlaqə saxlayır.

## Texnoloji stack (MVP — sadə saxla, overengineer etmə)

- **Frontend:** React (Vite), React Router v6, lucide-react ikonlar
- **Backend/DB:** Supabase (Postgres + Auth + Storage) — ayrıca custom backend YOXDUR
- **Deploy:** Vercel
- **Stil:** CSS-in-file (`<style>` tag-lar komponent daxilində), CSS dəyişənləri `src/index.css`-də
  (`--rebrand-*` brend tokenləri, köhnə `--izigo-green`/`--izigo-orange`, `--on-brand`, `--text`, `--text-soft`,
  `--border`, `--bg`, `--surface` və s.) — Tailwind istifadə OLUNMUR. Sayt yalnız light temadadır (dark mode silinib).

## Hazırkı fayl strukturu

Bütün əsas səhifələr artıq tikilib və real Supabase data ilə işləyir — heç bir route
`PagePlaceholder`-ə bağlı deyil (o yalnız 404 üçün istifadə olunur).

```
src/
├── App.jsx                      ← router, layout-lar, auth guard-lar, real Supabase auth
├── lib/                         ← supabaseClient, listings.js, heroCampaigns.js və s. (data qatı)
├── pages/
│   ├── Home/                    ← IzigoHomepage.jsx: Hero (+axtarış) → Populyar Məkanlar → Elanlar →
│   │                               Plan My Trip (3 sahəli kart) → Yerli Xidmətlər → Host CTA → Kəşf CTA
│   ├── Villas/, Cars/, Transfers/, Events/, Deals/  ← siyahı + detal səhifələri
│   ├── Destinations/, Places/   ← şəhər bələdçiləri (CityGuide), bütün şəhərlər, CMS məkanları
│   ├── Host/, BecomeAHost/      ← host profili, "Niyə IZIGO-da elan" səhifəsi
│   ├── Auth/                    ← Login, Register (real Supabase auth)
│   ├── Profile/, MyListings/, Saved/, Notifications/, Welcome/  ← giriş tələb edən səhifələr
│   ├── AddListing/              ← elan yerləşdirmə (girişsiz də açıqdır, hesab formanın sonunda yaranır)
│   ├── PlanMyTrip/, Concierge/  ← tam "Plan My Trip" forması, yerli xidmətlər (Gətir/Bring)
│   ├── RegionalPartner/         ← regional partnyor paneli (yalnız Azərbaycan dilində)
│   └── Admin/                   ← Dashboard, Users, Listings, Pending approvals, Reviews,
│                                    Statistics, Hero campaigns (bax aşağıda)
```

## App.jsx haqqında bilməli olduqların

- Router 5 layout istifadə edir: `MainLayout` (public səhifələr), `AuthLayout` (login/register),
  `AppLayout` (profil və s. — giriş tələb edir), `AddListingLayout` (elan yerləşdirmə — girişli və
  girişsiz istifadəçi üçün), `AdminLayout` (admin panel).
- Route guard-lar: `RequireAuth`, `RequireGuest`, `RequireAdmin` — **real Supabase auth** istifadə edir
  (`supabase.auth.getSession()` / `onAuthStateChange`), mock user yoxdur.
- Admin rolu `profiles` cədvəlindəki `role = 'admin'` sahəsi ilə müəyyən olunur.
- Yeni bir səhifə/funksiya əlavə edəndə oxşar mövcud səhifəyə bax (məs. yeni kateqoriya üçün
  `src/pages/Villas/`-ın strukturuna bax) — hazır pattern var, sıfırdan İxtira etməyə ehtiyac yoxdur.

## Hero campaigns (homepage-in yuxarı hissəsi)

- Homepage hero-nun **layout-u həmişə eynidir**: fon şəkli + başlıq + subtitle + "Plan My Trip"
  düyməsi (əsas CTA, HEÇ vaxt kampaniya ilə əvəz olunmur) + search paneli (Villalar / Maşınlar /
  Transfer / Gətir tab-ları ilə). Bunu mürəkkəbləşdirmə — admin yalnız şəkil və mətn dəyişə bilər,
  düymə/layout seçimi yoxdur.
- Mobildə (≤640px) desktop hero gizlənir; yerinə ayrıca yığcam blok göstərilir: başlıq
  ("Səyahətinizi büdcənizə IZIGO ilə uyğunlaşdırın") + tam enli "Səyahətimi Planla" + qısa etibar sətri +
  axtarış + kateqoriya ikonları. Kampaniyalar bu mobil bloka təsir etmir.
- `src/lib/heroCampaigns.js`: `fetchActiveCampaign()` (ən son publish olunmuş aktiv kampaniya),
  `fetchSiteSettings()` / `updateDefaultHeroImages()` (kampaniya olmayanda göstərilən default şəkil).
- Admin idarəetməsi: `src/pages/Admin/HeroCampaignsPage.jsx` (`/admin/hero`) — kampaniya siyahısı
  + "Default hero image" bloku. Sahələr: ad, status (draft/scheduled/published/archived),
  başlıq/subtitle (EN/AZ), başlanğıc/bitmə tarixi, desktop/mobil şəkil.
- DB: `hero_campaigns` və `site_settings` cədvəlləri (`supabase/013_*.sql`, `supabase/014_*.sql`).
  `hero_campaigns`-da istifadə olunmayan köhnə sütunlar (`content_type`, `button_mode`,
  `button_pos_*` və s.) qalıb, zərərsizdirlər, sadəcə kod onları oxumur/yazmır.

## Dizayn dili (yeni səhifə/komponent tikəndə buna sadiq qal)

- Rənglər: yeni iş üçün **`--rebrand-*` tokenlərindən** istifadə et (aşağıda "Rəng sistemi" bölməsinə bax).
  Köhnə yaşıl `#00C897` / narıncı `#FF7A00` (`--izigo-*`) hələ rebrand olunmamış səhifələrdə qalır —
  yeni yerə köhnə rəngi daşıma.
- Köhnə yaşıl/narıncı **doldurulmuş** fonda mətn `var(--on-brand)` (`#1F2937`) qalır (ağ AA-dan keçmir).
  Yeni mavi `#0071EB` fonda isə mətn **ağdır** (4.60:1).
- Font: yalnız 'Inter' (`var(--sans)`), başlıqlar da daxil. Yüklənən çəkilər 400/500/600;
  `font-synthesis: none` olduğu üçün 700/800 yazma — onsuz da 600 kimi görünür.
  ('Fraunces' `index.html`-də yüklənir, amma yalnız NotificationsPage istifadə edir — yeni yerdə işlətmə.)
- Kartlar: `border-radius: 12-18px`, incə `border: 1px solid var(--border)`
- Responsive (mobil-first): əsas breakpoint-lər `@media (max-width: 640px)` (telefon) və
  `@media (max-width: 1024px)` (planşet); landşaft telefon üçün `(min-width: 641px) and (max-height: 500px)`.
  Bəzi köhnə səhifələrdə 860/900px qalıb — yeni komponentlərdə 640/1024 işlət.

## Rəng sistemi və rebrand statusu (2026-10-17)

- **Tokenlər** `src/index.css`-dədir (`--rebrand-*`):
  - `--rebrand-primary` / `--rebrand-cta` = `#0071EB` (mavi, hover `#004A99`) — brendin əsas rəngi, bütün
    əsas hərəkət düymələri: hero CTA, axtarış ("Axtar"), login/qeydiyyat/elan formalarının əsas düymələri,
    mobil aşağı menyudakı "+". Mətn ağ.
  - `--rebrand-listing-cta` = `#3DB460` (yaşıl, hover `#349851`) — **YALNIZ** "Elan yerləşdir"/"Yeni elan"
    düymələri (navbar "Yeni elan", become-a-host son CTA, welcome səhifəsi). **Başqa heç bir yerdə yaşıl
    işlətmə — qəti qayda.** (Mobil "+" bu qaydadan şüurlu istisnadır — mavidir.)
  - `--rebrand-text` = `#05203D` (tünd-göy) — başlıqlar və böyük rəngli bloklar (məs. Plan My Trip bölməsi).
  - Digərləri: `--rebrand-text-sec #5B6B7A`, `--rebrand-border #AFD0F4`, `--rebrand-bg #FFFDF8`,
    `--rebrand-bg-tint #EFF5FB`, `--rebrand-gold #D98A2B` (token, hələ istifadə olunmur).
- **Dark mode tamamilə silinib** — `ThemeContext`/toggle/`[data-theme="dark"]` CSS yoxdur, sayt yalnız light.
  Pilot qaydalarındakı `:root:not([data-theme="dark"])` qarovul selektorları zərərsiz qalıqdır.
- **Loqo/favikon hazırdır — TOXUNMA:** `public/favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`,
  `apple-touch-icon.png`, `android-chrome-*`, `maskable-icon-512x512.png` (göy fon + ağ "Z");
  `public/logo/` — `izigo-wordmark.png` (navbar, footer), `izigo-full-tagline.png`,
  `izigo-reversed-white.png` (tünd sidebar). Manifest faylı yoxdur.
- **Rollout statusu:**
  - Bitib: ana səhifə (`IzigoHomepage.jsx`-dəki pilot bloku — hero, axtarış, kartlar, Plan My Trip və s.),
    shell (navbar "Yeni elan", aşağı menyu "+" və aktiv bənd, dil seçicisi aktiv dili, footer loqosu),
    auth formaları (səhifə + modal) və elan formasının əsas düymələri (`App.css`-in sonundakı pilot blokları).
  - Hələ köhnə palitrada: siyahı/detal səhifələri (`/villas`, `/cars`, `/transfers`, `/events`, detal
    səhifələri, `/concierge`, `/destinations` və s.), elan formasının stepper/chip-ləri, auth linkləri.
  - **4-cü mərhələ (admin + regional partnyor paneli) HƏLƏ BAŞLAMAYIB.**

## İş qaydaları (vacib)

- Hər dəyişiklikdən əvvəl mənə nə edəcəyini qısa izah et, sonra fayl dəyişikliyinə keç.
- Böyük, çox fayllı tapşırıqları kiçik addımlara böl — bir dəfəyə bir səhifə/funksiya.
- `localStorage`/`sessionStorage` istifadə etmə — auth state React Context/state-də saxlanılır.
- Yeni asılılıq (npm paketi) əlavə etməzdən əvvəl mənə de, niyə lazım olduğunu izah et.
- Kodu yazandan sonra, əgər mümkündürsə, layihəni işə sal (`npm run dev`) və xəta olub-olmadığını yoxla.
- **Git:** hər commit yalnız bir mövzuya aid olsun. Açıq təlimat olmadan **commit etmə**; mən "push"
  deməmiş **heç vaxt push etmə**.
