// Popular travel destinations for 2024/2025
// Based on travel trends and visitor statistics

export interface PopularDestination {
    id: string;
    cityName: string;
    countryCode: string;
    countryName: string;
    image: string; // emoji or URL
    description: string;
    highlights: string[];
    visitorRank: number;
    bestMonth: string;
    averageCost: string; // $ to $$$$
    visitorCount?: string; // e.g. "19.5M"
}

// Updated for 2026 — blend of perennial favorites and this year's fastest-rising picks
// (Booking 2026 Trending, Skyscanner Travel Trends, Condé Nast Hot List, NatGeo Best of the World).
export const popularDestinations: PopularDestination[] = [
    {
        id: "tokyo",
        cityName: "Tokyo",
        countryCode: "JP",
        countryName: "Japan",
        image: "🗾",
        description: "Where neon-lit futurism meets centuries-old ritual — 2026's #1 trending capital.",
        highlights: ["Shibuya Sky", "teamLab Planets", "Toyosu Sushi", "Yanaka backstreets"],
        visitorRank: 1,
        bestMonth: "March-May",
        averageCost: "$$$",
        visitorCount: "26.9M"
    },
    {
        id: "seoul",
        cityName: "Seoul",
        countryCode: "KR",
        countryName: "South Korea",
        image: "🏯",
        description: "K-culture, hanok cafés, and design districts driving record 2026 arrivals.",
        highlights: ["Bukchon Hanok", "Seongsu cafés", "Han River picnic", "Late-night BBQ"],
        visitorRank: 2,
        bestMonth: "April-June",
        averageCost: "$$",
        visitorCount: "17.4M"
    },
    {
        id: "lisbon",
        cityName: "Lisbon",
        countryCode: "PT",
        countryName: "Portugal",
        image: "🚋",
        description: "Sun-washed tiles, fado nights, and Europe's most loved value city break.",
        highlights: ["Alfama", "LX Factory", "Time Out Market", "Sintra day-trip"],
        visitorRank: 3,
        bestMonth: "April-June",
        averageCost: "$$",
        visitorCount: "8.6M"
    },
    {
        id: "mexicocity",
        cityName: "Mexico City",
        countryCode: "MX",
        countryName: "Mexico",
        image: "🌮",
        description: "Roma, Condesa & Polanco — the food, art and nightlife capital of the Americas.",
        highlights: ["Pujol", "Frida Kahlo Museum", "Xochimilco", "Lucha libre"],
        visitorRank: 4,
        bestMonth: "Nov-April",
        averageCost: "$$",
        visitorCount: "14.5M"
    },
    {
        id: "bangkok",
        cityName: "Bangkok",
        countryCode: "TH",
        countryName: "Thailand",
        image: "🛕",
        description: "Street food, rooftop bars, and golden temples — Asia's most-visited city.",
        highlights: ["Grand Palace", "Wat Arun", "Chatuchak Market", "Sukhumvit nightlife"],
        visitorRank: 5,
        bestMonth: "Nov-Feb",
        averageCost: "$",
        visitorCount: "32.4M"
    },
    {
        id: "osaka",
        cityName: "Osaka",
        countryCode: "JP",
        countryName: "Japan",
        image: "🍜",
        description: "Japan's kitchen — okonomiyaki, takoyaki, and the gateway to Kyoto & Nara.",
        highlights: ["Dotonbori", "Osaka Castle", "Kuromon Market", "Universal Studios"],
        visitorRank: 6,
        bestMonth: "March-May",
        averageCost: "$$",
        visitorCount: "10.1M"
    },
    {
        id: "istanbul",
        cityName: "Istanbul",
        countryCode: "TR",
        countryName: "Turkey",
        image: "🕌",
        description: "Two continents, one skyline — the bridge between Europe and Asia.",
        highlights: ["Hagia Sophia", "Blue Mosque", "Grand Bazaar", "Bosphorus ferry"],
        visitorRank: 7,
        bestMonth: "April-May",
        averageCost: "$$",
        visitorCount: "20.2M"
    },
    {
        id: "marrakech",
        cityName: "Marrakech",
        countryCode: "MA",
        countryName: "Morocco",
        image: "🕋",
        description: "Riads, souks, and Atlas Mountains — fastest-rising African city break of 2026.",
        highlights: ["Jemaa el-Fnaa", "Majorelle Garden", "Atlas day-trip", "Hammam"],
        visitorRank: 8,
        bestMonth: "March-May",
        averageCost: "$$",
        visitorCount: "3.5M"
    },
    {
        id: "paris",
        cityName: "Paris",
        countryCode: "FR",
        countryName: "France",
        image: "🗼",
        description: "Post-Olympics renaissance — cleaner Seine, new museums, eternal romance.",
        highlights: ["Eiffel Tower", "Louvre", "Le Marais", "Seine swimming"],
        visitorRank: 9,
        bestMonth: "April-June",
        averageCost: "$$$",
        visitorCount: "19.5M"
    },
    {
        id: "hanoi",
        cityName: "Hanoi",
        countryCode: "VN",
        countryName: "Vietnam",
        image: "🍲",
        description: "Old Quarter chaos, egg coffee, and the launchpad to Ha Long Bay.",
        highlights: ["Old Quarter", "Train Street", "Ha Long Bay", "Bun cha"],
        visitorRank: 10,
        bestMonth: "Oct-April",
        averageCost: "$",
        visitorCount: "6.2M"
    },
    {
        id: "newyork",
        cityName: "New York City",
        countryCode: "US",
        countryName: "United States",
        image: "🗽",
        description: "The city that never sleeps — culture, arts, and endless energy.",
        highlights: ["Central Park", "MoMA", "Brooklyn pizza", "Broadway"],
        visitorRank: 11,
        bestMonth: "April-June",
        averageCost: "$$$$",
        visitorCount: "13.5M"
    },
    {
        id: "barcelona",
        cityName: "Barcelona",
        countryCode: "ES",
        countryName: "Spain",
        image: "⛪",
        description: "Mediterranean gem with Gaudí architecture and beach vibes.",
        highlights: ["Sagrada Família", "Park Güell", "El Born", "Tapas crawl"],
        visitorRank: 12,
        bestMonth: "May-June",
        averageCost: "$$$",
        visitorCount: "15.6M"
    },
    {
        id: "cdmx-extra",
        cityName: "Bali (Denpasar)",
        countryCode: "ID",
        countryName: "Indonesia",
        image: "🌴",
        description: "Tropical paradise — rice terraces, surf breaks, and digital-nomad hubs.",
        highlights: ["Ubud", "Uluwatu", "Canggu cafés", "Tanah Lot sunset"],
        visitorRank: 13,
        bestMonth: "April-Oct",
        averageCost: "$$",
        visitorCount: "6.3M"
    },
];

// Helper to parse "19.5M", "20M", etc.
const parseVisitorCount = (countStr?: string): number => {
    if (!countStr) return 0;
    const clean = countStr.replace(/[^0-9.]/g, '');
    const num = parseFloat(clean);
    if (countStr.toUpperCase().includes('M')) return num * 1000000;
    if (countStr.toUpperCase().includes('K')) return num * 1000;
    return num;
};

// Get destinations sorted by visitor numbers (highest first)
export const getTopDestinations = (count = 6): PopularDestination[] => {
    return [...popularDestinations]
        .sort((a, b) => parseVisitorCount(b.visitorCount) - parseVisitorCount(a.visitorCount))
        .slice(0, count);
};

// Get destinations by country code
export const getDestinationsByCountry = (countryCode: string): PopularDestination[] => {
    return popularDestinations.filter(d => d.countryCode === countryCode);
};
