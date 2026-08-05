/* Long-form City Guide article content for Guba. Only article copy lives
   here — city name/label comes from azerbaijanDestinations.js (the single
   source of truth for destination identity), never duplicated in this file.
   Arabic is intentionally omitted for now (see project instructions);
   getDestinationContent() falls back to `az`. */
export default {
  en: {
    tagline: "Authentic culture and beautiful landscapes",
    intro: "Guba is known for its orchards, mountain villages and closeness to the Shahdag National Park, making it one of northern Azerbaijan's most scenic regions.",
    sightseeing: ["Shahdag National Tourism Complex", "Qonaqkend", "Khinalig village (day trip)"],
    attractions: ["Shahdag cable car & ski slopes", "Afurja waterfall"],
    news: [{ title: "IZIGO starts onboarding new hosts in Guba", date: "July 2026" }],
  },
  az: {
    tagline: "Orijinal mədəniyyət və gözəl mənzərələr",
    intro: "Quba meyvə bağları, dağ kəndləri və Şahdağ Milli Parkına yaxınlığı ilə tanınan, Şimali Azərbaycanın ən mənzərəli bölgələrindən biridir.",
    sightseeing: ["Şahdağ Milli Turizm Kompleksi", "Qonaqkənd", "Xınalıq kəndi (gündəlik tur)"],
    attractions: ["Şahdağ kanat yolu və xizək", "Afurca şəlaləsi"],
    news: [{ title: "IZIGO Qubada yeni ev sahibləri ilə əməkdaşlığa başladı", date: "İyul 2026" }],
  },
};
