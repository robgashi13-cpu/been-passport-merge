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
  officialVisaWebsite?: string;
  coordinates?: [number, number]; // [lat, lng]
  hdi?: number; // Human Development Index (0-1)
  gdp?: number; // GDP per capita in USD
  currency?: string; // Currency Code (e.g. USD, EUR)
  safetyScore?: number; // 0-100 Gallup Law and Order Index
  safetyLevel?: 'Very High' | 'High' | 'Moderate' | 'Low';
}

export const countries: Country[] = [
  // Europe
  { code: "AL", name: "Albania", continent: "Europe", passportRank: 49, visaFreeDestinations: 119, flagEmoji: "🇦🇱", capital: "Tirana", population: 2877797, coordinates: [41.15, 20.16], safetyScore: 78, safetyLevel: "High" },
  { code: "AD", name: "Andorra", continent: "Europe", passportRank: 37, visaFreeDestinations: 140, flagEmoji: "🇦🇩", capital: "Andorra la Vella", population: 77265, coordinates: [42.50, 1.52], safetyScore: 92, safetyLevel: "Very High" },
  { code: "AT", name: "Austria", continent: "Europe", passportRank: 5, visaFreeDestinations: 187, flagEmoji: "🇦🇹", capital: "Vienna", population: 9006398, coordinates: [47.51, 14.55], safetyScore: 93, safetyLevel: "Very High" },
  { code: "BY", name: "Belarus", continent: "Europe", passportRank: 71, visaFreeDestinations: 77, flagEmoji: "🇧🇾", capital: "Minsk", population: 9449323, coordinates: [53.70, 27.95], safetyScore: 50, safetyLevel: "Low" },
  { code: "BE", name: "Belgium", continent: "Europe", passportRank: 5, visaFreeDestinations: 187, flagEmoji: "🇧🇪", capital: "Brussels", population: 11589623, coordinates: [50.85, 4.35], safetyScore: 82, safetyLevel: "High" },
  { code: "BA", name: "Bosnia and Herzegovina", continent: "Europe", passportRank: 48, visaFreeDestinations: 120, flagEmoji: "🇧🇦", capital: "Sarajevo", population: 3280819, coordinates: [43.91, 17.67], safetyScore: 75, safetyLevel: "High" },
  { code: "BG", name: "Bulgaria", continent: "Europe", passportRank: 15, visaFreeDestinations: 175, flagEmoji: "🇧🇬", capital: "Sofia", population: 6948445, coordinates: [42.73, 25.48], safetyScore: 74, safetyLevel: "High" },
  { code: "HR", name: "Croatia", continent: "Europe", passportRank: 8, visaFreeDestinations: 184, flagEmoji: "🇭🇷", capital: "Zagreb", population: 4105267, coordinates: [45.10, 15.20], safetyScore: 83, safetyLevel: "High" },
  { code: "CY", name: "Cyprus", continent: "Europe", passportRank: 16, visaFreeDestinations: 174, flagEmoji: "🇨🇾", capital: "Nicosia", population: 1207359, coordinates: [35.12, 33.42], safetyScore: 80, safetyLevel: "High" },
  { code: "CZ", name: "Czech Republic", continent: "Europe", passportRank: 7, visaFreeDestinations: 185, flagEmoji: "🇨🇿", capital: "Prague", population: 10708981, coordinates: [49.81, 15.47], safetyScore: 88, safetyLevel: "Very High" },
  { code: "DK", name: "Denmark", continent: "Europe", passportRank: 5, visaFreeDestinations: 187, flagEmoji: "🇩🇰", capital: "Copenhagen", population: 5792202, coordinates: [56.26, 9.50], safetyScore: 92, safetyLevel: "Very High" },
  { code: "EE", name: "Estonia", continent: "Europe", passportRank: 8, visaFreeDestinations: 184, flagEmoji: "🇪🇪", capital: "Tallinn", population: 1326535, coordinates: [58.59, 25.01], safetyScore: 88, safetyLevel: "Very High" },
  { code: "FI", name: "Finland", continent: "Europe", passportRank: 5, visaFreeDestinations: 187, flagEmoji: "🇫🇮", capital: "Helsinki", population: 5540720, coordinates: [61.92, 25.74], safetyScore: 91, safetyLevel: "Very High" },
  { code: "FR", name: "France", continent: "Europe", passportRank: 3, visaFreeDestinations: 192, flagEmoji: "🇫🇷", capital: "Paris", population: 67390000, coordinates: [46.22, 2.21], safetyScore: 78, safetyLevel: "High" },
  { code: "DE", name: "Germany", continent: "Europe", passportRank: 3, visaFreeDestinations: 192, flagEmoji: "🇩🇪", capital: "Berlin", population: 83783942, coordinates: [51.16, 10.45], hdi: 0.942, gdp: 51203, currency: "EUR", safetyScore: 81, safetyLevel: "High" },
  { code: "GR", name: "Greece", continent: "Europe", passportRank: 6, visaFreeDestinations: 186, flagEmoji: "🇬🇷", capital: "Athens", population: 10423054, coordinates: [39.07, 21.82], safetyScore: 76, safetyLevel: "High" },
  { code: "HU", name: "Hungary", continent: "Europe", passportRank: 6, visaFreeDestinations: 186, flagEmoji: "🇭🇺", capital: "Budapest", population: 9660351, coordinates: [47.16, 19.50], safetyScore: 82, safetyLevel: "High" },
  { code: "IS", name: "Iceland", continent: "Europe", passportRank: 10, visaFreeDestinations: 182, flagEmoji: "🇮🇸", capital: "Reykjavik", population: 341243, coordinates: [64.96, -19.02], safetyScore: 93, safetyLevel: "Very High" },
  { code: "IE", name: "Ireland", continent: "Europe", passportRank: 5, visaFreeDestinations: 187, flagEmoji: "🇮🇪", capital: "Dublin", population: 4937786, coordinates: [53.14, -7.69], safetyScore: 90, safetyLevel: "Very High" },
  { code: "IT", name: "Italy", continent: "Europe", passportRank: 3, visaFreeDestinations: 192, flagEmoji: "🇮🇹", capital: "Rome", population: 60461826, coordinates: [41.87, 12.56], safetyScore: 80, safetyLevel: "High" },
  { code: "XK", name: "Kosovo", continent: "Europe", passportRank: 61, visaFreeDestinations: 85, flagEmoji: "🇽🇰", capital: "Pristina", population: 1810366, coordinates: [42.60, 20.90], safetyScore: 97, safetyLevel: "Very High" },
  { code: "LV", name: "Latvia", continent: "Europe", passportRank: 10, visaFreeDestinations: 182, flagEmoji: "🇱🇻", capital: "Riga", population: 1886198, coordinates: [56.87, 24.60], safetyScore: 85, safetyLevel: "High" },
  { code: "LI", name: "Liechtenstein", continent: "Europe", passportRank: 10, visaFreeDestinations: 182, flagEmoji: "🇱🇮", capital: "Vaduz", population: 38128, coordinates: [47.16, 9.55], safetyScore: 95, safetyLevel: "Very High" },
  { code: "LT", name: "Lithuania", continent: "Europe", passportRank: 9, visaFreeDestinations: 183, flagEmoji: "🇱🇹", capital: "Vilnius", population: 2722289, coordinates: [55.16, 23.88], safetyScore: 85, safetyLevel: "High" },
  { code: "LU", name: "Luxembourg", continent: "Europe", passportRank: 4, visaFreeDestinations: 188, flagEmoji: "🇱🇺", capital: "Luxembourg City", population: 625978, coordinates: [49.81, 6.12], safetyScore: 93, safetyLevel: "Very High" },
  { code: "MT", name: "Malta", continent: "Europe", passportRank: 7, visaFreeDestinations: 185, flagEmoji: "🇲🇹", capital: "Valletta", population: 441543, coordinates: [35.93, 14.37], safetyScore: 82, safetyLevel: "High" },
  { code: "MD", name: "Moldova", continent: "Europe", passportRank: 48, visaFreeDestinations: 120, flagEmoji: "🇲🇩", capital: "Chisinau", population: 4033963, coordinates: [47.41, 28.36], safetyScore: 65, safetyLevel: "Moderate" },
  { code: "MC", name: "Monaco", continent: "Europe", passportRank: 13, visaFreeDestinations: 177, flagEmoji: "🇲🇨", capital: "Monaco", population: 39242, coordinates: [43.73, 7.42], safetyScore: 95, safetyLevel: "Very High" },
  { code: "ME", name: "Montenegro", continent: "Europe", passportRank: 43, visaFreeDestinations: 128, flagEmoji: "🇲🇪", capital: "Podgorica", population: 628066, coordinates: [42.70, 19.37], safetyScore: 78, safetyLevel: "High" },
  { code: "NL", name: "Netherlands", continent: "Europe", passportRank: 5, visaFreeDestinations: 187, flagEmoji: "🇳🇱", capital: "Amsterdam", population: 17134872, coordinates: [52.13, 5.29], safetyScore: 88, safetyLevel: "Very High" },
  { code: "MK", name: "North Macedonia", continent: "Europe", passportRank: 45, visaFreeDestinations: 126, flagEmoji: "🇲🇰", capital: "Skopje", population: 2083374, coordinates: [41.60, 21.74], safetyScore: 74, safetyLevel: "High" },
  { code: "NO", name: "Norway", continent: "Europe", passportRank: 6, visaFreeDestinations: 186, flagEmoji: "🇳🇴", capital: "Oslo", population: 5421241, coordinates: [60.47, 8.46], safetyScore: 93, safetyLevel: "Very High" },
  { code: "PL", name: "Poland", continent: "Europe", passportRank: 7, visaFreeDestinations: 185, flagEmoji: "🇵🇱", capital: "Warsaw", population: 37846611, coordinates: [51.91, 19.14], safetyScore: 86, safetyLevel: "High" },
  { code: "PT", name: "Portugal", continent: "Europe", passportRank: 6, visaFreeDestinations: 186, flagEmoji: "🇵🇹", capital: "Lisbon", population: 10196709, coordinates: [39.39, -8.22], safetyScore: 90, safetyLevel: "Very High" },
  { code: "RO", name: "Romania", continent: "Europe", passportRank: 14, visaFreeDestinations: 176, flagEmoji: "🇷🇴", capital: "Bucharest", population: 19237691, coordinates: [45.94, 24.96], safetyScore: 79, safetyLevel: "High" },
  { code: "RU", name: "Russia", continent: "Europe", passportRank: 50, visaFreeDestinations: 118, flagEmoji: "🇷🇺", capital: "Moscow", population: 145934462, coordinates: [61.52, 105.31], safetyScore: 48, safetyLevel: "Low" },
  { code: "SM", name: "San Marino", continent: "Europe", passportRank: 27, visaFreeDestinations: 161, flagEmoji: "🇸🇲", capital: "San Marino", population: 33931, coordinates: [43.94, 12.45], safetyScore: 92, safetyLevel: "Very High" },
  { code: "RS", name: "Serbia", continent: "Europe", passportRank: 38, visaFreeDestinations: 139, flagEmoji: "🇷🇸", capital: "Belgrade", population: 6982084, coordinates: [44.01, 21.00], safetyScore: 76, safetyLevel: "High" },
  { code: "SK", name: "Slovakia", continent: "Europe", passportRank: 8, visaFreeDestinations: 184, flagEmoji: "🇸🇰", capital: "Bratislava", population: 5459642, coordinates: [48.66, 19.69], safetyScore: 84, safetyLevel: "High" },
  { code: "SI", name: "Slovenia", continent: "Europe", passportRank: 8, visaFreeDestinations: 184, flagEmoji: "🇸🇮", capital: "Ljubljana", population: 2078938, coordinates: [46.15, 14.99], safetyScore: 88, safetyLevel: "Very High" },
  { code: "ES", name: "Spain", continent: "Europe", passportRank: 3, visaFreeDestinations: 192, flagEmoji: "🇪🇸", capital: "Madrid", population: 46754778, coordinates: [40.46, -3.74], safetyScore: 85, safetyLevel: "High" },
  { code: "SE", name: "Sweden", continent: "Europe", passportRank: 6, visaFreeDestinations: 186, flagEmoji: "🇸🇪", capital: "Stockholm", population: 10099265, coordinates: [60.12, 18.64], safetyScore: 89, safetyLevel: "High" },
  { code: "CH", name: "Switzerland", continent: "Europe", passportRank: 4, visaFreeDestinations: 188, flagEmoji: "🇨🇭", capital: "Bern", population: 8654622, coordinates: [46.81, 8.22], safetyScore: 91, safetyLevel: "Very High" },
  { code: "UA", name: "Ukraine", continent: "Europe", passportRank: 36, visaFreeDestinations: 141, flagEmoji: "🇺🇦", capital: "Kyiv", population: 43733762, coordinates: [48.37, 31.16], safetyScore: 35, safetyLevel: "Low" },
  { code: "GB", name: "United Kingdom", continent: "Europe", passportRank: 4, visaFreeDestinations: 190, flagEmoji: "🇬🇧", capital: "London", population: 67886011, coordinates: [55.37, -3.43], safetyScore: 80, safetyLevel: "High" },
  { code: "VA", name: "Vatican City", continent: "Europe", passportRank: 17, visaFreeDestinations: 173, flagEmoji: "🇻🇦", capital: "Vatican City", population: 825, coordinates: [41.90, 12.45], safetyScore: 100, safetyLevel: "Very High" },
  { code: "TR", name: "Turkey", continent: "Europe", passportRank: 52, visaFreeDestinations: 115, flagEmoji: "🇹🇷", capital: "Ankara", population: 84339067, coordinates: [38.96, 35.24], safetyScore: 68, safetyLevel: "Moderate" },

  // Asia
  { code: "AF", name: "Afghanistan", continent: "Asia", passportRank: 108, visaFreeDestinations: 26, flagEmoji: "🇦🇫", capital: "Kabul", population: 38928346, coordinates: [33.93, 67.71], safetyScore: 20, safetyLevel: "Low" },
  { code: "AM", name: "Armenia", continent: "Asia", passportRank: 58, visaFreeDestinations: 98, flagEmoji: "🇦🇲", capital: "Yerevan", population: 2963243, coordinates: [40.06, 45.03], safetyScore: 78, safetyLevel: "High" },
  { code: "AZ", name: "Azerbaijan", continent: "Asia", passportRank: 74, visaFreeDestinations: 70, flagEmoji: "🇦🇿", capital: "Baku", population: 10139177, coordinates: [40.14, 47.57], safetyScore: 70, safetyLevel: "Moderate" },
  { code: "BH", name: "Bahrain", continent: "Asia", passportRank: 59, visaFreeDestinations: 95, flagEmoji: "🇧🇭", capital: "Manama", population: 1701575, coordinates: [26.02, 50.55], safetyScore: 80, safetyLevel: "High" },
  { code: "BD", name: "Bangladesh", continent: "Asia", passportRank: 100, visaFreeDestinations: 41, flagEmoji: "🇧🇩", capital: "Dhaka", population: 164689383, coordinates: [23.68, 90.35], safetyScore: 55, safetyLevel: "Low" },
  { code: "BT", name: "Bhutan", continent: "Asia", passportRank: 86, visaFreeDestinations: 54, flagEmoji: "🇧🇹", capital: "Thimphu", population: 771608, coordinates: [27.51, 90.43], safetyScore: 85, safetyLevel: "High" },
  { code: "BN", name: "Brunei", continent: "Asia", passportRank: 22, visaFreeDestinations: 167, flagEmoji: "🇧🇳", capital: "Bandar Seri Begawan", population: 437479, coordinates: [4.53, 114.72], safetyScore: 82, safetyLevel: "High" },
  { code: "KH", name: "Cambodia", continent: "Asia", passportRank: 88, visaFreeDestinations: 53, flagEmoji: "🇰🇭", capital: "Phnom Penh", population: 16718965, officialVisaWebsite: "https://www.evisa.gov.kh", coordinates: [12.56, 104.99], safetyScore: 60, safetyLevel: "Moderate" },
  { code: "CN", name: "China", continent: "Asia", passportRank: 64, visaFreeDestinations: 82, flagEmoji: "🇨🇳", capital: "Beijing", population: 1439323776, officialVisaWebsite: "https://www.visaforchina.cn", coordinates: [35.86, 104.19], safetyScore: 75, safetyLevel: "High" },
  { code: "GE", name: "Georgia", continent: "Asia", passportRank: 52, visaFreeDestinations: 115, flagEmoji: "🇬🇪", capital: "Tbilisi", population: 3989167, coordinates: [42.31, 43.35], safetyScore: 78, safetyLevel: "High" },
  { code: "HK", name: "Hong Kong", continent: "Asia", passportRank: 18, visaFreeDestinations: 171, flagEmoji: "🇭🇰", capital: "Hong Kong", population: 7496981, coordinates: [22.31, 114.16], safetyScore: 85, safetyLevel: "High" },
  { code: "IN", name: "India", continent: "Asia", passportRank: 85, visaFreeDestinations: 58, flagEmoji: "🇮🇳", capital: "New Delhi", population: 1380004385, officialVisaWebsite: "https://indianvisaonline.gov.in", coordinates: [20.59, 78.96], safetyScore: 65, safetyLevel: "Moderate" },
  { code: "ID", name: "Indonesia", continent: "Asia", passportRank: 70, visaFreeDestinations: 78, flagEmoji: "🇮🇩", capital: "Jakarta", population: 273523615, coordinates: [-0.78, 113.92], safetyScore: 72, safetyLevel: "Moderate" },
  { code: "IR", name: "Iran", continent: "Asia", passportRank: 97, visaFreeDestinations: 44, flagEmoji: "🇮🇷", capital: "Tehran", population: 83992949, coordinates: [32.42, 53.68], safetyScore: 55, safetyLevel: "Low" },
  { code: "IQ", name: "Iraq", continent: "Asia", passportRank: 103, visaFreeDestinations: 29, flagEmoji: "🇮🇶", capital: "Baghdad", population: 40222493, coordinates: [33.22, 43.67], safetyScore: 40, safetyLevel: "Low" },
  { code: "IL", name: "Israel", continent: "Asia", passportRank: 21, visaFreeDestinations: 168, flagEmoji: "🇮🇱", capital: "Jerusalem", population: 8655535, coordinates: [31.04, 34.85], safetyScore: 70, safetyLevel: "Moderate" },
  { code: "JP", name: "Japan", continent: "Asia", passportRank: 2, visaFreeDestinations: 193, flagEmoji: "🇯🇵", capital: "Tokyo", population: 126476461, officialVisaWebsite: "https://www.mofa.go.jp/j_info/visit/visa/index.html", coordinates: [36.20, 138.25], safetyScore: 88, safetyLevel: "Very High" },
  { code: "JO", name: "Jordan", continent: "Asia", passportRank: 69, visaFreeDestinations: 79, flagEmoji: "🇯🇴", capital: "Amman", population: 10203134, coordinates: [30.58, 36.23], safetyScore: 78, safetyLevel: "High" },
  { code: "KZ", name: "Kazakhstan", continent: "Asia", passportRank: 68, visaFreeDestinations: 80, flagEmoji: "🇰🇿", capital: "Nur-Sultan", population: 18776707, coordinates: [48.01, 66.92], safetyScore: 70, safetyLevel: "Moderate" },
  { code: "KW", name: "Kuwait", continent: "Asia", passportRank: 54, visaFreeDestinations: 103, flagEmoji: "🇰🇼", capital: "Kuwait City", population: 4270571, coordinates: [29.31, 47.48], safetyScore: 83, safetyLevel: "High" },
  { code: "KG", name: "Kyrgyzstan", continent: "Asia", passportRank: 73, visaFreeDestinations: 71, flagEmoji: "🇰🇬", capital: "Bishkek", population: 6524195, coordinates: [41.20, 74.76], safetyScore: 68, safetyLevel: "Moderate" },
  { code: "LA", name: "Laos", continent: "Asia", passportRank: 87, visaFreeDestinations: 53, flagEmoji: "🇱🇦", capital: "Vientiane", population: 7275560, coordinates: [19.85, 102.49], safetyScore: 69, safetyLevel: "Moderate" },
  { code: "LB", name: "Lebanon", continent: "Asia", passportRank: 96, visaFreeDestinations: 46, flagEmoji: "🇱🇧", capital: "Beirut", population: 6825445, coordinates: [33.85, 35.86], safetyScore: 45, safetyLevel: "Low" },
  { code: "MO", name: "Macau", continent: "Asia", passportRank: 32, visaFreeDestinations: 147, flagEmoji: "🇲🇴", capital: "Macau", population: 649335, coordinates: [22.19, 113.54], safetyScore: 88, safetyLevel: "Very High" },
  { code: "MY", name: "Malaysia", continent: "Asia", passportRank: 12, visaFreeDestinations: 180, flagEmoji: "🇲🇾", capital: "Kuala Lumpur", population: 32365999, coordinates: [4.21, 101.97], safetyScore: 72, safetyLevel: "High" },
  { code: "MV", name: "Maldives", continent: "Asia", passportRank: 62, visaFreeDestinations: 90, flagEmoji: "🇲🇻", capital: "Male", population: 540544, coordinates: [3.20, 73.22], safetyScore: 75, safetyLevel: "High" },
  { code: "MN", name: "Mongolia", continent: "Asia", passportRank: 67, visaFreeDestinations: 82, flagEmoji: "🇲🇳", capital: "Ulaanbaatar", population: 3278290, coordinates: [46.86, 103.84], safetyScore: 78, safetyLevel: "High" },
  { code: "MM", name: "Myanmar", continent: "Asia", passportRank: 89, visaFreeDestinations: 52, flagEmoji: "🇲🇲", capital: "Naypyidaw", population: 54409800, coordinates: [21.91, 95.95], safetyScore: 40, safetyLevel: "Low" },
  { code: "NP", name: "Nepal", continent: "Asia", passportRank: 99, visaFreeDestinations: 42, flagEmoji: "🇳🇵", capital: "Kathmandu", population: 29136808, coordinates: [28.39, 84.12], safetyScore: 70, safetyLevel: "Moderate" },
  { code: "KP", name: "North Korea", continent: "Asia", passportRank: 102, visaFreeDestinations: 40, flagEmoji: "🇰🇵", capital: "Pyongyang", population: 25778816, coordinates: [40.33, 127.51], safetyScore: 50, safetyLevel: "Low" },
  { code: "OM", name: "Oman", continent: "Asia", passportRank: 60, visaFreeDestinations: 93, flagEmoji: "🇴🇲", capital: "Muscat", population: 5106626, coordinates: [21.47, 55.97], safetyScore: 88, safetyLevel: "Very High" },
  { code: "PK", name: "Pakistan", continent: "Asia", passportRank: 101, visaFreeDestinations: 40, flagEmoji: "🇵🇰", capital: "Islamabad", population: 220892340, coordinates: [30.37, 69.34], safetyScore: 50, safetyLevel: "Low" },
  { code: "PS", name: "Palestine", continent: "Asia", passportRank: 98, visaFreeDestinations: 43, flagEmoji: "🇵🇸", capital: "Ramallah", population: 5101414, coordinates: [31.95, 35.23], safetyScore: 50, safetyLevel: "Low" },
  { code: "PH", name: "Philippines", continent: "Asia", passportRank: 75, visaFreeDestinations: 68, flagEmoji: "🇵🇭", capital: "Manila", population: 109581078, coordinates: [12.87, 121.77], safetyScore: 58, safetyLevel: "Moderate" },
  { code: "QA", name: "Qatar", continent: "Asia", passportRank: 51, visaFreeDestinations: 117, flagEmoji: "🇶🇦", capital: "Doha", population: 2881053, coordinates: [25.35, 51.18], safetyScore: 90, safetyLevel: "Very High" },
  { code: "SA", name: "Saudi Arabia", continent: "Asia", passportRank: 61, visaFreeDestinations: 91, flagEmoji: "🇸🇦", capital: "Riyadh", population: 34813871, coordinates: [23.88, 45.07], safetyScore: 78, safetyLevel: "High" },
  { code: "SG", name: "Singapore", continent: "Asia", passportRank: 1, visaFreeDestinations: 195, flagEmoji: "🇸🇬", capital: "Singapore", population: 5850342, safetyScore: 95, safetyLevel: "Very High", coordinates: [1.35, 103.81] },
  { code: "KR", name: "South Korea", continent: "Asia", passportRank: 3, visaFreeDestinations: 192, flagEmoji: "🇰🇷", capital: "Seoul", population: 51269185, coordinates: [35.90, 127.76], safetyScore: 85, safetyLevel: "Very High" },
  { code: "LK", name: "Sri Lanka", continent: "Asia", passportRank: 94, visaFreeDestinations: 47, flagEmoji: "🇱🇰", capital: "Colombo", population: 21413249, officialVisaWebsite: "https://eta.gov.lk", coordinates: [7.87, 80.77], safetyScore: 60, safetyLevel: "Moderate" },
  { code: "SY", name: "Syria", continent: "Asia", passportRank: 105, visaFreeDestinations: 26, flagEmoji: "🇸🇾", capital: "Damascus", population: 17500658, coordinates: [34.80, 38.99], safetyScore: 30, safetyLevel: "Low" },
  { code: "TW", name: "Taiwan", continent: "Asia", passportRank: 31, visaFreeDestinations: 148, flagEmoji: "🇹🇼", capital: "Taipei", population: 23816775, coordinates: [23.69, 120.96], safetyScore: 85, safetyLevel: "Very High" },
  { code: "TJ", name: "Tajikistan", continent: "Asia", passportRank: 79, visaFreeDestinations: 63, flagEmoji: "🇹🇯", capital: "Dushanbe", population: 9537645, coordinates: [38.86, 71.27], safetyScore: 78, safetyLevel: "High" },
  { code: "TH", name: "Thailand", continent: "Asia", passportRank: 63, visaFreeDestinations: 86, flagEmoji: "🇹🇭", capital: "Bangkok", population: 69799978, coordinates: [15.87, 100.99], safetyScore: 70, safetyLevel: "Moderate" },
  { code: "TL", name: "Timor-Leste", continent: "Asia", passportRank: 85, visaFreeDestinations: 55, flagEmoji: "🇹🇱", capital: "Dili", population: 1318445, coordinates: [8.87, 125.72], safetyScore: 75, safetyLevel: "High" },
  { code: "TM", name: "Turkmenistan", continent: "Asia", passportRank: 83, visaFreeDestinations: 57, flagEmoji: "🇹🇲", capital: "Ashgabat", population: 6031200, coordinates: [38.96, 59.55], safetyScore: 72, safetyLevel: "High" },
  { code: "AE", name: "United Arab Emirates", continent: "Asia", passportRank: 11, visaFreeDestinations: 183, flagEmoji: "🇦🇪", capital: "Abu Dhabi", population: 9890402, officialVisaWebsite: "https://u.ae/en/information-and-services/visa-and-emirates-id", coordinates: [23.42, 53.84], safetyScore: 88, safetyLevel: "Very High" },
  { code: "UZ", name: "Uzbekistan", continent: "Asia", passportRank: 78, visaFreeDestinations: 64, flagEmoji: "🇺🇿", capital: "Tashkent", population: 33469203, coordinates: [41.37, 64.58], safetyScore: 76, safetyLevel: "High" },
  { code: "VN", name: "Vietnam", continent: "Asia", passportRank: 87, visaFreeDestinations: 55, flagEmoji: "🇻🇳", capital: "Hanoi", population: 97338579, officialVisaWebsite: "https://evisa.gov.vn", coordinates: [14.05, 108.27], safetyScore: 74, safetyLevel: "High" },
  { code: "YE", name: "Yemen", continent: "Asia", passportRank: 106, visaFreeDestinations: 25, flagEmoji: "🇾🇪", capital: "Sana'a", population: 29825964, coordinates: [15.55, 48.51], safetyScore: 30, safetyLevel: "Low" },

  // Africa
  { code: "DZ", name: "Algeria", continent: "Africa", passportRank: 91, visaFreeDestinations: 50, flagEmoji: "🇩🇿", capital: "Algiers", population: 43851044, coordinates: [28.03, 1.66], safetyScore: 75, safetyLevel: "High" },
  { code: "AO", name: "Angola", continent: "Africa", passportRank: 90, visaFreeDestinations: 51, flagEmoji: "🇦🇴", capital: "Luanda", population: 32866272, coordinates: [-11.20, 17.87], safetyScore: 60, safetyLevel: "Moderate" },
  { code: "BJ", name: "Benin", continent: "Africa", passportRank: 84, visaFreeDestinations: 56, flagEmoji: "🇧🇯", capital: "Porto-Novo", population: 12123200, coordinates: [9.31, 2.32], safetyScore: 70, safetyLevel: "Moderate" },
  { code: "BW", name: "Botswana", continent: "Africa", passportRank: 57, visaFreeDestinations: 99, flagEmoji: "🇧🇼", capital: "Gaborone", population: 2351627, coordinates: [-22.33, 24.68], safetyScore: 80, safetyLevel: "High" },
  { code: "BF", name: "Burkina Faso", continent: "Africa", passportRank: 90, visaFreeDestinations: 51, flagEmoji: "🇧🇫", capital: "Ouagadougou", population: 20903273, coordinates: [12.24, -1.56], safetyScore: 45, safetyLevel: "Low" },
  { code: "BI", name: "Burundi", continent: "Africa", passportRank: 91, visaFreeDestinations: 50, flagEmoji: "🇧🇮", capital: "Gitega", population: 11890784, coordinates: [-3.37, 29.92], safetyScore: 50, safetyLevel: "Low" },
  { code: "CV", name: "Cape Verde", continent: "Africa", passportRank: 77, visaFreeDestinations: 66, flagEmoji: "🇨🇻", capital: "Praia", population: 555987, coordinates: [16.00, -24.01], safetyScore: 78, safetyLevel: "High" },
  { code: "CM", name: "Cameroon", continent: "Africa", passportRank: 85, visaFreeDestinations: 55, flagEmoji: "🇨🇲", capital: "Yaoundé", population: 26545863, coordinates: [7.37, 12.35], safetyScore: 55, safetyLevel: "Low" },
  { code: "CF", name: "Central African Republic", continent: "Africa", passportRank: 92, visaFreeDestinations: 49, flagEmoji: "🇨🇫", capital: "Bangui", population: 4829767, coordinates: [6.61, 20.94], safetyScore: 30, safetyLevel: "Low" },
  { code: "TD", name: "Chad", continent: "Africa", passportRank: 93, visaFreeDestinations: 48, flagEmoji: "🇹🇩", capital: "N'Djamena", population: 16425864, coordinates: [15.45, 18.73], safetyScore: 40, safetyLevel: "Low" },
  { code: "KM", name: "Comoros", continent: "Africa", passportRank: 87, visaFreeDestinations: 53, flagEmoji: "🇰🇲", capital: "Moroni", population: 869601, coordinates: [-11.88, 43.87], safetyScore: 72, safetyLevel: "High" },
  { code: "CG", name: "Congo", continent: "Africa", passportRank: 86, visaFreeDestinations: 54, flagEmoji: "🇨🇬", capital: "Brazzaville", population: 5518087, coordinates: [-0.23, 15.83], safetyScore: 60, safetyLevel: "Moderate" },
  { code: "CD", name: "DR Congo", continent: "Africa", passportRank: 95, visaFreeDestinations: 46, flagEmoji: "🇨🇩", capital: "Kinshasa", population: 89561403, coordinates: [-4.04, 21.76], safetyScore: 35, safetyLevel: "Low" },
  { code: "CI", name: "Côte d'Ivoire", continent: "Africa", passportRank: 82, visaFreeDestinations: 59, flagEmoji: "🇨🇮", capital: "Yamoussoukro", population: 26378274, coordinates: [7.54, -5.55], safetyScore: 65, safetyLevel: "Moderate" },
  { code: "DJ", name: "Djibouti", continent: "Africa", passportRank: 88, visaFreeDestinations: 52, flagEmoji: "🇩🇯", capital: "Djibouti", population: 988000, coordinates: [11.83, 42.59], safetyScore: 68, safetyLevel: "Moderate" },
  { code: "EG", name: "Egypt", continent: "Africa", passportRank: 89, visaFreeDestinations: 53, flagEmoji: "🇪🇬", capital: "Cairo", population: 102334404, officialVisaWebsite: "https://www.visa2egypt.gov.eg", coordinates: [26.82, 30.80], safetyScore: 75, safetyLevel: "High" },
  { code: "GQ", name: "Equatorial Guinea", continent: "Africa", passportRank: 88, visaFreeDestinations: 52, flagEmoji: "🇬🇶", capital: "Malabo", population: 1402985, coordinates: [1.65, 10.27], safetyScore: 65, safetyLevel: "Moderate" },
  { code: "ER", name: "Eritrea", continent: "Africa", passportRank: 99, visaFreeDestinations: 42, flagEmoji: "🇪🇷", capital: "Asmara", population: 3546421, coordinates: [15.18, 39.78], safetyScore: 60, safetyLevel: "Moderate" },
  { code: "SZ", name: "Eswatini", continent: "Africa", passportRank: 70, visaFreeDestinations: 78, flagEmoji: "🇸🇿", capital: "Mbabane", population: 1160164, coordinates: [-26.52, 31.47], safetyScore: 70, safetyLevel: "Moderate" },
  { code: "ET", name: "Ethiopia", continent: "Africa", passportRank: 95, visaFreeDestinations: 46, flagEmoji: "🇪🇹", capital: "Addis Ababa", population: 114963588, coordinates: [9.15, 40.49], safetyScore: 60, safetyLevel: "Moderate" },
  { code: "GA", name: "Gabon", continent: "Africa", passportRank: 76, visaFreeDestinations: 67, flagEmoji: "🇬🇦", capital: "Libreville", population: 2225734, coordinates: [-0.80, 11.61], safetyScore: 72, safetyLevel: "High" },
  { code: "GM", name: "Gambia", continent: "Africa", passportRank: 78, visaFreeDestinations: 64, flagEmoji: "🇬🇲", capital: "Banjul", population: 2416668, coordinates: [13.44, -15.31], safetyScore: 75, safetyLevel: "High" },
  { code: "GH", name: "Ghana", continent: "Africa", passportRank: 76, visaFreeDestinations: 67, flagEmoji: "🇬🇭", capital: "Accra", population: 31072940, coordinates: [7.95, -1.02], safetyScore: 78, safetyLevel: "High" },
  { code: "GN", name: "Guinea", continent: "Africa", passportRank: 87, visaFreeDestinations: 53, flagEmoji: "🇬🇳", capital: "Conakry", population: 13132795, coordinates: [9.95, -9.70], safetyScore: 60, safetyLevel: "Moderate" },
  { code: "GW", name: "Guinea-Bissau", continent: "Africa", passportRank: 83, visaFreeDestinations: 57, flagEmoji: "🇬🇼", capital: "Bissau", population: 1968001, coordinates: [11.80, -15.18], safetyScore: 65, safetyLevel: "Moderate" },
  { code: "KE", name: "Kenya", continent: "Africa", passportRank: 73, visaFreeDestinations: 76, flagEmoji: "🇰🇪", capital: "Nairobi", population: 53771296, officialVisaWebsite: "https://www.etakenya.go.ke", coordinates: [-0.02, 37.91], safetyScore: 68, safetyLevel: "Moderate" },
  { code: "LS", name: "Lesotho", continent: "Africa", passportRank: 66, visaFreeDestinations: 83, flagEmoji: "🇱🇸", capital: "Maseru", population: 2142249, coordinates: [-29.61, 28.23], safetyScore: 72, safetyLevel: "High" },
  { code: "LR", name: "Liberia", continent: "Africa", passportRank: 94, visaFreeDestinations: 47, flagEmoji: "🇱🇷", capital: "Monrovia", population: 5057681, coordinates: [6.43, -9.43], safetyScore: 65, safetyLevel: "Moderate" },
  { code: "LY", name: "Libya", continent: "Africa", passportRank: 100, visaFreeDestinations: 41, flagEmoji: "🇱🇾", capital: "Tripoli", population: 6871292, coordinates: [26.34, 17.23], safetyScore: 30, safetyLevel: "Low" },
  { code: "MG", name: "Madagascar", continent: "Africa", passportRank: 80, visaFreeDestinations: 62, flagEmoji: "🇲🇬", capital: "Antananarivo", population: 27691018, coordinates: [-18.77, 46.87], safetyScore: 70, safetyLevel: "Moderate" },
  { code: "MW", name: "Malawi", continent: "Africa", passportRank: 71, visaFreeDestinations: 77, flagEmoji: "🇲🇼", capital: "Lilongwe", population: 19129952, coordinates: [-13.25, 34.30], safetyScore: 75, safetyLevel: "High" },
  { code: "ML", name: "Mali", continent: "Africa", passportRank: 85, visaFreeDestinations: 55, flagEmoji: "🇲🇱", capital: "Bamako", population: 20250833, coordinates: [17.57, -3.99], safetyScore: 40, safetyLevel: "Low" },
  { code: "MR", name: "Mauritania", continent: "Africa", passportRank: 86, visaFreeDestinations: 54, flagEmoji: "🇲🇷", capital: "Nouakchott", population: 4649658, coordinates: [21.01, -10.94], safetyScore: 65, safetyLevel: "Moderate" },
  { code: "MU", name: "Mauritius", continent: "Africa", passportRank: 30, visaFreeDestinations: 149, flagEmoji: "🇲🇺", capital: "Port Louis", population: 1271768, coordinates: [-20.35, 57.55], safetyScore: 90, safetyLevel: "Very High" },
  { code: "MA", name: "Morocco", continent: "Africa", passportRank: 79, visaFreeDestinations: 64, flagEmoji: "🇲🇦", capital: "Rabat", population: 36910560, coordinates: [31.79, -7.09], safetyScore: 78, safetyLevel: "High" },
  { code: "MZ", name: "Mozambique", continent: "Africa", passportRank: 77, visaFreeDestinations: 66, flagEmoji: "🇲🇿", capital: "Maputo", population: 31255435, coordinates: [-18.67, 35.53], safetyScore: 65, safetyLevel: "Moderate" },
  { code: "NA", name: "Namibia", continent: "Africa", passportRank: 65, visaFreeDestinations: 84, flagEmoji: "🇳🇦", capital: "Windhoek", population: 2540905, coordinates: [-22.96, 18.49], safetyScore: 80, safetyLevel: "High" },
  { code: "NE", name: "Niger", continent: "Africa", passportRank: 88, visaFreeDestinations: 52, flagEmoji: "🇳🇪", capital: "Niamey", population: 24206644, coordinates: [17.61, 8.08], safetyScore: 55, safetyLevel: "Low" },
  { code: "NG", name: "Nigeria", continent: "Africa", passportRank: 95, visaFreeDestinations: 46, flagEmoji: "🇳🇬", capital: "Abuja", population: 206139589, coordinates: [9.08, 8.68], safetyScore: 50, safetyLevel: "Low" },
  { code: "RW", name: "Rwanda", continent: "Africa", passportRank: 80, visaFreeDestinations: 62, flagEmoji: "🇷🇼", capital: "Kigali", population: 12952218, coordinates: [-1.94, 29.87], safetyScore: 85, safetyLevel: "High" },
  { code: "ST", name: "São Tomé and Príncipe", continent: "Africa", passportRank: 73, visaFreeDestinations: 71, flagEmoji: "🇸🇹", capital: "São Tomé", population: 219159, coordinates: [0.19, 6.61], safetyScore: 80, safetyLevel: "High" },
  { code: "SN", name: "Senegal", continent: "Africa", passportRank: 80, visaFreeDestinations: 62, flagEmoji: "🇸🇳", capital: "Dakar", population: 16743927, coordinates: [14.50, -14.45], safetyScore: 72, safetyLevel: "High" },
  { code: "SC", name: "Seychelles", continent: "Africa", passportRank: 26, visaFreeDestinations: 162, flagEmoji: "🇸🇨", capital: "Victoria", population: 98347, coordinates: [-4.68, 55.49], safetyScore: 85, safetyLevel: "High" },
  { code: "SL", name: "Sierra Leone", continent: "Africa", passportRank: 84, visaFreeDestinations: 56, flagEmoji: "🇸🇱", capital: "Freetown", population: 7976983, coordinates: [8.46, -11.78], safetyScore: 65, safetyLevel: "Moderate" },
  { code: "SO", name: "Somalia", continent: "Africa", passportRank: 103, visaFreeDestinations: 29, flagEmoji: "🇸🇴", capital: "Mogadishu", population: 15893222, coordinates: [5.15, 46.20], safetyScore: 20, safetyLevel: "Low" },
  { code: "ZA", name: "South Africa", continent: "Africa", passportRank: 53, visaFreeDestinations: 106, flagEmoji: "🇿🇦", capital: "Pretoria", population: 59308690, officialVisaWebsite: "http://www.dha.gov.za/index.php/immigration-services/types-of-visas", coordinates: [-30.56, 22.94], safetyScore: 65, safetyLevel: "Moderate" },
  { code: "SS", name: "South Sudan", continent: "Africa", passportRank: 100, visaFreeDestinations: 41, flagEmoji: "🇸🇸", capital: "Juba", population: 11193725, coordinates: [6.88, 31.31], safetyScore: 20, safetyLevel: "Low" },
  { code: "SD", name: "Sudan", continent: "Africa", passportRank: 96, visaFreeDestinations: 46, flagEmoji: "🇸🇩", capital: "Khartoum", population: 43849260, coordinates: [12.86, 30.22], safetyScore: 30, safetyLevel: "Low" },
  { code: "TZ", name: "Tanzania", continent: "Africa", passportRank: 73, visaFreeDestinations: 71, flagEmoji: "🇹🇿", capital: "Dodoma", population: 59734218, coordinates: [-6.37, 34.89], safetyScore: 78, safetyLevel: "High" },
  { code: "TG", name: "Togo", continent: "Africa", passportRank: 81, visaFreeDestinations: 61, flagEmoji: "🇹🇬", capital: "Lomé", population: 8278724, coordinates: [8.62, 0.82], safetyScore: 70, safetyLevel: "Moderate" },
  { code: "TN", name: "Tunisia", continent: "Africa", passportRank: 72, visaFreeDestinations: 73, flagEmoji: "🇹🇳", capital: "Tunis", population: 11818619, coordinates: [33.89, 9.54], safetyScore: 75, safetyLevel: "High" },
  { code: "UG", name: "Uganda", continent: "Africa", passportRank: 74, visaFreeDestinations: 70, flagEmoji: "🇺🇬", capital: "Kampala", population: 45741007, coordinates: [1.37, 32.29], safetyScore: 68, safetyLevel: "Moderate" },
  { code: "ZM", name: "Zambia", continent: "Africa", passportRank: 73, visaFreeDestinations: 77, flagEmoji: "🇿🇲", capital: "Lusaka", population: 18383955, coordinates: [-13.13, 27.85], safetyScore: 75, safetyLevel: "High" },
  { code: "ZW", name: "Zimbabwe", continent: "Africa", passportRank: 79, visaFreeDestinations: 63, flagEmoji: "🇿🇼", capital: "Harare", population: 14862924, coordinates: [-19.02, 29.15], safetyScore: 65, safetyLevel: "Moderate" },
  { code: "AQ", name: "Antarctica", continent: "Antarctica", passportRank: 0, visaFreeDestinations: 0, flagEmoji: "🇦🇶", capital: "None", population: 1000, coordinates: [-75.25, -0.07], safetyScore: 99, safetyLevel: "Very High" },

  // North America
  { code: "BZ", name: "Belize", continent: "North America", passportRank: 55, visaFreeDestinations: 102, flagEmoji: "🇧🇿", capital: "Belmopan", population: 397628, coordinates: [17.18, -88.49], safetyScore: 68, safetyLevel: "Moderate" },
  { code: "CA", name: "Canada", continent: "North America", passportRank: 9, visaFreeDestinations: 183, flagEmoji: "🇨🇦", capital: "Ottawa", population: 37742154, officialVisaWebsite: "https://www.canada.ca/en/services/immigration-citizenship.html", coordinates: [56.13, -106.34], safetyScore: 90, safetyLevel: "Very High" },
  { code: "CR", name: "Costa Rica", continent: "North America", passportRank: 29, visaFreeDestinations: 152, flagEmoji: "🇨🇷", capital: "San José", population: 5094118, coordinates: [9.74, -83.75], safetyScore: 76, safetyLevel: "High" },
  { code: "CU", name: "Cuba", continent: "North America", passportRank: 76, visaFreeDestinations: 67, flagEmoji: "🇨🇺", capital: "Havana", population: 11326616, coordinates: [21.52, -77.78], safetyScore: 65, safetyLevel: "Moderate" },
  { code: "DM", name: "Dominica", continent: "North America", passportRank: 33, visaFreeDestinations: 146, flagEmoji: "🇩🇲", capital: "Roseau", population: 71986, coordinates: [15.41, -61.37], safetyScore: 75, safetyLevel: "High" },
  { code: "DO", name: "Dominican Republic", continent: "North America", passportRank: 69, visaFreeDestinations: 79, flagEmoji: "🇩🇴", capital: "Santo Domingo", population: 10847910, coordinates: [18.73, -70.16], safetyScore: 60, safetyLevel: "Moderate" },
  { code: "SV", name: "El Salvador", continent: "North America", passportRank: 35, visaFreeDestinations: 143, flagEmoji: "🇸🇻", capital: "San Salvador", population: 6486205, coordinates: [13.79, -88.89], safetyScore: 55, safetyLevel: "Low" },
  { code: "GD", name: "Grenada", continent: "North America", passportRank: 28, visaFreeDestinations: 153, flagEmoji: "🇬🇩", capital: "St. George's", population: 112523, coordinates: [12.11, -61.67], safetyScore: 78, safetyLevel: "High" },
  { code: "GT", name: "Guatemala", continent: "North America", passportRank: 40, visaFreeDestinations: 136, flagEmoji: "🇬🇹", capital: "Guatemala City", population: 17915568, coordinates: [15.78, -90.23], safetyScore: 58, safetyLevel: "Low" },
  { code: "HT", name: "Haiti", continent: "North America", passportRank: 89, visaFreeDestinations: 52, flagEmoji: "🇭🇹", capital: "Port-au-Prince", population: 11402528, coordinates: [18.97, -72.28], safetyScore: 30, safetyLevel: "Low" },
  { code: "HN", name: "Honduras", continent: "North America", passportRank: 42, visaFreeDestinations: 133, flagEmoji: "🇭🇳", capital: "Tegucigalpa", population: 9904607, coordinates: [15.20, -86.24], safetyScore: 45, safetyLevel: "Low" },
  { code: "JM", name: "Jamaica", continent: "North America", passportRank: 60, visaFreeDestinations: 93, flagEmoji: "🇯🇲", capital: "Kingston", population: 2961167, coordinates: [18.10, -77.29], safetyScore: 60, safetyLevel: "Moderate" },
  { code: "MX", name: "Mexico", continent: "North America", passportRank: 22, visaFreeDestinations: 167, flagEmoji: "🇲🇽", capital: "Mexico City", population: 128932753, coordinates: [23.63, -102.55], safetyScore: 55, safetyLevel: "Low" },
  { code: "NI", name: "Nicaragua", continent: "North America", passportRank: 44, visaFreeDestinations: 127, flagEmoji: "🇳🇮", capital: "Managua", population: 6624554, coordinates: [12.86, -85.20], safetyScore: 58, safetyLevel: "Low" },
  { code: "PA", name: "Panama", continent: "North America", passportRank: 34, visaFreeDestinations: 145, flagEmoji: "🇵🇦", capital: "Panama City", population: 4314767, coordinates: [8.53, -80.78], safetyScore: 68, safetyLevel: "Moderate" },
  { code: "KN", name: "Saint Kitts and Nevis", continent: "North America", passportRank: 23, visaFreeDestinations: 166, flagEmoji: "🇰🇳", capital: "Basseterre", population: 53199, coordinates: [17.35, -62.78], safetyScore: 78, safetyLevel: "High" },
  { code: "LC", name: "Saint Lucia", continent: "North America", passportRank: 29, visaFreeDestinations: 152, flagEmoji: "🇱🇨", capital: "Castries", population: 183627, coordinates: [13.90, -60.97], safetyScore: 75, safetyLevel: "High" },
  { code: "VC", name: "Saint Vincent and the Grenadines", continent: "North America", passportRank: 28, visaFreeDestinations: 153, flagEmoji: "🇻🇨", capital: "Kingstown", population: 110940, coordinates: [12.98, -61.28], safetyScore: 75, safetyLevel: "High" },
  { code: "TT", name: "Trinidad and Tobago", continent: "North America", passportRank: 27, visaFreeDestinations: 156, flagEmoji: "🇹🇹", capital: "Port of Spain", population: 1399488, coordinates: [10.69, -61.22], safetyScore: 65, safetyLevel: "Moderate" },
  { code: "US", name: "United States", continent: "North America", passportRank: 8, visaFreeDestinations: 186, flagEmoji: "🇺🇸", capital: "Washington, D.C.", population: 331002651, officialVisaWebsite: "https://travel.state.gov/content/travel/en/us-visas.html", hdi: 0.921, gdp: 76329, currency: "USD", safetyScore: 83, safetyLevel: "High", coordinates: [37.09, -95.71] },

  // South America
  { code: "AR", name: "Argentina", continent: "South America", passportRank: 17, visaFreeDestinations: 172, flagEmoji: "🇦🇷", capital: "Buenos Aires", population: 45195774, coordinates: [-38.41, -63.61], safetyScore: 70, safetyLevel: "Moderate" },
  { code: "BO", name: "Bolivia", continent: "South America", passportRank: 66, visaFreeDestinations: 83, flagEmoji: "🇧🇴", capital: "Sucre", population: 11673021, coordinates: [-16.29, -63.58], safetyScore: 65, safetyLevel: "Moderate" },
  { code: "BR", name: "Brazil", continent: "South America", passportRank: 18, visaFreeDestinations: 171, flagEmoji: "🇧🇷", capital: "Brasília", population: 212559417, officialVisaWebsite: "https://www.gov.br/mre/pt-br/assuntos/portal-consular/vistos", coordinates: [-14.23, -51.92], safetyScore: 60, safetyLevel: "Moderate" },
  { code: "CL", name: "Chile", continent: "South America", passportRank: 16, visaFreeDestinations: 174, flagEmoji: "🇨🇱", capital: "Santiago", population: 19116201, coordinates: [-35.67, -71.54], safetyScore: 82, safetyLevel: "High" },
  { code: "CO", name: "Colombia", continent: "South America", passportRank: 41, visaFreeDestinations: 134, flagEmoji: "🇨🇴", capital: "Bogotá", population: 50882891, coordinates: [4.57, -74.29], safetyScore: 60, safetyLevel: "Moderate" },
  { code: "EC", name: "Ecuador", continent: "South America", passportRank: 56, visaFreeDestinations: 100, flagEmoji: "🇪🇨", capital: "Quito", population: 17643054, coordinates: [-1.83, -78.18], safetyScore: 50, safetyLevel: "Low" },
  { code: "GY", name: "Guyana", continent: "South America", passportRank: 63, visaFreeDestinations: 88, flagEmoji: "🇬🇾", capital: "Georgetown", population: 786552, coordinates: [4.86, -58.93], safetyScore: 68, safetyLevel: "Moderate" },
  { code: "PY", name: "Paraguay", continent: "South America", passportRank: 36, visaFreeDestinations: 142, flagEmoji: "🇵🇾", capital: "Asunción", population: 7132538, coordinates: [-23.44, -58.44], safetyScore: 72, safetyLevel: "High" },
  { code: "PE", name: "Peru", continent: "South America", passportRank: 37, visaFreeDestinations: 140, flagEmoji: "🇵🇪", capital: "Lima", population: 32971854, coordinates: [-9.19, -75.01], safetyScore: 65, safetyLevel: "Moderate" },
  { code: "SR", name: "Suriname", continent: "South America", passportRank: 67, visaFreeDestinations: 82, flagEmoji: "🇸🇷", capital: "Paramaribo", population: 586632, coordinates: [3.91, -56.02], safetyScore: 68, safetyLevel: "Moderate" },
  { code: "UY", name: "Uruguay", continent: "South America", passportRank: 25, visaFreeDestinations: 163, flagEmoji: "🇺🇾", capital: "Montevideo", population: 3473730, coordinates: [-32.52, -55.76], safetyScore: 80, safetyLevel: "High" },
  { code: "VE", name: "Venezuela", continent: "South America", passportRank: 46, visaFreeDestinations: 125, flagEmoji: "🇻🇪", capital: "Caracas", population: 28435940, coordinates: [6.42, -66.58], safetyScore: 30, safetyLevel: "Low" },

  // Oceania
  { code: "AU", name: "Australia", continent: "Oceania", passportRank: 7, visaFreeDestinations: 185, flagEmoji: "🇦🇺", capital: "Canberra", population: 25499884, officialVisaWebsite: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-finder", coordinates: [-25.27, 133.77], safetyScore: 88, safetyLevel: "Very High" },
  { code: "FJ", name: "Fiji", continent: "Oceania", passportRank: 56, visaFreeDestinations: 100, flagEmoji: "🇫🇯", capital: "Suva", population: 896445, coordinates: [-17.71, 178.06], safetyScore: 75, safetyLevel: "High" },
  { code: "KI", name: "Kiribati", continent: "Oceania", passportRank: 64, visaFreeDestinations: 87, flagEmoji: "🇰🇮", capital: "Tarawa", population: 119449, coordinates: [-3.37, -168.73], safetyScore: 80, safetyLevel: "High" },
  { code: "MH", name: "Marshall Islands", continent: "Oceania", passportRank: 43, visaFreeDestinations: 128, flagEmoji: "🇲🇭", capital: "Majuro", population: 59190, coordinates: [7.13, 171.18], safetyScore: 78, safetyLevel: "High" },
  { code: "FM", name: "Micronesia", continent: "Oceania", passportRank: 47, visaFreeDestinations: 124, flagEmoji: "🇫🇲", capital: "Palikir", population: 548914, coordinates: [7.42, 150.55], safetyScore: 80, safetyLevel: "High" },
  { code: "NR", name: "Nauru", continent: "Oceania", passportRank: 49, visaFreeDestinations: 119, flagEmoji: "🇳🇷", capital: "Yaren", population: 10824, coordinates: [-0.52, 166.93], safetyScore: 82, safetyLevel: "High" },
  { code: "NZ", name: "New Zealand", continent: "Oceania", passportRank: 6, visaFreeDestinations: 186, flagEmoji: "🇳🇿", capital: "Wellington", population: 4822233, officialVisaWebsite: "https://www.immigration.govt.nz/new-zealand-visas", coordinates: [-40.90, 174.88], safetyScore: 92, safetyLevel: "Very High" },
  { code: "PW", name: "Palau", continent: "Oceania", passportRank: 44, visaFreeDestinations: 127, flagEmoji: "🇵🇼", capital: "Ngerulmud", population: 18094, coordinates: [7.51, 134.58], safetyScore: 85, safetyLevel: "High" },
  { code: "PG", name: "Papua New Guinea", continent: "Oceania", passportRank: 81, visaFreeDestinations: 61, flagEmoji: "🇵🇬", capital: "Port Moresby", population: 8947024, coordinates: [-6.31, 143.95], safetyScore: 50, safetyLevel: "Low" },
  { code: "WS", name: "Samoa", continent: "Oceania", passportRank: 39, visaFreeDestinations: 137, flagEmoji: "🇼🇸", capital: "Apia", population: 198414, coordinates: [-13.75, -172.10], safetyScore: 80, safetyLevel: "High" },
  { code: "SB", name: "Solomon Islands", continent: "Oceania", passportRank: 46, visaFreeDestinations: 125, flagEmoji: "🇸🇧", capital: "Honiara", population: 686884, coordinates: [-9.64, 160.15], safetyScore: 70, safetyLevel: "Moderate" },
  { code: "TO", name: "Tonga", continent: "Oceania", passportRank: 38, visaFreeDestinations: 139, flagEmoji: "🇹🇴", capital: "Nukuʻalofa", population: 105695, coordinates: [-21.17, -175.19], safetyScore: 82, safetyLevel: "High" },
  { code: "TV", name: "Tuvalu", continent: "Oceania", passportRank: 40, visaFreeDestinations: 136, flagEmoji: "🇹🇻", capital: "Funafuti", population: 11792, coordinates: [-7.10, 177.64], safetyScore: 85, safetyLevel: "High" },
  { code: "VU", name: "Vanuatu", continent: "Oceania", passportRank: 35, visaFreeDestinations: 143, flagEmoji: "🇻🇺", capital: "Port Vila", population: 307145, coordinates: [-15.37, 166.95], safetyScore: 75, safetyLevel: "High" },
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
