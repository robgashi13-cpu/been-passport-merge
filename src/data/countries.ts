export interface Country {
  code: string;
  name: string;
  continent: string;
  passportRank?: number;
  visaFreeDestinations?: number;
  flagEmoji: string;
}

export const countries: Country[] = [
  { code: "US", name: "United States", continent: "North America", passportRank: 8, visaFreeDestinations: 186, flagEmoji: "🇺🇸" },
  { code: "GB", name: "United Kingdom", continent: "Europe", passportRank: 4, visaFreeDestinations: 190, flagEmoji: "🇬🇧" },
  { code: "DE", name: "Germany", continent: "Europe", passportRank: 3, visaFreeDestinations: 192, flagEmoji: "🇩🇪" },
  { code: "FR", name: "France", continent: "Europe", passportRank: 5, visaFreeDestinations: 189, flagEmoji: "🇫🇷" },
  { code: "JP", name: "Japan", continent: "Asia", passportRank: 1, visaFreeDestinations: 194, flagEmoji: "🇯🇵" },
  { code: "SG", name: "Singapore", continent: "Asia", passportRank: 2, visaFreeDestinations: 193, flagEmoji: "🇸🇬" },
  { code: "IT", name: "Italy", continent: "Europe", passportRank: 5, visaFreeDestinations: 189, flagEmoji: "🇮🇹" },
  { code: "ES", name: "Spain", continent: "Europe", passportRank: 5, visaFreeDestinations: 189, flagEmoji: "🇪🇸" },
  { code: "AU", name: "Australia", continent: "Oceania", passportRank: 9, visaFreeDestinations: 185, flagEmoji: "🇦🇺" },
  { code: "CA", name: "Canada", continent: "North America", passportRank: 9, visaFreeDestinations: 185, flagEmoji: "🇨🇦" },
  { code: "KR", name: "South Korea", continent: "Asia", passportRank: 3, visaFreeDestinations: 192, flagEmoji: "🇰🇷" },
  { code: "NL", name: "Netherlands", continent: "Europe", passportRank: 6, visaFreeDestinations: 188, flagEmoji: "🇳🇱" },
  { code: "SE", name: "Sweden", continent: "Europe", passportRank: 7, visaFreeDestinations: 187, flagEmoji: "🇸🇪" },
  { code: "CH", name: "Switzerland", continent: "Europe", passportRank: 7, visaFreeDestinations: 187, flagEmoji: "🇨🇭" },
  { code: "BR", name: "Brazil", continent: "South America", passportRank: 21, visaFreeDestinations: 170, flagEmoji: "🇧🇷" },
  { code: "MX", name: "Mexico", continent: "North America", passportRank: 25, visaFreeDestinations: 159, flagEmoji: "🇲🇽" },
  { code: "IN", name: "India", continent: "Asia", passportRank: 85, visaFreeDestinations: 57, flagEmoji: "🇮🇳" },
  { code: "CN", name: "China", continent: "Asia", passportRank: 66, visaFreeDestinations: 80, flagEmoji: "🇨🇳" },
  { code: "RU", name: "Russia", continent: "Europe", passportRank: 52, visaFreeDestinations: 118, flagEmoji: "🇷🇺" },
  { code: "ZA", name: "South Africa", continent: "Africa", passportRank: 55, visaFreeDestinations: 106, flagEmoji: "🇿🇦" },
  { code: "AE", name: "United Arab Emirates", continent: "Asia", passportRank: 15, visaFreeDestinations: 179, flagEmoji: "🇦🇪" },
  { code: "NZ", name: "New Zealand", continent: "Oceania", passportRank: 9, visaFreeDestinations: 185, flagEmoji: "🇳🇿" },
  { code: "TH", name: "Thailand", continent: "Asia", passportRank: 67, visaFreeDestinations: 78, flagEmoji: "🇹🇭" },
  { code: "VN", name: "Vietnam", continent: "Asia", passportRank: 94, visaFreeDestinations: 49, flagEmoji: "🇻🇳" },
  { code: "ID", name: "Indonesia", continent: "Asia", passportRank: 74, visaFreeDestinations: 72, flagEmoji: "🇮🇩" },
  { code: "EG", name: "Egypt", continent: "Africa", passportRank: 96, visaFreeDestinations: 47, flagEmoji: "🇪🇬" },
  { code: "GR", name: "Greece", continent: "Europe", passportRank: 8, visaFreeDestinations: 186, flagEmoji: "🇬🇷" },
  { code: "PT", name: "Portugal", continent: "Europe", passportRank: 6, visaFreeDestinations: 188, flagEmoji: "🇵🇹" },
  { code: "NO", name: "Norway", continent: "Europe", passportRank: 8, visaFreeDestinations: 186, flagEmoji: "🇳🇴" },
  { code: "DK", name: "Denmark", continent: "Europe", passportRank: 6, visaFreeDestinations: 188, flagEmoji: "🇩🇰" },
  { code: "FI", name: "Finland", continent: "Europe", passportRank: 5, visaFreeDestinations: 189, flagEmoji: "🇫🇮" },
  { code: "IE", name: "Ireland", continent: "Europe", passportRank: 7, visaFreeDestinations: 187, flagEmoji: "🇮🇪" },
  { code: "AT", name: "Austria", continent: "Europe", passportRank: 6, visaFreeDestinations: 188, flagEmoji: "🇦🇹" },
  { code: "BE", name: "Belgium", continent: "Europe", passportRank: 6, visaFreeDestinations: 188, flagEmoji: "🇧🇪" },
  { code: "PL", name: "Poland", continent: "Europe", passportRank: 11, visaFreeDestinations: 183, flagEmoji: "🇵🇱" },
  { code: "CZ", name: "Czech Republic", continent: "Europe", passportRank: 10, visaFreeDestinations: 184, flagEmoji: "🇨🇿" },
  { code: "AR", name: "Argentina", continent: "South America", passportRank: 19, visaFreeDestinations: 171, flagEmoji: "🇦🇷" },
  { code: "CL", name: "Chile", continent: "South America", passportRank: 17, visaFreeDestinations: 174, flagEmoji: "🇨🇱" },
  { code: "CO", name: "Colombia", continent: "South America", passportRank: 42, visaFreeDestinations: 132, flagEmoji: "🇨🇴" },
  { code: "PE", name: "Peru", continent: "South America", passportRank: 39, visaFreeDestinations: 136, flagEmoji: "🇵🇪" },
  { code: "MA", name: "Morocco", continent: "Africa", passportRank: 79, visaFreeDestinations: 65, flagEmoji: "🇲🇦" },
  { code: "KE", name: "Kenya", continent: "Africa", passportRank: 77, visaFreeDestinations: 68, flagEmoji: "🇰🇪" },
  { code: "NG", name: "Nigeria", continent: "Africa", passportRank: 98, visaFreeDestinations: 45, flagEmoji: "🇳🇬" },
  { code: "MY", name: "Malaysia", continent: "Asia", passportRank: 14, visaFreeDestinations: 180, flagEmoji: "🇲🇾" },
  { code: "PH", name: "Philippines", continent: "Asia", passportRank: 79, visaFreeDestinations: 65, flagEmoji: "🇵🇭" },
  { code: "TR", name: "Turkey", continent: "Europe", passportRank: 54, visaFreeDestinations: 110, flagEmoji: "🇹🇷" },
  { code: "IL", name: "Israel", continent: "Asia", passportRank: 23, visaFreeDestinations: 161, flagEmoji: "🇮🇱" },
  { code: "SA", name: "Saudi Arabia", continent: "Asia", passportRank: 65, visaFreeDestinations: 81, flagEmoji: "🇸🇦" },
  { code: "HK", name: "Hong Kong", continent: "Asia", passportRank: 19, visaFreeDestinations: 171, flagEmoji: "🇭🇰" },
  { code: "TW", name: "Taiwan", continent: "Asia", passportRank: 35, visaFreeDestinations: 145, flagEmoji: "🇹🇼" },
];

export const continents = ["All", "Europe", "Asia", "North America", "South America", "Africa", "Oceania"];

export const getCountryByCode = (code: string): Country | undefined => {
  return countries.find(c => c.code === code);
};

export const getCountriesByContinent = (continent: string): Country[] => {
  if (continent === "All") return countries;
  return countries.filter(c => c.continent === continent);
};
