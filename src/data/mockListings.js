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
