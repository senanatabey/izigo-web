/* Long-form City Guide article content for Baku. Only article copy lives
   here — city name/label comes from azerbaijanDestinations.js (the single
   source of truth for destination identity), never duplicated in this file.
   Arabic is intentionally omitted for now (see project instructions);
   getDestinationContent() falls back to `az`. */
export default {
  en: {
    tagline: "Where modernity meets history",
    intro: "Baku, Azerbaijan's coastal capital, blends the UNESCO-listed Old City with the futuristic Flame Towers and a lively Caspian seafront boulevard. It's the country's main gateway for international visitors, and home base for most of IZIGO's Villas, Cars and Transfer listings.",
    sightseeing: ["Old City (İçərişəhər)", "Flame Towers", "Seaside Boulevard", "Heydar Aliyev Center"],
    attractions: ["Highland Park cable car", "Baku Ferris Wheel", "Gobustan Rock Art (day trip)"],
    news: [{ title: "IZIGO expands in Baku with new verified hosts", date: "July 2026" }],
  },
  az: {
    tagline: "Modernliyin tarixlə qovuşduğu şəhər",
    intro: "Bakı — Xəzər dənizi sahilindəki paytaxt, YUNESKO-nun İçərişəhər abidə kompleksini müasir Alov Qüllələri və canlı dəniz kənarı bulvarı ilə birləşdirir. Ölkəyə xarici qonaqların əsas giriş qapısıdır və IZIGO-nun əksər Villa, Avtomobil və Transfer elanlarının mərkəzidir.",
    sightseeing: ["İçərişəhər", "Alov Qüllələri", "Dənizkənarı Bulvar", "Heydər Əliyev Mərkəzi"],
    attractions: ["Dağüstü Park kanat yolu", "Bakı Fərgi Çarxı", "Qobustan Qaya Rəsmləri (gündəlik tur)"],
    news: [{ title: "IZIGO Bakıda yeni yoxlanılmış ev sahibləri ilə genişlənir", date: "İyul 2026" }],
  },
};
