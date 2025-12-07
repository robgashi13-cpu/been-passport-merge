export interface City {
    name: string;
    population?: number;
    isCapital?: boolean;
    latitude?: number;
    longitude?: number;
    bestSeason?: string;
}

export const citiesByCountry: Record<string, City[]> = {
    // === NORTH AMERICA ===
    "US": [
        { name: "New York City", population: 8419600, latitude: 40.7128, longitude: -74.0060, bestSeason: "Apr-Jun, Sep-Nov" },
        { name: "Los Angeles", population: 3980400, latitude: 34.0522, longitude: -118.2437, bestSeason: "Mar-May, Sep-Nov" },
        { name: "Chicago", population: 2716000, latitude: 41.8781, longitude: -87.6298, bestSeason: "Jun-Sep" },
        { name: "Houston", population: 2328000, latitude: 29.7604, longitude: -95.3698, bestSeason: "Feb-Apr, Oct-Nov" },
        { name: "Phoenix", population: 1680992, bestSeason: "Nov-Apr" },
        { name: "Philadelphia", population: 1584064, bestSeason: "Mar-May" },
        { name: "San Antonio", population: 1547253, bestSeason: "Nov-Apr" },
        { name: "San Diego", population: 1423851, bestSeason: "Mar-May, Sep-Nov" },
        { name: "Dallas", population: 1343573, bestSeason: "Sep-Nov, Mar-May" },
        { name: "San Jose", population: 1021795, bestSeason: "Jun-Sep" },
        { name: "Washington, D.C.", population: 689545, isCapital: true, bestSeason: "Sep-Nov, Mar-May" },
        { name: "Miami", population: 442241, bestSeason: "Nov-Apr" },
        { name: "San Francisco", population: 873965, bestSeason: "Sep-Nov" },
        { name: "Seattle", population: 737015, bestSeason: "Jun-Sep" },
        { name: "Boston", population: 675647, bestSeason: "Jun-Oct" },
        { name: "Las Vegas", population: 641903, bestSeason: "Mar-May, Sep-Nov" },
        { name: "Orlando", population: 307573, bestSeason: "Jan-Apr" }
    ],
    "CA": [
        { name: "Toronto", population: 2731571 },
        { name: "Montreal", population: 1704694 },
        { name: "Vancouver", population: 631486 },
        { name: "Calgary", population: 1239220 },
        { name: "Edmonton", population: 932546 },
        { name: "Ottawa", population: 934243, isCapital: true },
        { name: "Winnipeg", population: 705244 },
        { name: "Quebec City", population: 531902 },
        { name: "Hamilton", population: 536917 },
        { name: "Halifax", population: 403131 }
    ],
    "MX": [
        { name: "Mexico City", population: 9209944, isCapital: true },
        { name: "Tijuana", population: 1922523 },
        { name: "Ecatepec", population: 1645352 },
        { name: "León", population: 1578626 },
        { name: "Puebla", population: 1542232 },
        { name: "Guadalajara", population: 1385629 },
        { name: "Juárez", population: 1512450 },
        { name: "Monterrey", population: 1142994 },
        { name: "Cancún", population: 888797 }
    ],
    // === EUROPE ===
    "GB": [
        { name: "London", population: 8982000, isCapital: true, bestSeason: "May-Sep" },
        { name: "Birmingham", population: 1141816, bestSeason: "May-Sep" },
        { name: "Manchester", population: 553230, bestSeason: "Jun-Aug" },
        { name: "Glasgow", population: 633120, bestSeason: "May-Aug" },
        { name: "Leeds", population: 793139, bestSeason: "May-Sep" },
        { name: "Liverpool", population: 496784, bestSeason: "May-Sep" },
        { name: "Newcastle", population: 300196, bestSeason: "Jun-Aug" },
        { name: "Sheffield", population: 584853, bestSeason: "May-Sep" },
        { name: "Bristol", population: 467099, bestSeason: "May-Sep" },
        { name: "Edinburgh", population: 524930, bestSeason: "Jun-Aug" },
        { name: "Cardiff", population: 362750, bestSeason: "Jun-Aug" },
        { name: "Belfast", population: 341877, bestSeason: "May-Aug" }
    ],
    "FR": [
        { name: "Paris", population: 2165423, isCapital: true, bestSeason: "Apr-Oct" },
        { name: "Marseille", population: 868277, bestSeason: "May-Oct" },
        { name: "Lyon", population: 518635, bestSeason: "Apr-Oct" },
        { name: "Toulouse", population: 479553, bestSeason: "May-Oct" },
        { name: "Nice", population: 340017, bestSeason: "May-Oct" },
        { name: "Nantes", population: 314138, bestSeason: "Jun-Sep" },
        { name: "Montpellier", population: 285121, bestSeason: "May-Oct" },
        { name: "Strasbourg", population: 284677, bestSeason: "May-Oct" },
        { name: "Bordeaux", population: 257068, bestSeason: "May-Oct" },
        { name: "Lille", population: 232787, bestSeason: "Jun-Sep" }
    ],
    "DE": [
        { name: "Berlin", population: 3769000, isCapital: true, bestSeason: "May-Sep" },
        { name: "Hamburg", population: 1841000, bestSeason: "May-Sep" },
        { name: "Munich", population: 1472000, bestSeason: "May-Oct" },
        { name: "Cologne", population: 1086000, bestSeason: "May-Oct" },
        { name: "Frankfurt", population: 753056, bestSeason: "May-Oct" },
        { name: "Stuttgart", population: 634830, bestSeason: "May-Oct" },
        { name: "Düsseldorf", population: 619294, bestSeason: "May-Oct" },
        { name: "Leipzig", population: 587857, bestSeason: "May-Sep" },
        { name: "Dortmund", population: 587010, bestSeason: "May-Sep" },
        { name: "Essen", population: 583109, bestSeason: "May-Sep" }
    ],
    "IT": [
        { name: "Rome", population: 2873000, isCapital: true },
        { name: "Milan", population: 1352000 },
        { name: "Naples", population: 966148 },
        { name: "Turin", population: 870952 },
        { name: "Palermo", population: 657960 },
        { name: "Genoa", population: 580097 },
        { name: "Bologna", population: 388367 },
        { name: "Florence", population: 380948 },
        { name: "Venice", population: 261905 },
        { name: "Verona", population: 257353 }
    ],
    "ES": [
        { name: "Madrid", population: 3223000, isCapital: true },
        { name: "Barcelona", population: 1620000 },
        { name: "Valencia", population: 791413 },
        { name: "Seville", population: 688711 },
        { name: "Zaragoza", population: 666880 },
        { name: "Málaga", population: 571026 },
        { name: "Murcia", population: 447182 },
        { name: "Palma", population: 409661 },
        { name: "Las Palmas", population: 378517 },
        { name: "Bilbao", population: 345821 }
    ],
    "PT": [
        { name: "Lisbon", population: 504718, isCapital: true },
        { name: "Porto", population: 214349 },
        { name: "Vila Nova de Gaia", population: 186502 },
        { name: "Amadora", population: 175136 },
        { name: "Braga", population: 136885 },
        { name: "Funchal", population: 111892 },
        { name: "Coimbra", population: 105842 }
    ],
    "NL": [
        { name: "Amsterdam", population: 872757, isCapital: true },
        { name: "Rotterdam", population: 651157 },
        { name: "The Hague", population: 544766 },
        { name: "Utrecht", population: 357597 },
        { name: "Eindhoven", population: 231500 }
    ],
    "BE": [
        { name: "Brussels", population: 185103, isCapital: true }, // City proper
        { name: "Antwerp", population: 529247 },
        { name: "Ghent", population: 263927 },
        { name: "Charleroi", population: 202746 },
        { name: "Liège", population: 197355 }
    ],
    "CH": [
        { name: "Zürich", population: 415367 },
        { name: "Geneva", population: 201818 },
        { name: "Basel", population: 171017 },
        { name: "Bern", population: 133883, isCapital: true },
        { name: "Lausanne", population: 137810 }
    ],
    "AT": [
        { name: "Vienna", population: 1911191, isCapital: true },
        { name: "Graz", population: 291072 },
        { name: "Linz", population: 206595 },
        { name: "Salzburg", population: 155021 },
        { name: "Innsbruck", population: 131961 }
    ],
    "SE": [
        { name: "Stockholm", population: 975904, isCapital: true },
        { name: "Gothenburg", population: 581822 },
        { name: "Malmö", population: 347949 },
        { name: "Uppsala", population: 177074 }
    ],
    "NO": [
        { name: "Oslo", population: 693494, isCapital: true },
        { name: "Bergen", population: 283929 },
        { name: "Trondheim", population: 205163 },
        { name: "Stavanger", population: 142034 }
    ],
    "DK": [
        { name: "Copenhagen", population: 632340, isCapital: true },
        { name: "Aarhus", population: 349983 },
        { name: "Odense", population: 204895 },
        { name: "Aalborg", population: 117351 }
    ],
    "FI": [
        { name: "Helsinki", population: 656920, isCapital: true },
        { name: "Espoo", population: 292796 },
        { name: "Tampere", population: 241009 },
        { name: "Vantaa", population: 233775 }
    ],
    "GR": [
        { name: "Athens", population: 664046, isCapital: true },
        { name: "Thessaloniki", population: 315196 },
        { name: "Patras", population: 167446 },
        { name: "Heraklion", population: 140730 }
    ],
    "TR": [
        { name: "Istanbul", population: 15462452 },
        { name: "Ankara", population: 5663322, isCapital: true },
        { name: "Izmir", population: 4367251 },
        { name: "Bursa", population: 3056120 },
        { name: "Antalya", population: 2511700 }
    ],
    "RU": [
        { name: "Moscow", population: 12506000, isCapital: true },
        { name: "Saint Petersburg", population: 5351000 },
        { name: "Novosibirsk", population: 1612000 },
        { name: "Yekaterinburg", population: 1483000 },
        { name: "Kazan", population: 1243000 }
    ],
    "PL": [
        { name: "Warsaw", population: 1790658, isCapital: true },
        { name: "Kraków", population: 779115 },
        { name: "Łódź", population: 679941 },
        { name: "Wrocław", population: 642869 }
    ],
    "CZ": [
        { name: "Prague", population: 1324277, isCapital: true },
        { name: "Brno", population: 381346 },
        { name: "Ostrava", population: 287968 },
        { name: "Plzeň", population: 174842 }
    ],
    "HU": [
        { name: "Budapest", population: 1752286, isCapital: true },
        { name: "Debrecen", population: 201112 },
        { name: "Szeged", population: 160766 },
        { name: "Miskolc", population: 152901 }
    ],
    "RO": [
        { name: "Bucharest", population: 1883425, isCapital: true },
        { name: "Cluj-Napoca", population: 324576 },
        { name: "Timișoara", population: 319279 },
        { name: "Iași", population: 290422 }
    ],
    "UA": [
        { name: "Kyiv", population: 2962180, isCapital: true },
        { name: "Kharkiv", population: 1433886 },
        { name: "Odesa", population: 1015826 },
        { name: "Dnipro", population: 980948 }
    ],

    // === ASIA ===
    "CN": [
        { name: "Beijing", population: 21540000, isCapital: true },
        { name: "Shanghai", population: 26320000 },
        { name: "Guangzhou", population: 15300000 },
        { name: "Shenzhen", population: 12530000 },
        { name: "Chengdu", population: 16330000 },
        { name: "Tianjin", population: 13860000 },
        { name: "Wuhan", population: 11080000 },
        { name: "Xi'an", population: 12000000 },
        { name: "Hong Kong", population: 7481800 }
    ],
    "JP": [
        { name: "Tokyo", population: 13960000, isCapital: true },
        { name: "Yokohama", population: 3724844 },
        { name: "Osaka", population: 2691185 },
        { name: "Nagoya", population: 2295638 },
        { name: "Sapporo", population: 1952356 },
        { name: "Fukuoka", population: 1538681 },
        { name: "Kyoto", population: 1475183 },
        { name: "Kobe", population: 1525152 }
    ],
    "IN": [
        { name: "Delhi", population: 30291000, isCapital: true },
        { name: "Mumbai", population: 20411000 },
        { name: "Bangalore", population: 8443000 },
        { name: "Hyderabad", population: 6809000 },
        { name: "Ahmedabad", population: 5570000 },
        { name: "Chennai", population: 4681000 },
        { name: "Kolkata", population: 4486000 },
        { name: "Jaipur", population: 3046000 }
    ],
    "KR": [
        { name: "Seoul", population: 9733509, isCapital: true },
        { name: "Busan", population: 3404423 },
        { name: "Incheon", population: 2947217 },
        { name: "Daegu", population: 2431940 }
    ],
    "ID": [
        { name: "Jakarta", population: 10562088, isCapital: true },
        { name: "Surabaya", population: 2874314 },
        { name: "Bandung", population: 2507868 },
        { name: "Medan", population: 2435252 },
        { name: "Bali (Denpasar)", population: 897300 }
    ],
    "TH": [
        { name: "Bangkok", population: 10539000, isCapital: true },
        { name: "Chiang Mai", population: 131091 },
        { name: "Phuket", population: 79308 },
        { name: "Pattaya", population: 320262 }
    ],
    "VN": [
        { name: "Hanoi", population: 8053663, isCapital: true },
        { name: "Ho Chi Minh City", population: 8993082 },
        { name: "Da Nang", population: 1134310 },
        { name: "Haiphong", population: 2028514 }
    ],
    "SG": [
        { name: "Singapore", population: 5686000, isCapital: true }
    ],
    "MY": [
        { name: "Kuala Lumpur", population: 1731041, isCapital: true },
        { name: "George Town (Penang)", population: 708127 },
        { name: "Johor Bahru", population: 497067 }
    ],
    "PH": [
        { name: "Manila", population: 1780148, isCapital: true },
        { name: "Quezon City", population: 2936116 },
        { name: "Davao City", population: 1632991 },
        { name: "Cebu City", population: 922611 }
    ],
    "AE": [
        { name: "Abu Dhabi", population: 1483000, isCapital: true },
        { name: "Dubai", population: 3381000 },
        { name: "Sharjah", population: 1400000 }
    ],
    "SA": [
        { name: "Riyadh", population: 7676654, isCapital: true },
        { name: "Jeddah", population: 4697000 },
        { name: "Mecca", population: 2042000 },
        { name: "Medina", population: 1488782 }
    ],
    "IL": [
        { name: "Jerusalem", population: 936425, isCapital: true },
        { name: "Tel Aviv", population: 460613 },
        { name: "Haifa", population: 285316 }
    ],

    // === OCEANIA ===
    "AU": [
        { name: "Canberra", population: 462000, isCapital: true },
        { name: "Sydney", population: 5312000 },
        { name: "Melbourne", population: 5078000 },
        { name: "Brisbane", population: 2514000 },
        { name: "Perth", population: 2086000 },
        { name: "Adelaide", population: 1376000 },
        { name: "Gold Coast", population: 699000 },
        { name: "Hobart", population: 236000 }
    ],
    "NZ": [
        { name: "Wellington", population: 212700, isCapital: true },
        { name: "Auckland", population: 1463000 },
        { name: "Christchurch", population: 377200 },
        { name: "Queenstown", population: 16000 }
    ],
    "FJ": [
        { name: "Suva", population: 88271, isCapital: true },
        { name: "Nadi", population: 42284 }
    ],

    // === SOUTH AMERICA ===
    "BR": [
        { name: "Brasília", population: 3055149, isCapital: true },
        { name: "São Paulo", population: 12325000 },
        { name: "Rio de Janeiro", population: 6748000 },
        { name: "Salvador", population: 2886000 },
        { name: "Fortaleza", population: 2687000 },
        { name: "Manaus", population: 2219000 }
    ],
    "AR": [
        { name: "Buenos Aires", population: 2891000, isCapital: true },
        { name: "Córdoba", population: 1317000 },
        { name: "Rosario", population: 948000 },
        { name: "Mendoza", population: 115041 }
    ],
    "CO": [
        { name: "Bogotá", population: 7181000, isCapital: true },
        { name: "Medellín", population: 2569000 },
        { name: "Cali", population: 2227000 },
        { name: "Cartagena", population: 914552 }
    ],
    "CL": [
        { name: "Santiago", population: 5614000, isCapital: true },
        { name: "Valparaíso", population: 296655 },
        { name: "Concepción", population: 223574 }
    ],
    "PE": [
        { name: "Lima", population: 9711000, isCapital: true },
        { name: "Arequipa", population: 1008000 },
        { name: "Cusco", population: 428450 }
    ],

    // === AFRICA ===
    "ZA": [
        { name: "Pretoria", population: 741651, isCapital: true }, // Executive
        { name: "Cape Town", population: 433688 }, // Legislative
        { name: "Johannesburg", population: 5635000 },
        { name: "Durban", population: 595061 }
    ],
    "EG": [
        { name: "Cairo", population: 9605000, isCapital: true },
        { name: "Alexandria", population: 5200000 },
        { name: "Giza", population: 8800000 },
        { name: "Luxor", population: 506588 },
        { name: "Sharm El Sheikh", population: 73000 }
    ],
    "MA": [
        { name: "Rabat", population: 577827, isCapital: true },
        { name: "Casablanca", population: 3359000 },
        { name: "Fes", population: 1112000 },
        { name: "Marrakesh", population: 928850 },
        { name: "Tangier", population: 947952 }
    ],
    "NG": [
        { name: "Abuja", population: 1235880, isCapital: true },
        { name: "Lagos", population: 15388000 },
        { name: "Kano", population: 2828861 }
    ],
    "KE": [
        { name: "Nairobi", population: 4397000, isCapital: true },
        { name: "Mombasa", population: 1200000 },
        { name: "Kisumu", population: 409928 }
    ],

    // Add more extensive fallback for all other codes (Capitals mostly) to ensure 199 coverage
    // --- REST OF EUROPE (Samples) ---
    "AL": [{ name: "Tirana", population: 418495, isCapital: true }],
    "AD": [{ name: "Andorra la Vella", population: 22256, isCapital: true }],
    "AM": [{ name: "Yerevan", population: 1060138, isCapital: true }],
    "BY": [{ name: "Minsk", population: 1974800, isCapital: true }],
    "BA": [{ name: "Sarajevo", population: 275524, isCapital: true }],
    "BG": [{ name: "Sofia", population: 1236047, isCapital: true }],
    "HR": [{ name: "Zagreb", population: 806341, isCapital: true }, { name: "Split", population: 178102 }, { name: "Dubrovnik", population: 42615 }],
    "CY": [{ name: "Nicosia", population: 116392, isCapital: true }],
    "EE": [{ name: "Tallinn", population: 438341, isCapital: true }],
    "IS": [{ name: "Reykjavík", population: 122853, isCapital: true }],
    "IE": [{ name: "Dublin", population: 544107, isCapital: true }, { name: "Cork", population: 210000 }],
    "LV": [{ name: "Riga", population: 632614, isCapital: true }],
    "LI": [{ name: "Vaduz", population: 5450, isCapital: true }],
    "LT": [{ name: "Vilnius", population: 580020, isCapital: true }],
    "LU": [{ name: "Luxembourg", population: 114303, isCapital: true }],
    "MT": [{ name: "Valletta", population: 5827, isCapital: true }],
    "MD": [{ name: "Chișinău", population: 532513, isCapital: true }],
    "MC": [{ name: "Monaco", population: 39244, isCapital: true }],
    "ME": [{ name: "Podgorica", population: 151312, isCapital: true }],
    "MK": [{ name: "Skopje", population: 546824, isCapital: true }],
    "SM": [{ name: "San Marino", population: 4044, isCapital: true }],
    "RS": [{ name: "Belgrade", population: 1166763, isCapital: true }],
    "SK": [{ name: "Bratislava", population: 424428, isCapital: true }],
    "SI": [{ name: "Ljubljana", population: 279631, isCapital: true }],
    "XK": [{ name: "Pristina", population: 145149, isCapital: true }], // Kosovo

    // --- REST OF ASIA ---
    "AF": [{ name: "Kabul", population: 4273000, isCapital: true }],

    "AZ": [{ name: "Baku", population: 2236000, isCapital: true }],
    "BH": [{ name: "Manama", population: 157000, isCapital: true }],
    "BD": [{ name: "Dhaka", population: 8906000, isCapital: true }],
    "BT": [{ name: "Thimphu", population: 114000, isCapital: true }],
    "BN": [{ name: "Bandar Seri Begawan", population: 100700, isCapital: true }],
    "KH": [{ name: "Phnom Penh", population: 2129000, isCapital: true }],
    "GE": [{ name: "Tbilisi", population: 1100000, isCapital: true }],
    "IR": [{ name: "Tehran", population: 8693000, isCapital: true }],
    "IQ": [{ name: "Baghdad", population: 7000000, isCapital: true }],
    "JO": [{ name: "Amman", population: 4000000, isCapital: true }],
    "KZ": [{ name: "Astana", population: 1078000, isCapital: true }, { name: "Almaty", population: 1854000 }],
    "KW": [{ name: "Kuwait City", population: 3000000, isCapital: true }],
    "KG": [{ name: "Bishkek", population: 906000, isCapital: true }],
    "LA": [{ name: "Vientiane", population: 948000, isCapital: true }],
    "LB": [{ name: "Beirut", population: 2424000, isCapital: true }],
    "MV": [{ name: "Malé", population: 133412, isCapital: true }],
    "MN": [{ name: "Ulaanbaatar", population: 1452000, isCapital: true }],
    "MM": [{ name: "Naypyidaw", population: 1160000, isCapital: true }, { name: "Yangon", population: 4760000 }],
    "NP": [{ name: "Kathmandu", population: 1442000, isCapital: true }],
    "OM": [{ name: "Muscat", population: 1421000, isCapital: true }],
    "PK": [{ name: "Islamabad", population: 1015000, isCapital: true }, { name: "Karachi", population: 14900000 }, { name: "Lahore", population: 11100000 }],
    "QA": [{ name: "Doha", population: 2382000, isCapital: true }],
    "LK": [{ name: "Sri Jayawardenepura Kotte", population: 115826, isCapital: true }, { name: "Colombo", population: 752993 }],
    "SY": [{ name: "Damascus", population: 2079000, isCapital: true }],
    "TW": [{ name: "Taipei", population: 2646000, isCapital: true }],
    "TJ": [{ name: "Dushanbe", population: 863000, isCapital: true }],
    "TM": [{ name: "Ashgabat", population: 1000000, isCapital: true }],
    "UZ": [{ name: "Tashkent", population: 2485000, isCapital: true }],
    "YE": [{ name: "Sana'a", population: 2575000, isCapital: true }],

    // --- REST OF AMERICAS ---
    "AG": [{ name: "St. John's", population: 22000, isCapital: true }],
    "BS": [{ name: "Nassau", population: 274000, isCapital: true }],
    "BB": [{ name: "Bridgetown", population: 110000, isCapital: true }],
    "BZ": [{ name: "Belmopan", population: 20000, isCapital: true }, { name: "Belize City", population: 57000 }],
    "BO": [{ name: "Sucre", population: 300000, isCapital: true }, { name: "La Paz", population: 764000 }],
    "CR": [{ name: "San José", population: 342000, isCapital: true }],
    "CU": [{ name: "Havana", population: 2130000, isCapital: true }],
    "DM": [{ name: "Roseau", population: 14000, isCapital: true }],
    "DO": [{ name: "Santo Domingo", population: 1111000, isCapital: true }, { name: "Punta Cana", population: 43000 }],
    "EC": [{ name: "Quito", population: 2011000, isCapital: true }, { name: "Guayaquil", population: 2723000 }],
    "SV": [{ name: "San Salvador", population: 249000, isCapital: true }],
    "GD": [{ name: "St. George's", population: 33000, isCapital: true }],
    "GT": [{ name: "Guatemala City", population: 994000, isCapital: true }],
    "GY": [{ name: "Georgetown", population: 118000, isCapital: true }],
    "HT": [{ name: "Port-au-Prince", population: 987000, isCapital: true }],
    "HN": [{ name: "Tegucigalpa", population: 1157000, isCapital: true }],
    "JM": [{ name: "Kingston", population: 661000, isCapital: true }, { name: "Montego Bay", population: 110000 }],
    "NI": [{ name: "Managua", population: 1055000, isCapital: true }],
    "PA": [{ name: "Panama City", population: 880000, isCapital: true }],
    "PY": [{ name: "Asunción", population: 524000, isCapital: true }],
    "KN": [{ name: "Basseterre", population: 14000, isCapital: true }],
    "LC": [{ name: "Castries", population: 7000, isCapital: true }],
    "VC": [{ name: "Kingstown", population: 13000, isCapital: true }],
    "SR": [{ name: "Paramaribo", population: 240000, isCapital: true }],
    "TT": [{ name: "Port of Spain", population: 37000, isCapital: true }],
    "UY": [{ name: "Montevideo", population: 1319000, isCapital: true }],
    "VE": [{ name: "Caracas", population: 1943000, isCapital: true }],

    // --- AFRICAN CAPITALS ---
    "DZ": [{ name: "Algiers", population: 3415000, isCapital: true }],
    "AO": [{ name: "Luanda", population: 2487000, isCapital: true }],
    "BJ": [{ name: "Porto-Novo", population: 264000, isCapital: true }],
    "BW": [{ name: "Gaborone", population: 231000, isCapital: true }],
    "BF": [{ name: "Ouagadougou", population: 2453000, isCapital: true }],
    "BI": [{ name: "Gitega", population: 41000, isCapital: true }, { name: "Bujumbura", population: 1092000 }],
    "CV": [{ name: "Praia", population: 159000, isCapital: true }],
    "CM": [{ name: "Yaoundé", population: 2765000, isCapital: true }],
    "CF": [{ name: "Bangui", population: 889000, isCapital: true }],
    "TD": [{ name: "N'Djamena", population: 1092000, isCapital: true }],
    "KM": [{ name: "Moroni", population: 111000, isCapital: true }],
    "CG": [{ name: "Brazzaville", population: 1826000, isCapital: true }],
    "CD": [{ name: "Kinshasa", population: 11855000, isCapital: true }],
    "CI": [{ name: "Yamoussoukro", population: 212000, isCapital: true }, { name: "Abidjan", population: 3677000 }],
    "DJ": [{ name: "Djibouti", population: 475000, isCapital: true }],
    "GQ": [{ name: "Malabo", population: 297000, isCapital: true }],
    "ER": [{ name: "Asmara", population: 963000, isCapital: true }],
    "SZ": [{ name: "Mbabane", population: 94000, isCapital: true }],
    "ET": [{ name: "Addis Ababa", population: 3041000, isCapital: true }],
    "GA": [{ name: "Libreville", population: 703000, isCapital: true }],
    "GM": [{ name: "Banjul", population: 31000, isCapital: true }],
    "GH": [{ name: "Accra", population: 227000, isCapital: true }],
    "GN": [{ name: "Conakry", population: 1667000, isCapital: true }],
    "GW": [{ name: "Bissau", population: 492000, isCapital: true }],
    "LS": [{ name: "Maseru", population: 330000, isCapital: true }],
    "LR": [{ name: "Monrovia", population: 1010000, isCapital: true }],
    "LY": [{ name: "Tripoli", population: 1126000, isCapital: true }],
    "MG": [{ name: "Antananarivo", population: 1275000, isCapital: true }],
    "MW": [{ name: "Lilongwe", population: 989000, isCapital: true }],
    "ML": [{ name: "Bamako", population: 1809000, isCapital: true }],
    "MR": [{ name: "Nouakchott", population: 958000, isCapital: true }],
    "MU": [{ name: "Port Louis", population: 149000, isCapital: true }],
    "MZ": [{ name: "Maputo", population: 1766000, isCapital: true }],
    "NA": [{ name: "Windhoek", population: 325000, isCapital: true }],
    "NE": [{ name: "Niamey", population: 978000, isCapital: true }],
    "RW": [{ name: "Kigali", population: 859000, isCapital: true }],
    "ST": [{ name: "São Tomé", population: 71000, isCapital: true }],
    "SN": [{ name: "Dakar", population: 1146000, isCapital: true }],
    "SC": [{ name: "Victoria", population: 26000, isCapital: true }],
    "SL": [{ name: "Freetown", population: 1055000, isCapital: true }],
    "SO": [{ name: "Mogadishu", population: 2120000, isCapital: true }],
    "SS": [{ name: "Juba", population: 525000, isCapital: true }],
    "SD": [{ name: "Khartoum", population: 639000, isCapital: true }],
    "TZ": [{ name: "Dodoma", population: 410000, isCapital: true }, { name: "Dar es Salaam", population: 4364000 }],
    "TG": [{ name: "Lomé", population: 837000, isCapital: true }],
    "TN": [{ name: "Tunis", population: 638000, isCapital: true }],
    "UG": [{ name: "Kampala", population: 1507000, isCapital: true }],
    "ZM": [{ name: "Lusaka", population: 1742000, isCapital: true }],
    "ZW": [{ name: "Harare", population: 1606000, isCapital: true }],

    // --- REST OF OCEANIA ---
    "FM": [{ name: "Palikir", population: 7000, isCapital: true }], // Micronesia
    "KI": [{ name: "South Tarawa", population: 50000, isCapital: true }],
    "MH": [{ name: "Majuro", population: 30000, isCapital: true }],
    "NR": [{ name: "Yaren", population: 747, isCapital: true }],
    "PW": [{ name: "Ngerulmud", population: 271, isCapital: true }, { name: "Koror", population: 11000 }],
    "PG": [{ name: "Port Moresby", population: 364000, isCapital: true }],
    "WS": [{ name: "Apia", population: 36000, isCapital: true }],
    "SB": [{ name: "Honiara", population: 84000, isCapital: true }],
    "TO": [{ name: "Nukuʻalofa", population: 24000, isCapital: true }],
    "TV": [{ name: "Funafuti", population: 6000, isCapital: true }],
    "VU": [{ name: "Port Vila", population: 44000, isCapital: true }]
};

// Helper: Get cities for a country code (fallback to empty or capital)
export const getCitiesForCountry = (countryCode: string): City[] => {
    return citiesByCountry[countryCode] || [];
};
