/* Placeholder listings until Supabase is connected — gradient thumbnails, no real photos yet.
   Shared between VillasPage, CarsPage, detail pages and the homepage "Latest Listings" preview. */

export const MOCK_VILLAS = [
  {
    id: "v1", city: "Baku", tone: "dusk", price: 90, guests: 4, bedrooms: 2,
    title: { en: "Seafront apartment near the Boulevard", az: "Bulvar yaxınlığında dənizkənarı mənzil" },
    description: {
      en: "A bright, modern apartment two minutes from the Caspian seafront boulevard. Perfect base for exploring the Old City and Flame Towers on foot.",
      az: "Xəzər dənizi bulvarına iki dəqiqəlik məsafədə, işıqlı və müasir mənzil. İçərişəhər və Alov Qüllələrini piyada gəzmək üçün ideal baza.",
    },
    amenities: ["wifi", "kitchen", "ac", "parking"],
  },
  {
    id: "v2", city: "Baku", tone: "forest", price: 70, guests: 2, bedrooms: 1,
    title: { en: "Modern flat in the city center", az: "Şəhər mərkəzində müasir mənzil" },
    description: {
      en: "Compact and stylish one-bedroom flat in the heart of Baku, close to restaurants, metro and the Fountains Square.",
      az: "Bakının mərkəzində, restoranlara, metroya və Fəvvarələr Meydanına yaxın kompakt və zövqlü bir otaqlı mənzil.",
    },
    amenities: ["wifi", "kitchen", "ac"],
  },
  {
    id: "v3", city: "Gabala", tone: "meadow", price: 150, guests: 6, bedrooms: 3,
    title: { en: "Mountain-view villa with fireplace", az: "Şömünəli, dağ mənzərəli villa" },
    description: {
      en: "A spacious 3-bedroom villa looking out over the Caucasus foothills, with a wood fireplace for cool mountain evenings.",
      az: "Qafqaz dağ ətəklərinə baxan, sərin dağ axşamları üçün taxta şömünəli, geniş 3 otaqlı villa.",
    },
    amenities: ["wifi", "parking", "fireplace", "garden"],
  },
  {
    id: "v4", city: "Gabala", tone: "dusk", price: 110, guests: 4, bedrooms: 2,
    title: { en: "Cosy cottage near Tufandag", az: "Tufandağa yaxın rahat kottec" },
    description: {
      en: "A cosy wooden cottage a short drive from the Tufandag cable car, surrounded by forest.",
      az: "Tufandağ kanat yoluna qısa məsafədə, meşə əhatəsində rahat taxta kottec.",
    },
    amenities: ["wifi", "parking", "kitchen"],
  },
  {
    id: "v5", city: "Guba", tone: "forest", price: 85, guests: 5, bedrooms: 2,
    title: { en: "Orchard house with garden", az: "Bağçalı, meyvə bağı evi" },
    description: {
      en: "A traditional Guba house surrounded by its own fruit orchard, with a shaded garden terrace.",
      az: "Öz meyvə bağı ilə əhatələnmiş ənənəvi Quba evi, kölgəli bağça terrası ilə.",
    },
    amenities: ["wifi", "parking", "garden"],
  },
  {
    id: "v6", city: "Guba", tone: "meadow", price: 130, guests: 7, bedrooms: 3,
    title: { en: "Family villa near Shahdag", az: "Şahdağa yaxın ailəvi villa" },
    description: {
      en: "A large family villa close to Shahdag National Park, ideal for group trips and winter ski weekends.",
      az: "Şahdağ Milli Parkına yaxın, qrup səyahətləri və qış xizək həftəsonları üçün ideal böyük ailəvi villa.",
    },
    amenities: ["wifi", "kitchen", "parking", "fireplace"],
  },
];

export const MOCK_CARS = [
  {
    id: "c1", city: "Baku", tone: "dusk", price: 45, seats: 5, transmission: { en: "Automatic", az: "Avtomat" },
    title: { en: "Hyundai Elantra 2022", az: "Hyundai Elantra 2022" },
    description: {
      en: "A comfortable, fuel-efficient sedan — great for city driving and day trips around Baku.",
      az: "Rahat, az yanacaq sərf edən sedan — Bakı ətrafında şəhər sürüşü və gündəlik səfərlər üçün əladır.",
    },
  },
  {
    id: "c2", city: "Baku", tone: "forest", price: 65, seats: 5, transmission: { en: "Automatic", az: "Avtomat" },
    title: { en: "Kia Sportage 2023", az: "Kia Sportage 2023" },
    description: {
      en: "A spacious SUV with plenty of trunk space, well suited for family trips outside the city.",
      az: "Baqaj yeri bol, geniş SUV — şəhərdən kənar ailəvi səfərlər üçün uyğundur.",
    },
  },
  {
    id: "c3", city: "Gabala", tone: "meadow", price: 55, seats: 5, transmission: { en: "Manual", az: "Mexaniki" },
    title: { en: "Toyota RAV4 2021", az: "Toyota RAV4 2021" },
    description: {
      en: "A reliable 4x4 crossover, a popular choice for the mountain roads around Gabala.",
      az: "Etibarlı 4x4 krossover — Qəbələ ətrafındakı dağ yolları üçün populyar seçim.",
    },
  },
  {
    id: "c4", city: "Guba", tone: "forest", price: 50, seats: 7, transmission: { en: "Automatic", az: "Avtomat" },
    title: { en: "Hyundai Staria 2022", az: "Hyundai Staria 2022" },
    description: {
      en: "A 7-seat minivan, ideal for larger groups heading to Shahdag or Khinalig.",
      az: "7 yerlik minivan — Şahdağ və ya Xınalığa gedən böyük qruplar üçün idealdır.",
    },
  },
];

/* type: "transfer" | "tour" — hasVehicle: true if the guide/driver provides the car,
   false if it's a guide-only listing (guest arranges their own transport). */
export const MOCK_TRANSFERS = [
  {
    id: "t1", type: "transfer", city: "Baku", tone: "dusk", price: 25, hasVehicle: true, seats: 4,
    title: { en: "Heydar Aliyev Airport transfer", az: "Heydər Əliyev Aeroportu transferi" },
    description: {
      en: "Direct airport-to-city transfer in a comfortable sedan, meet & greet included.",
      az: "Rahat sedan ilə aeroportdan şəhərə birbaşa transfer, qarşılama daxildir.",
    },
  },
  {
    id: "t2", type: "transfer", city: "Baku", tone: "forest", price: 60, hasVehicle: true, seats: 7,
    title: { en: "Baku – Gabala intercity transfer", az: "Bakı – Qəbələ şəhərlərarası transfer" },
    description: {
      en: "Door-to-door transfer between Baku and Gabala in a 7-seat minivan, luggage space included.",
      az: "Bakı və Qəbələ arasında 7 yerlik minivanla qapıdan-qapıya transfer, baqaj yeri daxildir.",
    },
  },
  {
    id: "t3", type: "tour", city: "Baku", tone: "meadow", price: 35, hasVehicle: false, seats: 6,
    title: { en: "Old City walking tour with local guide", az: "Yerli bələdçi ilə İçərişəhər piyada turu" },
    description: {
      en: "A 3-hour walking tour through the Old City and Flame Towers — guide only, no vehicle, meet at the location.",
      az: "İçərişəhər və Alov Qüllələri ərazisində 3 saatlıq piyada tur — yalnız bələdçi, avtomobilsiz, görüş yerində başlanır.",
    },
  },
  {
    id: "t4", type: "tour", city: "Gabala", tone: "dusk", price: 90, hasVehicle: true, seats: 4,
    title: { en: "Gabala & Tufandag day tour with driver", az: "Sürücü ilə Qəbələ və Tufandağ günlük turu" },
    description: {
      en: "A full-day guided tour to Tufandag and Nohur Lake, vehicle and driver included.",
      az: "Tufandağ və Nohur gölünə tam günlük bələdçili tur, avtomobil və sürücü daxildir.",
    },
  },
  {
    id: "t5", type: "tour", city: "Guba", tone: "forest", price: 40, hasVehicle: false, seats: 8,
    title: { en: "Khinalig village hiking tour", az: "Xınalıq kəndi hiking turu" },
    description: {
      en: "A guided hike around Khinalig village — guide only, transport to the village arranged separately.",
      az: "Xınalıq kəndi ətrafında bələdçili hiking — yalnız bələdçi, kəndə nəqliyyat ayrıca təşkil olunur.",
    },
  },
  {
    id: "t6", type: "tour", city: "Guba", tone: "meadow", price: 75, hasVehicle: true, seats: 5,
    title: { en: "Shahdag & waterfalls tour with car", az: "Avtomobillə Şahdağ və şəlalələr turu" },
    description: {
      en: "A scenic driving tour to Shahdag National Park and nearby waterfalls, vehicle and driver included.",
      az: "Şahdağ Milli Parkı və yaxınlıqdakı şəlalələrə mənzərəli avtomobil turu, avtomobil və sürücü daxildir.",
    },
  },
];

export const MOCK_EVENTS = [
  {
    id: "e1", city: "Baku", tone: "dusk", price: 15, date: "2026-08-14",
    title: { en: "Baku Jazz Festival — evening concert", az: "Bakı Caz Festivalı — axşam konserti" },
    description: {
      en: "An open-air jazz evening at the Baku Boulevard with local and touring musicians.",
      az: "Bakı Bulvarında yerli və qonaq musiqiçilərin iştirakı ilə açıq havada caz axşamı.",
    },
  },
  {
    id: "e2", city: "Baku", tone: "forest", price: 0, date: "2026-08-02",
    title: { en: "Old City craft market", az: "İçərişəhər sənətkarlıq bazarı" },
    description: {
      en: "A free weekend market with local craftspeople selling ceramics, textiles and jewellery in the Old City.",
      az: "İçərişəhərdə keramika, toxuculuq və zərgərlik satan yerli sənətkarların pulsuz həftəsonu bazarı.",
    },
  },
  {
    id: "e3", city: "Gabala", tone: "meadow", price: 25, date: "2026-09-05",
    title: { en: "Gabala International Music Festival", az: "Qəbələ Beynəlxalq Musiqi Festivalı" },
    description: {
      en: "An evening of classical and world music performed at the Gabala amphitheatre.",
      az: "Qəbələ amfiteatrında klassik və dünya musiqisi ifa olunan axşam tədbiri.",
    },
  },
  {
    id: "e4", city: "Guba", tone: "forest", price: 10, date: "2026-09-20",
    title: { en: "Guba Apple Harvest Festival", az: "Quba Alma Bayramı" },
    description: {
      en: "An annual harvest festival celebrating Guba's orchards, with tastings, music and local food stalls.",
      az: "Quba bağlarını qeyd edən illik bayram — dequstasiya, musiqi və yerli yemək stendləri.",
    },
  },
];
