import { RichCountryInfo } from "@/types/country";

// Helper to define common plug types
const PLUGS = {
    A: { type: "A (US/Japan)" },
    B: { type: "B (US Grounded)" },
    C: { type: "C (Euro)" },
    D: { type: "D (India)" },
    E: { type: "E (France)" },
    F: { type: "F (Germany)" },
    G: { type: "G (UK)" },
    I: { type: "I (Aus/NZ)" },
    J: { type: "J (Swiss)" },
    L: { type: "L (Italy)" },
    M: { type: "M (South Africa)" },
    N: { type: "N (Brazil)" },
};

export const RICH_COUNTRIES_DB: Record<string, RichCountryInfo> = {
    // --- NORTH AMERICA ---
    "US": {
        description: "A tapestry of diverse landscapes, from the bustling streets of NYC to the vast Grand Canyon. A cultural powerhouse offering everything from Hollywood glamour to deep-south jazz.",
        knownFor: ["Hollywood", "Tech Innovation", "National Parks", "Fast Food"],
        majorReligion: "Christianity",
        dialCode: "+1",
        mobileOperators: ["Verizon", "T-Mobile", "AT&T"],
        plugs: [PLUGS.A, PLUGS.B],
        voltage: "120V",
        publicHolidays: [
            { date: "Jul 4", name: "Independence Day" },
            { date: "Nov 23", name: "Thanksgiving" },
            { date: "Dec 25", name: "Christmas" }
        ],
        mainAirports: [{ code: "JFK", name: "John F. Kennedy" }, { code: "LAX", name: "Los Angeles Intl" }],
        climate: { text: "Extremely diverse. Tropical in FL, Arctic in AK, arid in SW.", bestTime: "Spring/Fall", seasonEmojis: "🌸🍂" },
        emergency: { police: "911", ambulance: "911", fire: "911" },
        alcohol: { drinkingAge: 21, purchaseAge: 21 },
        waterRating: "Safe",
        vaccinations: "Routine"
    },
    "CA": {
        description: "Second largest country by area, known for its polite locals, maple syrup, and stunning wilderness ranging from the Rockies to Niagara Falls.",
        knownFor: ["Rocky Mountains", "Maple Syrup", "Ice Hockey", "Niagara Falls"],
        majorReligion: "Christianity",
        dialCode: "+1",
        mobileOperators: ["Rogers", "Bell", "Telus"],
        plugs: [PLUGS.A, PLUGS.B],
        voltage: "120V",
        publicHolidays: [
            { date: "Jul 1", name: "Canada Day" },
            { date: "Oct 9", name: "Thanksgiving" }
        ],
        mainAirports: [{ code: "YYZ", name: "Toronto Pearson" }, { code: "YVR", name: "Vancouver Intl" }],
        climate: { text: "Cold winters with snow; warm, humid summers in the south.", bestTime: "Jun-Sep", seasonEmojis: "☀️🍁" },
        emergency: { police: "911", ambulance: "911", fire: "911" },
        alcohol: { drinkingAge: 19, purchaseAge: 19 },
        waterRating: "Safe",
        vaccinations: "Routine"
    },
    "MX": {
        description: "A land of color and contrast, boasting ancient Mayan ruins, colonial cities, spicy cuisine, and world-class beaches.",
        knownFor: ["Tacos", "Aztec Ruins", "Day of the Dead", "Beaches"],
        majorReligion: "Christianity (Catholic)",
        dialCode: "+52",
        mobileOperators: ["Telcel", "Movistar", "AT&T Mexico"],
        plugs: [PLUGS.A, PLUGS.B],
        voltage: "127V",
        publicHolidays: [
            { date: "Sep 16", name: "Independence Day" },
            { date: "Nov 20", name: "Revolution Day" }
        ],
        mainAirports: [{ code: "MEX", name: "Benito Juárez" }, { code: "CUN", name: "Cancún Intl" }],
        climate: { text: "Tropical to desert. Hot coastal areas, milder highlands.", bestTime: "Dec-Apr", seasonEmojis: "☀️🌵" },
        emergency: { police: "911", ambulance: "911", fire: "911" },
        alcohol: { drinkingAge: 18, purchaseAge: 18 },
        waterRating: "Use Bottled Water",
        vaccinations: "Hep A, Typhoid"
    },

    // --- EUROPE ---
    "GB": {
        description: "The birthplace of Shakespeare and the Beatles. A blend of historic traditions, rolling countryside, and the cosmopolitan energy of London.",
        knownFor: ["Royal Family", "The Beatles", "Tea", "History"],
        majorReligion: "Christianity",
        dialCode: "+44",
        mobileOperators: ["EE", "O2", "Vodafone", "Three"],
        plugs: [PLUGS.G],
        voltage: "230V",
        publicHolidays: [
            { date: "Dec 25", name: "Christmas" },
            { date: "Dec 26", name: "Boxing Day" }
        ],
        mainAirports: [{ code: "LHR", name: "Heathrow" }, { code: "LGW", name: "Gatwick" }],
        climate: { text: "Temperate maritime. Mild winters and cool summers. Rain is frequent.", bestTime: "May-Sep", seasonEmojis: "☔️⛅️" },
        emergency: { police: "999", ambulance: "999", fire: "999" },
        alcohol: { drinkingAge: 18, purchaseAge: 18 },
        waterRating: "Safe",
        vaccinations: "Routine"
    },
    "FR": {
        description: "The global capital of art, fashion, and gastronomy. From the Eiffel Tower to the lavender fields of Provence, it defines romance.",
        knownFor: ["Eiffel Tower", "Wine", "Fashion", "Cuisine"],
        majorReligion: "Christianity (Catholic)",
        dialCode: "+33",
        mobileOperators: ["Orange", "SFR", "Bouygues"],
        plugs: [PLUGS.C, PLUGS.E],
        voltage: "230V",
        publicHolidays: [
            { date: "Jul 14", name: "Bastille Day" },
            { date: "May 1", name: "Labor Day" }
        ],
        mainAirports: [{ code: "CDG", name: "Charles de Gaulle" }, { code: "ORY", name: "Orly" }],
        climate: { text: "Generally mild. Mediterranean in the south, oceanic in the west.", bestTime: "Apr-Jun, Sep-Nov", seasonEmojis: "🍷☀️" },
        emergency: { police: "112", ambulance: "15", fire: "18" },
        alcohol: { drinkingAge: 18, purchaseAge: 18 },
        waterRating: "Safe",
        vaccinations: "Routine"
    },
    "DE": {
        description: "An economic powerhouse known for precision engineering, historic castles, hearty food, and the spirited Oktoberfest.",
        knownFor: ["Cars", "Oktoberfest", "Castles", "Beer"],
        majorReligion: "Christianity",
        dialCode: "+49",
        mobileOperators: ["Telekom", "Vodafone", "O2"],
        plugs: [PLUGS.C, PLUGS.F],
        voltage: "230V",
        publicHolidays: [
            { date: "Oct 3", name: "Unity Day" },
            { date: "Dec 25", name: "Christmas" }
        ],
        mainAirports: [{ code: "FRA", name: "Frankfurt" }, { code: "MUC", name: "Munich" }],
        climate: { text: "Temperate seasonal. Cold, cloudy winters and warm summers.", bestTime: "May-Sep", seasonEmojis: "🍺⛅️" },
        emergency: { police: "110", ambulance: "112", fire: "112" },
        alcohol: { drinkingAge: 16, purchaseAge: 16 },
        waterRating: "Safe",
        vaccinations: "Routine"
    },
    "IT": {
        description: "Home to the Roman Empire and the Renaissance. Italy dazzles with its art, architecture, coastlines, and unrivaled cuisine.",
        knownFor: ["Pasta/Pizza", "Roman History", "Fashion", "Art"],
        majorReligion: "Christianity (Catholic)",
        dialCode: "+39",
        mobileOperators: ["TIM", "Vodafone", "WindTre"],
        plugs: [PLUGS.C, PLUGS.F, PLUGS.L],
        voltage: "230V",
        publicHolidays: [
            { date: "Apr 25", name: "Liberation Day" },
            { date: "Aug 15", name: "Ferragosto" }
        ],
        mainAirports: [{ code: "FCO", name: "Fiumicino" }, { code: "MXP", name: "Malpensa" }],
        climate: { text: "Mediterranean. Hot, dry summers and mild, wet winters.", bestTime: "May-Jun, Sep-Oct", seasonEmojis: "🍕☀️" },
        emergency: { police: "112", ambulance: "118", fire: "115" },
        alcohol: { drinkingAge: 18, purchaseAge: 18 },
        waterRating: "Safe",
        vaccinations: "Routine"
    },
    "ES": {
        description: "A passionate nation of fiestas, flamenco, and tapas. Combines Moorish history with modern vibrancy and stunning beaches.",
        knownFor: ["Flamenco", "Beaches", "Paella", "Architecture"],
        majorReligion: "Christianity (Catholic)",
        dialCode: "+34",
        mobileOperators: ["Movistar", "Vodafone", "Orange"],
        plugs: [PLUGS.C, PLUGS.F],
        voltage: "230V",
        publicHolidays: [
            { date: "Oct 12", name: "National Day" },
            { date: "Dec 6", name: "Constitution Day" }
        ],
        mainAirports: [{ code: "MAD", name: "Barajas" }, { code: "BCN", name: "El Prat" }],
        climate: { text: "Mediterranean. Hot summers, mild winters.", bestTime: "May-Jun, Sep-Oct", seasonEmojis: "🥘☀️" },
        emergency: { police: "112", ambulance: "061", fire: "080" },
        alcohol: { drinkingAge: 18, purchaseAge: 18 },
        waterRating: "Safe",
        vaccinations: "Routine"
    },
    "AL": {
        description: "A hidden gem in the Balkans with pristine beaches along the Albanian Riviera, rugged mountains, and a unique history.",
        knownFor: ["Riviera Beaches", "Bunkers", "Hospitality", "Mountains"],
        majorReligion: "Islam / Christianity",
        dialCode: "+355",
        mobileOperators: ["Vodafone", "One"],
        plugs: [PLUGS.C, PLUGS.F],
        voltage: "230V",
        publicHolidays: [
            { date: "Nov 28", name: "Flag Day" },
            { date: "Nov 29", name: "Liberation Day" }
        ],
        mainAirports: [{ code: "TIA", name: "Tirana Intl" }],
        climate: { text: "Mediterranean coastal, continental interior. Hot summers, wet winters.", bestTime: "May-Sep", seasonEmojis: "🏖️⛰️" },
        emergency: { police: "129", ambulance: "127", fire: "128" },
        alcohol: { drinkingAge: 18, purchaseAge: 18 },
        waterRating: "Bottled Recommended",
        vaccinations: "Routine"
    },
    "XK": {
        description: "Europe's youngest country, characterized by its vibrant cafe culture, stunning mountain ranges, and warm, welcoming people.",
        knownFor: ["Coffee Culture", "Young Population", "Mountains", "History"],
        majorReligion: "Islam / Christianity",
        dialCode: "+383",
        mobileOperators: ["Vala", "IPKO"],
        plugs: [PLUGS.C, PLUGS.F],
        voltage: "230V",
        publicHolidays: [{ date: "Feb 17", name: "Independence Day" }],
        mainAirports: [{ code: "PRN", name: "Pristina Intl" }],
        climate: { text: "Continental. Warm summers and cold, snowy winters.", bestTime: "May-Sep", seasonEmojis: "☕️❄️" },
        emergency: { police: "192", ambulance: "194", fire: "193" },
        alcohol: { drinkingAge: 18, purchaseAge: 18 },
        waterRating: "Bottled Recommended",
        vaccinations: "Routine"
    },

    // --- ASIA ---
    "JP": {
        description: "A seamless blend of ancient tradition and futuristic technology. Temples co-exist with neon skyscrapers and bullet trains.",
        knownFor: ["Anime/Manga", "Sushi", "Technology", "Temples"],
        majorReligion: "Shinto / Buddhism",
        dialCode: "+81",
        mobileOperators: ["NTT Docomo", "au", "SoftBank"],
        plugs: [PLUGS.A, PLUGS.B],
        voltage: "100V",
        publicHolidays: [
            { date: "Jan 1", name: "New Year" },
            { date: "Feb 11", name: "Foundation Day" }
        ],
        mainAirports: [{ code: "HND", name: "Haneda" }, { code: "NRT", name: "Narita" }],
        climate: { text: "Temperate. Hot, humid summers and cold winters with snow in the north.", bestTime: "Mar-May, Oct-Nov", seasonEmojis: "🌸🍁" },
        emergency: { police: "110", ambulance: "119", fire: "119" },
        alcohol: { drinkingAge: 20, purchaseAge: 20 },
        waterRating: "Safe",
        vaccinations: "Routine"
    },
    "CN": {
        description: "One of the world's oldest civilizations, featuring the Great Wall, Forbidden City, and hyper-modern cities like Shanghai.",
        knownFor: ["Great Wall", "Pandas", "Tea", "History"],
        majorReligion: "Atheist / Buddhism",
        dialCode: "+86",
        mobileOperators: ["China Mobile", "China Unicom"],
        plugs: [PLUGS.A, PLUGS.C, PLUGS.I],
        voltage: "220V",
        publicHolidays: [
            { date: "Oct 1", name: "National Day" },
            { date: "Feb (Lunar)", name: "New Year" }
        ],
        mainAirports: [{ code: "PEK", name: "Beijing Capital" }, { code: "PVG", name: "Shanghai Pudong" }],
        climate: { text: "Diverse. Tropical south to subarctic north.", bestTime: "Apr-May, Sep-Oct", seasonEmojis: "🏮🎋" },
        emergency: { police: "110", ambulance: "120", fire: "119" },
        alcohol: { drinkingAge: 18, purchaseAge: 18 },
        waterRating: "Use Bottled Water",
        vaccinations: "Hep A, Typhoid"
    },
    "IN": {
        description: "A sensory explosion of colors, spices, and spirituality. Home to the Taj Mahal, bustling bazaars, and diverse landscapes.",
        knownFor: ["Taj Mahal", "Curry", "Bollywood", "Yoga"],
        majorReligion: "Hinduism",
        dialCode: "+91",
        mobileOperators: ["Jio", "Airtel", "Vi"],
        plugs: [PLUGS.C, PLUGS.D, PLUGS.M],
        voltage: "230V",
        publicHolidays: [
            { date: "Aug 15", name: "Independence Day" },
            { date: "Jan 26", name: "Republic Day" }
        ],
        mainAirports: [{ code: "DEL", name: "Delhi" }, { code: "BOM", name: "Mumbai" }],
        climate: { text: "Tropical monsoon. Hot summers, wet monsoons.", bestTime: "Oct-Mar", seasonEmojis: "🍛🕉️" },
        emergency: { police: "100", ambulance: "102", fire: "101" },
        alcohol: { drinkingAge: 18, purchaseAge: 18 },
        waterRating: "Unsafe (Bottled Only)",
        vaccinations: "Hep A, Typhoid, Malaria"
    },
    "TH": {
        description: "The land of smiles, famous for its tropical beaches, opulent royal palaces, ancient ruins, and ornate temples.",
        knownFor: ["Street Food", "Beaches", "Temples", "Smiles"],
        majorReligion: "Buddhism",
        dialCode: "+66",
        mobileOperators: ["AIS", "TrueMove H", "dtac"],
        plugs: [PLUGS.A, PLUGS.B, PLUGS.C],
        voltage: "220V",
        publicHolidays: [
            { date: "Apr 13", name: "Songkran" },
            { date: "Dec 5", name: "Father's Day" }
        ],
        mainAirports: [{ code: "BKK", name: "Suvarnabhumi" }, { code: "DMK", name: "Don Mueang" }],
        climate: { text: "Tropical wet and dry. Hot all year.", bestTime: "Nov-Feb", seasonEmojis: "🐘🍜" },
        emergency: { police: "191", ambulance: "1669", fire: "199" },
        alcohol: { drinkingAge: 20, purchaseAge: 20 },
        waterRating: "Use Bottled Water",
        vaccinations: "Hep A, Typhoid"
    },
    "ID": {
        description: "An archipelago of thousands of islands, with Bali being the crown jewel. Offers volcanoes, jungles, and rich cultural heritage.",
        knownFor: ["Bali", "Volcanoes", "Komodo Dragons", "Coffee"],
        majorReligion: "Islam (Hindu in Bali)",
        dialCode: "+62",
        mobileOperators: ["Telkomsel", "Indosat", "XL"],
        plugs: [PLUGS.C, PLUGS.F],
        voltage: "230V",
        publicHolidays: [
            { date: "Aug 17", name: "Independence Day" }
        ],
        mainAirports: [{ code: "CGK", name: "Jakarta" }, { code: "DPS", name: "Bali Ngurah Rai" }],
        climate: { text: "Tropical rainforest. Hot and humid.", bestTime: "May-Sep", seasonEmojis: "🌋🌴" },
        emergency: { police: "110", ambulance: "118", fire: "113" },
        alcohol: { drinkingAge: 21, purchaseAge: 21 },
        waterRating: "Use Bottled Water",
        vaccinations: "Hep A, Typhoid"
    },

    // --- OCEANIA ---
    "AU": {
        description: "A continent-country with unique wildlife like kangaroos, the vast Outback, and the iconic Sydney Opera House and Great Barrier Reef.",
        knownFor: ["Kangaroos", "Outback", "Surfing", "Great Barrier Reef"],
        majorReligion: "Christianity",
        dialCode: "+61",
        mobileOperators: ["Telstra", "Optus", "Vodafone"],
        plugs: [PLUGS.I],
        voltage: "230V",
        publicHolidays: [
            { date: "Jan 26", name: "Australia Day" },
            { date: "Apr 25", name: "Anzac Day" }
        ],
        mainAirports: [{ code: "SYD", name: "Sydney" }, { code: "MEL", name: "Melbourne" }],
        climate: { text: "Arid to semi-arid interior, temperate south, tropical north.", bestTime: "Sep-Nov, Mar-May", seasonEmojis: "🦘🐨" },
        emergency: { police: "000", ambulance: "000", fire: "000" },
        alcohol: { drinkingAge: 18, purchaseAge: 18 },
        waterRating: "Safe",
        vaccinations: "Routine"
    },

    // --- LATIN AMERICA ---
    "BR": {
        description: "Largest country in South America, famous for the Amazon Rainforest, Rio's Carnival, and a vibrant football culture.",
        knownFor: ["Amazon Rainforest", "Carnival", "Football", "Beaches"],
        majorReligion: "Christianity (Catholic)",
        dialCode: "+55",
        mobileOperators: ["Vivo", "Claro", "TIM"],
        plugs: [PLUGS.N, PLUGS.C],
        voltage: "127V/220V",
        publicHolidays: [
            { date: "Sep 7", name: "Independence Day" },
            { date: "Nov 15", name: "Republic Day" }
        ],
        mainAirports: [{ code: "GRU", name: "São Paulo" }, { code: "GIG", name: "Rio de Janeiro" }],
        climate: { text: "Mostly tropical. Humid and warm.", bestTime: "Apr-Jun, Aug-Oct", seasonEmojis: "🇧🇷⚽" },
        emergency: { police: "190", ambulance: "192", fire: "193" },
        alcohol: { drinkingAge: 18, purchaseAge: 18 },
        waterRating: "Use Bottled Water",
        vaccinations: "Yellow Fever, Hep A"
    },

    // --- MIDDLE EAST ---
    "AE": {
        description: "A federation of seven emirates, known for luxury shopping, ultramodern architecture like the Burj Khalifa, and vast deserts.",
        knownFor: ["Dubai", "Burj Khalifa", "Luxury", "Desert"],
        majorReligion: "Islam",
        dialCode: "+971",
        mobileOperators: ["Etisalat", "Du"],
        plugs: [PLUGS.G],
        voltage: "230V",
        publicHolidays: [
            { date: "Dec 2", name: "National Day" }
        ],
        mainAirports: [{ code: "DXB", name: "Dubai Intl" }, { code: "AUH", name: "Abu Dhabi" }],
        climate: { text: "Desert climate. Extremely hot summers, mild winters.", bestTime: "Nov-Mar", seasonEmojis: "🐪🏙️" },
        emergency: { police: "999", ambulance: "998", fire: "997" },
        alcohol: { drinkingAge: 21, purchaseAge: 21 },
        waterRating: "Safe (Desalinated)",
        vaccinations: "Routine"
    },
};
