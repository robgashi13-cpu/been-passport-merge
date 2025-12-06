export interface Country {
  code: string;
  name: string;
  continent: string;
  passportRank?: number;
  visaFreeDestinations?: number;
  flagEmoji: string;
  region?: string;
  capital?: string;
  population?: number;
}

export const countries: Country[] = [
  // Europe
  { code: "AL", name: "Albania", continent: "Europe", passportRank: 49, visaFreeDestinations: 119, flagEmoji: "🇦🇱", capital: "Tirana", population: 2877797 },
  { code: "AD", name: "Andorra", continent: "Europe", passportRank: 37, visaFreeDestinations: 140, flagEmoji: "🇦🇩", capital: "Andorra la Vella", population: 77265 },
  { code: "AT", name: "Austria", continent: "Europe", passportRank: 4, visaFreeDestinations: 191, flagEmoji: "🇦🇹", capital: "Vienna", population: 9006398 },
  { code: "BY", name: "Belarus", continent: "Europe", passportRank: 71, visaFreeDestinations: 77, flagEmoji: "🇧🇾", capital: "Minsk", population: 9449323 },
  { code: "BE", name: "Belgium", continent: "Europe", passportRank: 5, visaFreeDestinations: 190, flagEmoji: "🇧🇪", capital: "Brussels", population: 11589623 },
  { code: "BA", name: "Bosnia and Herzegovina", continent: "Europe", passportRank: 48, visaFreeDestinations: 120, flagEmoji: "🇧🇦", capital: "Sarajevo", population: 3280819 },
  { code: "BG", name: "Bulgaria", continent: "Europe", passportRank: 15, visaFreeDestinations: 175, flagEmoji: "🇧🇬", capital: "Sofia", population: 6948445 },
  { code: "HR", name: "Croatia", continent: "Europe", passportRank: 14, visaFreeDestinations: 176, flagEmoji: "🇭🇷", capital: "Zagreb", population: 4105267 },
  { code: "CY", name: "Cyprus", continent: "Europe", passportRank: 16, visaFreeDestinations: 174, flagEmoji: "🇨🇾", capital: "Nicosia", population: 1207359 },
  { code: "CZ", name: "Czech Republic", continent: "Europe", passportRank: 4, visaFreeDestinations: 191, flagEmoji: "🇨🇿", capital: "Prague", population: 10708981 },
  { code: "DK", name: "Denmark", continent: "Europe", passportRank: 4, visaFreeDestinations: 191, flagEmoji: "🇩🇰", capital: "Copenhagen", population: 5792202 },
  { code: "EE", name: "Estonia", continent: "Europe", passportRank: 8, visaFreeDestinations: 187, flagEmoji: "🇪🇪", capital: "Tallinn", population: 1326535 },
  { code: "FI", name: "Finland", continent: "Europe", passportRank: 2, visaFreeDestinations: 193, flagEmoji: "🇫🇮", capital: "Helsinki", population: 5540720 },
  { code: "FR", name: "France", continent: "Europe", passportRank: 2, visaFreeDestinations: 193, flagEmoji: "🇫🇷", capital: "Paris", population: 67390000 },
  { code: "DE", name: "Germany", continent: "Europe", passportRank: 2, visaFreeDestinations: 193, flagEmoji: "🇩🇪", capital: "Berlin", population: 83783942 },
  { code: "GR", name: "Greece", continent: "Europe", passportRank: 6, visaFreeDestinations: 189, flagEmoji: "🇬🇷", capital: "Athens", population: 10423054 },
  { code: "HU", name: "Hungary", continent: "Europe", passportRank: 9, visaFreeDestinations: 186, flagEmoji: "🇭🇺", capital: "Budapest", population: 9660351 },
  { code: "IS", name: "Iceland", continent: "Europe", passportRank: 8, visaFreeDestinations: 187, flagEmoji: "🇮🇸", capital: "Reykjavik", population: 341243 },
  { code: "IE", name: "Ireland", continent: "Europe", passportRank: 3, visaFreeDestinations: 192, flagEmoji: "🇮🇪", capital: "Dublin", population: 4937786 },
  { code: "IT", name: "Italy", continent: "Europe", passportRank: 2, visaFreeDestinations: 193, flagEmoji: "🇮🇹", capital: "Rome", population: 60461826 },
  { code: "XK", name: "Kosovo", continent: "Europe", passportRank: 93, visaFreeDestinations: 48, flagEmoji: "🇽🇰", capital: "Pristina", population: 1810366 },
  { code: "LV", name: "Latvia", continent: "Europe", passportRank: 10, visaFreeDestinations: 185, flagEmoji: "🇱🇻", capital: "Riga", population: 1886198 },
  { code: "LI", name: "Liechtenstein", continent: "Europe", passportRank: 5, visaFreeDestinations: 190, flagEmoji: "🇱🇮", capital: "Vaduz", population: 38128 },
  { code: "LT", name: "Lithuania", continent: "Europe", passportRank: 8, visaFreeDestinations: 187, flagEmoji: "🇱🇹", capital: "Vilnius", population: 2722289 },
  { code: "LU", name: "Luxembourg", continent: "Europe", passportRank: 3, visaFreeDestinations: 192, flagEmoji: "🇱🇺", capital: "Luxembourg City", population: 625978 },
  { code: "MT", name: "Malta", continent: "Europe", passportRank: 6, visaFreeDestinations: 189, flagEmoji: "🇲🇹", capital: "Valletta", population: 441543 },
  { code: "MD", name: "Moldova", continent: "Europe", passportRank: 48, visaFreeDestinations: 120, flagEmoji: "🇲🇩", capital: "Chisinau", population: 4033963 },
  { code: "MC", name: "Monaco", continent: "Europe", passportRank: 13, visaFreeDestinations: 177, flagEmoji: "🇲🇨", capital: "Monaco", population: 39242 },
  { code: "ME", name: "Montenegro", continent: "Europe", passportRank: 43, visaFreeDestinations: 128, flagEmoji: "🇲🇪", capital: "Podgorica", population: 628066 },
  { code: "NL", name: "Netherlands", continent: "Europe", passportRank: 4, visaFreeDestinations: 191, flagEmoji: "🇳🇱", capital: "Amsterdam", population: 17134872 },
  { code: "MK", name: "North Macedonia", continent: "Europe", passportRank: 45, visaFreeDestinations: 126, flagEmoji: "🇲🇰", capital: "Skopje", population: 2083374 },
  { code: "NO", name: "Norway", continent: "Europe", passportRank: 6, visaFreeDestinations: 189, flagEmoji: "🇳🇴", capital: "Oslo", population: 5421241 },
  { code: "PL", name: "Poland", continent: "Europe", passportRank: 8, visaFreeDestinations: 187, flagEmoji: "🇵🇱", capital: "Warsaw", population: 37846611 },
  { code: "PT", name: "Portugal", continent: "Europe", passportRank: 5, visaFreeDestinations: 190, flagEmoji: "🇵🇹", capital: "Lisbon", population: 10196709 },
  { code: "RO", name: "Romania", continent: "Europe", passportRank: 14, visaFreeDestinations: 176, flagEmoji: "🇷🇴", capital: "Bucharest", population: 19237691 },
  { code: "RU", name: "Russia", continent: "Europe", passportRank: 50, visaFreeDestinations: 118, flagEmoji: "🇷🇺", capital: "Moscow", population: 145934462 },
  { code: "SM", name: "San Marino", continent: "Europe", passportRank: 27, visaFreeDestinations: 161, flagEmoji: "🇸🇲", capital: "San Marino", population: 33931 },
  { code: "RS", name: "Serbia", continent: "Europe", passportRank: 38, visaFreeDestinations: 139, flagEmoji: "🇷🇸", capital: "Belgrade", population: 6982084 },
  { code: "SK", name: "Slovakia", continent: "Europe", passportRank: 10, visaFreeDestinations: 185, flagEmoji: "🇸🇰", capital: "Bratislava", population: 5459642 },
  { code: "SI", name: "Slovenia", continent: "Europe", passportRank: 7, visaFreeDestinations: 188, flagEmoji: "🇸🇮", capital: "Ljubljana", population: 2078938 },
  { code: "ES", name: "Spain", continent: "Europe", passportRank: 2, visaFreeDestinations: 193, flagEmoji: "🇪🇸", capital: "Madrid", population: 46754778 },
  { code: "SE", name: "Sweden", continent: "Europe", passportRank: 4, visaFreeDestinations: 191, flagEmoji: "🇸🇪", capital: "Stockholm", population: 10099265 },
  { code: "CH", name: "Switzerland", continent: "Europe", passportRank: 4, visaFreeDestinations: 191, flagEmoji: "🇨🇭", capital: "Bern", population: 8654622 },
  { code: "UA", name: "Ukraine", continent: "Europe", passportRank: 36, visaFreeDestinations: 141, flagEmoji: "🇺🇦", capital: "Kyiv", population: 43733762 },
  { code: "GB", name: "United Kingdom", continent: "Europe", passportRank: 4, visaFreeDestinations: 191, flagEmoji: "🇬🇧", capital: "London", population: 67886011 },
  { code: "VA", name: "Vatican City", continent: "Europe", passportRank: 17, visaFreeDestinations: 173, flagEmoji: "🇻🇦", capital: "Vatican City", population: 825 },
  { code: "TR", name: "Turkey", continent: "Europe", passportRank: 52, visaFreeDestinations: 115, flagEmoji: "🇹🇷", capital: "Ankara", population: 84339067 },

  // Asia
  { code: "AF", name: "Afghanistan", continent: "Asia", passportRank: 104, visaFreeDestinations: 27, flagEmoji: "🇦🇫", capital: "Kabul", population: 38928346 },
  { code: "AM", name: "Armenia", continent: "Asia", passportRank: 58, visaFreeDestinations: 98, flagEmoji: "🇦🇲", capital: "Yerevan", population: 2963243 },
  { code: "AZ", name: "Azerbaijan", continent: "Asia", passportRank: 74, visaFreeDestinations: 70, flagEmoji: "🇦🇿", capital: "Baku", population: 10139177 },
  { code: "BH", name: "Bahrain", continent: "Asia", passportRank: 59, visaFreeDestinations: 95, flagEmoji: "🇧🇭", capital: "Manama", population: 1701575 },
  { code: "BD", name: "Bangladesh", continent: "Asia", passportRank: 100, visaFreeDestinations: 41, flagEmoji: "🇧🇩", capital: "Dhaka", population: 164689383 },
  { code: "BT", name: "Bhutan", continent: "Asia", passportRank: 86, visaFreeDestinations: 54, flagEmoji: "🇧🇹", capital: "Thimphu", population: 771608 },
  { code: "BN", name: "Brunei", continent: "Asia", passportRank: 22, visaFreeDestinations: 167, flagEmoji: "🇧🇳", capital: "Bandar Seri Begawan", population: 437479 },
  { code: "KH", name: "Cambodia", continent: "Asia", passportRank: 88, visaFreeDestinations: 53, flagEmoji: "🇰🇭", capital: "Phnom Penh", population: 16718965 },
  { code: "CN", name: "China", continent: "Asia", passportRank: 64, visaFreeDestinations: 85, flagEmoji: "🇨🇳", capital: "Beijing", population: 1439323776 },
  { code: "GE", name: "Georgia", continent: "Asia", passportRank: 52, visaFreeDestinations: 115, flagEmoji: "🇬🇪", capital: "Tbilisi", population: 3989167 },
  { code: "HK", name: "Hong Kong", continent: "Asia", passportRank: 18, visaFreeDestinations: 171, flagEmoji: "🇭🇰", capital: "Hong Kong", population: 7496981 },
  { code: "IN", name: "India", continent: "Asia", passportRank: 82, visaFreeDestinations: 59, flagEmoji: "🇮🇳", capital: "New Delhi", population: 1380004385 },
  { code: "ID", name: "Indonesia", continent: "Asia", passportRank: 70, visaFreeDestinations: 78, flagEmoji: "🇮🇩", capital: "Jakarta", population: 273523615 },
  { code: "IR", name: "Iran", continent: "Asia", passportRank: 97, visaFreeDestinations: 44, flagEmoji: "🇮🇷", capital: "Tehran", population: 83992949 },
  { code: "IQ", name: "Iraq", continent: "Asia", passportRank: 103, visaFreeDestinations: 29, flagEmoji: "🇮🇶", capital: "Baghdad", population: 40222493 },
  { code: "IL", name: "Israel", continent: "Asia", passportRank: 21, visaFreeDestinations: 168, flagEmoji: "🇮🇱", capital: "Jerusalem", population: 8655535 },
  { code: "JP", name: "Japan", continent: "Asia", passportRank: 1, visaFreeDestinations: 194, flagEmoji: "🇯🇵", capital: "Tokyo", population: 126476461 },
  { code: "JO", name: "Jordan", continent: "Asia", passportRank: 69, visaFreeDestinations: 79, flagEmoji: "🇯🇴", capital: "Amman", population: 10203134 },
  { code: "KZ", name: "Kazakhstan", continent: "Asia", passportRank: 68, visaFreeDestinations: 80, flagEmoji: "🇰🇿", capital: "Nur-Sultan", population: 18776707 },
  { code: "KW", name: "Kuwait", continent: "Asia", passportRank: 54, visaFreeDestinations: 103, flagEmoji: "🇰🇼", capital: "Kuwait City", population: 4270571 },
  { code: "KG", name: "Kyrgyzstan", continent: "Asia", passportRank: 73, visaFreeDestinations: 71, flagEmoji: "🇰🇬", capital: "Bishkek", population: 6524195 },
  { code: "LA", name: "Laos", continent: "Asia", passportRank: 87, visaFreeDestinations: 53, flagEmoji: "🇱🇦", capital: "Vientiane", population: 7275560 },
  { code: "LB", name: "Lebanon", continent: "Asia", passportRank: 96, visaFreeDestinations: 46, flagEmoji: "🇱🇧", capital: "Beirut", population: 6825445 },
  { code: "MO", name: "Macau", continent: "Asia", passportRank: 32, visaFreeDestinations: 147, flagEmoji: "🇲🇴", capital: "Macau", population: 649335 },
  { code: "MY", name: "Malaysia", continent: "Asia", passportRank: 12, visaFreeDestinations: 180, flagEmoji: "🇲🇾", capital: "Kuala Lumpur", population: 32365999 },
  { code: "MV", name: "Maldives", continent: "Asia", passportRank: 62, visaFreeDestinations: 90, flagEmoji: "🇲🇻", capital: "Male", population: 540544 },
  { code: "MN", name: "Mongolia", continent: "Asia", passportRank: 67, visaFreeDestinations: 82, flagEmoji: "🇲🇳", capital: "Ulaanbaatar", population: 3278290 },
  { code: "MM", name: "Myanmar", continent: "Asia", passportRank: 89, visaFreeDestinations: 52, flagEmoji: "🇲🇲", capital: "Naypyidaw", population: 54409800 },
  { code: "NP", name: "Nepal", continent: "Asia", passportRank: 99, visaFreeDestinations: 42, flagEmoji: "🇳🇵", capital: "Kathmandu", population: 29136808 },
  { code: "KP", name: "North Korea", continent: "Asia", passportRank: 102, visaFreeDestinations: 40, flagEmoji: "🇰🇵", capital: "Pyongyang", population: 25778816 },
  { code: "OM", name: "Oman", continent: "Asia", passportRank: 60, visaFreeDestinations: 93, flagEmoji: "🇴🇲", capital: "Muscat", population: 5106626 },
  { code: "PK", name: "Pakistan", continent: "Asia", passportRank: 101, visaFreeDestinations: 40, flagEmoji: "🇵🇰", capital: "Islamabad", population: 220892340 },
  { code: "PS", name: "Palestine", continent: "Asia", passportRank: 98, visaFreeDestinations: 43, flagEmoji: "🇵🇸", capital: "Ramallah", population: 5101414 },
  { code: "PH", name: "Philippines", continent: "Asia", passportRank: 75, visaFreeDestinations: 68, flagEmoji: "🇵🇭", capital: "Manila", population: 109581078 },
  { code: "QA", name: "Qatar", continent: "Asia", passportRank: 51, visaFreeDestinations: 117, flagEmoji: "🇶🇦", capital: "Doha", population: 2881053 },
  { code: "SA", name: "Saudi Arabia", continent: "Asia", passportRank: 61, visaFreeDestinations: 91, flagEmoji: "🇸🇦", capital: "Riyadh", population: 34813871 },
  { code: "SG", name: "Singapore", continent: "Asia", passportRank: 1, visaFreeDestinations: 194, flagEmoji: "🇸🇬", capital: "Singapore", population: 5850342 },
  { code: "KR", name: "South Korea", continent: "Asia", passportRank: 2, visaFreeDestinations: 193, flagEmoji: "🇰🇷", capital: "Seoul", population: 51269185 },
  { code: "LK", name: "Sri Lanka", continent: "Asia", passportRank: 94, visaFreeDestinations: 47, flagEmoji: "🇱🇰", capital: "Colombo", population: 21413249 },
  { code: "SY", name: "Syria", continent: "Asia", passportRank: 105, visaFreeDestinations: 26, flagEmoji: "🇸🇾", capital: "Damascus", population: 17500658 },
  { code: "TW", name: "Taiwan", continent: "Asia", passportRank: 31, visaFreeDestinations: 148, flagEmoji: "🇹🇼", capital: "Taipei", population: 23816775 },
  { code: "TJ", name: "Tajikistan", continent: "Asia", passportRank: 79, visaFreeDestinations: 63, flagEmoji: "🇹🇯", capital: "Dushanbe", population: 9537645 },
  { code: "TH", name: "Thailand", continent: "Asia", passportRank: 63, visaFreeDestinations: 86, flagEmoji: "🇹🇭", capital: "Bangkok", population: 69799978 },
  { code: "TL", name: "Timor-Leste", continent: "Asia", passportRank: 85, visaFreeDestinations: 55, flagEmoji: "🇹🇱", capital: "Dili", population: 1318445 },
  { code: "TM", name: "Turkmenistan", continent: "Asia", passportRank: 83, visaFreeDestinations: 57, flagEmoji: "🇹🇲", capital: "Ashgabat", population: 6031200 },
  { code: "AE", name: "United Arab Emirates", continent: "Asia", passportRank: 11, visaFreeDestinations: 183, flagEmoji: "🇦🇪", capital: "Abu Dhabi", population: 9890402 },
  { code: "UZ", name: "Uzbekistan", continent: "Asia", passportRank: 78, visaFreeDestinations: 64, flagEmoji: "🇺🇿", capital: "Tashkent", population: 33469203 },
  { code: "VN", name: "Vietnam", continent: "Asia", passportRank: 84, visaFreeDestinations: 56, flagEmoji: "🇻🇳", capital: "Hanoi", population: 97338579 },
  { code: "YE", name: "Yemen", continent: "Asia", passportRank: 106, visaFreeDestinations: 25, flagEmoji: "🇾🇪", capital: "Sana'a", population: 29825964 },

  // Africa
  { code: "DZ", name: "Algeria", continent: "Africa", passportRank: 91, visaFreeDestinations: 50, flagEmoji: "🇩🇿", capital: "Algiers", population: 43851044 },
  { code: "AO", name: "Angola", continent: "Africa", passportRank: 90, visaFreeDestinations: 51, flagEmoji: "🇦🇴", capital: "Luanda", population: 32866272 },
  { code: "BJ", name: "Benin", continent: "Africa", passportRank: 84, visaFreeDestinations: 56, flagEmoji: "🇧🇯", capital: "Porto-Novo", population: 12123200 },
  { code: "BW", name: "Botswana", continent: "Africa", passportRank: 57, visaFreeDestinations: 99, flagEmoji: "🇧🇼", capital: "Gaborone", population: 2351627 },
  { code: "BF", name: "Burkina Faso", continent: "Africa", passportRank: 90, visaFreeDestinations: 51, flagEmoji: "🇧🇫", capital: "Ouagadougou", population: 20903273 },
  { code: "BI", name: "Burundi", continent: "Africa", passportRank: 91, visaFreeDestinations: 50, flagEmoji: "🇧🇮", capital: "Gitega", population: 11890784 },
  { code: "CV", name: "Cape Verde", continent: "Africa", passportRank: 77, visaFreeDestinations: 66, flagEmoji: "🇨🇻", capital: "Praia", population: 555987 },
  { code: "CM", name: "Cameroon", continent: "Africa", passportRank: 85, visaFreeDestinations: 55, flagEmoji: "🇨🇲", capital: "Yaoundé", population: 26545863 },
  { code: "CF", name: "Central African Republic", continent: "Africa", passportRank: 92, visaFreeDestinations: 49, flagEmoji: "🇨🇫", capital: "Bangui", population: 4829767 },
  { code: "TD", name: "Chad", continent: "Africa", passportRank: 93, visaFreeDestinations: 48, flagEmoji: "🇹🇩", capital: "N'Djamena", population: 16425864 },
  { code: "KM", name: "Comoros", continent: "Africa", passportRank: 87, visaFreeDestinations: 53, flagEmoji: "🇰🇲", capital: "Moroni", population: 869601 },
  { code: "CG", name: "Congo", continent: "Africa", passportRank: 86, visaFreeDestinations: 54, flagEmoji: "🇨🇬", capital: "Brazzaville", population: 5518087 },
  { code: "CD", name: "DR Congo", continent: "Africa", passportRank: 95, visaFreeDestinations: 46, flagEmoji: "🇨🇩", capital: "Kinshasa", population: 89561403 },
  { code: "CI", name: "Côte d'Ivoire", continent: "Africa", passportRank: 82, visaFreeDestinations: 59, flagEmoji: "🇨🇮", capital: "Yamoussoukro", population: 26378274 },
  { code: "DJ", name: "Djibouti", continent: "Africa", passportRank: 88, visaFreeDestinations: 52, flagEmoji: "🇩🇯", capital: "Djibouti", population: 988000 },
  { code: "EG", name: "Egypt", continent: "Africa", passportRank: 89, visaFreeDestinations: 52, flagEmoji: "🇪🇬", capital: "Cairo", population: 102334404 },
  { code: "GQ", name: "Equatorial Guinea", continent: "Africa", passportRank: 88, visaFreeDestinations: 52, flagEmoji: "🇬🇶", capital: "Malabo", population: 1402985 },
  { code: "ER", name: "Eritrea", continent: "Africa", passportRank: 99, visaFreeDestinations: 42, flagEmoji: "🇪🇷", capital: "Asmara", population: 3546421 },
  { code: "SZ", name: "Eswatini", continent: "Africa", passportRank: 70, visaFreeDestinations: 78, flagEmoji: "🇸🇿", capital: "Mbabane", population: 1160164 },
  { code: "ET", name: "Ethiopia", continent: "Africa", passportRank: 95, visaFreeDestinations: 46, flagEmoji: "🇪🇹", capital: "Addis Ababa", population: 114963588 },
  { code: "GA", name: "Gabon", continent: "Africa", passportRank: 76, visaFreeDestinations: 67, flagEmoji: "🇬🇦", capital: "Libreville", population: 2225734 },
  { code: "GM", name: "Gambia", continent: "Africa", passportRank: 78, visaFreeDestinations: 64, flagEmoji: "🇬🇲", capital: "Banjul", population: 2416668 },
  { code: "GH", name: "Ghana", continent: "Africa", passportRank: 76, visaFreeDestinations: 67, flagEmoji: "🇬🇭", capital: "Accra", population: 31072940 },
  { code: "GN", name: "Guinea", continent: "Africa", passportRank: 87, visaFreeDestinations: 53, flagEmoji: "🇬🇳", capital: "Conakry", population: 13132795 },
  { code: "GW", name: "Guinea-Bissau", continent: "Africa", passportRank: 83, visaFreeDestinations: 57, flagEmoji: "🇬🇼", capital: "Bissau", population: 1968001 },
  { code: "KE", name: "Kenya", continent: "Africa", passportRank: 72, visaFreeDestinations: 73, flagEmoji: "🇰🇪", capital: "Nairobi", population: 53771296 },
  { code: "LS", name: "Lesotho", continent: "Africa", passportRank: 66, visaFreeDestinations: 83, flagEmoji: "🇱🇸", capital: "Maseru", population: 2142249 },
  { code: "LR", name: "Liberia", continent: "Africa", passportRank: 94, visaFreeDestinations: 47, flagEmoji: "🇱🇷", capital: "Monrovia", population: 5057681 },
  { code: "LY", name: "Libya", continent: "Africa", passportRank: 100, visaFreeDestinations: 41, flagEmoji: "🇱🇾", capital: "Tripoli", population: 6871292 },
  { code: "MG", name: "Madagascar", continent: "Africa", passportRank: 80, visaFreeDestinations: 62, flagEmoji: "🇲🇬", capital: "Antananarivo", population: 27691018 },
  { code: "MW", name: "Malawi", continent: "Africa", passportRank: 71, visaFreeDestinations: 77, flagEmoji: "🇲🇼", capital: "Lilongwe", population: 19129952 },
  { code: "ML", name: "Mali", continent: "Africa", passportRank: 85, visaFreeDestinations: 55, flagEmoji: "🇲🇱", capital: "Bamako", population: 20250833 },
  { code: "MR", name: "Mauritania", continent: "Africa", passportRank: 86, visaFreeDestinations: 54, flagEmoji: "🇲🇷", capital: "Nouakchott", population: 4649658 },
  { code: "MU", name: "Mauritius", continent: "Africa", passportRank: 30, visaFreeDestinations: 149, flagEmoji: "🇲🇺", capital: "Port Louis", population: 1271768 },
  { code: "MA", name: "Morocco", continent: "Africa", passportRank: 75, visaFreeDestinations: 68, flagEmoji: "🇲🇦", capital: "Rabat", population: 36910560 },
  { code: "MZ", name: "Mozambique", continent: "Africa", passportRank: 77, visaFreeDestinations: 66, flagEmoji: "🇲🇿", capital: "Maputo", population: 31255435 },
  { code: "NA", name: "Namibia", continent: "Africa", passportRank: 65, visaFreeDestinations: 84, flagEmoji: "🇳🇦", capital: "Windhoek", population: 2540905 },
  { code: "NE", name: "Niger", continent: "Africa", passportRank: 88, visaFreeDestinations: 52, flagEmoji: "🇳🇪", capital: "Niamey", population: 24206644 },
  { code: "NG", name: "Nigeria", continent: "Africa", passportRank: 92, visaFreeDestinations: 49, flagEmoji: "🇳🇬", capital: "Abuja", population: 206139589 },
  { code: "RW", name: "Rwanda", continent: "Africa", passportRank: 80, visaFreeDestinations: 62, flagEmoji: "🇷🇼", capital: "Kigali", population: 12952218 },
  { code: "ST", name: "São Tomé and Príncipe", continent: "Africa", passportRank: 73, visaFreeDestinations: 71, flagEmoji: "🇸🇹", capital: "São Tomé", population: 219159 },
  { code: "SN", name: "Senegal", continent: "Africa", passportRank: 80, visaFreeDestinations: 62, flagEmoji: "🇸🇳", capital: "Dakar", population: 16743927 },
  { code: "SC", name: "Seychelles", continent: "Africa", passportRank: 26, visaFreeDestinations: 162, flagEmoji: "🇸🇨", capital: "Victoria", population: 98347 },
  { code: "SL", name: "Sierra Leone", continent: "Africa", passportRank: 84, visaFreeDestinations: 56, flagEmoji: "🇸🇱", capital: "Freetown", population: 7976983 },
  { code: "SO", name: "Somalia", continent: "Africa", passportRank: 103, visaFreeDestinations: 29, flagEmoji: "🇸🇴", capital: "Mogadishu", population: 15893222 },
  { code: "ZA", name: "South Africa", continent: "Africa", passportRank: 53, visaFreeDestinations: 106, flagEmoji: "🇿🇦", capital: "Pretoria", population: 59308690 },
  { code: "SS", name: "South Sudan", continent: "Africa", passportRank: 100, visaFreeDestinations: 41, flagEmoji: "🇸🇸", capital: "Juba", population: 11193725 },
  { code: "SD", name: "Sudan", continent: "Africa", passportRank: 96, visaFreeDestinations: 46, flagEmoji: "🇸🇩", capital: "Khartoum", population: 43849260 },
  { code: "TZ", name: "Tanzania", continent: "Africa", passportRank: 73, visaFreeDestinations: 71, flagEmoji: "🇹🇿", capital: "Dodoma", population: 59734218 },
  { code: "TG", name: "Togo", continent: "Africa", passportRank: 81, visaFreeDestinations: 61, flagEmoji: "🇹🇬", capital: "Lomé", population: 8278724 },
  { code: "TN", name: "Tunisia", continent: "Africa", passportRank: 72, visaFreeDestinations: 73, flagEmoji: "🇹🇳", capital: "Tunis", population: 11818619 },
  { code: "UG", name: "Uganda", continent: "Africa", passportRank: 74, visaFreeDestinations: 70, flagEmoji: "🇺🇬", capital: "Kampala", population: 45741007 },
  { code: "ZM", name: "Zambia", continent: "Africa", passportRank: 71, visaFreeDestinations: 77, flagEmoji: "🇿🇲", capital: "Lusaka", population: 18383955 },
  { code: "ZW", name: "Zimbabwe", continent: "Africa", passportRank: 79, visaFreeDestinations: 63, flagEmoji: "🇿🇼", capital: "Harare", population: 14862924 },

  // North America
  { code: "AG", name: "Antigua and Barbuda", continent: "North America", passportRank: 24, visaFreeDestinations: 165, flagEmoji: "🇦🇬", capital: "St. John's", population: 97929 },
  { code: "BS", name: "Bahamas", continent: "North America", passportRank: 25, visaFreeDestinations: 163, flagEmoji: "🇧🇸", capital: "Nassau", population: 393244 },
  { code: "BB", name: "Barbados", continent: "North America", passportRank: 23, visaFreeDestinations: 166, flagEmoji: "🇧🇧", capital: "Bridgetown", population: 287375 },
  { code: "BZ", name: "Belize", continent: "North America", passportRank: 55, visaFreeDestinations: 102, flagEmoji: "🇧🇿", capital: "Belmopan", population: 397628 },
  { code: "CA", name: "Canada", continent: "North America", passportRank: 7, visaFreeDestinations: 188, flagEmoji: "🇨🇦", capital: "Ottawa", population: 37742154 },
  { code: "CR", name: "Costa Rica", continent: "North America", passportRank: 29, visaFreeDestinations: 152, flagEmoji: "🇨🇷", capital: "San José", population: 5094118 },
  { code: "CU", name: "Cuba", continent: "North America", passportRank: 76, visaFreeDestinations: 67, flagEmoji: "🇨🇺", capital: "Havana", population: 11326616 },
  { code: "DM", name: "Dominica", continent: "North America", passportRank: 33, visaFreeDestinations: 146, flagEmoji: "🇩🇲", capital: "Roseau", population: 71986 },
  { code: "DO", name: "Dominican Republic", continent: "North America", passportRank: 69, visaFreeDestinations: 79, flagEmoji: "🇩🇴", capital: "Santo Domingo", population: 10847910 },
  { code: "SV", name: "El Salvador", continent: "North America", passportRank: 35, visaFreeDestinations: 143, flagEmoji: "🇸🇻", capital: "San Salvador", population: 6486205 },
  { code: "GD", name: "Grenada", continent: "North America", passportRank: 28, visaFreeDestinations: 153, flagEmoji: "🇬🇩", capital: "St. George's", population: 112523 },
  { code: "GT", name: "Guatemala", continent: "North America", passportRank: 40, visaFreeDestinations: 136, flagEmoji: "🇬🇹", capital: "Guatemala City", population: 17915568 },
  { code: "HT", name: "Haiti", continent: "North America", passportRank: 89, visaFreeDestinations: 52, flagEmoji: "🇭🇹", capital: "Port-au-Prince", population: 11402528 },
  { code: "HN", name: "Honduras", continent: "North America", passportRank: 42, visaFreeDestinations: 133, flagEmoji: "🇭🇳", capital: "Tegucigalpa", population: 9904607 },
  { code: "JM", name: "Jamaica", continent: "North America", passportRank: 60, visaFreeDestinations: 93, flagEmoji: "🇯🇲", capital: "Kingston", population: 2961167 },
  { code: "MX", name: "Mexico", continent: "North America", passportRank: 22, visaFreeDestinations: 167, flagEmoji: "🇲🇽", capital: "Mexico City", population: 128932753 },
  { code: "NI", name: "Nicaragua", continent: "North America", passportRank: 44, visaFreeDestinations: 127, flagEmoji: "🇳🇮", capital: "Managua", population: 6624554 },
  { code: "PA", name: "Panama", continent: "North America", passportRank: 34, visaFreeDestinations: 145, flagEmoji: "🇵🇦", capital: "Panama City", population: 4314767 },
  { code: "KN", name: "Saint Kitts and Nevis", continent: "North America", passportRank: 23, visaFreeDestinations: 166, flagEmoji: "🇰🇳", capital: "Basseterre", population: 53199 },
  { code: "LC", name: "Saint Lucia", continent: "North America", passportRank: 29, visaFreeDestinations: 152, flagEmoji: "🇱🇨", capital: "Castries", population: 183627 },
  { code: "VC", name: "Saint Vincent and the Grenadines", continent: "North America", passportRank: 28, visaFreeDestinations: 153, flagEmoji: "🇻🇨", capital: "Kingstown", population: 110940 },
  { code: "TT", name: "Trinidad and Tobago", continent: "North America", passportRank: 27, visaFreeDestinations: 156, flagEmoji: "🇹🇹", capital: "Port of Spain", population: 1399488 },
  { code: "US", name: "United States", continent: "North America", passportRank: 7, visaFreeDestinations: 188, flagEmoji: "🇺🇸", capital: "Washington, D.C.", population: 331002651 },

  // South America
  { code: "AR", name: "Argentina", continent: "South America", passportRank: 17, visaFreeDestinations: 172, flagEmoji: "🇦🇷", capital: "Buenos Aires", population: 45195774 },
  { code: "BO", name: "Bolivia", continent: "South America", passportRank: 66, visaFreeDestinations: 83, flagEmoji: "🇧🇴", capital: "Sucre", population: 11673021 },
  { code: "BR", name: "Brazil", continent: "South America", passportRank: 18, visaFreeDestinations: 171, flagEmoji: "🇧🇷", capital: "Brasília", population: 212559417 },
  { code: "CL", name: "Chile", continent: "South America", passportRank: 16, visaFreeDestinations: 174, flagEmoji: "🇨🇱", capital: "Santiago", population: 19116201 },
  { code: "CO", name: "Colombia", continent: "South America", passportRank: 41, visaFreeDestinations: 134, flagEmoji: "🇨🇴", capital: "Bogotá", population: 50882891 },
  { code: "EC", name: "Ecuador", continent: "South America", passportRank: 56, visaFreeDestinations: 100, flagEmoji: "🇪🇨", capital: "Quito", population: 17643054 },
  { code: "GY", name: "Guyana", continent: "South America", passportRank: 63, visaFreeDestinations: 88, flagEmoji: "🇬🇾", capital: "Georgetown", population: 786552 },
  { code: "PY", name: "Paraguay", continent: "South America", passportRank: 36, visaFreeDestinations: 142, flagEmoji: "🇵🇾", capital: "Asunción", population: 7132538 },
  { code: "PE", name: "Peru", continent: "South America", passportRank: 37, visaFreeDestinations: 140, flagEmoji: "🇵🇪", capital: "Lima", population: 32971854 },
  { code: "SR", name: "Suriname", continent: "South America", passportRank: 67, visaFreeDestinations: 82, flagEmoji: "🇸🇷", capital: "Paramaribo", population: 586632 },
  { code: "UY", name: "Uruguay", continent: "South America", passportRank: 25, visaFreeDestinations: 163, flagEmoji: "🇺🇾", capital: "Montevideo", population: 3473730 },
  { code: "VE", name: "Venezuela", continent: "South America", passportRank: 46, visaFreeDestinations: 125, flagEmoji: "🇻🇪", capital: "Caracas", population: 28435940 },

  // Oceania
  { code: "AU", name: "Australia", continent: "Oceania", passportRank: 6, visaFreeDestinations: 189, flagEmoji: "🇦🇺", capital: "Canberra", population: 25499884 },
  { code: "FJ", name: "Fiji", continent: "Oceania", passportRank: 56, visaFreeDestinations: 100, flagEmoji: "🇫🇯", capital: "Suva", population: 896445 },
  { code: "KI", name: "Kiribati", continent: "Oceania", passportRank: 64, visaFreeDestinations: 87, flagEmoji: "🇰🇮", capital: "Tarawa", population: 119449 },
  { code: "MH", name: "Marshall Islands", continent: "Oceania", passportRank: 43, visaFreeDestinations: 128, flagEmoji: "🇲🇭", capital: "Majuro", population: 59190 },
  { code: "FM", name: "Micronesia", continent: "Oceania", passportRank: 47, visaFreeDestinations: 124, flagEmoji: "🇫🇲", capital: "Palikir", population: 548914 },
  { code: "NR", name: "Nauru", continent: "Oceania", passportRank: 49, visaFreeDestinations: 119, flagEmoji: "🇳🇷", capital: "Yaren", population: 10824 },
  { code: "NZ", name: "New Zealand", continent: "Oceania", passportRank: 7, visaFreeDestinations: 188, flagEmoji: "🇳🇿", capital: "Wellington", population: 4822233 },
  { code: "PW", name: "Palau", continent: "Oceania", passportRank: 44, visaFreeDestinations: 127, flagEmoji: "🇵🇼", capital: "Ngerulmud", population: 18094 },
  { code: "PG", name: "Papua New Guinea", continent: "Oceania", passportRank: 81, visaFreeDestinations: 61, flagEmoji: "🇵🇬", capital: "Port Moresby", population: 8947024 },
  { code: "WS", name: "Samoa", continent: "Oceania", passportRank: 39, visaFreeDestinations: 137, flagEmoji: "🇼🇸", capital: "Apia", population: 198414 },
  { code: "SB", name: "Solomon Islands", continent: "Oceania", passportRank: 46, visaFreeDestinations: 125, flagEmoji: "🇸🇧", capital: "Honiara", population: 686884 },
  { code: "TO", name: "Tonga", continent: "Oceania", passportRank: 38, visaFreeDestinations: 139, flagEmoji: "🇹🇴", capital: "Nukuʻalofa", population: 105695 },
  { code: "TV", name: "Tuvalu", continent: "Oceania", passportRank: 40, visaFreeDestinations: 136, flagEmoji: "🇹🇻", capital: "Funafuti", population: 11792 },
  { code: "VU", name: "Vanuatu", continent: "Oceania", passportRank: 35, visaFreeDestinations: 143, flagEmoji: "🇻🇺", capital: "Port Vila", population: 307145 },
];

export const continents = ["All", "Europe", "Asia", "North America", "South America", "Africa", "Oceania"];

export const getCountryByCode = (code: string): Country | undefined => {
  return countries.find(c => c.code === code);
};

export const getCountriesByContinent = (continent: string): Country[] => {
  if (continent === "All") return countries;
  return countries.filter(c => c.continent === continent);
};

export const getTotalCountries = (): number => countries.length;

export const getTopPassports = (limit: number = 10): Country[] => {
  return [...countries]
    .filter(c => c.passportRank !== undefined)
    .sort((a, b) => (a.passportRank || 999) - (b.passportRank || 999))
    .slice(0, limit);
};

export const getPassportsByContinent = (continent: string): Country[] => {
  return countries
    .filter(c => c.continent === continent && c.passportRank !== undefined)
    .sort((a, b) => (a.passportRank || 999) - (b.passportRank || 999));
};

export const getWorldPopulation = (): number => {
  return countries.reduce((sum, c) => sum + (c.population || 0), 0);
};

export const getContinentStats = () => {
  const stats: Record<string, { count: number; population: number }> = {};
  countries.forEach(c => {
    if (!stats[c.continent]) {
      stats[c.continent] = { count: 0, population: 0 };
    }
    stats[c.continent].count++;
    stats[c.continent].population += c.population || 0;
  });
  return stats;
};
