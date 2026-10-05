/* Long-form City Guide article content for Sheki. Only article copy lives
   here — city name/label comes from azerbaijanDestinations.js (the single
   source of truth for destination identity), never duplicated in this file.
   Arabic is intentionally omitted for now (see project instructions);
   getDestinationContent() falls back to `az`. */
export default {
  en: {
    tagline: "Silk Road heritage and the Khan's Palace",
    intro: "Sheki sits in the green foothills of the Greater Caucasus and was for centuries a stop on the Great Silk Road, famous for its silk weaving. Its historic centre, with the 18th-century Palace of the Sheki Khans and its shebeke stained-glass windows, is on the UNESCO World Heritage List.",
    sightseeing: ["Palace of the Sheki Khans", "Upper Caravanserai", "Kish Albanian Church", "Gelersen-Gorersen Fortress"],
    attractions: ["Shebeke workshops", "Sheki halva and piti tasting"],
    news: [],
  },
  az: {
    tagline: "İpək Yolu irsi və Xan Sarayı",
    intro: "Şəki Böyük Qafqazın yaşıl ətəklərində yerləşir və əsrlər boyu ipəkçiliyi ilə məşhur olan Böyük İpək Yolunun mühüm dayanacaqlarından biri olub. XVIII əsrə aid, şəbəkə pəncərələri ilə tanınan Şəki Xan Sarayı ilə birlikdə şəhərin tarixi mərkəzi UNESCO-nun Ümumdünya İrs Siyahısına daxildir.",
    sightseeing: ["Şəki Xan Sarayı", "Yuxarı Karvansaray", "Kiş Alban məbədi", "Gələrsən-Görərsən qalası"],
    attractions: ["Şəbəkə emalatxanaları", "Şəki halvası və piti dadımı"],
    news: [],
  },
};
