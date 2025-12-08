import { useRef, useEffect, useState } from "react";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import * as topojson from 'topojson-client';
import { countries } from '@/data/countries';
import { getVisaRequirementFromMatrix } from '@/data/visaMatrix';
import { VISA_SUBSTITUTIONS, getVisaPowerGroups } from '@/data/visaSubstitutions';
import { MapPin, CreditCard, ZoomIn, ZoomOut } from 'lucide-react';
import worldData from '@/data/world-110m.json';

// Set Mapbox Token
mapboxgl.accessToken = 'pk.eyJ1Ijoicm9iZ2FzaGkiLCJhIjoiY21pd2E4cWd4MHN3eDNjc2Izc2xodHdqMSJ9.c-oiis0Y-BfqI6Pr4BENiQ';

interface GlobeMapProps {
    visitedCountries: string[];
    toggleVisited?: (code: string) => void;
    userPassportCode?: string;
    heldVisas?: string[];
    onCountryClick?: (code: string) => void;
}

// Numeric ID to ISO2 mapping (Reused from previous implementation)
const numericToIso2: Record<string, string> = {
    "8": "AL", "20": "AD", "40": "AT", "112": "BY", "56": "BE", "70": "BA", "100": "BG",
    "191": "HR", "196": "CY", "203": "CZ", "208": "DK", "233": "EE", "246": "FI", "250": "FR",
    "276": "DE", "300": "GR", "348": "HU", "352": "IS", "372": "IE", "380": "IT", "428": "LV",
    "438": "LI", "440": "LT", "442": "LU", "807": "MK", "470": "MT", "498": "MD", "492": "MC",
    "499": "ME", "528": "NL", "578": "NO", "616": "PL", "620": "PT", "642": "RO", "643": "RU",
    "674": "SM", "688": "RS", "703": "SK", "705": "SI", "724": "ES", "752": "SE", "756": "CH",
    "792": "TR", "804": "UA", "826": "GB", "336": "VA",
    "28": "AG", "32": "AR", "44": "BS", "52": "BB", "84": "BZ", "68": "BO", "76": "BR",
    "124": "CA", "152": "CL", "170": "CO", "188": "CR", "192": "CU", "212": "DM", "214": "DO",
    "218": "EC", "222": "SV", "308": "GD", "320": "GT", "328": "GY", "332": "HT", "340": "HN",
    "388": "JM", "484": "MX", "558": "NI", "591": "PA", "600": "PY", "604": "PE", "630": "PR",
    "662": "LC", "670": "VC", "740": "SR", "780": "TT", "840": "US", "858": "UY", "862": "VE",
    "4": "AF", "51": "AM", "31": "AZ", "48": "BH", "50": "BD", "64": "BT", "96": "BN",
    "116": "KH", "156": "CN", "268": "GE", "344": "HK", "356": "IN", "360": "ID", "364": "IR",
    "368": "IQ", "376": "IL", "392": "JP", "400": "JO", "398": "KZ", "414": "KW", "417": "KG",
    "418": "LA", "422": "LB", "446": "MO", "458": "MY", "462": "MV", "496": "MN", "104": "MM",
    "524": "NP", "408": "KP", "512": "OM", "586": "PK", "275": "PS", "608": "PH", "634": "QA",
    "682": "SA", "702": "SG", "410": "KR", "144": "LK", "760": "SY", "762": "TJ", "764": "TH",
    "626": "TL", "795": "TM", "784": "AE", "860": "UZ", "704": "VN", "887": "YE",
    "12": "DZ", "24": "AO", "204": "BJ", "72": "BW", "854": "BF", "108": "BI", "120": "CM",
    "132": "CV", "140": "CF", "148": "TD", "174": "KM", "178": "CG", "180": "CD", "262": "DJ",
    "818": "EG", "226": "GQ", "232": "ER", "748": "SZ", "231": "ET", "266": "GA", "270": "GM",
    "288": "GH", "324": "GN", "624": "GW", "384": "CI", "404": "KE", "426": "LS", "430": "LR",
    "434": "LY", "450": "MG", "454": "MW", "466": "ML", "478": "MR", "480": "MU", "504": "MA",
    "508": "MZ", "516": "NA", "562": "NE", "566": "NG", "646": "RW", "678": "ST", "686": "SN",
    "690": "SC", "694": "SL", "706": "SO", "710": "ZA", "728": "SS", "729": "SD", "834": "TZ",
    "768": "TG", "788": "TN", "800": "UG", "894": "ZM", "716": "ZW",
    "36": "AU", "242": "FJ", "296": "KI", "584": "MH", "583": "FM", "520": "NR", "554": "NZ",
    "585": "PW", "598": "PG", "882": "WS", "90": "SB", "776": "TO", "798": "TV", "548": "VU",
};

const GlobeMap = ({ visitedCountries, toggleVisited, userPassportCode, heldVisas = [], onCountryClick }: GlobeMapProps) => {
    const mapContainer = useRef<HTMLDivElement>(null);
    const map = useRef<mapboxgl.Map | null>(null);
    const [viewMode, setViewMode] = useState<'visited' | 'visa'>('visited');
    const [showHint, setShowHint] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setShowHint(false), 2500); // 1.5s visible + 1s fade start
        return () => clearTimeout(timer);
    }, []);

    // Color Calculation Function (Keep this logic separate for reuse)
    const getCountryColor = (iso2: string) => {
        if (!iso2) return "rgba(60, 60, 60, 0.3)";

        if (viewMode === 'visited') {
            if (visitedCountries.includes(iso2)) {
                return "#ffffff"; // White for visited
            }
            return "#4a4a4a"; // Dark Gray for unvisited
        }

        if (userPassportCode) {
            if (userPassportCode === iso2) {
                return "#ffffff"; // Home Country
            }
            let visaInfo = getVisaRequirementFromMatrix(userPassportCode, iso2);

            // Check Access (including Held Visas)
            let isAccessGranted = false;
            let accessColor = "#ef4444"; // Red (Visa Required)

            if (visaInfo) {
                switch (visaInfo.requirement) {
                    case 'visa-free':
                        isAccessGranted = true;
                        accessColor = "#22c55e"; // Green
                        break;
                    case 'visa-on-arrival':
                        isAccessGranted = true;
                        accessColor = "#84cc16"; // Lime
                        break;
                    case 'e-visa':
                        isAccessGranted = true;
                        accessColor = "#eab308"; // Yellow
                        break;
                    case 'eta':
                        isAccessGranted = true;
                        accessColor = "#f97316"; // Orange
                        break;
                    case 'visa-required':
                        isAccessGranted = false;
                        accessColor = "#ef4444"; // Red
                        break;
                }
            }

            // Held Visa Logic
            if ((!visaInfo || visaInfo.requirement === 'visa-required') && heldVisas && heldVisas.length > 0) {
                if (heldVisas.includes(iso2)) {
                    // Direct unlock
                    isAccessGranted = true;
                    accessColor = "#22c55e";
                } else {
                    // Substitution check
                    const powerGroups = getVisaPowerGroups(heldVisas);
                    const hasAccess = powerGroups.some(group => VISA_SUBSTITUTIONS[group]?.includes(iso2));
                    if (hasAccess) {
                        isAccessGranted = true;
                        accessColor = "#22c55e";
                    }
                }
            }

            return accessColor;
        }
        return "#4a4a4a";
    };

    // Initialize Map
    useEffect(() => {
        if (map.current) return; // Initialize only once
        if (!mapContainer.current) return;

        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/dark-v11',
            projection: 'globe',
            zoom: 1.5,
            center: [30, 15],
            attributionControl: false
        });

        const mapInstance = map.current;

        mapInstance.on('style.load', () => {
            // Atmosphere - Reduced intensity to remove "shadow" look
            mapInstance.setFog({
                color: 'rgb(20, 20, 20)', // Lower atmosphere
                'high-color': 'rgb(0, 0, 0)', // Upper atmosphere
                'horizon-blend': 0.0, // Remove horizon blend to reduce shadow
                'space-color': 'rgb(0, 0, 0)', // Background color
                'star-intensity': 0.0 // Remove starts/noise
            });
        });

        mapInstance.on('load', () => {
            // ... existing code ...

            // Add Kosovo Marker (Since geometry is missing in 110m)
            const kosovoLngLat: [number, number] = [20.9667, 42.6667];

            // Invisible clickable circle for Kosovo
            mapInstance.addSource('kosovo-point', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: [{
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: kosovoLngLat
                        },
                        properties: {
                            iso2: 'XK',
                            name: 'Kosovo'
                        }
                    }]
                }
            });

            mapInstance.addLayer({
                id: 'kosovo-fill',
                type: 'circle',
                source: 'kosovo-point',
                paint: {
                    'circle-radius': 10,
                    'circle-color': getCountryColor('XK'), // Use dynamic color
                    'circle-opacity': 0.8,
                    'circle-stroke-width': 1,
                    'circle-stroke-color': 'rgba(255,255,255,0.2)'
                }
            });

            // Click Interaction for Kosovo
            mapInstance.on('click', 'kosovo-fill', (e) => {
                if (onCountryClick) {
                    onCountryClick('XK');
                } else if (toggleVisited) {
                    toggleVisited('XK');
                }
            });

            // Hover Cursor for Kosovo
            mapInstance.on('mouseenter', 'kosovo-fill', () => {
                mapInstance.getCanvas().style.cursor = 'pointer';
            });
            mapInstance.on('mouseleave', 'kosovo-fill', () => {
                mapInstance.getCanvas().style.cursor = '';
            });

            // Load GeoJSON
            // @ts-ignore
            const geojson = topojson.feature(worldData, worldData.objects.countries);

            // Enhance GeoJSON with ISO2 codes
            // @ts-ignore
            geojson.features.forEach((feature: any) => {
                const id = feature.id as string;
                if (numericToIso2[id]) {
                    feature.properties.iso2 = numericToIso2[id];
                } else {
                    // Fallback using names if possible (omitted for brevity/perf, sticking to ID map)
                }
            });

            mapInstance.addSource('world', {
                type: 'geojson',
                data: geojson as any
            });

            // Add Fill Layer
            mapInstance.addLayer({
                id: 'countries-fill',
                type: 'fill',
                source: 'world',
                paint: {
                    'fill-color': '#4a4a4a', // Init color, will be updated by useEffect
                    'fill-opacity': 0.8
                }
            });

            // Add Border Layer
            mapInstance.addLayer({
                id: 'countries-border',
                type: 'line',
                source: 'world',
                paint: {
                    'line-color': 'rgba(255,255,255,0.2)',
                    'line-width': 0.5
                }
            });

            // Click Interaction
            mapInstance.on('click', 'countries-fill', (e) => {
                const feature = e.features?.[0];
                if (feature && feature.properties?.iso2) {
                    const iso2 = feature.properties.iso2;
                    if (onCountryClick) {
                        onCountryClick(iso2);
                    } else if (toggleVisited) {
                        toggleVisited(iso2);
                    }
                }
            });

            // Hover Cursor
            mapInstance.on('mouseenter', 'countries-fill', () => {
                mapInstance.getCanvas().style.cursor = 'pointer';
            });
            mapInstance.on('mouseleave', 'countries-fill', () => {
                mapInstance.getCanvas().style.cursor = '';
            });
        });

    }, [onCountryClick, toggleVisited]);

    // Update Colors when data changes
    useEffect(() => {
        const mapInstance = map.current;
        if (!mapInstance) return;

        const updatePaint = () => {
            if (!mapInstance.getLayer('countries-fill')) return;

            const matchExpression: any[] = ['match', ['get', 'iso2']];

            // Build expression for ALL countries (to ensure coverage)
            // Or just iterate numericToIso2 keys
            const uniqueIso2 = new Set<string>();
            Object.values(numericToIso2).forEach(iso => uniqueIso2.add(iso));

            // Also check `countries` list to be safe if numeric map misses some
            countries.forEach(c => uniqueIso2.add(c.code));

            uniqueIso2.forEach(iso2 => {
                const color = getCountryColor(iso2);
                matchExpression.push(iso2);
                matchExpression.push(color);
            });

            // Default fallback
            matchExpression.push('rgba(60,60,60,0.3)');

            mapInstance.setPaintProperty('countries-fill', 'fill-color', matchExpression as any);

            // Update Kosovo Color explicitly
            if (mapInstance.getLayer('kosovo-fill')) {
                const kosovoColor = getCountryColor('XK');
                mapInstance.setPaintProperty('kosovo-fill', 'circle-color', kosovoColor);
            }
        };

        if (mapInstance.isStyleLoaded()) {
            updatePaint();
        } else {
            mapInstance.once('render', updatePaint); // Wait for style or data
        }

    }, [visitedCountries, viewMode, userPassportCode, heldVisas]); // Trigger re-paint

    const handleZoomIn = () => {
        map.current?.zoomIn();
    };

    const handleZoomOut = () => {
        map.current?.zoomOut();
    };

    return (
        <div className="w-full h-full relative bg-black">
            <div ref={mapContainer} className="w-full h-full" />

            {/* View Mode Toggle Buttons - Top */}
            <div className="absolute top-14 left-0 right-0 flex justify-center z-[10] pointer-events-none" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
                <div className="bg-black/60 backdrop-blur-md p-1 rounded-xl flex gap-1 border border-white/10 pointer-events-auto">
                    <button
                        onClick={(e) => { e.stopPropagation(); setViewMode('visited'); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'visited'
                            ? 'bg-white text-black shadow-lg'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <span className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Visited
                        </span>
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (userPassportCode) setViewMode('visa');
                        }}
                        disabled={!userPassportCode}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${viewMode === 'visa'
                            ? 'bg-[#D4AF37] text-black shadow-lg'
                            : 'text-white/60 hover:text-white hover:bg-white/5 disabled:opacity-30'
                            }`}
                    >
                        <span className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            Visa Power
                        </span>
                    </button>
                </div>
            </div>

            {/* Zoom Controls */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-[10] flex flex-col gap-2">
                <button
                    onClick={handleZoomIn}
                    className="w-10 h-10 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-white/10"
                >
                    <ZoomIn className="w-5 h-5" />
                </button>
                <button
                    onClick={handleZoomOut}
                    className="w-10 h-10 bg-black/60 backdrop-blur-md rounded-full border border-white/10 flex items-center justify-center text-white hover:bg-white/10"
                >
                    <ZoomOut className="w-5 h-5" />
                </button>
            </div>

            {/* Instructions */}
            <div className={`absolute bottom-36 left-0 right-0 flex justify-center pointer-events-none transition-opacity duration-1000 ${showHint ? 'opacity-100' : 'opacity-0'}`}>
                <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                    <p className="text-white/60 text-sm">Drag to rotate • Pinch to zoom • Tap for details</p>
                </div>
            </div>
        </div>
    );
};

export default GlobeMap;
