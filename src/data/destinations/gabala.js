/* Long-form City Guide article content for Gabala. Only article copy lives
   here — city name/label comes from azerbaijanDestinations.js (the single
   source of truth for destination identity), never duplicated in this file.
   Arabic is intentionally omitted for now (see project instructions);
   getDestinationContent() falls back to `az`. */
export default {
  en: {
    tagline: "Nature, mountains and unforgettable views",
    intro: "Gabala sits at the foot of the Greater Caucasus mountains and is one of Azerbaijan's most popular weekend and family holiday destinations, known for its cable car, forest climate and historic sites.",
    sightseeing: ["Tufandag Mountain Resort", "Nohur Lake", "Seven Beauties Waterfall", "Gabala Fortress"],
    attractions: ["Tufandag cable car", "Gabaland amusement park"],
    news: [{ title: "New pool attraction now open", date: "July 2026" }],
  },
  az: {
    tagline: "Təbiət, dağlar və unudulmaz mənzərələr",
    intro: "Qəbələ Böyük Qafqaz dağlarının ətəyində yerləşir və kanat yolu, meşə iqlimi və tarixi abidələri ilə Azərbaycanın ən populyar həftəsonu və ailə tətili istiqamətlərindən biridir.",
    sightseeing: ["Tufandağ Dağ-Xizək Kurortu", "Nohur Gölü", "Yeddi Gözəl Şəlaləsi", "Qəbələ Qalası"],
    attractions: ["Tufandağ kanat yolu", "Gəbələland əyləncə mərkəzi"],
    news: [{ title: "Yeni Hovuz atraksiyonu fəaliyyətə başladı", date: "İyul 2026" }],
  },
};
