/* Featured destinations stay fixed on the homepage — do not expand this list there.
   ALL_DESTINATIONS backs filters, search and Add Listing forms across the site.
   Values stay in English (they're stored as-is in listings.city and used in URL params);
   cityLabel() maps to the Azerbaijani name for display when the UI language is "az". */
export const FEATURED_DESTINATIONS = ["Baku", "Gabala", "Guba"];

const AZ_NAMES = {
  Absheron: "Abşeron", Agdam: "Ağdam", Agdash: "Ağdaş", Agjabadi: "Ağcabədi",
  Agstafa: "Ağstafa", Agsu: "Ağsu", Astara: "Astara",
  Baku: "Bakı", Balakan: "Balakən", Barda: "Bərdə", Beylagan: "Beyləqan", Bilasuvar: "Biləsuvar",
  Dashkasan: "Daşkəsən",
  Fizuli: "Füzuli",
  Gabala: "Qəbələ", Gadabay: "Gədəbəy", Ganja: "Gəncə", Goranboy: "Goranboy",
  Goychay: "Göyçay", Goygol: "Göygöl", Guba: "Quba", Gubadli: "Qubadlı", Gusar: "Qusar",
  Hajigabul: "Hacıqabul",
  Imishli: "İmişli", Ismayilli: "İsmayıllı",
  Jabrayil: "Cəbrayıl", Jalilabad: "Cəlilabad",
  Kalbajar: "Kəlbəcər", Khachmaz: "Xaçmaz", Khizi: "Xızı", Khojali: "Xocalı",
  Khojavend: "Xocavənd", Kurdamir: "Kürdəmir",
  Lachin: "Laçın", Lankaran: "Lənkəran", Lerik: "Lerik",
  Masally: "Masallı", Mingachevir: "Mingəçevir",
  Naftalan: "Naftalan", Nakhchivan: "Naxçıvan", Neftchala: "Neftçala",
  Oghuz: "Oğuz",
  Qakh: "Qax", Qazakh: "Qazax", Qobustan: "Qobustan",
  Saatly: "Saatlı", Sabirabad: "Sabirabad", Salyan: "Salyan", Samukh: "Samux",
  Shabran: "Şabran", Shamakhi: "Şamaxı", Shamkir: "Şəmkir",
  Sharur: "Şərur", Shirvan: "Şirvan", Shusha: "Şuşa", Siyazan: "Siyəzən", Sumgayit: "Sumqayıt",
  Tartar: "Tərtər", Tovuz: "Tovuz",
  Ujar: "Ucar",
  Yardimli: "Yardımlı", Yevlakh: "Yevlax",
  Zangilan: "Zəngilan", Zaqatala: "Zaqatala", Zardab: "Zərdab",
};

// Priority cities always lead the list (in this order); everything else follows alphabetically.
const PRIORITY_DESTINATIONS = ["Baku", "Gabala", "Guba", "Gusar"];

export const ALL_DESTINATIONS = [
  ...PRIORITY_DESTINATIONS,
  ...Object.keys(AZ_NAMES)
    .filter((city) => !PRIORITY_DESTINATIONS.includes(city))
    .sort((a, b) => a.localeCompare(b)),
];

export function cityLabel(city, language) {
  return language === "az" ? (AZ_NAMES[city] || city) : city;
}

const BACK_VOWELS = new Set(["a", "ı", "o", "u"]);
const AZ_VOWELS = "aıoueəiöü";

/* Azerbaijani locative case ("in {city}") needs vowel-harmony suffix
   -da/-də — e.g. "Qəbələdə", "Bakıda". Derived from the label's last vowel
   rather than hardcoded per city, so it works for all 60+ destinations. */
export function cityLocative(city, language) {
  const label = cityLabel(city, language);
  if (language !== "az") return label;
  let lastVowel = "a";
  for (let i = label.length - 1; i >= 0; i--) {
    const ch = label[i].toLowerCase();
    if (AZ_VOWELS.includes(ch)) { lastVowel = ch; break; }
  }
  return `${label}${BACK_VOWELS.has(lastVowel) ? "da" : "də"}`;
}

/* City Guide URLs (/destinations/:slug) use a lowercase slug of the
   canonical `city` value above — these two helpers are the only place
   that mapping happens, so every other module stays in sync automatically. */
export function citySlug(city) {
  return city.toLowerCase();
}

export function cityFromSlug(slug) {
  return ALL_DESTINATIONS.find((city) => citySlug(city) === slug) || null;
}
