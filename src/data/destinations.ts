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
}

export const popularDestinations: PopularDestination[] = [
    {
        id: "paris",
        cityName: "Paris",
        countryCode: "FR",
        countryName: "France",
        image: "🗼",
        description: "The City of Light, famous for art, fashion, and gastronomy",
        highlights: ["Eiffel Tower", "Louvre Museum", "Notre-Dame", "Champs-Élysées"],
        visitorRank: 1,
        bestMonth: "April-June",
        averageCost: "$$$",
    },
    {
        id: "dubai",
        cityName: "Dubai",
        countryCode: "AE",
        countryName: "United Arab Emirates",
        image: "🏙️",
        description: "Ultra-modern city with luxury shopping and futuristic architecture",
        highlights: ["Burj Khalifa", "Palm Jumeirah", "Dubai Mall", "Desert Safari"],
        visitorRank: 2,
        bestMonth: "Nov-March",
        averageCost: "$$$$",
    },
    {
        id: "tokyo",
        cityName: "Tokyo",
        countryCode: "JP",
        countryName: "Japan",
        image: "🗾",
        description: "Where ancient tradition meets cutting-edge technology",
        highlights: ["Shibuya Crossing", "Senso-ji Temple", "Mount Fuji", "Akihabara"],
        visitorRank: 3,
        bestMonth: "March-May",
        averageCost: "$$$",
    },
    {
        id: "istanbul",
        cityName: "Istanbul",
        countryCode: "TR",
        countryName: "Turkey",
        image: "🕌",
        description: "Gateway between Europe and Asia with rich Ottoman heritage",
        highlights: ["Hagia Sophia", "Blue Mosque", "Grand Bazaar", "Bosphorus"],
        visitorRank: 4,
        bestMonth: "April-May",
        averageCost: "$$",
    },
    {
        id: "london",
        cityName: "London",
        countryCode: "GB",
        countryName: "United Kingdom",
        image: "🎡",
        description: "Historic capital blending tradition with modern culture",
        highlights: ["Big Ben", "Tower Bridge", "British Museum", "West End"],
        visitorRank: 5,
        bestMonth: "May-Sept",
        averageCost: "$$$$",
    },
    {
        id: "singapore",
        cityName: "Singapore",
        countryCode: "SG",
        countryName: "Singapore",
        image: "🦁",
        description: "Garden city with stunning architecture and diverse cuisine",
        highlights: ["Marina Bay Sands", "Gardens by the Bay", "Sentosa", "Hawker Centers"],
        visitorRank: 6,
        bestMonth: "Feb-April",
        averageCost: "$$$",
    },
    {
        id: "bangkok",
        cityName: "Bangkok",
        countryCode: "TH",
        countryName: "Thailand",
        image: "🛕",
        description: "Vibrant street life, ornate temples, and legendary cuisine",
        highlights: ["Grand Palace", "Wat Phra Kaew", "Chatuchak Market", "Street Food"],
        visitorRank: 7,
        bestMonth: "Nov-Feb",
        averageCost: "$",
    },
    {
        id: "barcelona",
        cityName: "Barcelona",
        countryCode: "ES",
        countryName: "Spain",
        image: "⛪",
        description: "Mediterranean gem with Gaudí architecture and beach vibes",
        highlights: ["Sagrada Família", "Park Güell", "La Rambla", "Gothic Quarter"],
        visitorRank: 8,
        bestMonth: "May-June",
        averageCost: "$$$",
    },
    {
        id: "newyork",
        cityName: "New York",
        countryCode: "US",
        countryName: "United States",
        image: "🗽",
        description: "The city that never sleeps - culture, arts, and endless energy",
        highlights: ["Statue of Liberty", "Central Park", "Times Square", "Broadway"],
        visitorRank: 9,
        bestMonth: "April-June",
        averageCost: "$$$$",
    },
    {
        id: "rome",
        cityName: "Rome",
        countryCode: "IT",
        countryName: "Italy",
        image: "🏛️",
        description: "Eternal city with ancient ruins and world-class cuisine",
        highlights: ["Colosseum", "Vatican City", "Trevi Fountain", "Pantheon"],
        visitorRank: 10,
        bestMonth: "April-May",
        averageCost: "$$$",
    },
    {
        id: "bali",
        cityName: "Bali",
        countryCode: "ID",
        countryName: "Indonesia",
        image: "🌴",
        description: "Tropical paradise with temples, rice terraces, and beaches",
        highlights: ["Ubud Rice Terraces", "Tanah Lot", "Uluwatu Temple", "Seminyak Beach"],
        visitorRank: 11,
        bestMonth: "April-Oct",
        averageCost: "$$",
    },
    {
        id: "amsterdam",
        cityName: "Amsterdam",
        countryCode: "NL",
        countryName: "Netherlands",
        image: "🚲",
        description: "Canal-laced city famous for art, cycling, and liberal culture",
        highlights: ["Anne Frank House", "Van Gogh Museum", "Canal Cruise", "Jordaan"],
        visitorRank: 12,
        bestMonth: "April-May",
        averageCost: "$$$",
    },
];

// Get destinations sorted by popularity
export const getTopDestinations = (count = 6): PopularDestination[] => {
    return [...popularDestinations]
        .sort((a, b) => a.visitorRank - b.visitorRank)
        .slice(0, count);
};

// Get destinations by country code
export const getDestinationsByCountry = (countryCode: string): PopularDestination[] => {
    return popularDestinations.filter(d => d.countryCode === countryCode);
};
